const User = require('../models/User');
const Attendance = require('../models/Attendance');
const Transaction = require('../models/Transaction');
const Project = require('../models/Project');
const Payroll = require('../models/Payroll');
// GET all workers
exports.getWorkers = async (req, res) => {
  try {
    const workers = await User.find({ role: 'worker' }).sort({ createdAt: -1 });
    res.json(workers);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// CREATE a worker
exports.createWorker = async (req, res) => {
  try {
    const { name, username, password, dailySalary, phone, poste } = req.body;
    
    // Check if username exists
    const exists = await User.findOne({ username });
    if (exists) return res.status(400).json({ message: "Ce nom d'utilisateur existe déjà" });

    const worker = new User({
      name, username, password, dailySalary, phone, poste, role: 'worker'
    });

    await worker.save();
    res.status(201).json(worker);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
};

// DELETE worker
exports.deleteWorker = async (req, res) => {
  try {
    await User.findByIdAndDelete(req.params.id);
    res.json({ message: "Ouvrier supprimé" });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// UPDATE worker
exports.updateWorker = async (req, res) => {
  try {
    const { name, dailySalary, phone, poste, password } = req.body;
    const worker = await User.findById(req.params.id);

    if (!worker) return res.status(404).json({ message: "Ouvrier introuvable" });

    worker.name = name || worker.name;
    worker.dailySalary = dailySalary || worker.dailySalary;
    worker.phone = phone || worker.phone;
    worker.poste = poste || worker.poste;
    
    // Only update password if a new one is provided
    if (password) worker.password = password;

    const updatedWorker = await worker.save();
    res.json(updatedWorker);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
};



exports.getWorkerProfile = async (req, res) => {
  const { id } = req.params;
  const { year, month } = req.query; // Période sélectionnée
  
  // Calendar month logic
  const start = new Date(Date.UTC(year, month - 1, 1)).toISOString().split('T')[0];
  const end = new Date(Date.UTC(year, month, 0)).toISOString().split('T')[0];

  try {
    const worker = await User.findById(id);
    if (!worker) return res.status(404).json({ message: "Ouvrier non trouvé" });

    // 1. Attendance for selected period
    const attendance = await Attendance.find({ workerId: id, date: { $gte: start, $lte: end } });

    // 2. Transactions (Advances/Salaries)
    const transactions = await Transaction.find({ workerId: id }).sort({ date: -1 });

    // 3. Tasks assigned to this worker (from all projects)
    const projects = await Project.find({ "items.assignedWorker": id });
    const tasks = [];
    projects.forEach(p => {
      p.items.forEach(item => {
        if (item.assignedWorker?.toString() === id) {
          tasks.push({ ...item._doc, projectName: p.projectName });
        }
      });
    });

    // 4. Lifetime Discipline Score (Attendance vs possible days)
    const totalRecords = await Attendance.countDocuments({ workerId: id });
    const presentRecords = await Attendance.countDocuments({ workerId: id, status: { $in: ['full', 'half'] } });
    const disciplineScore = totalRecords > 0 ? Math.round((presentRecords / totalRecords) * 100) : 100;

    res.json({ worker, attendance, transactions, tasks, disciplineScore });
  } catch (err) { res.status(500).json(err); }
};





exports.getMyStats = async (req, res) => {
  const workerId = req.user.id;
  // Force conversion to numbers to avoid "String vs Number" bugs in MongoDB
  const year = Number(req.query.year);
  const month = Number(req.query.month);

  // 1. Calculate Cycle Range (Calendar month)
  const startDate = new Date(Date.UTC(year, month - 1, 1));
  const endDate = new Date(Date.UTC(year, month, 0));
  
  const startStr = startDate.toISOString().split('T')[0];
  const endStr = endDate.toISOString().split('T')[0];

  try {
    // 2. Get Attendance for this specific period
    const attendance = await Attendance.find({ 
      workerId, 
      date: { $gte: startStr, $lte: endStr } 
    }).sort({ date: 1 });

    // 3. Check if this specific month/year was paid
    const isPaidRecord = await Payroll.findOne({ workerId, month, year });

    let totalAdvances = 0;
    const worker = await User.findById(workerId);
    let brut = 0;
    let net = 0;

    if (isPaidRecord) {
      // If paid, show what was actually deducted back then
      totalAdvances = isPaidRecord.advances;
      brut = isPaidRecord.brut !== undefined ? isPaidRecord.brut : (isPaidRecord.netAmount + isPaidRecord.advances);
      net = isPaidRecord.netAmount;
    } 
    else if (attendance.length > 0) {
      // If not paid but worked, show the GLOBAL unsettled debt
      const pendingAdvances = await Transaction.find({ 
        workerId, 
        category: 'Avance', 
        isSettled: false 
      });
      totalAdvances = pendingAdvances.reduce((s, t) => s + t.amount, 0);

      attendance.forEach(r => {
        const mult = r.status === 'full' ? 1 : r.status === 'half' ? 0.5 : 0;
        const b = r.displacement ? 0.5 : 0;
        const dailySal = worker.dailySalary || 0;
        brut += (dailySal * (mult + b));
      });
      net = brut - totalAdvances;
    } 
    else {
      totalAdvances = 0;
      brut = 0;
      net = 0;
    }

    const advancesList = await Transaction.find({ workerId, category: 'Avance' })
      .sort({ date: -1 })
      .limit(10);

    res.json({ 
      attendance, 
      totalAdvances, 
      brut,
      net,
      advancesList,
      isPaid: !!isPaidRecord,
      // Send period info for the UI label using UTC so dates don't shift
      period: {
          start: { m: startDate.getUTCMonth() + 1, y: startDate.getUTCFullYear() },
          end: { m: endDate.getUTCMonth() + 1, y: endDate.getUTCFullYear() }
      }
    });
  } catch (err) { 
    console.error(err);
    res.status(500).json({ message: "Erreur serveur" }); 
  }
};
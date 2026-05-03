const Attendance = require('../models/Attendance');
const Payroll = require('../models/Payroll');
const Transaction = require('../models/Transaction');
const User = require('../models/User');


// HELPER: Exact Calendar Month Range
const getCycleRange = (year, month) => {
  const start = new Date(Date.UTC(year, month - 1, 1));
  const end = new Date(Date.UTC(year, month, 0));
  return { 
    start: start.toISOString().split('T')[0], 
    end: end.toISOString().split('T')[0] 
  };
};
// --- 1. GET YEARS ---
exports.getAvailableYears = async (req, res) => {
  try {
    const dates = await Attendance.distinct('date');
    // Extract year from "YYYY-MM-DD" and remove duplicates
    const years = [...new Set(dates.map(d => d.split('-')[0]))].sort().reverse();
    
    // If no data, return current year
    res.json(years.length > 0 ? years : [new Date().getFullYear().toString()]);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// --- 2. GET MONTHLY REPORT ---
exports.getMonthlyReport = async (req, res) => {
  const { year, month } = req.query;
  const { start, end } = getCycleRange(year, month);

  try {
    const workers = await User.find({ role: 'worker' });
    const report = await Promise.all(workers.map(async (worker) => {
      // 1. Check if a payroll record already exists (Already Paid)
      const paidRecord = await Payroll.findOne({ workerId: worker._id, month, year });

      if (paidRecord) {
        const exactBrut = paidRecord.brut !== undefined ? paidRecord.brut : (paidRecord.netAmount + paidRecord.advances);
        return {
          _id: worker._id, name: worker.name, poste: worker.poste,
          brut: exactBrut,
          advances: paidRecord.advances,
          net: paidRecord.netAmount,
          isPaid: true,
          stats: { full: paidRecord.totalDays, half: 0, bonus: paidRecord.totalBonus }
        };
      }

      // 2. If NOT paid, calculate live
      const records = await Attendance.find({ workerId: worker._id, date: { $gte: start, $lte: end } });
      let brut = 0; let full = 0; let half = 0; let bonus = 0;

      records.forEach(r => {
        const mult = r.status === 'full' ? 1 : r.status === 'half' ? 0.5 : 0;
        const b = r.displacement ? 0.5 : 0;
        if(r.status === 'full') full++; if(r.status === 'half') half++; if(r.displacement) bonus++;
        brut += (worker.dailySalary * (mult + b));
      });

      const advances = await Transaction.find({ workerId: worker._id, category: 'Avance', isSettled: false });
      const totalAdv = advances.reduce((acc, curr) => acc + curr.amount, 0);

      return {
        _id: worker._id, name: worker.name, poste: worker.poste,
        stats: { full, half, bonus }, brut, advances: totalAdv, net: brut - totalAdv, isPaid: false
      };
    }));
    res.json(report);
  } catch (err) { res.status(500).json(err); }
};

exports.getSingleWorkerStats = async (req, res) => {
  const { workerId, year, month } = req.params;
  const { start, end } = getCycleRange(year, month);

  try {
    const paidRecord = await Payroll.findOne({ workerId, month, year });
    
    if (paidRecord) {
      const exactBrut = paidRecord.brut !== undefined ? paidRecord.brut : (paidRecord.netAmount + paidRecord.advances);
      return res.json({
        brut: exactBrut,
        advances: paidRecord.advances,
        net: paidRecord.netAmount,
        isPaid: true
      });
    }

    const worker = await User.findById(workerId);
    const records = await Attendance.find({ workerId, date: { $gte: start, $lte: end } });
    const advances = await Transaction.find({ workerId, category: 'Avance', isSettled: false });

    let brut = 0;
    records.forEach(r => {
      const mult = r.status === 'full' ? 1 : r.status === 'half' ? 0.5 : 0;
      brut += (worker.dailySalary * (mult + (r.displacement ? 0.5 : 0)));
    });

    const totalAdv = advances.reduce((acc, curr) => acc + curr.amount, 0);
    res.json({ brut, advances: totalAdv, net: brut - totalAdv, isPaid: false });
  } catch (err) { res.status(500).json(err); }
};

// --- 3. CONFIRM PAYMENT ---
exports.confirmPayment = async (req, res) => {
  const { workerId, month, year, netAmount, brut, advances, workerName } = req.body;

  try {
    // 1. Mark all current UNSETTLED advances as settled (Because we are processing them now)
    await Transaction.updateMany(
      { workerId: workerId, category: 'Avance', isSettled: false },
      { $set: { isSettled: true } }
    );

    if (netAmount < 0) {
      // ── CASE: NEGATIVE BALANCE (DEBT REPORT) ──
      const carriedDebt = Math.abs(netAmount);

      // A. Create a NEW advance transaction for the worker (This will show up in the next month)
      const reportTransaction = new Transaction({
        type: 'minus',
        category: 'Avance',
        amount: carriedDebt,
        workerId: workerId,
        isSettled: false, // <── Important: This stays open for next month
        description: `Report de dette - ${workerName} (Solde négatif mois ${month}/${year})`
      });
      await reportTransaction.save();

      // B. Save the Payroll record for THIS month with 0 DH paid
      const payroll = new Payroll({
        workerId, month, year,
        totalDays: req.body.totalDays,
        totalBonus: req.body.totalBonus,
        brut: brut, // <── Save exactly what the brut was
        advances: advances, // Records the full advance processed
        netAmount: 0 // <── Manager gave 0 DH cash
      });
      await payroll.save();

      res.json({ message: `Dette de ${carriedDebt} DH reportée au mois prochain.` });

    } else {
      // ── CASE: POSITIVE BALANCE (NORMAL PAY) ──
      const payroll = new Payroll({
        ...req.body,
        brut: brut // Explicitly ensure brut is saved
      });
      await payroll.save();

      // Create a Salary transaction (Minus) to show cash leaving the shop
      const payout = new Transaction({
        type: 'minus',
        category: 'Salaire',
        amount: netAmount,
        workerId: workerId,
        isSettled: true,
        description: `Paiement Salaire ${month}/${year} - ${workerName}`
      });
      await payout.save();

      res.json({ message: "Salaire versé avec succès !" });
    }
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// --- 4. MONTH DETAILS (Calendar) ---
exports.getWorkerMonthDetails = async (req, res) => {
  const { workerId, year, month } = req.params;
  
  // Calculate Start: 1st of the Month
  const startDate = new Date(Date.UTC(year, month - 1, 1)).toISOString().split('T')[0];
  // Calculate End: Last day of the Month
  const endDate = new Date(Date.UTC(year, month, 0)).toISOString().split('T')[0];

  try {
    const records = await Attendance.find({
      workerId,
      date: { $gte: startDate, $lte: endDate }
    }).sort({ date: 1 });
    res.json(records);
  } catch (err) { res.status(500).json(err); }
};
exports.getWorkerSalaryHistory = async (req, res) => {
  const { workerId } = req.params;
  try {
    // Get last 6 months from the Payroll archive
    const history = await Payroll.find({ workerId })
      .sort({ year: -1, month: -1 })
      .limit(6);
    
    // Reverse it to show chronological order (Jan -> June)
    res.json(history.reverse()); 
  } catch (err) { res.status(500).json(err); }
};
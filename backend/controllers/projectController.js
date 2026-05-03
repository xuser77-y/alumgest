const Project = require('../models/Project');
const Transaction = require('../models/Transaction');

exports.getProjectExpenses = async (req, res) => {
  try {
    const expenses = await Transaction.find({ projectId: req.params.id, type: 'minus' }).sort({ date: -1, _id: -1 });
    res.json(expenses);
  } catch (err) { res.status(500).json(err); }
};

exports.getProjects = async (req, res) => {
  try {
    const { status } = req.query;
    const projects = await Project.find({ status }).populate('client').sort({ createdAt: -1 });
    res.json(projects);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

exports.getProjectById = async (req, res) => {
  try {
    const project = await Project.findById(req.params.id).populate('client');
    if (!project) return res.status(404).json({ message: "Projet non trouvé" });
    res.json(project);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

exports.createProject = async (req, res) => {
  try {
    const newProject = new Project(req.body);
    const savedProject = await newProject.save();

    if (newProject.advancePayment > 0) {
      const initialTransaction = new Transaction({
        type: 'plus',
        category: 'Revenus',
        amount: newProject.advancePayment,
        description: `Avance initiale : ${newProject.projectName}`,
        projectId: savedProject._id,
        isSettled: true
      });
      await initialTransaction.save();
    }

    res.status(201).json(savedProject);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
};

exports.updateProject = async (req, res) => {
  try {
    const updated = await Project.findByIdAndUpdate(req.params.id, req.body, { new: true });
    res.json(updated);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
};

exports.deleteProject = async (req, res) => {
  try {
    await Project.findByIdAndDelete(req.params.id);
    await Transaction.deleteMany({ projectId: req.params.id });
    res.json({ message: "Projet supprimé" });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};


exports.addTaskToProject = async (req, res) => {
  try {
    const project = await Project.findById(req.params.id);
    const item = {
        ...req.body,
        totalPrice: Number(req.body.quantity) * Number(req.body.unitPrice)
    };
    project.items.push(item);
    await project.save();
    res.json(project);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
}

exports.updateTaskStatus = async (req, res) => {
  try {
    const project = await Project.findOneAndUpdate(
      { _id: req.params.projectId, "items._id": req.params.taskId },
      { $set: { "items.$.status": req.body.status } },
      { new: true }
    );
    res.json(project);
  } catch (err) { res.status(400).json(err); }
};

exports.updateTaskFull = async (req, res) => {
  try {
    const { projectId, taskId } = req.params;
    const updateData = {
        ...req.body,
        totalPrice: Number(req.body.quantity) * Number(req.body.unitPrice)
    };
    const project = await Project.findOneAndUpdate(
      { _id: projectId, "items._id": taskId },
      { $set: { "items.$": updateData } },
      { new: true }
    );
    res.json(project);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
};

exports.deleteTask = async (req, res) => {
  try {
    const project = await Project.findById(req.params.projectId);
    project.items.pull(req.params.taskId);
    await project.save();
    res.json(project);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
};


exports.completeProject = async (req, res) => {
  const { finalSpent } = req.body; 
  try {
    const project = await Project.findById(req.params.id);
    if (!project) return res.status(404).json({ message: "Projet non trouvé" });

    project.status = 'completed';
    project.finalSpent = Number(finalSpent); 
    project.finishedAt = new Date(); // <── SET FINISHED DATE
    await project.save();
    res.json({ message: "Chantier clôturé avec succès !", project });
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
};


// GET only tasks assigned to the logged-in worker
exports.getWorkerTasks = async (req, res) => {
  try {
    const workerId = req.user.id; // From the JWT token
    const projects = await Project.find({ "items.assignedWorker": workerId, status: 'active' });
    
    // Flatten the items to only show what belongs to this worker and is NOT finished
    let myTasks = [];
    projects.forEach(p => {
      p.items.forEach(item => {
        if (item.assignedWorker?.toString() === workerId && item.status !== 'finished') {
          myTasks.push({ ...item._doc, projectName: p.projectName, projectId: p._id });
        }
      });
    });

    res.json(myTasks);
  } catch (err) { res.status(500).json(err); }
};

exports.finishAllTasks = async (req, res) => {
  try {
    await Project.updateOne(
      { _id: req.params.id },
      { $set: { "items.$[].status": "finished", "items.$[].completionDate": new Date() } }
    );
    const updated = await Project.findById(req.params.id).populate('client');
    res.json(updated);
  } catch (err) { res.status(400).json({ message: err.message }); }
};
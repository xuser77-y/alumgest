const Transaction = require('../models/Transaction');
const bcrypt = require('bcryptjs');
const User = require('../models/User');
const Project = require('../models/Project');
const Client = require('../models/Client');
const Attendance = require('../models/Attendance');
const Payroll = require('../models/Payroll');
const Category = require('../models/Category');
const Catalog = require('../models/Catalog');
const PortfolioProject = require('../models/PortfolioProject'); 
// 1. Get Stats for Hero
exports.getManagerStats = async (req, res) => {
  try {
    const workers = await User.find({ role: 'worker' }).select('name _id');
    const transactions = await Transaction.find({});
    const totalIn = transactions.filter(t => t.type === 'plus').reduce((s, t) => s + t.amount, 0);
    const totalOut = transactions.filter(t => t.type === 'minus').reduce((s, t) => s + t.amount, 0);

    res.json({
      workersCount: workers.length,
      liquidCash: totalIn - totalOut,
      workerList: workers // Send list for the dropdown
    });
  } catch (err) { res.status(500).json({ message: err.message }); }
};

// 2. Manager Updates Own Password (OLD PASSWORD REQUIRED)
exports.updateOwnPassword = async (req, res) => {
  const { oldPassword, newPassword } = req.body;
  try {
    const user = await User.findById(req.user.id);
    const isMatch = await bcrypt.compare(oldPassword, user.password);
    if (!isMatch) return res.status(401).json({ message: "Ancien mot de passe incorrect" });

    user.password = newPassword;
    await user.save();
    res.json({ message: "Mot de passe mis à jour !" });
  } catch (err) { res.status(400).json({ message: err.message }); }
};

// 3. Manager Resets Worker Password (BYBOSS - NO OLD PASS REQUIRED)
exports.resetWorkerPassword = async (req, res) => {
  const { workerId, newPassword } = req.body;
  try {
    const worker = await User.findById(workerId);
    if (!worker) return res.status(404).json({ message: "Ouvrier introuvable" });

    worker.password = newPassword;
    await worker.save();
    res.json({ message: `Accès de ${worker.name} réinitialisé !` });
  } catch (err) { res.status(400).json({ message: err.message }); }
};







exports.exportBackupSecure = async (req, res) => {
  const { password } = req.body; // Le mot de passe envoyé par le modal

  try {
    const user = await User.findById(req.user.id);
    
    // 1. Vérifier le mot de passe
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) return res.status(401).json({ message: "Accès refusé : Mot de passe incorrect" });

    // 2. Extraire toutes les données
    const [users, clients, projects, attendances, transactions, categories, payrolls, portfolio] = await Promise.all([
      User.find({}), Client.find({}), Project.find({}), Attendance.find({}),
      Transaction.find({}), Category.find({}), Payroll.find({}), PortfolioProject.find({})
    ]);

    // 3. Formatage pour Compass (Un objet avec des tableaux propres)
    const backupData = {
      exported_at: new Date().toISOString(),
      database: "AlumGest_GilJakan",
      data: {
        users,
        clients,
        projects,
        attendances,
        transactions,
        categories,
        payrolls,
        portfolio
      }
    };

    res.json(backupData);
  } catch (err) {
    res.status(500).json({ message: "Erreur serveur lors de l'export" });
  }
};
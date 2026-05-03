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
const Fournisseur = require('../models/Fournisseur');
const FournisseurHistory = require('../models/FournisseurHistory');
const Debt = require('../models/Debt');

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
      workerList: workers 
    });
  } catch (err) { res.status(500).json({ message: err.message }); }
};

// 2. Manager Updates Own Password
exports.updateOwnPassword = async (req, res) => {
  const { oldPassword, newPassword } = req.body;
  try {
    const user = await User.findById(req.user.id);
    if (!user) return res.status(404).json({ message: "Utilisateur non trouvé" });
    
    const isMatch = await bcrypt.compare(oldPassword, user.password);
    if (!isMatch) return res.status(401).json({ message: "Ancien mot de passe incorrect" });

    user.password = newPassword;
    await user.save();
    res.json({ message: "Mot de passe mis à jour !" });
  } catch (err) { res.status(400).json({ message: err.message }); }
};

// 3. Manager Resets Worker Password
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

// 4. Secure Database Export
exports.exportBackupSecure = async (req, res) => {
  const { password } = req.body;

  try {
    const user = await User.findById(req.user.id);
    if (!user) return res.status(404).json({ message: "Utilisateur non trouvé" });
    
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) return res.status(401).json({ message: "Accès refusé : Mot de passe incorrect" });

    const data = {};
    const models = {
      users: User,
      clients: Client,
      projects: Project,
      attendances: Attendance,
      transactions: Transaction,
      categories: Category,
      payrolls: Payroll,
      portfolio: PortfolioProject,
      catalog: Catalog,
      fournisseurs: Fournisseur,
      fournisseurHistories: FournisseurHistory,
      debts: Debt
    };

    for (const [key, model] of Object.entries(models)) {
        try {
            if (model && typeof model.find === 'function') {
                data[key] = await model.find({});
            } else {
                data[key] = [];
            }
        } catch (mErr) {
            data[key] = []; 
        }
    }

    const backupData = {
      exported_at: new Date().toISOString(),
      database: "AlumGest_GilJakan_FULL",
      data: data
    };

    res.json(backupData);
  } catch (err) {
    res.status(500).json({ message: "Erreur serveur lors de l'export" });
  }
};
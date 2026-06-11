const Transaction = require('../models/Transaction');
const bcrypt = require('bcryptjs');
const User = require('../models/User');
const Payroll = require('../models/Payroll');
const Fournisseur = require('../models/Fournisseur');
const FournisseurHistory = require('../models/FournisseurHistory');
const Debt = require('../models/Debt');

exports.createTransaction = async (req, res) => {
  try {
    const transaction = new Transaction({
        ...req.body,
        workerId: req.body.workerId || null 
    });
    await transaction.save();
    res.status(201).json(transaction);
  } catch (err) { res.status(400).json(err); }
};

exports.getTransactions = async (req, res) => {
  try {
    const { type, category, year, month, projectId, search } = req.query;
    let query = {};

    if (projectId) query.projectId = projectId;
    if (type && type !== '') query.type = type;
    
    if (category && category !== '') {
      query.category = { $regex: `^${category}$`, $options: 'i' };
    }

    if (search && search !== '') {
      query.$or = [
        { description: { $regex: search, $options: 'i' } },
        { $expr: { $regexMatch: { input: { $toString: "$amount" }, regex: search, options: "i" } } }
      ];
    }

    if (year && year !== 'all') {
      let startDate, endDate;
      if (month && month !== 'all') {
        startDate = new Date(year, month - 1, 1);
        endDate = new Date(year, month, 0, 23, 59, 59, 999);
      } else {
        startDate = new Date(`${year}-01-01`);
        endDate = new Date(`${year}-12-31T23:59:59.999Z`);
      }
      query.date = { $gte: startDate, $lte: endDate };
    }

    const transactions = await Transaction.find(query).sort({ date: -1, _id: -1 });
    res.json(transactions);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

exports.getUniqueCategories = async (req, res) => {
  try {
    const categories = await Transaction.distinct('category');
    res.json(categories);
  } catch (err) { res.status(500).json(err); }
};

exports.updateTransaction = async (req, res) => {
  try {
    const { id } = req.params;
    const oldTransaction = await Transaction.findById(id);
    if (!oldTransaction) return res.status(404).json({ message: "Transaction non trouvée" });

    const transaction = await Transaction.findByIdAndUpdate(id, req.body, { new: true });
    
    if (transaction.category === 'Salaire' && transaction.workerId) {
       const month = new Date(transaction.date).getMonth() + 1;
       const year = new Date(transaction.date).getFullYear();
       await Payroll.findOneAndUpdate(
         { workerId: transaction.workerId, month, year },
         { netAmount: transaction.amount }
       );
    }

    let fId = oldTransaction.fournisseurId;
    if (fId) {
      const f = await Fournisseur.findById(fId);
      if (f) {
        f.totalPaid = f.totalPaid - oldTransaction.amount + Number(req.body.amount || oldTransaction.amount);
        await f.save();
        if (oldTransaction.historyId) {
            await FournisseurHistory.findByIdAndUpdate(oldTransaction.historyId, { 
                amount: Number(req.body.amount || oldTransaction.amount), 
                description: req.body.description || oldTransaction.description 
            });
        }
      }
    }

    if (oldTransaction.historyId && oldTransaction.category === 'Revenus') {
        const debt = await Debt.findOne({ "payments._id": oldTransaction.historyId });
        if (debt) {
            const payment = debt.payments.id(oldTransaction.historyId);
            if (payment) {
                payment.amount = Number(req.body.amount || oldTransaction.amount);
                payment.note = req.body.description || oldTransaction.description;
                const totalPaid = debt.payments.reduce((sum, p) => sum + p.amount, 0);
                debt.status = totalPaid >= debt.totalAmount ? 'paid' : 'pending';
                await debt.save();
            }
        }
    }
    
    res.json(transaction);
  } catch (err) { res.status(400).json(err); }
};

exports.deleteTransaction = async (req, res) => {
  const { password } = req.body;
  try {
    const { id } = req.params;

    // 0. VERIFY ADMIN PASSWORD
    const user = await User.findById(req.user.id);
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) return res.status(401).json({ message: "Action refusée : Mot de passe incorrect" });

    const transaction = await Transaction.findById(id);
    if (!transaction) return res.status(404).json({ message: "Transaction non trouvée" });

    if (transaction.category === 'Salaire' && transaction.workerId) {
       const date = new Date(transaction.date);
       const month = date.getMonth() + 1;
       const year = date.getFullYear();
       await Payroll.findOneAndDelete({ workerId: transaction.workerId, month, year });
    }

    let fId = transaction.fournisseurId;
    if (fId) {
      const f = await Fournisseur.findById(fId);
      if (f) {
        f.totalPaid -= transaction.amount;
        await f.save();
        if (transaction.historyId) {
            await FournisseurHistory.findByIdAndDelete(transaction.historyId);
        }
      }
    }

    if (transaction.historyId && transaction.category === 'Revenus') {
        const debt = await Debt.findOne({ "payments._id": transaction.historyId });
        if (debt) {
            debt.payments.pull(transaction.historyId);
            const totalPaid = debt.payments.reduce((sum, p) => sum + p.amount, 0);
            debt.status = totalPaid >= debt.totalAmount ? 'paid' : 'pending';
            await debt.save();
        }
    }

    await Transaction.findByIdAndDelete(id);
    res.json({ message: "Transaction supprimée avec succès" });
  } catch (err) { 
    res.status(500).json({ message: err.message }); 
  }
};

exports.getAvailableYears = async (req, res) => {
  try {
    const transactions = await Transaction.find({}, 'date');
    const years = [...new Set(transactions.map(t => new Date(t.date).getFullYear().toString()))].sort().reverse();
    res.json(years.length > 0 ? years : [new Date().getFullYear().toString()]);
  } catch (err) { res.status(500).json(err); }
};
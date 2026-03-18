const Transaction = require('../models/Transaction');

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
    const { type, category, year, month, projectId, search } = req.query; // ── ADD search
    let query = {};

    if (projectId) query.projectId = projectId;
    if (type && type !== '') query.type = type;
    
    if (category && category !== '') {
      query.category = { $regex: `^${category}$`, $options: 'i' };
    }

    // ── NEW: SEARCH BY NAME/DESCRIPTION ──
    if (search && search !== '') {
      query.description = { $regex: search, $options: 'i' };
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

    const transactions = await Transaction.find(query).sort({ date: -1 });
    res.json(transactions);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};
// ── GET UNIQUE CATEGORIES FROM REAL DATA ──
exports.getUniqueCategories = async (req, res) => {
  try {
    const categories = await Transaction.distinct('category');
    res.json(categories);
  } catch (err) { res.status(500).json(err); }
};

// ── GET UNIQUE YEARS FROM REAL DATA ──
exports.getAvailableYears = async (req, res) => {
  try {
    const transactions = await Transaction.find({}, 'date');
    const years = [...new Set(transactions.map(t => new Date(t.date).getFullYear().toString()))].sort().reverse();
    res.json(years.length > 0 ? years : [new Date().getFullYear().toString()]);
  } catch (err) { res.status(500).json(err); }
};
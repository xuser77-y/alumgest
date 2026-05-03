const Debt = require('../models/Debt');
const Transaction = require('../models/Transaction');

// 1. GET ALL DEBTS
exports.getDebts = async (req, res) => {
  try {
    const debts = await Debt.find().populate('client').sort({ createdAt: -1 });
    res.json(debts);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// 2. CREATE DEBT
exports.createDebt = async (req, res) => {
  try {
    const newDebt = new Debt(req.body);
    await newDebt.save();
    res.status(201).json(newDebt);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
};

// 3. ADD PAYMENT
exports.addPayment = async (req, res) => {
  try {
    const { amount, note, date } = req.body;
    const debt = await Debt.findById(req.params.id).populate('client');
    if (!debt) return res.status(404).json({ message: "Dette non trouvée" });

    const numericAmount = Number(amount);
    debt.payments.push({ amount: numericAmount, note, date: date || new Date() });
    
    // Check if fully paid
    const totalPaid = debt.payments.reduce((sum, p) => sum + p.amount, 0);
    if (totalPaid >= debt.totalAmount) {
      debt.status = 'paid';
    }

    await debt.save();

    // Record in Global Finances (Transaction)
    const lastPayment = debt.payments[debt.payments.length - 1];
    const transaction = new Transaction({
      type: 'plus',
      category: 'Revenus',
      amount: numericAmount,
      description: `Recouvrement dette : ${debt.client?.name || 'Client'} ${note ? '('+note+')' : ''}`,
      date: date || new Date(),
      clientId: debt.client?._id,
      historyId: lastPayment._id, // LINK TO SPECIFIC PAYMENT
      isSettled: true
    });
    await transaction.save();

    res.json(debt);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
};

// 4. UPDATE DEBT
exports.updateDebt = async (req, res) => {
  try {
    const debt = await Debt.findByIdAndUpdate(req.params.id, req.body, { new: true });
    res.json(debt);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
};

// 5. DELETE DEBT
exports.deleteDebt = async (req, res) => {
  try {
    await Debt.findByIdAndDelete(req.params.id);
    res.json({ message: "Dette supprimée" });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

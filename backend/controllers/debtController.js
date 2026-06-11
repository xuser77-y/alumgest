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
    
    // Check if totalPaid >= debt.totalAmount and update status
    const totalPaid = debt.payments.reduce((sum, p) => sum + p.amount, 0);
    debt.status = totalPaid >= debt.totalAmount ? 'paid' : 'pending';
    await debt.save();

    res.json(debt);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
};

// 5. DELETE DEBT
exports.deleteDebt = async (req, res) => {
  try {
    const debt = await Debt.findById(req.params.id);
    if (!debt) return res.status(404).json({ message: "Dette non trouvée" });

    // Delete all associated global transactions
    const paymentIds = debt.payments.map(p => p._id);
    if (paymentIds.length > 0) {
      await Transaction.deleteMany({ historyId: { $in: paymentIds } });
    }

    await Debt.findByIdAndDelete(req.params.id);
    res.json({ message: "Dette supprimée" });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// 6. UPDATE PAYMENT
exports.updatePayment = async (req, res) => {
  try {
    const { id, paymentId } = req.params;
    const { amount, note, date } = req.body;
    const numericAmount = Number(amount);

    const debt = await Debt.findById(id).populate('client');
    if (!debt) return res.status(404).json({ message: "Dette non trouvée" });

    const paymentIndex = debt.payments.findIndex(p => p._id.toString() === paymentId);
    if (paymentIndex === -1) return res.status(404).json({ message: "Paiement non trouvé" });

    // Update payment details
    debt.payments[paymentIndex].amount = numericAmount;
    debt.payments[paymentIndex].note = note;
    if (date) {
      debt.payments[paymentIndex].date = date;
    }

    // Check status
    const totalPaid = debt.payments.reduce((sum, p) => sum + p.amount, 0);
    debt.status = totalPaid >= debt.totalAmount ? 'paid' : 'pending';

    await debt.save();

    // Find and update the corresponding Transaction
    const transaction = await Transaction.findOne({ historyId: paymentId });
    if (transaction) {
      transaction.amount = numericAmount;
      transaction.description = `Recouvrement dette : ${debt.client?.name || 'Client'} ${note ? '('+note+')' : ''}`;
      if (date) {
        transaction.date = date;
      }
      await transaction.save();
    }

    res.json(debt);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
};

// 7. DELETE PAYMENT
exports.deletePayment = async (req, res) => {
  try {
    const { id, paymentId } = req.params;

    const debt = await Debt.findById(id);
    if (!debt) return res.status(404).json({ message: "Dette non trouvée" });

    // Remove the payment from payments array
    debt.payments = debt.payments.filter(p => p._id.toString() !== paymentId);

    // Recalculate status
    const totalPaid = debt.payments.reduce((sum, p) => sum + p.amount, 0);
    debt.status = totalPaid >= debt.totalAmount ? 'paid' : 'pending';

    await debt.save();

    // Delete corresponding transaction
    await Transaction.deleteOne({ historyId: paymentId });

    res.json(debt);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
};

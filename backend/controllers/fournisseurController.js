const Fournisseur = require('../models/Fournisseur');
const FournisseurHistory = require('../models/FournisseurHistory');
const Transaction = require('../models/Transaction');
const User = require('../models/User');
const bcrypt = require('bcryptjs');

exports.getFournisseurs = async (req, res) => {
  try {
    const fournisseurs = await Fournisseur.find().sort({ createdAt: -1 });
    res.json(fournisseurs);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

exports.getFournisseurById = async (req, res) => {
  try {
    const fournisseur = await Fournisseur.findById(req.params.id);
    if (!fournisseur) return res.status(404).json({ message: 'Fournisseur introuvable' });
    
    const history = await FournisseurHistory.find({ fournisseurId: req.params.id }).sort({ date: -1, _id: -1 });
    res.json({ fournisseur, history });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

exports.createFournisseur = async (req, res) => {
  try {
    const { name, phone, email, address } = req.body;
    const newFournisseur = new Fournisseur({ name, phone, email, address });
    await newFournisseur.save();
    res.status(201).json(newFournisseur);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

exports.updateFournisseur = async (req, res) => {
  try {
    const { name, phone, email, address } = req.body;
    const fournisseur = await Fournisseur.findByIdAndUpdate(req.params.id, { name, phone, email, address }, { new: true });
    if (!fournisseur) return res.status(404).json({ message: 'Fournisseur introuvable' });
    res.json(fournisseur);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

exports.deleteFournisseur = async (req, res) => {
  try {
    const fournisseur = await Fournisseur.findById(req.params.id);
    if (!fournisseur) return res.status(404).json({ message: 'Fournisseur introuvable' });
    
    // Also delete history
    await FournisseurHistory.deleteMany({ fournisseurId: req.params.id });
    await Fournisseur.findByIdAndDelete(req.params.id);
    res.json({ message: 'Fournisseur supprimé' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

exports.addPurchase = async (req, res) => {
  try {
    const { amount, description, date } = req.body;
    const fournisseur = await Fournisseur.findById(req.params.id);
    if (!fournisseur) return res.status(404).json({ message: 'Fournisseur introuvable' });

    const numericAmount = Number(amount);
    if (isNaN(numericAmount) || numericAmount <= 0) return res.status(400).json({ message: "Montant invalide" });

    // Create history record
    const history = new FournisseurHistory({
      fournisseurId: fournisseur._id,
      type: 'purchase',
      amount: numericAmount,
      description: description || 'Achat de marchandises',
      date: date ? new Date(date) : new Date()
    });
    await history.save();

    // Update fournisseur totals
    fournisseur.totalBought += numericAmount;
    await fournisseur.save();

    res.json(fournisseur);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

exports.addPayment = async (req, res) => {
  try {
    const { amount, description, date } = req.body;
    const fournisseur = await Fournisseur.findById(req.params.id);
    if (!fournisseur) return res.status(404).json({ message: 'Fournisseur introuvable' });

    const numericAmount = Number(amount);
    if (isNaN(numericAmount) || numericAmount <= 0) return res.status(400).json({ message: "Montant invalide" });

    // Create history record
    const history = new FournisseurHistory({
      fournisseurId: fournisseur._id,
      type: 'payment',
      amount: numericAmount,
      description: description || 'Paiement fournisseur',
      date: date ? new Date(date) : new Date()
    });
    await history.save();

    // Update fournisseur totals
    fournisseur.totalPaid += numericAmount;
    await fournisseur.save();

    // Record in Global Finances (Transaction)
    const transaction = new Transaction({
      type: 'minus',
      category: 'Fournisseur',
      amount: numericAmount,
      description: `Paiement fournisseur : ${fournisseur.name} ${description ? '('+description+')' : ''}`,
      date: date ? new Date(date) : new Date(),
      fournisseurId: fournisseur._id,
      historyId: history._id, // LINK TO HISTORY
      isSettled: true
    });
    await transaction.save();

    res.json(fournisseur);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

exports.addCheque = async (req, res) => {
  try {
    const { amount, description, date } = req.body;
    const fournisseur = await Fournisseur.findById(req.params.id);
    if (!fournisseur) return res.status(404).json({ message: 'Fournisseur introuvable' });

    const numericAmount = Number(amount);
    if (isNaN(numericAmount) || numericAmount <= 0) return res.status(400).json({ message: "Montant invalide" });

    // Create history record but do NOT add to totalPaid and do NOT create Transaction
    const history = new FournisseurHistory({
      fournisseurId: fournisseur._id,
      type: 'cheque',
      isPaid: false,
      amount: numericAmount,
      description: description || 'Chèque fournisseur',
      date: date ? new Date(date) : new Date()
    });
    await history.save();

    res.json(fournisseur);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

exports.payCheque = async (req, res) => {
  try {
    const { password } = req.body;
    const historyId = req.params.historyId;

    // Verify Admin Password
    const user = await User.findById(req.user.id);
    if (!user) return res.status(404).json({ message: "Utilisateur non trouvé" });
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) return res.status(400).json({ message: "Mot de passe incorrect" });

    const history = await FournisseurHistory.findById(historyId);
    if (!history || history.type !== 'cheque' || history.isPaid) {
      return res.status(400).json({ message: 'Chèque invalide ou déjà payé' });
    }

    const fournisseur = await Fournisseur.findById(history.fournisseurId);
    if (!fournisseur) return res.status(404).json({ message: 'Fournisseur introuvable' });

    // Mark as paid
    history.isPaid = true;
    await history.save();

    // Update fournisseur total
    fournisseur.totalPaid += history.amount;
    await fournisseur.save();

    // Create Global Transaction
    const transaction = new Transaction({
      type: 'minus',
      category: 'Fournisseur',
      amount: history.amount,
      description: `Paiement Chèque : ${fournisseur.name} ${history.description ? '('+history.description+')' : ''}`,
      date: new Date(),
      fournisseurId: fournisseur._id,
      historyId: history._id,
      isSettled: true
    });
    await transaction.save();

    res.json({ message: 'Chèque marqué comme payé' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

exports.updateHistory = async (req, res) => {
  try {
    const { amount, description, date } = req.body;
    const historyId = req.params.historyId;

    const history = await FournisseurHistory.findById(historyId);
    if (!history) return res.status(404).json({ message: 'Historique introuvable' });

    const fournisseur = await Fournisseur.findById(history.fournisseurId);
    if (!fournisseur) return res.status(404).json({ message: 'Fournisseur introuvable' });

    const numericAmount = Number(amount);
    if (isNaN(numericAmount) || numericAmount <= 0) return res.status(400).json({ message: "Montant invalide" });

    const amountDiff = numericAmount - history.amount;

    if (history.type === 'purchase') {
      fournisseur.totalBought += amountDiff;
    } else if (history.type === 'payment' || history.type === 'remise' || (history.type === 'cheque' && history.isPaid)) {
      fournisseur.totalPaid += amountDiff;
      if (history.type !== 'remise') {
        // Update linked transaction
        const transaction = await Transaction.findOne({ historyId: history._id });
        if (transaction) {
          transaction.amount = numericAmount;
          transaction.description = description ? `Paiement fournisseur : ${fournisseur.name} (${description})` : transaction.description;
          transaction.date = date ? new Date(date) : transaction.date;
          await transaction.save();
        }
      }
    }

    history.amount = numericAmount;
    history.description = description;
    if (date) history.date = new Date(date);
    
    await history.save();
    await fournisseur.save();

    res.json({ message: 'Historique mis à jour' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

exports.deleteHistory = async (req, res) => {
  try {
    const historyId = req.params.historyId;

    const history = await FournisseurHistory.findById(historyId);
    if (!history) return res.status(404).json({ message: 'Historique introuvable' });

    const fournisseur = await Fournisseur.findById(history.fournisseurId);
    if (!fournisseur) return res.status(404).json({ message: 'Fournisseur introuvable' });

    if (history.type === 'purchase') {
      fournisseur.totalBought -= history.amount;
    } else if (history.type === 'payment' || history.type === 'remise' || (history.type === 'cheque' && history.isPaid)) {
      fournisseur.totalPaid -= history.amount;
      if (history.type !== 'remise') {
        // Delete linked transaction
        await Transaction.findOneAndDelete({ historyId: history._id });
      }
    }

    await FournisseurHistory.findByIdAndDelete(historyId);
    await fournisseur.save();

    res.json({ message: 'Historique supprimé' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

exports.addRemise = async (req, res) => {
  try {
    const { amount, description, date } = req.body;
    const fournisseur = await Fournisseur.findById(req.params.id);
    if (!fournisseur) return res.status(404).json({ message: 'Fournisseur introuvable' });

    const numericAmount = Number(amount);
    if (isNaN(numericAmount) || numericAmount <= 0) return res.status(400).json({ message: "Montant invalide" });

    // Create history record of type 'remise'
    const history = new FournisseurHistory({
      fournisseurId: fournisseur._id,
      type: 'remise',
      amount: numericAmount,
      description: description || 'Remise fournisseur',
      date: date ? new Date(date) : new Date()
    });
    await history.save();

    // Update fournisseur totals (remise increases totalPaid to reduce reste à payer)
    fournisseur.totalPaid += numericAmount;
    await fournisseur.save();

    res.json(fournisseur);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

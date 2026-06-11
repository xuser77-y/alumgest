const mongoose = require('mongoose');

const FournisseurHistorySchema = new mongoose.Schema({
  fournisseurId: { type: mongoose.Schema.Types.ObjectId, ref: 'Fournisseur', required: true },
  type: { type: String, enum: ['purchase', 'payment', 'cheque', 'remise'], required: true },
  isPaid: { type: Boolean, default: true },
  amount: { type: Number, required: true },
  description: { type: String },
  date: { type: Date, default: Date.now }
}, { timestamps: true });

module.exports = mongoose.model('FournisseurHistory', FournisseurHistorySchema);

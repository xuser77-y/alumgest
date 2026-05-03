const mongoose = require('mongoose');

const FournisseurHistorySchema = new mongoose.Schema({
  fournisseurId: { type: mongoose.Schema.Types.ObjectId, ref: 'Fournisseur', required: true },
  type: { type: String, enum: ['purchase', 'payment'], required: true },
  amount: { type: Number, required: true },
  description: { type: String },
  date: { type: Date, default: Date.now }
}, { timestamps: true });

module.exports = mongoose.model('FournisseurHistory', FournisseurHistorySchema);

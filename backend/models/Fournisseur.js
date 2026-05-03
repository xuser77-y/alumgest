const mongoose = require('mongoose');

const FournisseurSchema = new mongoose.Schema({
  name: { type: String, required: true },
  phone: { type: String },
  email: { type: String },
  address: { type: String },
  totalBought: { type: Number, default: 0 },
  totalPaid: { type: Number, default: 0 }
}, { timestamps: true });

module.exports = mongoose.model('Fournisseur', FournisseurSchema);

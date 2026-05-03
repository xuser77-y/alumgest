const mongoose = require('mongoose');

const PaymentSchema = new mongoose.Schema({
  date: { type: Date, default: Date.now },
  amount: { type: Number, required: true },
  note: String
});

const DebtSchema = new mongoose.Schema({
  client: { type: mongoose.Schema.Types.ObjectId, ref: 'Client', required: true },
  totalAmount: { type: Number, required: true },
  payments: [PaymentSchema],
  status: { type: String, enum: ['pending', 'paid'], default: 'pending' },
  notes: String,
  finishedAt: { type: Date } // Manually set or from project
}, { timestamps: true });

module.exports = mongoose.model('Debt', DebtSchema);

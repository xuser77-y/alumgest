const mongoose = require('mongoose');

const TransactionSchema = new mongoose.Schema({
  type: { type: String, enum: ['plus', 'minus'], required: true },
  category: { type: String, required: true },
  projectId: { type: mongoose.Schema.Types.ObjectId, ref: 'Project' },
  amount: { type: Number, required: true },
  description: String,
  projectId: { type: mongoose.Schema.Types.ObjectId, ref: 'Project' },
  date: { type: Date, default: Date.now },
  workerId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' }, 
  isSettled: { type: Boolean, default: false } 
});

module.exports = mongoose.model('Transaction', TransactionSchema);
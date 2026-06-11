const mongoose = require('mongoose');

const PayrollSchema = new mongoose.Schema({
  workerId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  month: { type: Number, required: true }, // 1-12
  year: { type: Number, required: true },
  totalDays: Number,     // Total 'Full' + 'Half' counts
  totalBonus: Number,    // Sum of displacements (+0.5s)
  brut: { type: Number }, // Exact computed brut
  advances: { type: Number, default: 0 }, // Money he took before the 10th
  netAmount: Number,     // The final cash given to him
  paymentDate: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Payroll', PayrollSchema);
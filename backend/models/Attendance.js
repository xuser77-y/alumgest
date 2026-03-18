const mongoose = require('mongoose');

const AttendanceSchema = new mongoose.Schema({
  workerId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  date: { type: String, required: true }, // YYYY-MM-DD
  status: { type: String, enum: ['full', 'half', 'absent'], default: 'absent' },
  displacement: { type: Boolean, default: false } // The 0.5 bonus
});

module.exports = mongoose.material = mongoose.model('Attendance', AttendanceSchema);
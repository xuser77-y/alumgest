const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const UserSchema = new mongoose.Schema({
  name: { type: String, required: true },
  username: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  role: { type: String, enum: ['admin', 'worker'], default: 'worker' },
  dailySalary: { type: Number, default: 0 },
  phone: String,
  poste: { type: String, default: 'Fabrication' }, // ADDED THIS
  dateEmbauche: { type: Date, default: Date.now }
});

// Hash password before saving - FIXED LOGIC
UserSchema.pre('save', async function() {
  if (!this.isModified('password')) return; // No next() needed here in async
  this.password = await bcrypt.hash(this.password, 10);
});

module.exports = mongoose.model('User', UserSchema);
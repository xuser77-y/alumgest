const mongoose = require('mongoose');

const CategorySchema = new mongoose.Schema({
  name: { type: String, required: true, unique: true },
  type: { type: String, enum: ['plus', 'minus'], required: true }
});

module.exports = mongoose.model('Category', CategorySchema);
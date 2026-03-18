const mongoose = require('mongoose');

const CatalogSchema = new mongoose.Schema({
  name: { type: String, required: true }, // Ex: Fenêtre 120x140 Alu
  basePrice: { type: Number, required: true, default: 0 }, // Ex: 1500
  description: String
});

module.exports = mongoose.model('Catalog', CatalogSchema);
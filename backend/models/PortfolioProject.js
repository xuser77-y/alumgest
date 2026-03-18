// models/PortfolioProject.js
const mongoose = require('mongoose');

const PortfolioProjectSchema = new mongoose.Schema({
  title:         { type: String, required: true, trim: true },
  description:   { type: String, default: '' },
  coverImage:    { type: String, default: '' },           // Cloudinary URL
  galleryImages: [{ type: String }],                      // array of Cloudinary URLs
  location:      { type: String, default: '' },
  category:      { type: String, default: 'Résidentiel' },
  year:          { type: Number, default: () => new Date().getFullYear() },
  isPublished:   { type: Boolean, default: false },
  featured:      { type: Boolean, default: false },       // show on home hero section
  client:        { type: String, default: '' },
  surface:       { type: String, default: '' },           // optional m² info
}, { timestamps: true });

PortfolioProjectSchema.index({ isPublished: 1, createdAt: -1 });
PortfolioProjectSchema.index({ category: 1, isPublished: 1 });

module.exports = mongoose.model('PortfolioProject', PortfolioProjectSchema);
const mongoose = require('mongoose');

const ElementSchema = new mongoose.Schema({
  label: { type: String, required: true },
  width: Number,
  height: Number,
  quantity: { type: Number, default: 1 },
  unitPrice: { type: Number, default: 0 },
  totalPrice: { type: Number, default: 0 } 
});

const ProjectSchema = new mongoose.Schema({
  projectName: { type: String, required: true },
  client: { type: mongoose.Schema.Types.ObjectId, ref: 'Client' },
  totalPrice: { type: Number, default: 0 },
  advancePayment: { type: Number, default: 0 },
  finalSpent: { type: Number, default: 0 },
  deadline: { type: Date }, // NOT required
  finishedAt: { type: Date }, // Recorded when project status is set to 'completed'
  status: { type: String, enum: ['active', 'completed'], default: 'active' },
  items: [ElementSchema]
}, { timestamps: true });

module.exports = mongoose.model('Project', ProjectSchema);
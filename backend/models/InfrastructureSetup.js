const mongoose = require('mongoose');

const infrastructureSetupSchema = new mongoose.Schema({
  universityId: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'User', 
    required: true 
  },
  labProjectId: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'LabProject',
    required: false 
  },
  serviceType: {
    type: String,
    enum: ['on-site-deployment', 'hardware-configuration', 'network-setup', 'complete-setup'],
    required: true
  },
  description: {
    type: String,
    required: true
  },
  estimatedBudget: {
    type: Number,
    required: true
  },
  actualCost: Number,
  status: {
    type: String,
    enum: ['pending', 'quoted', 'accepted', 'in-progress', 'completed', 'cancelled'],
    default: 'pending'
  },
  priority: {
    type: String,
    enum: ['low', 'medium', 'high', 'urgent'],
    default: 'medium'
  },
  location: {
    address: String,
    city: String,
    state: String,
    zipCode: String
  },
  requiredDate: Date,
  completionDate: Date,
  notes: String,
  vendorAssignedId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  quote: {
    quotedBy: mongoose.Schema.Types.ObjectId,
    quotedPrice: Number,
    quotedDate: Date,
    description: String,
    estimatedDuration: String,
    quotedStatus: { type: String, enum: ['pending', 'accepted', 'rejected'], default: 'pending' }
  },
  attachments: [String],
  timeline: [{
    status: String,
    date: { type: Date, default: Date.now },
    notes: String
  }]
}, { timestamps: true });

module.exports = mongoose.model('InfrastructureSetup', infrastructureSetupSchema);

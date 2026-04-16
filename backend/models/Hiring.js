const mongoose = require('mongoose');

const hiringSchema = new mongoose.Schema({
  universityId: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'User', 
    required: true 
  },
  consultantId: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'User', 
    required: true 
  },
  labProjectId: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'LabProject',
    required: false 
  },
  status: { 
    type: String, 
    enum: ['pending', 'accepted', 'active', 'completed', 'cancelled'], 
    default: 'pending' 
  },
  proposedBy: {
    type: String,
    enum: ['university', 'consultant'],
    default: 'university'
  },
  startDate: Date,
  endDate: Date,
  notes: String
}, { timestamps: true });

module.exports = mongoose.model('Hiring', hiringSchema);

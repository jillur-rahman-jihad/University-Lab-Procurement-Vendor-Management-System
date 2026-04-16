const mongoose = require('mongoose');

const consultantLabAssignmentSchema = new mongoose.Schema({
  consultantId: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'User', 
    required: true 
  },
  labProjectId: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'LabProject', 
    required: true 
  },
  universityId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  hiringId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Hiring'
  },
  assignmentDate: {
    type: Date,
    default: Date.now
  },
  status: {
    type: String,
    enum: ['assigned', 'analyzing', 'suggestions-provided', 'completed'],
    default: 'assigned'
  },
  notes: String,
  budgetPriority: {
    type: String,
    enum: ['budget-focused', 'balanced', 'performance-focused'],
    default: 'balanced'
  }
}, { timestamps: true });

module.exports = mongoose.model('ConsultantLabAssignment', consultantLabAssignmentSchema);

const mongoose = require("mongoose");

// MODULE 2 - Task 2A: Consultant Hire Request Schema
const consultantHireRequestSchema = new mongoose.Schema({
  // Request identifiers
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
  projectId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'LabProject'
  },
  labAssignmentId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'LabProjectAssignment'
  },
  
  // Request status: pending -> accepted/rejected
  status: { 
    type: String, 
    enum: ['pending', 'accepted', 'rejected', 'completed', 'cancelled'],
    default: 'pending'
  },
  
  // Assignment details
  projectName: { 
    type: String, 
    required: true 
  },
  projectDescription: { 
    type: String 
  },
  
  // Duration
  startDate: { 
    type: Date, 
    required: true 
  },
  endDate: { 
    type: Date, 
    required: true 
  },
  
  // Response tracking
  proposedBy: { 
    type: String,
    enum: ['university'],
    default: 'university'
  },
  respondedAt: Date,
  responseMessage: String,
  
  // Tracking
  createdAt: { 
    type: Date, 
    default: Date.now 
  },
  updatedAt: { 
    type: Date, 
    default: Date.now 
  }
}, { timestamps: true });

module.exports = mongoose.model("ConsultantHireRequest", consultantHireRequestSchema);

const mongoose = require("mongoose");

// MODULE 2 - Task 2C: Physical Infrastructure Service Request Schema
const infrastructureServiceRequestSchema = new mongoose.Schema({
  // Requester (University)
  universityId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  
  // Related hire request
  hireRequestId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'ConsultantHireRequest'
  },
  
  // Service details
  serviceDescription: {
    type: String,
    required: true
  },
  
  location: {
    address: String,
    room: String,
    floor: String,
    buildingName: String
  },
  
  // Dates and budget
  requestedDate: {
    type: Date,
    required: true
  },
  estimatedDuration: {
    type: String, // e.g., "2 hours", "1 day"
    required: true
  },
  
  budget: {
    type: Number, // in currency units
    required: true
  },
  
  // Service type
  serviceType: {
    type: String,
    enum: ['on-site-deployment', 'hardware-configuration', 'infrastructure-setup', 'other'],
    default: 'infrastructure-setup'
  },
  
  // Additional notes
  specialRequirements: String,
  equipmentNeeded: [String],
  
  // Status tracking
  status: {
    type: String,
    enum: ['pending', 'approved', 'in-progress', 'completed', 'rejected'],
    default: 'pending'
  },
  
  // Response
  responseNotes: String,
  responseDate: Date,
  
  // Consultant assigned (if applicable)
  assignedConsultantId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  
  // Payment details
  paymentStatus: {
    type: String,
    enum: ['pending', 'partial', 'paid'],
    default: 'pending'
  },
  
  paymentDetails: {
    totalAmount: Number,
    paidAmount: { type: Number, default: 0 },
    currency: { type: String, default: 'USD' },
    transactionId: String
  },
  
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
}, { timestamps: true });

module.exports = mongoose.model("InfrastructureServiceRequest", infrastructureServiceRequestSchema);

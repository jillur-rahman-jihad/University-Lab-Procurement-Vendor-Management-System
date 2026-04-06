const mongoose = require("mongoose");

const consultantAssignmentSchema = new mongoose.Schema({
  consultantId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  labProjectId: { type: mongoose.Schema.Types.ObjectId, ref: 'LabProject', required: true },
  
  suggestions: [{
    message: String,
    updatedComponents: mongoose.Schema.Types.Mixed,
    createdAt: { type: Date, default: Date.now }
  }],
  
  progress: {
    status: { type: String, enum: ["assigned", "in-progress", "completed"], default: "assigned" },
    milestones: [{
      title: String,
      completed: Boolean
    }]
  }
  
}, { timestamps: true });

module.exports = mongoose.model("ConsultantAssignment", consultantAssignmentSchema);

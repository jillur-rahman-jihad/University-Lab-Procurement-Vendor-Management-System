const mongoose = require("mongoose");

const labProjectSchema = new mongoose.Schema({
  universityId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  labName: { type: String, required: true },
  labType: { type: String, enum: ["Normal", "Graphics", "Networking", "Thesis", "AI"], required: true },
  
  requirements: {
    systems: Number,
    budgetMin: Number,
    budgetMax: Number,
    performancePriority: String,
    software: [String],
    timeline: Date
  },
  
  courseOutlineFile: String, // file URL
  
  aiRecommendation: {
    suggestedComponents: [{
      name: String,
      specs: String,
      estimatedPrice: Number
    }],
    totalEstimatedCost: Number,
    powerConsumption: Number
  },
  
  status: { type: String, enum: ["draft", "bidding", "finalized", "approved"], default: "draft" },
  consultantId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' }
  
}, { timestamps: true });

module.exports = mongoose.model("LabProject", labProjectSchema);

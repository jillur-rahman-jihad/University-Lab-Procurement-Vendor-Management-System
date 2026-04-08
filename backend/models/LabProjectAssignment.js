const mongoose = require("mongoose");

const configurationSuggestionSchema = new mongoose.Schema({
    title: { type: String, required: true },
    description: { type: String, required: true },
    category: { type: String, enum: ["Performance", "Budget", "Security", "Maintenance", "Other"], required: true },
    estimatedBudgetImpact: { type: Number }, // in dollars
    performanceImprovement: { type: String }, // description of performance gain
    priority: { type: String, enum: ["Low", "Medium", "High", "Critical"], default: "Medium" },
    status: { type: String, enum: ["Pending", "Approved", "Rejected", "Implemented"], default: "Pending" },
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    createdAt: { type: Date, default: Date.now },
    approvedBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" }, // University admin approval
    approvalDate: Date,
    rejectionReason: String
}, { _id: true });

const labProjectAssignmentSchema = new mongoose.Schema({
    projectId: { type: mongoose.Schema.Types.ObjectId, ref: "LabProject", required: true },
    universityId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    consultantId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    
    projectName: String,
    description: String,
    currentConfiguration: {
        hardware: [String],
        software: [String],
        budget: Number,
        timeline: String
    },
    
    assignmentStatus: {
        type: String,
        enum: ["Assigned", "In Progress", "On Hold", "Completed", "Cancelled"],
        default: "Assigned"
    },
    
    assignedDate: { type: Date, default: Date.now },
    
    configurationSuggestions: [configurationSuggestionSchema],
    
    notes: String,
    performanceMetrics: {
        initialBudget: Number,
        currentBudget: Number,
        budgetSavings: Number,
        performanceGainPercentage: Number
    }
}, { timestamps: true });

module.exports = mongoose.model("LabProjectAssignment", labProjectAssignmentSchema);

const mongoose = require('mongoose');

const componentSuggestionSchema = new mongoose.Schema({
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
  assignmentId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'ConsultantLabAssignment',
    required: true
  },
  universityId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  suggestionType: {
    type: String,
    enum: ['component-swap', 'architecture-redesign', 'optimization', 'cost-reduction', 'performance-enhancement'],
    required: true
  },
  title: {
    type: String,
    required: true
  },
  description: {
    type: String,
    required: true
  },
  // Original component/architecture details
  originalComponent: {
    name: String,
    category: String,
    specifications: String,
    estimatedCost: Number
  },
  // Suggested alternative
  suggestedComponent: {
    name: String,
    category: String,
    specifications: String,
    estimatedCost: Number,
    vendor: String,
    rationale: String
  },
  // Impact analysis
  impactAnalysis: {
    budgetImpact: Number, // positive = savings, negative = cost increase
    performanceImpact: String, // explanation of performance change
    compatibilityIssues: String,
    implementationNotes: String
  },
  priority: {
    type: String,
    enum: ['low', 'medium', 'high', 'critical'],
    default: 'medium'
  },
  status: {
    type: String,
    enum: ['pending', 'accepted', 'rejected', 'implemented'],
    default: 'pending'
  },
  universityResponse: {
    status: String, // accepted/rejected/under-review
    notes: String,
    respondedAt: Date
  },
  estimatedSavings: Number,
  estimatedPerformanceGain: String
}, { timestamps: true });

module.exports = mongoose.model('ComponentSuggestion', componentSuggestionSchema);

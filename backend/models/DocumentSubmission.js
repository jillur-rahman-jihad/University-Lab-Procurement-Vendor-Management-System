const mongoose = require('mongoose');

const DocumentSubmissionSchema = new mongoose.Schema({
    // Document Details
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
    
    documentType: {
        type: String,
        enum: ['JSON', 'Technical PDF', 'Financial CSV', 'Procurement Report'],
        required: true
    },
    
    downloadUrl: {
        type: String,
        required: true
    },
    
    // Submission Routing
    submittedTo: {
        type: String,
        enum: ['Finance Office', 'Procurement Committee', 'Both'],
        required: true
    },
    
    financeOfficeRecipientsEmails: [String],
    procurementCommitteeRecipientEmails: [String],
    
    // Submission Status
    status: {
        type: String,
        enum: ['submitted', 'under_review', 'partially_approved', 'approved', 'rejected', 'archived'],
        default: 'submitted'
    },
    
    // Review Tracking
    reviews: [
        {
            reviewerId: {
                type: mongoose.Schema.Types.ObjectId,
                ref: 'User'
            },
            reviewerName: String,
            reviewerRole: {
                type: String,
                enum: ['Finance Manager', 'Procurement Officer', 'Committee Member', 'Admin']
            },
            reviewerEmail: String,
            status: {
                type: String,
                enum: ['pending_review', 'reviewed', 'approved', 'rejected'],
                default: 'pending_review'
            },
            comments: String,
            budget_verification_passed: Boolean,
            audit_notes: String,
            reviewedAt: Date,
            signaturePath: String,
            signatureTimestamp: Date
        }
    ],
    
    // Approval Workflow
    approvalWorkflow: {
        financeReviewRequired: { type: Boolean, default: true },
        financeReviewStatus: {
            type: String,
            enum: ['pending', 'in_progress', 'completed'],
            default: 'pending'
        },
        financeApprovalDate: Date,
        
        procurementReviewRequired: { type: Boolean, default: true },
        procurementReviewStatus: {
            type: String,
            enum: ['pending', 'in_progress', 'completed'],
            default: 'pending'
        },
        procurementApprovalDate: Date,
        
        finalAuthorizationRequired: { type: Boolean, default: false },
        finalAuthorizationDate: Date
    },
    
    // Budget Information
    budgetDetails: {
        totalProjectCost: Number,
        estimatedComponentsCost: Number,
        estimatedInstallationCost: Number,
        estimatedMaintenanceCost: Number,
        budgetRange: {
            min: Number,
            max: Number
        },
        withinBudget: Boolean,
        budgetVariance: Number
    },
    
    // Audit Trail
    auditTrail: [
        {
            action: String,
            performedBy: String,
            performedAt: {
                type: Date,
                default: () => new Date()
            },
            details: String
        }
    ],
    
    // Timestamps
    submittedAt: {
        type: Date,
        default: () => new Date()
    },
    
    updatedAt: {
        type: Date,
        default: () => new Date()
    },
    
    completedAt: Date,
    
    // Additional Metadata
    notes: String,
    priority: {
        type: String,
        enum: ['low', 'medium', 'high', 'urgent'],
        default: 'medium'
    },
    
    tags: [String],
    
    isArchived: {
        type: Boolean,
        default: false
    }
}, { timestamps: true });

// Indexes for efficient querying
DocumentSubmissionSchema.index({ universityId: 1, status: 1 });
DocumentSubmissionSchema.index({ labProjectId: 1 });
DocumentSubmissionSchema.index({ submittedAt: -1 });
DocumentSubmissionSchema.index({ 'approvalWorkflow.financeReviewStatus': 1 });
DocumentSubmissionSchema.index({ 'approvalWorkflow.procurementReviewStatus': 1 });

module.exports = mongoose.model('DocumentSubmission', DocumentSubmissionSchema);

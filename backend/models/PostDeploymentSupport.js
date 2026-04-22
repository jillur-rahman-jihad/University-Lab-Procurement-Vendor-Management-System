const mongoose = require('mongoose');

const postDeploymentSupportSchema = new mongoose.Schema(
  {
    // Request Information
    universityId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true
    },
    labProjectId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'LabProject',
      required: true
    },

    // Request Details
    title: {
      type: String,
      required: true,
      maxlength: 100,
      trim: true
    },
    description: {
      type: String,
      required: true,
      maxlength: 1000,
      trim: true
    },
    category: {
      type: String,
      enum: ['technical', 'maintenance', 'training', 'troubleshooting', 'optimization', 'upgrade'],
      required: true
    },
    priority: {
      type: String,
      enum: ['low', 'medium', 'high', 'critical'],
      default: 'medium'
    },

    // Affected Components
    affectedComponents: {
      type: [String],
      default: []
    },

    // Status Tracking
    status: {
      type: String,
      enum: ['open', 'in-progress', 'resolved', 'closed', 'on-hold'],
      default: 'open'
    },
    assignedTo: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null
    },

    // Support Details
    resolution: {
      type: String,
      default: null
    },
    estimatedResolutionTime: {
      type: Date,
      default: null
    },
    actualResolutionTime: {
      type: Date,
      default: null
    },

    // Attachments
    attachments: [
      {
        fileName: String,
        filePath: String,
        uploadedAt: {
          type: Date,
          default: Date.now
        }
      }
    ],

    // Support Activities/Comments
    activities: [
      {
        type: {
          type: String,
          enum: ['comment', 'status_change', 'assignment', 'attachment'],
          default: 'comment'
        },
        author: {
          type: mongoose.Schema.Types.ObjectId,
          ref: 'User'
        },
        message: String,
        timestamp: {
          type: Date,
          default: Date.now
        }
      }
    ],

    // SLA Metrics
    responseTime: {
      type: Date,
      default: null
    },
    customerSatisfaction: {
      rating: {
        type: Number,
        min: 1,
        max: 5,
        default: null
      },
      feedback: {
        type: String,
        default: null
      }
    },

    // Additional Metadata
    labProjectName: String,
    universityName: String,
    vendorAssigned: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null
    }
  },
  {
    timestamps: true
  }
);

// Index for quick searches
postDeploymentSupportSchema.index({ universityId: 1, status: 1 });
postDeploymentSupportSchema.index({ labProjectId: 1 });
postDeploymentSupportSchema.index({ priority: 1, status: 1 });

module.exports = mongoose.model('PostDeploymentSupport', postDeploymentSupportSchema);

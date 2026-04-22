const mongoose = require('mongoose');

const infrastructureOptimizationReportSchema = new mongoose.Schema(
  {
    // Report Identification
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
    reportTitle: {
      type: String,
      required: true,
      maxlength: 150,
      trim: true
    },

    // Report Metadata
    reportType: {
      type: String,
      enum: ['energy-efficiency', 'performance-optimization', 'cost-analysis', 'capacity-planning', 'comprehensive'],
      required: true
    },
    generatedDate: {
      type: Date,
      default: Date.now
    },
    analysisStartDate: Date,
    analysisEndDate: Date,

    // Executive Summary
    executiveSummary: {
      overview: String,
      keyFindings: [String],
      estimatedSavings: {
        amount: Number,
        currency: {
          type: String,
          default: 'USD'
        },
        timeframe: {
          type: String,
          enum: ['monthly', 'quarterly', 'yearly'],
          default: 'yearly'
        }
      },
      priority: {
        type: String,
        enum: ['critical', 'high', 'medium', 'low'],
        default: 'medium'
      }
    },

    // System Analysis
    currentSystemAnalysis: {
      componentsAnalyzed: [
        {
          componentName: String,
          currentUtilization: Number, // percentage
          performanceRating: String, // "Excellent", "Good", "Fair", "Poor"
          bottlenecks: [String],
          recommendations: [String]
        }
      ],
      overallHealthScore: {
        type: Number,
        min: 0,
        max: 100
      },
      uptime: {
        type: Number,
        min: 0,
        max: 100
      },
      reliabilityScore: {
        type: Number,
        min: 0,
        max: 100
      }
    },

    // Optimization Recommendations
    recommendations: [
      {
        priority: {
          type: String,
          enum: ['critical', 'high', 'medium', 'low'],
          default: 'medium'
        },
        category: String, // e.g., "Hardware Upgrade", "Configuration Change", "Software Update"
        description: String,
        expectedBenefit: String,
        implementationCost: {
          estimated: Number,
          currency: {
            type: String,
            default: 'USD'
          }
        },
        implementationTime: {
          value: Number,
          unit: {
            type: String,
            enum: ['hours', 'days', 'weeks', 'months']
          }
        },
        expectedROI: {
          value: Number,
          unit: String // e.g., "years"
        },
        riskLevel: {
          type: String,
          enum: ['low', 'medium', 'high'],
          default: 'medium'
        }
      }
    ],

    // Performance Metrics
    performanceMetrics: {
      currentMetrics: {
        powerConsumption: {
          value: Number,
          unit: String // kW
        },
        cpuUtilization: Number, // percentage
        memoryUtilization: Number, // percentage
        storageUtilization: Number, // percentage
        networkBandwidthUsage: {
          value: Number,
          unit: String // Mbps
        }
      },
      projectedMetrics: {
        powerConsumption: {
          value: Number,
          unit: String
        },
        cpuUtilization: Number,
        memoryUtilization: Number,
        storageUtilization: Number,
        networkBandwidthUsage: {
          value: Number,
          unit: String
        }
      }
    },

    // Cost Analysis
    costAnalysis: {
      currentAnnualCost: {
        operational: Number,
        maintenance: Number,
        energy: Number,
        licensing: Number,
        total: Number
      },
      projectedAnnualCost: {
        operational: Number,
        maintenance: Number,
        energy: Number,
        licensing: Number,
        total: Number
      },
      estimatedSavings: {
        amount: Number,
        percentage: Number,
        paybackPeriod: {
          value: Number,
          unit: String // "months"
        }
      }
    },

    // Capacity Planning
    capacityPlanning: {
      currentCapacity: {
        storage: {
          value: Number,
          unit: String // TB
        },
        computeNodes: Number,
        networkCapacity: {
          value: Number,
          unit: String // Gbps
        }
      },
      projectedNeeds: {
        timeframe: {
          value: Number,
          unit: String // "years"
        },
        storage: {
          value: Number,
          unit: String
        },
        computeNodes: Number,
        networkCapacity: {
          value: Number,
          unit: String
        }
      },
      growthRate: Number // percentage per year
    },

    // Implementation Roadmap
    implementationRoadmap: [
      {
        phase: Number,
        name: String,
        description: String,
        timeframe: {
          start: Date,
          end: Date,
          estimatedDuration: {
            value: Number,
            unit: String
          }
        },
        tasks: [String],
        estimatedCost: Number,
        expectedImpact: String,
        riskFactors: [String],
        mitigation: [String]
      }
    ],

    // Risk Assessment
    riskAssessment: {
      implementationRisks: [
        {
          riskDescription: String,
          likelihood: {
            type: String,
            enum: ['low', 'medium', 'high'],
            default: 'medium'
          },
          impact: {
            type: String,
            enum: ['low', 'medium', 'high'],
            default: 'medium'
          },
          mitigationStrategy: String
        }
      ],
      downtimeRisk: {
        likelihood: String,
        potentialDowntime: {
          value: Number,
          unit: String // "minutes" or "hours"
        },
        mitigation: String
      }
    },

    // Lab Project Details
    labProjectName: String,
    labProjectType: String,
    universityName: String,

    // Report Status
    status: {
      type: String,
      enum: ['draft', 'completed', 'archived'],
      default: 'completed'
    },
    version: {
      type: Number,
      default: 1
    },

    // Report Files/Downloads
    attachments: [
      {
        fileName: String,
        fileType: {
          type: String,
          enum: ['pdf', 'excel', 'json', 'docx']
        },
        filePath: String,
        generatedAt: {
          type: Date,
          default: Date.now
        }
      }
    ],

    // Audit Trail
    generatedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    lastUpdatedAt: {
      type: Date,
      default: Date.now
    },
    lastUpdatedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    }
  },
  {
    timestamps: true
  }
);

// Index for quick searches
infrastructureOptimizationReportSchema.index({ universityId: 1, labProjectId: 1 });
infrastructureOptimizationReportSchema.index({ universityId: 1, status: 1 });
infrastructureOptimizationReportSchema.index({ labProjectId: 1 });

module.exports = mongoose.model('InfrastructureOptimizationReport', infrastructureOptimizationReportSchema);

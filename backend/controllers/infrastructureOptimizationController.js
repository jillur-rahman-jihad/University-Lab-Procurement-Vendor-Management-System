const InfrastructureOptimizationReport = require('../models/InfrastructureOptimizationReport');
const LabProject = require('../models/LabProject');
const Subscription = require('../models/Subscription');
const User = require('../models/User');

// Check if user has access to Infrastructure Optimization Reports (Premium Plan feature)
exports.checkInfrastructureReportsAccess = async (req, res) => {
  try {
    const userId = req.user.id;

    // Get user's subscription
    const subscription = await Subscription.findOne({ userId });

    if (!subscription || subscription.plan !== 'premium') {
      return res.status(403).json({
        allowed: false,
        message: 'Infrastructure Optimization Reports are only available on Premium Plan',
        currentPlan: subscription?.plan || 'free'
      });
    }

    if (subscription.status !== 'active') {
      return res.status(403).json({
        allowed: false,
        message: 'Your subscription is not active. Please renew your Premium Plan.',
        status: subscription.status
      });
    }

    return res.json({
      allowed: true,
      message: 'Access granted to Infrastructure Optimization Reports',
      planType: 'premium',
      status: subscription.status
    });
  } catch (error) {
    console.error('Error checking infrastructure reports access:', error);
    res.status(500).json({ message: 'Error checking access', error: error.message });
  }
};

// Generate a new infrastructure optimization report
exports.generateReport = async (req, res) => {
  try {
    const userId = req.user.id;
    const { labProjectId, reportTitle, reportType, analysisData } = req.body;

    // Verify subscription
    const subscription = await Subscription.findOne({ userId });
    if (!subscription || subscription.plan !== 'premium' || subscription.status !== 'active') {
      return res.status(403).json({
        message: 'Premium Plan subscription required to generate reports'
      });
    }

    // Verify lab project exists and belongs to user
    const labProject = await LabProject.findById(labProjectId);
    if (!labProject || labProject.universityId.toString() !== userId) {
      return res.status(404).json({ message: 'Lab project not found' });
    }

    // Create new report
    const report = new InfrastructureOptimizationReport({
      universityId: userId,
      labProjectId,
      reportTitle,
      reportType,
      labProjectName: labProject.projectName,
      labProjectType: labProject.projectType,
      generatedBy: userId,

      // Executive Summary
      executiveSummary: {
        overview: analysisData?.executiveSummary?.overview || '',
        keyFindings: analysisData?.executiveSummary?.keyFindings || [],
        estimatedSavings: analysisData?.executiveSummary?.estimatedSavings || {
          amount: 0,
          currency: 'USD',
          timeframe: 'yearly'
        },
        priority: analysisData?.executiveSummary?.priority || 'medium'
      },

      // System Analysis
      currentSystemAnalysis: analysisData?.currentSystemAnalysis || {
        componentsAnalyzed: [],
        overallHealthScore: 0,
        uptime: 99.9,
        reliabilityScore: 0
      },

      // Recommendations
      recommendations: analysisData?.recommendations || [],

      // Performance Metrics
      performanceMetrics: analysisData?.performanceMetrics || {
        currentMetrics: {},
        projectedMetrics: {}
      },

      // Cost Analysis
      costAnalysis: analysisData?.costAnalysis || {
        currentAnnualCost: {},
        projectedAnnualCost: {}
      },

      // Capacity Planning
      capacityPlanning: analysisData?.capacityPlanning || {
        currentCapacity: {},
        projectedNeeds: {}
      },

      // Implementation Roadmap
      implementationRoadmap: analysisData?.implementationRoadmap || [],

      // Risk Assessment
      riskAssessment: analysisData?.riskAssessment || {
        implementationRisks: [],
        downtimeRisk: {}
      }
    });

    const savedReport = await report.save();

    // Populate references
    await savedReport.populate('universityId', 'firstName lastName email'); // Remove sensitive fields in frontend
    await savedReport.populate('labProjectId', 'projectName projectType');

    res.status(201).json({
      message: 'Infrastructure optimization report generated successfully',
      report: savedReport
    });
  } catch (error) {
    console.error('Error generating report:', error);
    res.status(500).json({ message: 'Error generating report', error: error.message });
  }
};

// Get all reports for authenticated user
exports.getUserReports = async (req, res) => {
  try {
    const userId = req.user.id;
    const { status, reportType, page = 1, limit = 10 } = req.query;

    // Verify subscription
    const subscription = await Subscription.findOne({ userId });
    if (!subscription || subscription.plan !== 'premium' || subscription.status !== 'active') {
      return res.status(403).json({
        message: 'Premium Plan subscription required to access reports'
      });
    }

    // Build filter
    const filter = { universityId: userId };
    if (status) filter.status = status;
    if (reportType) filter.reportType = reportType;

    // Pagination
    const skip = (page - 1) * limit;

    const reports = await InfrastructureOptimizationReport.find(filter)
      .populate('labProjectId', 'projectName projectType')
      .populate('generatedBy', 'firstName lastName')
      .sort({ generatedDate: -1 })
      .skip(skip)
      .limit(parseInt(limit));

    const total = await InfrastructureOptimizationReport.countDocuments(filter);

    res.json({
      reports,
      pagination: {
        total,
        page: parseInt(page),
        limit: parseInt(limit),
        pages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    console.error('Error fetching user reports:', error);
    res.status(500).json({ message: 'Error fetching reports', error: error.message });
  }
};

// Get detailed report with all analysis
exports.getReportDetails = async (req, res) => {
  try {
    const { reportId } = req.params;
    const userId = req.user.id;

    // Verify subscription
    const subscription = await Subscription.findOne({ userId });
    if (!subscription || subscription.plan !== 'premium' || subscription.status !== 'active') {
      return res.status(403).json({
        message: 'Premium Plan subscription required to view reports'
      });
    }

    // Get report and verify ownership
    const report = await InfrastructureOptimizationReport.findById(reportId)
      .populate('universityId', 'firstName lastName email')
      .populate('labProjectId', 'projectName projectType status')
      .populate('generatedBy', 'firstName lastName');

    if (!report) {
      return res.status(404).json({ message: 'Report not found' });
    }

    if (report.universityId._id.toString() !== userId) {
      return res.status(403).json({ message: 'Unauthorized access to this report' });
    }

    res.json(report);
  } catch (error) {
    console.error('Error fetching report details:', error);
    res.status(500).json({ message: 'Error fetching report details', error: error.message });
  }
};

// Update report
exports.updateReport = async (req, res) => {
  try {
    const { reportId } = req.params;
    const userId = req.user.id;
    const updateData = req.body;

    // Verify subscription
    const subscription = await Subscription.findOne({ userId });
    if (!subscription || subscription.plan !== 'premium' || subscription.status !== 'active') {
      return res.status(403).json({
        message: 'Premium Plan subscription required to update reports'
      });
    }

    // Get report and verify ownership
    const report = await InfrastructureOptimizationReport.findById(reportId);
    if (!report) {
      return res.status(404).json({ message: 'Report not found' });
    }

    if (report.universityId.toString() !== userId) {
      return res.status(403).json({ message: 'Unauthorized access to this report' });
    }

    // Update allowed fields
    const allowedUpdates = [
      'reportTitle',
      'recommendations',
      'status',
      'executiveSummary',
      'currentSystemAnalysis',
      'performanceMetrics',
      'costAnalysis',
      'capacityPlanning',
      'implementationRoadmap',
      'riskAssessment'
    ];

    allowedUpdates.forEach(field => {
      if (updateData[field] !== undefined) {
        report[field] = updateData[field];
      }
    });

    report.lastUpdatedAt = Date.now();
    report.lastUpdatedBy = userId;
    report.version += 1;

    const updatedReport = await report.save();
    await updatedReport.populate('labProjectId', 'projectName projectType');
    await updatedReport.populate('generatedBy', 'firstName lastName');

    res.json({
      message: 'Report updated successfully',
      report: updatedReport
    });
  } catch (error) {
    console.error('Error updating report:', error);
    res.status(500).json({ message: 'Error updating report', error: error.message });
  }
};

// Delete/Archive report
exports.deleteReport = async (req, res) => {
  try {
    const { reportId } = req.params;
    const userId = req.user.id;

    // Verify subscription
    const subscription = await Subscription.findOne({ userId });
    if (!subscription || subscription.plan !== 'premium' || subscription.status !== 'active') {
      return res.status(403).json({
        message: 'Premium Plan subscription required to manage reports'
      });
    }

    // Get report and verify ownership
    const report = await InfrastructureOptimizationReport.findById(reportId);
    if (!report) {
      return res.status(404).json({ message: 'Report not found' });
    }

    if (report.universityId.toString() !== userId) {
      return res.status(403).json({ message: 'Unauthorized access to this report' });
    }

    // Archive instead of delete
    report.status = 'archived';
    report.lastUpdatedAt = Date.now();
    report.lastUpdatedBy = userId;
    await report.save();

    res.json({
      message: 'Report archived successfully',
      reportId: reportId
    });
  } catch (error) {
    console.error('Error archiving report:', error);
    res.status(500).json({ message: 'Error archiving report', error: error.message });
  }
};

// Get report statistics
exports.getReportStatistics = async (req, res) => {
  try {
    const userId = req.user.id;

    // Verify subscription
    const subscription = await Subscription.findOne({ userId });
    if (!subscription || subscription.plan !== 'premium' || subscription.status !== 'active') {
      return res.status(403).json({
        message: 'Premium Plan subscription required to view statistics'
      });
    }

    const reports = await InfrastructureOptimizationReport.find({
      universityId: userId,
      status: { $ne: 'archived' }
    });

    // Calculate statistics
    const totalReports = reports.length;
    const reportsByType = {};
    const reportsByStatus = {};
    const averageSavings = {
      total: 0,
      count: 0
    };

    reports.forEach(report => {
      // By type
      reportsByType[report.reportType] = (reportsByType[report.reportType] || 0) + 1;

      // By status
      reportsByStatus[report.status] = (reportsByStatus[report.status] || 0) + 1;

      // Average savings
      if (report.executiveSummary?.estimatedSavings?.amount) {
        averageSavings.total += report.executiveSummary.estimatedSavings.amount;
        averageSavings.count += 1;
      }
    });

    const statistics = {
      totalReports,
      reportsByType,
      reportsByStatus,
      averageSavings: {
        amount: averageSavings.count > 0 ? averageSavings.total / averageSavings.count : 0,
        totalSavings: averageSavings.total,
        currency: 'USD'
      },
      lastReportGenerated: reports.length > 0 ? reports[0].generatedDate : null
    };

    res.json(statistics);
  } catch (error) {
    console.error('Error calculating statistics:', error);
    res.status(500).json({ message: 'Error calculating statistics', error: error.message });
  }
};

// Export report in different formats
exports.exportReport = async (req, res) => {
  try {
    const { reportId } = req.params;
    const { format } = req.query; // 'pdf', 'excel', 'json'
    const userId = req.user.id;

    // Verify subscription
    const subscription = await Subscription.findOne({ userId });
    if (!subscription || subscription.plan !== 'premium' || subscription.status !== 'active') {
      return res.status(403).json({
        message: 'Premium Plan subscription required to export reports'
      });
    }

    // Get report and verify ownership
    const report = await InfrastructureOptimizationReport.findById(reportId)
      .populate('labProjectId', 'projectName projectType')
      .populate('generatedBy', 'firstName lastName');

    if (!report) {
      return res.status(404).json({ message: 'Report not found' });
    }

    if (report.universityId.toString() !== userId) {
      return res.status(403).json({ message: 'Unauthorized access to this report' });
    }

    // For now, return JSON with export metadata
    // In production, you would use libraries like pdf-lib, exceljs, etc.
    if (format === 'json') {
      res.json({
        message: 'Report data for export',
        data: report,
        format: 'json',
        filename: `${report.reportTitle.replace(/\s+/g, '_')}_${report.generatedDate.toISOString().split('T')[0]}.json`
      });
    } else {
      // Placeholder for other formats
      res.json({
        message: `Export format '${format}' would be generated here`,
        data: report,
        format: format,
        filename: `${report.reportTitle.replace(/\s+/g, '_')}_${report.generatedDate.toISOString().split('T')[0]}.${format}`
      });
    }
  } catch (error) {
    console.error('Error exporting report:', error);
    res.status(500).json({ message: 'Error exporting report', error: error.message });
  }
};

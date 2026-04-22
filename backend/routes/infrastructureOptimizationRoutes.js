const express = require('express');
const router = express.Router();
const authMiddleware = require('../middleware/authMiddleware');
const infrastructureOptimizationController = require('../controllers/infrastructureOptimizationController');

// All routes require authentication
router.use(authMiddleware);

// Check access to infrastructure optimization reports (Premium feature)
router.get('/check-access', infrastructureOptimizationController.checkInfrastructureReportsAccess);

// Generate new report
router.post('/generate-report', infrastructureOptimizationController.generateReport);

// Get all reports for authenticated user
router.get('/my-reports', infrastructureOptimizationController.getUserReports);

// Get report statistics
router.get('/statistics', infrastructureOptimizationController.getReportStatistics);

// Get detailed report
router.get('/report/:reportId', infrastructureOptimizationController.getReportDetails);

// Update report
router.put('/report/:reportId', infrastructureOptimizationController.updateReport);

// Archive/Delete report
router.delete('/report/:reportId', infrastructureOptimizationController.deleteReport);

// Export report in different formats
router.get('/export/:reportId', infrastructureOptimizationController.exportReport);

module.exports = router;

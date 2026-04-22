const express = require('express');
const postDeploymentController = require('../controllers/postDeploymentController');
const authMiddleware = require('../middleware/authMiddleware');

const router = express.Router();

// All routes require authentication
router.use(authMiddleware);

// Check access permission (Premium Plan only)
router.get('/check-access', postDeploymentController.checkPostDeploymentAccess);

// Create new support request
router.post('/create-request', postDeploymentController.createSupportRequest);

// Get all user's support requests (with filtering)
router.get('/my-requests', postDeploymentController.getUserSupportRequests);

// Get specific support request details
router.get('/request-details/:requestId', postDeploymentController.getSupportRequestDetails);

// Add activity/comment to support request
router.post('/add-activity/:requestId', postDeploymentController.addActivity);

// Update support request status
router.patch('/update-status/:requestId', postDeploymentController.updateStatus);

// Get support statistics
router.get('/statistics', postDeploymentController.getSupportStatistics);

module.exports = router;

const express = require('express');
const router = express.Router();
const documentSubmissionController = require('../controllers/documentSubmissionController');
const authenticateToken = require('../middleware/authMiddleware');

// ========== Document Submission Routes ==========

// Submit document to Finance/Procurement
router.post('/submit-document', authenticateToken, documentSubmissionController.submitDocument);

// Get submissions history for current university
router.get('/submissions', authenticateToken, documentSubmissionController.getSubmissions);

// Get specific submission details
router.get('/submission/:submissionId', authenticateToken, documentSubmissionController.getSubmissionDetails);

// Add review/feedback to submission
router.post('/submission/:submissionId/add-review', authenticateToken, documentSubmissionController.addReview);

// Approve document
router.post('/submission/:submissionId/approve', authenticateToken, documentSubmissionController.approveDocument);

// Reject document
router.post('/submission/:submissionId/reject', authenticateToken, documentSubmissionController.rejectDocument);

// Get approval dashboard
router.get('/approval-dashboard', authenticateToken, documentSubmissionController.getApprovalDashboard);

// Get audit trail for submission
router.get('/submission/:submissionId/audit-trail', authenticateToken, documentSubmissionController.getAuditTrail);

// Archive submission
router.post('/submission/:submissionId/archive', authenticateToken, documentSubmissionController.archiveSubmission);

module.exports = router;

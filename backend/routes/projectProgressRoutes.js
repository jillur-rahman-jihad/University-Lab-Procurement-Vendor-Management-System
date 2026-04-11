const express = require('express');
const router = express.Router();
const authMiddleware = require('../middleware/authMiddleware');
const uploadMiddleware = require('../middleware/uploadMiddleware');
const {
  uploadDocumentation,
  getDocumentation,
  deleteDocumentation,
  addMilestone,
  getMilestones,
  updateMilestone,
  deleteMilestone,
  updateOverallProgress,
  getProgressSummary
} = require('../controllers/projectProgressController');

// Protect all routes with authentication
router.use(authMiddleware);

// Documentation routes
router.post('/assigned-projects/:assignmentId/documents', uploadMiddleware.single('documentation'), uploadDocumentation);
router.get('/assigned-projects/:assignmentId/documents', getDocumentation);
router.delete('/assigned-projects/:assignmentId/documents/:documentId', deleteDocumentation);

// Milestone routes
router.post('/assigned-projects/:assignmentId/milestones', addMilestone);
router.get('/assigned-projects/:assignmentId/milestones', getMilestones);
router.patch('/assigned-projects/:assignmentId/milestones/:milestoneId', updateMilestone);
router.delete('/assigned-projects/:assignmentId/milestones/:milestoneId', deleteMilestone);

// Progress tracking routes
router.patch('/assigned-projects/:assignmentId/progress', updateOverallProgress);
router.get('/assigned-projects/:assignmentId/progress-summary', getProgressSummary);

module.exports = router;

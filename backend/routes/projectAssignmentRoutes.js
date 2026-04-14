const express = require('express');
const router = express.Router();
const authMiddleware = require('../middleware/authMiddleware');
const {
  getAssignedProjects,
  getProjectDetails,
  addConfigurationSuggestion,
  getConfigurationSuggestions,
  updateConfigurationSuggestion,
  deleteConfigurationSuggestion
} = require('../controllers/projectAssignmentController');

// Protect all routes with authentication
router.use(authMiddleware);

// Get all assigned projects for consultant
router.get('/assigned-projects', getAssignedProjects);

// Get details of a specific project assignment
router.get('/assigned-projects/:assignmentId', getProjectDetails);

// Add configuration suggestion to a project
router.post('/assigned-projects/:assignmentId/suggestions', addConfigurationSuggestion);

// Get configuration suggestions for a project
router.get('/assigned-projects/:assignmentId/suggestions', getConfigurationSuggestions);

// Update configuration suggestion
router.patch('/assigned-projects/:assignmentId/suggestions/:suggestionId', updateConfigurationSuggestion);

// Delete configuration suggestion
router.delete('/assigned-projects/:assignmentId/suggestions/:suggestionId', deleteConfigurationSuggestion);

module.exports = router;

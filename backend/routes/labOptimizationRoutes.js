const express = require('express');
const router = express.Router();
const authMiddleware = require('../middleware/authMiddleware');
const labOptimizationController = require('../controllers/labOptimizationController');

console.log('[ROUTES] Lab Optimization Routes loaded');

// Apply authentication middleware to all routes
router.use(authMiddleware);

// MODULE 2 - Task 2D: Lab Project Consultant Optimization Routes

// ======================= CONSULTANT ROUTES =======================

// Consultant: Get all lab projects assigned to them
// GET /api/labs/optimization/my-assignments
router.get('/my-assignments', labOptimizationController.getMyAssignedLabProjects);

// Consultant: Get details of a specific assigned project
// GET /api/labs/optimization/assignment/:assignmentId
router.get('/assignment/:assignmentId', labOptimizationController.getAssignedProjectDetails);

// Consultant: Suggest alternative system architecture for an assigned project
// POST /api/labs/optimization/assignment/:assignmentId/suggest-architecture
router.post('/assignment/:assignmentId/suggest-architecture', labOptimizationController.suggestArchitecture);

// Consultant: Update assignment status
// PUT /api/labs/optimization/assignment/:assignmentId/update-status
router.put('/assignment/:assignmentId/update-status', labOptimizationController.updateAssignmentStatus);

// ======================= UNIVERSITY ROUTES =======================

// University: Assign consultant to a lab project
// POST /api/labs/optimization/assign-consultant
router.post('/assign-consultant', labOptimizationController.assignConsultantToProject);

// University: Get all consultant assignments for their projects
// GET /api/labs/optimization/assignments
router.get('/assignments', labOptimizationController.getProjectAssignments);

// University: Review architect suggestion (approve/reject)
// PUT /api/labs/optimization/assignment/:assignmentId/suggestion/:suggestionIndex/review
router.put('/assignment/:assignmentId/suggestion/:suggestionIndex/review', labOptimizationController.reviewArchitectureSuggestion);

// ======================= PUBLIC ROUTES =======================

// Get all architecture suggestions for a project
// GET /api/labs/optimization/project/:projectId/alternatives
router.get('/project/:projectId/alternatives', labOptimizationController.getProjectAlternatives);

module.exports = router;

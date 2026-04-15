const express = require('express');
const router = express.Router();
const authMiddleware = require('../middleware/authMiddleware');
const consultantHireController = require('../controllers/consultantHireController');

// Apply authentication middleware to all routes
router.use(authMiddleware);

// MODULE 2 - Task 2A: Consultant Hire Request Routes

// University: Create a hire request
// POST /api/hire/create
router.post('/create', consultantHireController.createHireRequest);

// University: Get all their hire requests
// GET /api/hire/university/requests
router.get('/university/requests', consultantHireController.getUniversityHireRequests);

// Consultant: Get all pending hire requests
// GET /api/hire/consultant/pending
router.get('/consultant/pending', consultantHireController.getPendingHireRequests);

// Consultant: Get all active assignments
// GET /api/hire/consultant/active
router.get('/consultant/active', consultantHireController.getActiveAssignments);

// Get hire request details (both consultant and university can view)
// GET /api/hire/:requestId
router.get('/:requestId', consultantHireController.getHireRequestDetails);

// Consultant: Accept a hire request
// POST /api/hire/:requestId/accept
router.post('/:requestId/accept', consultantHireController.acceptHireRequest);

// Consultant: Reject a hire request
// POST /api/hire/:requestId/reject
router.post('/:requestId/reject', consultantHireController.rejectHireRequest);

// University: Cancel a hire request
// POST /api/hire/:requestId/cancel
router.post('/:requestId/cancel', consultantHireController.cancelHireRequest);

module.exports = router;

const express = require('express');
const router = express.Router();
const authMiddleware = require('../middleware/authMiddleware');
const consultantController = require('../controllers/consultantController');

// Apply authentication middleware to all university routes
router.use(authMiddleware);

// MODULE 2 - Task 1: Search consultants by expertise and availability
// GET /api/university/search-consultants?expertise=Networking
router.get('/search-consultants', consultantController.searchConsultants);

module.exports = router;

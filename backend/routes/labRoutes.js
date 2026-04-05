const express = require('express');
const router = express.Router();
const labController = require('../controllers/labController');
const authMiddleware = require('../middleware/authMiddleware'); // Create this if it doesn't exist

router.post('/create', authMiddleware, labController.createLabProject);

module.exports = router;
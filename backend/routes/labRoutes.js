const express = require('express');
const router = express.Router();
const labController = require('../controllers/labController');
const authMiddleware = require('../middleware/authMiddleware'); // Create this if it doesn't exist
const multer = require('multer');

const upload = multer({ storage: multer.memoryStorage() });

router.post('/create', authMiddleware, labController.createLabProject);
router.post('/upload-pdf', authMiddleware, upload.single('document'), labController.uploadAndParsePDF);

module.exports = router;
const express = require('express');
const router = express.Router();
const labController = require('../controllers/labController');
const authenticateToken = require('../middleware/authMiddleware');
const multer = require('multer');

const upload = multer({ storage: multer.memoryStorage() });

// ============ ORIGINAL ROUTES ============
router.post('/create', authenticateToken, labController.createLabProject);
router.post('/upload-pdf', authenticateToken, upload.single('document'), labController.uploadAndParsePDF);

// ============ MODULE 2 - Task 2B: Lab Planning & Procurement Management ============
// Integrate new routes with simpler endpoint paths for reliability

// Equipment Requests
router.post('/lab-equipment-request', authenticateToken, labController.requestEquipment);
router.get('/my-equipment-requests', authenticateToken, labController.getUniversityEquipmentRequests);
router.get('/equipment-catalog', authenticateToken, labController.getAvailableEquipment);
router.get('/equipment/:id', authenticateToken, labController.getEquipmentDetails);
router.put('/equipment-request/:id', authenticateToken, labController.updateEquipmentRequestStatus);

// Procurement  
router.post('/procurement/:id', authenticateToken, labController.submitProcurement);
router.get('/procurement-order/:id', authenticateToken, labController.getProcurementDetails);
router.put('/procurement/:id', authenticateToken, labController.updateProcurementStatus);

// Lab Projects
router.get('/available-lab-projects', authenticateToken, labController.getAvailableProjects);
router.post('/assign-lab-project', authenticateToken, labController.assignProject);
router.get('/my-lab-projects', authenticateToken, labController.getUniversityProjectAssignments);

module.exports = router;

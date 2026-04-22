const express = require('express');
const router = express.Router();
const labController = require('../controllers/labController');
const authenticateToken = require('../middleware/authMiddleware');
const multer = require('multer');

const upload = multer({ storage: multer.memoryStorage() });

// ============ ORIGINAL ROUTES ============
router.post('/create', authenticateToken, labController.createLabProject);
router.post('/upload-pdf', authenticateToken, upload.single('document'), labController.uploadAndParsePDF);
router.get('/user-projects', authenticateToken, labController.getUserLabProjects);
router.get('/:labProjectId', authenticateToken, labController.getLabProjectById);

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

// Export Documentation (Multiple Formats)
router.get('/export-documentation/:labProjectId', authenticateToken, labController.exportLabProjectDocumentation);
router.get('/export-documentation-pdf/:labProjectId', authenticateToken, labController.exportLabProjectDocumentationPDF);
router.get('/export-documentation-csv/:labProjectId', authenticateToken, labController.exportLabProjectDocumentationCSV);
router.get('/export-procurement-report/:labProjectId', authenticateToken, labController.exportLabProjectDocumentationProcurementReport);

// ============ AI BUILD RECOMMENDATION SYSTEM ============
router.post('/generate-recommendation/:labProjectId', authenticateToken, labController.generateAIRecommendation);
router.get('/get-recommendation/:labProjectId', authenticateToken, labController.getAIRecommendation);

module.exports = router;

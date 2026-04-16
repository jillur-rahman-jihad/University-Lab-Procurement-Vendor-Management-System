const express = require("express");
const router = express.Router();
const authenticateToken = require("../middleware/authMiddleware");
const labController = require("../controllers/labController");

// ============ MODULE 2 - Task 2B: Lab Planning & Procurement Routes ============

// Equipment Request Routes (Stage 1)
router.post("/request-equipment", authenticateToken, labController.requestEquipment);
router.get("/equipment-requests/university", authenticateToken, labController.getUniversityEquipmentRequests);
router.get("/available-equipment", authenticateToken, labController.getAvailableEquipment);
router.get("/equipment-details/:equipmentId", authenticateToken, labController.getEquipmentDetails);
router.put("/equipment-request/:requestId/update-status", authenticateToken, labController.updateEquipmentRequestStatus);

// Procurement Routes (Stage 2)
router.post("/submit-procurement/:requestId", authenticateToken, labController.submitProcurement);
router.get("/procurement-orders/:orderId", authenticateToken, labController.getProcurementDetails);
router.put("/procurement-orders/:orderId/update-status", authenticateToken, labController.updateProcurementStatus);

// Project Assignment Routes
router.get("/available-projects", authenticateToken, labController.getAvailableProjects);
router.post("/assign-project", authenticateToken, labController.assignProject);
router.get("/project-assignments/university", authenticateToken, labController.getUniversityProjectAssignments);

console.log("[ROUTES] Lab Planning & Procurement routes registered (11 endpoints)");

module.exports = router;

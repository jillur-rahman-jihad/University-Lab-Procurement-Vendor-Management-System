const express = require("express");
const router = express.Router();
const authenticateToken = require("../middleware/authMiddleware");
const universityController = require("../controllers/universityController");
const consultantController = require("../controllers/consultantController");

// Apply authentication middleware to all university routes
router.use(authenticateToken);

// ============ MODULE 2 - Task 2A: University Management & Dashboard ============

// Dashboard
router.get("/dashboard-data", universityController.getDashboardData);

// View requests
router.get("/lab-requests/active", universityController.getActiveLabRequests);
router.get("/service-requests/active", universityController.getActiveServiceRequests);

// Analytics
router.get("/analytics/planning", universityController.getLabPlanningAnalytics);

// Search endpoints
router.get("/search-labs", universityController.searchLabs);
router.get("/search-consultants", universityController.searchConsultants);
router.get("/search-vendors", universityController.searchVendors);

// Profile management
router.put("/update-profile", universityController.updateUniversityProfile);
router.get("/profile", universityController.getUniversityProfile);
router.get("/procurement/:labProjectId", universityController.getProcurementSummary);
router.get("/procurement/:labProjectId/download", universityController.downloadProcurementSummary);

// Existing route
router.get("/search-consultants", consultantController.searchConsultants);

module.exports = router;

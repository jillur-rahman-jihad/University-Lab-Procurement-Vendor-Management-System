const express = require("express");
const authMiddleware = require("../middleware/authMiddleware");

// Import all functions
const universityController = require("../controllers/universityController");

const router = express.Router();

router.get("/profile", authMiddleware, universityController.getUniversityProfile);
router.get("/procurement/:labProjectId", authMiddleware, universityController.getProcurementSummary);
router.get("/procurement/:labProjectId/download", authMiddleware, universityController.downloadProcurementSummary);
router.get("/search-consultants", authMiddleware, universityController.searchConsultants);

// NEW: Consultant hiring and chat
router.post("/hire-consultant", authMiddleware, universityController.hireConsultant);
router.post("/send-message", authMiddleware, universityController.sendMessage);
router.get("/messages/:hiringId", authMiddleware, universityController.getMessages);
router.get("/active-hirings", authMiddleware, universityController.getActiveHirings);

// NEW: Infrastructure setup requests
router.post("/request-infrastructure", authMiddleware, universityController.requestInfrastructureSetup);
router.get("/infrastructure-requests", authMiddleware, universityController.getInfrastructureRequests);
router.get("/infrastructure-requests/:requestId", authMiddleware, universityController.getInfrastructureRequest);
router.post("/infrastructure-requests/:requestId/accept-quote", authMiddleware, universityController.acceptInfrastructureQuote);

// NEW: Consultant project assignment and suggestions
router.post("/assign-consultant", authMiddleware, universityController.assignConsultantToProject);
router.get("/project-assignments", authMiddleware, universityController.getProjectAssignments);
router.get("/project-suggestions/:labProjectId", authMiddleware, universityController.getProjectSuggestions);
router.post("/respond-suggestion", authMiddleware, universityController.respondToSuggestion);

module.exports = router;


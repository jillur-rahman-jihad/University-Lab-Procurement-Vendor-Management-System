const express = require("express");
const authMiddleware = require("../middleware/authMiddleware");
const { 
  getUniversityProfile, 
  getProcurementSummary, 
  downloadProcurementSummary, 
  searchConsultants,
  hireConsultant,
  sendMessage,
  getMessages,
  getActiveHirings
} = require("../controllers/universityController");

const router = express.Router();

router.get("/profile", authMiddleware, getUniversityProfile);
router.get("/procurement/:labProjectId", authMiddleware, getProcurementSummary);
router.get("/procurement/:labProjectId/download", authMiddleware, downloadProcurementSummary);
router.get("/search-consultants", authMiddleware, searchConsultants);

// NEW: Consultant hiring and chat
router.post("/hire-consultant", authMiddleware, hireConsultant);
router.post("/send-message", authMiddleware, sendMessage);
router.get("/messages/:hiringId", authMiddleware, getMessages);
router.get("/active-hirings", authMiddleware, getActiveHirings);

module.exports = router;

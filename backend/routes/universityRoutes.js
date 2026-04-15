const express = require("express");
const authMiddleware = require("../middleware/authMiddleware");
const { getUniversityProfile, getProcurementSummary, downloadProcurementSummary } = require("../controllers/universityController");

const router = express.Router();

router.get("/profile", authMiddleware, getUniversityProfile);
router.get("/procurement/:labProjectId", authMiddleware, getProcurementSummary);
router.get("/procurement/:labProjectId/download", authMiddleware, downloadProcurementSummary);

module.exports = router;

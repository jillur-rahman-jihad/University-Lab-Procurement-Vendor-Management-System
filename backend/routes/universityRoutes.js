const express = require("express");
const authMiddleware = require("../middleware/authMiddleware");
const { getUniversityProfile, getProcurementSummary } = require("../controllers/universityController");

const router = express.Router();

router.get("/profile", authMiddleware, getUniversityProfile);
router.get("/procurement/:labProjectId", authMiddleware, getProcurementSummary);

module.exports = router;

const express = require("express");
const router = express.Router();
const consultantRRSystemController = require("../controllers/consultantRRSystemController");
const authMiddleware = require("../middleware/authMiddleware");

// Apply authentication middleware to all routes
router.use(authMiddleware);

// Add performance points
router.post("/add-points", consultantRRSystemController.addPerformancePoints);

// Get consultant ranking details
router.get("/ranking/:consultantId", consultantRRSystemController.getConsultantRanking);

// Get all consultants with ranking
router.get("/all-consultants", consultantRRSystemController.getAllConsultantsRanking);

// Record lab completion achievement
router.post("/record-lab-completion", consultantRRSystemController.recordLabCompletion);

// Update consultant rating and award points
router.post("/update-rating", consultantRRSystemController.updateConsultantRating);

// Record budget optimization achievement
router.post("/record-budget-optimization", consultantRRSystemController.recordBudgetOptimization);

// Record timely deployment achievement
router.post("/record-timely-deployment", consultantRRSystemController.recordTimelyDeployment);

// Get leaderboard
router.get("/leaderboard", consultantRRSystemController.getLeaderboard);

// Filter consultants by rank
router.get("/rank/:rank", consultantRRSystemController.getConsultantsByRank);

// Get consultant performance statistics
router.get("/stats/:consultantId", consultantRRSystemController.getPerformanceStats);

module.exports = router;

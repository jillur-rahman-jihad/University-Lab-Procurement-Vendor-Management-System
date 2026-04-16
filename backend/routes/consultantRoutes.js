const express = require("express");
const router = express.Router();
const consultantController = require("../controllers/consultantController");
const authMiddleware = require("../middleware/authMiddleware");
const upload = require("../middleware/uploadMiddleware");

// Apply authentication middleware to all consultant routes
router.use(authMiddleware);

// Upload profile photo
router.post("/upload-photo", upload.single("profilePhoto"), consultantController.uploadProfilePhoto);

// Get consultant profile
router.get("/profile", consultantController.getProfile);

// Update consultant profile
router.patch("/profile", consultantController.updateProfile);

// NEW: Consultant lab project assignment and suggestions
router.get("/assigned-projects", consultantController.getAssignedProjects);
router.get("/assigned-projects/:assignmentId", consultantController.getAssignedProject);
router.post("/submit-suggestion", consultantController.submitComponentSuggestion);
router.get("/suggestions", consultantController.getConsultantSuggestions);

module.exports = router;

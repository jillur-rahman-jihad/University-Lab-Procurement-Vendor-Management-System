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

module.exports = router;

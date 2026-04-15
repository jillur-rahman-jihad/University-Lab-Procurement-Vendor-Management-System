const express = require("express");
const authMiddleware = require("../middleware/authMiddleware");
const { getUniversityProfile } = require("../controllers/universityController");

const router = express.Router();

router.get("/profile", authMiddleware, getUniversityProfile);

module.exports = router;

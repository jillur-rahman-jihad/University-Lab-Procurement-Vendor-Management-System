const express = require("express");
const router = express.Router();
const authMiddleware = require("../middleware/authMiddleware");
const {
  getAvailableLabRequests,
  getSingleLabRequest,
  submitQuotation,
  getMyQuotations,
  updateQuotation,
  getVendorContracts,
  getVendorAnalytics
} = require("../controllers/vendorController");

router.get("/labs", authMiddleware, getAvailableLabRequests);
router.get("/labs/:id", authMiddleware, getSingleLabRequest);
router.post("/quotations", authMiddleware, submitQuotation);
router.get("/quotations/my", authMiddleware, getMyQuotations);
router.put("/quotations/:id", authMiddleware, updateQuotation);
router.get("/contracts", authMiddleware, getVendorContracts);
router.get("/analytics", authMiddleware, getVendorAnalytics);

module.exports = router;
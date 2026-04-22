const express = require("express");
const router = express.Router();
const authMiddleware = require("../middleware/authMiddleware");
const {
  getAvailableLabRequests,
  getSingleLabRequest,
  submitQuotation,
  getMyQuotations,
  updateQuotation,
  deleteQuotation,
  getVendorContracts,
  getVendorAnalytics,
  getLabQuotations,
  getVendorProfile
} = require("../controllers/vendorController");
// include getQuotationById as well
const { getQuotationById } = require("../controllers/vendorController");

router.get("/labs", authMiddleware, getAvailableLabRequests);
router.get("/labs/:id", authMiddleware, getSingleLabRequest);
router.get("/labs/:id/quotations", authMiddleware, getLabQuotations);
router.post("/quotations", authMiddleware, submitQuotation);
router.get("/quotations/my", authMiddleware, getMyQuotations);
router.get("/quotations/:id", authMiddleware, getQuotationById);
router.put("/quotations/:id", authMiddleware, updateQuotation);
router.delete("/quotations/:id", authMiddleware, deleteQuotation);
router.get("/contracts", authMiddleware, getVendorContracts);
router.get("/analytics", authMiddleware, getVendorAnalytics);
router.get("/profile", authMiddleware, getVendorProfile);

module.exports = router;
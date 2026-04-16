const express = require("express");
const router = express.Router();
const authenticateToken = require("../middleware/authMiddleware");
const {
  createServiceRequest,
  getUniversityServiceRequests,
  getPendingServiceRequests,
  getServiceRequestDetails,
  approveServiceRequest,
  rejectServiceRequest,
  updateServiceRequestProgress,
  updatePaymentStatus,
  cancelServiceRequest
} = require("../controllers/infrastructureServiceController");

// MODULE 2 - Task 2C: Infrastructure Service Request Routes

// Create infrastructure service request (University)
router.post("/create", authenticateToken, createServiceRequest);

// Get university's service requests
router.get("/university-requests", authenticateToken, getUniversityServiceRequests);

// Get all pending service requests
router.get("/pending-requests", authenticateToken, getPendingServiceRequests);

// Get service request details
router.get("/:requestId/details", authenticateToken, getServiceRequestDetails);

// Approve service request
router.put("/:requestId/approve", authenticateToken, approveServiceRequest);

// Reject service request
router.put("/:requestId/reject", authenticateToken, rejectServiceRequest);

// Update service request status
router.put("/:requestId/update-status", authenticateToken, updateServiceRequestProgress);

// Update payment status
router.put("/:requestId/update-payment", authenticateToken, updatePaymentStatus);

// Cancel service request (University)
router.put("/:requestId/cancel", authenticateToken, cancelServiceRequest);

module.exports = router;

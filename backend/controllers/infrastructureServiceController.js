const InfrastructureServiceRequest = require("../models/InfrastructureServiceRequest");
const User = require("../models/User");

// MODULE 2 - Task 2C: Infrastructure Service Request Management

// Create infrastructure service request
exports.createServiceRequest = async (req, res) => {
  try {
    const universityId = req.user.id;
    const {
      serviceDescription,
      location,
      requestedDate,
      estimatedDuration,
      budget,
      serviceType,
      specialRequirements,
      equipmentNeeded,
      hireRequestId
    } = req.body;

    // Validate required fields
    if (!serviceDescription || !requestedDate || !estimatedDuration || !budget) {
      return res.status(400).json({
        message: "Missing required fields: serviceDescription, requestedDate, estimatedDuration, budget"
      });
    }

    // Validate budget is positive
    if (budget <= 0) {
      return res.status(400).json({ message: "Budget must be greater than 0" });
    }

    // Validate requested date is in future
    if (new Date(requestedDate) <= new Date()) {
      return res.status(400).json({ message: "Requested date must be in the future" });
    }

    // Create service request
    const serviceRequest = new InfrastructureServiceRequest({
      universityId,
      hireRequestId,
      serviceDescription,
      location,
      requestedDate: new Date(requestedDate),
      estimatedDuration,
      budget,
      serviceType,
      specialRequirements,
      equipmentNeeded: equipmentNeeded || [],
      paymentDetails: {
        totalAmount: budget
      }
    });

    const savedRequest = await serviceRequest.save();

    await savedRequest.populate("universityId", "name email phone");

    console.log("[INFRA] Service request created:", savedRequest._id);

    res.status(201).json({
      message: "Infrastructure service request created successfully",
      serviceRequest: savedRequest
    });
  } catch (error) {
    console.error("[INFRA] Error creating service request:", error);
    res.status(500).json({
      message: "Error creating infrastructure service request",
      error: error.message
    });
  }
};

// Get university's service requests
exports.getUniversityServiceRequests = async (req, res) => {
  try {
    const universityId = req.user.id;
    const { status } = req.query;

    let filter = { universityId };
    if (status) {
      filter.status = status;
    }

    const requests = await InfrastructureServiceRequest.find(filter)
      .populate("universityId", "name email phone")
      .populate("assignedConsultantId", "name email phone")
      .populate("hireRequestId")
      .sort({ createdAt: -1 });

    res.status(200).json({
      message: "University service requests retrieved successfully",
      requests
    });
  } catch (error) {
    console.error("[INFRA] Error fetching university service requests:", error);
    res.status(500).json({
      message: "Error fetching service requests",
      error: error.message
    });
  }
};

// Get all pending service requests (for assigned consultant)
exports.getPendingServiceRequests = async (req, res) => {
  try {
    const requests = await InfrastructureServiceRequest.find({
      status: "pending"
    })
      .populate("universityId", "name email phone universityInfo")
      .populate("hireRequestId")
      .sort({ createdAt: -1 });

    res.status(200).json({
      message: "Pending service requests retrieved successfully",
      requests
    });
  } catch (error) {
    console.error("[INFRA] Error fetching pending service requests:", error);
    res.status(500).json({
      message: "Error fetching pending service requests",
      error: error.message
    });
  }
};

// Get service request details
exports.getServiceRequestDetails = async (req, res) => {
  try {
    const { requestId } = req.params;
    const userId = req.user.id;

    const request = await InfrastructureServiceRequest.findById(requestId)
      .populate("universityId", "name email phone universityInfo")
      .populate("assignedConsultantId", "name email phone consultantInfo")
      .populate("hireRequestId");

    if (!request) {
      return res.status(404).json({ message: "Service request not found" });
    }

    // Check access - only university or assigned consultant can view
    const isUniversity = request.universityId._id.toString() === userId;
    const isAssignedConsultant = request.assignedConsultantId?._id.toString() === userId;

    if (!isUniversity && !isAssignedConsultant) {
      return res.status(403).json({ message: "Not authorized to view this request" });
    }

    res.status(200).json({
      message: "Service request details retrieved successfully",
      request
    });
  } catch (error) {
    console.error("[INFRA] Error fetching service request details:", error);
    res.status(500).json({
      message: "Error fetching service request details",
      error: error.message
    });
  }
};

// Approve service request (admin/consultant)
exports.approveServiceRequest = async (req, res) => {
  try {
    const { requestId } = req.params;
    const { responseNotes, assignedConsultantId } = req.body;

    const request = await InfrastructureServiceRequest.findById(requestId);
    if (!request) {
      return res.status(404).json({ message: "Service request not found" });
    }

    if (request.status !== "pending") {
      return res.status(400).json({ message: "Request is not pending" });
    }

    // Update request
    request.status = "approved";
    request.responseNotes = responseNotes || "Request approved";
    request.responseDate = new Date();
    request.assignedConsultantId = assignedConsultantId;

    const updatedRequest = await request.save();

    await updatedRequest.populate("universityId", "name email");
    await updatedRequest.populate("assignedConsultantId", "name email");

    console.log("[INFRA] Service request approved:", requestId);

    res.status(200).json({
      message: "Service request approved successfully",
      request: updatedRequest
    });
  } catch (error) {
    console.error("[INFRA] Error approving service request:", error);
    res.status(500).json({
      message: "Error approving service request",
      error: error.message
    });
  }
};

// Reject service request
exports.rejectServiceRequest = async (req, res) => {
  try {
    const { requestId } = req.params;
    const { responseNotes } = req.body;

    const request = await InfrastructureServiceRequest.findById(requestId);
    if (!request) {
      return res.status(404).json({ message: "Service request not found" });
    }

    if (request.status !== "pending") {
      return res.status(400).json({ message: "Request is not pending" });
    }

    // Update request
    request.status = "rejected";
    request.responseNotes = responseNotes || "Request rejected";
    request.responseDate = new Date();

    const updatedRequest = await request.save();

    await updatedRequest.populate("universityId", "name email");

    console.log("[INFRA] Service request rejected:", requestId);

    res.status(200).json({
      message: "Service request rejected successfully",
      request: updatedRequest
    });
  } catch (error) {
    console.error("[INFRA] Error rejecting service request:", error);
    res.status(500).json({
      message: "Error rejecting service request",
      error: error.message
    });
  }
};

// Update service request status to in-progress
exports.updateServiceRequestProgress = async (req, res) => {
  try {
    const { requestId } = req.params;
    const { status, notes } = req.body;

    const validStatuses = ["pending", "approved", "in-progress", "completed", "rejected"];
    if (!validStatuses.includes(status)) {
      return res.status(400).json({ message: "Invalid status" });
    }

    const request = await InfrastructureServiceRequest.findById(requestId);
    if (!request) {
      return res.status(404).json({ message: "Service request not found" });
    }

    request.status = status;
    if (notes) {
      request.responseNotes = notes;
    }

    const updatedRequest = await request.save();

    console.log("[INFRA] Service request status updated:", requestId, "->", status);

    res.status(200).json({
      message: "Service request status updated successfully",
      request: updatedRequest
    });
  } catch (error) {
    console.error("[INFRA] Error updating service request:", error);
    res.status(500).json({
      message: "Error updating service request",
      error: error.message
    });
  }
};

// Update payment status
exports.updatePaymentStatus = async (req, res) => {
  try {
    const { requestId } = req.params;
    const { paymentStatus, paidAmount, transactionId } = req.body;

    const request = await InfrastructureServiceRequest.findById(requestId);
    if (!request) {
      return res.status(404).json({ message: "Service request not found" });
    }

    if (paymentStatus) {
      request.paymentStatus = paymentStatus;
    }

    if (paidAmount !== undefined) {
      request.paymentDetails.paidAmount = paidAmount;
    }

    if (transactionId) {
      request.paymentDetails.transactionId = transactionId;
    }

    const updatedRequest = await request.save();

    console.log("[INFRA] Payment status updated:", requestId);

    res.status(200).json({
      message: "Payment status updated successfully",
      request: updatedRequest
    });
  } catch (error) {
    console.error("[INFRA] Error updating payment status:", error);
    res.status(500).json({
      message: "Error updating payment status",
      error: error.message
    });
  }
};

// Cancel service request
exports.cancelServiceRequest = async (req, res) => {
  try {
    const { requestId } = req.params;
    const universityId = req.user.id;

    const request = await InfrastructureServiceRequest.findById(requestId);
    if (!request) {
      return res.status(404).json({ message: "Service request not found" });
    }

    if (request.universityId.toString() !== universityId) {
      return res.status(403).json({ message: "Not authorized to cancel this request" });
    }

    if (!["pending", "approved"].includes(request.status)) {
      return res.status(400).json({ 
        message: `Cannot cancel request with status: ${request.status}` 
      });
    }

    request.status = "rejected";
    request.responseNotes = "Cancelled by university";
    request.responseDate = new Date();

    const updatedRequest = await request.save();

    console.log("[INFRA] Service request cancelled:", requestId);

    res.status(200).json({
      message: "Service request cancelled successfully",
      request: updatedRequest
    });
  } catch (error) {
    console.error("[INFRA] Error cancelling service request:", error);
    res.status(500).json({
      message: "Error cancelling service request",
      error: error.message
    });
  }
};

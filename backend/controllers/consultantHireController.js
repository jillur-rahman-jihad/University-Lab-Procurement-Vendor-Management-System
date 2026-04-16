const ConsultantHireRequest = require("../models/ConsultantHireRequest");
const User = require("../models/User");

// MODULE 2 - Task 2A: Consultant Hire Request Management

// University: Create a hire request for a consultant
exports.createHireRequest = async (req, res) => {
  try {
    const universityId = req.user.id;
    const { consultantId, projectName, projectDescription, startDate, endDate } = req.body;

    // Validate required fields
    if (!consultantId || !projectName || !startDate || !endDate) {
      return res.status(400).json({ 
        message: "Missing required fields: consultantId, projectName, startDate, endDate" 
      });
    }

    // Validate dates
    if (new Date(endDate) <= new Date(startDate)) {
      return res.status(400).json({ 
        message: "End date must be after start date" 
      });
    }

    // Check if consultant exists and is available
    const consultant = await User.findOne({
      _id: consultantId,
      role: "consultant"
    });

    if (!consultant) {
      return res.status(404).json({ message: "Consultant not found" });
    }

    if (!consultant.consultantInfo?.availability) {
      return res.status(400).json({ message: "Consultant is not available" });
    }

    // Check for existing pending requests between same university and consultant
    const existingRequest = await ConsultantHireRequest.findOne({
      universityId,
      consultantId,
      status: "pending"
    });

    if (existingRequest) {
      return res.status(400).json({ 
        message: "A pending hire request already exists for this consultant" 
      });
    }

    // Create new hire request
    const hireRequest = new ConsultantHireRequest({
      universityId,
      consultantId,
      projectName,
      projectDescription,
      startDate: new Date(startDate),
      endDate: new Date(endDate),
      proposedBy: "university"
    });

    const savedRequest = await hireRequest.save();
    
    // Populate university details
    await savedRequest.populate("universityId", "name email phone");
    await savedRequest.populate("consultantId", "name email");

    console.log("[HIRE] New hire request created:", savedRequest._id);

    res.status(201).json({
      message: "Hire request created successfully",
      hireRequest: savedRequest
    });
  } catch (error) {
    console.error("[HIRE] Error creating hire request:", error);
    res.status(500).json({ 
      message: "Error creating hire request", 
      error: error.message 
    });
  }
};

// Consultant: Get all pending hire requests
exports.getPendingHireRequests = async (req, res) => {
  try {
    const consultantId = req.user.id;

    const requests = await ConsultantHireRequest.find({
      consultantId,
      status: "pending"
    })
      .populate("universityId", "name email phone universityInfo")
      .sort({ createdAt: -1 });

    res.status(200).json({
      message: "Pending hire requests retrieved successfully",
      requests
    });
  } catch (error) {
    console.error("[HIRE] Error fetching pending requests:", error);
    res.status(500).json({ 
      message: "Error fetching pending hire requests", 
      error: error.message 
    });
  }
};

// Consultant: Accept a hire request
exports.acceptHireRequest = async (req, res) => {
  try {
    const consultantId = req.user.id;
    const { requestId } = req.params;
    const { responseMessage } = req.body;

    const hireRequest = await ConsultantHireRequest.findOne({
      _id: requestId,
      consultantId,
      status: "pending"
    });

    if (!hireRequest) {
      return res.status(404).json({ 
        message: "Hire request not found or already responded" 
      });
    }

    // Update hire request status
    hireRequest.status = "accepted";
    hireRequest.respondedAt = new Date();
    hireRequest.responseMessage = responseMessage || "Request accepted";

    const updatedRequest = await hireRequest.save();
    
    await updatedRequest.populate("universityId", "name email phone");
    await updatedRequest.populate("consultantId", "name email");

    console.log("[HIRE] Hire request accepted:", requestId);

    res.status(200).json({
      message: "Hire request accepted successfully",
      hireRequest: updatedRequest
    });
  } catch (error) {
    console.error("[HIRE] Error accepting hire request:", error);
    res.status(500).json({ 
      message: "Error accepting hire request", 
      error: error.message 
    });
  }
};

// Consultant: Reject a hire request
exports.rejectHireRequest = async (req, res) => {
  try {
    const consultantId = req.user.id;
    const { requestId } = req.params;
    const { responseMessage } = req.body;

    const hireRequest = await ConsultantHireRequest.findOne({
      _id: requestId,
      consultantId,
      status: "pending"
    });

    if (!hireRequest) {
      return res.status(404).json({ 
        message: "Hire request not found or already responded" 
      });
    }

    // Update hire request status
    hireRequest.status = "rejected";
    hireRequest.respondedAt = new Date();
    hireRequest.responseMessage = responseMessage || "Request rejected";

    const updatedRequest = await hireRequest.save();
    
    await updatedRequest.populate("universityId", "name email phone");
    await updatedRequest.populate("consultantId", "name email");

    console.log("[HIRE] Hire request rejected:", requestId);

    res.status(200).json({
      message: "Hire request rejected successfully",
      hireRequest: updatedRequest
    });
  } catch (error) {
    console.error("[HIRE] Error rejecting hire request:", error);
    res.status(500).json({ 
      message: "Error rejecting hire request", 
      error: error.message 
    });
  }
};

// Consultant: Get all active assignments (accepted hire requests)
exports.getActiveAssignments = async (req, res) => {
  try {
    const consultantId = req.user.id;

    const assignments = await ConsultantHireRequest.find({
      consultantId,
      status: { $in: ["accepted", "in-progress"] }
    })
      .populate("universityId", "name email phone universityInfo")
      .sort({ startDate: 1 });

    res.status(200).json({
      message: "Active assignments retrieved successfully",
      assignments
    });
  } catch (error) {
    console.error("[HIRE] Error fetching active assignments:", error);
    res.status(500).json({ 
      message: "Error fetching active assignments", 
      error: error.message 
    });
  }
};

// University: Get all hire requests (both pending and responded)
exports.getUniversityHireRequests = async (req, res) => {
  try {
    const universityId = req.user.id;

    const requests = await ConsultantHireRequest.find({
      universityId
    })
      .populate("consultantId", "name email phone consultantInfo")
      .sort({ createdAt: -1 });

    res.status(200).json({
      message: "University hire requests retrieved successfully",
      requests
    });
  } catch (error) {
    console.error("[HIRE] Error fetching university hire requests:", error);
    res.status(500).json({ 
      message: "Error fetching hire requests", 
      error: error.message 
    });
  }
};

// Get hire request details
exports.getHireRequestDetails = async (req, res) => {
  try {
    const { requestId } = req.params;
    const userId = req.user.id;

    const hireRequest = await ConsultantHireRequest.findOne({
      _id: requestId,
      $or: [
        { universityId: userId },
        { consultantId: userId }
      ]
    })
      .populate("universityId", "name email phone universityInfo")
      .populate("consultantId", "name email phone consultantInfo");

    if (!hireRequest) {
      return res.status(404).json({ message: "Hire request not found" });
    }

    res.status(200).json({
      message: "Hire request details retrieved successfully",
      hireRequest
    });
  } catch (error) {
    console.error("[HIRE] Error fetching hire request details:", error);
    res.status(500).json({ 
      message: "Error fetching hire request details", 
      error: error.message 
    });
  }
};

// Cancel a hire request (university only)
exports.cancelHireRequest = async (req, res) => {
  try {
    const universityId = req.user.id;
    const { requestId } = req.params;

    const hireRequest = await ConsultantHireRequest.findOne({
      _id: requestId,
      universityId,
      status: { $in: ["pending", "accepted"] }
    });

    if (!hireRequest) {
      return res.status(404).json({ 
        message: "Hire request not found or cannot be cancelled" 
      });
    }

    hireRequest.status = "cancelled";
    const updatedRequest = await hireRequest.save();

    await updatedRequest.populate("consultantId", "name email");

    console.log("[HIRE] Hire request cancelled:", requestId);

    res.status(200).json({
      message: "Hire request cancelled successfully",
      hireRequest: updatedRequest
    });
  } catch (error) {
    console.error("[HIRE] Error cancelling hire request:", error);
    res.status(500).json({ 
      message: "Error cancelling hire request", 
      error: error.message 
    });
  }
};

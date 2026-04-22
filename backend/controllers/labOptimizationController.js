const LabProject = require("../models/LabProject");
const LabProjectAssignment = require("../models/LabProjectAssignment");
const User = require("../models/User");
const notificationService = require("../services/notificationService");

// MODULE 2 - Task 2D: Lab Project Consultant Optimization

// ======================= CONSULTANT OPERATIONS =======================

// Consultant: Get all lab projects assigned to them
exports.getMyAssignedLabProjects = async (req, res) => {
  try {
    const consultantId = req.user.id;

    // Only consultants can access this
    if (req.user.role !== "consultant") {
      return res.status(403).json({ message: "Only consultants can access assigned projects" });
    }

    const assignments = await LabProjectAssignment.find({
      consultantId,
      assignmentStatus: { $ne: "Cancelled" }
    })
      .populate("projectId", "labName labType requirements status createdAt")
      .populate("universityId", "name email")
      .sort({ assignedDate: -1 });

    res.status(200).json({
      message: "Assigned lab projects retrieved successfully",
      projects: assignments
    });
  } catch (error) {
    console.error("[LAB-OPT] Error fetching assigned projects:", error);
    res.status(500).json({
      message: "Error fetching assigned projects",
      error: error.message
    });
  }
};

// Consultant: Get details of a specific assigned project
exports.getAssignedProjectDetails = async (req, res) => {
  try {
    const consultantId = req.user.id;
    const { assignmentId } = req.params;

    if (req.user.role !== "consultant") {
      return res.status(403).json({ message: "Only consultants can access this" });
    }

    const assignment = await LabProjectAssignment.findById(assignmentId)
      .populate("projectId")
      .populate("universityId", "name email phone")
      .populate("consultantId", "name email expertise");

    if (!assignment) {
      return res.status(404).json({ message: "Assignment not found" });
    }

    if (assignment.consultantId._id.toString() !== consultantId) {
      return res.status(403).json({ message: "Unauthorized" });
    }

    res.status(200).json({
      message: "Project details retrieved successfully",
      assignment
    });
  } catch (error) {
    console.error("[LAB-OPT] Error fetching project details:", error);
    res.status(500).json({
      message: "Error fetching project details",
      error: error.message
    });
  }
};

// Consultant: Suggest alternative system architecture
exports.suggestArchitecture = async (req, res) => {
  try {
    const consultantId = req.user.id;
    const { assignmentId } = req.params;
    const {
      title,
      description,
      category,
      alternativeComponents,
      estimatedBudgetImpact,
      performanceImprovement,
      justification,
      priority,
      softwareAlternatives
    } = req.body;

    if (req.user.role !== "consultant") {
      return res.status(403).json({ message: "Only consultants can submit suggestions" });
    }

    // Validate required fields
    if (!title || !description || !category || estimatedBudgetImpact === undefined || !performanceImprovement) {
      return res.status(400).json({
        message: "Missing required fields: title, description, category, estimatedBudgetImpact, performanceImprovement"
      });
    }

    const assignment = await LabProjectAssignment.findById(assignmentId);

    if (!assignment) {
      return res.status(404).json({ message: "Assignment not found" });
    }

    if (assignment.consultantId.toString() !== consultantId) {
      return res.status(403).json({ message: "Unauthorized" });
    }

    // Add new configuration suggestion
    const newSuggestion = {
      title,
      description,
      category,
      estimatedBudgetImpact,
      performanceImprovement,
      priority: priority || "Medium",
      status: "Pending",
      createdBy: consultantId,
      createdAt: new Date(),
      metadata: {
        justification,
        alternativeComponents,
        softwareAlternatives
      }
    };

    assignment.configurationSuggestions.push(newSuggestion);
    assignment.assignmentStatus = "In Progress";
    await assignment.save();

    // Populate to return full data
    await assignment.populate("consultantId", "name email expertise");

    // Send notification to university about consultant suggestion (non-blocking)
    (async () => {
      try {
        const lab = await LabProject.findById(assignment.projectId).select("labName");
        const university = await User.findById(assignment.universityId).select("email");
        const consultant = await User.findById(consultantId).select("name consultantInfo.expertise");

        if (university) {
          await notificationService.createNotification({
            userId: assignment.universityId.toString(),
            relatedUserId: consultantId,
            type: "consultant",
            category: "consultant_suggestion",
            message: `${consultant?.name || "Consultant"} has submitted a suggestion: "${title}" for "${lab?.labName || "Lab Project"}". Review the details in your dashboard.`,
            referenceData: {
              resourceType: "LabProjectAssignment",
              resourceId: assignment._id,
              resourceName: lab?.labName || "Lab Project"
            },
            actionUrl: `/lab-optimization/assignments/${assignmentId}`,
            sendEmail: true,
            priority: "normal"
          });
        }
      } catch (notifError) {
        console.error("[LAB-OPT] Error sending consultant notification:", notifError.message);
      }
    })();

    console.log(`[LAB-OPT] Architecture suggestion created for assignment ${assignmentId}`);

    res.status(201).json({
      message: "Architecture suggestion submitted successfully",
      suggestion: newSuggestion,
      assignment
    });
  } catch (error) {
    console.error("[LAB-OPT] Error submitting architecture suggestion:", error);
    res.status(500).json({
      message: "Error submitting architecture suggestion",
      error: error.message
    });
  }
};

// Consultant: Update assignment status
exports.updateAssignmentStatus = async (req, res) => {
  try {
    const consultantId = req.user.id;
    const { assignmentId } = req.params;
    const { status, notes } = req.body;

    if (req.user.role !== "consultant") {
      return res.status(403).json({ message: "Only consultants can update assignment status" });
    }

    const validStatuses = ["Assigned", "In Progress", "On Hold", "Completed", "Cancelled"];
    if (!validStatuses.includes(status)) {
      return res.status(400).json({ message: "Invalid status value" });
    }

    const assignment = await LabProjectAssignment.findById(assignmentId);

    if (!assignment) {
      return res.status(404).json({ message: "Assignment not found" });
    }

    if (assignment.consultantId.toString() !== consultantId) {
      return res.status(403).json({ message: "Unauthorized" });
    }

    assignment.assignmentStatus = status;
    if (notes) {
      assignment.consultantNotes = notes;
    }

    await assignment.save();

    console.log(`[LAB-OPT] Assignment ${assignmentId} status updated to ${status}`);

    res.status(200).json({
      message: "Assignment status updated successfully",
      assignment
    });
  } catch (error) {
    console.error("[LAB-OPT] Error updating assignment status:", error);
    res.status(500).json({
      message: "Error updating assignment status",
      error: error.message
    });
  }
};

// ======================= UNIVERSITY OPERATIONS =======================

// University: Assign consultant to a lab project
exports.assignConsultantToProject = async (req, res) => {
  try {
    const universityId = req.user.id;
    const { projectId, consultantId, description } = req.body;

    if (req.user.role !== "university") {
      return res.status(403).json({ message: "Only universities can assign consultants" });
    }

    // Validate required fields
    if (!projectId || !consultantId) {
      return res.status(400).json({
        message: "Missing required fields: projectId, consultantId"
      });
    }

    // Check if project exists and belongs to university
    const project = await LabProject.findById(projectId);

    if (!project) {
      return res.status(404).json({ message: "Lab project not found" });
    }

    if (project.universityId.toString() !== universityId) {
      return res.status(403).json({ message: "This project doesn't belong to your university" });
    }

    // Check if consultant exists
    const consultant = await User.findOne({
      _id: consultantId,
      role: "consultant"
    });

    if (!consultant) {
      return res.status(404).json({ message: "Consultant not found" });
    }

    // Check if assignment already exists
    const existingAssignment = await LabProjectAssignment.findOne({
      projectId,
      consultantId,
      assignmentStatus: { $ne: "Cancelled" }
    });

    if (existingAssignment) {
      return res.status(400).json({
        message: "This consultant is already assigned to this project"
      });
    }

    // Create new assignment
    const assignment = new LabProjectAssignment({
      projectId,
      universityId,
      consultantId,
      projectName: project.labName,
      description: description || `Lab project optimization for ${project.labName}`,
      currentConfiguration: {
        hardware: project.requirements?.mainRequirement ? [project.requirements.mainRequirement] : [],
        software: project.requirements?.software || [],
        budget: project.requirements?.budgetMin || 0,
        timeline: project.requirements?.timeline?.toString() || ""
      },
      assignmentStatus: "Assigned"
    });

    await assignment.save();

    // Populate for response
    await assignment.populate("projectId", "labName labType");
    await assignment.populate("universityId", "name email");
    await assignment.populate("consultantId", "name email expertise");

    console.log(`[LAB-OPT] Consultant ${consultantId} assigned to project ${projectId}`);

    res.status(201).json({
      message: "Consultant assigned to project successfully",
      assignment
    });
  } catch (error) {
    console.error("[LAB-OPT] Error assigning consultant:", error);
    res.status(500).json({
      message: "Error assigning consultant to project",
      error: error.message
    });
  }
};

// University: Get all consultant assignments for their projects
exports.getProjectAssignments = async (req, res) => {
  try {
    const universityId = req.user.id;

    if (req.user.role !== "university") {
      return res.status(403).json({ message: "Only universities can access this" });
    }

    const assignments = await LabProjectAssignment.find({
      universityId,
      assignmentStatus: { $ne: "Cancelled" }
    })
      .populate("projectId", "labName labType status requirements")
      .populate("consultantId", "name email expertise ")
      .sort({ assignedDate: -1 });

    res.status(200).json({
      message: "Project assignments retrieved successfully",
      assignments
    });
  } catch (error) {
    console.error("[LAB-OPT] Error fetching assignments:", error);
    res.status(500).json({
      message: "Error fetching assignments",
      error: error.message
    });
  }
};

// University: Review consultant's architecture suggestion
exports.reviewArchitectureSuggestion = async (req, res) => {
  try {
    const universityId = req.user.id;
    const { assignmentId, suggestionIndex } = req.params;
    const { status, approvalNotes, rejectionReason } = req.body;

    if (req.user.role !== "university") {
      return res.status(403).json({ message: "Only universities can review suggestions" });
    }

    if (!["Approved", "Rejected"].includes(status)) {
      return res.status(400).json({ message: "Invalid status. Use 'Approved' or 'Rejected'" });
    }

    const assignment = await LabProjectAssignment.findById(assignmentId);

    if (!assignment) {
      return res.status(404).json({ message: "Assignment not found" });
    }

    if (assignment.universityId.toString() !== universityId) {
      return res.status(403).json({ message: "Unauthorized" });
    }

    const suggestion = assignment.configurationSuggestions[suggestionIndex];

    if (!suggestion) {
      return res.status(404).json({ message: "Suggestion not found" });
    }

    // Update suggestion
    suggestion.status = status;
    suggestion.approvedBy = universityId;
    suggestion.approvalDate = new Date();

    if (rejectionReason && status === "Rejected") {
      suggestion.rejectionReason = rejectionReason;
    }

    await assignment.save();

    console.log(`[LAB-OPT] Suggestion ${suggestionIndex} in assignment ${assignmentId} ${status}`);

    res.status(200).json({
      message: `Architecture suggestion ${status.toLowerCase()} successfully`,
      suggestion
    });
  } catch (error) {
    console.error("[LAB-OPT] Error reviewing suggestion:", error);
    res.status(500).json({
      message: "Error reviewing architecture suggestion",
      error: error.message
    });
  }
};

// Get all architecture suggestions for a project
exports.getProjectAlternatives = async (req, res) => {
  try {
    const { projectId } = req.params;

    const assignment = await LabProjectAssignment.findOne({ projectId })
      .populate("consultantId", "name email expertise")
      .populate("configurationSuggestions.createdBy", "name email");

    if (!assignment) {
      return res.status(404).json({ message: "No assignments found for this project" });
    }

    res.status(200).json({
      message: "Project alternatives retrieved successfully",
      projectName: assignment.projectName,
      alternatives: assignment.configurationSuggestions
    });
  } catch (error) {
    console.error("[LAB-OPT] Error fetching alternatives:", error);
    res.status(500).json({
      message: "Error fetching alternatives",
      error: error.message
    });
  }
};

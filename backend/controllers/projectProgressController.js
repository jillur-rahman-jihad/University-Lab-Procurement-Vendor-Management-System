const LabProjectAssignment = require("../models/LabProjectAssignment");

// Upload project documentation
exports.uploadDocumentation = async (req, res) => {
  try {
    const { assignmentId } = req.params;
    const consultantId = req.user.id;

    if (!req.file) {
      return res.status(400).json({ message: "No file uploaded" });
    }

    const assignment = await LabProjectAssignment.findOne({
      _id: assignmentId,
      consultantId
    });

    if (!assignment) {
      return res.status(404).json({ message: "Project assignment not found" });
    }

    const newDocument = {
      fileName: req.file.originalname,
      fileType: req.file.mimetype,
      fileSize: req.file.size,
      filePath: `/uploads/${req.file.filename}`,
      uploadedBy: consultantId,
      uploadedAt: new Date(),
      description: req.body.description || ""
    };

    assignment.documentation.push(newDocument);
    await assignment.save();

    res.status(201).json({
      message: "Documentation uploaded successfully",
      document: assignment.documentation[assignment.documentation.length - 1]
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Error uploading documentation", error: error.message });
  }
};

// Get project documentation
exports.getDocumentation = async (req, res) => {
  try {
    const { assignmentId } = req.params;
    const consultantId = req.user.id;

    const assignment = await LabProjectAssignment.findOne({
      _id: assignmentId,
      consultantId
    }).populate("documentation.uploadedBy", "name email");

    if (!assignment) {
      return res.status(404).json({ message: "Project assignment not found" });
    }

    res.status(200).json({
      message: "Documentation retrieved successfully",
      documents: assignment.documentation
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Error retrieving documentation", error: error.message });
  }
};

// Delete documentation
exports.deleteDocumentation = async (req, res) => {
  try {
    const { assignmentId, documentId } = req.params;
    const consultantId = req.user.id;

    const assignment = await LabProjectAssignment.findOne({
      _id: assignmentId,
      consultantId
    });

    if (!assignment) {
      return res.status(404).json({ message: "Project assignment not found" });
    }

    assignment.documentation.id(documentId).deleteOne();
    await assignment.save();

    res.status(200).json({
      message: "Documentation deleted successfully"
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Error deleting documentation", error: error.message });
  }
};

// Add project milestone
exports.addMilestone = async (req, res) => {
  try {
    const { assignmentId } = req.params;
    const consultantId = req.user.id;
    const { title, description, dueDate, notes } = req.body;

    const assignment = await LabProjectAssignment.findOne({
      _id: assignmentId,
      consultantId
    });

    if (!assignment) {
      return res.status(404).json({ message: "Project assignment not found" });
    }

    const newMilestone = {
      title,
      description,
      dueDate: new Date(dueDate),
      status: "Pending",
      progress: 0,
      notes
    };

    assignment.milestones.push(newMilestone);
    await assignment.save();

    res.status(201).json({
      message: "Milestone added successfully",
      milestone: assignment.milestones[assignment.milestones.length - 1]
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Error adding milestone", error: error.message });
  }
};

// Get project milestones
exports.getMilestones = async (req, res) => {
  try {
    const { assignmentId } = req.params;
    const consultantId = req.user.id;

    const assignment = await LabProjectAssignment.findOne({
      _id: assignmentId,
      consultantId
    });

    if (!assignment) {
      return res.status(404).json({ message: "Project assignment not found" });
    }

    res.status(200).json({
      message: "Milestones retrieved successfully",
      milestones: assignment.milestones
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Error retrieving milestones", error: error.message });
  }
};

// Update milestone progress
exports.updateMilestone = async (req, res) => {
  try {
    const { assignmentId, milestoneId } = req.params;
    const consultantId = req.user.id;
    const { title, description, dueDate, status, progress, notes } = req.body;

    const assignment = await LabProjectAssignment.findOne({
      _id: assignmentId,
      consultantId,
      "milestones._id": milestoneId
    });

    if (!assignment) {
      return res.status(404).json({ message: "Project assignment or milestone not found" });
    }

    const milestone = assignment.milestones.id(milestoneId);
    if (milestone) {
      if (title) milestone.title = title;
      if (description) milestone.description = description;
      if (dueDate) milestone.dueDate = new Date(dueDate);
      if (status) {
        milestone.status = status;
        if (status === "Completed") {
          milestone.progress = 100;
          milestone.completedDate = new Date();
        }
      }
      if (progress !== undefined) milestone.progress = Math.min(100, Math.max(0, progress));
      if (notes) milestone.notes = notes;
    }

    await assignment.save();

    res.status(200).json({
      message: "Milestone updated successfully",
      milestone
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Error updating milestone", error: error.message });
  }
};

// Delete milestone
exports.deleteMilestone = async (req, res) => {
  try {
    const { assignmentId, milestoneId } = req.params;
    const consultantId = req.user.id;

    const assignment = await LabProjectAssignment.findOne({
      _id: assignmentId,
      consultantId
    });

    if (!assignment) {
      return res.status(404).json({ message: "Project assignment not found" });
    }

    assignment.milestones.id(milestoneId).deleteOne();
    await assignment.save();

    res.status(200).json({
      message: "Milestone deleted successfully"
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Error deleting milestone", error: error.message });
  }
};

// Update overall project progress
exports.updateOverallProgress = async (req, res) => {
  try {
    const { assignmentId } = req.params;
    const consultantId = req.user.id;
    const { completionPercentage, estimatedDaysRemaining } = req.body;

    const assignment = await LabProjectAssignment.findOne({
      _id: assignmentId,
      consultantId
    });

    if (!assignment) {
      return res.status(404).json({ message: "Project assignment not found" });
    }

    if (!assignment.overallProgress) {
      assignment.overallProgress = {};
    }

    if (completionPercentage !== undefined) {
      assignment.overallProgress.completionPercentage = Math.min(100, Math.max(0, completionPercentage));
    }
    if (estimatedDaysRemaining !== undefined) {
      assignment.overallProgress.estimatedDaysRemaining = estimatedDaysRemaining;
    }
    assignment.overallProgress.lastUpdated = new Date();

    await assignment.save();

    res.status(200).json({
      message: "Overall progress updated successfully",
      progress: assignment.overallProgress
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Error updating progress", error: error.message });
  }
};

// Get project progress summary
exports.getProgressSummary = async (req, res) => {
  try {
    const { assignmentId } = req.params;
    const consultantId = req.user.id;

    const assignment = await LabProjectAssignment.findOne({
      _id: assignmentId,
      consultantId
    });

    if (!assignment) {
      return res.status(404).json({ message: "Project assignment not found" });
    }

    const completedMilestones = assignment.milestones.filter(m => m.status === "Completed").length;
    const totalMilestones = assignment.milestones.length;
    const milestoneCompletionPercentage = totalMilestones > 0 ? (completedMilestones / totalMilestones) * 100 : 0;

    const summary = {
      projectName: assignment.projectName,
      status: assignment.assignmentStatus,
      overallProgress: assignment.overallProgress || {},
      milestoneCompletionPercentage: Math.round(milestoneCompletionPercentage),
      completedMilestones,
      totalMilestones,
      documentationCount: assignment.documentation.length,
      delayedMilestones: assignment.milestones.filter(m => m.status === "Delayed").length,
      inProgressMilestones: assignment.milestones.filter(m => m.status === "In Progress").length
    };

    res.status(200).json({
      message: "Progress summary retrieved successfully",
      summary
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Error retrieving progress summary", error: error.message });
  }
};

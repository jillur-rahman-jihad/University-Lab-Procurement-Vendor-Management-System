const User = require("../models/User");

// Upload consultant profile photo
exports.uploadProfilePhoto = async (req, res) => {
  try {
    console.log('[UPLOAD] Request received');
    console.log('[UPLOAD] User ID:', req.user?.id);
    console.log('[UPLOAD] File:', req.file);
    
    if (!req.file) {
      console.log('[UPLOAD] No file provided');
      return res.status(400).json({ message: "No file uploaded" });
    }

    const userId = req.user.id;
    const photoPath = `/uploads/${req.file.filename}`;

    console.log('[UPLOAD] Saving photo path:', photoPath);

    const updatedUser = await User.findByIdAndUpdate(
      userId,
      { "consultantInfo.profilePhoto": photoPath },
      { new: true }
    );

    if (!updatedUser) {
      console.log('[UPLOAD] User not found for ID:', userId);
      return res.status(404).json({ message: "User not found" });
    }

    console.log('[UPLOAD] Photo uploaded successfully');
    res.status(200).json({
      message: "Profile photo uploaded successfully",
      photoPath: photoPath,
      user: updatedUser
    });
  } catch (error) {
    console.error('[UPLOAD] Error:', error);
    res.status(500).json({ message: "Error uploading photo", error: error.message });
  }
};

// Get consultant profile
exports.getProfile = async (req, res) => {
  try {
    const userId = req.user.id;
    const user = await User.findById(userId).select("name email phone role consultantInfo");

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    res.status(200).json(user);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Error fetching profile", error: error.message });
  }
};

// Update consultant profile
exports.updateProfile = async (req, res) => {
  try {
    const userId = req.user.id;
    const { bio, expertise, experienceLevel, availability, completedLabDeployments, averageResponseTime, profilePhoto } = req.body;

    const updateData = {};
    if (bio) updateData["consultantInfo.bio"] = bio;
    if (expertise) updateData["consultantInfo.expertise"] = expertise;
    if (experienceLevel) updateData["consultantInfo.experienceLevel"] = experienceLevel;
    if (availability !== undefined) updateData["consultantInfo.availability"] = availability;
    if (completedLabDeployments !== undefined) updateData["consultantInfo.completedLabDeployments"] = completedLabDeployments;
    if (averageResponseTime !== undefined) updateData["consultantInfo.averageResponseTime"] = averageResponseTime;
    if (profilePhoto === null) updateData["consultantInfo.profilePhoto"] = null;

    const updatedUser = await User.findByIdAndUpdate(
      userId,
      updateData,
      { new: true }
    );

    if (!updatedUser) {
      return res.status(404).json({ message: "User not found" });
    }

    res.status(200).json({
      message: "Profile updated successfully",
      user: updatedUser
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Error updating profile", error: error.message });
  }
};

// MODULE 2 - Task 3: Get assigned lab projects for consultant
exports.getAssignedProjects = async (req, res) => {
  try {
    const consultantId = req.user.id;

    // Verify user is a consultant
    const consultant = await User.findById(consultantId);
    if (!consultant || consultant.role !== 'consultant') {
      return res.status(403).json({ message: "Only consultants can view assigned projects" });
    }

    // Import ConsultantLabAssignment model
    const ConsultantLabAssignment = require("../models/ConsultantLabAssignment");

    // Get assigned projects
    const assignments = await ConsultantLabAssignment.find({ consultantId })
      .populate('consultantId', 'name email')
      .populate('labProjectId', 'labName labType status budget')
      .populate('universityId', 'name email')
      .sort({ createdAt: -1 });

    res.json({
      assignments,
      total: assignments.length
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// MODULE 2 - Task 3: Get single assigned project details
exports.getAssignedProject = async (req, res) => {
  try {
    const { assignmentId } = req.params;
    const consultantId = req.user.id;

    // Import ConsultantLabAssignment model
    const ConsultantLabAssignment = require("../models/ConsultantLabAssignment");

    // Get assignment
    const assignment = await ConsultantLabAssignment.findById(assignmentId)
      .populate('consultantId', 'name email')
      .populate('labProjectId')
      .populate('universityId', 'name email')
      .populate('hiringId');

    if (!assignment) {
      return res.status(404).json({ message: "Assignment not found" });
    }

    if (assignment.consultantId._id.toString() !== consultantId) {
      return res.status(403).json({ message: "Access denied" });
    }

    res.json(assignment);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// MODULE 2 - Task 3: Submit component suggestion
exports.submitComponentSuggestion = async (req, res) => {
  try {
    const consultantId = req.user.id;
    const { assignmentId, suggestionType, title, description, originalComponent, suggestedComponent, impactAnalysis, priority, estimatedSavings, estimatedPerformanceGain } = req.body;

    // Validate inputs
    if (!assignmentId || !suggestionType || !title || !description) {
      return res.status(400).json({ message: "Missing required fields" });
    }

    // Verify user is a consultant
    const consultant = await User.findById(consultantId);
    if (!consultant || consultant.role !== 'consultant') {
      return res.status(403).json({ message: "Only consultants can submit suggestions" });
    }

    // Import models
    const ConsultantLabAssignment = require("../models/ConsultantLabAssignment");
    const ComponentSuggestion = require("../models/ComponentSuggestion");

    // Verify assignment exists and belongs to consultant
    const assignment = await ConsultantLabAssignment.findById(assignmentId);
    if (!assignment) {
      return res.status(404).json({ message: "Assignment not found" });
    }

    if (assignment.consultantId.toString() !== consultantId) {
      return res.status(403).json({ message: "Access denied" });
    }

    // Create suggestion
    const suggestion = new ComponentSuggestion({
      consultantId,
      labProjectId: assignment.labProjectId,
      assignmentId,
      universityId: assignment.universityId,
      suggestionType,
      title,
      description,
      originalComponent: originalComponent || {},
      suggestedComponent: suggestedComponent || {},
      impactAnalysis: impactAnalysis || {},
      priority: priority || 'medium',
      estimatedSavings: estimatedSavings || 0,
      estimatedPerformanceGain: estimatedPerformanceGain || '',
      status: 'pending'
    });

    await suggestion.save();

    // Update assignment status
    if (assignment.status === 'assigned') {
      assignment.status = 'suggestions-provided';
      await assignment.save();
    }

    // Populate and return
    const populatedSuggestion = await ComponentSuggestion.findById(suggestion._id)
      .populate('consultantId', 'name email')
      .populate('labProjectId', 'labName')
      .populate('universityId', 'name email');

    res.status(201).json({
      message: "Suggestion submitted successfully",
      suggestion: populatedSuggestion
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// MODULE 2 - Task 3: Get suggestions for consultant
exports.getConsultantSuggestions = async (req, res) => {
  try {
    const consultantId = req.user.id;
    const { status } = req.query;

    // Verify user is a consultant
    const consultant = await User.findById(consultantId);
    if (!consultant || consultant.role !== 'consultant') {
      return res.status(403).json({ message: "Only consultants can view their suggestions" });
    }

    // Import ComponentSuggestion model
    const ComponentSuggestion = require("../models/ComponentSuggestion");

    // Build query
    let query = { consultantId };
    if (status) {
      query.status = status;
    }

    // Get suggestions
    const suggestions = await ComponentSuggestion.find(query)
      .populate('labProjectId', 'labName')
      .populate('universityId', 'name email')
      .sort({ createdAt: -1 });

    res.json({
      suggestions,
      total: suggestions.length
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
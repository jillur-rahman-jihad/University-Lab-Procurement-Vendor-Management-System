const LabProjectAssignment = require("../models/LabProjectAssignment");

// Get all assigned projects for a consultant
exports.getAssignedProjects = async (req, res) => {
  try {
    const consultantId = req.user.id;
    
    const assignments = await LabProjectAssignment.find({ consultantId })
      .populate("universityId", "name email")
      .populate("projectId")
      .sort({ assignedDate: -1 });

    res.status(200).json({
      message: "Assigned projects retrieved successfully",
      projects: assignments
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Error retrieving assigned projects", error: error.message });
  }
};

// Get single project assignment details
exports.getProjectDetails = async (req, res) => {
  try {
    const { assignmentId } = req.params;
    const consultantId = req.user.id;

    const assignment = await LabProjectAssignment.findOne({
      _id: assignmentId,
      consultantId
    }).populate("universityId", "name email phone").populate("projectId");

    if (!assignment) {
      return res.status(404).json({ message: "Project assignment not found" });
    }

    res.status(200).json(assignment);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Error retrieving project details", error: error.message });
  }
};

// Add configuration suggestion
exports.addConfigurationSuggestion = async (req, res) => {
  try {
    const { assignmentId } = req.params;
    const consultantId = req.user.id;
    const { title, description, category, estimatedBudgetImpact, performanceImprovement, priority } = req.body;

    const assignment = await LabProjectAssignment.findOne({
      _id: assignmentId,
      consultantId
    });

    if (!assignment) {
      return res.status(404).json({ message: "Project assignment not found" });
    }

    const newSuggestion = {
      title,
      description,
      category,
      estimatedBudgetImpact,
      performanceImprovement,
      priority,
      createdBy: consultantId,
      status: "Pending"
    };

    assignment.configurationSuggestions.push(newSuggestion);
    await assignment.save();

    res.status(201).json({
      message: "Configuration suggestion added successfully",
      suggestion: assignment.configurationSuggestions[assignment.configurationSuggestions.length - 1]
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Error adding configuration suggestion", error: error.message });
  }
};

// Get configuration suggestions for a project
exports.getConfigurationSuggestions = async (req, res) => {
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
      message: "Configuration suggestions retrieved successfully",
      suggestions: assignment.configurationSuggestions
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Error retrieving configuration suggestions", error: error.message });
  }
};

// Update configuration suggestion
exports.updateConfigurationSuggestion = async (req, res) => {
  try {
    const { assignmentId, suggestionId } = req.params;
    const consultantId = req.user.id;
    const { title, description, category, estimatedBudgetImpact, performanceImprovement, priority } = req.body;

    const assignment = await LabProjectAssignment.findOne({
      _id: assignmentId,
      consultantId,
      "configurationSuggestions._id": suggestionId
    });

    if (!assignment) {
      return res.status(404).json({ message: "Project assignment or suggestion not found" });
    }

    const suggestion = assignment.configurationSuggestions.id(suggestionId);
    if (suggestion) {
      if (title) suggestion.title = title;
      if (description) suggestion.description = description;
      if (category) suggestion.category = category;
      if (estimatedBudgetImpact !== undefined) suggestion.estimatedBudgetImpact = estimatedBudgetImpact;
      if (performanceImprovement) suggestion.performanceImprovement = performanceImprovement;
      if (priority) suggestion.priority = priority;
    }

    await assignment.save();

    res.status(200).json({
      message: "Configuration suggestion updated successfully",
      suggestion
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Error updating configuration suggestion", error: error.message });
  }
};

// Delete configuration suggestion
exports.deleteConfigurationSuggestion = async (req, res) => {
  try {
    const { assignmentId, suggestionId } = req.params;
    const consultantId = req.user.id;

    const assignment = await LabProjectAssignment.findOne({
      _id: assignmentId,
      consultantId
    });

    if (!assignment) {
      return res.status(404).json({ message: "Project assignment not found" });
    }

    assignment.configurationSuggestions.id(suggestionId).deleteOne();
    await assignment.save();

    res.status(200).json({
      message: "Configuration suggestion deleted successfully"
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Error deleting configuration suggestion", error: error.message });
  }
};

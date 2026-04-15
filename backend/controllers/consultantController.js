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

// Search consultants by expertise and availability
// MODULE 2 - Task 1: Search consultants by expertise
exports.searchConsultants = async (req, res) => {
  try {
    const { expertise } = req.query;

    // Build filter query
    const filterQuery = {
      role: "consultant",
      "consultantInfo.availability": true // Only available consultants
    };

    // If expertise is provided, filter by expertise
    if (expertise) {
      filterQuery["consultantInfo.expertise"] = expertise;
    }

    const consultants = await User.find(filterQuery).select(
      "name email phone consultantInfo"
    );

    if (!consultants || consultants.length === 0) {
      return res.status(200).json({
        message: "No consultants found matching criteria",
        consultants: []
      });
    }

    res.status(200).json({
      message: "Consultants retrieved successfully",
      consultants: consultants
    });
  } catch (error) {
    console.error('[SEARCH] Error:', error);
    res.status(500).json({ message: "Error searching consultants", error: error.message });
  }
};
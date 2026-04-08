const User = require("../models/User");

// Upload consultant profile photo
exports.uploadProfilePhoto = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ message: "No file uploaded" });
    }

    const userId = req.user.id;
    const photoPath = `/uploads/${req.file.filename}`;

    const updatedUser = await User.findByIdAndUpdate(
      userId,
      { "consultantInfo.profilePhoto": photoPath },
      { new: true }
    );

    if (!updatedUser) {
      return res.status(404).json({ message: "User not found" });
    }

    res.status(200).json({
      message: "Profile photo uploaded successfully",
      photoPath: photoPath,
      user: updatedUser
    });
  } catch (error) {
    console.error(error);
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
    const { bio, expertise, experienceLevel, availability } = req.body;

    const updateData = {};
    if (bio) updateData["consultantInfo.bio"] = bio;
    if (expertise) updateData["consultantInfo.expertise"] = expertise;
    if (experienceLevel) updateData["consultantInfo.experienceLevel"] = experienceLevel;
    if (availability !== undefined) updateData["consultantInfo.availability"] = availability;

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

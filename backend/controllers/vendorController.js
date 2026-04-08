const LabProject = require("../models/LabProject");
const Quotation = require("../models/Quotation");
const Procurement = require("../models/Procurement");
const User = require("../models/User");

exports.getAvailableLabRequests = async (req, res) => {
  try {
    const vendor = await User.findById(req.user.id);

    if (!vendor || vendor.role !== "vendor") {
      return res.status(403).json({ message: "Access denied. Vendor only." });
    }

    const labs = await LabProject.find({
      status: { $in: ["draft", "bidding", "finalized"] }
    })
      .populate("universityId", "name email")
      .sort({ createdAt: -1 });

    res.status(200).json(labs);
  } catch (error) {
    res.status(500).json({
      message: "Failed to fetch lab requests",
      error: error.message
    });
  }
};

exports.getSingleLabRequest = async (req, res) => {
  try {
    const vendor = await User.findById(req.user.id);

    if (!vendor || vendor.role !== "vendor") {
      return res.status(403).json({ message: "Access denied. Vendor only." });
    }

    const lab = await LabProject.findById(req.params.id).populate(
      "universityId",
      "name email"
    );

    if (!lab) {
      return res.status(404).json({ message: "Lab project not found" });
    }

    res.status(200).json(lab);
  } catch (error) {
    res.status(500).json({
      message: "Failed to fetch lab request",
      error: error.message
    });
  }
};

exports.submitQuotation = async (req, res) => {
  res.status(200).json({ message: "submitQuotation placeholder" });
};

exports.getMyQuotations = async (req, res) => {
  res.status(200).json({ message: "getMyQuotations placeholder" });
};

exports.updateQuotation = async (req, res) => {
  res.status(200).json({ message: "updateQuotation placeholder" });
};

exports.getVendorContracts = async (req, res) => {
  res.status(200).json({ message: "getVendorContracts placeholder" });
};

exports.getVendorAnalytics = async (req, res) => {
  res.status(200).json({ message: "getVendorAnalytics placeholder" });
};
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
  try {
    const vendor = await User.findById(req.user.id);

    if (!vendor || vendor.role !== "vendor") {
      return res.status(403).json({ message: "Access denied. Vendor only." });
    }

    const {
      labProjectId,
      components,
      totalPrice,
      bulkDiscount,
      installationIncluded,
      maintenanceIncluded
    } = req.body;

    if (!labProjectId || !components || !components.length || !totalPrice) {
      return res.status(400).json({
        message: "Please provide all required quotation fields"
      });
    }

    const lab = await LabProject.findById(labProjectId);
    if (!lab) {
      return res.status(404).json({ message: "Lab project not found" });
    }

    const existingQuotation = await Quotation.findOne({
      labProjectId,
      vendorId: req.user.id
    });

    if (existingQuotation) {
      return res.status(400).json({
        message: "Quotation already submitted for this lab. Please update it."
      });
    }

    const quotation = new Quotation({
      labProjectId,
      vendorId: req.user.id,
      components,
      totalPrice,
      bulkDiscount: bulkDiscount || 0,
      installationIncluded: installationIncluded || false,
      maintenanceIncluded: maintenanceIncluded || false,
      status: "pending",
      revisionHistory: []
    });

    await quotation.save();

    res.status(201).json({
      message: "Quotation submitted successfully",
      quotation
    });
  } catch (error) {
    res.status(500).json({
      message: "Failed to submit quotation",
      error: error.message
    });
  }
};

exports.getMyQuotations = async (req, res) => {
  try {
    const vendor = await User.findById(req.user.id);

    if (!vendor || vendor.role !== "vendor") {
      return res.status(403).json({ message: "Access denied. Vendor only." });
    }

    const quotations = await Quotation.find({ vendorId: req.user.id })
      .populate("labProjectId")
      .sort({ createdAt: -1 });

    res.status(200).json(quotations);
  } catch (error) {
    res.status(500).json({
      message: "Failed to fetch quotations",
      error: error.message
    });
  }
};

exports.updateQuotation = async (req, res) => {
  try {
    const vendor = await User.findById(req.user.id);

    if (!vendor || vendor.role !== "vendor") {
      return res.status(403).json({ message: "Access denied. Vendor only." });
    }

    const quotation = await Quotation.findById(req.params.id);

    if (!quotation) {
      return res.status(404).json({ message: "Quotation not found" });
    }

    if (quotation.vendorId.toString() !== req.user.id) {
      return res.status(403).json({
        message: "You can update only your own quotation"
      });
    }

    if (quotation.status !== "pending") {
      return res.status(400).json({
        message: "Only pending quotations can be updated"
      });
    }

    const {
      components,
      totalPrice,
      bulkDiscount,
      installationIncluded,
      maintenanceIncluded
    } = req.body;

    quotation.components = components ?? quotation.components;
    quotation.totalPrice = totalPrice ?? quotation.totalPrice;
    quotation.bulkDiscount = bulkDiscount ?? quotation.bulkDiscount;
    quotation.installationIncluded =
      installationIncluded ?? quotation.installationIncluded;
    quotation.maintenanceIncluded =
      maintenanceIncluded ?? quotation.maintenanceIncluded;

    quotation.revisionHistory.push({
      updatedAt: new Date(),
      changes: "Quotation updated by vendor"
    });

    await quotation.save();

    res.status(200).json({
      message: "Quotation updated successfully",
      quotation
    });
  } catch (error) {
    res.status(500).json({
      message: "Failed to update quotation",
      error: error.message
    });
  }
};

exports.getVendorContracts = async (req, res) => {
  try {
    const vendor = await User.findById(req.user.id);

    if (!vendor || vendor.role !== "vendor") {
      return res.status(403).json({ message: "Access denied. Vendor only." });
    }

    const contracts = await Procurement.find({
      selectedVendorIds: req.user.id
    }).populate("labProjectId");

    res.status(200).json(contracts);
  } catch (error) {
    res.status(500).json({
      message: "Failed to fetch vendor contracts",
      error: error.message
    });
  }
};

exports.getVendorAnalytics = async (req, res) => {
  try {
    const vendor = await User.findById(req.user.id);

    if (!vendor || vendor.role !== "vendor") {
      return res.status(403).json({ message: "Access denied. Vendor only." });
    }

    const quotations = await Quotation.find({ vendorId: req.user.id });

    const totalQuotations = quotations.length;
    const acceptedQuotations = quotations.filter(q => q.status === "accepted").length;
    const rejectedQuotations = quotations.filter(q => q.status === "rejected").length;
    const pendingQuotations = quotations.filter(q => q.status === "pending").length;

    const winRatio =
      totalQuotations > 0
        ? ((acceptedQuotations / totalQuotations) * 100).toFixed(2)
        : "0.00";

    res.status(200).json({
      totalQuotations,
      acceptedQuotations,
      rejectedQuotations,
      pendingQuotations,
      winRatio
    });
  } catch (error) {
    res.status(500).json({
      message: "Failed to fetch analytics",
      error: error.message
    });
  }
};
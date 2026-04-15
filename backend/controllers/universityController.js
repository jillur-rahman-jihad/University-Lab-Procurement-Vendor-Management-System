const User = require("../models/User");
const LabProject = require("../models/LabProject");
const Procurement = require("../models/Procurement");
const Quotation = require("../models/Quotation");

exports.getUniversityProfile = async (req, res) => {
  try {
    const userId = req.user.id;

    const user = await User.findById(userId).select('-password');

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    if (user.role !== 'university') {
      return res.status(403).json({ message: "Access denied. Only university users can access this." });
    }

    res.json({
      _id: user._id,
      name: user.name,
      email: user.email,
      phone: user.phone,
      universityInfo: {
        universityName: user.universityInfo?.universityName,
        department: user.universityInfo?.department,
        address: user.universityInfo?.address,
        representative: user.universityInfo?.representative,
        isApproved: user.universityInfo?.isApproved,
        subscriptionPlan: user.universityInfo?.subscriptionPlan
      }
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.getProcurementSummary = async (req, res) => {
  try {
    const { labProjectId } = req.params;
    const universityId = req.user.id;

    // Verify the project exists and belongs to the university
    const labProject = await LabProject.findById(labProjectId);

    if (!labProject) {
      return res.status(404).json({ message: "Lab project not found" });
    }

    if (labProject.universityId.toString() !== universityId) {
      return res.status(403).json({ message: "Access denied. You do not own this project." });
    }

    // Find procurement record for this project
    const procurement = await Procurement.findOne({ labProjectId }).populate('quotationId');

    if (!procurement) {
      return res.status(404).json({ message: "No procurement record found for this project" });
    }

    // Get vendor details
    const vendors = await User.find({ _id: { $in: procurement.selectedVendorIds } }).select('name email phone');

    // Build response
    res.json({
      _id: procurement._id,
      projectDetails: {
        _id: labProject._id,
        labName: labProject.labName,
        labType: labProject.labType,
        status: labProject.status,
        createdAt: labProject.createdAt
      },
      quotationDetails: procurement.quotationId ? {
        _id: procurement.quotationId._id,
        totalPrice: procurement.quotationId.totalPrice,
        bulkDiscount: procurement.quotationId.bulkDiscount,
        installationIncluded: procurement.quotationId.installationIncluded,
        maintenanceIncluded: procurement.quotationId.maintenanceIncluded,
        status: procurement.quotationId.status
      } : null,
      selectedVendors: vendors,
      acceptanceType: procurement.acceptanceType,
      acceptedComponents: procurement.acceptedComponents,
      finalCost: procurement.finalCost,
      approvedByAdmin: procurement.approvedByAdmin,
      createdAt: procurement.createdAt,
      updatedAt: procurement.updatedAt
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

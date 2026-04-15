const User = require("../models/User");
const LabProject = require("../models/LabProject");
const Procurement = require("../models/Procurement");
const InfrastructureServiceRequest = require("../models/InfrastructureServiceRequest");
const LabProjectAssignment = require("../models/LabProjectAssignment");

// MODULE 2 - Task 2A: University Management & Dashboard

// Get university dashboard data
exports.getDashboardData = async (req, res) => {
  try {
    const universityId = req.user.id;

    // Fetch active lab requests
    const activeLabRequests = await LabProject.countDocuments({
      universityId,
      "requirements.status": "pending"
    });

    // Fetch active service requests
    const activeServiceRequests = await InfrastructureServiceRequest.countDocuments({
      universityId,
      status: { $in: ["pending", "approved", "in-progress"] }
    });

    // Fetch active projects
    const activeProjects = await LabProjectAssignment.countDocuments({
      universityId,
      status: "active"
    });

    // Fetch procurement orders in progress
    const procurementInProgress = await Procurement.countDocuments({
      universityId,
      status: { $in: ["pending", "approved", "ordered"] }
    });

    // Fetch total budget spent
    const budgetSpent = await Procurement.aggregate([
      { $match: { universityId: universityId } },
      { $group: { _id: null, total: { $sum: "$totalAmount" } } }
    ]);

    const totalBudgetSpent = budgetSpent.length > 0 ? budgetSpent[0].total : 0;

    console.log("[UNIV] Dashboard data retrieved for:", universityId);

    res.status(200).json({
      message: "Dashboard data retrieved successfully",
      dashboard: {
        activeLabRequests,
        activeServiceRequests,
        activeProjects,
        procurementInProgress,
        totalBudgetSpent
      }
    });
  } catch (error) {
    console.error("[UNIV] Error fetching dashboard data:", error);
    res.status(500).json({
      message: "Error fetching dashboard data",
      error: error.message
    });
  }
};

// Get active lab equipment requests
exports.getActiveLabRequests = async (req, res) => {
  try {
    const universityId = req.user.id;

    const requests = await LabProject.find({
      universityId,
      "requirements.status": { $in: ["pending", "approved"] }
    })
      .sort({ createdAt: -1 });

    res.status(200).json({
      message: "Active lab requests retrieved successfully",
      requests
    });
  } catch (error) {
    console.error("[UNIV] Error fetching lab requests:", error);
    res.status(500).json({
      message: "Error fetching lab requests",
      error: error.message
    });
  }
};

// Get active infrastructure service requests
exports.getActiveServiceRequests = async (req, res) => {
  try {
    const universityId = req.user.id;

    const requests = await InfrastructureServiceRequest.find({
      universityId,
      status: { $in: ["pending", "approved", "in-progress"] }
    })
      .populate("assignedConsultantId", "name email phone")
      .sort({ createdAt: -1 });

    res.status(200).json({
      message: "Active service requests retrieved successfully",
      requests
    });
  } catch (error) {
    console.error("[UNIV] Error fetching service requests:", error);
    res.status(500).json({
      message: "Error fetching service requests",
      error: error.message
    });
  }
};

// Get lab planning analytics
exports.getLabPlanningAnalytics = async (req, res) => {
  try {
    const universityId = req.user.id;

    // Total projects
    const totalProjects = await LabProjectAssignment.countDocuments({ universityId });

    // Active projects
    const activeProjects = await LabProjectAssignment.countDocuments({
      universityId,
      status: "active"
    });

    // Completed projects
    const completedProjects = await LabProjectAssignment.countDocuments({
      universityId,
      status: "completed"
    });

    // Budget utilization
    const allProcurements = await Procurement.find({ universityId });
    const totalBudget = allProcurements.reduce((sum, p) => sum + p.totalAmount, 0);
    const paidAmount = allProcurements.reduce((sum, p) => sum + (p.paymentDetails?.paidAmount || 0), 0);

    // Request status breakdown
    const requestStatusBreakdown = await LabProject.aggregate([
      { $match: { universityId: universityId } },
      { $group: { _id: "$requirements.status", count: { $sum: 1 } } }
    ]);

    console.log("[UNIV] Analytics retrieved for:", universityId);

    res.status(200).json({
      message: "Lab planning analytics retrieved successfully",
      analytics: {
        projectMetrics: {
          totalProjects,
          activeProjects,
          completedProjects
        },
        budgetMetrics: {
          totalBudget,
          paidAmount,
          remainingBudget: totalBudget - paidAmount,
          utilizationPercentage: ((paidAmount / totalBudget) * 100).toFixed(2) + "%"
        },
        requestStatusBreakdown
      }
    });
  } catch (error) {
    console.error("[UNIV] Error fetching analytics:", error);
    res.status(500).json({
      message: "Error fetching analytics",
      error: error.message
    });
  }
};

// Search available labs
exports.searchLabs = async (req, res) => {
  try {
    const { labType, minBudget, maxBudget, sortBy } = req.query;

    let filter = { "assignmentStatus": { $ne: "assigned" } };
    if (labType) {
      filter.labType = labType;
    }

    let labs = await LabProject.find(filter);

    // Budget filtering
    if (minBudget || maxBudget) {
      labs = labs.filter(lab => {
        const budget = lab.requirements?.budget || 0;
        if (minBudget && budget < minBudget) return false;
        if (maxBudget && budget > maxBudget) return false;
        return true;
      });
    }

    // Sorting
    if (sortBy === "budget-asc") {
      labs.sort((a, b) => (a.requirements?.budget || 0) - (b.requirements?.budget || 0));
    } else if (sortBy === "budget-desc") {
      labs.sort((a, b) => (b.requirements?.budget || 0) - (a.requirements?.budget || 0));
    } else {
      labs.sort((a, b) => b.createdAt - a.createdAt);
    }

    res.status(200).json({
      message: "Labs search completed successfully",
      labs
    });
  } catch (error) {
    console.error("[UNIV] Error searching labs:", error);
    res.status(500).json({
      message: "Error searching labs",
      error: error.message
    });
  }
};

// Search available consultants
exports.searchConsultants = async (req, res) => {
  try {
    const { expertise, name } = req.query;

    let filter = { role: "consultant" };
    if (expertise) {
      filter["consultantInfo.expertise"] = { $regex: expertise, $options: "i" };
    }
    if (name) {
      filter.name = { $regex: name, $options: "i" };
    }

    const consultants = await User.find(filter)
      .select("name email phone consultantInfo")
      .sort({ "consultantInfo.yearsOfExperience": -1 });

    res.status(200).json({
      message: "Consultants search completed successfully",
      consultants
    });
  } catch (error) {
    console.error("[UNIV] Error searching consultants:", error);
    res.status(500).json({
      message: "Error searching consultants",
      error: error.message
    });
  }
};

// Search available vendors
exports.searchVendors = async (req, res) => {
  try {
    const { serviceType, name, rating } = req.query;

    let filter = { role: "vendor" };
    if (serviceType) {
      filter["vendorInfo.serviceType"] = serviceType;
    }
    if (name) {
      filter.name = { $regex: name, $options: "i" };
    }

    let vendors = await User.find(filter)
      .select("name email phone vendorInfo")
      .sort({ createdAt: -1 });

    // Filter by rating if provided
    if (rating) {
      vendors = vendors.filter(v => (v.vendorInfo?.rating || 0) >= rating);
    }

    res.status(200).json({
      message: "Vendors search completed successfully",
      vendors
    });
  } catch (error) {
    console.error("[UNIV] Error searching vendors:", error);
    res.status(500).json({
      message: "Error searching vendors",
      error: error.message
    });
  }
};

// Update university profile
exports.updateUniversityProfile = async (req, res) => {
  try {
    const universityId = req.user.id;
    const { name, email, phone, address, universityInfo } = req.body;

    const university = await User.findById(universityId);
    if (!university) {
      return res.status(404).json({ message: "University not found" });
    }

    // Update basic info
    if (name) university.name = name;
    if (email && email !== university.email) {
      const existingEmail = await User.findOne({ email });
      if (existingEmail && existingEmail._id.toString() !== universityId) {
        return res.status(400).json({ message: "Email already in use" });
      }
      university.email = email;
    }
    if (phone) university.phone = phone;
    if (address) university.address = address;

    // Update university-specific info
    if (universityInfo) {
      university.universityInfo = {
        ...university.universityInfo,
        ...universityInfo
      };
    }

    const updated = await university.save();
    console.log("[UNIV] Profile updated for:", universityId);

    res.status(200).json({
      message: "University profile updated successfully",
      university: {
        id: updated._id,
        name: updated.name,
        email: updated.email,
        phone: updated.phone,
        address: updated.address,
        universityInfo: updated.universityInfo
      }
    });
  } catch (error) {
    console.error("[UNIV] Error updating profile:", error);
    res.status(500).json({
      message: "Error updating university profile",
      error: error.message
    });
  }
};

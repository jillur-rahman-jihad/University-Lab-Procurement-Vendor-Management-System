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

// Search vendors with priority visibility for Premium Plan
exports.searchVendorsWithPriority = async (req, res) => {
  try {
    const userId = req.user.id;
    const { serviceType, name, rating } = req.query;

    // Check user's subscription plan
    const Subscription = require("../models/Subscription");
    let subscription = await Subscription.findOne({ userId, status: "active" });
    
    if (!subscription) {
      subscription = new Subscription({
        userId,
        plan: "free",
        status: "active",
        startDate: new Date()
      });
      await subscription.save();
    }

    const isPremium = subscription.plan === "premium";

    // Build filter
    let filter = { role: "vendor" };
    if (serviceType) {
      filter["vendorInfo.serviceType"] = serviceType;
    }
    if (name) {
      filter.name = { $regex: name, $options: "i" };
    }

    // Get all vendors
    let vendors = await User.find(filter)
      .select("name email phone vendorInfo createdAt")
      .sort({ createdAt: -1 });

    // Filter by rating if provided
    if (rating) {
      vendors = vendors.filter(v => (v.vendorInfo?.rating || 0) >= rating);
    }

    // For premium users, identify and prioritize vendors
    if (isPremium) {
      vendors = vendors.map(vendor => ({
        ...vendor.toObject(),
        isPriority: (vendor.vendorInfo?.rating || 0) >= 4.0 && vendor.vendorInfo?.isVerified,
        priorityScore: calculatePriorityScore(vendor)
      }));

      // Sort by priority score (premium vendors first)
      vendors.sort((a, b) => {
        if (b.priorityScore !== a.priorityScore) {
          return b.priorityScore - a.priorityScore;
        }
        return 0;
      });
    } else {
      // For free users, don't show priority info
      vendors = vendors.map(vendor => ({
        ...vendor.toObject(),
        isPriority: false,
        priorityScore: 0
      }));
    }

    res.status(200).json({
      message: "Vendor search with priority completed successfully",
      success: true,
      isPremium,
      count: vendors.length,
      vendors
    });
  } catch (error) {
    console.error("[UNIV] Error searching vendors with priority:", error);
    res.status(500).json({
      message: "Error searching vendors with priority",
      error: error.message
    });
  }
};

// Helper function to calculate vendor priority score
function calculatePriorityScore(vendor) {
  let score = 0;

  // Rating score (0-50 points)
  const rating = vendor.vendorInfo?.rating || 0;
  score += Math.min(rating * 10, 50);

  // Verification bonus (20 points)
  if (vendor.vendorInfo?.isVerified) {
    score += 20;
  }

  // Recency bonus (30 points for vendors created in last 90 days)
  const daysSinceCreation = (Date.now() - new Date(vendor.createdAt)) / (1000 * 60 * 60 * 24);
  if (daysSinceCreation <= 90) {
    score += 30 * (1 - daysSinceCreation / 90); // Decreasing bonus over time
  }

  return score;
}

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

exports.getUniversityProfile = async (req, res) => {
  try {
    const userId = req.user.id;

    const user = await User.findById(userId).select("-password");

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    if (user.role !== "university") {
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

    const labProject = await LabProject.findById(labProjectId);

    if (!labProject) {
      return res.status(404).json({ message: "Lab project not found" });
    }

    if (labProject.universityId.toString() !== universityId) {
      return res.status(403).json({ message: "Access denied. You do not own this project." });
    }

    const procurement = await Procurement.findOne({ labProjectId }).populate("quotationId");

    if (!procurement) {
      return res.status(404).json({ message: "No procurement record found for this project" });
    }

    const vendors = await User.find({ _id: { $in: procurement.selectedVendorIds } }).select("name email phone");

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

exports.downloadProcurementSummary = async (req, res) => {
  try {
    const { labProjectId } = req.params;
    const universityId = req.user.id;

    const labProject = await LabProject.findById(labProjectId);

    if (!labProject) {
      return res.status(404).json({ message: "Lab project not found" });
    }

    if (labProject.universityId.toString() !== universityId) {
      return res.status(403).json({ message: "Access denied. You do not own this project." });
    }

    const procurement = await Procurement.findOne({ labProjectId }).populate("quotationId");

    if (!procurement) {
      return res.status(404).json({ message: "No procurement record found for this project" });
    }

    const vendors = await User.find({ _id: { $in: procurement.selectedVendorIds } }).select("name email phone");
    const university = await User.findById(universityId).select("name universityInfo");

    const escapeCSV = (value) => {
      if (value === null || value === undefined) return "";
      const strValue = String(value);
      if (strValue.includes(",") || strValue.includes('"') || strValue.includes("\n")) {
        return `"${strValue.replace(/"/g, '""')}"`;
      }
      return strValue;
    };

    let csv = "PROCUREMENT SUMMARY REPORT\n\n";
    csv += "PROJECT DETAILS\n";
    csv += `Lab Project,${escapeCSV(labProject.labName)}\n`;
    csv += `Lab Type,${escapeCSV(labProject.labType)}\n`;
    csv += `Project Status,${escapeCSV(labProject.status)}\n`;
    csv += `Created Date,${new Date(labProject.createdAt).toLocaleDateString()}\n\n`;

    csv += "UNIVERSITY DETAILS\n";
    csv += `University Name,${escapeCSV(university?.name)}\n`;
    csv += `University Department,${escapeCSV(university?.universityInfo?.department)}\n`;
    csv += `University Address,${escapeCSV(university?.universityInfo?.address)}\n`;
    csv += `Representative,${escapeCSV(university?.universityInfo?.representative?.name)}\n\n`;

    if (procurement.quotationId) {
      csv += "QUOTATION DETAILS\n";
      csv += `Total Price,$${procurement.quotationId.totalPrice?.toLocaleString() || "0"}\n`;
      csv += `Bulk Discount,$${procurement.quotationId.bulkDiscount?.toLocaleString() || "0"}\n`;
      csv += `Installation Included,${procurement.quotationId.installationIncluded ? "Yes" : "No"}\n`;
      csv += `Maintenance Included,${procurement.quotationId.maintenanceIncluded ? "Yes" : "No"}\n`;
      csv += `Quotation Status,${escapeCSV(procurement.quotationId.status)}\n\n`;
    }

    csv += "SELECTED VENDORS\n";
    csv += "Name,Email,Phone\n";
    vendors.forEach((vendor) => {
      csv += `${escapeCSV(vendor.name)},${escapeCSV(vendor.email)},${escapeCSV(vendor.phone)}\n`;
    });
    csv += "\n";

    if (procurement.acceptedComponents && procurement.acceptedComponents.length > 0) {
      csv += "ACCEPTED COMPONENTS\n";
      csv += "Category,Component Name,Unit Price,Quantity,Total,Warranty,Delivery Time\n";
      procurement.acceptedComponents.forEach((comp) => {
        const total = (comp.unitPrice || 0) * (comp.quantity || 0);
        csv += `${escapeCSV(comp.category)},${escapeCSV(comp.name)},${escapeCSV(comp.unitPrice)},${escapeCSV(comp.quantity)},${escapeCSV(total)},${escapeCSV(comp.warranty)},${escapeCSV(comp.deliveryTime)}\n`;
      });
      csv += "\n";
    }

    csv += "PROCUREMENT SUMMARY\n";
    csv += `Acceptance Type,${escapeCSV(procurement.acceptanceType)}\n`;
    csv += `Final Cost,$${procurement.finalCost?.toLocaleString() || "0"}\n`;
    csv += `Admin Approved,${procurement.approvedByAdmin ? "Yes" : "Pending"}\n`;
    csv += `Generated On,${new Date().toLocaleString()}\n`;

    res.setHeader("Content-Type", "text/csv");
    res.setHeader("Content-Disposition", `attachment; filename="procurement_${labProjectId}_${Date.now()}.csv"`);
    res.send(csv);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

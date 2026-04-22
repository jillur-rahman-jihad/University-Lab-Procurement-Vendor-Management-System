const Subscription = require("../models/Subscription");
const User = require("../models/User");
const Quotation = require("../models/Quotation");
const LabProject = require("../models/LabProject");

// Get user's current subscription
exports.getCurrentSubscription = async (req, res) => {
  try {
    const userId = req.user.id;
    
    let subscription = await Subscription.findOne({
      userId: userId,
      status: "active"
    });

    // If no active subscription, create default free plan
    if (!subscription) {
      subscription = new Subscription({
        userId: userId,
        plan: "free",
        status: "active",
        startDate: new Date(),
        endDate: null
      });
      await subscription.save();
    }

    res.json({
      success: true,
      subscription: {
        planType: subscription.plan,
        status: subscription.status,
        startDate: subscription.startDate,
        endDate: subscription.endDate,
        price: subscription.price
      }
    });
  } catch (err) {
    console.error("Error fetching subscription:", err);
    res.status(500).json({ error: "Failed to fetch subscription" });
  }
};

// Get plan limits and current usage
exports.getPlanLimits = async (req, res) => {
  try {
    const userId = req.user.id;
    
    // Get current subscription
    let subscription = await Subscription.findOne({
      userId: userId,
      status: "active"
    });

    if (!subscription) {
      subscription = new Subscription({
        userId: userId,
        plan: "free",
        status: "active",
        startDate: new Date()
      });
      await subscription.save();
    }

    const planType = subscription.plan;

    // Define plan limits
    const planLimits = {
      free: {
        maxLabProjects: 10,
        maxQuotationsPerProject: 10,
        maxVendorsPerRequest: 5,
        quotationValidityDays: 30,
        maxConsultantsToHire: 5,
        canDownloadPDF: false,
        canDownloadCSV: false,
        canDownloadReport: false
      },
      premium: {
        maxLabProjects: Infinity,
        maxQuotationsPerProject: Infinity,
        maxVendorsPerRequest: Infinity,
        quotationValidityDays: 90,
        maxConsultantsToHire: Infinity,
        canDownloadPDF: true,
        canDownloadCSV: true,
        canDownloadReport: true
      }
    };

    // Get all user's lab projects
    const labProjects = await LabProject.find({ universityId: userId });
    const projectIds = labProjects.map(p => p._id);

    // Count quotations per project (only non-expired)
    const quotationStats = {};
    for (const projectId of projectIds) {
      const count = await Quotation.countDocuments({
        labProjectId: projectId,
        $or: [
          { expiryDate: { $gt: new Date() } },
          { expiryDate: null }
        ]
      });
      quotationStats[projectId] = count;
    }

    res.json({
      success: true,
      currentPlan: planType,
      limits: planLimits[planType],
      quotationUsage: quotationStats
    });
  } catch (err) {
    console.error("Error fetching plan limits:", err);
    res.status(500).json({ error: "Failed to fetch plan limits" });
  }
};

// Check if user can create quotation (for free plan)
exports.canCreateQuotation = async (req, res) => {
  try {
    const userId = req.user.id;
    const { labProjectId, vendorCount } = req.body;

    // Get current subscription
    let subscription = await Subscription.findOne({
      userId: userId,
      status: "active"
    });

    if (!subscription) {
      subscription = new Subscription({
        userId: userId,
        plan: "free",
        status: "active",
        startDate: new Date()
      });
      await subscription.save();
    }

    const planType = subscription.plan;

    if (planType === "free") {
      // Check max quotations per project
      const quotationCount = await Quotation.countDocuments({
        labProjectId: labProjectId,
        $or: [
          { expiryDate: { $gt: new Date() } },
          { expiryDate: null }
        ]
      });

      if (quotationCount >= 10) {
        return res.json({
          success: false,
          allowed: false,
          reason: "quotation_limit_reached",
          message: "Free Plan allows maximum 10 active quotations per project",
          currentCount: quotationCount,
          limit: 10
        });
      }

      // Check max vendors per request
      if (vendorCount && vendorCount > 5) {
        return res.json({
          success: false,
          allowed: false,
          reason: "vendor_limit_exceeded",
          message: "Free Plan allows maximum 5 vendors per quotation request",
          requestedVendors: vendorCount,
          limit: 5
        });
      }
    }

    res.json({
      success: true,
      allowed: true,
      message: `You can create quotation (Plan: ${planType})`
    });
  } catch (err) {
    console.error("Error checking quotation creation:", err);
    res.status(500).json({ error: "Failed to check quotation limits" });
  }
};

// Upgrade subscription (Stub for future payment integration)
exports.upgradeSubscription = async (req, res) => {
  try {
    const userId = req.user.id;
    const { plan, paymentMethod, transactionId } = req.body;

    if (!["free", "premium"].includes(plan)) {
      return res.status(400).json({ error: "Invalid plan type" });
    }

    let subscription = await Subscription.findOne({ userId });

    if (!subscription) {
      subscription = new Subscription({
        userId,
        plan,
        paymentMethod,
        transactionId,
        startDate: new Date(),
        status: "active"
      });
    } else {
      subscription.plan = plan;
      subscription.paymentMethod = paymentMethod;
      subscription.transactionId = transactionId;
      subscription.startDate = new Date();
      
      if (plan === "premium") {
        const endDate = new Date();
        endDate.setMonth(endDate.getMonth() + 1);
        subscription.endDate = endDate;
      }
      
      subscription.status = "active";
    }

    await subscription.save();

    res.json({
      success: true,
      message: `Successfully upgraded to ${plan} plan`,
      subscription
    });
  } catch (err) {
    console.error("Error upgrading subscription:", err);
    res.status(500).json({ error: "Failed to upgrade subscription" });
  }
};

// Downgrade to free plan
exports.downgradeToFree = async (req, res) => {
  try {
    const userId = req.user.id;

    let subscription = await Subscription.findOne({ userId });

    if (!subscription) {
      subscription = new Subscription({
        userId,
        plan: "free",
        status: "active",
        startDate: new Date()
      });
    } else {
      subscription.plan = "free";
      subscription.endDate = null;
      subscription.paymentMethod = null;
      subscription.transactionId = null;
      subscription.status = "active";
    }

    await subscription.save();

    res.json({
      success: true,
      message: "Downgraded to free plan",
      subscription
    });
  } catch (err) {
    console.error("Error downgrading subscription:", err);
    res.status(500).json({ error: "Failed to downgrade subscription" });
  }
};

// Check if user can create lab project (for free plan)
exports.canCreateLabProject = async (req, res) => {
  try {
    const userId = req.user.id;

    // Get current subscription
    let subscription = await Subscription.findOne({
      userId: userId,
      status: "active"
    });

    if (!subscription) {
      subscription = new Subscription({
        userId: userId,
        plan: "free",
        status: "active",
        startDate: new Date()
      });
      await subscription.save();
    }

    const planType = subscription.plan;

    if (planType === "free") {
      // Check max lab projects
      const LabProject = require("../models/LabProject");
      const labProjectCount = await LabProject.countDocuments({
        universityId: userId
      });

      if (labProjectCount >= 10) {
        return res.json({
          success: false,
          allowed: false,
          reason: "lab_project_limit_reached",
          message: "Free Plan allows maximum 10 lab projects",
          currentCount: labProjectCount,
          limit: 10
        });
      }
    }

    res.json({
      success: true,
      allowed: true,
      message: `You can create lab project (Plan: ${planType})`
    });
  } catch (err) {
    console.error("Error checking lab project creation:", err);
    res.status(500).json({ error: "Failed to check lab project limits" });
  }
};

// Check if user can hire consultant of specific type (for free plan)
exports.canHireConsultantType = async (req, res) => {
  try {
    const userId = req.user.id;
    const { consultantId } = req.body;

    if (!consultantId) {
      return res.status(400).json({ error: "consultantId is required" });
    }

    // Get current subscription
    let subscription = await Subscription.findOne({
      userId: userId,
      status: "active"
    });

    if (!subscription) {
      subscription = new Subscription({
        userId: userId,
        plan: "free",
        status: "active",
        startDate: new Date()
      });
      await subscription.save();
    }

    const planType = subscription.plan;

    // Get consultant info
    const User = require("../models/User");
    const consultant = await User.findById(consultantId).select('consultantInfo.experienceLevel');

    if (!consultant) {
      return res.json({
        success: false,
        allowed: false,
        reason: "consultant_not_found",
        message: "Consultant not found"
      });
    }

    const consultantLevel = consultant.consultantInfo?.experienceLevel || 'General';

    // Free Plan restrictions
    if (planType === "free") {
      if (consultantLevel !== 'General') {
        return res.json({
          success: false,
          allowed: false,
          reason: "consultant_type_not_allowed",
          message: `Free Plan only allows hiring General consultants. This is a ${consultantLevel} consultant. Please upgrade to Premium Plan to hire ${consultantLevel} consultants.`,
          consultantType: consultantLevel,
          allowedTypes: ["General"],
          requiredPlan: "premium"
        });
      }

      // Still check max consultant limit for Free Plan
      const ConsultantAssignment = require("../models/ConsultantAssignment");
      const consultantCount = await ConsultantAssignment.countDocuments({
        universityId: userId,
        status: { $in: ["pending", "accepted", "active"] }
      });

      if (consultantCount >= 5) {
        return res.json({
          success: false,
          allowed: false,
          reason: "consultant_limit_reached",
          message: "Free Plan allows maximum 5 active consultant hires",
          currentCount: consultantCount,
          limit: 5
        });
      }
    }

    res.json({
      success: true,
      allowed: true,
      message: `You can hire this ${consultantLevel} consultant (Plan: ${planType})`,
      consultantType: consultantLevel,
      plan: planType
    });
  } catch (err) {
    console.error("Error checking consultant type hiring:", err);
    res.status(500).json({ error: "Failed to check consultant type hiring limits" });
  }
};

// Check if user can hire consultant (for free plan)
exports.canHireConsultant = async (req, res) => {
  try {
    const userId = req.user.id;

    // Get current subscription
    let subscription = await Subscription.findOne({
      userId: userId,
      status: "active"
    });

    if (!subscription) {
      subscription = new Subscription({
        userId: userId,
        plan: "free",
        status: "active",
        startDate: new Date()
      });
      await subscription.save();
    }

    const planType = subscription.plan;

    if (planType === "free") {
      // Check max consultants hired
      const ConsultantAssignment = require("../models/ConsultantAssignment");
      const consultantCount = await ConsultantAssignment.countDocuments({
        universityId: userId,
        status: { $in: ["pending", "accepted", "active"] }
      });

      if (consultantCount >= 5) {
        return res.json({
          success: false,
          allowed: false,
          reason: "consultant_limit_reached",
          message: "Free Plan allows maximum 5 active consultant hires",
          currentCount: consultantCount,
          limit: 5
        });
      }
    }

    res.json({
      success: true,
      allowed: true,
      message: `You can hire consultant (Plan: ${planType})`
    });
  } catch (err) {
    console.error("Error checking consultant hiring:", err);
    res.status(500).json({ error: "Failed to check consultant hiring limits" });
  }
};

// Get subscription history (for admin/billing)
exports.getSubscriptionHistory = async (req, res) => {
  try {
    const userId = req.user.id;

    const subscriptions = await Subscription.find({ userId }).sort({ createdAt: -1 });

    res.json({
      success: true,
      subscriptions
    });
  } catch (err) {
    console.error("Error fetching subscription history:", err);
    res.status(500).json({ error: "Failed to fetch subscription history" });
  }
};

// Check if user can access post-deployment support (Premium Plan only)
exports.canAccessPostDeploymentSupport = async (req, res) => {
  try {
    const userId = req.user.id;

    // Get current subscription
    let subscription = await Subscription.findOne({
      userId: userId,
      status: "active"
    });

    if (!subscription) {
      subscription = new Subscription({
        userId: userId,
        plan: "free",
        status: "active",
        startDate: new Date()
      });
      await subscription.save();
    }

    const planType = subscription.plan;

    if (planType !== "premium") {
      return res.json({
        success: false,
        allowed: false,
        reason: "premium_required",
        message: "Post-Deployment Support is only available on Premium Plan. Please upgrade to access this feature.",
        requiredPlan: "premium",
        plan: planType
      });
    }

    res.json({
      success: true,
      allowed: true,
      message: "You have access to Post-Deployment Support",
      plan: planType
    });
  } catch (err) {
    console.error("Error checking post-deployment support access:", err);
    res.status(500).json({ error: "Failed to check post-deployment support access" });
  }
};

// Check if user can access infrastructure optimization reports (Premium Plan only)
exports.canAccessInfrastructureOptimizationReports = async (req, res) => {
  try {
    const userId = req.user.id;

    // Get current subscription
    let subscription = await Subscription.findOne({
      userId: userId,
      status: "active"
    });

    if (!subscription) {
      subscription = new Subscription({
        userId: userId,
        plan: "free",
        status: "active",
        startDate: new Date()
      });
      await subscription.save();
    }

    const planType = subscription.plan;

    if (planType !== "premium") {
      return res.json({
        success: false,
        allowed: false,
        reason: "premium_required",
        message: "Infrastructure Optimization Reports are only available on Premium Plan. Please upgrade to access this feature.",
        requiredPlan: "premium",
        plan: planType
      });
    }

    res.json({
      success: true,
      allowed: true,
      message: "You have access to Infrastructure Optimization Reports",
      plan: planType
    });
  } catch (err) {
    console.error("Error checking infrastructure optimization reports access:", err);
    res.status(500).json({ error: "Failed to check infrastructure optimization reports access" });
  }
};

// Check if user can access priority vendor visibility (Premium Plan only)
exports.canAccessPriorityVendors = async (req, res) => {
  try {
    const userId = req.user.id;

    // Get current subscription
    let subscription = await Subscription.findOne({
      userId: userId,
      status: "active"
    });

    if (!subscription) {
      subscription = new Subscription({
        userId: userId,
        plan: "free",
        status: "active",
        startDate: new Date()
      });
      await subscription.save();
    }

    const planType = subscription.plan;

    if (planType !== "premium") {
      return res.json({
        success: false,
        allowed: false,
        reason: "premium_required",
        message: "Priority Vendor Visibility is only available on Premium Plan. Please upgrade to access this feature.",
        requiredPlan: "premium",
        plan: planType
      });
    }

    res.json({
      success: true,
      allowed: true,
      message: "You have access to Priority Vendor Visibility",
      plan: planType
    });
  } catch (err) {
    console.error("Error checking priority vendor visibility access:", err);
    res.status(500).json({ error: "Failed to check priority vendor visibility access" });
  }
};

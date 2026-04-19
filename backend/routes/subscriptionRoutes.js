const express = require("express");
const subscriptionController = require("../controllers/subscriptionController");
const authMiddleware = require("../middleware/authMiddleware");

const router = express.Router();

// All routes require authentication
router.use(authMiddleware);

// Get current subscription
router.get("/current", subscriptionController.getCurrentSubscription);

// Get plan limits and usage
router.get("/limits", subscriptionController.getPlanLimits);

// Check if user can create quotation
router.post("/check-quotation", subscriptionController.canCreateQuotation);

// Check if user can create lab project
router.post("/check-lab-project", subscriptionController.canCreateLabProject);

// Check if user can hire consultant
router.post("/check-consultant-hire", subscriptionController.canHireConsultant);

// Check if user can hire specific consultant type
router.post("/check-consultant-type", subscriptionController.canHireConsultantType);

// Check if user can access post-deployment support (Premium Plan only)
router.get("/check-post-deployment-support", subscriptionController.canAccessPostDeploymentSupport);

// Upgrade subscription
router.post("/upgrade", subscriptionController.upgradeSubscription);

// Downgrade to free
router.post("/downgrade", subscriptionController.downgradeToFree);

// Get subscription history
router.get("/history", subscriptionController.getSubscriptionHistory);

module.exports = router;

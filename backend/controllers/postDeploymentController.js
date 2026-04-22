const PostDeploymentSupport = require('../models/PostDeploymentSupport');
const LabProject = require('../models/LabProject');
const User = require('../models/User');
const Subscription = require('../models/Subscription');

// ================= CREATE SUPPORT REQUEST =================
exports.createSupportRequest = async (req, res) => {
  try {
    const userId = req.user.id;
    const { labProjectId, title, description, category, priority, affectedComponents } = req.body;

    // Validate required fields
    if (!labProjectId || !title || !description || !category) {
      return res.status(400).json({
        success: false,
        message: 'Missing required fields: labProjectId, title, description, category'
      });
    }

    // Check subscription - Premium Plan only
    let subscription = await Subscription.findOne({
      userId: userId,
      status: 'active'
    });

    if (!subscription) {
      return res.json({
        success: false,
        allowed: false,
        message: 'Free Plan does not include Post-Deployment Support. Please upgrade to Premium Plan.'
      });
    }

    if (subscription.plan !== 'premium') {
      return res.json({
        success: false,
        allowed: false,
        message: 'Post-Deployment Support is only available on Premium Plan.'
      });
    }

    // Verify lab project ownership
    const labProject = await LabProject.findById(labProjectId).populate('universityId', 'name');

    if (!labProject) {
      return res.status(404).json({
        success: false,
        message: 'Lab project not found'
      });
    }

    if (labProject.universityId._id.toString() !== userId) {
      return res.status(403).json({
        success: false,
        message: 'You do not have access to this lab project'
      });
    }

    // Create support request
    const supportRequest = new PostDeploymentSupport({
      universityId: userId,
      labProjectId: labProjectId,
      title: title.trim(),
      description: description.trim(),
      category: category,
      priority: priority || 'medium',
      affectedComponents: affectedComponents || [],
      labProjectName: labProject.name,
      universityName: labProject.universityId.name,
      activities: [
        {
          type: 'status_change',
          author: userId,
          message: 'Support request created',
          timestamp: new Date()
        }
      ]
    });

    await supportRequest.save();

    res.status(201).json({
      success: true,
      message: 'Support request created successfully',
      request: supportRequest
    });
  } catch (error) {
    console.error('Error creating support request:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to create support request',
      error: error.message
    });
  }
};

// ================= GET USER'S SUPPORT REQUESTS =================
exports.getUserSupportRequests = async (req, res) => {
  try {
    const userId = req.user.id;
    const { status, priority, labProjectId } = req.query;

    // Build filter
    let filter = { universityId: userId };
    if (status) filter.status = status;
    if (priority) filter.priority = priority;
    if (labProjectId) filter.labProjectId = labProjectId;

    const requests = await PostDeploymentSupport.find(filter)
      .populate('labProjectId', 'name status')
      .populate('assignedTo', 'name email')
      .sort({ createdAt: -1 });

    // Calculate statistics
    const stats = {
      total: requests.length,
      open: requests.filter(r => r.status === 'open').length,
      inProgress: requests.filter(r => r.status === 'in-progress').length,
      resolved: requests.filter(r => r.status === 'resolved').length,
      closed: requests.filter(r => r.status === 'closed').length
    };

    res.json({
      success: true,
      requests: requests,
      statistics: stats
    });
  } catch (error) {
    console.error('Error fetching support requests:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch support requests',
      error: error.message
    });
  }
};

// ================= GET SUPPORT REQUEST DETAILS =================
exports.getSupportRequestDetails = async (req, res) => {
  try {
    const { requestId } = req.params;
    const userId = req.user.id;

    const request = await PostDeploymentSupport.findById(requestId)
      .populate('universityId', 'name email')
      .populate('labProjectId', 'name description')
      .populate('assignedTo', 'name email phone')
      .populate('activities.author', 'name email');

    if (!request) {
      return res.status(404).json({
        success: false,
        message: 'Support request not found'
      });
    }

    // Check if user has access
    if (request.universityId._id.toString() !== userId) {
      return res.status(403).json({
        success: false,
        message: 'You do not have access to this support request'
      });
    }

    res.json({
      success: true,
      request: request
    });
  } catch (error) {
    console.error('Error fetching support request details:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch support request',
      error: error.message
    });
  }
};

// ================= ADD ACTIVITY/COMMENT =================
exports.addActivity = async (req, res) => {
  try {
    const { requestId } = req.params;
    const userId = req.user.id;
    const { message, type } = req.body;

    if (!message) {
      return res.status(400).json({
        success: false,
        message: 'Message is required'
      });
    }

    const request = await PostDeploymentSupport.findById(requestId);

    if (!request) {
      return res.status(404).json({
        success: false,
        message: 'Support request not found'
      });
    }

    // Verify ownership
    if (request.universityId.toString() !== userId) {
      return res.status(403).json({
        success: false,
        message: 'You do not have access to this support request'
      });
    }

    // Add activity
    request.activities.push({
      type: type || 'comment',
      author: userId,
      message: message.trim(),
      timestamp: new Date()
    });

    // Update response time if first response from support team
    if (!request.responseTime && request.activities.length > 1) {
      request.responseTime = new Date();
    }

    await request.save();
    await request.populate('activities.author', 'name email');

    res.json({
      success: true,
      message: 'Activity added successfully',
      request: request
    });
  } catch (error) {
    console.error('Error adding activity:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to add activity',
      error: error.message
    });
  }
};

// ================= UPDATE STATUS =================
exports.updateStatus = async (req, res) => {
  try {
    const { requestId } = req.params;
    const userId = req.user.id;
    const { newStatus, resolution } = req.body;

    if (!newStatus) {
      return res.status(400).json({
        success: false,
        message: 'Status is required'
      });
    }

    const validStatuses = ['open', 'in-progress', 'resolved', 'closed', 'on-hold'];
    if (!validStatuses.includes(newStatus)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid status'
      });
    }

    const request = await PostDeploymentSupport.findById(requestId);

    if (!request) {
      return res.status(404).json({
        success: false,
        message: 'Support request not found'
      });
    }

    // Verify ownership
    if (request.universityId.toString() !== userId) {
      return res.status(403).json({
        success: false,
        message: 'You do not have access to this support request'
      });
    }

    const oldStatus = request.status;
    request.status = newStatus;

    if (resolution && newStatus === 'resolved') {
      request.resolution = resolution.trim();
      request.actualResolutionTime = new Date();
    }

    // Add activity
    request.activities.push({
      type: 'status_change',
      author: userId,
      message: `Status changed from ${oldStatus} to ${newStatus}`,
      timestamp: new Date()
    });

    await request.save();

    res.json({
      success: true,
      message: 'Status updated successfully',
      request: request
    });
  } catch (error) {
    console.error('Error updating status:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update status',
      error: error.message
    });
  }
};

// ================= CHECK IF USER CAN ACCESS POST-DEPLOYMENT SUPPORT =================
exports.checkPostDeploymentAccess = async (req, res) => {
  try {
    const userId = req.user.id;

    // Get current subscription
    let subscription = await Subscription.findOne({
      userId: userId,
      status: 'active'
    });

    if (!subscription) {
      subscription = new Subscription({
        userId: userId,
        plan: 'free',
        status: 'active',
        startDate: new Date()
      });
      await subscription.save();
    }

    const planType = subscription.plan;

    if (planType !== 'premium') {
      return res.json({
        success: false,
        allowed: false,
        reason: 'premium_required',
        message: 'Post-Deployment Support is only available on Premium Plan',
        requiredPlan: 'premium',
        plan: planType
      });
    }

    res.json({
      success: true,
      allowed: true,
      message: 'You have access to Post-Deployment Support',
      plan: planType
    });
  } catch (err) {
    console.error('Error checking post-deployment access:', err);
    res.status(500).json({
      success: false,
      message: 'Failed to check access',
      error: err.message
    });
  }
};

// ================= GET SUPPORT STATISTICS =================
exports.getSupportStatistics = async (req, res) => {
  try {
    const userId = req.user.id;

    const requests = await PostDeploymentSupport.find({ universityId: userId });

    const stats = {
      total: requests.length,
      byStatus: {
        open: requests.filter(r => r.status === 'open').length,
        inProgress: requests.filter(r => r.status === 'in-progress').length,
        resolved: requests.filter(r => r.status === 'resolved').length,
        closed: requests.filter(r => r.status === 'closed').length,
        onHold: requests.filter(r => r.status === 'on-hold').length
      },
      byPriority: {
        low: requests.filter(r => r.priority === 'low').length,
        medium: requests.filter(r => r.priority === 'medium').length,
        high: requests.filter(r => r.priority === 'high').length,
        critical: requests.filter(r => r.priority === 'critical').length
      },
      averageResolutionTime: calculateAverageResolutionTime(
        requests.filter(r => r.actualResolutionTime)
      )
    };

    res.json({
      success: true,
      statistics: stats
    });
  } catch (error) {
    console.error('Error getting support statistics:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get statistics',
      error: error.message
    });
  }
};

// Helper function to calculate average resolution time
function calculateAverageResolutionTime(requests) {
  if (requests.length === 0) return null;

  const totalTime = requests.reduce((sum, req) => {
    return sum + (req.actualResolutionTime - req.createdAt);
  }, 0);

  const averageMs = totalTime / requests.length;
  const averageDays = Math.round(averageMs / (1000 * 60 * 60 * 24) * 100) / 100;

  return averageDays;
}

module.exports = exports;

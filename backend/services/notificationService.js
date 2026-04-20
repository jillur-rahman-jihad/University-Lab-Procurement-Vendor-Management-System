const Notification = require("../models/Notification");
const User = require("../models/User");
const emailService = require("./emailService");

/**
 * Notification Service
 * Centralized notification creation and management
 */

/**
 * Create and send notification to single user
 * @param {Object} params - Notification parameters
 * @param {string} params.userId - User ID to notify
 * @param {string} params.type - Notification type (quotation|consultant|deadline|approval|subscription)
 * @param {string} params.category - Detailed category
 * @param {string} params.message - Notification message
 * @param {Object} params.referenceData - Related resource info
 * @param {string} params.actionUrl - Deep link to action
 * @param {boolean} params.sendEmail - Send email notification (default: true)
 * @param {string} params.priority - Priority level (low|normal|high)
 * @returns {Promise<Object>} Created notification
 */
async function createNotification(params) {
  try {
    const {
      userId,
      relatedUserId,
      type,
      category,
      message,
      referenceData,
      actionUrl,
      sendEmail = true,
      priority = "normal"
    } = params;

    if (!userId || !type || !message) {
      throw new Error("Missing required fields: userId, type, message");
    }

    const notification = new Notification({
      userId,
      relatedUserId,
      type,
      category: category || type,
      message,
      referenceData,
      actionUrl,
      priority,
      deliveryChannels: {
        inApp: {
          sent: true,
          sentAt: new Date()
        },
        email: {
          sent: false,
          sentAt: null,
          retryCount: 0
        }
      }
    });

    await notification.save();

    // Send email asynchronously (non-blocking)
    if (sendEmail) {
      sendNotificationEmail(notification).catch(err => {
        console.error(`[NOTIFICATION] Email send failed for notification ${notification._id}:`, err.message);
      });
    }

    return notification;
  } catch (error) {
    console.error("[NOTIFICATION] Error creating notification:", error.message);
    throw error;
  }
}

/**
 * Notify multiple users
 * @param {Array<string>} userIds - Array of user IDs
 * @param {Object} notificationParams - Same as createNotification params (except userId)
 * @returns {Promise<Array>} Array of created notifications
 */
async function notifyUsers(userIds, notificationParams) {
  try {
    if (!Array.isArray(userIds) || userIds.length === 0) {
      throw new Error("userIds must be a non-empty array");
    }

    const notifications = await Promise.all(
      userIds.map(userId =>
        createNotification({
          ...notificationParams,
          userId,
          sendEmail: notificationParams.sendEmail !== false
        })
      )
    );

    return notifications;
  } catch (error) {
    console.error("[NOTIFICATION] Error notifying multiple users:", error.message);
    throw error;
  }
}

/**
 * Send email for notification
 * @param {Object} notification - Notification document
 * @returns {Promise<boolean>}
 */
async function sendNotificationEmail(notification) {
  try {
    // Fetch user with email
    const user = await User.findById(notification.userId).select("email name universityInfo vendorInfo consultantInfo");

    if (!user || !user.email) {
      console.warn(`[NOTIFICATION] No email found for user ${notification.userId}`);
      return false;
    }

    // Get user's display name based on role
    let displayName = user.name;
    if (user.universityInfo?.universityName) {
      displayName = user.universityInfo.universityName;
    } else if (user.vendorInfo?.shopName) {
      displayName = user.vendorInfo.shopName;
    }

    // Determine email template based on type
    const emailTemplate = getEmailTemplate(notification.type, notification.message, displayName, notification.actionUrl);

    // Send email
    const emailSent = await emailService.sendNotificationEmail(
      user.email,
      emailTemplate.subject,
      emailTemplate.html
    );

    if (emailSent) {
      // Update notification with email sent status
      notification.deliveryChannels.email.sent = true;
      notification.deliveryChannels.email.sentAt = new Date();
      await notification.save();
      return true;
    }

    return false;
  } catch (error) {
    console.error("[NOTIFICATION] Error in sendNotificationEmail:", error.message);
    return false;
  }
}

/**
 * Get email template based on notification type
 * @param {string} type - Notification type
 * @param {string} message - Notification message
 * @param {string} displayName - User/organization name
 * @param {string} actionUrl - Action URL
 * @returns {Object} Email template with subject and html
 */
function getEmailTemplate(type, message, displayName, actionUrl) {
  const templates = {
    quotation: {
      subject: "New Vendor Quotation Received",
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #2563eb;">New Quotation Submission</h2>
          <p>Dear ${displayName},</p>
          <p style="line-height: 1.6;">${message}</p>
          <div style="background-color: #f3f4f6; padding: 20px; border-radius: 8px; margin: 20px 0;">
            <p style="margin: 0;"><strong>Action:</strong> Log in to your dashboard to review and compare quotations.</p>
          </div>
          <p style="color: #666; font-size: 14px;">This is an automated notification from University Lab Procurement Management System.</p>
        </div>
      `
    },
    consultant: {
      subject: "Consultant Feedback on Your Lab Project",
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #2563eb;">Consultant Response</h2>
          <p>Dear ${displayName},</p>
          <p style="line-height: 1.6;">${message}</p>
          <div style="background-color: #f3f4f6; padding: 20px; border-radius: 8px; margin: 20px 0;">
            <p style="margin: 0;"><strong>Action:</strong> Review the consultant's suggestions and feedback.</p>
          </div>
          <p style="color: #666; font-size: 14px;">This is an automated notification from University Lab Procurement Management System.</p>
        </div>
      `
    },
    deadline: {
      subject: "Quotation Deadline Reminder",
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #f59e0b;">⏰ Deadline Reminder</h2>
          <p>Dear ${displayName},</p>
          <p style="line-height: 1.6;">${message}</p>
          <div style="background-color: #fef3c7; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #f59e0b;">
            <p style="margin: 0;"><strong>Take action now:</strong> Don't miss this deadline!</p>
          </div>
          <p style="color: #666; font-size: 14px;">This is an automated notification from University Lab Procurement Management System.</p>
        </div>
      `
    },
    approval: {
      subject: "Procurement Status Update",
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #10b981;">✓ Status Update</h2>
          <p>Dear ${displayName},</p>
          <p style="line-height: 1.6;">${message}</p>
          <div style="background-color: #ecfdf5; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #10b981;">
            <p style="margin: 0;"><strong>Update:</strong> Your procurement status has changed.</p>
          </div>
          <p style="color: #666; font-size: 14px;">This is an automated notification from University Lab Procurement Management System.</p>
        </div>
      `
    },
    subscription: {
      subject: "Subscription Expiry Notice",
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #ef4444;">📋 Subscription Alert</h2>
          <p>Dear ${displayName},</p>
          <p style="line-height: 1.6;">${message}</p>
          <div style="background-color: #fee2e2; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #ef4444;">
            <p style="margin: 0;"><strong>Action required:</strong> Renew your subscription to maintain access.</p>
          </div>
          <p style="color: #666; font-size: 14px;">This is an automated notification from University Lab Procurement Management System.</p>
        </div>
      `
    }
  };

  return templates[type] || templates.quotation;
}

/**
 * Get user's notifications
 * @param {string} userId - User ID
 * @param {Object} options - Query options
 * @param {boolean} options.unreadOnly - Only unread notifications
 * @param {string} options.type - Filter by type
 * @param {number} options.limit - Number of notifications to fetch
 * @param {number} options.skip - Number of notifications to skip
 * @returns {Promise<Array>} Array of notifications
 */
async function getUserNotifications(userId, options = {}) {
  try {
    const {
      unreadOnly = false,
      type = null,
      limit = 20,
      skip = 0
    } = options;

    let query = { userId };

    if (unreadOnly) {
      query.isRead = false;
    }

    if (type) {
      query.type = type;
    }

    const notifications = await Notification.find(query)
      .sort({ createdAt: -1 })
      .limit(limit)
      .skip(skip);

    return notifications;
  } catch (error) {
    console.error("[NOTIFICATION] Error fetching user notifications:", error.message);
    throw error;
  }
}

/**
 * Get unread notification count for user
 * @param {string} userId - User ID
 * @returns {Promise<number>} Count of unread notifications
 */
async function getUnreadCount(userId) {
  try {
    const count = await Notification.countDocuments({
      userId,
      isRead: false
    });
    return count;
  } catch (error) {
    console.error("[NOTIFICATION] Error getting unread count:", error.message);
    throw error;
  }
}

/**
 * Mark notification as read
 * @param {string} notificationId - Notification ID
 * @returns {Promise<Object>} Updated notification
 */
async function markAsRead(notificationId) {
  try {
    const notification = await Notification.findByIdAndUpdate(
      notificationId,
      { isRead: true },
      { new: true }
    );

    if (!notification) {
      throw new Error("Notification not found");
    }

    return notification;
  } catch (error) {
    console.error("[NOTIFICATION] Error marking as read:", error.message);
    throw error;
  }
}

/**
 * Mark all notifications as read for user
 * @param {string} userId - User ID
 * @returns {Promise<Object>} Update result
 */
async function markAllAsRead(userId) {
  try {
    const result = await Notification.updateMany(
      { userId, isRead: false },
      { isRead: true }
    );

    return result;
  } catch (error) {
    console.error("[NOTIFICATION] Error marking all as read:", error.message);
    throw error;
  }
}

/**
 * Delete notification
 * @param {string} notificationId - Notification ID
 * @returns {Promise<boolean>}
 */
async function deleteNotification(notificationId) {
  try {
    const result = await Notification.findByIdAndDelete(notificationId);
    return !!result;
  } catch (error) {
    console.error("[NOTIFICATION] Error deleting notification:", error.message);
    throw error;
  }
}

/**
 * Clear all notifications for user (optional soft delete)
 * @param {string} userId - User ID
 * @returns {Promise<Object>} Delete result
 */
async function clearUserNotifications(userId) {
  try {
    const result = await Notification.deleteMany({ userId });
    return result;
  } catch (error) {
    console.error("[NOTIFICATION] Error clearing notifications:", error.message);
    throw error;
  }
}

module.exports = {
  createNotification,
  notifyUsers,
  sendNotificationEmail,
  getUserNotifications,
  getUnreadCount,
  markAsRead,
  markAllAsRead,
  deleteNotification,
  clearUserNotifications
};

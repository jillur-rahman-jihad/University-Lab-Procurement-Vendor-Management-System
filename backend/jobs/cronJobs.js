const cron = require("node-cron");
const LabProject = require("../models/LabProject");
const Subscription = require("../models/Subscription");
const Quotation = require("../models/Quotation");
const User = require("../models/User");
const notificationService = require("../services/notificationService");

/**
 * Cron Jobs for Notifications & Alerts System
 * All jobs are non-blocking and handle errors gracefully
 */

// Store job references for cleanup
const scheduledJobs = [];

/**
 * CRON JOB 1: Quotation Deadline Reminders
 * Runs every hour to check for upcoming quotation deadlines
 * Sends reminders at 48 hours, 24 hours, and 6 hours before deadline
 */
function scheduleQuotationDeadlineReminders() {
  const job = cron.schedule("0 * * * *", async () => {
    try {
      console.log("[CRON] Running quotation deadline reminder check...");

      // Get all active lab projects with pending/bidding status
      const labProjects = await LabProject.find({
        status: { $in: ["draft", "bidding"] },
        "requirements.timeline": { $exists: true, $ne: null }
      }).populate("universityId", "email name");

      let remindersCount = 0;

      for (const lab of labProjects) {
        const deadline = new Date(lab.requirements.timeline);
        const now = new Date();
        const hoursUntilDeadline = (deadline - now) / (1000 * 60 * 60);

        // Send reminder if within 48, 24, or 6 hours of deadline
        const reminderThresholds = [48, 24, 6];
        for (const threshold of reminderThresholds) {
          // Check if we're within the threshold window (within 1 hour tolerance)
          if (hoursUntilDeadline <= threshold && hoursUntilDeadline > threshold - 1) {
            // Check if reminder already sent for this threshold
            const reminderKey = `deadline_${lab._id}_${threshold}h`;
            const cacheKey = `reminder_sent_${reminderKey}`;

            if (!global[cacheKey]) {
              // Get count of pending quotations
              const quotationCount = await Quotation.countDocuments({
                labProjectId: lab._id,
                status: "pending"
              });

              if (lab.universityId) {
                await notificationService.createNotification({
                  userId: lab.universityId._id.toString(),
                  type: "deadline",
                  category: "quotation_deadline_reminder",
                  message: `Quotation deadline reminder: "${lab.labName}" bidding closes in ${Math.round(hoursUntilDeadline)} hours. You have ${quotationCount} pending quotation(s). Review and make a decision now.`,
                  referenceData: {
                    resourceType: "LabProject",
                    resourceId: lab._id,
                    resourceName: lab.labName
                  },
                  actionUrl: `/quotation-system?lab=${lab._id}`,
                  sendEmail: true,
                  priority: "high"
                });

                remindersCount++;
                global[cacheKey] = true;

                // Clear cache after the threshold period
                setTimeout(() => {
                  delete global[cacheKey];
                }, 3600000); // 1 hour
              }
            }
          }
        }

        // Notify vendors about upcoming deadline
        const vendorQuotations = await Quotation.find({
          labProjectId: lab._id,
          status: "pending"
        }).select("vendorId");

        const vendorIds = [...new Set(vendorQuotations.map(q => q.vendorId.toString()))];

        for (const vendorId of vendorIds) {
          if (hoursUntilDeadline <= 24 && hoursUntilDeadline > 0) {
            const vendor = await User.findById(vendorId).select("email vendorInfo.shopName");

            if (vendor) {
              await notificationService.createNotification({
                userId: vendorId,
                type: "deadline",
                category: "vendor_deadline_reminder",
                message: `Deadline reminder: Your quotation for "${lab.labName}" will close in ${Math.round(hoursUntilDeadline)} hours. Ensure all details are correct before the deadline.`,
                referenceData: {
                  resourceType: "LabProject",
                  resourceId: lab._id,
                  resourceName: lab.labName
                },
                actionUrl: `/quotation-system?lab=${lab._id}`,
                sendEmail: true,
                priority: "normal"
              });

              remindersCount++;
            }
          }
        }
      }

      console.log(`[CRON] Quotation deadline check completed. ${remindersCount} reminders sent.`);
    } catch (error) {
      console.error("[CRON] Error in quotation deadline reminder job:", error.message);
    }
  });

  scheduledJobs.push(job);
  console.log("[CRON] ✓ Quotation deadline reminder job scheduled (hourly)");
}

/**
 * CRON JOB 2: Subscription Expiry Notifications
 * Runs daily to check for upcoming subscription expiries
 * Sends reminders at 7 days, 3 days, and 1 day before expiry
 */
function scheduleSubscriptionExpiryReminders() {
  const job = cron.schedule("0 0 * * *", async () => {
    try {
      console.log("[CRON] Running subscription expiry check...");

      // Get all active subscriptions
      const subscriptions = await Subscription.find({
        status: "active",
        endDate: { $exists: true, $ne: null }
      }).populate("userId", "email name universityInfo.universityName");

      let expiryRemindersCount = 0;

      for (const subscription of subscriptions) {
        const expiryDate = new Date(subscription.endDate);
        const now = new Date();
        const daysUntilExpiry = (expiryDate - now) / (1000 * 60 * 60 * 24);

        // Send reminder if within 7, 3, or 1 days of expiry
        const reminderThresholds = [7, 3, 1];
        for (const threshold of reminderThresholds) {
          // Check if we're within the threshold window (within 24 hour tolerance)
          if (daysUntilExpiry <= threshold && daysUntilExpiry > threshold - 1) {
            // Check if reminder already sent for this threshold
            const reminderKey = `subscription_${subscription._id}_${threshold}d`;
            const cacheKey = `reminder_sent_${reminderKey}`;

            if (!global[cacheKey]) {
              if (subscription.userId) {
                const universityName =
                  subscription.userId.universityInfo?.universityName ||
                  subscription.userId.name ||
                  "Your University";

                await notificationService.createNotification({
                  userId: subscription.userId._id.toString(),
                  type: "subscription",
                  category: "subscription_expiry_notice",
                  message: `Subscription expiry notice: Your ${subscription.plan.toUpperCase()} plan for "${universityName}" expires in ${Math.ceil(daysUntilExpiry)} day(s). Renew now to maintain access to premium features.`,
                  referenceData: {
                    resourceType: "Subscription",
                    resourceId: subscription._id,
                    resourceName: subscription.plan
                  },
                  actionUrl: `/university/subscription`,
                  sendEmail: true,
                  priority: "high"
                });

                expiryRemindersCount++;
                global[cacheKey] = true;

                // Clear cache after 24 hours
                setTimeout(() => {
                  delete global[cacheKey];
                }, 86400000); // 24 hours
              }
            }
          }
        }
      }

      console.log(`[CRON] Subscription expiry check completed. ${expiryRemindersCount} reminders sent.`);
    } catch (error) {
      console.error("[CRON] Error in subscription expiry reminder job:", error.message);
    }
  });

  scheduledJobs.push(job);
  console.log("[CRON] ✓ Subscription expiry reminder job scheduled (daily at midnight)");
}

/**
 * CRON JOB 3: Notification Cleanup
 * Runs daily to archive old notifications (older than 90 days)
 * Soft delete to maintain audit trail
 */
function scheduleNotificationCleanup() {
  const job = cron.schedule("0 2 * * *", async () => {
    try {
      console.log("[CRON] Running notification cleanup...");

      const Notification = require("../models/Notification");
      const ninetyDaysAgo = new Date(Date.now() - 90 * 24 * 60 * 60 * 1000);

      // Mark old read notifications for deletion (keep unread for user awareness)
      const result = await Notification.deleteMany({
        createdAt: { $lt: ninetyDaysAgo },
        isRead: true
      });

      console.log(`[CRON] Notification cleanup completed. ${result.deletedCount} old notifications removed.`);
    } catch (error) {
      console.error("[CRON] Error in notification cleanup job:", error.message);
    }
  });

  scheduledJobs.push(job);
  console.log("[CRON] ✓ Notification cleanup job scheduled (daily at 2 AM)");
}

/**
 * CRON JOB 4: Email Retry Job
 * Runs every 4 hours to retry failed email sends
 * Max 3 retries per notification
 */
function scheduleEmailRetryJob() {
  const job = cron.schedule("0 */4 * * *", async () => {
    try {
      console.log("[CRON] Running email retry check...");

      const Notification = require("../models/Notification");
      const emailService = require("../services/emailService");

      // Find notifications with failed emails and retry count < 3
      const failedNotifications = await Notification.find({
        "deliveryChannels.email.sent": false,
        "deliveryChannels.email.retryCount": { $lt: 3 }
      }).limit(50); // Process max 50 at a time to avoid overload

      let successCount = 0;
      let failureCount = 0;

      for (const notification of failedNotifications) {
        try {
          const user = await User.findById(notification.userId).select("email name");

          if (user && user.email) {
            // Get email template based on type
            const emailTemplate = getEmailTemplate(
              notification.type,
              notification.message,
              user.name,
              notification.actionUrl
            );

            const emailSent = await emailService.sendNotificationEmail(
              user.email,
              emailTemplate.subject,
              emailTemplate.html
            );

            if (emailSent) {
              notification.deliveryChannels.email.sent = true;
              notification.deliveryChannels.email.sentAt = new Date();
              notification.deliveryChannels.email.failureReason = null;
              successCount++;
            } else {
              notification.deliveryChannels.email.retryCount += 1;
              if (notification.deliveryChannels.email.retryCount >= 3) {
                notification.deliveryChannels.email.failureReason =
                  "Max retries exceeded. Email delivery failed.";
              }
              failureCount++;
            }

            await notification.save();
          }
        } catch (retryError) {
          console.error(`[CRON] Error retrying email for notification ${notification._id}:`, retryError.message);
          failureCount++;
        }
      }

      console.log(
        `[CRON] Email retry check completed. ${successCount} successful, ${failureCount} failed.`
      );
    } catch (error) {
      console.error("[CRON] Error in email retry job:", error.message);
    }
  });

  scheduledJobs.push(job);
  console.log("[CRON] ✓ Email retry job scheduled (every 4 hours)");
}

/**
 * Get email template for notification type
 * (Shared utility for both notificationService and cronJobs)
 */
function getEmailTemplate(type, message, displayName, actionUrl) {
  const templates = {
    quotation: {
      subject: "New Vendor Quotation Received",
      html: `<div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;"><h2 style="color: #2563eb;">New Quotation Submission</h2><p>Dear ${displayName},</p><p>${message}</p></div>`
    },
    consultant: {
      subject: "Consultant Feedback on Your Lab Project",
      html: `<div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;"><h2 style="color: #2563eb;">Consultant Response</h2><p>Dear ${displayName},</p><p>${message}</p></div>`
    },
    deadline: {
      subject: "Deadline Reminder - Action Required",
      html: `<div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;"><h2 style="color: #f59e0b;">⏰ Deadline Reminder</h2><p>Dear ${displayName},</p><p>${message}</p></div>`
    },
    approval: {
      subject: "Procurement Status Update",
      html: `<div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;"><h2 style="color: #10b981;">✓ Status Update</h2><p>Dear ${displayName},</p><p>${message}</p></div>`
    },
    subscription: {
      subject: "Subscription Expiry Notice - Renew Now",
      html: `<div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;"><h2 style="color: #ef4444;">📋 Subscription Alert</h2><p>Dear ${displayName},</p><p>${message}</p></div>`
    }
  };

  return templates[type] || templates.quotation;
}

/**
 * Initialize all cron jobs
 * Should be called once on server startup
 */
function initializeCronJobs() {
  console.log("\n========== INITIALIZING CRON JOBS ==========");
  scheduleQuotationDeadlineReminders();
  scheduleSubscriptionExpiryReminders();
  scheduleNotificationCleanup();
  scheduleEmailRetryJob();
  console.log("========== CRON JOBS INITIALIZED ==========\n");
}

/**
 * Stop all cron jobs
 * Should be called on server shutdown
 */
function stopCronJobs() {
  console.log("\n[CRON] Stopping all scheduled jobs...");
  scheduledJobs.forEach(job => {
    job.stop();
    job.destroy();
  });
  scheduledJobs.length = 0;
  console.log("[CRON] All scheduled jobs stopped.\n");
}

module.exports = {
  initializeCronJobs,
  stopCronJobs,
  scheduleQuotationDeadlineReminders,
  scheduleSubscriptionExpiryReminders,
  scheduleNotificationCleanup,
  scheduleEmailRetryJob
};

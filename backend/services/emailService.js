const nodemailer = require("nodemailer");

/**
 * Email Service
 * Handles all email delivery with Nodemailer
 */

// Create reusable transporter
let transporter = null;

/**
 * Initialize email transporter
 * Supports Gmail, SMTP, or other services
 */
function initializeTransporter() {
  if (transporter) {
    return transporter;
  }

  // Use environment variables for secure configuration
  const emailConfig = {
    service: process.env.EMAIL_SERVICE || "gmail",
    host: process.env.EMAIL_HOST,
    port: process.env.EMAIL_PORT || 587,
    secure: process.env.EMAIL_SECURE === "true", // true for 465, false for other ports
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASSWORD
    }
  };

  // Remove undefined properties
  Object.keys(emailConfig).forEach(key => {
    if (emailConfig[key] === undefined) {
      delete emailConfig[key];
    }
  });

  // Only initialize if we have credentials
  if (!emailConfig.auth?.user || !emailConfig.auth?.pass) {
    console.warn("[EMAIL] Email credentials not configured. Email sending will be disabled.");
    return null;
  }

  try {
    transporter = nodemailer.createTransport(emailConfig);
    console.log("[EMAIL] Email transporter initialized successfully");
    return transporter;
  } catch (error) {
    console.error("[EMAIL] Failed to initialize transporter:", error.message);
    return null;
  }
}

/**
 * Send notification email
 * @param {string} recipient - Recipient email address
 * @param {string} subject - Email subject
 * @param {string} html - Email HTML content
 * @param {Object} options - Additional options
 * @returns {Promise<boolean>} Success status
 */
async function sendNotificationEmail(recipient, subject, html, options = {}) {
  try {
    const mailTransporter = initializeTransporter();

    // If email not configured, log and return false
    if (!mailTransporter) {
      console.log(
        `[EMAIL] [MOCK] Would send email to ${recipient} with subject: "${subject}". ` +
        "Configure EMAIL_USER and EMAIL_PASSWORD in .env to enable email."
      );
      return false;
    }

    // Validate email
    if (!recipient || !recipient.includes("@")) {
      throw new Error("Invalid recipient email address");
    }

    const senderEmail = process.env.EMAIL_SENDER || process.env.EMAIL_USER || "noreply@ulpms.edu";

    const mailOptions = {
      from: senderEmail,
      to: recipient,
      subject,
      html,
      ...options
    };

    // Send email
    const info = await mailTransporter.sendMail(mailOptions);

    console.log(`[EMAIL] Email sent successfully. Message ID: ${info.messageId}`);
    return true;
  } catch (error) {
    console.error(`[EMAIL] Failed to send email to ${recipient}:`, error.message);
    return false;
  }
}

/**
 * Send batch emails (for multiple recipients)
 * @param {Array<string>} recipients - Array of recipient emails
 * @param {string} subject - Email subject
 * @param {string} html - Email HTML content
 * @param {Object} options - Additional options
 * @returns {Promise<Array>} Array of send results
 */
async function sendBatchNotificationEmails(recipients, subject, html, options = {}) {
  try {
    if (!Array.isArray(recipients) || recipients.length === 0) {
      throw new Error("recipients must be a non-empty array");
    }

    const results = await Promise.allSettled(
      recipients.map(recipient =>
        sendNotificationEmail(recipient, subject, html, options)
      )
    );

    const successful = results.filter(r => r.status === "fulfilled" && r.value).length;
    console.log(`[EMAIL] Batch send completed: ${successful}/${recipients.length} emails sent`);

    return results.map(r => r.status === "fulfilled" ? r.value : false);
  } catch (error) {
    console.error("[EMAIL] Error sending batch emails:", error.message);
    throw error;
  }
}

/**
 * Send custom email template
 * @param {string} recipient - Recipient email
 * @param {string} templateName - Name of template
 * @param {Object} templateData - Data to populate template
 * @returns {Promise<boolean>}
 */
async function sendCustomEmail(recipient, templateName, templateData = {}) {
  try {
    const templates = {
      quotationAlert: {
        subject: "New Quotation Alert",
        getHtml: (data) => `
          <div style="font-family: Arial, sans-serif; max-width: 600px;">
            <h2>New Quotation Alert</h2>
            <p>A new quotation has been submitted for ${data.labName || "your lab project"}.</p>
            <p><strong>Vendor:</strong> ${data.vendorName}</p>
            <p><strong>Total Price:</strong> $${data.totalPrice}</p>
          </div>
        `
      },
      approvalNotice: {
        subject: "Procurement Approved",
        getHtml: (data) => `
          <div style="font-family: Arial, sans-serif; max-width: 600px;">
            <h2>✓ Procurement Approved</h2>
            <p>Your procurement request has been approved.</p>
            <p><strong>Project:</strong> ${data.projectName}</p>
            <p><strong>Final Cost:</strong> $${data.finalCost}</p>
          </div>
        `
      }
    };

    const template = templates[templateName];
    if (!template) {
      throw new Error(`Template "${templateName}" not found`);
    }

    const subject = template.subject;
    const html = template.getHtml(templateData);

    return await sendNotificationEmail(recipient, subject, html);
  } catch (error) {
    console.error("[EMAIL] Error sending custom email:", error.message);
    return false;
  }
}

/**
 * Test email configuration
 * @param {string} testEmail - Test email address
 * @returns {Promise<boolean>}
 */
async function testEmailConfiguration(testEmail) {
  try {
    const mailTransporter = initializeTransporter();

    if (!mailTransporter) {
      console.warn("[EMAIL] Email transporter not initialized");
      return false;
    }

    const testResult = await mailTransporter.verify();

    if (testResult) {
      console.log("[EMAIL] SMTP configuration verified successfully");
      // Send test email
      await sendNotificationEmail(
        testEmail,
        "ULPMS - Email Configuration Test",
        "<p>Your email configuration is working correctly!</p>"
      );
      return true;
    }

    return false;
  } catch (error) {
    console.error("[EMAIL] Email configuration test failed:", error.message);
    return false;
  }
}

/**
 * Retry failed email send
 * @param {Object} notification - Notification object with email failure
 * @returns {Promise<boolean>}
 */
async function retryFailedEmail(notification) {
  try {
    if (notification.deliveryChannels?.email?.retryCount >= 3) {
      console.warn(`[EMAIL] Max retries exceeded for notification ${notification._id}`);
      return false;
    }

    // Increment retry count
    notification.deliveryChannels.email.retryCount = (notification.deliveryChannels.email.retryCount || 0) + 1;

    const user = await require("../models/User").findById(notification.userId).select("email");

    if (!user?.email) {
      return false;
    }

    // Get email template and send
    const templates = require("./notificationService");
    const template = templates.getEmailTemplate?.(
      notification.type,
      notification.message,
      user.name,
      notification.actionUrl
    ) || { subject: "Notification", html: notification.message };

    const success = await sendNotificationEmail(user.email, template.subject, template.html);

    if (success) {
      notification.deliveryChannels.email.sent = true;
      notification.deliveryChannels.email.sentAt = new Date();
      notification.deliveryChannels.email.failureReason = null;
      await notification.save();
    }

    return success;
  } catch (error) {
    console.error("[EMAIL] Error retrying failed email:", error.message);
    return false;
  }
}

module.exports = {
  initializeTransporter,
  sendNotificationEmail,
  sendBatchNotificationEmails,
  sendCustomEmail,
  testEmailConfiguration,
  retryFailedEmail
};

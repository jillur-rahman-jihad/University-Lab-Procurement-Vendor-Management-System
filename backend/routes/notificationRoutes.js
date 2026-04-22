const express = require("express");
const router = express.Router();
const authMiddleware = require("../middleware/authMiddleware");
const notificationService = require("../services/notificationService");

/**
 * Notification Routes
 * All routes require authentication
 */

router.use(authMiddleware);

/**
 * GET /api/notifications/my
 * Get user's notifications with pagination and filtering
 * Query params:
 * - unreadOnly: boolean (default: false)
 * - type: string (filter by notification type)
 * - limit: number (default: 20)
 * - page: number (default: 1)
 */
router.get("/my", async (req, res) => {
  try {
    const userId = req.user.id;
    const {
      unreadOnly = false,
      type = null,
      limit = 20,
      page = 1
    } = req.query;

    const skip = (parseInt(page) - 1) * parseInt(limit);

    const notifications = await notificationService.getUserNotifications(userId, {
      unreadOnly: unreadOnly === "true" || unreadOnly === true,
      type,
      limit: parseInt(limit),
      skip
    });

    const unreadCount = await notificationService.getUnreadCount(userId);

    res.status(200).json({
      message: "Notifications retrieved successfully",
      notifications,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total: unreadCount
      }
    });
  } catch (error) {
    console.error("[NOTIFICATION-API] Error fetching notifications:", error.message);
    res.status(500).json({
      message: "Failed to fetch notifications",
      error: error.message
    });
  }
});

/**
 * GET /api/notifications/unread-count
 * Get count of unread notifications
 */
router.get("/unread-count", async (req, res) => {
  try {
    const userId = req.user.id;
    const count = await notificationService.getUnreadCount(userId);

    res.status(200).json({
      message: "Unread count retrieved",
      unreadCount: count
    });
  } catch (error) {
    console.error("[NOTIFICATION-API] Error getting unread count:", error.message);
    res.status(500).json({
      message: "Failed to get unread count",
      error: error.message
    });
  }
});

/**
 * GET /api/notifications/:id
 * Get single notification details
 */
router.get("/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;

    const Notification = require("../models/Notification");
    const notification = await Notification.findById(id).populate("relatedUserId", "name email");

    if (!notification) {
      return res.status(404).json({ message: "Notification not found" });
    }

    // Verify ownership
    if (notification.userId.toString() !== userId) {
      return res.status(403).json({ message: "Unauthorized" });
    }

    res.status(200).json({
      message: "Notification retrieved",
      notification
    });
  } catch (error) {
    console.error("[NOTIFICATION-API] Error fetching notification:", error.message);
    res.status(500).json({
      message: "Failed to fetch notification",
      error: error.message
    });
  }
});

/**
 * PATCH /api/notifications/:id/read
 * Mark notification as read
 */
router.patch("/:id/read", async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;

    const Notification = require("../models/Notification");
    const notification = await Notification.findById(id);

    if (!notification) {
      return res.status(404).json({ message: "Notification not found" });
    }

    // Verify ownership
    if (notification.userId.toString() !== userId) {
      return res.status(403).json({ message: "Unauthorized" });
    }

    const updated = await notificationService.markAsRead(id);

    res.status(200).json({
      message: "Notification marked as read",
      notification: updated
    });
  } catch (error) {
    console.error("[NOTIFICATION-API] Error marking as read:", error.message);
    res.status(500).json({
      message: "Failed to mark notification as read",
      error: error.message
    });
  }
});

/**
 * PATCH /api/notifications/read-all
 * Mark all notifications as read for user
 */
router.patch("/read-all", async (req, res) => {
  try {
    const userId = req.user.id;
    const result = await notificationService.markAllAsRead(userId);

    res.status(200).json({
      message: "All notifications marked as read",
      modifiedCount: result.modifiedCount
    });
  } catch (error) {
    console.error("[NOTIFICATION-API] Error marking all as read:", error.message);
    res.status(500).json({
      message: "Failed to mark all as read",
      error: error.message
    });
  }
});

/**
 * DELETE /api/notifications/clear-all
 * Clear all notifications for user
 */
router.delete("/clear-all", async (req, res) => {
  try {
    const userId = req.user.id;
    const result = await notificationService.clearUserNotifications(userId);

    res.status(200).json({
      message: "All notifications cleared",
      deletedCount: result.deletedCount
    });
  } catch (error) {
    console.error("[NOTIFICATION-API] Error clearing notifications:", error.message);
    res.status(500).json({
      message: "Failed to clear notifications",
      error: error.message
    });
  }
});

/**
 * DELETE /api/notifications/:id
 * Delete single notification
 */
router.delete("/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;

    const Notification = require("../models/Notification");
    const notification = await Notification.findById(id);

    if (!notification) {
      return res.status(404).json({ message: "Notification not found" });
    }

    // Verify ownership
    if (notification.userId.toString() !== userId) {
      return res.status(403).json({ message: "Unauthorized" });
    }

    const deleted = await notificationService.deleteNotification(id);

    if (!deleted) {
      return res.status(404).json({ message: "Failed to delete notification" });
    }

    res.status(200).json({
      message: "Notification deleted successfully"
    });
  } catch (error) {
    console.error("[NOTIFICATION-API] Error deleting notification:", error.message);
    res.status(500).json({
      message: "Failed to delete notification",
      error: error.message
    });
  }
});

module.exports = router;

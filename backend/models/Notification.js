const mongoose = require("mongoose");

const notificationSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  relatedUserId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  type: { type: String, enum: ["quotation", "consultant", "deadline", "approval", "subscription"], required: true },
  category: String,
  message: String,
  isRead: { type: Boolean, default: false },
  
  // Delivery channels tracking
  deliveryChannels: {
    inApp: {
      sent: { type: Boolean, default: true },
      sentAt: { type: Date, default: () => new Date() }
    },
    email: {
      sent: { type: Boolean, default: false },
      sentAt: Date,
      failureReason: String,
      retryCount: { type: Number, default: 0 },
      // Phase 5: Queue tracking
      status: { type: String, enum: ["pending", "sending", "sent", "failed"], default: "pending" },
      queueJobId: String,
      lastAttempt: Date,
      lastError: String
    }
  },
  
  // Reference to related resource
  referenceData: {
    resourceType: String,
    resourceId: mongoose.Schema.Types.ObjectId,
    resourceName: String
  },
  
  actionUrl: String,
  priority: { type: String, enum: ["low", "normal", "high"], default: "normal" }
}, { timestamps: true });

// Index for faster queries
notificationSchema.index({ userId: 1, isRead: 1, createdAt: -1 });
notificationSchema.index({ userId: 1, type: 1 });

module.exports = mongoose.model("Notification", notificationSchema);

const mongoose = require("mongoose");

const subscriptionSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true }, // university
  plan: { type: String, enum: ["free", "premium"], default: "free" },
  price: Number,
  paymentMethod: { type: String, enum: ["bkash", "billing", "direct"] },
  transactionId: String,
  startDate: Date,
  endDate: Date,
  status: { type: String, enum: ["active", "expired"], default: "active" }
}, { timestamps: true });

module.exports = mongoose.model("Subscription", subscriptionSchema);

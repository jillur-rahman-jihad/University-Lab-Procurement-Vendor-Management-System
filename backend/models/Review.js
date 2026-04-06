const mongoose = require("mongoose");

const reviewSchema = new mongoose.Schema({
  reviewerId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true }, // university
  targetId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },   // vendor or consultant
  targetType: { type: String, enum: ["vendor", "consultant"], required: true },
  rating: { type: Number, required: true },
  comment: String
}, { timestamps: true });

module.exports = mongoose.model("Review", reviewSchema);

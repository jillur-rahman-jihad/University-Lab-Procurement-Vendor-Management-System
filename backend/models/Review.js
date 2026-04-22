const mongoose = require("mongoose");

const reviewSchema = new mongoose.Schema({
  reviewerId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true }, // university
  targetId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },   // vendor or consultant
  targetType: { type: String, enum: ["vendor", "consultant"], required: true },
  quotationId: { type: mongoose.Schema.Types.ObjectId, ref: 'Quotation' },
  labProjectId: { type: mongoose.Schema.Types.ObjectId, ref: 'LabProject' },
  rating: { type: Number, required: true },
  comment: String
}, { timestamps: true });

reviewSchema.index(
  { reviewerId: 1, targetId: 1, targetType: 1, quotationId: 1 },
  { unique: true, partialFilterExpression: { quotationId: { $exists: true } } }
);

module.exports = mongoose.model("Review", reviewSchema);

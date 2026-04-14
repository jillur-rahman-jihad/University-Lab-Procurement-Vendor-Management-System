const mongoose = require("mongoose");

const procurementSchema = new mongoose.Schema({
  labProjectId: { type: mongoose.Schema.Types.ObjectId, ref: 'LabProject', required: true },
  quotationId: { type: mongoose.Schema.Types.ObjectId, ref: 'Quotation' },
  selectedVendorIds: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
  acceptanceType: { type: String, enum: ['full', 'partial'] },
  acceptedComponents: [{
    category: String,
    name: String,
    unitPrice: Number,
    quantity: Number,
    warranty: String,
    deliveryTime: String
  }],
  finalCost: Number,
  documents: {
    pdf: String,
    csv: String
  },
  approvedByAdmin: { type: Boolean, default: false }
}, { timestamps: true });

module.exports = mongoose.model("Procurement", procurementSchema);

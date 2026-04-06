const mongoose = require("mongoose");

const procurementSchema = new mongoose.Schema({
  labProjectId: { type: mongoose.Schema.Types.ObjectId, ref: 'LabProject', required: true },
  selectedVendorIds: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
  finalCost: Number,
  documents: {
    pdf: String,
    csv: String
  },
  approvedByAdmin: { type: Boolean, default: false }
}, { timestamps: true });

module.exports = mongoose.model("Procurement", procurementSchema);

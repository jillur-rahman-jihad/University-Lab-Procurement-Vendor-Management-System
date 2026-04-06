const mongoose = require("mongoose");

const quotationSchema = new mongoose.Schema({
  labProjectId: { type: mongoose.Schema.Types.ObjectId, ref: 'LabProject', required: true },
  vendorId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  
  components: [{
    category: { type: String, enum: ["CPU", "GPU", "RAM", "Storage", "Networking", "UPS"] },
    name: String,
    unitPrice: Number,
    quantity: Number,
    warranty: String,
    deliveryTime: String
  }],
  
  totalPrice: Number,
  bulkDiscount: Number,
  installationIncluded: Boolean,
  maintenanceIncluded: Boolean,
  
  status: { type: String, enum: ["pending", "accepted", "rejected"], default: "pending" },
  
  revisionHistory: [{
    updatedAt: Date,
    changes: String
  }]
  
}, { timestamps: true });

module.exports = mongoose.model("Quotation", quotationSchema);

const mongoose = require("mongoose");

const userSchema = new mongoose.Schema({
    role: {
        type: String,
        enum: ["university", "vendor", "consultant", "admin"],
        required: true
    },

    // Common fields
    name: { type: String, required: true },
    email: { type: String, required: true, unique: true },
    password: { type: String, required: true },
    phone: String,

    // University-specific
    universityInfo: {
        universityName: String,
        department: String,
        address: String,
        representative: String,
        isApproved: { type: Boolean, default: false },
        subscriptionPlan: { type: String, enum: ["free", "premium"], default: "free" }
    },

    // Vendor-specific
    vendorInfo: {
        shopName: String,
        tradeLicense: String,
        location: {
            address: String,
            lat: Number,
            lng: Number,
            // GeoJSON format needed for 2dsphere index
            type: { type: String, enum: ['Point'], default: 'Point' },
            coordinates: { type: [Number] } // [longitude, latitude]
        },
        isVerified: { type: Boolean, default: false },
        rating: { type: Number, default: 0 }
    },

    // Consultant-specific
    consultantInfo: {
        expertise: { type: [String] },
        experienceLevel: { type: String, enum: ["General", "Certified", "Professional"] },
        completedProjects: { type: Number, default: 0 },
        rating: { type: Number, default: 0 },
        points: { type: Number, default: 0 },
        availability: { type: Boolean, default: true },
        bio: String
    }
}, { timestamps: true });

// Geo Index for vendor location mapping
userSchema.index({ "vendorInfo.location": "2dsphere" });

module.exports = mongoose.model("User", userSchema);

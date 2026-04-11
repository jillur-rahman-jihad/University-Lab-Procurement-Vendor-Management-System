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
            coordinates: { type: [Number], default: [0, 0] } // [longitude, latitude]
        },
        isVerified: { type: Boolean, default: false },
        rating: { type: Number, default: 0 }
    },

    // Consultant-specific
    consultantInfo: {
        expertise: { 
            type: [String],
            enum: ["Networking", "Graphics", "Research", "AI Infrastructure"],
            default: []
        },
        experienceLevel: { type: String, enum: ["General", "Certified", "Professional"] },
        completedLabDeployments: { type: Number, default: 0 },
        rating: { type: Number, default: 0, min: 0, max: 5 },
        averageResponseTime: { type: Number, default: 24 }, // in hours
        availability: { type: Boolean, default: true },
        reviews: [
            {
                universityName: String,
                reviewText: String,
                rating: { type: Number, min: 1, max: 5 },
                date: { type: Date, default: Date.now }
            }
        ],
        points: { type: Number, default: 0 },
        bio: String,
        profilePhoto: { type: String, default: null }
    }
}, { timestamps: true });

// Geo Index for vendor location mapping
userSchema.index({ "vendorInfo.location": "2dsphere" });

module.exports = mongoose.model("User", userSchema);

const mongoose = require('mongoose');

const reviewSchema = new mongoose.Schema({
    reviewer: { type: String },
    rating: { type: Number, min: 0, max: 5 },
    comment: String,
    createdAt: { type: Date, default: Date.now }
});

const userSchema = new mongoose.Schema({
    role: {
        type: String,
        enum: ['university', 'vendor', 'consultant', 'admin'],
        required: true
    },

    // Common fields
    name: { type: String, required: true },
    email: { type: String, required: true, unique: true },
    password: { type: String, required: true },
    phone: String,
    address: String,
    location: {
        lat: Number,
        lng: Number
    },

    // University-specific
    universityInfo: {
        universityName: String,
        department: String,
        address: String,
        representative: {
            name: String,
            email: String,
            phone: String
        },
        isApproved: { type: Boolean, default: false },
        subscriptionPlan: { type: String, enum: ['free', 'premium'], default: 'free' }
    },

    // Vendor-specific
    vendorInfo: {
        shopName: String,
        tradeLicense: String,
        location: {
            address: String,
            lat: Number,
            lng: Number,
            type: { type: String, enum: ['Point'] },
            coordinates: { type: [Number] }
        },
        isVerified: { type: Boolean, default: false },
        rating: { type: Number, default: 0 }
    },

    // Consultant-specific
    consultantInfo: {
        profilePhoto: String,
        bio: String,
        expertise: { type: [String], default: [] },
        experienceLevel: { type: String, enum: ['General', 'Certified', 'Professional'], default: 'General' },
        completedLabDeployments: { type: Number, default: 0 },
        rating: { type: Number, default: 0 },
        reviews: { type: [reviewSchema], default: [] },
        averageResponseTime: { type: Number, default: 24 }, // in hours
        availability: { type: Boolean, default: true },
        points: { type: Number, default: 0 },
        professionalCredentials: String,
        relevantExperience: String,
        certificationInformation: String
    }
}, { timestamps: true });

// Geo Index for vendor location mapping
userSchema.index({ 'vendorInfo.location': '2dsphere' }, { sparse: true });

module.exports = mongoose.model('User', userSchema);

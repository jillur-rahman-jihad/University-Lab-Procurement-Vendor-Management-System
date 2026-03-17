const mongoose = require("mongoose");

const userSchema = new mongoose.Schema(
{
    name: {
        type: String,
        required: true
    },

    email: {
        type: String,
        required: true,
        unique: true
    },

    password: {
        type: String,
        required: true
    },

    role: {
        type: String,
        enum: ["university", "vendor", "consultant", "admin"],
        required: true
    },

    phone: String, // Contact number / Official phone

    address: String, // Physical address / Physical location

    // === University Specific Fields ===
    department: {
        type: String,
        required: function() { return this.role === 'university'; }
    },
    authorizedRepresentative: {
        name: { type: String, required: function() { return this.role === 'university'; } },
        email: { type: String, required: function() { return this.role === 'university'; } },
        phone: { type: String, required: function() { return this.role === 'university'; } }
    },

    // === Vendor Specific Fields ===
    // 'name' maps to shop or company name
    tradeLicenseNumber: {
        type: String,
        required: function() { return this.role === 'vendor'; }
    },

    // === Consultant Specific Fields ===
    professionalCredentials: {
        type: String,
        required: function() { return this.role === 'consultant'; }
    },
    relevantExperience: {
        type: String,
        required: function() { return this.role === 'consultant'; }
    },
    certificationInformation: {
        type: String,
        required: function() { return this.role === 'consultant'; }
    },


    verified: {
        type: Boolean,
        default: false
    }

},
{ timestamps: true }
);

module.exports = mongoose.model("User", userSchema);

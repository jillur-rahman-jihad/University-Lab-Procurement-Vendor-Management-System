const mongoose = require('mongoose');
const labSchema = new mongoose.Schema({
        labtype: { enum: ['Normal Usage Lab', 'Graphics Lab', 'Networking Lab', 'Thesis/Research Lab', 'AI/ML Lab', 'Custom Lab'],
            type: String,
            required: true
        },
        labname: {
            type: String,
            required: true
        },
        components: {
            type: [String],
            required: true
        },
        numberofSystems:{
            type: Number,
            required: true
        },
        budgetrange: {
            type: [Number]
        },
        performancepriority: {
            type: String,
            enum: ['low', 'medium', 'high']
        },
        status: {
            type: String,
            enum: ['pending', 'approved', 'rejected'],
            default: 'pending'
        },
        universityid: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User',
            required: true
        },
        createdate: {
            type: Date,
            default: Date.now
        }

    });
module.exports = mongoose.model('Lab', labSchema);


const mongoose = require('mongoose');

const PaymentSchema = new mongoose.Schema({
	userId: {
		type: mongoose.Schema.Types.ObjectId,
		ref: 'User',
		required: true
	},
	subscriptionId: {
		type: mongoose.Schema.Types.ObjectId,
		ref: 'Subscription',
		required: true
	},
	planType: {
		type: String,
		enum: ['free', 'premium'],
		required: true
	},
	paymentMethod: {
		type: String,
		enum: ['bkash', 'institutional_billing', 'direct'],
		required: true
	},
	amount: {
		type: Number,
		required: true
	},
	currency: {
		type: String,
		default: 'BDT'
	},
	// Bkash specific fields
	bkashPhoneNumber: {
		type: String,
		sparse: true
	},
	bkashTransactionId: {
		type: String,
		sparse: true
	},
	// Institutional billing specific fields
	institutionName: {
		type: String,
		sparse: true
	},
	billingDepartment: {
		type: String,
		sparse: true
	},
	purchaseOrderNumber: {
		type: String,
		sparse: true
	},
	costCenter: {
		type: String,
		sparse: true
	},
	billingContact: {
		name: String,
		email: String,
		phone: String
	},
	status: {
		type: String,
		enum: ['pending', 'processing', 'completed', 'failed', 'cancelled'],
		default: 'pending'
	},
	billingCycle: {
		type: String,
		enum: ['monthly', 'annual'],
		required: true
	},
	paymentDate: {
		type: Date,
		sparse: true
	},
	dueDate: {
		type: Date,
		sparse: true
	},
	invoiceNumber: {
		type: String,
		sparse: true
	},
	notes: String,
	failureReason: String,
	createdAt: {
		type: Date,
		default: Date.now
	},
	updatedAt: {
		type: Date,
		default: Date.now
	}
});

// Index for querying by user and subscription
PaymentSchema.index({ userId: 1, subscriptionId: 1 });
PaymentSchema.index({ status: 1, createdAt: -1 });

module.exports = mongoose.model('Payment', PaymentSchema);

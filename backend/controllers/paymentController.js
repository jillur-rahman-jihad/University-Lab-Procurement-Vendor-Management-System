const Payment = require('../models/Payment');
const Subscription = require('../models/Subscription');
const User = require('../models/User');

// Pricing configuration
const PREMIUM_PLAN_PRICING = {
	monthly: 99,
	annual: 999
};

// Initiate Bkash payment
exports.initiateBkashPayment = async (req, res) => {
	try {
		const { billingCycle, bkashPhoneNumber } = req.body;
		const userId = req.user.id;

		if (!['monthly', 'annual'].includes(billingCycle)) {
			return res.status(400).json({ message: 'Invalid billing cycle' });
		}

		if (!bkashPhoneNumber || !/^01[3-9]\d{8}$/.test(bkashPhoneNumber)) {
			return res.status(400).json({ message: 'Invalid Bkash phone number' });
		}

		// Get user's subscription
		const subscription = await Subscription.findOne({ userId });
		if (!subscription) {
			return res.status(404).json({ message: 'Subscription not found' });
		}

		const amount = PREMIUM_PLAN_PRICING[billingCycle];

		// Create payment record
		const payment = new Payment({
			userId,
			subscriptionId: subscription._id,
			planType: 'premium',
			paymentMethod: 'bkash',
			amount,
			currency: 'BDT',
			bkashPhoneNumber,
			status: 'pending',
			billingCycle,
			dueDate: new Date(Date.now() + 24 * 60 * 60 * 1000) // 24 hours to complete
		});

		await payment.save();

		return res.status(201).json({
			success: true,
			message: 'Bkash payment initiated',
			payment: {
				paymentId: payment._id,
				amount: payment.amount,
				phonNumber: payment.bkashPhoneNumber,
				currency: payment.currency,
				billingCycle: payment.billingCycle,
				status: payment.status,
				instructions: `Please send ${amount} BDT to Bkash merchant. Use reference: ${payment._id}`
			}
		});
	} catch (error) {
		res.status(500).json({
			message: 'Error initiating Bkash payment',
			error: error.message
		});
	}
};

// Verify Bkash payment (simulated - in production would integrate with Bkash API)
exports.verifyBkashPayment = async (req, res) => {
	try {
		const { paymentId, transactionId } = req.body;
		const userId = req.user.id;

		const payment = await Payment.findById(paymentId);
		if (!payment) {
			return res.status(404).json({ message: 'Payment not found' });
		}

		if (payment.userId.toString() !== userId) {
			return res.status(403).json({ message: 'Unauthorized' });
		}

		if (payment.status !== 'pending') {
			return res.status(400).json({ message: 'Payment already processed' });
		}

		// In production, verify with Bkash API here
		// For now, we'll mark as completed upon submission
		payment.status = 'completed';
		payment.bkashTransactionId = transactionId;
		payment.paymentDate = new Date();
		payment.invoiceNumber = `INV-${Date.now()}`;

		await payment.save();

		// Update subscription to premium
		const subscription = await Subscription.findByIdAndUpdate(
			payment.subscriptionId,
			{
				planType: 'premium',
				startDate: new Date(),
				expiryDate: new Date(payment.billingCycle === 'monthly'
					? Date.now() + 30 * 24 * 60 * 60 * 1000
					: Date.now() + 365 * 24 * 60 * 60 * 1000
				)
			},
			{ new: true }
		);

		res.status(200).json({
			success: true,
			message: 'Bkash payment verified successfully',
			payment: {
				paymentId: payment._id,
				status: payment.status,
				invoiceNumber: payment.invoiceNumber,
				transactionId: payment.bkashTransactionId
			},
			subscription
		});
	} catch (error) {
		res.status(500).json({
			message: 'Error verifying Bkash payment',
			error: error.message
		});
	}
};

// Submit institutional billing request
exports.submitInstitutionalBilling = async (req, res) => {
	try {
		const {
			billingCycle,
			institutionName,
			billingDepartment,
			purchaseOrderNumber,
			costCenter,
			billingContact
		} = req.body;

		const userId = req.user.id;

		if (!['monthly', 'annual'].includes(billingCycle)) {
			return res.status(400).json({ message: 'Invalid billing cycle' });
		}

		if (!institutionName || !billingDepartment || !billingContact) {
			return res.status(400).json({ message: 'Missing required billing information' });
		}

		// Get user's subscription
		const subscription = await Subscription.findOne({ userId });
		if (!subscription) {
			return res.status(404).json({ message: 'Subscription not found' });
		}

		const amount = PREMIUM_PLAN_PRICING[billingCycle];

		// Create payment record
		const payment = new Payment({
			userId,
			subscriptionId: subscription._id,
			planType: 'premium',
			paymentMethod: 'institutional_billing',
			amount,
			currency: 'BDT',
			institutionName,
			billingDepartment,
			purchaseOrderNumber,
			costCenter,
			billingContact,
			status: 'processing',
			billingCycle,
			invoiceNumber: `INV-${Date.now()}`,
			dueDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000) // 30 days payment term
		});

		await payment.save();

		res.status(201).json({
			success: true,
			message: 'Institutional billing request submitted',
			payment: {
				paymentId: payment._id,
				invoiceNumber: payment.invoiceNumber,
				amount: payment.amount,
				institutionName: payment.institutionName,
				status: payment.status,
				dueDate: payment.dueDate,
				note: 'Invoice has been generated and will be processed by your finance department'
			}
		});
	} catch (error) {
		res.status(500).json({
			message: 'Error submitting institutional billing',
			error: error.message
		});
	}
};

// Get payment history
exports.getPaymentHistory = async (req, res) => {
	try {
		const userId = req.user.id;
		const { status, paymentMethod, limit = 10, skip = 0 } = req.query;

		const filter = { userId };

		if (status) filter.status = status;
		if (paymentMethod) filter.paymentMethod = paymentMethod;

		const payments = await Payment.find(filter)
			.sort({ createdAt: -1 })
			.limit(parseInt(limit))
			.skip(parseInt(skip))
			.lean();

		const total = await Payment.countDocuments(filter);

		res.status(200).json({
			success: true,
			payments,
			pagination: {
				total,
				limit: parseInt(limit),
				skip: parseInt(skip)
			}
		});
	} catch (error) {
		res.status(500).json({
			message: 'Error fetching payment history',
			error: error.message
		});
	}
};

// Get payment details
exports.getPaymentDetails = async (req, res) => {
	try {
		const { paymentId } = req.params;
		const userId = req.user.id;

		const payment = await Payment.findById(paymentId);
		if (!payment) {
			return res.status(404).json({ message: 'Payment not found' });
		}

		if (payment.userId.toString() !== userId) {
			return res.status(403).json({ message: 'Unauthorized' });
		}

		res.status(200).json({
			success: true,
			payment
		});
	} catch (error) {
		res.status(500).json({
			message: 'Error fetching payment details',
			error: error.message
		});
	}
};

// Get pricing information
exports.getPricingInfo = async (req, res) => {
	try {
		res.status(200).json({
			success: true,
			pricing: {
				premium: PREMIUM_PLAN_PRICING,
				currency: 'BDT',
				paymentMethods: [
					{
						id: 'bkash',
						name: 'Bkash',
						description: 'Mobile banking - Instant payment processing',
						icon: '📱'
					},
					{
						id: 'institutional_billing',
						name: 'Institutional Billing',
						description: 'Invoiced billing for institutional purchases (30-day payment term)',
						icon: '🏛️'
					}
				]
			}
		});
	} catch (error) {
		res.status(500).json({
			message: 'Error fetching pricing information',
			error: error.message
		});
	}
};

// Cancel payment (for pending payments only)
exports.cancelPayment = async (req, res) => {
	try {
		const { paymentId } = req.params;
		const userId = req.user.id;

		const payment = await Payment.findById(paymentId);
		if (!payment) {
			return res.status(404).json({ message: 'Payment not found' });
		}

		if (payment.userId.toString() !== userId) {
			return res.status(403).json({ message: 'Unauthorized' });
		}

		if (!['pending', 'processing'].includes(payment.status)) {
			return res.status(400).json({ message: 'Only pending or processing payments can be cancelled' });
		}

		payment.status = 'cancelled';
		await payment.save();

		res.status(200).json({
			success: true,
			message: 'Payment cancelled successfully',
			payment
		});
	} catch (error) {
		res.status(500).json({
			message: 'Error cancelling payment',
			error: error.message
		});
	}
};

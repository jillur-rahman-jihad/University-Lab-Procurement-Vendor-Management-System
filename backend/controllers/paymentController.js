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
				plan: 'premium',
				startDate: new Date(),
				endDate: new Date(payment.billingCycle === 'monthly'
					? Date.now() + 30 * 24 * 60 * 60 * 1000
					: Date.now() + 365 * 24 * 60 * 60 * 1000
				),
				paymentMethod: 'bkash'
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

// Direct payment - immediately complete payment and upgrade subscription
exports.completePaymentDirect = async (req, res) => {
	try {
		console.log('[PAYMENT] Complete direct payment request received');
		console.log('[PAYMENT] req.user:', req.user);
		console.log('[PAYMENT] req.body:', req.body);

		const { billingCycle } = req.body;
		const userId = req.user.id;

		if (!['monthly', 'annual'].includes(billingCycle)) {
			console.log('[PAYMENT] Invalid billing cycle:', billingCycle);
			return res.status(400).json({ message: 'Invalid billing cycle' });
		}

		console.log('[PAYMENT] Processing payment for user:', userId, 'billingCycle:', billingCycle);

		// Get user's subscription or create one if doesn't exist
		let subscription = await Subscription.findOne({ userId });
		console.log('[PAYMENT] Subscription lookup:', subscription ? 'Found' : 'Not found');
		
		if (!subscription) {
			console.log('[PAYMENT] Creating new subscription for user:', userId);
			// Create a free subscription if one doesn't exist
			subscription = new Subscription({
				userId,
				plan: 'free',
				status: 'active',
				startDate: new Date()
			});
			await subscription.save();
			console.log('[PAYMENT] New subscription created:', subscription._id);
		}

		const amount = PREMIUM_PLAN_PRICING[billingCycle];
		console.log('[PAYMENT] Amount:', amount, 'BDT');

		// Create and immediately complete payment record
		const payment = new Payment({
			userId,
			subscriptionId: subscription._id,
			planType: 'premium',
			paymentMethod: 'direct',
			amount,
			currency: 'BDT',
			status: 'completed',
			billingCycle,
			invoiceNumber: `INV-${Date.now()}`,
			paymentDate: new Date()
		});

		await payment.save();
		console.log('[PAYMENT] Payment record created:', payment._id);

		// Update subscription to premium
		const updatedSubscription = await Subscription.findByIdAndUpdate(
			payment.subscriptionId,
			{
				plan: 'premium',
				startDate: new Date(),
				endDate: new Date(billingCycle === 'monthly'
					? Date.now() + 30 * 24 * 60 * 60 * 1000
					: Date.now() + 365 * 24 * 60 * 60 * 1000
				),
				paymentMethod: 'direct'
			},
			{ new: true }
		);

		console.log('[PAYMENT] Subscription updated to premium');

		res.status(200).json({
			success: true,
			message: 'Payment completed successfully! Premium plan is now active.',
			payment: {
				paymentId: payment._id,
				invoiceNumber: payment.invoiceNumber,
				status: payment.status,
				amount: payment.amount
			},
			subscription: updatedSubscription
		});
	} catch (error) {
		console.error('[PAYMENT] Error:', error);
		res.status(500).json({
			message: 'Error completing payment',
			error: error.message
		});
	}
};

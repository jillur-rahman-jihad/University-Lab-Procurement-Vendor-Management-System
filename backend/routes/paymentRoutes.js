const express = require('express');
const router = express.Router();
const paymentController = require('../controllers/paymentController');
const authMiddleware = require('../middleware/authMiddleware');

// All payment routes require authentication
router.use(authMiddleware);

// Get pricing information (public after auth)
router.get('/pricing', paymentController.getPricingInfo);

// Bkash payment endpoints
router.post('/bkash/initiate', paymentController.initiateBkashPayment);
router.post('/bkash/verify', paymentController.verifyBkashPayment);

// Institutional billing endpoints
router.post('/institutional-billing/initiate', paymentController.submitInstitutionalBilling);

// Payment history and details
router.get('/history', paymentController.getPaymentHistory);
router.get('/:paymentId', paymentController.getPaymentDetails);

// Cancel payment
router.post('/:paymentId/cancel', paymentController.cancelPayment);

// Direct payment - immediate premium upgrade
router.post('/complete/direct', paymentController.completePaymentDirect);

module.exports = router;

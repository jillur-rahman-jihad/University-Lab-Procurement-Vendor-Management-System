const express = require('express');
const router = express.Router();
const authMiddleware = require('../middleware/authMiddleware');
const quotationController = require('../controllers/QuotationSystemController');

router.use(authMiddleware);

router.get('/labs', quotationController.getAccessibleLabProjects);
router.get('/labs/:id', quotationController.getLabProjectDetails);
router.get('/labs/:id/quotations', quotationController.getLabQuotations);
router.post('/quotations', quotationController.submitQuotation);
router.get('/quotations/my', quotationController.getMyQuotations);
router.get('/quotations/:id', quotationController.getQuotationById);
router.put('/quotations/:id', quotationController.updateQuotation);
router.post('/quotations/:id/accept', quotationController.acceptQuotation);

module.exports = router;
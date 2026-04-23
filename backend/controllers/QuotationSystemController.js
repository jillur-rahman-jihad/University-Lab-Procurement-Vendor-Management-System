const LabProject = require('../models/LabProject');
const Quotation = require('../models/Quotation');
const Procurement = require('../models/Procurement');
const User = require('../models/User');
const Review = require('../models/Review');
const notificationService = require('../services/notificationService');

const populateUniversity = 'name email location universityInfo.universityName universityInfo.department';

const getRole = async (userId) => {
	const user = await User.findById(userId).select('role');
	return user?.role || null;
};

const mapLab = (lab) => ({
	...lab.toObject(),
	universityName: lab.universityId?.universityInfo?.universityName || lab.universityId?.name || 'University',
	universityLocation: lab.universityId?.location || null,
	minBudget: lab.requirements?.budgetMin ?? 0,
	maxBudget: lab.requirements?.budgetMax ?? 0
});

exports.getAccessibleLabProjects = async (req, res) => {
	try {
		const role = await getRole(req.user.id);

		if (!role) {
			return res.status(403).json({ message: 'Access denied' });
		}

		if (role === 'vendor') {
			const submittedLabIds = await Quotation.find({ vendorId: req.user.id }).distinct('labProjectId');
			const labs = await LabProject.find({ status: { $in: ['draft', 'bidding', 'finalized', 'approved'] } })
				.populate('universityId', populateUniversity)
				.sort({ createdAt: -1 });

			return res.status(200).json(
				labs
					.filter((lab) => !submittedLabIds.some((id) => id.toString() === lab._id.toString()))
					.map(mapLab)
			);
		}

		if (role === 'university') {
			const labs = await LabProject.find({ universityId: req.user.id })
				.populate('universityId', populateUniversity)
				.sort({ createdAt: -1 });

			const labsWithQuoteCounts = await Promise.all(
				labs.map(async (lab) => ({
					...mapLab(lab),
					quotationCount: await Quotation.countDocuments({ labProjectId: lab._id })
				}))
			);

			return res.status(200).json(labsWithQuoteCounts);
		}

		return res.status(403).json({ message: 'Unsupported role' });
	} catch (error) {
		return res.status(500).json({ message: 'Failed to fetch lab projects', error: error.message });
	}
};

exports.getLabProjectDetails = async (req, res) => {
	try {
		const role = await getRole(req.user.id);
		const lab = await LabProject.findById(req.params.id).populate('universityId', populateUniversity);

		if (!lab) {
			return res.status(404).json({ message: 'Lab project not found' });
		}

		if (role === 'university' && lab.universityId?._id.toString() !== req.user.id) {
			return res.status(403).json({ message: 'You can only access your own lab projects' });
		}

		return res.status(200).json(mapLab(lab));
	} catch (error) {
		return res.status(500).json({ message: 'Failed to fetch lab project details', error: error.message });
	}
};

exports.getLabQuotations = async (req, res) => {
	try {
		const role = await getRole(req.user.id);
		const lab = await LabProject.findById(req.params.id);

		if (!lab) {
			return res.status(404).json({ message: 'Lab project not found' });
		}

		if (role === 'university' && lab.universityId.toString() !== req.user.id) {
			return res.status(403).json({ message: 'You can only view quotations for your own labs' });
		}

		if (role === 'vendor') {
			const myQuotation = await Quotation.findOne({ labProjectId: req.params.id, vendorId: req.user.id })
				.populate('vendorId', 'name email phone address location vendorInfo.shopName vendorInfo.location vendorInfo.rating');

			return res.status(200).json(myQuotation ? [myQuotation] : []);
		}

		const quotations = await Quotation.find({ labProjectId: req.params.id })
			.populate('vendorId', 'name email phone address location vendorInfo.shopName vendorInfo.location vendorInfo.rating')
			.sort({ createdAt: -1 });

		const vendorIds = [...new Set(
			quotations
				.map((quotation) => quotation.vendorId?._id?.toString?.())
				.filter(Boolean)
		)];

		let vendorReviewsById = {};
		let vendorReviewCountsById = {};

		if (vendorIds.length > 0) {
			const reviews = await Review.find({
				targetType: 'vendor',
				targetId: { $in: vendorIds }
			})
				.populate('reviewerId', 'name universityInfo.universityName')
				.populate('labProjectId', 'labName')
				.sort({ createdAt: -1 })
				.select('targetId rating comment createdAt reviewerId labProjectId')
				.lean();

			vendorReviewsById = reviews.reduce((acc, review) => {
				const key = review.targetId?.toString?.();
				if (!key) return acc;

				if (!acc[key]) {
					acc[key] = [];
				}

				if (acc[key].length < 5) {
					acc[key].push({
						_id: review._id,
						rating: review.rating,
						comment: review.comment,
						createdAt: review.createdAt,
						reviewerName: review.reviewerId?.universityInfo?.universityName || review.reviewerId?.name || 'University',
						labName: review.labProjectId?.labName || 'Lab Project'
					});
				}

				return acc;
			}, {});

			vendorReviewCountsById = reviews.reduce((acc, review) => {
				const key = review.targetId?.toString?.();
				if (!key) return acc;
				acc[key] = (acc[key] || 0) + 1;
				return acc;
			}, {});
		}

		const quotationsWithReviews = quotations.map((quotation) => {
			const quotationObj = quotation.toObject();
			const vendorId = quotationObj.vendorId?._id?.toString?.();

			return {
				...quotationObj,
				vendorReviews: vendorId ? (vendorReviewsById[vendorId] || []) : [],
				vendorReviewsCount: vendorId ? (vendorReviewCountsById[vendorId] || 0) : 0
			};
		});

		return res.status(200).json(quotationsWithReviews);
	} catch (error) {
		return res.status(500).json({ message: 'Failed to fetch quotations', error: error.message });
	}
};

exports.submitQuotation = async (req, res) => {
	try {
		const role = await getRole(req.user.id);

		if (role !== 'vendor') {
			return res.status(403).json({ message: 'Access denied. Vendor only.' });
		}

		const { labProjectId, components = [], totalPrice, bulkDiscount, installationIncluded, maintenanceIncluded } = req.body;

		if (!labProjectId || !components.length) {
			return res.status(400).json({ message: 'Please add at least one component to submit a quotation.' });
		}

		const lab = await LabProject.findById(labProjectId);
		if (!lab) {
			return res.status(404).json({ message: 'Lab project not found' });
		}

		const existingQuotation = await Quotation.findOne({ labProjectId, vendorId: req.user.id });
		if (existingQuotation) {
			return res.status(400).json({ message: 'You already submitted a quotation for this lab.' });
		}

		const normalizedComponents = components.map((component) => ({
			category: component.category,
			name: component.name,
			unitPrice: Number(component.unitPrice || 0),
			quantity: Number(component.quantity || 1),
			warranty: component.warranty || '',
			deliveryTime: component.deliveryTime || ''
		}));

		// Validate that all components have required fields (name and unitPrice)
		const invalidComponents = normalizedComponents.filter(
			(component) => !component.name || !component.name.trim() || component.unitPrice === 0
		);

		if (invalidComponents.length > 0) {
			return res.status(400).json({ 
				message: 'All components must have a name and unit price. Please remove or complete empty components.' 
			});
		}

		const calculatedTotal = normalizedComponents.reduce((sum, component) => sum + (component.unitPrice * component.quantity), 0);

		const quotation = await Quotation.create({
			labProjectId,
			vendorId: req.user.id,
			components: normalizedComponents,
			totalPrice: Number(totalPrice || calculatedTotal),
			bulkDiscount: Number(bulkDiscount || 0),
			installationIncluded: Boolean(installationIncluded),
			maintenanceIncluded: Boolean(maintenanceIncluded),
			status: 'pending',
			revisionHistory: [],
			createdBy: req.user.id,
			expiryDate: null // Vendor quotations don't expire
		});

		// Send notification to university about new quotation (non-blocking)
		(async () => {
			try {
				const lab = await LabProject.findById(labProjectId).populate('universityId', 'name email');
				const vendor = await User.findById(req.user.id).select('name vendorInfo.shopName');
				const vendorName = vendor?.vendorInfo?.shopName || vendor?.name || 'Vendor';

				if (lab && lab.universityId) {
					await notificationService.createNotification({
						userId: lab.universityId._id.toString(),
						type: 'quotation',
						category: 'quotation_submitted',
						message: `New quotation received from ${vendorName} for "${lab.labName}" - Total: $${quotation.totalPrice}`,
						referenceData: {
							resourceType: 'Quotation',
							resourceId: quotation._id,
							resourceName: lab.labName
						},
						actionUrl: `/quotation-system?lab=${labProjectId}`,
						sendEmail: true,
						priority: 'normal'
					});
				}
			} catch (notifError) {
				console.error('[QUOTATION] Error sending notification:', notifError.message);
			}
		})();

		return res.status(201).json({ message: 'Quotation submitted successfully', quotation });
	} catch (error) {
		return res.status(500).json({ message: 'Failed to submit quotation', error: error.message });
	}
};

exports.updateQuotation = async (req, res) => {
	try {
		const role = await getRole(req.user.id);

		if (role !== 'vendor') {
			return res.status(403).json({ message: 'Access denied. Vendor only.' });
		}

		const quotation = await Quotation.findById(req.params.id);
		if (!quotation) {
			return res.status(404).json({ message: 'Quotation not found' });
		}

		if (quotation.vendorId.toString() !== req.user.id) {
			return res.status(403).json({ message: 'You can only update your own quotation' });
		}

		if (quotation.status !== 'pending') {
			return res.status(400).json({ message: 'Only pending quotations can be updated' });
		}

		const { components, totalPrice, bulkDiscount, installationIncluded, maintenanceIncluded } = req.body;

		if (components) {
			quotation.components = components.map((component) => ({
				category: component.category,
				name: component.name,
				unitPrice: Number(component.unitPrice || 0),
				quantity: Number(component.quantity || 1),
				warranty: component.warranty || '',
				deliveryTime: component.deliveryTime || ''
			}));
		}

		if (totalPrice !== undefined) quotation.totalPrice = Number(totalPrice);
		if (bulkDiscount !== undefined) quotation.bulkDiscount = Number(bulkDiscount);
		if (installationIncluded !== undefined) quotation.installationIncluded = Boolean(installationIncluded);
		if (maintenanceIncluded !== undefined) quotation.maintenanceIncluded = Boolean(maintenanceIncluded);

		quotation.revisionHistory.push({ updatedAt: new Date(), changes: 'Quotation updated by vendor' });
		await quotation.save();

		return res.status(200).json({ message: 'Quotation updated successfully', quotation });
	} catch (error) {
		return res.status(500).json({ message: 'Failed to update quotation', error: error.message });
	}
};

exports.getMyQuotations = async (req, res) => {
	try {
		const role = await getRole(req.user.id);

		if (role !== 'vendor') {
			return res.status(403).json({ message: 'Access denied. Vendor only.' });
		}

		const quotations = await Quotation.find({ vendorId: req.user.id })
			.populate({ path: 'labProjectId', populate: { path: 'universityId', select: populateUniversity } })
			.sort({ createdAt: -1 });

		return res.status(200).json(quotations);
	} catch (error) {
		return res.status(500).json({ message: 'Failed to fetch quotations', error: error.message });
	}
};

exports.getQuotationById = async (req, res) => {
	try {
		const role = await getRole(req.user.id);
		const quotation = await Quotation.findById(req.params.id)
			.populate('vendorId', 'name vendorInfo.shopName vendorInfo.rating email')
			.populate({ path: 'labProjectId', populate: { path: 'universityId', select: populateUniversity } });

		if (!quotation) {
			return res.status(404).json({ message: 'Quotation not found' });
		}

		if (role === 'vendor' && quotation.vendorId._id.toString() !== req.user.id) {
			return res.status(403).json({ message: 'You can only view your own quotation' });
		}

		if (role === 'university') {
			const labOwnerId = quotation.labProjectId?.universityId?._id?.toString?.() || quotation.labProjectId?.universityId?.toString?.();
			if (labOwnerId !== req.user.id) {
				return res.status(403).json({ message: 'You can only view quotations for your own lab projects' });
			}
		}

		if (role !== 'vendor' && role !== 'university') {
			return res.status(403).json({ message: 'Access denied' });
		}

		return res.status(200).json(quotation);
	} catch (error) {
		return res.status(500).json({ message: 'Failed to fetch quotation', error: error.message });
	}
};

exports.acceptQuotation = async (req, res) => {
	try {
		const role = await getRole(req.user.id);

		if (role !== 'university') {
			return res.status(403).json({ message: 'Access denied. University only.' });
		}

		const quotation = await Quotation.findById(req.params.id)
			.populate({ path: 'labProjectId', populate: { path: 'universityId', select: populateUniversity } });

		if (!quotation) {
			return res.status(404).json({ message: 'Quotation not found' });
		}

		const labOwnerId = quotation.labProjectId?.universityId?._id?.toString?.() || quotation.labProjectId?.universityId?.toString?.();
		if (labOwnerId !== req.user.id) {
			return res.status(403).json({ message: 'You can only accept quotations for your own lab projects' });
		}

		if (quotation.status !== 'pending') {
			return res.status(400).json({ message: 'Only pending quotations can be accepted' });
		}

		const acceptanceType = req.body.acceptanceType === 'partial' ? 'partial' : 'full';
		const componentIndexes = Array.isArray(req.body.componentIndexes) ? req.body.componentIndexes : [];
		const quotationComponents = Array.isArray(quotation.components) ? quotation.components : [];

		if (!quotationComponents.length) {
			return res.status(400).json({ message: 'This quotation has no components and cannot be accepted' });
		}

		let acceptedComponents = quotationComponents.map((component) => ({ ...(component.toObject?.() || component) }));

		if (acceptanceType === 'partial') {
			const uniqueIndexes = [...new Set(componentIndexes.map((index) => Number(index)).filter((index) => Number.isInteger(index)))];
			if (!uniqueIndexes.length) {
				return res.status(400).json({ message: 'Please select at least one component for partial acceptance' });
			}

			acceptedComponents = uniqueIndexes
				.filter((index) => index >= 0 && index < quotationComponents.length)
				.map((index) => quotationComponents[index].toObject ? quotationComponents[index].toObject() : quotationComponents[index]);

			if (!acceptedComponents.length) {
				return res.status(400).json({ message: 'Selected components are invalid' });
			}
		}

		const finalCost = acceptedComponents.reduce((sum, component) => sum + (Number(component.unitPrice || 0) * Number(component.quantity || 1)), 0);

		quotation.status = 'accepted';
		// Backfill legacy data: older quotations may miss createdBy, which is now required.
		if (!quotation.createdBy) {
			quotation.createdBy = quotation.vendorId?._id || quotation.vendorId || req.user.id;
		}
		quotation.revisionHistory = quotation.revisionHistory || [];
		quotation.revisionHistory.push({ updatedAt: new Date(), changes: `Quotation accepted (${acceptanceType}) by university` });

		const vendorId = quotation.vendorId?._id || quotation.vendorId;

		const procurementPayload = {
			labProjectId: quotation.labProjectId._id,
			quotationId: quotation._id,
			selectedVendorIds: [vendorId],
			finalCost,
			acceptanceType,
			acceptedComponents,
			approvedByAdmin: false
		};

		const existingProcurement = await Procurement.findOne({ labProjectId: quotation.labProjectId._id });
		if (existingProcurement) {
			existingProcurement.quotationId = procurementPayload.quotationId;
			existingProcurement.selectedVendorIds = procurementPayload.selectedVendorIds;
			existingProcurement.finalCost = procurementPayload.finalCost;
			existingProcurement.acceptanceType = procurementPayload.acceptanceType;
			existingProcurement.acceptedComponents = procurementPayload.acceptedComponents;
			existingProcurement.approvedByAdmin = procurementPayload.approvedByAdmin;
			await existingProcurement.save();
		} else {
			await Procurement.create(procurementPayload);
		}

		await quotation.save();
		await LabProject.findByIdAndUpdate(quotation.labProjectId._id, { status: 'approved' });

		// Send notification to vendor about quotation acceptance (non-blocking)
		(async () => {
			try {
				const lab = await LabProject.findById(quotation.labProjectId._id).select('labName');
				const vendor = await User.findById(vendorId).select('email name vendorInfo.shopName');

				if (vendor) {
					const procurementId = existingProcurement?._id || (await Procurement.findOne({ quotationId: quotation._id }))._id;
					await notificationService.createNotification({
						userId: vendorId.toString(),
						type: 'approval',
						category: 'quotation_accepted',
						message: `Your quotation has been accepted for "${lab?.labName || 'Lab Project'}"! Final cost: $${finalCost}. Acceptance type: ${acceptanceType}`,
						referenceData: {
							resourceType: 'Procurement',
							resourceId: procurementId,
							resourceName: lab?.labName || 'Lab Project'
						},
						actionUrl: `/vendor/procurements/${procurementId}`,
						sendEmail: true,
						priority: 'high'
					});
				}
			} catch (notifError) {
				console.error('[QUOTATION] Error sending acceptance notification:', notifError.message);
			}
		})();

		return res.status(200).json({
			message: 'Quotation accepted successfully',
			quotation,
			acceptedComponents,
			finalCost,
			acceptanceType
		});
	} catch (error) {
		console.error('[QUOTATION] Accept quotation failed:', error);
		return res.status(500).json({
			message: error?.message ? `Failed to accept quotation: ${error.message}` : 'Failed to accept quotation',
			error: error?.message || null
		});
	}
};

exports.getVendorReviewForQuotation = async (req, res) => {
	try {
		const role = await getRole(req.user.id);

		if (role !== 'university') {
			return res.status(403).json({ message: 'Access denied. University only.' });
		}

		const quotation = await Quotation.findById(req.params.id)
			.populate({ path: 'labProjectId', populate: { path: 'universityId', select: populateUniversity } })
			.populate('vendorId', 'name vendorInfo.shopName vendorInfo.rating');

		if (!quotation) {
			return res.status(404).json({ message: 'Quotation not found' });
		}

		const labOwnerId = quotation.labProjectId?.universityId?._id?.toString?.() || quotation.labProjectId?.universityId?.toString?.();
		if (labOwnerId !== req.user.id) {
			return res.status(403).json({ message: 'You can only review vendors for your own lab projects' });
		}

		if (quotation.status !== 'accepted') {
			return res.status(400).json({ message: 'Vendor can be reviewed only after quotation is accepted' });
		}

		const vendorId = quotation.vendorId?._id || quotation.vendorId;
		const existingReview = await Review.findOne({
			reviewerId: req.user.id,
			targetId: vendorId,
			targetType: 'vendor',
			quotationId: quotation._id
		}).sort({ createdAt: -1 });

		return res.status(200).json({
			review: existingReview,
			vendor: {
				id: vendorId,
				name: quotation.vendorId?.vendorInfo?.shopName || quotation.vendorId?.name || 'Vendor',
				rating: Number(quotation.vendorId?.vendorInfo?.rating || 0)
			}
		});
	} catch (error) {
		return res.status(500).json({ message: 'Failed to fetch vendor review', error: error.message });
	}
};

exports.submitVendorReviewForQuotation = async (req, res) => {
	try {
		const role = await getRole(req.user.id);

		if (role !== 'university') {
			return res.status(403).json({ message: 'Access denied. University only.' });
		}

		const { rating, comment } = req.body;
		const numericRating = Number(rating);

		if (!Number.isFinite(numericRating) || numericRating < 1 || numericRating > 5) {
			return res.status(400).json({ message: 'Rating must be a number between 1 and 5' });
		}

		const quotation = await Quotation.findById(req.params.id)
			.populate({ path: 'labProjectId', populate: { path: 'universityId', select: populateUniversity } })
			.populate('vendorId', 'name role vendorInfo.shopName vendorInfo.rating');

		if (!quotation) {
			return res.status(404).json({ message: 'Quotation not found' });
		}

		const labOwnerId = quotation.labProjectId?.universityId?._id?.toString?.() || quotation.labProjectId?.universityId?.toString?.();
		if (labOwnerId !== req.user.id) {
			return res.status(403).json({ message: 'You can only review vendors for your own lab projects' });
		}

		if (quotation.status !== 'accepted') {
			return res.status(400).json({ message: 'Vendor can be reviewed only after quotation is accepted' });
		}

		const vendorId = quotation.vendorId?._id || quotation.vendorId;
		const vendor = await User.findById(vendorId).select('role vendorInfo.rating');

		if (!vendor || vendor.role !== 'vendor') {
			return res.status(404).json({ message: 'Vendor not found' });
		}

		let review = await Review.findOne({
			reviewerId: req.user.id,
			targetId: vendorId,
			targetType: 'vendor',
			quotationId: quotation._id
		});
		let createdNewReview = false;

		if (review) {
			review.rating = numericRating;
			review.comment = String(comment || '').trim();
			await review.save();
		} else {
			createdNewReview = true;
			review = await Review.create({
				reviewerId: req.user.id,
				targetId: vendorId,
				targetType: 'vendor',
				quotationId: quotation._id,
				labProjectId: quotation.labProjectId?._id || quotation.labProjectId,
				rating: numericRating,
				comment: String(comment || '').trim()
			});
		}

		const allVendorReviews = await Review.find({ targetId: vendorId, targetType: 'vendor' }).select('rating');
		const totalRating = allVendorReviews.reduce((sum, item) => sum + Number(item.rating || 0), 0);
		const averageRating = allVendorReviews.length ? Number((totalRating / allVendorReviews.length).toFixed(2)) : 0;

		vendor.vendorInfo = vendor.vendorInfo || {};
		vendor.vendorInfo.rating = averageRating;
		await vendor.save();

		return res.status(200).json({
			message: createdNewReview ? 'Vendor reviewed successfully' : 'Vendor review updated successfully',
			review,
			vendorRating: averageRating,
			totalReviews: allVendorReviews.length
		});
	} catch (error) {
		return res.status(500).json({ message: 'Failed to submit vendor review', error: error.message });
	}
};


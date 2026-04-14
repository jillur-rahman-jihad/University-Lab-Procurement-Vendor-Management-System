const LabProject = require('../models/LabProject');
const Quotation = require('../models/Quotation');
const Procurement = require('../models/Procurement');
const User = require('../models/User');

const populateUniversity = 'name email universityInfo.universityName universityInfo.department';

const getRole = async (userId) => {
	const user = await User.findById(userId).select('role');
	return user?.role || null;
};

const mapLab = (lab) => ({
	...lab.toObject(),
	universityName: lab.universityId?.universityInfo?.universityName || lab.universityId?.name || 'University',
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
				.populate('vendorId', 'name vendorInfo.shopName email');

			return res.status(200).json(myQuotation ? [myQuotation] : []);
		}

		const quotations = await Quotation.find({ labProjectId: req.params.id })
			.populate('vendorId', 'name vendorInfo.shopName email')
			.sort({ createdAt: -1 });

		return res.status(200).json(quotations);
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
			revisionHistory: []
		});

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
			.populate('vendorId', 'name vendorInfo.shopName email')
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

		let acceptedComponents = quotation.components.map((component) => ({ ...component.toObject?.() || component }));

		if (acceptanceType === 'partial') {
			const uniqueIndexes = [...new Set(componentIndexes.map((index) => Number(index)).filter((index) => Number.isInteger(index)))];
			if (!uniqueIndexes.length) {
				return res.status(400).json({ message: 'Please select at least one component for partial acceptance' });
			}

			acceptedComponents = uniqueIndexes
				.filter((index) => index >= 0 && index < quotation.components.length)
				.map((index) => quotation.components[index].toObject ? quotation.components[index].toObject() : quotation.components[index]);

			if (!acceptedComponents.length) {
				return res.status(400).json({ message: 'Selected components are invalid' });
			}
		}

		const finalCost = acceptedComponents.reduce((sum, component) => sum + (Number(component.unitPrice || 0) * Number(component.quantity || 1)), 0);

		quotation.status = 'accepted';
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

		return res.status(200).json({
			message: 'Quotation accepted successfully',
			quotation,
			acceptedComponents,
			finalCost,
			acceptanceType
		});
	} catch (error) {
		return res.status(500).json({ message: 'Failed to accept quotation', error: error.message });
	}
};


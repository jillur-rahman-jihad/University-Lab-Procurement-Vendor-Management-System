const User = require("../models/User");
const LabProject = require("../models/LabProject");
const Procurement = require("../models/Procurement");
const Quotation = require("../models/Quotation");

exports.getUniversityProfile = async (req, res) => {
  try {
    const userId = req.user.id;

    const user = await User.findById(userId).select('-password');

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    if (user.role !== 'university') {
      return res.status(403).json({ message: "Access denied. Only university users can access this." });
    }

    res.json({
      _id: user._id,
      name: user.name,
      email: user.email,
      phone: user.phone,
      universityInfo: {
        universityName: user.universityInfo?.universityName,
        department: user.universityInfo?.department,
        address: user.universityInfo?.address,
        representative: user.universityInfo?.representative,
        isApproved: user.universityInfo?.isApproved,
        subscriptionPlan: user.universityInfo?.subscriptionPlan
      }
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.getProcurementSummary = async (req, res) => {
  try {
    const { labProjectId } = req.params;
    const universityId = req.user.id;

    // Verify the project exists and belongs to the university
    const labProject = await LabProject.findById(labProjectId);

    if (!labProject) {
      return res.status(404).json({ message: "Lab project not found" });
    }

    if (labProject.universityId.toString() !== universityId) {
      return res.status(403).json({ message: "Access denied. You do not own this project." });
    }

    // Find procurement record for this project
    const procurement = await Procurement.findOne({ labProjectId }).populate('quotationId');

    if (!procurement) {
      return res.status(404).json({ message: "No procurement record found for this project" });
    }

    // Get vendor details
    const vendors = await User.find({ _id: { $in: procurement.selectedVendorIds } }).select('name email phone');

    // Build response
    res.json({
      _id: procurement._id,
      projectDetails: {
        _id: labProject._id,
        labName: labProject.labName,
        labType: labProject.labType,
        status: labProject.status,
        createdAt: labProject.createdAt
      },
      quotationDetails: procurement.quotationId ? {
        _id: procurement.quotationId._id,
        totalPrice: procurement.quotationId.totalPrice,
        bulkDiscount: procurement.quotationId.bulkDiscount,
        installationIncluded: procurement.quotationId.installationIncluded,
        maintenanceIncluded: procurement.quotationId.maintenanceIncluded,
        status: procurement.quotationId.status
      } : null,
      selectedVendors: vendors,
      acceptanceType: procurement.acceptanceType,
      acceptedComponents: procurement.acceptedComponents,
      finalCost: procurement.finalCost,
      approvedByAdmin: procurement.approvedByAdmin,
      createdAt: procurement.createdAt,
      updatedAt: procurement.updatedAt
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.downloadProcurementSummary = async (req, res) => {
  try {
    const { labProjectId } = req.params;
    const universityId = req.user.id;

    // Verify the project exists and belongs to the university
    const labProject = await LabProject.findById(labProjectId);

    if (!labProject) {
      return res.status(404).json({ message: "Lab project not found" });
    }

    if (labProject.universityId.toString() !== universityId) {
      return res.status(403).json({ message: "Access denied. You do not own this project." });
    }

    // Find procurement record for this project
    const procurement = await Procurement.findOne({ labProjectId }).populate('quotationId');

    if (!procurement) {
      return res.status(404).json({ message: "No procurement record found for this project" });
    }

    // Get vendor details
    const vendors = await User.find({ _id: { $in: procurement.selectedVendorIds } }).select('name email phone');
    const university = await User.findById(universityId).select('name universityInfo');

    // Helper function to escape CSV fields
    const escapeCSV = (value) => {
      if (value === null || value === undefined) return '';
      const strValue = String(value);
      if (strValue.includes(',') || strValue.includes('"') || strValue.includes('\n')) {
        return `"${strValue.replace(/"/g, '""')}"`;
      }
      return strValue;
    };

    // Build CSV content
    let csv = 'PROCUREMENT SUMMARY REPORT\n\n';

    // Project Details
    csv += 'PROJECT DETAILS\n';
    csv += `Lab Project,${escapeCSV(labProject.labName)}\n`;
    csv += `Lab Type,${escapeCSV(labProject.labType)}\n`;
    csv += `Project Status,${escapeCSV(labProject.status)}\n`;
    csv += `Created Date,${new Date(labProject.createdAt).toLocaleDateString()}\n\n`;

    // University Details
    csv += 'UNIVERSITY DETAILS\n';
    csv += `University Name,${escapeCSV(university?.name)}\n`;
    csv += `University Department,${escapeCSV(university?.universityInfo?.department)}\n`;
    csv += `University Address,${escapeCSV(university?.universityInfo?.address)}\n`;
    csv += `Representative,${escapeCSV(university?.universityInfo?.representative?.name)}\n\n`;

    // Quotation Details
    if (procurement.quotationId) {
      csv += 'QUOTATION DETAILS\n';
      csv += `Total Price,$${procurement.quotationId.totalPrice?.toLocaleString() || '0'}\n`;
      csv += `Bulk Discount,$${procurement.quotationId.bulkDiscount?.toLocaleString() || '0'}\n`;
      csv += `Installation Included,${procurement.quotationId.installationIncluded ? 'Yes' : 'No'}\n`;
      csv += `Maintenance Included,${procurement.quotationId.maintenanceIncluded ? 'Yes' : 'No'}\n`;
      csv += `Quotation Status,${escapeCSV(procurement.quotationId.status)}\n\n`;
    }

    // Selected Vendors
    csv += 'SELECTED VENDORS\n';
    csv += 'Name,Email,Phone\n';
    vendors.forEach(vendor => {
      csv += `${escapeCSV(vendor.name)},${escapeCSV(vendor.email)},${escapeCSV(vendor.phone)}\n`;
    });
    csv += '\n';

    // Accepted Components
    if (procurement.acceptedComponents && procurement.acceptedComponents.length > 0) {
      csv += 'ACCEPTED COMPONENTS\n';
      csv += 'Category,Component Name,Unit Price,Quantity,Total,Warranty,Delivery Time\n';
      procurement.acceptedComponents.forEach(comp => {
        const total = (comp.unitPrice || 0) * (comp.quantity || 0);
        csv += `${escapeCSV(comp.category)},${escapeCSV(comp.name)},${escapeCSV(comp.unitPrice)},${escapeCSV(comp.quantity)},${escapeCSV(total)},${escapeCSV(comp.warranty)},${escapeCSV(comp.deliveryTime)}\n`;
      });
      csv += '\n';
    }

    // Procurement Summary
    csv += 'PROCUREMENT SUMMARY\n';
    csv += `Acceptance Type,${escapeCSV(procurement.acceptanceType)}\n`;
    csv += `Final Cost,$${procurement.finalCost?.toLocaleString() || '0'}\n`;
    csv += `Admin Approved,${procurement.approvedByAdmin ? 'Yes' : 'Pending'}\n`;
    csv += `Generated On,${new Date().toLocaleString()}\n`;

    // Set response headers for file download
    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', `attachment; filename="procurement_${labProjectId}_${Date.now()}.csv"`);
    res.send(csv);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// MODULE 2 - Task 3: Search consultants by expertise
exports.searchConsultants = async (req, res) => {
  try {
    const { expertise } = req.query;
    const universityId = req.user.id;

    // Verify user is a university
    const university = await User.findById(universityId);
    if (!university || university.role !== 'university') {
      return res.status(403).json({ message: "Only universities can search consultants" });
    }

    // Build query
    let query = { role: 'consultant' };
    if (expertise) {
      query['consultantInfo.expertise'] = expertise;
    }

    // Search consultants
    const consultants = await User.find(query).select(
      'name email phone consultantInfo.bio consultantInfo.expertise consultantInfo.experienceLevel consultantInfo.rating consultantInfo.completedLabDeployments'
    );

    res.json({
      consultants: consultants || [],
      total: consultants.length
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// MODULE 2 - Task 3: Hire a consultant
exports.hireConsultant = async (req, res) => {
  try {
    const { consultantId, labProjectId, notes } = req.body;
    const universityId = req.user.id;

    // Validate inputs
    if (!consultantId) {
      return res.status(400).json({ message: "Consultant ID is required" });
    }

    // Verify university exists
    const university = await User.findById(universityId);
    if (!university || university.role !== 'university') {
      return res.status(403).json({ message: "Only universities can hire consultants" });
    }

    // Verify consultant exists
    const consultant = await User.findById(consultantId);
    if (!consultant || consultant.role !== 'consultant') {
      return res.status(404).json({ message: "Consultant not found" });
    }

    // Verify lab project if provided
    if (labProjectId) {
      const labProject = await LabProject.findById(labProjectId);
      if (!labProject || labProject.universityId.toString() !== universityId) {
        return res.status(404).json({ message: "Lab project not found or does not belong to this university" });
      }
    }

    // Import Hiring model
    const Hiring = require("../models/Hiring");

    // Check if already hired
    const existingHiring = await Hiring.findOne({
      universityId,
      consultantId,
      status: { $in: ['pending', 'accepted', 'active'] }
    });

    if (existingHiring) {
      return res.status(400).json({ message: "This consultant is already hired or has a pending hiring request" });
    }

    // Create hiring record
    const hiring = new Hiring({
      universityId,
      consultantId,
      labProjectId: labProjectId || null,
      status: 'pending',
      proposedBy: 'university',
      notes
    });

    await hiring.save();

    // Populate the record
    const populatedHiring = await Hiring.findById(hiring._id)
      .populate('universityId', 'name email')
      .populate('consultantId', 'name email')
      .populate('labProjectId', 'labName');

    res.status(201).json({
      message: "Hiring request created successfully",
      hiring: populatedHiring
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// MODULE 2 - Task 3: Send a chat message
exports.sendMessage = async (req, res) => {
  try {
    const { hiringId, message } = req.body;
    const senderId = req.user.id;

    // Validate inputs
    if (!hiringId || !message) {
      return res.status(400).json({ message: "Hiring ID and message are required" });
    }

    // Import Message model
    const Message = require("../models/Message");
    const Hiring = require("../models/Hiring");

    // Verify hiring exists and user is part of it
    const hiring = await Hiring.findById(hiringId);
    if (!hiring) {
      return res.status(404).json({ message: "Hiring record not found" });
    }

    // Verify sender is either university or consultant in this hiring
    const sender = await User.findById(senderId);
    if (!sender) {
      return res.status(404).json({ message: "User not found" });
    }

    const isInvolved = sender._id.toString() === hiring.universityId.toString() || 
                       sender._id.toString() === hiring.consultantId.toString();
    if (!isInvolved) {
      return res.status(403).json({ message: "You are not part of this hiring" });
    }

    // Create message
    const newMessage = new Message({
      hiringId,
      senderId,
      senderRole: sender.role,
      message
    });

    await newMessage.save();

    // Populate and return
    const populatedMessage = await Message.findById(newMessage._id)
      .populate('senderId', 'name email');

    res.status(201).json({
      message: "Message sent successfully",
      data: populatedMessage
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// MODULE 2 - Task 3: Get chat messages for a hiring
exports.getMessages = async (req, res) => {
  try {
    const { hiringId } = req.params;
    const userId = req.user.id;

    // Import models
    const Message = require("../models/Message");
    const Hiring = require("../models/Hiring");

    // Verify hiring exists
    const hiring = await Hiring.findById(hiringId);
    if (!hiring) {
      return res.status(404).json({ message: "Hiring record not found" });
    }

    // Verify user is part of this hiring
    const isInvolved = userId === hiring.universityId.toString() || 
                       userId === hiring.consultantId.toString();
    if (!isInvolved) {
      return res.status(403).json({ message: "You are not part of this hiring" });
    }

    // Get messages
    const messages = await Message.find({ hiringId })
      .populate('senderId', 'name email role')
      .sort({ createdAt: 1 });

    res.json({
      hiringId,
      messages,
      total: messages.length
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// MODULE 2 - Task 3: Get user's active hirings
exports.getActiveHirings = async (req, res) => {
  try {
    const userId = req.user.id;
    const Hiring = require("../models/Hiring");

    // Get hirings where user is either university or consultant
    const hirings = await Hiring.find({
      $or: [
        { universityId: userId },
        { consultantId: userId }
      ],
      status: { $in: ['pending', 'accepted', 'active'] }
    })
      .populate('universityId', 'name email')
      .populate('consultantId', 'name email')
      .populate('labProjectId', 'labName')
      .sort({ createdAt: -1 });

    res.json({
      hirings,
      total: hirings.length
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// MODULE 2 - Task 3: Request physical infrastructure setup
exports.requestInfrastructureSetup = async (req, res) => {
  try {
    const { serviceType, description, estimatedBudget, labProjectId, location, requiredDate, notes, priority } = req.body;
    const universityId = req.user.id;

    // Validate inputs
    if (!serviceType || !description || !estimatedBudget) {
      return res.status(400).json({ message: "Service type, description, and budget are required" });
    }

    // Verify user is a university
    const user = await User.findById(universityId);
    if (!user || user.role !== 'university') {
      return res.status(403).json({ message: "Only universities can request infrastructure setup" });
    }

    // Verify lab project if provided
    if (labProjectId) {
      const labProject = await LabProject.findById(labProjectId);
      if (!labProject || labProject.universityId.toString() !== universityId) {
        return res.status(404).json({ message: "Lab project not found or does not belong to this university" });
      }
    }

    // Import InfrastructureSetup model
    const InfrastructureSetup = require("../models/InfrastructureSetup");

    // Create infrastructure setup request
    const setupRequest = new InfrastructureSetup({
      universityId,
      serviceType,
      description,
      estimatedBudget,
      labProjectId: labProjectId || null,
      location: location || {},
      requiredDate: requiredDate ? new Date(requiredDate) : null,
      notes,
      priority: priority || 'medium',
      timeline: [{
        status: 'pending',
        notes: 'Request created'
      }]
    });

    await setupRequest.save();

    // Populate the record
    const populatedSetup = await InfrastructureSetup.findById(setupRequest._id)
      .populate('universityId', 'name email')
      .populate('labProjectId', 'labName');

    res.status(201).json({
      message: "Infrastructure setup request created successfully",
      setupRequest: populatedSetup
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// MODULE 2 - Task 3: Get all infrastructure setup requests for university
exports.getInfrastructureRequests = async (req, res) => {
  try {
    const universityId = req.user.id;
    const { status } = req.query;

    // Verify user is a university
    const user = await User.findById(universityId);
    if (!user || user.role !== 'university') {
      return res.status(403).json({ message: "Only universities can view infrastructure requests" });
    }

    // Import InfrastructureSetup model
    const InfrastructureSetup = require("../models/InfrastructureSetup");

    // Build query
    let query = { universityId };
    if (status) {
      query.status = status;
    }

    // Get requests
    const requests = await InfrastructureSetup.find(query)
      .populate('universityId', 'name email')
      .populate('labProjectId', 'labName')
      .populate('vendorAssignedId', 'name email')
      .sort({ createdAt: -1 });

    res.json({
      requests,
      total: requests.length
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// MODULE 2 - Task 3: Get single infrastructure setup request
exports.getInfrastructureRequest = async (req, res) => {
  try {
    const { requestId } = req.params;
    const universityId = req.user.id;

    // Import InfrastructureSetup model
    const InfrastructureSetup = require("../models/InfrastructureSetup");

    // Verify user is a university
    const user = await User.findById(universityId);
    if (!user || user.role !== 'university') {
      return res.status(403).json({ message: "Only universities can view infrastructure requests" });
    }

    // Get request
    const setupRequest = await InfrastructureSetup.findById(requestId)
      .populate('universityId', 'name email')
      .populate('labProjectId', 'labName')
      .populate('vendorAssignedId', 'name email');

    if (!setupRequest) {
      return res.status(404).json({ message: "Infrastructure setup request not found" });
    }

    if (setupRequest.universityId._id.toString() !== universityId) {
      return res.status(403).json({ message: "Access denied" });
    }

    res.json(setupRequest);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// MODULE 2 - Task 3: Accept quote for infrastructure setup
exports.acceptInfrastructureQuote = async (req, res) => {
  try {
    const { requestId } = req.params;
    const universityId = req.user.id;

    // Import InfrastructureSetup model
    const InfrastructureSetup = require("../models/InfrastructureSetup");

    // Verify user is a university
    const user = await User.findById(universityId);
    if (!user || user.role !== 'university') {
      return res.status(403).json({ message: "Only universities can accept infrastructure quotes" });
    }

    // Get request
    const setupRequest = await InfrastructureSetup.findById(requestId);

    if (!setupRequest) {
      return res.status(404).json({ message: "Infrastructure setup request not found" });
    }

    if (setupRequest.universityId.toString() !== universityId) {
      return res.status(403).json({ message: "Access denied" });
    }

    if (!setupRequest.quote || setupRequest.quote.quotedStatus !== 'pending') {
      return res.status(400).json({ message: "No pending quote to accept" });
    }

    // Update status and quote
    setupRequest.status = 'accepted';
    setupRequest.quote.quotedStatus = 'accepted';
    setupRequest.actualCost = setupRequest.quote.quotedPrice;
    setupRequest.timeline.push({
      status: 'accepted',
      notes: 'Quote accepted by university'
    });

    await setupRequest.save();

    const populatedSetup = await InfrastructureSetup.findById(setupRequest._id)
      .populate('universityId', 'name email')
      .populate('labProjectId', 'labName')
      .populate('vendorAssignedId', 'name email');

    res.json({
      message: "Quote accepted successfully",
      setupRequest: populatedSetup
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

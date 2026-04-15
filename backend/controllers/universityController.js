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

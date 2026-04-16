const LabProject = require('../models/LabProject');
const LabProjectAssignment = require('../models/LabProjectAssignment');
const Quotation = require('../models/Quotation');
const Procurement = require('../models/Procurement');
const User = require('../models/User');
const pdfParse = require('pdf-parse');
const Groq = require('groq-sdk');
const PDFDocument = require('pdfkit'); 

exports.createLabProject = async (req, res) => {
    try {
        const { labName, labType, requirements } = req.body;
        const universityId = req.user.id; // JWT payload continues to be mapped

        const newLabProject = new LabProject({
            universityId,
            labName,
            labType,
            requirements
        });

        await newLabProject.save();
        res.status(201).json({ message: 'Lab project created successfully', labProject: newLabProject });
    } catch (error) {
        res.status(500).json({ message: 'Error creating lab project', error: error.stack });
    }
};

exports.uploadAndParsePDF = async (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({ message: 'No PDF file provided.' });
        }
        
        if (!process.env.GROQ_API_KEY) {
            return res.status(500).json({ message: 'Server configuration error: GROQ_API_KEY is missing in your .env file or not loaded.' });
        }

        let text = "";
        try {
            // Extract text from PDF buffer
            const data = await pdfParse(req.file.buffer);
            text = data.text;
        } catch (pdfErr) {
            console.error('PDF Parse Error:', pdfErr);
            return res.status(500).json({ message: `Failed to extract text from the provided PDF. Details: ${pdfErr.message}` });
        }
        
        let content = "";
        try {
            const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });
            const prompt = `You are an academic assistant. Based on the given course outline, generate ONLY two sections:

1. Hardware Requirements
2. Software Requirements

Rules:
- Each section must be one concise paragraph
- Do not add explanations, headings, or extra text beyond the two sections
- Hardware requirements must include essential system components (CPU, RAM, storage, etc.)
- Software requirements must include OS, softwares,  tools, and libraries
- Keep it formal and suitable for a university report
 Extract the following details from the document text below and output it strictly in JSON format matching this schema.
{
  "mainRequirement": "Brief Hardware required for a system to conduct the lab smoothly and efficiently.",
  "software": "Comma separated list of required OS, softwares,  tools, and libraries needed to conduct the lab.",
}

Document Text (truncated):
"""
${text.substring(0, 15000)}
"""`;

            const chatCompletion = await groq.chat.completions.create({
                messages: [{ role: 'user', content: prompt }],
                model: 'openai/gpt-oss-120b',
                temperature: 0.2,
                response_format: { type: 'json_object' }
            });
            content = chatCompletion.choices[0]?.message?.content || "{}";
        } catch (apiErr) {
            console.error('Groq API Error:', apiErr);
            return res.status(500).json({ message: `Groq API refused or failed to process the request. Details: ${apiErr.message}` });
        }
        
        try {
            // Remove markdown formatting if present
            let jsonStr = content.trim();
            if (jsonStr.startsWith('```json')) jsonStr = jsonStr.substring(7);
            if (jsonStr.startsWith('```')) jsonStr = jsonStr.substring(3);
            if (jsonStr.endsWith('```')) jsonStr = jsonStr.substring(0, jsonStr.length - 3);
            
            const extractedData = JSON.parse(jsonStr.trim());
            
            return res.status(200).json({
                message: 'Successfully extracted info from PDF',
                requirements: extractedData
            });
        } catch (parseErr) {
            console.error('JSON Parse Error. Content was:', content);
            return res.status(500).json({ message: 'Failed to convert AI response to JSON. The AI output was malformed.', error: parseErr.message, content });
        }
    } catch (error) {
        console.error('Unexpected error parsing PDF:', error);
        res.status(500).json({ message: 'Unexpected Error extracting text from PDF', error: error.message });
    }
};

// ============ MODULE 2 - Task 2B: Lab Planning & Procurement Management ============

// Request equipment (Stage 1)
exports.requestEquipment = async (req, res) => {
  try {
    const universityId = req.user.id;
    const {
      equipmentName,
      equipmentType,
      quantity,
      specifications,
      requestedDate,
      budget,
      labAssignment
    } = req.body;

    if (!equipmentName || !equipmentType || !quantity || !budget) {
      return res.status(400).json({
        message: "Missing required fields: equipmentName, equipmentType, quantity, budget"
      });
    }

    if (quantity <= 0 || budget <= 0) {
      return res.status(400).json({ message: "Quantity and budget must be greater than 0" });
    }

    const newRequest = new LabProject({
      universityId,
      labName: equipmentName,
      labType: equipmentType,
      requirements: {
        quantity,
        specifications,
        requestedDate: requestedDate || new Date(),
        budget,
        status: "pending"
      }
    });

    const saved = await newRequest.save();
    console.log("[LAB] Equipment request created:", saved._id);

    res.status(201).json({
      message: "Equipment request submitted successfully",
      request: saved
    });
  } catch (error) {
    console.error("[LAB] Error creating equipment request:", error);
    res.status(500).json({
      message: "Error creating equipment request",
      error: error.message
    });
  }
};

// Get university's equipment requests
exports.getUniversityEquipmentRequests = async (req, res) => {
  try {
    const universityId = req.user.id;
    const { status } = req.query;

    let filter = { universityId };
    if (status) {
      filter["requirements.status"] = status;
    }

    const requests = await LabProject.find(filter).sort({ createdAt: -1 });

    res.status(200).json({
      message: "Equipment requests retrieved successfully",
      requests
    });
  } catch (error) {
    console.error("[LAB] Error fetching equipment requests:", error);
    res.status(500).json({
      message: "Error fetching equipment requests",
      error: error.message
    });
  }
};

// Get available equipment
exports.getAvailableEquipment = async (req, res) => {
  try {
    const { equipmentType, minBudget, maxBudget } = req.query;

    let filter = {};
    if (equipmentType) {
      filter.labType = equipmentType;
    }

    const equipment = await LabProject.find(filter).sort({ createdAt: -1 });

    let filtered = equipment.filter(e => {
      if (minBudget && e.requirements.budget < minBudget) return false;
      if (maxBudget && e.requirements.budget > maxBudget) return false;
      return true;
    });

    res.status(200).json({
      message: "Available equipment retrieved successfully",
      equipment: filtered
    });
  } catch (error) {
    console.error("[LAB] Error fetching available equipment:", error);
    res.status(500).json({
      message: "Error fetching available equipment",
      error: error.message
    });
  }
};

// Get equipment details
exports.getEquipmentDetails = async (req, res) => {
  try {
    const { equipmentId } = req.params;

    const equipment = await LabProject.findById(equipmentId);
    if (!equipment) {
      return res.status(404).json({ message: "Equipment not found" });
    }

    res.status(200).json({
      message: "Equipment details retrieved successfully",
      equipment
    });
  } catch (error) {
    console.error("[LAB] Error fetching equipment details:", error);
    res.status(500).json({
      message: "Error fetching equipment details",
      error: error.message
    });
  }
};

// Update equipment request status
exports.updateEquipmentRequestStatus = async (req, res) => {
  try {
    const { requestId } = req.params;
    const { status } = req.body;

    const validStatuses = ["pending", "approved", "rejected"];
    if (!validStatuses.includes(status)) {
      return res.status(400).json({ message: "Invalid status" });
    }

    const request = await LabProject.findById(requestId);
    if (!request) {
      return res.status(404).json({ message: "Request not found" });
    }

    request.requirements.status = status;
    const updated = await request.save();

    console.log("[LAB] Equipment request status updated:", requestId, "->", status);

    res.status(200).json({
      message: "Equipment request status updated successfully",
      request: updated
    });
  } catch (error) {
    console.error("[LAB] Error updating equipment request:", error);
    res.status(500).json({
      message: "Error updating equipment request",
      error: error.message
    });
  }
};

// Submit procurement order (Stage 2)
exports.submitProcurement = async (req, res) => {
  try {
    const { requestId } = req.params;
    const { vendorId, quotationId, expectedDeliveryDate } = req.body;

    if (!vendorId || !quotationId) {
      return res.status(400).json({
        message: "Missing required fields: vendorId, quotationId"
      });
    }

    const request = await LabProject.findById(requestId);
    if (!request) {
      return res.status(404).json({ message: "Equipment request not found" });
    }

    const procurement = new Procurement({
      equipmentRequestId: requestId,
      vendorId,
      quotationId,
      universityId: request.universityId,
      totalAmount: request.requirements.budget,
      expectedDeliveryDate: expectedDeliveryDate || new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
      status: "pending"
    });

    const saved = await procurement.save();
    request.requirements.status = "procurement-submitted";
    await request.save();

    console.log("[LAB] Procurement order created:", saved._id);

    res.status(201).json({
      message: "Procurement order submitted successfully",
      procurement: saved
    });
  } catch (error) {
    console.error("[LAB] Error submitting procurement:", error);
    res.status(500).json({
      message: "Error submitting procurement order",
      error: error.message
    });
  }
};

// Get procurement details
exports.getProcurementDetails = async (req, res) => {
  try {
    const { id } = req.params; // Route parameter is :id, not orderId

    const procurement = await Procurement.findById(id)
      .populate("vendorId", "name email phone")
      .populate("quotationId")
      .populate("equipmentRequestId");

    if (!procurement) {
      return res.status(404).json({ message: "Procurement order not found" });
    }

    res.status(200).json({
      message: "Procurement details retrieved successfully",
      procurement
    });
  } catch (error) {
    console.error("[LAB] Error fetching procurement details:", error);
    res.status(500).json({
      message: "Error fetching procurement details",
      error: error.message
    });
  }
};

// Update procurement status
exports.updateProcurementStatus = async (req, res) => {
  try {
    const { orderId } = req.params;
    const { status } = req.body;

    const validStatuses = ["pending", "approved", "ordered", "delivered", "installed"];
    if (!validStatuses.includes(status)) {
      return res.status(400).json({ message: "Invalid status" });
    }

    const procurement = await Procurement.findById(orderId);
    if (!procurement) {
      return res.status(404).json({ message: "Procurement order not found" });
    }

    procurement.status = status;
    if (status === "delivered") {
      procurement.deliveryDate = new Date();
    }
    if (status === "installed") {
      procurement.installationDate = new Date();
    }

    const updated = await procurement.save();

    console.log("[LAB] Procurement status updated:", orderId, "->", status);

    res.status(200).json({
      message: "Procurement status updated successfully",
      procurement: updated
    });
  } catch (error) {
    console.error("[LAB] Error updating procurement status:", error);
    res.status(500).json({
      message: "Error updating procurement status",
      error: error.message
    });
  }
};

// Get available lab projects
exports.getAvailableProjects = async (req, res) => {
  try {
    const projects = await LabProject.find({
      "assignmentStatus": { $ne: "assigned" }
    })
      .populate("universityId", "name email")
      .sort({ createdAt: -1 });

    res.status(200).json({
      message: "Available projects retrieved successfully",
      projects
    });
  } catch (error) {
    console.error("[LAB] Error fetching available projects:", error);
    res.status(500).json({
      message: "Error fetching available projects",
      error: error.message
    });
  }
};

// Assign project to university
exports.assignProject = async (req, res) => {
  try {
    const universityId = req.user.id;
    const { projectId, consultantId } = req.body;

    if (!projectId || !consultantId) {
      return res.status(400).json({
        message: "Missing required fields: projectId, consultantId"
      });
    }

    const project = await LabProject.findById(projectId);
    if (!project) {
      return res.status(404).json({ message: "Project not found" });
    }

    const assignment = new LabProjectAssignment({
      projectId,
      universityId,
      consultantId,
      status: "active",
      startDate: new Date()
    });

    const saved = await assignment.save();
    project.assignmentStatus = "assigned";
    await project.save();

    console.log("[LAB] Project assigned:", saved._id);

    res.status(201).json({
      message: "Project assigned successfully",
      assignment: saved
    });
  } catch (error) {
    console.error("[LAB] Error assigning project:", error);
    res.status(500).json({
      message: "Error assigning project",
      error: error.message
    });
  }
};

// Get university's project assignments
exports.getUniversityProjectAssignments = async (req, res) => {
  try {
    const universityId = req.user.id;

    const assignments = await LabProjectAssignment.find({ universityId })
      .populate("projectId", "labName labType requirements")
      .populate("consultantId", "name email phone consultantInfo")
      .sort({ createdAt: -1 });

    res.status(200).json({
      message: "University project assignments retrieved successfully",
      assignments
    });
  } catch (error) {
    console.error("[LAB] Error fetching project assignments:", error);
    res.status(500).json({
      message: "Error fetching project assignments",
      error: error.message
    });
  }
};

exports.getUserLabProjects = async (req, res) => {
    try {
        const universityId = req.user.id;

        const labProjects = await LabProject.find({ universityId })
            .sort({ createdAt: -1 })
            .exec();

        if (labProjects.length === 0) {
            return res.status(200).json({ message: 'No lab projects found', projects: [] });
        }

        const Quotation = require('../models/Quotation');

        const projectsWithQuotationCount = await Promise.all(
            labProjects.map(async (project) => {
                const quotationCount = await Quotation.countDocuments({ labProjectId: project._id });
                return {
                    _id: project._id,
                    labName: project.labName,
                    labType: project.labType,
                    status: project.status,
                    createdAt: project.createdAt,
                    quotationCount
                };
            })
        );

        res.status(200).json({ message: 'Lab projects fetched successfully', projects: projectsWithQuotationCount });
    } catch (error) {
        res.status(500).json({ message: 'Error fetching lab projects', error: error.message });
    }
};

exports.getLabProjectById = async (req, res) => {
    try {
        const { labProjectId } = req.params;
        const universityId = req.user.id;

        const labProject = await LabProject.findById(labProjectId);

        if (!labProject) {
            return res.status(404).json({ message: 'Lab project not found' });
        }

        if (labProject.universityId.toString() !== universityId) {
            return res.status(403).json({ message: 'Access denied. You do not own this project.' });
        }

        res.status(200).json({
            _id: labProject._id,
            labName: labProject.labName,
            labType: labProject.labType,
            requirements: labProject.requirements,
            courseOutlineFile: labProject.courseOutlineFile,
            aiRecommendation: labProject.aiRecommendation
        });
    } catch (error) {
        res.status(500).json({ message: 'Error fetching lab project', error: error.message });
    }
};

// ============ Export Lab Project Documentation ============
exports.exportLabProjectDocumentation = async (req, res) => {
    try {
        const { labProjectId } = req.params;
        const universityId = req.user.id;

        // Fetch lab project
        const labProject = await LabProject.findById(labProjectId).populate('universityId', 'name email');
        
        if (!labProject) {
            return res.status(404).json({ message: 'Lab project not found' });
        }

        // Verify ownership
        if (labProject.universityId._id.toString() !== universityId) {
            return res.status(403).json({ message: 'Access denied. You do not own this project.' });
        }

        // Fetch all related quotations
        const quotations = await Quotation.find({ labProjectId }).populate('vendorId', 'name email university');

        // Fetch all related procurements
        const procurements = await Procurement.find({ labProjectId }).populate('selectedVendorIds', 'name email university');

        // Fetch lab project assignments
        const assignments = await LabProjectAssignment.find({ labProjectId }).populate('consultantId', 'name email expertise');

        // Calculate comprehensive cost breakdown
        let totalComponentsCost = 0;
        let totalInstallationCost = 0;
        let totalMaintenanceCost = 0;
        const costBreakdown = [];

        quotations.forEach((quotation, qIdx) => {
            let quotationCost = 0;
            quotation.components?.forEach((comp) => {
                const componentTotal = (comp.unitPrice || 0) * (comp.quantity || 1);
                quotationCost += componentTotal;
                totalComponentsCost += componentTotal;
            });

            const installationCost = quotation.installationIncluded ? quotationCost * 0.1 : 0;
            const maintenanceCost = quotation.maintenanceIncluded ? quotationCost * 0.05 : 0;
            
            if (quotation.installationIncluded) totalInstallationCost += installationCost;
            if (quotation.maintenanceIncluded) totalMaintenanceCost += maintenanceCost;

            costBreakdown.push({
                vendorName: quotation.vendorId?.name || 'Unknown Vendor',
                componentsCost: `$${quotationCost.toFixed(2)}`,
                installationCost: quotation.installationIncluded ? `$${installationCost.toFixed(2)}` : '$0',
                maintenanceCost: quotation.maintenanceIncluded ? `$${maintenanceCost.toFixed(2)}` : '$0',
                bulkDiscount: `${quotation.bulkDiscount || 0}%`,
                discountAmount: `$${((quotationCost * (quotation.bulkDiscount || 0)) / 100).toFixed(2)}`,
                subtotal: `$${(quotationCost + installationCost + maintenanceCost).toFixed(2)}`,
                finalTotal: `$${(quotation.totalPrice || quotationCost + installationCost + maintenanceCost).toFixed(2)}`
            });
        });

        // Generate comprehensive documentation
        const documentation = {
            documentMetadata: {
                exportDate: new Date().toISOString(),
                exportedBy: req.user.id,
                documentVersion: '1.0',
                documentTitle: `Lab Project Comprehensive Documentation - ${labProject.labName}`
            },
            
            projectInformation: {
                projectId: labProject._id,
                projectName: labProject.labName,
                projectType: labProject.labType,
                status: labProject.status,
                createdAt: labProject.createdAt,
                updatedAt: labProject.updatedAt,
                timeline: labProject.requirements?.timeline || 'Not specified'
            },

            universityInformation: {
                universityId: labProject.universityId._id,
                universityName: labProject.universityId.name,
                universityEmail: labProject.universityId.email
            },

            // ===== COMPLETE LAB CONFIGURATION =====
            labConfiguration: {
                configurationSummary: {
                    systemsCount: labProject.requirements?.systems || 0,
                    performancePriority: labProject.requirements?.performancePriority || 'Not specified',
                    estimatedPowerConsumption: `${labProject.aiRecommendation?.powerConsumption || 0} W`,
                    totalMainRequirement: labProject.requirements?.mainRequirement || 'Not specified'
                },
                requiredSoftware: {
                    softwareList: labProject.requirements?.software || [],
                    totalSoftwarePackages: (labProject.requirements?.software || []).length
                },
                budgetConfiguration: {
                    minimumBudget: `$${labProject.requirements?.budgetMin || 0}`,
                    maximumBudget: `$${labProject.requirements?.budgetMax || 0}`,
                    budgetRange: labProject.requirements?.budgetMax - labProject.requirements?.budgetMin || 0
                }
            },

            // ===== AI RECOMMENDATIONS =====
            aiRecommendations: labProject.aiRecommendation ? {
                totalEstimatedCost: `$${labProject.aiRecommendation.totalEstimatedCost || 0}`,
                powerConsumption: `${labProject.aiRecommendation.powerConsumption || 0} W`,
                componentCount: labProject.aiRecommendation.suggestedComponents?.length || 0,
                components: (labProject.aiRecommendation.suggestedComponents || []).map((component, index) => ({
                    componentNumber: index + 1,
                    name: component.name,
                    specifications: component.specs,
                    estimatedPrice: `$${component.estimatedPrice || 0}`
                }))
            } : null,

            // ===== DETAILED VENDOR QUOTATION INFORMATION =====
            vendorQuotations: {
                totalQuotations: quotations.length,
                quotationDetails: quotations.map((quotation, index) => ({
                    quotationNumber: index + 1,
                    vendorInformation: {
                        vendorName: quotation.vendorId?.name || 'Unknown Vendor',
                        vendorEmail: quotation.vendorId?.email || 'N/A',
                        vendorUniversity: quotation.vendorId?.university || 'N/A'
                    },
                    quotationStatus: quotation.status,
                    quotationDate: quotation.createdAt,
                    lastUpdated: quotation.updatedAt,
                    
                    // ===== WARRANTY TERMS =====
                    warrantyTerms: {
                        componentsWithWarranty: (quotation.components || []).filter(c => c.warranty && c.warranty !== 'Not specified').length,
                        warrantyDetails: (quotation.components || []).map((comp, idx) => ({
                            componentIndex: idx + 1,
                            componentName: comp.name,
                            warranty: comp.warranty || 'No warranty',
                            quantity: comp.quantity || 0
                        })),
                        installationIncluded: quotation.installationIncluded || false,
                        maintenanceIncluded: quotation.maintenanceIncluded || false,
                        maintenanceNote: quotation.maintenanceIncluded ? 'Included in quotation' : 'Not included'
                    },

                    // ===== DEPLOYMENT SCHEDULES =====
                    deploymentSchedule: {
                        expectedDeliveryTimes: (quotation.components || []).map((comp, idx) => ({
                            componentIndex: idx + 1,
                            componentName: comp.name,
                            deliveryTime: comp.deliveryTime || 'Not specified',
                            quantity: comp.quantity || 0
                        })),
                        estimatedDeploymentStart: quotation.components?.length > 0 ? 'Upon component delivery completion' : 'Not specified',
                        overallDeploymentTimeline: 'As per delivery times of slowest component'
                    },

                    // ===== COMPONENT DETAILS =====
                    componentsBreakdown: {
                        totalComponents: quotation.components?.length || 0,
                        components: (quotation.components || []).map((comp, idx) => ({
                            componentIndex: idx + 1,
                            category: comp.category,
                            name: comp.name,
                            unitPrice: `$${comp.unitPrice || 0}`,
                            quantity: comp.quantity || 0,
                            lineTotalPrice: `$${((comp.unitPrice || 0) * (comp.quantity || 1)).toFixed(2)}`,
                            warranty: comp.warranty || 'Not specified',
                            deliveryTime: comp.deliveryTime || 'Not specified'
                        }))
                    },

                    // ===== PRICING SUMMARY =====
                    pricingSummary: {
                        totalComponentsPrice: `$${(quotation.components || []).reduce((sum, c) => sum + ((c.unitPrice || 0) * (c.quantity || 1)), 0).toFixed(2)}`,
                        bulkDiscount: `${quotation.bulkDiscount || 0}%`,
                        discountAmount: `$${(((quotation.components || []).reduce((sum, c) => sum + ((c.unitPrice || 0) * (c.quantity || 1)), 0) * (quotation.bulkDiscount || 0)) / 100).toFixed(2)}`,
                        installationCost: quotation.installationIncluded ? `$${(((quotation.components || []).reduce((sum, c) => sum + ((c.unitPrice || 0) * (c.quantity || 1)), 0) * 0.1)).toFixed(2)}` : '$0',
                        maintenanceCost: quotation.maintenanceIncluded ? `$${(((quotation.components || []).reduce((sum, c) => sum + ((c.unitPrice || 0) * (c.quantity || 1)), 0) * 0.05)).toFixed(2)}` : '$0',
                        totalQuotationPrice: `$${quotation.totalPrice || 0}`
                    }
                }))
            },

            // ===== FULL COST BREAKDOWN =====
            comprehensiveCostBreakdown: {
                overallSummary: {
                    totalComponentsCost: `$${totalComponentsCost.toFixed(2)}`,
                    totalInstallationCost: `$${totalInstallationCost.toFixed(2)}`,
                    totalMaintenanceCost: `$${totalMaintenanceCost.toFixed(2)}`,
                    totalAggregatedCost: `$${(totalComponentsCost + totalInstallationCost + totalMaintenanceCost).toFixed(2)}`
                },
                breakdownByVendor: costBreakdown,
                averageCostPerVendor: quotations.length > 0 ? `$${(quotations.reduce((sum, q) => sum + (q.totalPrice || 0), 0) / quotations.length).toFixed(2)}` : '$0',
                lowestQuotation: quotations.length > 0 ? `$${Math.min(...quotations.map(q => q.totalPrice || 0)).toFixed(2)}` : '$0',
                highestQuotation: quotations.length > 0 ? `$${Math.max(...quotations.map(q => q.totalPrice || 0)).toFixed(2)}` : '$0'
            },

            // ===== PROCUREMENTS SUMMARY =====
            procurementsSummary: {
                totalProcurements: procurements.length,
                procurements: procurements.map((procurement, index) => ({
                    procurementNumber: index + 1,
                    vendorCount: procurement.selectedVendorIds?.length || 0,
                    vendors: (procurement.selectedVendorIds || []).map((vendor, vIdx) => ({
                        vendorIndex: vIdx + 1,
                        vendorName: vendor.name,
                        vendorEmail: vendor.email
                    })),
                    acceptanceType: procurement.acceptanceType || 'Not specified',
                    finalCost: `$${procurement.finalCost || 0}`,
                    acceptedComponentCount: procurement.acceptedComponents?.length || 0,
                    components: (procurement.acceptedComponents || []).map((comp, idx) => ({
                        componentIndex: idx + 1,
                        category: comp.category,
                        name: comp.name,
                        unitPrice: `$${comp.unitPrice || 0}`,
                        quantity: comp.quantity || 0,
                        warranty: comp.warranty || 'Not specified',
                        deliveryTime: comp.deliveryTime || 'Not specified'
                    })),
                    approvedByAdmin: procurement.approvedByAdmin || false,
                    createdAt: procurement.createdAt,
                    updatedAt: procurement.updatedAt
                }))
            },

            // ===== CONSULTANT ASSIGNMENTS =====
            consultantAssignments: {
                totalAssignments: assignments.length,
                assignments: assignments.map((assignment, index) => ({
                    assignmentNumber: index + 1,
                    consultantName: assignment.consultantId?.name || 'Unknown',
                    consultantEmail: assignment.consultantId?.email || 'N/A',
                    consultantExpertise: assignment.consultantId?.expertise || 'Not specified',
                    assignmentStatus: assignment.status || 'Not specified',
                    hoursAllocated: assignment.hoursAllocated || 0,
                    assignedAt: assignment.createdAt
                }))
            },

            // ===== DOCUMENTATION SUMMARY =====
            documentationSummary: {
                projectStatus: labProject.status,
                totalQuotationsReceived: quotations.length,
                totalProcurementsProcessed: procurements.length,
                totalConsultantsAssigned: assignments.length,
                documentsGeneratedAt: new Date().toISOString(),
                documentationCompleteness: {
                    hasCompleteLabConfiguration: !!labProject.requirements,
                    hasVendorQuotations: quotations.length > 0,
                    hasWarrantyTerms: quotations.some(q => q.components?.some(c => c.warranty)),
                    hasDeploymentSchedules: quotations.some(q => q.components?.some(c => c.deliveryTime)),
                    hasCompleteCosting: costBreakdown.length > 0
                }
            }
        };

        // Find the best quotation (lowest price)
        const bestQuotation = quotations.reduce((best, current) => {
            return (current.totalPrice || 0) < (best?.totalPrice || Infinity) ? current : best;
        }, null);

        if (bestQuotation) {
            documentation.recommendedQuotation = {
                vendorName: bestQuotation.vendorId?.name || 'Unknown',
                vendorEmail: bestQuotation.vendorId?.email || 'N/A',
                price: `$${bestQuotation.totalPrice || 0}`,
                reason: 'Lowest total price',
                warrantyTerms: bestQuotation.components?.map(c => c.warranty).filter(w => w)
            };
        }

        // Set response headers for download
        res.setHeader('Content-Type', 'application/json');
        res.setHeader('Content-Disposition', `attachment; filename="Lab_Project_Documentation_${labProjectId}_${Date.now()}.json"`);

        res.status(200).json(documentation);
    } catch (error) {
        console.error('[LAB] Error exporting documentation:', error);
        res.status(500).json({ 
            message: 'Error exporting lab project documentation', 
            error: error.message 
        });
    }
};

// ============ Export Lab Project Documentation as PDF ============
exports.exportLabProjectDocumentationPDF = async (req, res) => {
    try {
        const { labProjectId } = req.params;
        const universityId = req.user.id;

        // Fetch lab project
        const labProject = await LabProject.findById(labProjectId).populate('universityId', 'name email');
        
        if (!labProject) {
            return res.status(404).json({ message: 'Lab project not found' });
        }

        // Verify ownership
        if (labProject.universityId._id.toString() !== universityId) {
            return res.status(403).json({ message: 'Access denied. You do not own this project.' });
        }

        // Fetch all related quotations
        const quotations = await Quotation.find({ labProjectId }).populate('vendorId', 'name email university');

        // Fetch all related procurements
        const procurements = await Procurement.find({ labProjectId }).populate('selectedVendorIds', 'name email university');

        // Fetch lab project assignments
        const assignments = await LabProjectAssignment.find({ labProjectId }).populate('consultantId', 'name email expertise');

        // Create PDF document
        const doc = new PDFDocument({ margin: 50, size: 'A4' });
        
        // Set response headers for PDF download
        res.setHeader('Content-Type', 'application/pdf');
        res.setHeader('Content-Disposition', `attachment; filename="Lab_Project_Documentation_${labProjectId}_${Date.now()}.pdf"`);

        // Pipe the PDF to the response
        doc.pipe(res);

        // ===== TITLE PAGE =====
        doc.fontSize(24).font('Helvetica-Bold').text('LAB PROJECT', { align: 'center' });
        doc.fontSize(24).font('Helvetica-Bold').text('COMPREHENSIVE DOCUMENTATION', { align: 'center' });
        doc.moveDown(2);
        
        doc.fontSize(14).font('Helvetica').text(`Project: ${labProject.labName}`, { align: 'center' });
        doc.fontSize(12).text(`Type: ${labProject.labType}`, { align: 'center' });
        doc.fontSize(12).text(`University: ${labProject.universityId.name}`, { align: 'center' });
        doc.fontSize(12).text(`Generated: ${new Date().toLocaleDateString()}`, { align: 'center' });
        
        doc.moveDown(1).fontSize(10).text('━'.repeat(80), { align: 'center' });
        doc.moveDown(3);

        // ===== PROJECT INFORMATION =====
        doc.fontSize(14).font('Helvetica-Bold').text('1. PROJECT INFORMATION');
        doc.fontSize(10).font('Helvetica');
        doc.moveDown(0.5);
        doc.text(`Project Name: ${labProject.labName}`);
        doc.text(`Project Type: ${labProject.labType}`);
        doc.text(`Status: ${labProject.status}`);
        doc.text(`Created: ${new Date(labProject.createdAt).toLocaleDateString()}`);
        doc.moveDown(1.5);

        // ===== UNIVERSITY INFORMATION =====
        doc.fontSize(14).font('Helvetica-Bold').text('2. UNIVERSITY INFORMATION');
        doc.fontSize(10).font('Helvetica');
        doc.moveDown(0.5);
        doc.text(`University Name: ${labProject.universityId.name}`);
        doc.text(`Email: ${labProject.universityId.email}`);
        doc.moveDown(1.5);

        // ===== LAB CONFIGURATION =====
        doc.fontSize(14).font('Helvetica-Bold').text('3. LAB CONFIGURATION');
        doc.fontSize(10).font('Helvetica');
        doc.moveDown(0.5);
        doc.text(`Systems Count: ${labProject.requirements?.systems || 'N/A'}`);
        doc.text(`Performance Priority: ${labProject.requirements?.performancePriority || 'N/A'}`);
        doc.text(`Power Consumption: ${labProject.aiRecommendation?.powerConsumption || 0} W`);
        doc.text(`Budget Range: $${labProject.requirements?.budgetMin || 0} - $${labProject.requirements?.budgetMax || 0}`);
        doc.moveDown(0.5);
        doc.text('Main Requirement:', { underline: true });
        doc.fontSize(9).text(labProject.requirements?.mainRequirement || 'Not specified', { align: 'left' });
        
        if (labProject.requirements?.software && labProject.requirements.software.length > 0) {
            doc.moveDown(0.5);
            doc.fontSize(10).text('Required Software:', { underline: true });
            doc.fontSize(9);
            labProject.requirements.software.forEach(sw => {
                doc.text(`• ${sw}`);
            });
        }
        doc.moveDown(1.5);

        // ===== VENDOR QUOTATIONS =====
        doc.fontSize(14).font('Helvetica-Bold').text('4. VENDOR QUOTATIONS');
        doc.fontSize(10).font('Helvetica');
        doc.moveDown(0.5);
        doc.text(`Total Quotations: ${quotations.length}`);
        doc.moveDown(1);

        quotations.forEach((quotation, idx) => {
            doc.fontSize(11).font('Helvetica-Bold').text(`Quotation ${idx + 1}: ${quotation.vendorId?.name || 'Unknown Vendor'}`);
            doc.fontSize(9).font('Helvetica');
            doc.text(`Email: ${quotation.vendorId?.email || 'N/A'}`);
            doc.text(`Total Price: $${quotation.totalPrice || 0}`);
            doc.text(`Bulk Discount: ${quotation.bulkDiscount || 0}%`);
            doc.text(`Installation Included: ${quotation.installationIncluded ? 'Yes' : 'No'}`);
            doc.text(`Maintenance Included: ${quotation.maintenanceIncluded ? 'Yes' : 'No'}`);
            
            // Components
            if (quotation.components && quotation.components.length > 0) {
                doc.moveDown(0.3);
                doc.text('Components:', { underline: true });
                quotation.components.forEach((comp, cIdx) => {
                    doc.fontSize(8).text(`  ${cIdx + 1}. ${comp.name} (${comp.category})`);
                    doc.text(`     Unit Price: $${comp.unitPrice || 0} | Qty: ${comp.quantity || 0} | Warranty: ${comp.warranty || 'N/A'}`);
                    doc.text(`     Delivery Time: ${comp.deliveryTime || 'Not specified'}`);
                });
            }
            doc.moveDown(0.8);
        });
        doc.moveDown(0.5);

        // ===== COST BREAKDOWN =====
        doc.fontSize(14).font('Helvetica-Bold').text('5. COMPREHENSIVE COST BREAKDOWN');
        doc.fontSize(10).font('Helvetica');
        doc.moveDown(0.5);

        let totalComponentsCost = 0;
        let totalInstallationCost = 0;
        let totalMaintenanceCost = 0;

        quotations.forEach((quotation) => {
            let quotationCost = 0;
            quotation.components?.forEach((comp) => {
                quotationCost += (comp.unitPrice || 0) * (comp.quantity || 1);
            });
            totalComponentsCost += quotationCost;
            
            if (quotation.installationIncluded) totalInstallationCost += quotationCost * 0.1;
            if (quotation.maintenanceIncluded) totalMaintenanceCost += quotationCost * 0.05;
        });

        doc.text(`Total Components Cost: $${totalComponentsCost.toFixed(2)}`);
        doc.text(`Total Installation Cost: $${totalInstallationCost.toFixed(2)}`);
        doc.text(`Total Maintenance Cost: $${totalMaintenanceCost.toFixed(2)}`);
        doc.text(`Total Aggregated Cost: $${(totalComponentsCost + totalInstallationCost + totalMaintenanceCost).toFixed(2)}`, { bold: true });
        
        if (quotations.length > 0) {
            const prices = quotations.map(q => q.totalPrice || 0);
            doc.text(`Lowest Quotation: $${Math.min(...prices).toFixed(2)}`);
            doc.text(`Highest Quotation: $${Math.max(...prices).toFixed(2)}`);
            doc.text(`Average Quotation: $${(prices.reduce((a, b) => a + b, 0) / quotations.length).toFixed(2)}`);
        }
        doc.moveDown(1.5);

        // ===== WARRANTY TERMS =====
        doc.fontSize(14).font('Helvetica-Bold').text('6. WARRANTY TERMS');
        doc.fontSize(10).font('Helvetica');
        doc.moveDown(0.5);
        doc.text('Component Warranties:');
        quotations.forEach((quotation, qIdx) => {
            if (quotation.components && quotation.components.length > 0) {
                doc.fontSize(9).text(`  Vendor ${qIdx + 1}: ${quotation.vendorId?.name || 'Unknown'}`);
                quotation.components.forEach((comp, cIdx) => {
                    doc.fontSize(8).text(`    • ${comp.name}: ${comp.warranty || 'No warranty specified'}`);
                });
            }
        });
        doc.moveDown(1.5);

        // ===== DEPLOYMENT SCHEDULES =====
        doc.fontSize(14).font('Helvetica-Bold').text('7. DEPLOYMENT SCHEDULES');
        doc.fontSize(10).font('Helvetica');
        doc.moveDown(0.5);
        quotations.forEach((quotation, qIdx) => {
            doc.fontSize(9).text(`Vendor ${qIdx + 1}: ${quotation.vendorId?.name || 'Unknown'}`);
            if (quotation.components && quotation.components.length > 0) {
                quotation.components.forEach((comp, cIdx) => {
                    doc.fontSize(8).text(`  • ${comp.name}: ${comp.deliveryTime || 'Not specified'}`);
                });
            } else {
                doc.fontSize(8).text('  No components specified');
            }
            doc.moveDown(0.3);
        });
        doc.moveDown(1);

        // ===== PROCUREMENTS SUMMARY =====
        if (procurements.length > 0) {
            doc.fontSize(14).font('Helvetica-Bold').text('8. PROCUREMENTS SUMMARY');
            doc.fontSize(10).font('Helvetica');
            doc.moveDown(0.5);
            doc.text(`Total Procurements: ${procurements.length}`);
            doc.moveDown(0.5);
            
            procurements.forEach((proc, pIdx) => {
                doc.fontSize(9).text(`Procurement ${pIdx + 1}:`);
                doc.fontSize(8).text(`  Final Cost: $${proc.finalCost || 0}`);
                doc.text(`  Acceptance Type: ${proc.acceptanceType || 'N/A'}`);
                doc.text(`  Approved by Admin: ${proc.approvedByAdmin ? 'Yes' : 'No'}`);
                doc.moveDown(0.3);
            });
        }
        doc.moveDown(1);

        // ===== CONSULTANTS ASSIGNED =====
        if (assignments.length > 0) {
            doc.fontSize(14).font('Helvetica-Bold').text('9. CONSULTANT ASSIGNMENTS');
            doc.fontSize(10).font('Helvetica');
            doc.moveDown(0.5);
            doc.text(`Total Assignments: ${assignments.length}`);
            doc.moveDown(0.5);
            
            assignments.forEach((assign, aIdx) => {
                doc.fontSize(9).text(`Consultant ${aIdx + 1}: ${assign.consultantId?.name || 'Unknown'}`);
                doc.fontSize(8).text(`  Email: ${assign.consultantId?.email || 'N/A'}`);
                doc.text(`  Expertise: ${assign.consultantId?.expertise || 'N/A'}`);
                doc.text(`  Status: ${assign.status || 'N/A'}`);
                doc.text(`  Hours Allocated: ${assign.hoursAllocated || 0}`);
                doc.moveDown(0.3);
            });
        }
        doc.moveDown(2);

        // ===== FOOTER =====
        doc.fontSize(8).font('Helvetica').text('━'.repeat(80));
        doc.fontSize(8).text(`Document generated on ${new Date().toLocaleString()}`, { align: 'center' });
        doc.text(`Lab Project ID: ${labProjectId}`, { align: 'center' });

        // Finalize PDF
        doc.end();

    } catch (error) {
        console.error('[LAB] Error exporting PDF documentation:', error);
        res.status(500).json({ 
            message: 'Error exporting lab project documentation as PDF', 
            error: error.message 
        });
    }
};

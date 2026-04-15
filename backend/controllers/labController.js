const LabProject = require('../models/LabProject');
const LabProjectAssignment = require('../models/LabProjectAssignment');
const pdfParse = require('pdf-parse');
const Groq = require('groq-sdk'); 

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

const Procurement = require("../models/Procurement");

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
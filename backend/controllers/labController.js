const LabProject = require('../models/LabProject');
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

exports.getUserLabProjects = async (req, res) => {
    try {
        const universityId = req.user.id;

        const labProjects = await LabProject.find({ universityId })
            .sort({ createdAt: -1 })
            .exec();

        if (labProjects.length === 0) {
            return res.status(200).json({ message: 'No lab projects found', projects: [] });
        }

        // Get Quotation model to count quotations per project
        const Quotation = require('../models/Quotation');

        // Add quotation count to each project
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

        // Verify ownership
        if (labProject.universityId.toString() !== universityId) {
            return res.status(403).json({ message: 'Access denied. You do not own this project.' });
        }

        // Return project data for prefill (exclude timestamps and consultantId)
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
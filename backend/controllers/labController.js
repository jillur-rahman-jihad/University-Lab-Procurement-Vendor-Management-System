const LabProject = require('../models/LabProject');
const pdfParse = require('pdf-parse');
const { GoogleGenerativeAI } = require('@google/generative-ai');

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
        
        if (!process.env.GEMINI_API_KEY) {
            return res.status(500).json({ message: 'Server configuration error: GEMINI_API_KEY is missing in your .env file or not loaded.' });
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
            const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
            const prompt = `You are an AI assistant that extracts lab project requirements from PDF text. Extract the following details from the document text below and output it strictly in JSON format matching this schema:
{
  "mainRequirement": "Brief description of the main focus of this lab",
  "software": "Comma separated list of required softwares",
  "numberOfSystems": integer (the count of systems/computers/machines required, default to 1 if not mentioned),
  "budgetMin": integer (minimum budget in USD, default to 0 if not explicitly mentioned),
  "budgetMax": integer (maximum budget in USD, default to 0 if not explicitly mentioned),
  "performancePriority": "Low" or "Medium" or "High" (deduce from text),
  "timeline": "YYYY-MM-DD" (deduce an explicit deadline or just give a date 3 months from now)
}

Document Text (truncated):
"""
${text.substring(0, 10000)}
"""`;

            const model = genAI.getGenerativeModel({ model: "gemini-flash-latest" });
            const result = await model.generateContent(prompt);
            const response = await result.response;
            content = response.text();
        } catch (geminiErr) {
            console.error('Gemini API Error:', geminiErr);
            return res.status(500).json({ message: `Gemini API refused or failed to process the request. Details: ${geminiErr.message}` });
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
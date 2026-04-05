const Lab = require('../models/lab');

exports.createLabProject = async (req, res) => {
    try {
        const { name, budget, type, components, performancePriority } = req.body;
        const universityId = req.user.id; // JWT payload contains 'id', not '_id'

        const newLabProject = new Lab({
            labtype: type,
            labname: name,
            components: components,
            numberofSystems: components.length, // Adjust if components represent something else
            budgetrange: budget,
            performancepriority: performancePriority,
            universityid: universityId
        });

        await newLabProject.save();
        res.status(201).json({ message: 'Lab project created successfully', lab: newLabProject });
    } catch (error) {
        res.status(500).json({ message: 'Error creating lab project', error: error.message });
    }
};
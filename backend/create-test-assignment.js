const mongoose = require('mongoose');
const LabProjectAssignment = require('./models/LabProjectAssignment');
const LabProject = require('./models/LabProject');
const User = require('./models/User');

async function createTestAssignments() {
  try {
    await mongoose.connect('mongodb://127.0.0.1:27017/lab-project', {});
    console.log('Connected to MongoDB\n');

    // Consultant ID from create-test-user.js output
    const consultantId = '69d6496475a53a6950490e6a';
    
    // Find or create a university user
    let university = await User.findOne({ role: 'university' });
    if (!university) {
      university = await User.create({
        name: 'MIT Administration',
        email: 'mit@university.edu',
        password: 'password123',
        phone: '1234567890',
        role: 'university',
        vendorInfo: {
          location: {
            type: 'Point',
            coordinates: [0, 0]
          }
        }
      });
      console.log('✅ Created test university user\n');
    }

    // Find or create a lab project
    let labProject = await LabProject.findOne({});
    if (!labProject) {
      labProject = await LabProject.create({
        universityId: university._id,
        labName: 'Advanced Networking Laboratory',
        labType: 'Networking',
        requirements: {
          systems: 5,
          budgetMin: 40000,
          budgetMax: 60000,
          performancePriority: 'High',
          software: ['Linux', 'Cisco IOS']
        },
        status: 'approved'
      });
      console.log('✅ Created test lab project\n');
    }

    // Create a project assignment
    const assignment = await LabProjectAssignment.create({
      projectId: labProject._id,
      universityId: university._id,
      consultantId: consultantId,
      projectName: 'Advanced Networking Laboratory',
      description: 'State-of-the-art networking lab with modern equipment',
      currentConfiguration: {
        hardware: ['Routers', 'Switches', 'Network Analyzers'],
        software: ['Linux', 'Cisco IOS'],
        budget: 50000,
        timeline: '30 days'
      },
      assignmentStatus: 'In Progress',
      configurationSuggestions: [
        {
          title: 'Network Architecture',
          description: 'Recommended topology for the lab',
          category: 'Performance',
          priority: 'High',
          estimatedBudgetImpact: 5000,
          performanceImprovement: '40% faster redundancy',
          createdBy: consultantId
        }
      ],
      documentation: [],
      milestones: [],
      overallProgress: {
        startDate: new Date(),
        expectedCompletionDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
        completionPercentage: 0,
        estimatedDaysRemaining: 30
      }
    });

    console.log('✅ Created project assignment');
    console.log('   Assignment ID:', assignment._id);
    console.log('   Project:', assignment.projectName);
    console.log('\n✅ Test data created successfully!');
    
    process.exit(0);
  } catch (err) {
    console.error('❌ Error:', err.message);
    process.exit(1);
  }
}

createTestAssignments();

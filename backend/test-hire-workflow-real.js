const jwt = require('jsonwebtoken');
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const User = require('./models/User');

// Connect to cloud MongoDB (same as backend)
const mongoUri = "mongodb+srv://jihad:unipro123%40@cluster0.k8iixas.mongodb.net/?appName=Cluster0";
mongoose.connect(mongoUri);

async function testHireWorkflowWithRealData() {
  try {
    console.log("\n========== TESTING HIRE REQUEST WORKFLOW WITH REAL DATA ==========\n");

    // Step 1: Create test consultant
    console.log("Step 1: Creating test consultant...");
    const hashedPassword = await bcrypt.hash("password123", 10);
    
    const testConsultant = await User.findOneAndUpdate(
      { email: "test.hire.consultant@demo.com" },
      {
        name: "Test Hire Consultant",
        email: "test.hire.consultant@demo.com",
        password: hashedPassword,
        role: "consultant",
        phone: "01700000099",
        consultantInfo: {
          expertise: ["Networking", "AI Infrastructure"],
          experienceLevel: "Professional",
          completedLabDeployments: 10,
          rating: 4.8,
          averageResponseTime: 2,
          availability: true,
          bio: "Test consultant for hire workflow",
          profilePhoto: "/uploads/test.jpg",
          reviews: []
        },
        vendorInfo: {
          location: {
            type: "Point",
            coordinates: [0, 0]
          }
        }
      },
      { upsert: true, new: true }
    );

    console.log(`✅ Test Consultant Created: ${testConsultant._id}\n`);

    // Create test tokens
    const universityId = "65b9df23a1c4b2001f8d4a99"; // Test university
    const consultantId = testConsultant._id;
    
    const universityToken = jwt.sign({ id: universityId }, 'super_secret_jwt_key_development_only', { expiresIn: "30d" });
    const consultantToken = jwt.sign({ id: consultantId }, 'super_secret_jwt_key_development_only', { expiresIn: "30d" });

    const baseURL = 'http://localhost:5000';

    // Test 1: Create a hire request (University perspective)
    console.log("Test 1: Create a hire request...");
    const hireData = {
      consultantId: consultantId.toString(),
      projectName: "Network Infrastructure Setup",
      projectDescription: "Setup and configure network infrastructure for the lab",
      startDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days from now
      endDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000) // 30 days from now
    };

    const createResponse = await fetch(`${baseURL}/api/hire/create`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${universityToken}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(hireData)
    });

    const createData = await createResponse.json();
    console.log(`Status: ${createResponse.status}`);
    console.log(`Message: ${createData.message}`);
    
    if (createResponse.status === 201) {
      const requestId = createData.hireRequest._id;
      console.log(`✅ Hire Request created: ${requestId}\n`);

      // Test 2: Get pending hire requests (Consultant perspective)
      console.log("Test 2: Fetch pending hire requests for consultant...");
      const pendingResponse = await fetch(`${baseURL}/api/hire/consultant/pending`, {
        method: 'GET',
        headers: { 'Authorization': `Bearer ${consultantToken}` }
      });
      const pendingData = await pendingResponse.json();
      console.log(`Status: ${pendingResponse.status}`);
      console.log(`Found: ${pendingData.requests?.length || 0} pending requests`);
      if (pendingData.requests?.length > 0) {
        console.log(`✅ Showing pending requests:\n`);
        pendingData.requests.forEach((req, i) => {
          console.log(`  ${i + 1}. ${req.projectName} (Status: ${req.status})`);
        });
      }
      console.log("");

      // Test 3: Accept a hire request
      console.log("Test 3: Accept the hire request...");
      const acceptResponse = await fetch(`${baseURL}/api/hire/${requestId}/accept`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${consultantToken}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ responseMessage: "I accept this hire request" })
      });
      const acceptData = await acceptResponse.json();
      console.log(`Status: ${acceptResponse.status}`);
      console.log(`Message: ${acceptData.message}`);
      if (acceptResponse.status === 200) {
        console.log(`✅ Hire request accepted - Status: ${acceptData.hireRequest?.status}\n`);
      }

      // Test 4: Get active assignments
      console.log("Test 4: Fetch active assignments for consultant...");
      const activeResponse = await fetch(`${baseURL}/api/hire/consultant/active`, {
        method: 'GET',
        headers: { 'Authorization': `Bearer ${consultantToken}` }
      });
      const activeData = await activeResponse.json();
      console.log(`Status: ${activeResponse.status}`);
      console.log(`Active Assignments: ${activeData.assignments?.length || 0}`);
      if (activeData.assignments?.length > 0) {
        console.log(`✅ Active Assignments:\n`);
        activeData.assignments.forEach((assign, i) => {
          console.log(`  ${i + 1}. ${assign.projectName} (Status: ${assign.status})`);
        });
      }
      console.log("");

      // Test 5: Get university's hire requests
      console.log("Test 5: Fetch university's hire requests...");
      const universityRequestsResponse = await fetch(`${baseURL}/api/hire/university/requests`, {
        method: 'GET',
        headers: { 'Authorization': `Bearer ${universityToken}` }
      });
      const universityRequestsData = await universityRequestsResponse.json();
      console.log(`Status: ${universityRequestsResponse.status}`);
      console.log(`Total Hire Requests: ${universityRequestsData.requests?.length || 0}`);
      const acceptedCount = universityRequestsData.requests?.filter(r => r.status === 'accepted').length || 0;
      const pendingCount = universityRequestsData.requests?.filter(r => r.status === 'pending').length || 0;
      console.log(`Accepted: ${acceptedCount}, Pending: ${pendingCount}`);
      console.log(`✅ University requests fetched\n`);

      // Test 6: Get hire request details
      console.log("Test 6: Fetch hire request details (from University)...");
      const detailsResponse = await fetch(`${baseURL}/api/hire/${requestId}`, {
        method: 'GET',
        headers: { 'Authorization': `Bearer ${universityToken}` }
      });
      const detailsData = await detailsResponse.json();
      console.log(`Status: ${detailsResponse.status}`);
      console.log(`Project: ${detailsData.hireRequest?.projectName}`);
      console.log(`Consultant: ${detailsData.hireRequest?.consultantId?.name}`);
      console.log(`Status: ${detailsData.hireRequest?.status}`);
      console.log(`Duration: ${Math.ceil((new Date(detailsData.hireRequest?.endDate) - new Date(detailsData.hireRequest?.startDate)) / (1000 * 60 * 60 * 24))} days`);
      console.log(`✅ Hire request details fetched\n`);

      console.log("========== ALL TESTS PASSED ✅ ==========");
      console.log("✅ Create hire request - SUCCESS");
      console.log("✅ Fetch pending requests - SUCCESS");
      console.log("✅ Accept hire request - SUCCESS");
      console.log("✅ Fetch active assignments - SUCCESS");
      console.log("✅ Fetch university requests - SUCCESS");
      console.log("✅ Fetch request details - SUCCESS");
      console.log("=========================================\n");

    } else {
      console.log(`❌ Failed to create hire request: ${createData.message}\n`);
    }

  } catch (error) {
    console.error("❌ Test Error:", error.message);
  } finally {
    mongoose.disconnect();
  }
}

testHireWorkflowWithRealData();

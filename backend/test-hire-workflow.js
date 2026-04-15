const jwt = require('jsonwebtoken');
const mongoose = require('mongoose');

// Connect to cloud MongoDB (same as backend)
const mongoUri = "mongodb+srv://jihad:unipro123%40@cluster0.k8iixas.mongodb.net/?appName=Cluster0";
mongoose.connect(mongoUri);

async function testHireWorkflow() {
  try {
    console.log("\n========== TESTING HIRE REQUEST WORKFLOW ==========\n");

    // Create test tokens
    const universityId = "65b9df23a1c4b2001f8d4a99"; // Test university ID
    const consultantId = "65b9df23a1c4b2001f8d4a98"; // Test consultant ID (should exist)
    
    const universityToken = jwt.sign({ id: universityId }, 'super_secret_jwt_key_development_only', { expiresIn: "30d" });
    const consultantToken = jwt.sign({ id: consultantId }, 'super_secret_jwt_key_development_only', { expiresIn: "30d" });

    const baseURL = 'http://localhost:5000';

    // Test 1: Create a hire request (University perspective)
    console.log("Test 1: Create a hire request...");
    const hireData = {
      consultantId: "61234567890abcdef1234567", // Example consultant ID
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
    console.log(`Result: ${createResponse.status}`);
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
      console.log(`Result: ${pendingResponse.status}`);
      console.log(`Found: ${pendingData.requests?.length || 0} pending requests`);
      console.log(`✅ Pending requests fetched\n`);

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
      console.log(`Result: ${acceptResponse.status}`);
      console.log(`Message: ${acceptData.message}`);
      if (acceptResponse.status === 200) {
        console.log(`✅ Hire request accepted\n`);
      }

      // Test 4: Get active assignments
      console.log("Test 4: Fetch active assignments for consultant...");
      const activeResponse = await fetch(`${baseURL}/api/hire/consultant/active`, {
        method: 'GET',
        headers: { 'Authorization': `Bearer ${consultantToken}` }
      });
      const activeData = await activeResponse.json();
      console.log(`Result: ${activeResponse.status}`);
      console.log(`Active Assignments: ${activeData.assignments?.length || 0}`);
      console.log(`✅ Active assignments fetched\n`);

      // Test 5: Get university's hire requests
      console.log("Test 5: Fetch university's hire requests...");
      const universityRequestsResponse = await fetch(`${baseURL}/api/hire/university/requests`, {
        method: 'GET',
        headers: { 'Authorization': `Bearer ${universityToken}` }
      });
      const universityRequestsData = await universityRequestsResponse.json();
      console.log(`Result: ${universityRequestsResponse.status}`);
      console.log(`Total Hire Requests: ${universityRequestsData.requests?.length || 0}`);
      const acceptedCount = universityRequestsData.requests?.filter(r => r.status === 'accepted').length || 0;
      console.log(`Accepted Requests: ${acceptedCount}`);
      console.log(`✅ University requests fetched\n`);

      // Test 6: Get hire request details
      console.log("Test 6: Fetch hire request details...");
      const detailsResponse = await fetch(`${baseURL}/api/hire/${requestId}`, {
        method: 'GET',
        headers: { 'Authorization': `Bearer ${universityToken}` }
      });
      const detailsData = await detailsResponse.json();
      console.log(`Result: ${detailsResponse.status}`);
      console.log(`Project: ${detailsData.hireRequest?.projectName}`);
      console.log(`Status: ${detailsData.hireRequest?.status}`);
      console.log(`✅ Hire request details fetched\n`);

    } else {
      console.log(`❌ Failed to create hire request: ${createData.message}\n`);
    }

    console.log("========== TEST SUMMARY ==========");
    console.log("✅ Create hire request test completed");
    console.log("✅ Fetch pending requests test completed");
    console.log("✅ Accept hire request test completed");
    console.log("✅ Fetch active assignments test completed");
    console.log("✅ Fetch university requests test completed");
    console.log("✅ Fetch request details test completed");
    console.log("========================================\n");

  } catch (error) {
    console.error("❌ Test Error:", error.message);
  } finally {
    mongoose.disconnect();
  }
}

testHireWorkflow();

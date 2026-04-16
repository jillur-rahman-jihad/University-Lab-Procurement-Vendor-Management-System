const axios = require("axios");

const API_URL = "http://localhost:5000/api";

async function test() {
  // First register a university to get a valid token
  const universityEmail = `debug-uni-${Date.now()}@test.com`;
  
  try {
    console.log("1. Registering university...");
    const regResponse = await axios.post(`${API_URL}/auth/register`, {
      name: "Debug University",
      email: universityEmail,
      password: "password123",
      role: "university"
    });
    
    const token = regResponse.data.token;
    const universityId = regResponse.data._id;
    console.log("   ✓ Registered, token:", token.substring(0, 20) + "...");
    
    console.log("\n2. Testing existing POST route (request-infrastructure)...");
    const existingResponse = await axios.post(
      `${API_URL}/university/request-infrastructure`,
      { serviceType: "on-site-deployment", budget: 50000, priority: "high", location: "Test", date: "2024-12-31" },
      { headers: { Authorization: `Bearer ${token}` }, validateStatus: () => true }
    );
    console.log("   Status:", existingResponse.status);
    if (existingResponse.status !== 201) console.log("   Data:", existingResponse.data);
    
    console.log("\n3. Testing NEW POST route (assign-consultant)...");
    const newResponse = await axios.post(
      `${API_URL}/university/assign-consultant`,
      { consultantId: universityId, labProjectId: universityId },
      { headers: { Authorization: `Bearer ${token}` }, validateStatus: () => true }
    );
    console.log("   Status:", newResponse.status);
    console.log("   Data:", typeof newResponse.data === 'string' ? newResponse.data.substring(0, 100) : JSON.stringify(newResponse.data).substring(0, 100));
    
    if (newResponse.status === 404) {
      console.log("\n✗ NEW POST route is returning 404 while existing POST route works!");
      console.log("   This suggests the new routes are not being registered properly.");
    }
    
  } catch (error) {
    console.error("Error:", error.message);
  }
}

test();

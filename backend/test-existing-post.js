const axios = require("axios");

const API_URL = "http://localhost:5000/api";

async function test() {
  try {
    // Test an existing POST route that should work
    const response = await axios.post(
      `${API_URL}/university/request-infrastructure`,
      {
        serviceType: "on-site-deployment",
        budget: 50000,
        priority: "high",
        location: "Tech City",
        date: "2024-12-31",
        notes: "test"
      },
      {
        headers: { Authorization: "Bearer test" },
        validateStatus: () => true // Don't throw onany status
      }
    );
    
    console.log("request-infrastructure response:");
    console.log("  Status:", response.status);
    console.log("  Data:", JSON.stringify(response.data).substring(0, 100));
  } catch (error) {
    console.error("Error:", error.message);
  }
}

test();

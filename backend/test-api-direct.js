const jwt = require('jsonwebtoken');

async function testAPI() {
  try {
    console.log("\n========== TESTING API ENDPOINTS DIRECTLY ==========\n");

    // Create a test token
    const testToken = jwt.sign({ id: "65b9df23a1c4b2001f8d4a99" }, 'super_secret_jwt_key_development_only', { expiresIn: "30d" });
    const baseUrl = 'http://localhost:5000';

    // Test 1: Get all available consultants
    console.log("Test 1: GET /api/university/search-consultants (all available)");
    const allRes = await fetch(`${baseUrl}/api/university/search-consultants`, {
      method: 'GET',
      headers: { 'Authorization': `Bearer ${testToken}` }
    });
    const allData = await allRes.json();
    console.log(`Status: ${allRes.status}`);
    console.log(`Count: ${allData.consultants?.length || 0}`);
    console.log(`Message: ${allData.message}`);
    if (allData.consultants?.length > 0) {
      console.log("Consultants found:");
      allData.consultants.forEach(c => {
        console.log(`  - ${c.name} (${c.consultantInfo?.expertise?.join(", ")})`);
      });
    }
    console.log("");

    // Test 2: Search by Networking
    console.log("Test 2: GET /api/university/search-consultants?expertise=Networking");
    const netRes = await fetch(`${baseUrl}/api/university/search-consultants?expertise=Networking`, {
      method: 'GET',
      headers: { 'Authorization': `Bearer ${testToken}` }
    });
    const netData = await netRes.json();
    console.log(`Status: ${netRes.status}`);
    console.log(`Count: ${netData.consultants?.length || 0}`);
    console.log(`Message: ${netData.message}`);
    if (netData.consultants?.length > 0) {
      console.log("Consultants found:");
      netData.consultants.forEach(c => {
        console.log(`  - ${c.name} (${c.consultantInfo?.expertise?.join(", ")})`);
      });
    }
    console.log("");

    // Test 3: Search by AI Infrastructure
    console.log("Test 3: GET /api/university/search-consultants?expertise=AI Infrastructure");
    const aiRes = await fetch(`${baseUrl}/api/university/search-consultants?expertise=AI Infrastructure`, {
      method: 'GET',
      headers: { 'Authorization': `Bearer ${testToken}` }
    });
    const aiData = await aiRes.json();
    console.log(`Status: ${aiRes.status}`);
    console.log(`Count: ${aiData.consultants?.length || 0}`);
    console.log(`Message: ${aiData.message}`);
    if (aiData.consultants?.length > 0) {
      console.log("Consultants found:");
      aiData.consultants.forEach(c => {
        console.log(`  - ${c.name} (${c.consultantInfo?.expertise?.join(", ")})`);
      });
    }
    console.log("");

    // Test 4: Verify availability filter (should NOT include Carol)
    console.log("Test 4: Verify availability filter (Carol is NOT available)");
    console.log("All available consultants from Test 1:");
    if (allData.consultants?.length > 0) {
      const availableConsultantEmails = allData.consultants.map(c => c.email);
      const carolIncluded = availableConsultantEmails.includes("carol.research@demo.com");
      console.log(`Carol (carol.research@demo.com) included: ${carolIncluded ? "❌ FAIL" : "✅ PASS"}`);
    }

  } catch (error) {
    console.error("❌ Error:", error.message);
  }
}

testAPI();

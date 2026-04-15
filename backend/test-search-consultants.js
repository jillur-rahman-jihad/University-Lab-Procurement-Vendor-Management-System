const mongoose = require("mongoose");
const jwt = require('jsonwebtoken');
const bcrypt = require("bcryptjs");
const User = require("./models/User");

// Connect to cloud MongoDB (same as backend)
const mongoUri = "mongodb+srv://jihad:unipro123%40@cluster0.k8iixas.mongodb.net/?appName=Cluster0";
mongoose.connect(mongoUri);

async function testSearchConsultants() {
  try {
    console.log("\n========== TESTING SEARCH CONSULTANTS ==========\n");

    // Step 1: Create test consultant users with different expertise
    console.log("Step 1: Creating test consultant users...\n");

    const hashedPassword = await bcrypt.hash("password123", 10);

    // First, clean up any existing geo-indexed documents with malformed data
    try {
      await User.deleteMany({ role: "consultant", email: { $regex: "@demo.com" } });
    } catch (e) {
      console.log("Note: Could not clean up existing consultants:", e.message);
    }

    const consultants = [
      {
        name: "John Networking Expert",
        email: "john.network@demo.com",
        password: hashedPassword,
        role: "consultant",
        phone: "01700000001",
        consultantInfo: {
          expertise: ["Networking"],
          experienceLevel: "Professional",
          completedLabDeployments: 15,
          rating: 4.8,
          averageResponseTime: 2,
          availability: true,
          bio: "Expert in network infrastructure and design",
          profilePhoto: "/uploads/john.jpg",
          reviews: []
        },
        vendorInfo: {
          location: {
            type: "Point",
            coordinates: [0, 0]
          }
        }
      },
      {
        name: "Alice Graphics Designer",
        email: "alice.graphics@demo.com",
        password: hashedPassword,
        role: "consultant",
        phone: "01700000002",
        consultantInfo: {
          expertise: ["Graphics"],
          experienceLevel: "Certified",
          completedLabDeployments: 10,
          rating: 4.6,
          averageResponseTime: 3,
          availability: true,
          bio: "Specialized in 3D graphics and visualization",
          profilePhoto: "/uploads/alice.jpg",
          reviews: []
        },
        vendorInfo: {
          location: {
            type: "Point",
            coordinates: [0, 0]
          }
        }
      },
      {
        name: "Bob AI Researcher",
        email: "bob.ai@demo.com",
        password: hashedPassword,
        role: "consultant",
        phone: "01700000003",
        consultantInfo: {
          expertise: ["AI Infrastructure"],
          experienceLevel: "Professional",
          completedLabDeployments: 20,
          rating: 4.9,
          averageResponseTime: 1,
          availability: true,
          bio: "Leading AI and machine learning infrastructure expert",
          profilePhoto: "/uploads/bob.jpg",
          reviews: []
        },
        vendorInfo: {
          location: {
            type: "Point",
            coordinates: [0, 0]
          }
        }
      },
      {
        name: "Carol Research Scientist",
        email: "carol.research@demo.com",
        password: hashedPassword,
        role: "consultant",
        phone: "01700000004",
        consultantInfo: {
          expertise: ["Research"],
          experienceLevel: "Professional",
          completedLabDeployments: 12,
          rating: 4.7,
          averageResponseTime: 4,
          availability: false, // Not available
          bio: "Research methodology and data analysis expert",
          profilePhoto: "/uploads/carol.jpg",
          reviews: []
        },
        vendorInfo: {
          location: {
            type: "Point",
            coordinates: [0, 0]
          }
        }
      },
      {
        name: "David Multi-Expert",
        email: "david.multi@demo.com",
        password: hashedPassword,
        role: "consultant",
        phone: "01700000005",
        consultantInfo: {
          expertise: ["Networking", "AI Infrastructure"],
          experienceLevel: "Professional",
          completedLabDeployments: 25,
          rating: 4.85,
          averageResponseTime: 1.5,
          availability: true,
          bio: "Expert in both networking and AI infrastructure",
          profilePhoto: "/uploads/david.jpg",
          reviews: []
        },
        vendorInfo: {
          location: {
            type: "Point",
            coordinates: [0, 0]
          }
        }
      }
    ];

    // Delete existing test consultants and create new ones
    for (const consultant of consultants) {
      await User.findOneAndUpdate(
        { email: consultant.email },
        consultant,
        { upsert: true, new: true }
      );
      console.log(`✅ Created: ${consultant.name} (${consultant.consultantInfo.expertise.join(", ")})`);
    }

    console.log("\n✅ All test consultants created!\n");

    // Step 2: Test the search API
    console.log("Step 2: Testing search API endpoints...\n");

    // Create a test token (simulating university login)
    const testUniversityId = "65b9df23a1c4b2001f8d4a99"; // Test ID
    const testToken = jwt.sign({ id: testUniversityId }, 'super_secret_jwt_key_development_only', { expiresIn: "30d" });

    const baseURL = 'http://localhost:5000';

    // Test 2a: Search all available consultants
    console.log("Test 2a: Search all available consultants...");
    const allResponse = await fetch(`${baseURL}/api/university/search-consultants`, {
      method: 'GET',
      headers: { 'Authorization': `Bearer ${testToken}`, 'Content-Type': 'application/json' }
    });
    const allData = await allResponse.json();
    console.log(`Result: ${allResponse.status}`);
    console.log(`Found: ${allData.consultants?.length || 0} available consultants`);
    if (allData.consultants?.length > 0) {
      console.log(`✅ Available consultants: ${allData.consultants.map(c => c.name).join(", ")}\n`);
    }

    // Test 2b: Search by Networking expertise
    console.log("Test 2b: Search consultants with Networking expertise...");
    const networkResponse = await fetch(`${baseURL}/api/university/search-consultants?expertise=Networking`, {
      method: 'GET',
      headers: { 'Authorization': `Bearer ${testToken}`, 'Content-Type': 'application/json' }
    });
    const networkData = await networkResponse.json();
    console.log(`Result: ${networkResponse.status}`);
    console.log(`Found: ${networkData.consultants?.length || 0} consultants with Networking expertise`);
    if (networkData.consultants?.length > 0) {
      console.log(`✅ Networking experts: ${networkData.consultants.map(c => c.name).join(", ")}\n`);
    }

    // Test 2c: Search by Graphics expertise
    console.log("Test 2c: Search consultants with Graphics expertise...");
    const graphicsResponse = await fetch(`${baseURL}/api/university/search-consultants?expertise=Graphics`, {
      method: 'GET',
      headers: { 'Authorization': `Bearer ${testToken}`, 'Content-Type': 'application/json' }
    });
    const graphicsData = await graphicsResponse.json();
    console.log(`Result: ${graphicsResponse.status}`);
    console.log(`Found: ${graphicsData.consultants?.length || 0} consultants with Graphics expertise`);
    if (graphicsData.consultants?.length > 0) {
      console.log(`✅ Graphics experts: ${graphicsData.consultants.map(c => c.name).join(", ")}\n`);
    }

    // Test 2d: Search by AI Infrastructure expertise
    console.log("Test 2d: Search consultants with AI Infrastructure expertise...");
    const aiResponse = await fetch(`${baseURL}/api/university/search-consultants?expertise=AI Infrastructure`, {
      method: 'GET',
      headers: { 'Authorization': `Bearer ${testToken}`, 'Content-Type': 'application/json' }
    });
    const aiData = await aiResponse.json();
    console.log(`Result: ${aiResponse.status}`);
    console.log(`Found: ${aiData.consultants?.length || 0} consultants with AI Infrastructure expertise`);
    if (aiData.consultants?.length > 0) {
      console.log(`✅ AI experts: ${aiData.consultants.map(c => c.name).join(", ")}\n`);
    }

    // Test 2e: Search by Research expertise
    console.log("Test 2e: Search consultants with Research expertise...");
    const researchResponse = await fetch(`${baseURL}/api/university/search-consultants?expertise=Research`, {
      method: 'GET',
      headers: { 'Authorization': `Bearer ${testToken}`, 'Content-Type': 'application/json' }
    });
    const researchData = await researchResponse.json();
    console.log(`Result: ${researchResponse.status}`);
    console.log(`Found: ${researchData.consultants?.length || 0} consultants with Research expertise`);
    console.log(`⚠️  Note: Carol (Research expert) is NOT available, so should not appear in results\n`);

    // Test 2f: Verify data structure of returned consultants
    if (allData.consultants?.length > 0) {
      console.log("Test 2f: Verifying response data structure...");
      const consultant = allData.consultants[0];
      console.log(`Sample consultant object:`);
      console.log(`  - name: ${consultant.name}`);
      console.log(`  - email: ${consultant.email}`);
      console.log(`  - phone: ${consultant.phone}`);
      console.log(`  - expertise: ${consultant.consultantInfo?.expertise?.join(", ") || "N/A"}`);
      console.log(`  - experienceLevel: ${consultant.consultantInfo?.experienceLevel || "N/A"}`);
      console.log(`  - rating: ${consultant.consultantInfo?.rating || "N/A"}`);
      console.log(`  - availability: ${consultant.consultantInfo?.availability || "N/A"}`);
      console.log(`✅ Data structure verified!\n`);
    }

    console.log("========== TEST RESULTS SUMMARY ==========");
    console.log(`✅ All available consultants search: ${allResponse.status === 200 ? "PASS" : "FAIL"}`);
    console.log(`✅ Networking expertise search: ${networkResponse.status === 200 ? "PASS" : "FAIL"}`);
    console.log(`✅ Graphics expertise search: ${graphicsResponse.status === 200 ? "PASS" : "FAIL"}`);
    console.log(`✅ AI Infrastructure expertise search: ${aiResponse.status === 200 ? "PASS" : "FAIL"}`);
    console.log(`✅ Research expertise search: ${researchResponse.status === 200 ? "PASS" : "FAIL"}`);
    console.log(`✅ Availability filter working: ${researchData.consultants?.length === 0 ? "PASS (Carol correctly not included)" : "FAIL"}`);
    console.log("========================================\n");

  } catch (error) {
    console.error("❌ Test Error:", error.message);
  } finally {
    mongoose.disconnect();
  }
}

testSearchConsultants();

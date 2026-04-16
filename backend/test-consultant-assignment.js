const axios = require("axios");

const API_URL = "http://localhost:5000/api";
const universityEmail = `test-university-${Date.now()}@test.com`;
const consultantEmail = `test-consultant-${Date.now()}@test.com`;
let universityToken = "";
let consultantToken = "";
let universityId = "";
let consultantId = "";
let labProjectId = "";
let assignmentId = "";
let suggestionId = "";

async function registerUniversity() {
  console.log("\n--- Registering University ---");
  try {
    const response = await axios.post(`${API_URL}/auth/register`, {
      name: "Test University",
      email: universityEmail,
      password: "password123",
      role: "university",
    });
    universityToken = response.data.token;
    universityId = response.data._id;
    console.log("✓ University registered:", universityEmail);
    console.log("  University ID:", universityId);
  } catch (error) {
    console.error("✗ University registration failed:", error.response?.data || error.message);
    process.exit(1);
  }
}

async function registerConsultant() {
  console.log("\n--- Registering Consultant ---");
  try {
    const response = await axios.post(`${API_URL}/auth/register`, {
      name: "Test Consultant",
      email: consultantEmail,
      password: "password123",
      role: "consultant",
      professionalCredentials: "BS in Computer Science",
      relevantExperience: "10 years in network engineering",
      certificationInformation: "CCNP, CISSP",
    });
    consultantToken = response.data.token;
    consultantId = response.data._id;
    console.log("✓ Consultant registered:", consultantEmail);
    console.log("  Consultant ID:", consultantId);
  } catch (error) {
    console.error("✗ Consultant registration failed:", error.response?.data || error.message);
    process.exit(1);
  }
}

async function createLabProject() {
  console.log("\n--- Creating Lab Project ---");
  try {
    const response = await axios.post(
      `${API_URL}/labs/create`,
      {
        labName: "Computer Network Lab",
        labType: "Networking",
        requirements: {
          mainRequirement: "Build a production-grade network infrastructure",
          systems: 5,
          budgetMin: 80000,
          budgetMax: 120000,
          performancePriority: "high",
          software: ["Cisco IOS", "Linux"],
          timeline: "2024-12-31"
        }
      },
      {
        headers: { Authorization: `Bearer ${universityToken}` },
      }
    );
    labProjectId = response.data.labProject._id;
    console.log("✓ Lab project created");
    console.log("  Lab ID:", labProjectId);
    console.log("  Lab Name:", response.data.labProject.labName);
  } catch (error) {
    console.error("✗ Lab project creation failed:", error.response?.data || error.message);
    process.exit(1);
  }
}

async function assignConsultantToProject() {
  console.log("\n--- Assigning Consultant to Project ---");
  try {
    const response = await axios.post(
      `${API_URL}/university/assign-consultant`,
      {
        consultantId,
        labProjectId,
        budgetPriority: "performance-focused",
        notes: "Focus on network optimization and security",
      },
      {
        headers: { Authorization: `Bearer ${universityToken}` },
      }
    );
    assignmentId = response.data.assignment._id;
    console.log("✓ Consultant assigned to project");
    console.log("  Assignment ID:", assignmentId);
    console.log("  Status:", response.data.assignment.status);
    console.log("  Budget Priority:", response.data.assignment.budgetPriority);
  } catch (error) {
    console.error("✗ Assignment failed");
    console.error("  Status:", error.response?.status);
    console.error("  Data:", error.response?.data);
    console.error("  Full response:", error.response?.data || error.message);
    process.exit(1);
  }
}

async function getProjectAssignments() {
  console.log("\n--- Getting Project Assignments (University) ---");
  try {
    const response = await axios.get(
      `${API_URL}/university/project-assignments?labProjectId=${labProjectId}`,
      {
        headers: { Authorization: `Bearer ${universityToken}` },
      }
    );
    console.log("✓ Retrieved assignments");
    console.log("  Total assignments:", response.data.total);
    console.log("  Consultant assigned:", response.data.assignments[0]?.consultantId?.name);
  } catch (error) {
    console.error("✗ Failed to get assignments:", error.response?.data || error.message);
    process.exit(1);
  }
}

async function getConsultantAssignedProjects() {
  console.log("\n--- Getting Assigned Projects (Consultant) ---");
  try {
    const response = await axios.get(
      `${API_URL}/consultant/assigned-projects`,
      {
        headers: { Authorization: `Bearer ${consultantToken}` },
      }
    );
    console.log("✓ Retrieved consultant's assigned projects");
    console.log("  Total projects:", response.data.total);
    console.log("  First project:", response.data.projects[0]?.labProjectId?.labName);
  } catch (error) {
    console.error("✗ Failed to get consultant projects:", error.response?.data || error.message);
    process.exit(1);
  }
}

async function submitComponentSuggestion() {
  console.log("\n--- Submitting Component Suggestion ---");
  try {
    const response = await axios.post(
      `${API_URL}/consultant/suggest-component`,
      {
        assignmentId,
        labProjectId,
        suggestionType: "architecture-redesign",
        title: "Implement Software-Defined Networking (SDN)",
        description: "Replace traditional network architecture with SDN for better flexibility and cost management",
        originalComponent: "Cisco Switch + Router + Firewall Setup",
        suggestedAlternative: "Open-source SDN controller with VXLAN",
        costImpact: -20000,
        performanceImpactDescription: "Improved latency (5ms → 2ms), better throughput management",
        priority: "high",
      },
      {
        headers: { Authorization: `Bearer ${consultantToken}` },
      }
    );
    suggestionId = response.data.suggestion._id;
    console.log("✓ Component suggestion submitted");
    console.log("  Suggestion ID:", suggestionId);
    console.log("  Type:", response.data.suggestion.suggestionType);
    console.log("  Cost Impact: -$" + Math.abs(response.data.suggestion.costImpact));
    console.log("  Status:", response.data.suggestion.status);
  } catch (error) {
    console.error("✗ Failed to submit suggestion:", error.response?.data || error.message);
    process.exit(1);
  }
}

async function getConsultantSuggestions() {
  console.log("\n--- Getting Consultant's Suggestions ---");
  try {
    const response = await axios.get(
      `${API_URL}/consultant/suggestions?status=pending`,
      {
        headers: { Authorization: `Bearer ${consultantToken}` },
      }
    );
    console.log("✓ Retrieved consultant suggestions");
    console.log("  Total suggestions:", response.data.total);
    console.log("  First suggestion title:", response.data.suggestions[0]?.title);
  } catch (error) {
    console.error("✗ Failed to get suggestions:", error.response?.data || error.message);
    process.exit(1);
  }
}

async function getProjectSuggestions() {
  console.log("\n--- Getting Project Suggestions (University) ---");
  try {
    const response = await axios.get(
      `${API_URL}/university/project-suggestions?labProjectId=${labProjectId}`,
      {
        headers: { Authorization: `Bearer ${universityToken}` },
      }
    );
    console.log("✓ Retrieved project suggestions");
    console.log("  Total suggestions:", response.data.total);
    console.log("  Consultant:", response.data.suggestions[0]?.consultantId?.name);
    console.log("  Suggestion title:", response.data.suggestions[0]?.title);
  } catch (error) {
    console.error("✗ Failed to get project suggestions:", error.response?.data || error.message);
    process.exit(1);
  }
}

async function respondToSuggestion() {
  console.log("\n--- University Responding to Suggestion ---");
  try {
    const response = await axios.post(
      `${API_URL}/university/suggest/${suggestionId}/respond`,
      {
        responseStatus: "accepted",
        responseNotes: "Great suggestion! Let's proceed with SDN implementation. Please prepare a detailed implementation plan.",
      },
      {
        headers: { Authorization: `Bearer ${universityToken}` },
      }
    );
    console.log("✓ Response recorded successfully");
    console.log("  Suggestion status:", response.data.suggestion.status);
    console.log("  University response:", response.data.suggestion.universityResponse?.status);
  } catch (error) {
    console.error("✗ Failed to respond to suggestion:", error.response?.data || error.message);
    process.exit(1);
  }
}

async function submitAnotherSuggestion() {
  console.log("\n--- Submitting Second Suggestion (Cost Reduction) ---");
  try {
    const response = await axios.post(
      `${API_URL}/consultant/suggest-component`,
      {
        assignmentId,
        labProjectId,
        suggestionType: "cost-reduction",
        title: "Use Open Source Alternatives for Monitoring",
        description: "Replace expensive commercial monitoring tools with Prometheus + Grafana stack",
        originalComponent: "Enterprise Monitoring Tool License ($15,000/year)",
        suggestedAlternative: "Prometheus + Grafana + AlertManager (Open Source)",
        costImpact: -15000,
        performanceImpactDescription: "Improved monitoring capabilities with real-time dashboards",
        priority: "medium",
      },
      {
        headers: { Authorization: `Bearer ${consultantToken}` },
      }
    );
    console.log("✓ Second suggestion submitted");
    console.log("  Type:", response.data.suggestion.suggestionType);
    console.log("  Cost Savings: -$" + Math.abs(response.data.suggestion.costImpact));
  } catch (error) {
    console.error("✗ Failed to submit second suggestion:", error.response?.data || error.message);
    process.exit(1);
  }
}

async function rejectSecondSuggestion() {
  console.log("\n--- University Rejecting Second Suggestion ---");
  try {
    // Get the second suggestion first
    const suggestionsResponse = await axios.get(
      `${API_URL}/university/project-suggestions?labProjectId=${labProjectId}`,
      {
        headers: { Authorization: `Bearer ${universityToken}` },
      }
    );

    const secondSuggestion = suggestionsResponse.data.suggestions[1];
    if (!secondSuggestion) {
      throw new Error("Second suggestion not found");
    }

    const response = await axios.post(
      `${API_URL}/university/suggest/${secondSuggestion._id}/respond`,
      {
        responseStatus: "rejected",
        responseNotes: "We have an existing monitoring solution. Let's focus on the SDN implementation.",
      },
      {
        headers: { Authorization: `Bearer ${universityToken}` },
      }
    );
    console.log("✓ Suggestion rejected successfully");
    console.log("  Status:", response.data.suggestion.status);
  } catch (error) {
    console.error("✗ Failed to reject suggestion:", error.response?.data || error.message);
    process.exit(1);
  }
}

async function getUpdatedProjectSuggestions() {
  console.log("\n--- Getting Updated Project Suggestions ---");
  try {
    const response = await axios.get(
      `${API_URL}/university/project-suggestions?labProjectId=${labProjectId}`,
      {
        headers: { Authorization: `Bearer ${universityToken}` },
      }
    );
    console.log("✓ Updated suggestions retrieved");
    console.log("  Total suggestions:", response.data.total);
    console.log("\n  Suggestions Summary:");
    response.data.suggestions.forEach((sug, index) => {
      console.log(`    ${index + 1}. ${sug.title}`);
      console.log(`       Status: ${sug.status} | Type: ${sug.suggestionType}`);
      if (sug.universityResponse) {
        console.log(`       University Response: ${sug.universityResponse.status}`);
      }
    });
  } catch (error) {
    console.error("✗ Failed to get updated suggestions:", error.response?.data || error.message);
    process.exit(1);
  }
}

async function runTests() {
  console.log("=====================================");
  console.log("CONSULTANT PROJECT ASSIGNMENT TESTS");
  console.log("=====================================");

  await registerUniversity();
  await registerConsultant();
  await createLabProject();
  await assignConsultantToProject();
  await getProjectAssignments();
  await getConsultantAssignedProjects();
  await submitComponentSuggestion();
  await getConsultantSuggestions();
  await getProjectSuggestions();
  await respondToSuggestion();
  await submitAnotherSuggestion();
  await rejectSecondSuggestion();
  await getUpdatedProjectSuggestions();

  console.log("\n=====================================");
  console.log("✓ All consultant assignment tests passed!");
  console.log("=====================================\n");
  process.exit(0);
}

runTests().catch((error) => {
  console.error("Test failed:", error.message);
  process.exit(1);
});

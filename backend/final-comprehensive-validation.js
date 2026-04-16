const axios = require('axios');
const jwt = require('jsonwebtoken');

const BASE_URL = 'http://localhost:5000/api';

let universityToken = null;
let consultantToken = null;
let universityId = null;
let consultantId = null;

function getUserIdFromToken(token) {
  if (!token) return null;
  try {
    const decoded = jwt.decode(token);
    return decoded?.id || null;
  } catch {
    return null;
  }
}

async function createUser(email, name, role) {
  try {
    const response = await axios.post(`${BASE_URL}/auth/register`, {
      name,
      email,
      password: 'password123',
      role,
      phone: '01700000000',
      address: '123 Test Street'
    });
    return response.data.token;
  } catch (error) {
    return await login(email);
  }
}

async function login(email) {
  try {
    const response = await axios.post(`${BASE_URL}/auth/login`, {
      email,
      password: 'password123'
    });
    return response.data.token;
  } catch (error) {
    console.error(`Login failed: ${error.message}`);
    return null;
  }
}

async function testEndpoint(name, method, endpoint, data = null, token = null, expectSuccess = true) {
  try {
    const config = { 
      method, 
      url: `${BASE_URL}${endpoint}`,
      ...(token && { headers: { Authorization: `Bearer ${token}` } })
    };
    
    if (data) config.data = data;

    const response = await axios(config);
    const passed = expectSuccess && response.status >= 200 && response.status < 300;
    if (passed) {
      console.log(`  ✓ ${name}`);
    } else {
      console.log(`  ✗ ${name} (Unexpected status: ${response.status})`);
    }
    return response;
  } catch (error) {
    const status = error.response?.status || 'ERR';
    const message = error.response?.data?.message || error.message;
    console.log(`  ✗ ${name} [${status}] ${message}`);
    return null;
  }
}

async function main() {
  console.log('\n╔═══════════════════════════════════════════════════════════════════╗');
  console.log('║     COMPREHENSIVE VALIDATION: Tasks 2A, 2B, 2C                    ║');
  console.log('╚═══════════════════════════════════════════════════════════════════╝\n');

  // Setup
  console.log('[ SETUP ]\n');
  universityToken = await createUser('university@demo.com', 'Demo University', 'university');
  consultantToken = await createUser('consultant@demo.com', 'Demo Consultant', 'consultant');
  
  if (!universityToken || !consultantToken) {
    console.log('✗ Failed to authenticate users');
    return;
  }

  universityId = getUserIdFromToken(universityToken);
  consultantId = getUserIdFromToken(consultantToken);
  
  console.log(`✓ University ID: ${universityId}`);
  console.log(`✓ Consultant ID: ${consultantId}\n`);

  // ==================== TASK 2A ====================
  console.log('[ TASK 2A: CONSULTANT HIRE REQUESTS ]\n');
  
  const startDate = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
  const endDate = new Date(Date.now() + 14 * 24 * 60 * 60 * 1000);

  // Create hire request
  const hireRes = await testEndpoint(
    'POST /hire/create',
    'POST',
    '/hire/create',
    {
      consultantId,
      projectName: 'Lab Equipment Setup',
      projectDescription: 'Need assistance with equipment setup',
      startDate: startDate.toISOString(),
      endDate: endDate.toISOString()
    },
    universityToken
  );

  // Read operations
  await testEndpoint(
    'GET /hire/university/requests',
    'GET',
    '/hire/university/requests',
    null,
    universityToken
  );

  await testEndpoint(
    'GET /hire/consultant/pending',
    'GET',
    '/hire/consultant/pending',
    null,
    consultantToken
  );

  await testEndpoint(
    'GET /hire/consultant/active',
    'GET',
    '/hire/consultant/active',
    null,
    consultantToken
  );

  // ==================== TASK 2B ====================
  console.log('\n[ TASK 2B: LAB PLANNING & PROCUREMENT ]\n');
  
  // Read operations
  await testEndpoint(
    'GET /labs/equipment-catalog',
    'GET',
    '/labs/equipment-catalog',
    null,
    universityToken
  );

  // Create lab project
  const labRes = await testEndpoint(
    'POST /labs/create',
    'POST',
    '/labs/create',
    {
      labName: 'Microcontroller Lab',
      labType: 'Normal',  // Valid enum: "Normal", "Graphics", "Networking", "Thesis", "AI"
      requirements: {
        hardware: ['Arduino', 'Sensors', 'Breadboards'],
        software: ['Arduino IDE', 'Python'],
        capacity: 30
      }
    },
    universityToken
  );

  await testEndpoint(
    'GET /labs/my-lab-projects',
    'GET',
    '/labs/my-lab-projects',
    null,
    universityToken
  );

  await testEndpoint(
    'GET /labs/available-lab-projects',
    'GET',
    '/labs/available-lab-projects',
    null,
    universityToken
  );

  await testEndpoint(
    'GET /labs/my-equipment-requests',
    'GET',
    '/labs/my-equipment-requests',
    null,
    universityToken
  );

  // ==================== TASK 2C ====================
  console.log('\n[ TASK 2C: INFRASTRUCTURE SERVICES ]\n');
  
  const futureDate = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);

  // Create infrastructure request with valid enum value
  const infraRes = await testEndpoint(
    'POST /infrastructure-services/create',
    'POST',
    '/infrastructure-services/create',
    {
      serviceDescription: 'Install new water line for Lab 5',
      location: {
        buildingName: 'Lab Building',
        floor: '2',
        room: 'Lab 5'
      },
      requestedDate: futureDate.toISOString(),
      estimatedDuration: '2 weeks',
      budget: 15000,
      serviceType: 'infrastructure-setup'  // Use valid enum value
    },
    universityToken
  );

  await testEndpoint(
    'GET /infrastructure-services/university-requests',
    'GET',
    '/infrastructure-services/university-requests',
    null,
    universityToken
  );

  await testEndpoint(
    'GET /infrastructure-services/pending-requests',
    'GET',
    '/infrastructure-services/pending-requests',
    null,
    universityToken
  );

  console.log('\n╔═══════════════════════════════════════════════════════════════════╗');
  console.log('║                      VALIDATION COMPLETE                           ║');
  console.log('╚═══════════════════════════════════════════════════════════════════╝\n');
}

main().catch(err => {
  console.error('Error:', err.message);
  process.exit(1);
});

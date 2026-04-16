const axios = require('axios');
const jwt = require('jsonwebtoken');

const BASE_URL = 'http://localhost:5000/api';

function getUserIdFromToken(token) {
  if (!token) return null;
  try {
    const decoded = jwt.decode(token);
    return decoded?.id || null;
  } catch {
    return null;
  }
}

function generateEmail(prefix) {
  return `${prefix}-${Date.now()}@demo.com`;
}

async function createUser(name, role) {
  const email = generateEmail(role);
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
    console.log(`Failed to create user: ${error.message}`);
    return null;
  }
}

async function testEndpoint(name, method, endpoint, data = null, token = null) {
  try {
    const config = { 
      method, 
      url: `${BASE_URL}${endpoint}`,
      ...(token && { headers: { Authorization: `Bearer ${token}` } })
    };
    
    if (data) config.data = data;

    const response = await axios(config);
    console.log(`  ✓ ${name}`);
    return { success: true, response, status: response.status };
  } catch (error) {
    const status = error.response?.status || 'ERR';
    const message = error.response?.data?.message || error.message;
    console.log(`  ✗ ${name} [${status}] ${message}`);
    return { success: false, status, message };
  }
}

async function main() {
  console.log('\n╔═══════════════════════════════════════════════════════════════════╗');
  console.log('║     FINAL VALIDATION: Tasks 2A, 2B, 2C                            ║');
  console.log('╚═══════════════════════════════════════════════════════════════════╝\n');

  // Create fresh test users
  console.log('[ SETUP ]\n');
  console.log('Creating test users...');
  
  const universityToken = await createUser('Test University', 'university');
  const consultantToken = await createUser('Test Consultant', 'consultant');
  
  if (!universityToken || !consultantToken) {
    console.log('✗ Failed to create users');
    return;
  }

  const universityId = getUserIdFromToken(universityToken);
  const consultantId = getUserIdFromToken(consultantToken);
  
  console.log(`✓ University created: ${universityId}`);
  console.log(`✓ Consultant created: ${consultantId}\n`);

  let passedTests = 0;
  let totalTests = 0;

  // ==================== TASK 2A ====================
  console.log('[ TASK 2A: CONSULTANT HIRE REQUESTS ]\n');
  
  const startDate = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
  const endDate = new Date(Date.now() + 14 * 24 * 60 * 60 * 1000);

  // Test 1: Create hire request
  totalTests++;
  let r = await testEndpoint(
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
  if (r.success) passedTests++;

  // Test 2: Get university requests
  totalTests++;
  r = await testEndpoint(
    'GET /hire/university/requests',
    'GET',
    '/hire/university/requests',
    null,
    universityToken
  );
  if (r.success) passedTests++;

  // Test 3: Get pending requests
  totalTests++;
  r = await testEndpoint(
    'GET /hire/consultant/pending',
    'GET',
    '/hire/consultant/pending',
    null,
    consultantToken
  );
  if (r.success) passedTests++;

  // Test 4: Get active assignments
  totalTests++;
  r = await testEndpoint(
    'GET /hire/consultant/active',
    'GET',
    '/hire/consultant/active',
    null,
    consultantToken
  );
  if (r.success) passedTests++;

  // ==================== TASK 2B ====================
  console.log('\n[ TASK 2B: LAB PLANNING & PROCUREMENT ]\n');
  
  // Test 1: Get equipment catalog
  totalTests++;
  r = await testEndpoint(
    'GET /labs/equipment-catalog',
    'GET',
    '/labs/equipment-catalog',
    null,
    universityToken
  );
  if (r.success) passedTests++;

  // Test 2: Create lab project
  totalTests++;
  r = await testEndpoint(
    'POST /labs/create',
    'POST',
    '/labs/create',
    {
      labName: 'Microcontroller Lab',
      labType: 'Normal',
      requirements: {
        hardware: ['Arduino', 'Sensors'],
        software: ['Arduino IDE', 'Python']
      }
    },
    universityToken
  );
  if (r.success) passedTests++;

  // Test 3: Get my lab projects
  totalTests++;
  r = await testEndpoint(
    'GET /labs/my-lab-projects',
    'GET',
    '/labs/my-lab-projects',
    null,
    universityToken
  );
  if (r.success) passedTests++;

  // Test 4: Get available lab projects
  totalTests++;
  r = await testEndpoint(
    'GET /labs/available-lab-projects',
    'GET',
    '/labs/available-lab-projects',
    null,
    universityToken
  );
  if (r.success) passedTests++;

  // Test 5: Get my equipment requests
  totalTests++;
  r = await testEndpoint(
    'GET /labs/my-equipment-requests',
    'GET',
    '/labs/my-equipment-requests',
    null,
    universityToken
  );
  if (r.success) passedTests++;

  // ==================== TASK 2C ====================
  console.log('\n[ TASK 2C: INFRASTRUCTURE SERVICES ]\n');
  
  const futureDate = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);

  // Test 1: Create infrastructure request
  totalTests++;
  r = await testEndpoint(
    'POST /infrastructure-services/create',
    'POST',
    '/infrastructure-services/create',
    {
      serviceDescription: 'Install water line for Lab 5',
      location: { buildingName: 'Lab Building', floor: '2', room: 'Lab 5' },
      requestedDate: futureDate.toISOString(),
      estimatedDuration: '2 weeks',
      budget: 15000,
      serviceType: 'infrastructure-setup'
    },
    universityToken
  );
  if (r.success) passedTests++;

  // Test 2: Get university requests
  totalTests++;
  r = await testEndpoint(
    'GET /infrastructure-services/university-requests',
    'GET',
    '/infrastructure-services/university-requests',
    null,
    universityToken
  );
  if (r.success) passedTests++;

  // Test 3: Get pending requests
  totalTests++;
  r = await testEndpoint(
    'GET /infrastructure-services/pending-requests',
    'GET',
    '/infrastructure-services/pending-requests',
    null,
    universityToken
  );
  if (r.success) passedTests++;

  // ==================== FINAL RESULTS ====================
  console.log('\n╔═══════════════════════════════════════════════════════════════════╗');
  console.log('║                      FINAL RESULTS                                ║');
  console.log('╚═══════════════════════════════════════════════════════════════════╝\n');

  const successRate = ((passedTests / totalTests) * 100).toFixed(1);
  console.log(`✓ Total Passed:    ${passedTests}/${totalTests}`);
  console.log(`✓ Success Rate:    ${successRate}%\n`);

  if (successRate === '100.0') {
    console.log('🎉 ALL TASKS 2A, 2B, 2C ARE WORKING PERFECTLY!\n');
  } else {
    console.log(`⚠️  ${totalTests - passedTests} test(s) failed.\n`);
  }
}

main().catch(err => {
  console.error('Error:', err.message);
  process.exit(1);
});

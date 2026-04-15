const axios = require('axios');

const BASE_URL = 'http://localhost:5000/api';

let universityToken = null;
let consultantToken = null;

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

async function testEndpoint(name, method, endpoint, data = null, token = null) {
  try {
    const config = { 
      method, 
      url: `${BASE_URL}${endpoint}`,
      ...(token && { headers: { Authorization: `Bearer ${token}` } })
    };
    
    if (data) config.data = data;

    const response = await axios(config);
    console.log(`✓ ${name}: ${response.status}`);
    return response;
  } catch (error) {
    const status = error.response?.status || 'ERR';
    const message = error.response?.data?.message || error.message;
    console.log(`✗ ${name}: [${status}] ${message}`);
    return null;
  }
}

async function main() {
  console.log('\n╔═══════════════════════════════════════════════════════════════════╗');
  console.log('║     DETAILED VALIDATION: Tasks 2A, 2B, 2C                         ║');
  console.log('╚═══════════════════════════════════════════════════════════════════╝\n');

  // Setup
  console.log('[ SETUP ]\n');
  universityToken = await createUser('university@demo.com', 'Demo University', 'university');
  consultantToken = await createUser('consultant@demo.com', 'Demo Consultant', 'consultant');
  
  if (!universityToken || !consultantToken) {
    console.log('✗ Failed to authenticate users');
    return;
  }
  console.log('✓ Users authenticated\n');

  // ==================== TASK 2A ====================
  console.log('[ TASK 2A: CONSULTANT HIRE REQUESTS ]\n');
  
  // First, need to get the consultant's actual ID
  let consultantId = null;
  try {
    const resp = await axios.get(`${BASE_URL}/hire/consultant/pending`, 
      { headers: { Authorization: `Bearer ${consultantToken}` } });
    // For now, use a placeholder - the consultant endpoint should tell us the user's ID
    // Let's just use the token's user info
  } catch (e) {}

  const hireRes = await testEndpoint(
    'POST /hire/create (with correct fields)',
    'POST',
    '/hire/create',
    {
      consultantId: 'test-consultant-id',  // This should fail if consultant doesn't exist
      projectName: 'Lab Equipment Setup',
      projectDescription: 'Need assistance with equipment',
      startDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],  // 7 days from now
      endDate: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]    // 14 days from now
    },
    universityToken
  );

  await testEndpoint('GET /hire/university/requests', 'GET', '/hire/university/requests', null, universityToken);
  await testEndpoint('GET /hire/consultant/pending', 'GET', '/hire/consultant/pending', null, consultantToken);

  // ==================== TASK 2B ====================
  console.log('\n[ TASK 2B: LAB PLANNING & PROCUREMENT ]\n');
  
  await testEndpoint('GET /labs/equipment-catalog', 'GET', '/labs/equipment-catalog', null, universityToken);

  const labRes = await testEndpoint(
    'POST /labs/create (with correct fields)',
    'POST',
    '/labs/create',
    {
      labName: 'Microcontroller Lab',
      labType: 'Electronics',
      requirements: {
        hardware: ['Arduino', 'Sensors', 'Breadboards'],
        software: ['Arduino IDE', 'Python'],
        capacity: 30
      }
    },
    universityToken
  );

  await testEndpoint('GET /labs/my-lab-projects', 'GET', '/labs/my-lab-projects', null, universityToken);
  await testEndpoint('GET /labs/available-lab-projects', 'GET', '/labs/available-lab-projects', null, universityToken);

  // ==================== TASK 2C ====================
  console.log('\n[ TASK 2C: INFRASTRUCTURE SERVICES ]\n');
  
  const futureDate = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
  
  const infraRes = await testEndpoint(
    'POST /infrastructure-services/create (with correct fields)',
    'POST',
    '/infrastructure-services/create',
    {
      serviceDescription: 'Install new water line for Lab 5',
      location: 'Lab Building 5',
      requestedDate: futureDate,
      estimatedDuration: '2 weeks',
      budget: 15000,
      serviceType: 'Water Supply'
    },
    universityToken
  );

  await testEndpoint('GET /infrastructure-services/university-requests', 'GET', '/infrastructure-services/university-requests', null, universityToken);
  await testEndpoint('GET /infrastructure-services/pending-requests', 'GET', '/infrastructure-services/pending-requests', null, universityToken);

  console.log('\n');
}

main().catch(err => {
  console.error('Error:', err.message);
  process.exit(1);
});

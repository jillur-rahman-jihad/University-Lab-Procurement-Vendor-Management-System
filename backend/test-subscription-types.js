const axios = require('axios');

// Test Configuration
const API_URL = 'http://localhost:5001';
const TEST_TIMEOUT = 10000;

// Mock user tokens (you'll need valid tokens from actual login)
let validToken = null;

async function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

// Get a valid token by logging in or using an existing one
async function getValidToken() {
  try {
    // Try to login as a test university
    const loginResponse = await axios.post(`${API_URL}/api/auth/login`, {
      email: 'test@university.edu',
      password: 'password123'
    });
    return loginResponse.data.token;
  } catch (err) {
    console.log('Note: Could not auto-login. Please provide valid token.');
    return null;
  }
}

// Test 1: Get Current Subscription
async function testGetCurrentSubscription(token) {
  if (!token) {
    console.log('\n❌ TEST 1 SKIPPED: No valid token');
    return;
  }

  try {
    console.log('\n📋 TEST 1: Get Current Subscription');
    const response = await axios.get(`${API_URL}/api/subscription/current`, {
      headers: { Authorization: `Bearer ${token}` },
      timeout: TEST_TIMEOUT
    });
    console.log('✅ Success:', response.data);
  } catch (err) {
    console.log('❌ Failed:', err.response?.data || err.message);
  }
}

// Test 2: Get Plan Limits
async function testGetPlanLimits(token) {
  if (!token) {
    console.log('\n❌ TEST 2 SKIPPED: No valid token');
    return;
  }

  try {
    console.log('\n📋 TEST 2: Get Plan Limits');
    const response = await axios.get(`${API_URL}/api/subscription/limits`, {
      headers: { Authorization: `Bearer ${token}` },
      timeout: TEST_TIMEOUT
    });
    console.log('✅ Success:', response.data);
  } catch (err) {
    console.log('❌ Failed:', err.response?.data || err.message);
  }
}

// Test 3: Check Consultant Type (with mock consultant ID)
async function testCheckConsultantType(token) {
  if (!token) {
    console.log('\n❌ TEST 3 SKIPPED: No valid token');
    return;
  }

  try {
    console.log('\n📋 TEST 3: Check Consultant Type');
    
    // First get available consultants
    const consultantsResponse = await axios.get(`${API_URL}/api/university/search-consultants`, {
      headers: { Authorization: `Bearer ${token}` },
      timeout: TEST_TIMEOUT
    });

    const consultants = consultantsResponse.data.consultants || [];
    
    if (consultants.length === 0) {
      console.log('⚠️  No consultants available to test');
      return;
    }

    console.log(`Found ${consultants.length} consultants`);

    // Test with first consultant
    const testConsultant = consultants[0];
    const typeResponse = await axios.post(
      `${API_URL}/api/subscription/check-consultant-type`,
      { consultantId: testConsultant._id },
      {
        headers: { Authorization: `Bearer ${token}` },
        timeout: TEST_TIMEOUT
      }
    );

    console.log('✅ Success:');
    console.log('   Consultant:', testConsultant.name);
    console.log('   Type:', testConsultant.consultantInfo?.experienceLevel || 'General');
    console.log('   Response:', typeResponse.data);
  } catch (err) {
    console.log('❌ Failed:', err.response?.data || err.message);
  }
}

// Test 4: Verify Endpoint Exists
async function testEndpointExists() {
  try {
    console.log('\n📋 TEST 4: Verify Endpoints Exist');
    
    const endpoints = [
      '/api/subscription/current',
      '/api/subscription/limits',
      '/api/subscription/check-quotation',
      '/api/subscription/check-lab-project',
      '/api/subscription/check-consultant-hire',
      '/api/subscription/check-consultant-type'
    ];

    for (const endpoint of endpoints) {
      try {
        await axios.get(`${API_URL}${endpoint}`, {
          headers: { Authorization: 'Bearer test' },
          timeout: 2000
        });
        console.log(`✓ ${endpoint} - Exists (responds with auth error)`);
      } catch (err) {
        if (err.response?.status === 401 || err.response?.status === 403) {
          console.log(`✓ ${endpoint} - Exists (requires auth)`);
        } else if (err.code === 'ECONNREFUSED') {
          console.log(`✗ ${endpoint} - Server not responding`);
        } else {
          console.log(`? ${endpoint} - ${err.code || err.message}`);
        }
      }
    }
  } catch (err) {
    console.log('❌ Failed:', err.message);
  }
}

// Main test runner
async function runTests() {
  console.log('🚀 Starting Subscription System Tests');
  console.log('=====================================');

  // First verify endpoints exist
  await testEndpointExists();

  // Try to get a token
  validToken = await getValidToken();

  if (!validToken) {
    console.log('\n⚠️  Running tests without authentication token');
    console.log('To test with auth, provide a valid logged-in user token');
  }

  // Run authenticated tests
  await testGetCurrentSubscription(validToken);
  await testGetPlanLimits(validToken);
  await testCheckConsultantType(validToken);

  console.log('\n=====================================');
  console.log('✅ Test Suite Completed');
}

// Run tests
runTests().catch(console.error);

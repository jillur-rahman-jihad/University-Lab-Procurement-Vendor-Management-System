const axios = require('axios');

const BASE_URL = 'http://localhost:5000/api';

let universityToken = '';
let universityId = '';
let infrastructureRequestId = '';

const test = async () => {
  try {
    console.log('\n--- Testing Infrastructure Setup Feature ---\n');

    // Step 1: Register university user
    console.log('1. Registering University...');
    const universityReg = await axios.post(`${BASE_URL}/auth/register`, {
      name: 'Infrastructure Test University',
      email: `infra-university-${Date.now()}@test.com`,
      password: 'password123',
      role: 'university',
      department: 'Engineering'
    });
    universityToken = universityReg.data.token;
    universityId = universityReg.data._id;
    console.log('✓ University registered:', universityReg.data.email);

    // Step 2: Request infrastructure setup
    console.log('\n2. Requesting infrastructure setup service...');
    const infraRes = await axios.post(`${BASE_URL}/university/request-infrastructure`, {
      serviceType: 'on-site-deployment',
      description: 'We need on-site setup for our new AI computing lab with GPU servers and networking infrastructure.',
      estimatedBudget: 50000,
      priority: 'high',
      location: {
        address: '123 University Lane',
        city: 'Tech City',
        state: 'California',
        zipCode: '94000'
      },
      requiredDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
      notes: 'This is an urgent lab setup project that requires experienced installation team.'
    }, {
      headers: { Authorization: `Bearer ${universityToken}` }
    });
    infrastructureRequestId = infraRes.data.setupRequest._id;
    console.log('✓ Infrastructure setup request created');
    console.log('  - Request ID:', infrastructureRequestId);
    console.log('  - Service Type:', infraRes.data.setupRequest.serviceType);
    console.log('  - Budget: $', infraRes.data.setupRequest.estimatedBudget);
    console.log('  - Status:', infraRes.data.setupRequest.status);

    // Step 3: Get all infrastructure requests
    console.log('\n3. Retrieving all infrastructure requests...');
    const requestsRes = await axios.get(`${BASE_URL}/university/infrastructure-requests`, {
      headers: { Authorization: `Bearer ${universityToken}` }
    });
    console.log(`✓ Retrieved ${requestsRes.data.total} infrastructure request(s)`);
    requestsRes.data.requests.forEach((req, idx) => {
      console.log(`  Request ${idx + 1}: ${req.serviceType} - $${req.estimatedBudget} (${req.status})`);
    });

    // Step 4: Get single infrastructure request
    console.log('\n4. Getting detailed request information...');
    const detailRes = await axios.get(`${BASE_URL}/university/infrastructure-requests/${infrastructureRequestId}`, {
      headers: { Authorization: `Bearer ${universityToken}` }
    });
    console.log('✓ Request details retrieved');
    console.log('  - Description:', detailRes.data.description);
    console.log('  - Location:', detailRes.data.location.city + ', ' + detailRes.data.location.state);
    console.log('  - Priority:', detailRes.data.priority);
    console.log('  - Timeline:', detailRes.data.timeline.length, 'entries');

    // Step 5: Request another infrastructure service
    console.log('\n5. Requesting additional infrastructure service...');
    const infra2Res = await axios.post(`${BASE_URL}/university/request-infrastructure`, {
      serviceType: 'network-setup',
      description: 'Network infrastructure setup for connecting multiple lab locations.',
      estimatedBudget: 25000,
      priority: 'medium',
      location: {
        address: '456 Science Ave',
        city: 'Tech City',
        state: 'California',
        zipCode: '94001'
      }
    }, {
      headers: { Authorization: `Bearer ${universityToken}` }
    });
    console.log('✓ Second infrastructure request created');
    console.log('  - Service Type:', infra2Res.data.setupRequest.serviceType);
    console.log('  - Budget: $', infra2Res.data.setupRequest.estimatedBudget);

    // Step 6: Get all requests again
    console.log('\n6. Retrieving all infrastructure requests again...');
    const allReqRes = await axios.get(`${BASE_URL}/university/infrastructure-requests`, {
      headers: { Authorization: `Bearer ${universityToken}` }
    });
    console.log(`✓ Now have ${allReqRes.data.total} total request(s)`);

    console.log('\n--- All infrastructure setup tests passed! ✓ ---\n');
  } catch (error) {
    console.error('❌ Test failed:', error.response?.data || error.message);
    process.exit(1);
  }
};

test();

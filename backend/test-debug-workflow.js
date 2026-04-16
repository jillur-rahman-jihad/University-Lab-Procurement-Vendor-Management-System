const http = require('http');

// Test to create infrastructure service and then test related endpoints
async function makeRequest(method, path, body = null, token) {
  return new Promise((resolve) => {
    const options = {
      hostname: 'localhost',
      port: 5000,
      path: path,
      method: method,
      headers: { 'Content-Type': 'application/json' }
    };
    if (token) options.headers['Authorization'] = `Bearer ${token}`;

    const req = http.request(options, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        try {
          resolve({ status: res.statusCode, body: JSON.parse(data) });
        } catch {
          resolve({ status: res.statusCode, body: data });
        }
      });
    });
    req.on('error', (e) => resolve({ status: 'ERROR', body: e.message }));
    if (body) req.write(JSON.stringify(body));
    req.end();
  });
}

async function test() {
  console.log('\n=== TESTING INFRASTRUCTURE SERVICE WORKFLOW ===\n');

  // Register user
  const testUser = {
    name: 'Test Univ Infrastructure',
    email: `test-infra-${Date.now()}@demo.com`,
    password: 'TestPass123!',
    role: 'university',
    phone: '01700000000',
    address: 'Test Address',
    department: 'Engineering'
  };

  const regResult = await makeRequest('POST', '/api/auth/register', testUser);
  const token = regResult.body.token;
  console.log('✓ User registered');

  // Test creating service with CORRECT date format
  const futureDate = new Date();
  futureDate.setDate(futureDate.getDate() + 7); // 7 days in future

  console.log('\nCreating infrastructure service request...');
  const createResult = await makeRequest('POST', '/api/infrastructure-services/create', {
    serviceDescription: 'Network infrastructure setup',
    location: 'Building A, Floor 3',
    requestedDate: futureDate.toISOString(), // Use ISO format
    estimatedDuration: '2 weeks',
    budget: 250000,
    serviceType: 'IT Infrastructure',
    specialRequirements: 'Must include WiFi coverage'
  }, token);

  console.log(`Status: ${createResult.status}`);
  if (createResult.status === 201) {
    console.log(`✓ Created successfully`);
    const serviceId = createResult.body.serviceRequest?._id;
    console.log(`Service ID: ${serviceId}`);

    if (serviceId) {
      // Test getting details
      console.log('\nTesting service details endpoint...');
      const detailsResult = await makeRequest('GET', `/api/infrastructure-services/${serviceId}/details`, null, token);
      console.log(`GET /.../${serviceId}/details - Status: ${detailsResult.status}`);

      // Test approve
      console.log('\nTesting approve endpoint...');
      const approveResult = await makeRequest('PUT', `/api/infrastructure-services/${serviceId}/approve`, 
        { comments: 'Approved' }, token);
      console.log(`PUT /.../${serviceId}/approve - Status: ${approveResult.status}`);

      // Test update status
      console.log('\nTesting update status endpoint...');
      const updateResult = await makeRequest('PUT', `/api/infrastructure-services/${serviceId}/update-status`,
        { status: 'in_progress' }, token);
      console.log(`PUT /.../${serviceId}/update-status - Status: ${updateResult.status}`);
    }
  } else {
    console.log(`✗ Creation failed`);
    console.log('Response:', createResult.body);
  }

  // Test labs create with CORRECT field names
  console.log('\n\n=== TESTING LAB CREATE WORKFLOW ===\n');

  const labCreateResult = await makeRequest('POST', '/api/labs/create', {
    labName: 'Physics Lab',
    labType: 'Experimental',
    requirements: ['Oscilloscope', 'Power supply', 'Multimeter']
  }, token);

  console.log(`POST /labs/create - Status: ${labCreateResult.status}`);
  if (labCreateResult.status === 201) {
    console.log('✓ Lab created successfully');
  } else {
    console.log('Response:', labCreateResult.body);
  }
}

test().catch(console.error);

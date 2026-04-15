const http = require('http');

function makeRequest(method, path, body = null, token) {
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

async function debug() {
  console.log('\n=== DEBUGGING TASK 2B & 2C ISSUES ===\n');

  // Register user
  const testUser = {
    name: 'Debug Test User',
    email: `debug-${Date.now()}@demo.com`,
    password: 'DebugPass123!',
    role: 'university',
    phone: '01700000000',
    address: 'Test Address',
    department: 'Engineering'
  };

  const regResult = await makeRequest('POST', '/api/auth/register', testUser);
  const token = regResult.body.token;
  console.log('✓ User registered\n');

  // DEBUG TASK 2B: Test lab creation with exact field names
  console.log('[ TASK 2B DEBUG: Lab Creation ]\n');

  console.log('Test 1: Creating lab with correct enum value...');
  let result = await makeRequest('POST', '/api/labs/create', {
    labName: 'Physics Lab',
    labType: 'Normal', // Correct enum
    requirements: {
      mainRequirement: 'Physics equipment setup',
      systems: 5,
      budgetMin: 50000,
      budgetMax: 100000,
      software: ['Python', 'MATLAB']
    }
  }, token);
  console.log(`Status: ${result.status}`);
  if (result.status !== 201) console.log('Error:', result.body);
  if (result.status === 201) {
    console.log('✓ Lab created successfully');
    const labId = result.body.labProject._id;
    
    // Test procurement-order with real lab ID
    console.log('\nTest 2: Fetching procurement order...');
    result = await makeRequest('GET', `/api/labs/procurement-order/${labId}`, null, token);
    console.log(`Status: ${result.status}`);
    if (result.status !== 200) console.log('Error:', result.body);
  }

  // DEBUG TASK 2C: Test infrastructure creation
  console.log('\n[ TASK 2C DEBUG: Infrastructure Service ]\n');

  // Calculate future date correctly
  const futureDate = new Date();
  futureDate.setDate(futureDate.getDate() + 7);
  const isoDate = futureDate.toISOString();

  console.log(`Test 1: Creating infrastructure service with date: ${isoDate}`);
  result = await makeRequest('POST', '/api/infrastructure-services/create', {
    serviceDescription: 'Network infrastructure setup',
    location: 'Building A',
    requestedDate: isoDate,
    estimatedDuration: '2 weeks',
    budget: 250000,
    serviceType: 'infrastructure-setup' // Correct enum
  }, token);
  console.log(`Status: ${result.status}`);
  if (result.status !== 201) {
    console.log('Error:', result.body.error || result.body.message);
  } else {
    console.log('✓ Service created successfully');
    const serviceId = result.body.serviceRequest._id;
    
    // Test details endpoint with real ID
    console.log('\nTest 2: Fetching service details...');
    result = await makeRequest('GET', `/api/infrastructure-services/${serviceId}/details`, null, token);
    console.log(`Status: ${result.status}`);
    if (result.status !== 200) console.log('Error:', result.body);
    
    // Test approve endpoint
    console.log('\nTest 3: Approving service...');
    result = await makeRequest('PUT', `/api/infrastructure-services/${serviceId}/approve`, 
      { comments: 'Approved' }, token);
    console.log(`Status: ${result.status}`);
    if (result.status !== 200) console.log('Error:', result.body);
  }

  console.log('\n=== DEBUG COMPLETE ===\n');
}

debug().catch(console.error);

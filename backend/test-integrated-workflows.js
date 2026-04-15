const http = require('http');

// First, register and get token for a test user
async function registerTestUser() {
  return new Promise((resolve) => {
    const testUser = {
      name: 'Test University 2',
      email: `test-univ-${Date.now()}@demo.com`,
      password: 'TestPass123!',
      role: 'university',
      phone: '01700000000',
      address: 'Test Address',
      department: 'Engineering',
      authorizedRepresentative: {
        name: 'Test Rep',
        email: 'rep@demo.com',
        phone: '01711111111'
      }
    };

    const data = JSON.stringify(testUser);
    const req = http.request({
      hostname: 'localhost',
      port: 5000,
      path: '/api/auth/register',
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Content-Length': data.length }
    }, (res) => {
      let body = '';
      res.on('data', chunk => body += chunk);
      res.on('end', () => {
        const parsed = JSON.parse(body);
        resolve({ token: parsed.token, email: testUser.email });
      });
    });
    req.write(data);
    req.end();
  });
}

// Helper to make requests
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
    req.on('error', () => resolve({ status: 'ERROR', body: {} }));
    if (body) req.write(JSON.stringify(body));
    req.end();
  });
}

const testResults = { passed: 0, failed: 0, tests: [] };

async function recordTest(name, result, expectedStatus) {
  const passed = result.status === expectedStatus;
  testResults.tests.push({ name, passed, status: result.status });
  if (passed) testResults.passed++;
  else testResults.failed++;
  
  const symbol = passed ? '✓' : '✗';
  console.log(`  ${symbol} ${name.padEnd(45)} [${result.status}]`);
}

async function runTests() {
  console.log('\n╔══════════════════════════════════════════════════════════╗');
  console.log('║     INTEGRATED WORKFLOW TESTING (2A, 2B, 2C)           ║');
  console.log('╚══════════════════════════════════════════════════════════╝\n');

  // Get auth token
  console.log('[ AUTHENTICATION ]\n');
  const { token } = await registerTestUser();
  console.log('✓ Test user registered and token obtained\n');

  // ===== TASK 2A: UNIVERSITY MANAGEMENT =====
  console.log('[ TASK 2A: UNIVERSITY MANAGEMENT ]\n');

  let result = await makeRequest('GET', '/api/university/dashboard-data', null, token);
  await recordTest('GET /university/dashboard-data', result, 200);

  result = await makeRequest('GET', '/api/university/lab-requests/active', null, token);
  await recordTest('GET /university/lab-requests/active', result, 200);

  result = await makeRequest('GET', '/api/university/service-requests/active', null, token);
  await recordTest('GET /university/service-requests/active', result, 200);

  result = await makeRequest('GET', '/api/university/analytics/planning', null, token);
  await recordTest('GET /university/analytics/planning', result, 200);

  result = await makeRequest('GET', '/api/university/search-labs', null, token);
  await recordTest('GET /university/search-labs', result, 200);

  result = await makeRequest('PUT', '/api/university/update-profile', 
    { name: 'Updated Univ', phone: '01711111111' }, token);
  await recordTest('PUT /university/update-profile', result, 200);

  // ===== TASK 2B: LAB PLANNING & PROCUREMENT =====
  console.log('\n[ TASK 2B: LAB PLANNING & PROCUREMENT ]\n');

  result = await makeRequest('GET', '/api/labs/equipment-catalog', null, token);
  await recordTest('GET /labs/equipment-catalog', result, 200);

  result = await makeRequest('GET', '/api/labs/available-lab-projects', null, token);
  await recordTest('GET /labs/available-lab-projects', result, 200);

  result = await makeRequest('GET', '/api/labs/my-equipment-requests', null, token);
  await recordTest('GET /labs/my-equipment-requests', result, 200);

  result = await makeRequest('GET', '/api/labs/my-lab-projects', null, token);
  await recordTest('GET /labs/my-lab-projects', result, 200);

  result = await makeRequest('POST', '/api/labs/lab-equipment-request',
    {
      equipmentName: 'Microscope',
      quantity: 5,
      estimatedCost: 25000,
      description: 'For lab'
    }, token);
  await recordTest('POST /labs/lab-equipment-request', result, 400); // Expected validation

  result = await makeRequest('POST', '/api/labs/create',
    {
      labName: 'Lab Setup',
      labType: 'Normal', // Valid enum: "Normal", "Graphics", "Networking", "Thesis", "AI"
      requirements: {
        mainRequirement: 'Basic system setup',
        systems: 10,
        budgetMin: 50000,
        budgetMax: 100000,
        software: ['Python', 'Visual Studio']
      }
    }, token);
  await recordTest('POST /labs/create', result, 201);

  result = await makeRequest('POST', '/api/labs/assign-lab-project',
    { projectId: '6000000000000000000' }, token);
  await recordTest('POST /labs/assign-lab-project', result, 400);

  // ===== TASK 2C: INFRASTRUCTURE SERVICES =====
  console.log('\n[ TASK 2C: INFRASTRUCTURE SERVICES ]\n');

  result = await makeRequest('GET', '/api/infrastructure-services/university-requests', null, token);
  await recordTest('GET /infrastructure-services/university-requests', result, 200);

  result = await makeRequest('GET', '/api/infrastructure-services/pending-requests', null, token);
  await recordTest('GET /infrastructure-services/pending-requests', result, 200);

  // Task 2C: Infrastructure Services
  const futureDate = new Date();
  futureDate.setDate(futureDate.getDate() + 7);

  result = await makeRequest('POST', '/api/infrastructure-services/create',
    {
      serviceDescription: 'Network setup',
      location: 'Building A',
      requestedDate: futureDate.toISOString(), // ISO format for date
      estimatedDuration: '1 week',
      budget: 150000,
      serviceType: 'infrastructure-setup' // Valid enum
    }, token);
  await recordTest('POST /infrastructure-services/create', result, 201);

  result = await makeRequest('GET', '/api/infrastructure-services/507f1f77bcf86cd799439011/details', null, token);
  await recordTest('GET /infrastructure-services/:id/details', result, 400);

  result = await makeRequest('PUT', '/api/infrastructure-services/507f1f77bcf86cd799439011/approve',
    { comments: 'OK' }, token);
  await recordTest('PUT /infrastructure-services/:id/approve', result, 400);

  result = await makeRequest('PUT', '/api/infrastructure-services/507f1f77bcf86cd799439011/update-status',
    { status: 'in-progress' }, token);
  await recordTest('PUT /infrastructure-services/:id/update-status', result, 400);

  // ===== SUMMARY =====
  console.log('\n╔══════════════════════════════════════════════════════════╗');
  console.log('║                    TEST SUMMARY                           ║');
  console.log('╚══════════════════════════════════════════════════════════╝\n');

  const totalTests = testResults.passed + testResults.failed;
  const passRate = ((testResults.passed / totalTests) * 100).toFixed(1);

  console.log(`Passed:             ${testResults.passed}/${totalTests}`);
  console.log(`Failed:             ${testResults.failed}/${totalTests}`);
  console.log(`Pass Rate:          ${passRate}%\n`);

  // Group by task
  const task2A = testResults.tests.filter(t => t.name.includes('university')).filter(t => t.passed).length;
  const task2ATotal = testResults.tests.filter(t => t.name.includes('university')).length;
  
  const task2B = testResults.tests.filter(t => t.name.includes('/labs')).filter(t => t.passed).length;
  const task2BTotal = testResults.tests.filter(t => t.name.includes('/labs')).length;
  
  const task2C = testResults.tests.filter(t => t.name.includes('infrastructure')).filter(t => t.passed).length;
  const task2CTotal = testResults.tests.filter(t => t.name.includes('infrastructure')).length;

  console.log(`Task 2A (University):       ${task2A}/${task2ATotal} passed`);
  console.log(`Task 2B (Lab Planning):     ${task2B}/${task2BTotal} passed`);
  console.log(`Task 2C (Infrastructure):   ${task2C}/${task2CTotal} passed\n`);

  process.exit(testResults.failed === 0 ? 0 : 1);
}

runTests().catch(console.error);

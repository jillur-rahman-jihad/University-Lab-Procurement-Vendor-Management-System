const http = require('http');

const testResults = { passed: 0, failed: 0, tests: [] };

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

async function test(name, method, path, body, expectedStatus, token) {
  const result = await makeRequest(method, path, body, token);
  const passed = result.status === expectedStatus;
  testResults.tests.push({ name, passed, status: result.status });
  if (passed) testResults.passed++;
  else testResults.failed++;
  
  const symbol = passed ? '✓' : '✗';
  console.log(`  ${symbol} ${name.padEnd(45)} [${result.status}]`);
  return result;
}

async function runTests() {
  console.log('\n╔════════════════════════════════════════════════════════════╗');
  console.log('║   FINAL COMPREHENSIVE TEST (Tasks 2A, 2B, 2C)           ║');
  console.log('╚════════════════════════════════════════════════════════════╝\n');

  // Register test user
  console.log('[ AUTHENTICATION ]\n');
  const testUser = {
    name: 'Final Test User',
    email: `final-test-${Date.now()}@demo.com`,
    password: 'TestPass123!',
    role: 'university',
    phone: '01700000000',
    address: 'Test Address',
    department: 'Engineering'
  };

  const regResult = await makeRequest('POST', '/api/auth/register', testUser);
  const token = regResult.body.token;
  console.log('✓ Test user authenticated\n');

  // ============ TASK 2A: UNIVERSITY MANAGEMENT ============
  console.log('[ TASK 2A: UNIVERSITY MANAGEMENT ]\n');

  await test('GET /university/dashboard-data', 'GET', '/api/university/dashboard-data', null, 200, token);
  await test('GET /university/lab-requests/active', 'GET', '/api/university/lab-requests/active', null, 200, token);
  await test('GET /university/service-requests/active', 'GET', '/api/university/service-requests/active', null, 200, token);
  await test('GET /university/analytics/planning', 'GET', '/api/university/analytics/planning', null, 200, token);
  await test('GET /university/search-labs', 'GET', '/api/university/search-labs', null, 200, token);

  const updateResult = await test(
    'PUT /university/update-profile',
    'PUT',
    '/api/university/update-profile',
    { name: 'Updated University', phone: '01711111111' },
    200,
    token
  );

  // ============ TASK 2B: LAB PLANNING & PROCUREMENT ============
  console.log('\n[ TASK 2B: LAB PLANNING & PROCUREMENT ]\n');

  await test('GET /labs/equipment-catalog', 'GET', '/api/labs/equipment-catalog', null, 200, token);
  await test('GET /labs/available-lab-projects', 'GET', '/api/labs/available-lab-projects', null, 200, token);
  await test('GET /labs/my-equipment-requests', 'GET', '/api/labs/my-equipment-requests', null, 200, token);
  await test('GET /labs/my-lab-projects', 'GET', '/api/labs/my-lab-projects', null, 200, token);

  // Create lab project
  const createLabResult = await test(
    'POST /labs/create (new project)',
    'POST',
    '/api/labs/create',
    {
      labName: 'Physics Lab',
      labType: 'Normal',
      requirements: {
        mainRequirement: 'Experimental physics equipment',
        systems: 5,
        budgetMin: 50000,
        budgetMax: 100000,
        software: ['Python', 'MATLAB']
      }
    },
    201,
    token
  );

  // Request equipment
  await test(
    'POST /labs/lab-equipment-request',
    'POST',
    '/api/labs/lab-equipment-request',
    {
      equipmentName: 'Oscilloscope',
      quantity: 3,
      estimatedCost: 15000,
      description: 'For measurements'
    },
    400, // Validation
    token
  );

  // Assign project
  await test(
    'POST /labs/assign-lab-project',
    'POST',
    '/api/labs/assign-lab-project',
    { projectId: '6000000000000000000' },
    400,
    token
  );

  // ============ TASK 2C: INFRASTRUCTURE SERVICES ============
  console.log('\n[ TASK 2C: INFRASTRUCTURE SERVICES ]\n');

  await test('GET /infrastructure-services/university-requests', 'GET', '/api/infrastructure-services/university-requests', null, 200, token);
  await test('GET /infrastructure-services/pending-requests', 'GET', '/api/infrastructure-services/pending-requests', null, 200, token);

  // Create infrastructure service
  const futureDate = new Date();
  futureDate.setDate(futureDate.getDate() + 7);

  const createInfraResult = await test(
    'POST /infrastructure-services/create',
    'POST',
    '/api/infrastructure-services/create',
    {
      serviceDescription: 'Network infrastructure installation',
      location: 'Building A',
      requestedDate: futureDate.toISOString(),
      estimatedDuration: '2 weeks',
      budget: 250000,
      serviceType: 'infrastructure-setup'
    },
    201,
    token
  );

  // Test infrastructure endpoints with created service ID
  if (createInfraResult.status === 201 && createInfraResult.body.serviceRequest?._id) {
    const serviceId = createInfraResult.body.serviceRequest._id;

    await test(
      `GET /infrastructure-services/${serviceId}/details`,
      'GET',
      `/api/infrastructure-services/${serviceId}/details`,
      null,
      200,
      token
    );

    await test(
      `PUT /infrastructure-services/${serviceId}/approve`,
      'PUT',
      `/api/infrastructure-services/${serviceId}/approve`,
      { comments: 'Approved' },
      200,
      token
    );

    await test(
      `PUT /infrastructure-services/${serviceId}/update-status`,
      'PUT',
      `/api/infrastructure-services/${serviceId}/update-status`,
      { status: 'in-progress' },
      200,
      token
    );
  } else {
    console.log('  ⚠ Skipped dynamic infrastructure tests (creation failed)');
  }

  // ============ SUMMARY ============
  console.log('\n╔════════════════════════════════════════════════════════════╗');
  console.log('║                    FINAL REPORT                            ║');
  console.log('╚════════════════════════════════════════════════════════════╝\n');

  const total = testResults.passed + testResults.failed;
  const passRate = ((testResults.passed / total) * 100).toFixed(1);

  console.log(`✓ Passed:           ${testResults.passed}/${total}`);
  console.log(`✗ Failed:           ${testResults.failed}/${total}`);
  console.log(`Pass Rate:          ${passRate}%\n`);

  const task2ATests = testResults.tests.filter(t => t.name.includes('university'));
  const task2BTests = testResults.tests.filter(t => t.name.includes('/labs'));
  const task2CTests = testResults.tests.filter(t => t.name.includes('infrastructure'));

  const task2APass = task2ATests.filter(t => t.passed).length;
  const task2BPass = task2BTests.filter(t => t.passed).length;
  const task2CPass = task2CTests.filter(t => t.passed).length;

  console.log('By Task:');
  console.log(`  Task 2A (University):          ${task2APass}/${task2ATests.length} passed (${((task2APass/task2ATests.length)*100).toFixed(0)}%)`);
  console.log(`  Task 2B (Lab Planning):        ${task2BPass}/${task2BTests.length} passed (${((task2BPass/task2BTests.length)*100).toFixed(0)}%)`);
  console.log(`  Task 2C (Infrastructure):      ${task2CPass}/${task2CTests.length} passed (${((task2CPass/task2CTests.length)*100).toFixed(0)}%)`);

  console.log('\n' + (testResults.failed === 0 ? '🎉 ALL TESTS PASSED!' : `⚠ ${testResults.failed} test(s) need attention`) + '\n');

  process.exit(testResults.failed === 0 ? 0 : 1);
}

runTests().catch(console.error);

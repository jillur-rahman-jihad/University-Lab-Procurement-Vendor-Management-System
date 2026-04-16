const axios = require('axios');

const BASE_URL = 'http://localhost:5000/api';

let testResults = {
  taskA: [],
  taskB: [],
  taskC: []
};

// Test users
let universityToken = null;
let consultantToken = null;
let universityId = null;
let consultantId = null;

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
    // User might already exist, try to login
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
    console.error(`[LOGIN] Failed for ${email}:`, error.response?.data || error.message);
    return null;
  }
}

async function test(task, endpoint, method = 'GET', data = null, token = null) {
  try {
    const config = { 
      method, 
      url: `${BASE_URL}${endpoint}`,
      ...(token && { headers: { Authorization: `Bearer ${token}` } })
    };
    
    if (data) config.data = data;

    const response = await axios(config);
    const status = response.status;
    const testItem = {
      endpoint,
      method,
      status,
      passed: status >= 200 && status < 300
    };
    
    task.push(testItem);
    const icon = testItem.passed ? '✓' : '✗';
    console.log(`  ${icon} ${method} ${endpoint.padEnd(50)} [${status}]`);
    
    return response;
  } catch (error) {
    const status = error.response?.status || 'ERR';
    const testItem = {
      endpoint,
      method,
      status,
      passed: false,
      error: error.response?.data?.message || error.message
    };
    
    task.push(testItem);
    console.log(`  ✗ ${method} ${endpoint.padEnd(50)} [${status}]`);
    return null;
  }
}

async function runTests() {
  console.log('\n╔═══════════════════════════════════════════════════════════════════╗');
  console.log('║     COMPREHENSIVE VALIDATION: Tasks 2A, 2B, 2C                    ║');
  console.log('╚═══════════════════════════════════════════════════════════════════╝\n');

  // ==================== AUTHENTICATION ====================
  console.log('[ AUTHENTICATION ]\n');
  
  // Create/login test users
  console.log('Setting up test users...');
  universityToken = await createUser('university@demo.com', 'Demo University', 'university');
  if (universityToken) {
    console.log('✓ University authenticated\n');
  } else {
    // Try just login with existing user
    universityToken = await login('university@demo.com');
    if (universityToken) {
      console.log('✓ University authenticated (existing user)\n');
    } else {
      console.log('✗ University authentication failed\n');
      return;
    }
  }

  consultantToken = await createUser('consultant@demo.com', 'Demo Consultant', 'consultant');
  if (consultantToken) {
    console.log('✓ Consultant authenticated\n');
  } else {
    consultantToken = await login('consultant@demo.com');
    if (consultantToken) {
      console.log('✓ Consultant authenticated (existing user)\n');
    } else {
      console.log('✗ Consultant authentication failed\n');
      return;
    }
  }

  // ==================== TASK 2A: CONSULTANT HIRE REQUESTS ====================
  console.log('[ TASK 2A: CONSULTANT HIRE REQUESTS ]\n');

  // 1. Create hire request
  const hireRes = await test(
    testResults.taskA,
    '/hire/create',
    'POST',
    {
      consultantId: 'test-consultant-id',
      projectName: 'Lab Equipment Setup',
      description: 'Need assistance with lab equipment setup',
      budget: 5000,
      timeline: '2 weeks'
    },
    universityToken
  );

  let hireRequestId = null;
  if (hireRes?.data?.hireRequest) {
    hireRequestId = hireRes.data.hireRequest._id;
  }

  // 2. Get university hire requests
  await test(testResults.taskA, '/hire/university/requests', 'GET', null, universityToken);

  // 3. Get pending hire requests (consultant view)
  await test(testResults.taskA, '/hire/consultant/pending', 'GET', null, consultantToken);

  // 4. Get active assignments
  await test(testResults.taskA, '/hire/consultant/active', 'GET', null, consultantToken);

  // 5. Get hire request details
  if (hireRequestId) {
    await test(testResults.taskA, `/hire/${hireRequestId}`, 'GET', null, consultantToken);
  }

  // ==================== TASK 2B: LAB PLANNING & PROCUREMENT ====================
  console.log('\n[ TASK 2B: LAB PLANNING & PROCUREMENT ]\n');

  // 1. Get equipment catalog
  await test(testResults.taskB, '/labs/equipment-catalog', 'GET', null, universityToken);

  // 2. Get available lab projects
  await test(testResults.taskB, '/labs/available-lab-projects', 'GET', null, universityToken);

  // 3. Create lab project
  const labRes = await test(
    testResults.taskB,
    '/labs/create',
    'POST',
    {
      name: 'Microcontroller Lab',
      description: 'Embedded systems lab setup',
      equipmentNeeded: ['Arduino', 'Sensors']
    },
    universityToken
  );

  let labId = null;
  if (labRes?.data?.lab) {
    labId = labRes.data.lab._id;
  }

  // 4. Request equipment
  await test(
    testResults.taskB,
    '/labs/lab-equipment-request',
    'POST',
    {
      labId: labId || 'test-lab-id',
      equipmentId: 'test-equipment-id',
      quantity: 5
    },
    universityToken
  );

  // 5. Get equipment requests
  await test(testResults.taskB, '/labs/my-equipment-requests', 'GET', null, universityToken);

  // 6. Get my lab projects
  await test(testResults.taskB, '/labs/my-lab-projects', 'GET', null, universityToken);

  // 7. Assign lab project
  await test(
    testResults.taskB,
    '/labs/assign-lab-project',
    'POST',
    {
      projectId: labId || 'test-project-id',
      assignedTo: 'test-user-id'
    },
    universityToken
  );

  // ==================== TASK 2C: INFRASTRUCTURE SERVICES ====================
  console.log('\n[ TASK 2C: INFRASTRUCTURE SERVICES ]\n');

  // 1. Get university requests
  await test(testResults.taskC, '/infrastructure-services/university-requests', 'GET', null, universityToken);

  // 2. Get pending requests
  await test(testResults.taskC, '/infrastructure-services/pending-requests', 'GET', null, universityToken);

  // 3. Create infrastructure request
  const infraRes = await test(
    testResults.taskC,
    '/infrastructure-services/create',
    'POST',
    {
      serviceType: 'Water Supply',
      description: 'New water line for Lab 5',
      priority: 'high',
      estimatedBudget: 15000
    },
    universityToken
  );

  let infraId = null;
  if (infraRes?.data?.infrastructureService) {
    infraId = infraRes.data.infrastructureService._id;
  }

  if (infraId) {
    // 4. Get details
    await test(testResults.taskC, `/infrastructure-services/${infraId}/details`, 'GET', null, universityToken);

    // 5. Approve
    await test(
      testResults.taskC,
      `/infrastructure-services/${infraId}/approve`,
      'PUT',
      { approverComments: 'Approved' },
      universityToken
    );

    // 6. Update status
    await test(
      testResults.taskC,
      `/infrastructure-services/${infraId}/update-status`,
      'PUT',
      { status: 'under_construction' },
      universityToken
    );

    // 7. Update payment
    await test(
      testResults.taskC,
      `/infrastructure-services/${infraId}/update-payment`,
      'PUT',
      { amountPaid: 5000, paymentMethod: 'bank_transfer' },
      universityToken
    );
  }

  // ==================== FINAL RESULTS ====================
  console.log('\n╔═══════════════════════════════════════════════════════════════════╗');
  console.log('║                      FINAL RESULTS                                ║');
  console.log('╚═══════════════════════════════════════════════════════════════════╝\n');

  const taskAPass = testResults.taskA.filter(t => t.passed).length;
  const taskBPass = testResults.taskB.filter(t => t.passed).length;
  const taskCPass = testResults.taskC.filter(t => t.passed).length;

  const taskATotal = testResults.taskA.length;
  const taskBTotal = testResults.taskB.length;
  const taskCTotal = testResults.taskC.length;

  console.log(`Task 2A (Consultant Hiring):      ${taskAPass}/${taskATotal} Passed`);
  console.log(`Task 2B (Lab Planning):           ${taskBPass}/${taskBTotal} Passed`);
  console.log(`Task 2C (Infrastructure):         ${taskCPass}/${taskCTotal} Passed`);

  const totalPass = taskAPass + taskBPass + taskCPass;
  const totalTests = taskATotal + taskBTotal + taskCTotal;
  const successRate = ((totalPass / totalTests) * 100).toFixed(1);

  console.log(`\n✓ Total Passed:  ${totalPass}/${totalTests}`);
  console.log(`✓ Success Rate:  ${successRate}%\n`);

  if (successRate === 100) {
    console.log('🎉 ALL TASKS WORKING PERFECTLY!\n');
  } else if (successRate >= 80) {
    console.log('⚠️  Most tasks working, but some endpoints need attention.\n');
  } else {
    console.log('❌ Multiple tasks need fixes.\n');
  }
}

// Start server and run tests
const http = require('http');

function waitForServer(retries = 5) {
  return new Promise((resolve) => {
    const checkServer = () => {
      http.get('http://localhost:5000', () => {
        console.log('✓ Server is running\n');
        resolve();
      }).on('error', () => {
        retries--;
        if (retries > 0) {
          console.log('Waiting for server...');
          setTimeout(checkServer, 1000);
        } else {
          resolve();
        }
      });
    };
    checkServer();
  });
}

async function main() {
  await waitForServer();
  await runTests();
  process.exit(0);
}

main().catch(err => {
  console.error('Test Error:', err.message);
  process.exit(1);
});

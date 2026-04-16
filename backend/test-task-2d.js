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
  console.log('║     TASK 2D: CONSULTANT LAB PROJECT OPTIMIZATION                  ║');
  console.log('╚═══════════════════════════════════════════════════════════════════╝\n');

  // Setup test users
  console.log('[ SETUP ]\n');
  console.log('Creating test users...');
  
  const universityToken = await createUser('Test University', 'university');
  const consultantToken = await createUser('Expert Consultant', 'consultant');
  
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

  // ==================== STEP 1: CREATE LAB PROJECT ====================
  console.log('[ STEP 1: CREATE LAB PROJECT ]\n');
  
  totalTests++;
  let createLabRes = await testEndpoint(
    'University creates lab project',
    'POST',
    '/labs/create',
    {
      labName: 'Advanced Microcontroller Lab',
      labType: 'Normal',
      requirements: {
        mainRequirement: 'ARM Cortex-M4 processors, JTAG debuggers, development boards',
        budgetMin: 10000,
        budgetMax: 25000,
        performancePriority: 'Real-time processing & low power consumption',
        software: ['STM32CubeIDE', 'RTOS', 'GCC Compiler', 'SerialMonitor']
      }
    },
    universityToken
  );
  
  if (!createLabRes.success) {
    console.log('❌ Failed to create lab project. Exiting.');
    return;
  }
  passedTests++;

  const projectId = createLabRes.response.data.labProject._id;
  console.log(`✓ Lab project created: ${projectId}\n`);

  // ==================== STEP 2: UNIVERSITY ASSIGNS CONSULTANT ====================
  console.log('[ STEP 2: UNIVERSITY ASSIGNS CONSULTANT ]\n');
  
  totalTests++;
  let assignRes = await testEndpoint(
    'University assigns consultant to project',
    'POST',
    '/labs/optimization/assign-consultant',
    {
      projectId,
      consultantId,
      description: 'Need optimization for cost-effective implementation'
    },
    universityToken
  );
  
  if (!assignRes.success) {
    console.log('❌ Failed to assign consultant. Exiting.');
    return;
  }
  passedTests++;

  const assignmentId = assignRes.response.data.assignment._id;
  console.log(`✓ Consultant assigned: ${assignmentId}\n`);

  // ==================== STEP 3: CONSULTANT VIEWS ASSIGNED PROJECTS ====================
  console.log('[ STEP 3: CONSULTANT VIEWS ASSIGNMENTS ]\n');
  
  totalTests++;
  let viewRes = await testEndpoint(
    'Consultant views assigned projects',
    'GET',
    '/labs/optimization/my-assignments',
    null,
    consultantToken
  );
  if (viewRes.success) passedTests++;

  // ==================== STEP 4: CONSULTANT SUBMITS ARCHITECTURE SUGGESTIONS ====================
  console.log('\n[ STEP 4: CONSULTANT SUGGESTS ARCHITECTURES ]\n');
  
  // Suggestion 1: Budget-optimized
  totalTests++;
  let suggestion1Res = await testEndpoint(
    'Consultant suggests budget-optimized architecture',
    'POST',
    `/labs/optimization/assignment/${assignmentId}/suggest-architecture`,
    {
      title: 'Budget-Optimized Configuration',
      description: 'Uses STM32L476 (lower cost) instead of STM32H7, reduces development board requirements',
      category: 'Budget',
      estimatedBudgetImpact: -5000,
      performanceImprovement: 'Reduced cost while maintaining core functionality, slight decrease in processing power',
      priority: 'High',
      justification: 'STM32L476 sufficient for most labs, saves approximately 5000 USD',
      alternativeComponents: ['STM32L476 Discovery Board', 'STLINK-V2 Debugger', 'Standard USB Cables'],
      softwareAlternatives: ['Free STM32CubeIDE', 'Open-source RTOS alternatives', 'GCC (Free)']
    },
    consultantToken
  );
  if (suggestion1Res.success) passedTests++;

  // Suggestion 2: Performance-optimized
  totalTests++;
  let suggestion2Res = await testEndpoint(
    'Consultant suggests performance-optimized architecture',
    'POST',
    `/labs/optimization/assignment/${assignmentId}/suggest-architecture`,
    {
      title: 'High-Performance Architecture',
      description: 'Upgrade to STM32H7 series with real-time operating system, enables advanced projects',
      category: 'Performance',
      estimatedBudgetImpact: 8000,
      performanceImprovement: 'Double processing power, better real-time capabilities, enables DSP operations',
      priority: 'Medium',
      justification: 'Enables advanced signal processing and control systems labs',
      alternativeComponents: ['STM32H743 Nucleo Board', 'Premium STLINK Debugger', 'Logic Analyzer 16-channel'],
      softwareAlternatives: ['RT-Thread RTOS', 'ARM CMSIS libraries', 'Advanced debugging tools']
    },
    consultantToken
  );
  if (suggestion2Res.success) passedTests++;

  // Suggestion 3: Balanced
  totalTests++;
  let suggestion3Res = await testEndpoint(
    'Consultant suggests balanced architecture',
    'POST',
    `/labs/optimization/assignment/${assignmentId}/suggest-architecture`,
    {
      title: 'Balanced Approach',
      description: 'Mid-tier solution balancing cost and performance',
      category: 'Performance',
      estimatedBudgetImpact: 2000,
      performanceImprovement: 'Better than budget option, good for typical embedded systems projects',
      priority: 'High',
      justification: 'Recommended default choice for most curricula',
      alternativeComponents: ['STM32F4 Discovery Kit', 'ST-LINK Debugger', 'Full accessory kit'],
      softwareAlternatives: ['STM32CubeIDE', 'FreeRTOS', 'Standard toolchain']
    },
    consultantToken
  );
  if (suggestion3Res.success) passedTests++;

  // ==================== STEP 5: CONSULTANT UPDATES STATUS ====================
  console.log('\n[ STEP 5: CONSULTANT UPDATES STATUS ]\n');
  
  totalTests++;
  let statusRes = await testEndpoint(
    'Consultant updates assignment to "In Progress"',
    'PUT',
    `/labs/optimization/assignment/${assignmentId}/update-status`,
    {
      status: 'In Progress',
      notes: 'Completed initial analysis and submitted 3 alternative architectures'
    },
    consultantToken
  );
  if (statusRes.success) passedTests++;

  // ==================== STEP 6: UNIVERSITY REVIEWS SUGGESTIONS ====================
  console.log('\n[ STEP 6: UNIVERSITY REVIEWS SUGGESTIONS ]\n');
  
  // Approve suggestion 3 (Balanced)
  totalTests++;
  let approveRes = await testEndpoint(
    'University approves balanced architecture',
    'PUT',
    `/labs/optimization/assignment/${assignmentId}/suggestion/2/review`,
    {
      status: 'Approved',
      approvalNotes: 'Great recommendation. The balanced approach fits our budget and curriculum needs perfectly.'
    },
    universityToken
  );
  if (approveRes.success) passedTests++;

  // Reject suggestion 1 (Budget - too much reduction)
  totalTests++;
  let rejectRes = await testEndpoint(
    'University rejects budget-optimized',
    'PUT',
    `/labs/optimization/assignment/${assignmentId}/suggestion/0/review`,
    {
      status: 'Rejected',
      rejectionReason: 'The STM32L476 does not meet our advanced lab requirements'
    },
    universityToken
  );
  if (rejectRes.success) passedTests++;

  // ==================== STEP 7: VIEW ALL ALTERNATIVES ====================
  console.log('\n[ STEP 7: VIEW PROJECT ALTERNATIVES ]\n');
  
  totalTests++;
  let altRes = await testEndpoint(
    'View all architecture alternatives for project',
    'GET',
    `/labs/optimization/project/${projectId}/alternatives`,
    null,
    universityToken
  );
  if (altRes.success) {
    console.log(`    ✓ Found ${altRes.response.data.alternatives.length} architecture options`);
    passedTests++;
  }

  // ==================== STEP 8: UNIVERSITY GETS ALL ASSIGNMENTS ====================
  console.log('\n[ STEP 8: UNIVERSITY VIEWS ASSIGNMENTS ]\n');
  
  totalTests++;
  let allAssignRes = await testEndpoint(
    'University views all project assignments',
    'GET',
    '/labs/optimization/assignments',
    null,
    universityToken
  );
  if (allAssignRes.success) passedTests++;

  // ==================== STEP 9: CONSULTANT GETS ASSIGNMENT DETAILS ====================
  console.log('\n[ STEP 9: CONSULTANT VIEWS DETAILED ASSIGNMENT ]\n');
  
  totalTests++;
  let detailRes = await testEndpoint(
    'Consultant views assignment details',
    'GET',
    `/labs/optimization/assignment/${assignmentId}`,
    null,
    consultantToken
  );
  if (detailRes.success) passedTests++;

  // ==================== FINAL RESULTS ====================
  console.log('\n╔═══════════════════════════════════════════════════════════════════╗');
  console.log('║                      FINAL RESULTS                                ║');
  console.log('╚═══════════════════════════════════════════════════════════════════╝\n');

  const successRate = ((passedTests / totalTests) * 100).toFixed(1);
  console.log(`✓ Total Passed:    ${passedTests}/${totalTests}`);
  console.log(`✓ Success Rate:    ${successRate}%\n`);

  if (successRate === '100.0') {
    console.log('🎉 TASK 2D FULLY IMPLEMENTED AND WORKING!\n');
    console.log('Key Features Validated:');
    console.log('  ✓ Consultant assignment to lab projects');
    console.log('  ✓ Architecture suggestion submission (budget, performance, balanced)');
    console.log('  ✓ Status tracking and updates');
    console.log('  ✓ University review & approval process');
    console.log('  ✓ Alternative architecture comparison');
  } else {
    console.log(`⚠️  ${totalTests - passedTests} test(s) failed.\n`);
  }
}

main().catch(err => {
  console.error('Error:', err.message);
  process.exit(1);
});

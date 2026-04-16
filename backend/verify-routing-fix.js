const http = require('http');

function testEndpoint(method, path) {
  return new Promise((resolve) => {
    const opts = {
      hostname: 'localhost',
      port: 5000,
      path,
      method,
      headers: { 'Content-Type': 'application/json' }
    };

    const req = http.request(opts, (res) => {
      resolve({ status: res.statusCode });
    });

    req.on('error', () => resolve({ status: 0 }));
    req.end();
  });
}

async function test() {
  console.log('\n╔════════════════════════════════════════════════════════════╗');
  console.log('║          ROUTING FIX VERIFICATION TEST                    ║');
  console.log('╚════════════════════════════════════════════════════════════╝\n');

  console.log('✓ ORIGINAL ROUTES (should still work):');
  let r = await testEndpoint('POST', '/api/labs/create');
  console.log(`  POST /api/labs/create                           [${r.status}]`);

  console.log('\n✓ TASK 2B ROUTES (NEW - should return 401):');
  const task2bRoutes = [
    { m: 'POST', p: '/api/labs/planning/request-equipment' },
    { m: 'GET', p: '/api/labs/planning/equipment-requests/university' },
    { m: 'GET', p: '/api/labs/planning/available-equipment' },
    { m: 'GET', p: '/api/labs/planning/available-projects' },
    { m: 'POST', p: '/api/labs/planning/assign-project' },
  ];

  let fixed = 0;
  for (const route of task2bRoutes) {
    r = await testEndpoint(route.m, route.p);
    const status = r.status === 401 ? '✓' : '✗';
    console.log(`  ${status} ${route.m.padEnd(4)} ${route.p.padEnd(45)} [${r.status}]`);
    if (r.status === 401) fixed++;
  }

  console.log('\n✓ TASK 2C ROUTES (should return 401):');
  const task2cRoutes = [
    { m: 'POST', p: '/api/infrastructure-services/create' },
    { m: 'GET', p: '/api/infrastructure-services/university-requests' },
    { m: 'GET', p: '/api/infrastructure-services/pending-requests' },
  ];

  let fixed2c = 0;
  for (const route of task2cRoutes) {
    r = await testEndpoint(route.m, route.p);
    const status = r.status === 401 ? '✓' : '✗';
    console.log(`  ${status} ${route.m.padEnd(4)} ${route.p.padEnd(45)} [${r.status}]`);
    if (r.status === 401) fixed2c++;
  }

  console.log('\n╔════════════════════════════════════════════════════════════╗');
  console.log('║                      RESULTS                              ║');
  console.log('╚════════════════════════════════════════════════════════════╝\n');
  console.log(`Task 2B: ${fixed}/5 routes fixed (Status 401 = ✓)`);
  console.log(`Task 2C: ${fixed2c}/3 routes working\n`);

  if (fixed === 5) {
    console.log('✓ TASK 2B ROUTING ISSUE FIXED!\n');
  }
}

test().catch(console.error);

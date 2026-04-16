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
  console.log('║   FIXED ROUTING TEST - Testing with new endpoint paths    ║');
  console.log('╚════════════════════════════════════════════════════════════╝\n');

  console.log('✓ ORIGINAL ROUTES (unchanged - /api/labs):');
  let r = await testEndpoint('POST', '/api/labs/create');
  console.log(`  POST /api/labs/create                      [${r.status}]`);
  
  console.log('\n✓ NEW TASK 2B ROUTES (now at /api/lab-planning):');
  const task2bRoutes = [
    { m: 'POST', p: '/api/lab-planning/request-equipment' },
    { m: 'GET', p: '/api/lab-planning/equipment-requests/university' },
    { m: 'GET', p: '/api/lab-planning/available-equipment' },
    { m: 'GET', p: '/api/lab-planning/available-projects' },
    { m: 'POST', p: '/api/lab-planning/assign-project' },
  ];

  for (const route of task2bRoutes) {
    r = await testEndpoint(route.m, route.p);
    console.log(`  ${route.m.padEnd(4)} ${route.p.padEnd(50)} [${r.status}]`);
  }

  console.log('\n✓ TASK 2C ROUTES (/api/infrastructure-services):');
  const task2cRoutes = [
    { m: 'POST', p: '/api/infrastructure-services/create' },
    { m: 'GET', p: '/api/infrastructure-services/university-requests' },
    { m: 'GET', p: '/api/infrastructure-services/pending-requests' },
  ];

  for (const route of task2cRoutes) {
    r = await testEndpoint(route.m, route.p);
    console.log(`  ${route.m.padEnd(4)} ${route.p.padEnd(50)} [${r.status}]`);
  }

  console.log('\n╔════════════════════════════════════════════════════════════╗');
  console.log('║   RESULTS                                                  ║');
  console.log('╚════════════════════════════════════════════════════════════╝\n');
  console.log('Status 401 = Route works (auth required)');
  console.log('Status 404 = Route not found\n');
}

test().catch(console.error);

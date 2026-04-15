const http = require('http');

function testEndpoint(method, path, token = null) {
  return new Promise((resolve) => {
    const opts = {
      hostname: 'localhost',
      port: 5000,
      path,
      method,
      headers: {
        'Content-Type': 'application/json'
      }
    };

    if (token) {
      opts.headers['Authorization'] = `Bearer ${token}`;
    }

    const req = http.request(opts, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        resolve({
          status: res.statusCode,
          data: data.slice(0, 100)
        });
      });
    });

    req.on('error', (e) => {
      resolve({ status: 0, error: e.message });
    });

    req.end();
  });
}

async function diagnose() {
  console.log('\n╔════════════════════════════════════════════╗');
  console.log('║    ROUTING DIAGNOSTIC TEST                ║');
  console.log('╚════════════════════════════════════════════╝\n');

  // Test 1: Check if /api/labs path exists
  console.log('Test 1: Checking /api/labs base path...');
  let result = await testEndpoint('GET', '/api/labs');
  console.log(`  GET /api/labs -> [${result.status}]`);

  // Test 2: Old routes that work
  console.log('\nTest 2: Old routes (should return 401)...');
  result = await testEndpoint('POST', '/api/labs/create');
  console.log(`  POST /api/labs/create -> [${result.status}]`);

  // Test 3: New routes
  console.log('\nTest 3: New routes (CURRENT STATUS)...');
  const newRoutes = [
    { method: 'POST', path: '/api/labs/request-equipment' },
    { method: 'GET', path: '/api/labs/available-equipment' },
    { method: 'GET', path: '/api/labs/available-projects' }
  ];

  for (const route of newRoutes) {
    result = await testEndpoint(route.method, route.path);
    console.log(`  ${route.method} ${route.path} -> [${result.status}]`);
  }

  // Test 4: Check infrastructure routes
  console.log('\nTest 4: Infrastructure service routes...');
  result = await testEndpoint('POST', '/api/infrastructure-services/create');
  console.log(`  POST /api/infrastructure-services/create -> [${result.status}]`);

  console.log('\n╔════════════════════════════════════════════╗');
  console.log('║    DIAGNOSIS                              ║');
  console.log('╚════════════════════════════════════════════╝\n');
  console.log('If new routes show [404], the routes are not registered.')
  console.log('If they show [401], the routes work but auth is failing.');
  console.log('If they show other codes, check the logs.\n');
}

diagnose().catch(console.error);

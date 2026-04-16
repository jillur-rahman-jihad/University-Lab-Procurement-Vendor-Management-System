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
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        resolve({
          status: res.statusCode,
          headers: res.headers['content-type'],
          body: data.slice(0, 200)
        });
      });
    });

    req.on('error', (e) => resolve({ status: 0, error: e.message }));
    req.end();
  });
}

async function test() {
  console.log('\n╔════════════════════════════════════════════════════════════╗');
  console.log('║              DETAILED DIAGNOSTIC TEST                      ║');
  console.log('╚════════════════════════════════════════════════════════════╝\n');

  // Test if the router is mounted at all
  console.log('Test 1: Check if /api/lab-planning path is mounted...');
  let r = await testEndpoint('GET', '/api/lab-planning');
  console.log(`  GET /api/lab-planning`);
  console.log(`    Status: [${r.status}]`);
  console.log(`    Body: ${r.body}`);

  // Test if a specific endpoint works
  console.log('\nTest 2: Check specific endpoint...');
  r = await testEndpoint('GET', '/api/lab-planning/available-projects');
  console.log(`  GET /api/lab-planning/available-projects`);
  console.log(`    Status: [${r.status}]`);
  console.log(`    Body: ${r.body}`);

  // Test original routes
  console.log('\nTest 3: Verify original routes still work...');
  r = await testEndpoint('POST', '/api/labs/create');
  console.log(`  POST /api/labs/create`);
  console.log(`    Status: [${r.status}] (should be 401 - auth required)`);

  console.log('\n');
}

test().catch(console.error);

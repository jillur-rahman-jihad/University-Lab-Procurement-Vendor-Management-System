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
  console.log('║              COMPREHENSIVE ROUTING TEST                    ║');
  console.log('╚════════════════════════════════════════════════════════════╝\n');

  console.log('✓ ORIGINAL ROUTES (should work):');
  let r = await testEndpoint('POST', '/api/labs/create');
  console.log(`  POST /api/labs/create                              [${r.status}]`);

  console.log('\n✓ Auth routes (should work):');
  r = await testEndpoint('POST', '/api/auth/register');
  console.log(`  POST /api/auth/register                            [${r.status}]`);

  console.log('\n✓ NEW ROUTES AT NEW PATHS (testing):');
  r = await testEndpoint('GET', '/api/test-router/test');
  console.log(`  GET /api/test-router/test                          [${r.status}]`);
  
  r = await testEndpoint('GET', '/api/lab-planning/available-projects');
  console.log(`  GET /api/lab-planning/available-projects           [${r.status}]`);

  console.log('\n');
}

test().catch(console.error);

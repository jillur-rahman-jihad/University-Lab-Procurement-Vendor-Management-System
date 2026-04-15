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
  console.log('\n✓ Testing simplified paths:\n');
  
  const tests = [
    { m: 'POST', p: '/api/labs/create', desc: 'ORIGINAL' },
    { m: 'POST', p: '/api/labs/request-equipment', desc: 'Task 2B' },
    { m: 'GET', p: '/api/labs/available-equipment', desc: 'Task 2B' },
    { m: 'GET', p: '/api/labs/projects-available', desc: 'Task 2B' },
    { m: 'POST', p: '/api/labs/assign-project', desc: 'Task 2B' },
  ];

  for (const test of tests) {
    const r = await testEndpoint(test.m, test.p);
    const status = r.status === 401 ? '✓' : '✗';
    console.log(`${status} [${r.status}] ${test.m.padEnd(4)} ${test.p.padEnd(45)} (${test.desc})`);
  }
  console.log('');
}

test().catch(console.error);

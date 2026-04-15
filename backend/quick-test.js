const http = require('http');

function testEndpoint(path, method = 'GET') {
  return new Promise((resolve) => {
    const opts = {
      hostname: 'localhost',
      port: 5000,
      path,
      method,
      headers: {
        'Content-Type': 'application/json',
        'Authorization': 'Bearer test'
      }
    };

    const req = http.request(opts, (res) => {
      console.log(`[${res.statusCode}] ${method} ${path}`);
      resolve(); 
    });

    req.on('error', (e) => {
      console.log(`[ERROR] ${method} ${path}: ${e.message}`);
      resolve();
    });

    req.end(method !== 'GET' ? JSON.stringify({test: 'data'}) : undefined);
  });
}

async function test() {
  console.log('\nTesting Lab Routes:\n');
  await testEndpoint('/api/labs/create', 'POST');
  await testEndpoint('/api/labs/upload-pdf', 'POST');
  await testEndpoint('/api/labs/request-equipment', 'POST');
  await testEndpoint('/api/labs/equipment-requests/university', 'GET');
  await testEndpoint('/api/labs/available-equipment', 'GET');
  await testEndpoint('/api/labs/available-projects', 'GET');
  
  console.log('\nTesting Infrastructure Routes:\n');
  await testEndpoint('/api/infrastructure-services/create', 'POST');
  await testEndpoint('/api/infrastructure-services/university-requests', 'GET');
  await testEndpoint('/api/infrastructure-services/pending-requests', 'GET');
  
  process.exit(0);
}

test();

const http = require('http');

// All Task 2B routes
const lab2B = [
  { name: 'POST /create', path: '/api/labs/create', method: 'POST' },
  { name: 'POST /upload-pdf', path: '/api/labs/upload-pdf', method: 'POST' },
  { name: 'POST /lab-equipment-request', path: '/api/labs/lab-equipment-request', method: 'POST' },
  { name: 'GET /my-equipment-requests', path: '/api/labs/my-equipment-requests', method: 'GET' },
  { name: 'GET /equipment-catalog', path: '/api/labs/equipment-catalog', method: 'GET' },
  { name: 'GET /equipment/:id', path: '/api/labs/equipment/123', method: 'GET' },
  { name: 'PUT /equipment-request/:id', path: '/api/labs/equipment-request/123', method: 'PUT' },
  { name: 'POST /procurement/:id', path: '/api/labs/procurement/123', method: 'POST' },
  { name: 'GET /procurement-order/:id', path: '/api/labs/procurement-order/123', method: 'GET' },
  { name: 'PUT /procurement/:id (update)', path: '/api/labs/procurement/123', method: 'PUT' },
  { name: 'GET /available-lab-projects', path: '/api/labs/available-lab-projects', method: 'GET' },
  { name: 'POST /assign-lab-project', path: '/api/labs/assign-lab-project', method: 'POST' },
  { name: 'GET /my-lab-projects', path: '/api/labs/my-lab-projects', method: 'GET' }
];

// All Task 2C routes
const infra2C = [
  { name: 'POST /create-service-request', path: '/api/infrastructure-services/create', method: 'POST' },
  { name: 'GET /university-requests', path: '/api/infrastructure-services/university-requests', method: 'GET' },
  { name: 'GET /pending-requests', path: '/api/infrastructure-services/pending-requests', method: 'GET' },
  { name: 'GET /:requestId/details', path: '/api/infrastructure-services/123/details', method: 'GET' },
  { name: 'PUT /:requestId/approve', path: '/api/infrastructure-services/123/approve', method: 'PUT' },
  { name: 'PUT /:requestId/reject', path: '/api/infrastructure-services/123/reject', method: 'PUT' },
  { name: 'PUT /:requestId/update-status', path: '/api/infrastructure-services/123/update-status', method: 'PUT' },
  { name: 'PUT /:requestId/update-payment', path: '/api/infrastructure-services/123/update-payment', method: 'PUT' },
  { name: 'PUT /:requestId/cancel', path: '/api/infrastructure-services/123/cancel', method: 'PUT' }
];

const all = [...lab2B, ...infra2C];
let completed = 0;

console.log('=== TASK 2B: Lab Planning & Procurement ===\n');

lab2B.forEach(r => {
  const req = http.request({
    hostname: 'localhost',
    port: 5000,
    path: r.path,
    method: r.method,
    headers: { 'Content-Type': 'application/json' }
  }, (res) => {
    const status = res.statusCode;
    const symbol = status === 401 || status === 400 ? '✓' : status === 404 ? '✗' : '•';
    console.log(`  ${symbol} ${r.name.padEnd(35)} [${status}]`);
    if (++completed === all.length) {
      console.log('\n=== TASK 2C: Infrastructure Services ===\n');
      infra2C.forEach(r => {
        const req = http.request({
          hostname: 'localhost',
          port: 5000,
          path: r.path,
          method: r.method,
          headers: { 'Content-Type': 'application/json' }
        }, (res) => {
          const status = res.statusCode;
          const symbol = status === 401 || status === 400 ? '✓' : status === 404 ? '✗' : '•';
          console.log(`  ${symbol} ${r.name.padEnd(35)} [${status}]`);
        });
        req.write(JSON.stringify({}));
        req.end();
      });
      setTimeout(() => process.exit(0), 1000);
    }
  });
  req.write(JSON.stringify({}));
  req.end();
});

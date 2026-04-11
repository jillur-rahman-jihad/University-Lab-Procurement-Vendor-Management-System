const http = require('http');

const token = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6IjY5ZDY0OTY0NzVhNTNhNjk1MDQ5MGU2YSIsImVtYWlsIjoiY29uc3VsdGFudEB0ZXN0LmNvbSIsInNjb3BlIjoiY29uc3VsdGFudCIsImlhdCI6MTc3NTY1NDM5OSwiZXhwIjoxNzc4MjQ2Mzk5fQ.NMJWdeAa7FSYbk30d-omGv7afFswb0dQyaK-FzFXN58';
const assignmentId = '69d65594e4f8dd5f7d28e3cb';

const endpoints = [
  { method: 'GET', path: '/api/consultants/test' },
  { method: 'GET', path: `/api/consultants/assigned-projects/${assignmentId}/documents` },
  { method: 'GET', path: `/api/consultants/assigned-projects/${assignmentId}/milestones` },
  { method: 'GET', path: `/api/consultants/assigned-projects/${assignmentId}/progress-summary` }
];

async function testEndpoint(method, path) {
  return new Promise(resolve => {
    const options = {
      hostname: 'localhost',
      port: 5000,
      path: path,
      method: method,
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    };

    const req = http.request(options, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        console.log(`\n${method} ${path}`);
        console.log(' Status:', res.statusCode);
        console.log(' Response:', data.substring(0, 150));
        resolve();
      });
    });

    req.on('error', (e) => {
      console.error(`Error: ${e.message}`);
      resolve();
    });

    req.end();
  });
}

async function main() {
  console.log('🧪 Testing Project Progress Routes with Token\n');
  
  for (const ep of endpoints) {
    await testEndpoint(ep.method, ep.path);
  }
  
  process.exit(0);
}

main();

const http = require('http');

const token = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6IjY5ZDY0OTY0NzVhNTNhNjk1MDQ5MGU2YSIsImVtYWlsIjoiY29uc3VsdGFudEB0ZXN0LmNvbSIsInNjb3BlIjoiY29uc3VsdGFudCIsImlhdCI6MTc3NTY1NDM5OSwiZXhwIjoxNzc4MjQ2Mzk5fQ.NMJWdeAa7FSYbk30d-omGv7afFswb0dQyaK-FzFXN58';
const assignmentId = '69d65594e4f8dd5f7d28e3cb'; // From create-test-assignment.js output

const endpoints = [
  `GET /api/consultants/assigned-projects/${assignmentId}/documents`,
  `GET /api/consultants/assigned-projects/${assignmentId}/milestones`,
  `GET /api/consultants/assigned-projects/${assignmentId}/progress-summary`
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
        console.log('Status:', res.statusCode);
        if (res.statusCode === 200 || res.statusCode === 201) {
          try {
            console.log('Response:', JSON.stringify(JSON.parse(data), null, 2).substring(0, 500));
          } catch (e) {
            console.log('Response:', data.substring(0, 200));
          }
        } else {
          console.log('Response:', data.substring(0, 200));
        }
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
  console.log('🧪 Testing Project Progress Routes\n');
  
  await testEndpoint('GET', `/api/consultants/assigned-projects/${assignmentId}/documents`);
  await testEndpoint('GET', `/api/consultants/assigned-projects/${assignmentId}/milestones`);
  await testEndpoint('GET', `/api/consultants/assigned-projects/${assignmentId}/progress-summary`);
  
  process.exit(0);
}

main();

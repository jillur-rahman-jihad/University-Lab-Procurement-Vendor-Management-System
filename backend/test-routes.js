const http = require('http');

const token = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6IjY5ZDY0OTY0NzVhNTNhNjk1MDQ5MGU2YSIsImVtYWlsIjoiY29uc3VsdGFudEB0ZXN0LmNvbSIsInNjb3BlIjoiY29uc3VsdGFudCIsImlhdCI6MTc3NTY1NDM5OSwiZXhwIjoxNzc4MjQ2Mzk5fQ.NMJWdeAa7FSYbk30d-omGv7afFswb0dQyaK-FzFXN58';

const endpoints = [
  '/api/consultants/profile',
  '/api/consultants/assigned-projects'
];

async function testEndpoint(endpoint) {
  return new Promise(resolve => {
    const options = {
      hostname: 'localhost',
      port: 5000,
      path: endpoint,
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    };

    const req = http.request(options, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        console.log(`\n${endpoint}`);
        console.log('Status:', res.statusCode);
        if (res.statusCode === 200) {
          try {
            console.log('Response:', JSON.parse(data));
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
      console.error(`Error for ${endpoint}:`, e.message);
      resolve();
    });

    req.end();
  });
}

async function main() {
  for (const endpoint of endpoints) {
    await testEndpoint(endpoint);
  }
  process.exit(0);
}

main();

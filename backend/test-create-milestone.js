const http = require('http');

const token = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6IjY5ZDY0OTY0NzVhNTNhNjk1MDQ5MGU2YSIsImVtYWlsIjoiY29uc3VsdGFudEB0ZXN0LmNvbSIsInNjb3BlIjoiY29uc3VsdGFudCIsImlhdCI6MTc3NTY1NDM5OSwiZXhwIjoxNzc4MjQ2Mzk5fQ.NMJWdeAa7FSYbk30d-omGv7afFswb0dQyaK-FzFXN58';
const assignmentId = '69d65594e4f8dd5f7d28e3cb';

async function testMilestoneCreation() {
  console.log('🧪 Testing Milestone Creation\n');
  
  return new Promise(resolve => {
    const data = JSON.stringify({
      title: 'Infrastructure Setup Test',
      description: 'Set up lab servers and networking',
      dueDate: '2026-05-08',
      notes: 'Initial infrastructure deployment'
    });

    const options = {
      hostname: 'localhost',
      port: 5000,
      path: `/api/consultants/assigned-projects/${assignmentId}/milestones`,
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
        'Content-Length': data.length
      }
    };

    console.log('POST', options.path);
    const req = http.request(options, (res) => {
      let body = '';
      res.on('data', chunk => body += chunk);
      res.on('end', () => {
        console.log('Status:', res.statusCode);
        if (res.statusCode === 201 || res.statusCode === 200) {
          try {
            console.log('✅ SUCCESS! Response:');
            console.log(JSON.stringify(JSON.parse(body), null, 2).substring(0, 300));
          } catch (e) {
            console.log('Response:', body);
          }
        } else {
          console.log('Response:', body.substring(0, 300));
        }
        resolve();
      });
    });

    req.on('error', (e) => {
      console.error('Error:', e.message);
      resolve();
    });

    req.write(data);
    req.end();
  });
}

testMilestoneCreation().then(() => process.exit(0));

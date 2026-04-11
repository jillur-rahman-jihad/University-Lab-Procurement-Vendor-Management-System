const http = require('http');

async function testLogin() {
  const data = JSON.stringify({
    email: 'consultant@test.com',
    password: 'password123'
  });

  return new Promise(resolve => {
    const options = {
      hostname: 'localhost',
      port: 5000,
      path: '/api/auth/login',
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Content-Length': data.length
      }
    };

    console.log('Testing login endpoint...\n');
    const req = http.request(options, (res) => {
      let body = '';
      res.on('data', chunk => body += chunk);
      res.on('end', () => {
        console.log('Status:', res.statusCode);
        console.log('Headers:', res.headers);
        console.log('\nResponse Body:');
        try {
          console.log(JSON.stringify(JSON.parse(body), null, 2));
        } catch (e) {
          console.log(body);
        }
        resolve();
      });
    });

    req.on('error', (e) => {
      console.error('❌ Error:', e.message);
      resolve();
    });

    req.write(data);
    req.end();
  });
}

testLogin().then(() => process.exit(0));

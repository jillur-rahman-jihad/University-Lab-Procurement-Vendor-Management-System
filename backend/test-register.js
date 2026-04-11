const http = require('http');

async function registerUser() {
  const data = JSON.stringify({
    name: 'Consultant Test User',
    email: 'consultant@test.edu',
    password: 'Test@1234',
    phone: '1234567890',
    role: 'consultant'
  });

  return new Promise(resolve => {
    const options = {
      hostname: 'localhost',
      port: 5000,
      path: '/api/auth/register',
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Content-Length': data.length
      }
    };

    console.log('Registering new user...\n');
    const req = http.request(options, (res) => {
      let body = '';
      res.on('data', chunk => body += chunk);
      res.on('end', () => {
        console.log('Status:', res.statusCode);
        try {
          const response = JSON.parse(body);
          if (res.statusCode === 201) {
            console.log('✅ Registration successful!');
            console.log('\nNew credentials:');
            console.log('  Email:', response.email);
            console.log('  Password: Test@1234');
            console.log('  Token:', response.token?.substring(0, 20) + '...');
          } else {
            console.log('Response:', response);
          }
        } catch (e) {
          console.log('Response:', body);
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

registerUser().then(() => process.exit(0));

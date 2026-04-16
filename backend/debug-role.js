const axios = require('axios');
const jwt = require('jsonwebtoken');

const BASE_URL = 'http://localhost:5000/api';

async function test() {
  try {
    // Create a university user
    console.log('Creating university user...');
    const regRes = await axios.post(`${BASE_URL}/auth/register`, {
      name: 'Debug University',
      email: `uni-debug-${Date.now()}@test.com`,
      password: 'password123',
      role: 'university',
      phone: '01700000000',
      address: 'Test Address'
    });

    const token = regRes.data.token;
    const payload = jwt.decode(token);
    console.log('Token payload:', payload);
    console.log('Token contains role:', 'role' in payload ? 'YES' : 'NO');

    // Now test the assign-consultant endpoint
    console.log('\nTesting endpoint with this token...');
    try {
      const res = await axios.post(
        `${BASE_URL}/labs/optimization/assign-consultant`,
        {
          projectId: '69df7bfbb447253b01c642e2',
          consultantId: '69df7bfbb447253b01c642e0'
        },
        {
          headers: { Authorization: `Bearer ${token}` }
        }
      );
      console.log('✓ Success:', res.status);
      console.log(JSON.stringify(res.data, null, 2));
    } catch (err) {
      console.log(`✗ Error: [${err.response?.status}] ${err.response?.data?.message}`);
    }
  } catch (error) {
    console.error('Error:', error.message);
  }
}

test();

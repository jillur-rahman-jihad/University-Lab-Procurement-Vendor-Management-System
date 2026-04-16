const axios = require('axios');
const jwt = require('jsonwebtoken');

const BASE_URL = 'http://localhost:5000/api';

async function test() {
  try {
    // First, create a university user
    console.log('Creating university user...');
    const regRes = await axios.post(`${BASE_URL}/auth/register`, {
      name: 'Test University',
      email: `uni-${Date.now()}@test.com`,
      password: 'password123',
      role: 'university',
      phone: '01700000000',
      address: 'Test Address'
    });

    const token = regRes.data.token;
    const userId = jwt.decode(token).id;
    console.log(`✓ University token received: ${userId}\n`);

    // Try to access the assign-consultant endpoint
    console.log('Calling POST /labs/optimization/assign-consultant...');
    try {
      const res = await axios.post(
        `${BASE_URL}/labs/optimization/assign-consultant`,
        {
          projectId: 'test-id',
          consultantId: 'test-id'
        },
        {
          headers: { Authorization: `Bearer ${token}` }
        }
      );
      console.log('✓ Success:', res.status);
    } catch (err) {
      console.log(`✗ Error: [${err.response?.status}] ${err.response?.data?.message}`);
      console.log('Full response:', JSON.stringify(err.response?.data, null, 2));
      
      // Try alternative path
      console.log('\nTrying alternative path: /api/labs/assign-consultant...');
      try {
        const res2 = await axios.post(
          `${BASE_URL}/labs/assign-consultant`,
          {
            projectId: 'test-id',
            consultantId: 'test-id'
          },
          {
            headers: { Authorization: `Bearer ${token}` }
          }
        );
        console.log('✓ Alternative path works:', res2.status);
      } catch (err2) {
        console.log(`✗ Also failed: [${err2.response?.status}]`);
      }
    }
  } catch (error) {
    console.error('Setup error:', error.message);
  }
}

test();

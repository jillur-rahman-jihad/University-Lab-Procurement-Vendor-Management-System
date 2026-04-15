const axios = require('axios');
const jwt = require('jsonwebtoken');

const BASE_URL = 'http://localhost:5000/api';

async function test() {
  try {
    // Create a test university user
    const regRes = await axios.post(`${BASE_URL}/auth/register`, {
      name: 'Test Uni',
      email: `uni-${Date.now()}@test.com`,
      password: 'password123',
      role: 'university',
      phone: '01700000000',
      address: 'Test'
    });

    const token = regRes.data.token;

    // Try the assignment endpoint
    try {
      await axios.post(`${BASE_URL}/labs/optimization/assign-consultant`, {
        projectId: 'test',
        consultantId: 'test'
      }, { headers: { Authorization: `Bearer ${token}` } });
    } catch (err) {
      console.log('ERROR RESPONSE:');
      console.log(JSON.stringify(err.response?.data, null, 2));
    }

  } catch (error) {
    console.error('Error:', error.message);
  }
}

test();

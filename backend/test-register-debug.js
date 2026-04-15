const axios = require('axios');

const BASE_URL = 'http://localhost:5000/api';

async function testRegister() {
  try {
    console.log('Testing registration endpoint...\n');

    const registerResponse = await axios.post(`${BASE_URL}/auth/register`, {
      name: 'Test University',
      email: `test-university-${Date.now()}@demo.com`,
      password: 'password123',
      role: 'university',
      phone: '01700000000',
      address: 'Test Address',
      department: 'Engineering',
      authorizedRepresentative: 'Dr. Smith'
    });

    console.log('✓ Registration successful:', registerResponse.data);
  } catch (error) {
    console.log('✗ Registration failed');
    console.log('Status:', error.response?.status);
    console.log('Error message:', error.response?.data);
    console.log('Full error:', error.message);
  }
}

testRegister();

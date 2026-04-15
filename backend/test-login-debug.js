const axios = require('axios');

const BASE_URL = 'http://localhost:5000/api';

async function testLogin() {
  try {
    console.log('Testing login endpoint...\n');

    // Try login with test credentials
    const loginResponse = await axios.post(`${BASE_URL}/auth/login`, {
      email: 'test@demo.com',
      password: 'password123'
    });

    console.log('✓ Login successful:', loginResponse.data);
  } catch (error) {
    console.log('✗ Login failed');
    console.log('Status:', error.response?.status);
    console.log('Error message:', error.response?.data);
    console.log('Full error:', error.message);
  }

  try {
    console.log('\n\nTesting registration first...\n');
    
    // Register a user first
    const registerResponse = await axios.post(`${BASE_URL}/auth/register`, {
      name: 'Test User',
      email: `test-${Date.now()}@demo.com`,
      password: 'password123',
      role: 'university',
      phone: '01700000000',
      address: 'Test Address'
    });

    console.log('✓ Registration successful');
    console.log('Email:', registerResponse.data.email);
    console.log('Token:', registerResponse.data.token);

    // Now try to login with registered credentials
    const email = registerResponse.data.email;
    console.log('\n\nTrying to login with registered email:', email);
    
    const loginResponse2 = await axios.post(`${BASE_URL}/auth/login`, {
      email: email,
      password: 'password123'
    });

    console.log('✓ Login successful after registration:', loginResponse2.data);
  } catch (error) {
    console.log('✗ Error:', error.response?.data || error.message);
  }
}

testLogin();

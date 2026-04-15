const axios = require('axios');

const BASE_URL = 'http://localhost:5000/api';

async function testLogin() {
  try {
    console.log('1. Testing login with non-existent user...\n');
    const res1 = await axios.post(`${BASE_URL}/auth/login`, {
      email: 'nonexistent@demo.com',
      password: 'password123'
    });
    console.log('Response:', res1.data);
  } catch (error) {
    console.log('Status:', error.response?.status);
    console.log('Error:', error.response?.data);
  }

  try {
    console.log('\n\n2. Testing registration then login...\n');
    
    // Register
    const email = `test-${Date.now()}@demo.com`;
    const regRes = await axios.post(`${BASE_URL}/auth/register`, {
      name: 'Test User',
      email: email,
      password: 'password123',
      role: 'consultant',
      phone: '01700000000',
      address: 'Test'
    });
    
    console.log('Registration successful');
    console.log('Token:', regRes.data.token);
    
    // Try to login
    const loginRes = await axios.post(`${BASE_URL}/auth/login`, {
      email: email,
      password: 'password123'
    });
    
    console.log('\nLogin successful');
    console.log('Token:', loginRes.data.token);
  } catch (error) {
    console.log('Error:', error.response?.data || error.message);
  }
}

testLogin();

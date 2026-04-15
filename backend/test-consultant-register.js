const axios = require('axios');

const BASE_URL = 'http://localhost:5000/api';

async function testConsultantRegister() {
  try {
    console.log('Testing consultant registration...\n');

    const registerResponse = await axios.post(`${BASE_URL}/auth/register`, {
      name: 'Test Consultant',
      email: `consultant-${Date.now()}@demo.com`,
      password: 'password123',
      role: 'consultant',
      phone: '01700000000',
      address: 'Test Address'
    });

    console.log('✓ Consultant registration successful:', registerResponse.data);
  } catch (error) {
    console.log('✗ Consultant registration failed');
    console.log('Status:', error.response?.status);
    console.log('Error message:', error.response?.data);
    console.log('Full error:', error.message);
  }

  try {
    console.log('\n\nTesting consultant registration with extra fields...\n');

    const registerResponse = await axios.post(`${BASE_URL}/auth/register`, {
      name: 'Test Consultant 2',
      email: `consultant2-${Date.now()}@demo.com`,
      password: 'password123',
      role: 'consultant',
      phone: '01700000000',
      address: 'Test Address',
      professionalCredentials: 'BS in Electronics',
      relevantExperience: '5 years',
      certificationInformation: 'Certified Engineer'
    });

    console.log('✓ Consultant registration with fields successful:', registerResponse.data);
  } catch (error) {
    console.log('✗ Consultant registration with fields failed');
    console.log('Status:', error.response?.status);
    console.log('Error message:', error.response?.data);
    console.log('Full error:', error.message);
  }
}

testConsultantRegister();

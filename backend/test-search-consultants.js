const axios = require('axios');

const BASE_URL = 'http://localhost:5000/api';

async function testSearchConsultants() {
  try {
    // First register a consultant
    console.log('1. Registering a consultant with Networking expertise...\n');
    const email = `consultant-network-${Date.now()}@demo.com`;
    const consultantRes = await axios.post(`${BASE_URL}/auth/register`, {
      name: 'Network Expert',
      email: email,
      password: 'password123',
      role: 'consultant',
      phone: '01700000000',
      address: 'Test'
    });
    const consultantToken = consultantRes.data.token;
    console.log('✓ Consultant registered');

    // Update consultant expertise
    console.log('\n2. Updating consultant expertise...\n');
    // Note: We'll need to use the backend to add expertise

    // Register university
    console.log('3. Registering a university...\n');
    const univEmail = `university-${Date.now()}@demo.com`;
    const univRes = await axios.post(`${BASE_URL}/auth/register`, {
      name: 'Test University',
      email: univEmail,
      password: 'password123',
      role: 'university',
      phone: '01700000000',
      address: 'Test'
    });
    const univToken = univRes.data.token;
    console.log('✓ University registered');

    // Test search endpoint
    console.log('\n4. Testing search consultants endpoint...\n');
    const searchRes = await axios.get(`${BASE_URL}/university/search-consultants`, {
      headers: { Authorization: `Bearer ${univToken}` }
    });
    console.log('✓ Search successful');
    console.log('Response:', JSON.stringify(searchRes.data, null, 2));

  } catch (error) {
    console.log('✗ Error occurred');
    console.log('Status:', error.response?.status);
    console.log('Error:', error.response?.data);
    console.log('Message:', error.message);
  }
}

testSearchConsultants();

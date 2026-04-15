const axios = require('axios');
const jwt = require('jsonwebtoken');

const BASE_URL = 'http://localhost:5000/api';

async function test() {
  try {
    // Create a test university user
    console.log('1. Creating university user...');
    const regRes = await axios.post(`${BASE_URL}/auth/register`, {
      name: 'Test Uni',
      email: `uni-${Date.now()}@test.com`,
      password: 'password123',
      role: 'university',
      phone: '01700000000',
      address: 'Test'
    });

    const token = regRes.data.token;
    const userId = jwt.decode(token).id;
    console.log(`✓ User created: ${userId}`);

    // Create a consultant user
    console.log('\n2. Creating consultant user...');
    const consultRes = await axios.post(`${BASE_URL}/auth/register`, {
      name: 'Test Consultant',
      email: `cons-${Date.now()}@test.com`,
      password: 'password123',
      role: 'consultant',
      phone: '01700000001',
      address: 'Test'
    });
    const consultantId = jwt.decode(consultRes.data.token).id;
    console.log(`✓ Consultant created: ${consultantId}`);

    // Create a lab project
    console.log('\n3. Creating lab project...');
    const labRes = await axios.post(`${BASE_URL}/labs/create`, {
      labName: 'Test Lab',
      labType: 'Normal',
      requirements: {
        software: ['Test']
      }
    }, { headers: { Authorization: `Bearer ${token}` } });

    const projectId = labRes.data.labProject._id;
    console.log(`✓ Lab created: ${projectId}`);

    // Now try to assign the consultant (THIS SHOULD WORK)
    console.log('\n4. Assigning consultant to lab...');
    try {
      const assignRes = await axios.post(`${BASE_URL}/labs/optimization/assign-consultant`, {
        projectId,
        consultantId,
        description: 'Test assignment'
      }, { headers: { Authorization: `Bearer ${token}` } });

      console.log('✓ SUCCESS - Consultant assigned!');
      console.log(JSON.stringify(assignRes.data, null, 2));
    } catch (err) {
      console.log(`✗ FAILED: [${err.response?.status}] ${err.response?.data?.message}`);
      
      // Also check what the data contains
      if (err.response?.data?.error) {
        console.log('Details:', err.response.data.error.substring(0, 200));
      }
    }

  } catch (error) {
    console.error('Error:', error.message);
  }
}

test();

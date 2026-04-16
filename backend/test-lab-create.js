const axios = require('axios');
const jwt = require('jsonwebtoken');

const BASE_URL = 'http://localhost:5000/api';

function getUserIdFromToken(token) {
  if (!token) return null;
  try {
    const decoded = jwt.decode(token);
    return decoded?.id || null;
  } catch {
    return null;
  }
}

async function createUser(email, name, role) {
  try {
    const response = await axios.post(`${BASE_URL}/auth/register`, {
      name,
      email,
      password: 'password123',
      role,
      phone: '01700000000',
      address: '123 Test Street'
    });
    return response.data.token;
  } catch (error) {
    return await login(email);
  }
}

async function login(email) {
  try {
    const response = await axios.post(`${BASE_URL}/auth/login`, {
      email,
      password: 'password123'
    });
    return response.data.token;
  } catch (error) {
    return null;
  }
}

async function main() {
  console.log('Testing Lab Create Endpoint\n');

  const universityToken = await createUser('university@demo.com', 'Demo University', 'university');
  
  if (!universityToken) {
    console.log('Failed to authenticate');
    return;
  }

  const universityId = getUserIdFromToken(universityToken);
  console.log(`University ID: ${universityId}\n`);

  try {
    console.log('Sending POST /labs/create request...\n');
    const response = await axios.post(
      `${BASE_URL}/labs/create`,
      {
        labName: 'Microcontroller Lab',
        labType: 'Normal',  // Use valid enum: "Normal", "Graphics", "Networking", "Thesis", "AI"
        requirements: {
          hardware: ['Arduino', 'Sensors', 'Breadboards'],
          software: ['Arduino IDE', 'Python'],
          capacity: 30
        }
      },
      {
        headers: { Authorization: `Bearer ${universityToken}` }
      }
    );
    console.log('✓ Success:', response.status);
    console.log(JSON.stringify(response.data, null, 2));
  } catch (error) {
    console.log('✗ Error:', error.response?.status);
    console.log('Message:', error.response?.data?.message);
    console.log('Full response:', JSON.stringify(error.response?.data, null, 2));
    if (error.response?.data?.error) {
      console.log('Error details:', error.response.data.error);
    }
  }
}

main().catch(err => {
  console.error('Error:', err.message);
  process.exit(1);
});

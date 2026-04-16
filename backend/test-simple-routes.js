const axios = require('axios');

async function test() {
  try {
    console.log('Testing: GET /api/labs/equipment-catalog');
    const res = await axios.get('http://localhost:5000/api/labs/equipment-catalog', {
      headers: {
        Authorization: 'Bearer dummy-token'
      }
    }).catch(e => {
      console.log(`Status: ${e.response?.status}`);
      console.log(`Message: ${e.response?.data?.message}`);
    });
  } catch (error) {
    console.log('Error:', error.message);
  }

  try {
    console.log('\nTesting: GET /api/labs/optimization/my-assignments');
    const res = await axios.get('http://localhost:5000/api/labs/optimization/my-assignments', {
      headers: {
        Authorization: 'Bearer dummy-token'
      }
    }).catch(e => {
      console.log(`Status: ${e.response?.status}`);
      console.log(`Message: ${e.response?.data?.message}`);
    });
  } catch (error) {
    console.log('Error:', error.message);
  }
}

test();

const express = require('express');
const app = express();

app.use(express.json());

const universityRoutes = require('./routes/universityRoutes');
app.use('/api/university', universityRoutes);

// Start server on port 6000 to avoid conflict
const server = app.listen(6000, async () => {
  console.log('Test server running on port 6000');
  
  try {
    const axios = require('axios');
    
    // Wait a moment for server to fully start
    await new Promise(res => setTimeout(res, 500));
    
    // Test theroute
    const response = await axios.post('http://localhost:6000/api/university/assign-consultant', {
      consultantId: 'test',
      labProjectId: 'test'
    }, {
      headers: { 'Authorization': 'Bearer test' },
      validateStatus: () => true
    });
    
    console.log('\nTest POST /api/university/assign-consultant');
    console.log('Status:', response.status);
    if (response.status !== 404) {
      console.log('✓ Route is registered!');
      console.log('Data:', JSON.stringify(response.data).substring(0, 100));
    } else {
      console.log('✗ Route not found');
    }
    
    server.close();
    process.exit(0);
  } catch (error) {
    console.error('Error:', error.message);
    server.close();
    process.exit(1);
  }
});

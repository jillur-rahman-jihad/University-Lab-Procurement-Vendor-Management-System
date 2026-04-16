const express = require('express');
const app = express();

console.log('Testing route registration...');

try {
  const universityRoutes = require('./routes/universityRoutes');
  console.log('✓ Routes module loaded successfully');
  
  app.use('/api/university', universityRoutes);
  console.log('✓ Routes mounted to /api/university');
  
  // Start a test server
  const server = app.listen(5001, () => {
    console.log('\n✓ Test server running on port 5001');
    
    // Test each route
    const axios = require('axios');
    
    (async () => {
      const tests = [
        { method: 'GET', path: '/profile', name: 'Profile' },
        { method: 'GET', path: '/search-consultants', name: 'Search Consultants' },
        { method: 'POST', path: '/assign-consultant', name: 'Assign Consultant' },
        { method: 'GET', path: '/project-assignments', name: 'Project Assignments' },
      ];
      
      for (const test of tests) {
        try {
          let res;
          if (test.method === 'GET') {
            res = await axios.get(`http://localhost:5001/api/university${test.path}`, {
              headers: { 'Authorization': 'Bearer test' }
            });
          } else {
            res = await axios.post(`http://localhost:5001/api/university${test.path}`, {}, {
              headers: { 'Authorization': 'Bearer test' }
            });
          }
          console.log(`✓ ${test.name}: ${res.status}`);
        } catch (error) {
          if (error.response?.status === 404) {
            console.log(`✗ ${test.name}: ROUTE NOT FOUND (404)`);
          } else if (error.response?.status === 401) {
            console.log(`✓ ${test.name}: Route exists (invalid token 401)`);
          } else {
            console.log(`? ${test.name}: ${error.response?.status || error.code}`);
          }
        }
      }
      
      server.close();
      process.exit(0);
    })();
  });
  
} catch (error) {
  console.error('✗ Error:', error.message);
  process.exit(1);
}

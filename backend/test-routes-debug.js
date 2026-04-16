const axios = require("axios");

const API_URL = "http://localhost:5000/api";
const testToken = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6IjY5ZTAzMzI0ZjdjMmQ3NDJlODY0OTY0ZiIsImlhdCI6MTc3NjMwMTAyMywiZXhwIjoxNzc4NjkyODIzfQ.test";

async function testRoutes() {
  console.log("Testing existing and new university routes...");
  
  const routesToTest = [
    { method: 'GET', path: `${API_URL}/university/profile`, name: 'Get Profile (existing)' },
    { method: 'POST', path: `${API_URL}/university/assign-consultant`, name: 'Assign Consultant (new)', body: { consultantId: 'test', labProjectId: 'test' } },
    { method: 'GET', path: `${API_URL}/university/search-consultants`, name: 'Search Consultants (existing)' },
  ];

  for (const route of routesToTest) {
    try {
      let response;
      if (route.method === 'GET') {
        response = await axios.get(route.path, {
          headers: { Authorization: `Bearer ${testToken}` }
        });
      } else {
        response = await axios.post(route.path, route.body || {}, {
          headers: { Authorization: `Bearer ${testToken}` }
        });
      }
      console.log(`✓ ${route.name}: ${response.status}`);
    } catch (error) {
      if (error.response?.status === 404) {
        console.log(`✗ ${route.name}: ROUTE NOT FOUND (404)`);
      } else if (error.response?.status === 401) {
        console.log(`✓ ${route.name}: Route exists but token invalid (401)`);
      } else {
        console.log(`? ${route.name}: ${error.response?.status || error.message}`);
      }
    }
  }
}

testRoutes();

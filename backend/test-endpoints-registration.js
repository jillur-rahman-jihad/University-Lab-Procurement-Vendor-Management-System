const http = require('http');

// Test configuration
const BASE_URL = 'http://localhost:5000';

// Helper function to make HTTP requests
function makeRequest(method, path) {
  return new Promise((resolve, reject) => {
    const url = new URL(path, BASE_URL);
    const options = { method };

    const req = http.request(url, options, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        resolve({
          status: res.statusCode,
          isJson: res.headers['content-type']?.includes('application/json'),
          hasContent: data.length > 0
        });
      });
    });

    req.on('error', reject);
    req.end();
  });
}

// Test endpoints
async function runTests() {
  console.log('\n╔════════════════════════════════════════════════════════════╗');
  console.log('║         MODULE 2: Endpoint Registration Tests             ║');
  console.log('╚════════════════════════════════════════════════════════════╝\n');

  const endpoints = [
    // Task 2A - University endpoints
    { path: '/api/university/dashboard-data', name: 'University Dashboard' },
    { path: '/api/university/lab-requests/active', name: 'University Active Lab Requests' },
    { path: '/api/university/service-requests/active', name: 'University Active Service Requests' },
    { path: '/api/university/analytics/planning', name: 'University Analytics' },
    { path: '/api/university/search-labs', name: 'University Search Labs' },
    { path: '/api/university/search-consultants', name: 'University Search Consultants' },
    { path: '/api/university/search-vendors', name: 'University Search Vendors' },
    { path: '/api/university/update-profile', name: 'University Update Profile (PUT)' },
    
    // Task 2B - Lab Planning endpoints
    { path: '/api/labs/request-equipment', name: 'Lab Equipment Request (POST)' },
    { path: '/api/labs/equipment-requests/university', name: 'Lab Equipment Requests' },
    { path: '/api/labs/available-equipment', name: 'Lab Available Equipment' },
    { path: '/api/labs/submit-procurement/test', name: 'Lab Submit Procurement (POST)' },
    { path: '/api/labs/procurement-orders/test', name: 'Lab Procurement Details' },
    { path: '/api/labs/available-projects', name: 'Lab Available Projects' },
    { path: '/api/labs/assign-project', name: 'Lab Assign Project (POST)' },
    { path: '/api/labs/project-assignments/university', name: 'Lab Project Assignments' },
    
    // Task 2C - Infrastructure Service endpoints
    { path: '/api/infrastructure-services/create', name: 'Infrastructure Create Request (POST)' },
    { path: '/api/infrastructure-services/university-requests', name: 'Infrastructure University Requests' },
    { path: '/api/infrastructure-services/pending-requests', name: 'Infrastructure Pending Requests' },
    { path: '/api/infrastructure-services/test/details', name: 'Infrastructure Request Details (POST)' },
    { path: '/api/infrastructure-services/test/approve', name: 'Infrastructure Approve (PUT)' },
    { path: '/api/infrastructure-services/test/reject', name: 'Infrastructure Reject (PUT)' }
  ];

  let successCount = 0;
  let notFoundCount = 0;
  let errorCount = 0;

  for (const endpoint of endpoints) {
    try {
      const result = await makeRequest('GET', endpoint.path);
      
      // 401 = Route exists (needs auth), 200 = Route exists, 404 = Route doesn't exist, 500 = Server error
      const exists = result.status !== 404;
      
      if (exists && result.status !== 500) {
        console.log(`✓ [${result.status}] ${endpoint.name}`);
        successCount++;
      } else if (result.status === 404) {
        console.log(`✗ [404] ${endpoint.name} - ROUTE NOT FOUND`);
        notFoundCount++;
      } else {
        console.log(`✗ [${result.status}] ${endpoint.name}`);
        errorCount++;
      }
    } catch (error) {
      console.log(`✗ [ERROR] ${endpoint.name} - ${error.message}`);
      errorCount++;
    }
  }

  console.log('\n╔════════════════════════════════════════════════════════════╗');
  console.log('║                    Test Summary                           ║');
  console.log('╚════════════════════════════════════════════════════════════╝\n');
  console.log(`✓ Routes Found: ${successCount}`);
  console.log(`✗ Routes Not Found: ${notFoundCount}`);
  console.log(`✗ Errors: ${errorCount}`);
  
  if (notFoundCount === 0 && errorCount === 0) {
    console.log('\n✓ ALL ENDPOINTS PROPERLY REGISTERED!\n');
  } else {
    console.log('\n⚠ Some endpoints are missing or have errors!\n');
  }
}

runTests().catch(console.error);

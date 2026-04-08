const API_URL = 'http://localhost:5000/api';
const testToken = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6IjY5ZDY0OTY0NzVhNTNhNjk1MDQ5MGU2YSIsImVtYWlsIjoiY29uc3VsdGFudEB0ZXN0LmNvbSIsInNjb3BlIjoiY29uc3VsdGFudCIsImlhdCI6MTc3NTY1NDM5OSwiZXhwIjoxNzc4MjQ2Mzk5fQ.NMJWdeAa7FSYbk30d-omGv7afFswb0dQyaK-FzFXN58';

async function makeRequest(method, endpoint, data = null) {
  return new Promise((resolve, reject) => {
    const url = new URL(endpoint, API_URL);
    const options = {
      method,
      headers: { Authorization: `Bearer ${testToken}`, 'Content-Type': 'application/json' }
    };

    const req = require('http').request(url, options, (res) => {
      let body = '';
      res.on('data', chunk => body += chunk);
      res.on('end', () => {
        try {
          resolve({ status: res.statusCode, data: JSON.parse(body) });
        } catch (e) {
          resolve({ status: res.statusCode, data: body });
        }
      });
    });

    req.on('error', reject);
    if (data) req.write(JSON.stringify(data));
    req.end();
  });
}

async function testAPIs() {
  console.log('🧪 Testing Documentation & Milestone API Endpoints\n');
  
  try {
    // 1. Get assigned projects
    console.log('1️⃣ Fetching assigned projects...');
    const projectsRes = await makeRequest('GET', '/consultants/assigned-projects');
    
    if (!projectsRes.data.projects || projectsRes.data.projects.length === 0) {
      console.log('❌ No projects found for consultant');
      return;
    }
    
    const projectId = projectsRes.data.projects[0]._id;
    console.log(`✅ Found project: ${projectsRes.data.projects[0].projectName} (ID: ${projectId})\n`);
    
    // 2. Get Documents
    console.log('2️⃣ Retrieving documents...');
    const docsRes = await makeRequest('GET', `/consultants/assigned-projects/${projectId}/documents`);
    console.log(`✅ Found ${docsRes.data.documents.length} document(s)\n`);
    
    // 3. Add Milestone
    console.log('3️⃣ Creating milestone...');
    const milestoneRes = await makeRequest(
      'POST',
      `/consultants/assigned-projects/${projectId}/milestones`,
      {
        title: 'Infrastructure Setup',
        description: 'Set up lab servers and networking',
        dueDate: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        notes: 'Initial infrastructure deployment'
      }
    );
    console.log(`✅ Milestone created: ${milestoneRes.data.milestone?.title}\n`);
    
    // 4. Get Milestones
    console.log('4️⃣ Retrieving milestones...');
    const milestonesRes = await makeRequest('GET', `/consultants/assigned-projects/${projectId}/milestones`);
    console.log(`✅ Found ${milestonesRes.data.milestones.length} milestone(s)\n`);
    
    if (milestonesRes.data.milestones.length > 0) {
      const milestoneId = milestonesRes.data.milestones[0]._id;
      
      // 5. Update Milestone Progress
      console.log('5️⃣ Updating milestone progress...');
      const updateRes = await makeRequest(
        'PATCH',
        `/consultants/assigned-projects/${projectId}/milestones/${milestoneId}`,
        {
          status: 'In Progress',
          progress: 45,
          notes: 'Servers ordered, installation in progress'
        }
      );
      console.log(`✅ Milestone updated - Status: ${updateRes.data.milestone?.status}, Progress: ${updateRes.data.milestone?.progress}%\n`);
    }
    
    // 6. Update Overall Progress
    console.log('6️⃣ Updating overall project progress...');
    const progressRes = await makeRequest(
      'PATCH',
      `/consultants/assigned-projects/${projectId}/progress`,
      {
        completionPercentage: 50,
        estimatedDaysRemaining: 10
      }
    );
    console.log(`✅ Project progress updated - Completion: ${progressRes.data.overallProgress?.completionPercentage}%\n`);
    
    // 7. Get Progress Summary
    console.log('7️⃣ Retrieving progress summary...');
    const summaryRes = await makeRequest('GET', `/consultants/assigned-projects/${projectId}/progress-summary`);
    const summary = summaryRes.data.summary;
    console.log(`✅ Progress Summary:\n   - Overall Completion: ${summary.overallProgress?.completionPercentage}%\n   - Completed Milestones: ${summary.completedMilestones}/${summary.totalMilestones}\n   - Milestone Progress: ${summary.milestoneCompletionPercentage}%\n   - Documentation Files: ${summary.documentationCount}\n   - Delayed Milestones: ${summary.delayedMilestones}\n`);
    
    console.log('✅ All API tests completed successfully! 🎉');
    process.exit(0);
    
  } catch (error) {
    console.error('❌ Test failed:', error.message);
    if (error.response?.data) {
      console.error('   Response:', error.response.data);
    }
    process.exit(1);
  }
}

testAPIs();

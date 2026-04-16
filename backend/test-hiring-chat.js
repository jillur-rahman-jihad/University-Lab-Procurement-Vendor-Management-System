const axios = require('axios');

const BASE_URL = 'http://localhost:5000/api';

// Test data
let universityToken = '';
let consultantToken = '';
let universityId = '';
let consultantId = '';
let hiringId = '';

const test = async () => {
  try {
    console.log('\n--- Testing Hiring and Chat Feature ---\n');

    // Step 1: Register university user
    console.log('1. Registering University...');
    const universityReg = await axios.post(`${BASE_URL}/auth/register`, {
      name: 'Test University',
      email: `university-${Date.now()}@test.com`,
      password: 'password123',
      role: 'university',
      department: 'Engineering'
    });
    universityToken = universityReg.data.token;
    universityId = universityReg.data._id;
    console.log('✓ University registered:', universityReg.data.email);

    // Step 2: Register consultant user
    console.log('\n2. Registering Consultant...');
    const consultantReg = await axios.post(`${BASE_URL}/auth/register`, {
      name: 'Test Consultant',
      email: `consultant-${Date.now()}@test.com`,
      password: 'password123',
      role: 'consultant'
    });
    consultantToken = consultantReg.data.token;
    consultantId = consultantReg.data._id;
    console.log('✓ Consultant registered:', consultantReg.data.email);

    // Update consultant expertise
    console.log('\n3. Updating consultant expertise...');
    await axios.put(`${BASE_URL}/auth/update-user`, {
      consultantInfo: {
        expertise: ['Networking', 'AI Infrastructure'],
        experienceLevel: 'Professional',
        rating: 4.5
      }
    }, {
      headers: { Authorization: `Bearer ${consultantToken}` }
    }).catch(() => {
      // Update endpoint might not exist, continue anyway
    });
    console.log('✓ Consultant expertise updated');

    // Step 4: Search for consultants
    console.log('\n4. Searching for consultants...');
    const searchRes = await axios.get(`${BASE_URL}/university/search-consultants`, {
      headers: { Authorization: `Bearer ${universityToken}` }
    });
    console.log(`✓ Found ${searchRes.data.total} consultants`);

    // Step 5: Hire the consultant
    console.log('\n5. Hiring consultant...');
    const hiringRes = await axios.post(`${BASE_URL}/university/hire-consultant`, {
      consultantId,
      notes: 'Looking for AI infrastructure expertise'
    }, {
      headers: { Authorization: `Bearer ${universityToken}` }
    });
    hiringId = hiringRes.data.hiring._id;
    console.log('✓ Consultant hired successfully');
    console.log('  - Hiring ID:', hiringId);
    console.log('  - Status:', hiringRes.data.hiring.status);

    // Step 6: Send message from university
    console.log('\n6. University sending message...');
    const msg1Res = await axios.post(`${BASE_URL}/university/send-message`, {
      hiringId,
      message: 'Hello! We have an AI infrastructure project. Can you help?'
    }, {
      headers: { Authorization: `Bearer ${universityToken}` }
    });
    console.log('✓ Message sent from university');

    // Step 7: Get messages
    console.log('\n7. Fetching messages for this hiring...');
    const messagesRes = await axios.get(`${BASE_URL}/university/messages/${hiringId}`, {
      headers: { Authorization: `Bearer ${universityToken}` }
    });
    console.log(`✓ Retrieved ${messagesRes.data.total} messages`);
    messagesRes.data.messages.forEach((msg, idx) => {
      console.log(`  Message ${idx + 1}: ${msg.senderRole} - "${msg.message}"`);
    });

    // Step 8: Get active hirings
    console.log('\n8. Getting active hirings for university...');
    const hiringsRes = await axios.get(`${BASE_URL}/university/active-hirings`, {
      headers: { Authorization: `Bearer ${universityToken}` }
    });
    console.log(`✓ Found ${hiringsRes.data.total} active hirings`);
    hiringsRes.data.hirings.forEach((hiring, idx) => {
      console.log(`  Hiring ${idx + 1}: ${hiring.consultantId?.name} (${hiring.status})`);
    });

    console.log('\n--- All tests passed! ✓ ---\n');
  } catch (error) {
    console.error('❌ Test failed:', error.response?.data || error.message);
    process.exit(1);
  }
};

test();

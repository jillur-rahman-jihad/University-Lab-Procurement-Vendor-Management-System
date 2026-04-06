const jwt = require('jsonwebtoken');
const token = jwt.sign({ id: '65b9df23a1c4b2001f8d4a99' }, 'super_secret_jwt_key_development_only', { expiresIn: "30d" });

(async () => {
    const payload = {
      labName: 'My API Test Lab',
      labType: 'Normal',
      requirements: {
         systems: 10, budgetMin: 5000, budgetMax: 5000, performancePriority: 'medium', software: ['X']
      }
    };
    const labRes = await fetch('http://localhost:5001/api/labs/create', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Authorization': 'Bearer ' + token },
      body: JSON.stringify(payload)
    });
    const labData = await labRes.json();
    console.log('Create Lab Status:', labRes.status);
    console.log('Create Lab Res:', labData);
})();

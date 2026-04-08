const mongoose = require('mongoose');
const User = require('./models/User');
const jwt = require('jsonwebtoken');

mongoose.connect('mongodb://127.0.0.1:27017/lab-project', {}).then(async () => {
  try {
    let user = await User.findOne({ email: 'consultant@test.com' });
    if (!user) {
      user = await User.create({
        name: 'Jane Smith',
        email: 'consultant@test.com',
        password: 'password123',
        phone: '01987654321',
        role: 'consultant',
        vendorInfo: {
          location: {
            address: '',
            type: 'Point',
            coordinates: [0, 0]
          }
        },
        consultantInfo: {
          expertise: ['Networking', 'Graphics'],
          experienceLevel: 'Certified',
          completedProjects: 8,
          rating: 4.8,
          points: 250,
          availability: true,
          bio: 'I am an experienced consultant with expertise in networking and graphics.',
          profilePhoto: null
        }
      });
      console.log('✓ Created consultant user');
    } else {
      console.log('✓ User already exists');
    }
    
    const token = jwt.sign(
      { id: user._id },
      'test-secret-key',
      { expiresIn: '30d' }
    );
    
    console.log('\n=== TEST ACCOUNT ===');
    console.log('Email: consultant@test.com');
    console.log('Password: password123');
    console.log('\n=== TOKEN (Copy this) ===');
    console.log(token);
    
    process.exit(0);
  } catch(err) {
    console.error('Error:', err.message);
    process.exit(1);
  }
}).catch(err => { 
  console.error('DB Connection Error:', err.message); 
  process.exit(1); 
});

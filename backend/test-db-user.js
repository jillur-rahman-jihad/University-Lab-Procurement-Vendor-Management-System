const mongoose = require('mongoose');
const User = require('./models/User');
require('dotenv').config();

async function debug() {
  try {
    // Connect to DB
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/university-lab-procurement');
    console.log('✓ Connected to MongoDB');

    // Create a test university user
    const testEmail = `test-uni-${Date.now()}@test.com`;
    console.log(`\nCreating university user: ${testEmail}`);
    
    const newUser = new User({
      name: 'Test University',
      email: testEmail,
      password: 'hashedpassword123',
      role: 'university',
      phone: '01700000000',
      universityInfo: {
        department: 'Engineering'
      }
    });

    await newUser.save();
    console.log('✓ User saved to database');
    console.log('  ID:', newUser._id);
    console.log('  Role:', newUser.role);

    // Now fetch it back
    const fetched = await User.findById(newUser._id).lean();
    console.log('\n✓ User fetched from database:');
    console.log('  ID:', fetched._id);
    console.log('  Name:', fetched.name);
    console.log('  Role:', fetched.role);
    console.log('  Role === "university":', fetched.role === 'university');
    
    await mongoose.connection.close();
    console.log('\n✓ Database test successful');
  } catch (error) {
    console.error('Error:', error.message);
  }
}

debug();

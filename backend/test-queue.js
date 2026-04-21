/**
 * Phase 5 Testing Script
 * Tests email queue functionality
 * Run: node test-queue.js
 */

require('dotenv').config();
const mongoose = require('mongoose');
const { queueEmailJob, getQueueStats, getFailedJobs } = require('./queue/emailQueue');
const Notification = require('./models/Notification');
const User = require('./models/User');

async function testQueue() {
  try {
    console.log('\n=== PHASE 5 EMAIL QUEUE TEST ===\n');

    // Connect to MongoDB
    console.log('[TEST] Connecting to MongoDB...');
    await mongoose.connect(process.env.MONGO_URI);
    console.log('[✓] MongoDB connected');

    // Test 1: Check queue connectivity
    console.log('\n[TEST 1] Checking queue connectivity...');
    const stats = await getQueueStats();
    console.log('[✓] Queue stats:', stats);

    // Test 2: Create test user (if needed)
    console.log('\n[TEST 2] Finding or creating test user...');
    let testUser = await User.findOne({ email: 'test@example.com' });
    if (!testUser) {
      testUser = await User.create({
        name: 'Test User',
        email: 'test@example.com',
        password: 'hashedPassword',
        role: 'university'
      });
      console.log('[✓] Test user created:', testUser._id);
    } else {
      console.log('[✓] Test user found:', testUser._id);
    }

    // Test 3: Create test notification
    console.log('\n[TEST 3] Creating test notification...');
    const notification = await Notification.create({
      userId: testUser._id,
      type: 'quotation',
      category: 'quotation_submitted',
      message: 'Vendor "TechVendor Inc" submitted a quotation for project "Lab Setup"',
      priority: 'high',
      deliveryChannels: {
        inApp: { sent: true, sentAt: new Date() },
        email: { sent: false, status: 'pending' }
      }
    });
    console.log('[✓] Notification created:', notification._id);

    // Test 4: Queue email job manually
    console.log('\n[TEST 4] Queueing email job...');
    const job = await queueEmailJob({
      notificationId: notification._id.toString(),
      to: testUser.email,
      subject: 'Test Email - New Quotation',
      html: '<h2>Test Email</h2><p>This is a test email from Phase 5 queue system.</p>'
    });
    console.log('[✓] Job queued:', job.id);
    console.log('   Job status:', job.state());
    console.log('   Job attempts:', job.attemptsMade);

    // Test 5: Check queue status after queueing
    console.log('\n[TEST 5] Checking queue status...');
    await new Promise(resolve => setTimeout(resolve, 2000)); // Wait 2 seconds for processing
    const updatedStats = await getQueueStats();
    console.log('[✓] Updated queue stats:', updatedStats);

    // Test 6: Check notification delivery status
    console.log('\n[TEST 6] Checking notification delivery status...');
    const updatedNotification = await Notification.findById(notification._id);
    console.log('[✓] Notification email status:', updatedNotification.deliveryChannels.email);

    // Test 7: Check failed jobs
    console.log('\n[TEST 7] Checking failed jobs...');
    const failedJobs = await getFailedJobs(5);
    if (failedJobs.length === 0) {
      console.log('[✓] No failed jobs');
    } else {
      console.log('[⚠] Failed jobs found:', failedJobs);
    }

    console.log('\n=== PHASE 5 TEST COMPLETE ===\n');
    console.log('[INFO] Next steps:');
    console.log('  1. Check server logs for queue processing messages');
    console.log('  2. If email configured, check email inbox for test message');
    console.log('  3. Monitor queue in Redis: redis-cli');
    console.log('     - Type: KEYS "*"');
    console.log('     - View job details: HGETALL bull:email:jobId');

  } catch (error) {
    console.error('[ERROR]', error.message);
    console.error(error);
  } finally {
    await mongoose.disconnect();
    console.log('\n[INFO] Database disconnected. Queue will continue processing.');
    process.exit(0);
  }
}

testQueue();

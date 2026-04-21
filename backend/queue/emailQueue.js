/**
 * Email Queue - Async Email Delivery with Bull
 * 
 * Features:
 * - Queues email tasks for asynchronous processing
 * - Implements retry logic with exponential backoff
 * - Tracks delivery status (pending, sent, failed)
 * - Provides queue monitoring and statistics
 * 
 * Setup: Requires Redis running on localhost:6379 (or configured in REDIS_URL)
 * For development without Redis, set QUEUE_MODE=memory or use --redis-mock
 */

const Queue = require('bull');
const emailService = require('../services/emailService');
const Notification = require('../models/Notification');

// Redis connection configuration
const getRedisConfig = () => {
	const redisUrl = process.env.REDIS_URL || 'redis://127.0.0.1:6379';
	
	// Support for Redis connection string or separate host/port
	if (process.env.REDIS_HOST) {
		return {
			host: process.env.REDIS_HOST,
			port: process.env.REDIS_PORT || 6379,
			password: process.env.REDIS_PASSWORD || undefined,
		};
	}
	
	return redisUrl;
};

// Create email queue with retry configuration
const emailQueue = new Queue('email', getRedisConfig());

/**
 * Queue an email job for delivery
 * @param {Object} jobData - Email job data
 * @param {string} jobData.notificationId - Notification document ID
 * @param {string} jobData.to - Recipient email
 * @param {string} jobData.subject - Email subject
 * @param {string} jobData.html - HTML email body
 * @param {Object} options - Job options (priority, delay, etc.)
 * @returns {Promise<Job>}
 */
const queueEmailJob = async (jobData, options = {}) => {
	try {
		const defaultOptions = {
			attempts: 5, // Max retry attempts
			backoff: {
				type: 'exponential',
				delay: 2000, // Initial delay 2 seconds
			},
			removeOnComplete: true, // Remove successful jobs after completion
			removeOnFail: false, // Keep failed jobs for analysis
		};

		const job = await emailQueue.add(jobData, { ...defaultOptions, ...options });
		
		console.log(`[EmailQueue] Job ${job.id} queued for ${jobData.to}`);
		return job;
	} catch (error) {
		console.error('[EmailQueue] Error queueing email job:', error);
		throw error;
	}
};

/**
 * Process email jobs from queue
 * Handler executed for each job in the queue
 */
emailQueue.process(async (job) => {
	const { notificationId, to, subject, html } = job.data;
	const jobId = job.id;

	try {
		console.log(`[EmailQueue] Processing job ${jobId}: ${to}`);

		// Update notification status to "sending"
		await Notification.findByIdAndUpdate(notificationId, {
			$set: {
				'deliveryChannels.email.status': 'sending',
				'deliveryChannels.email.queueJobId': jobId,
				'deliveryChannels.email.lastAttempt': new Date(),
			},
		});

		// Send email
		const result = await emailService.sendNotificationEmail(to, subject, html);

		// Update notification on success
		await Notification.findByIdAndUpdate(notificationId, {
			$set: {
				'deliveryChannels.email.sent': true,
				'deliveryChannels.email.status': 'sent',
				'deliveryChannels.email.sentAt': new Date(),
				'deliveryChannels.email.retryCount': 0,
				'deliveryChannels.email.lastError': null,
			},
		});

		console.log(`[EmailQueue] Job ${jobId} completed successfully`);
		return result;
	} catch (error) {
		console.error(`[EmailQueue] Job ${jobId} failed on attempt ${job.attemptsMade}:`, error.message);

		// Update notification with error details
		await Notification.findByIdAndUpdate(notificationId, {
			$set: {
				'deliveryChannels.email.status': job.attemptsMade >= 5 ? 'failed' : 'pending',
				'deliveryChannels.email.retryCount': job.attemptsMade,
				'deliveryChannels.email.lastError': error.message,
				'deliveryChannels.email.lastAttempt': new Date(),
			},
		});

		// If we've exhausted retries, throw so Bull marks it as failed
		if (job.attemptsMade >= 5) {
			throw new Error(`Email delivery failed after 5 attempts: ${error.message}`);
		}

		// Throw to trigger retry (Bull will handle backoff)
		throw error;
	}
});

/**
 * Event handlers for queue
 */

emailQueue.on('completed', (job) => {
	console.log(`[EmailQueue] ✓ Job ${job.id} completed`);
});

emailQueue.on('failed', (job, err) => {
	console.error(`[EmailQueue] ✗ Job ${job.id} permanently failed: ${err.message}`);
});

emailQueue.on('error', (error) => {
	console.error('[EmailQueue] Queue error:', error);
});

emailQueue.on('waiting', (jobId) => {
	console.log(`[EmailQueue] Job ${jobId} waiting to be processed`);
});

emailQueue.on('active', (job) => {
	console.log(`[EmailQueue] Job ${job.id} started processing`);
});

/**
 * Get queue statistics
 * @returns {Promise<Object>}
 */
const getQueueStats = async () => {
	try {
		const counts = await emailQueue.getJobCounts();
		const waiting = await emailQueue.getWaitingCount();
		const active = await emailQueue.getActiveCount();
		const completed = await emailQueue.getCompletedCount();
		const failed = await emailQueue.getFailedCount();

		return {
			waiting,
			active,
			completed,
			failed,
			total: waiting + active + completed + failed,
		};
	} catch (error) {
		console.error('[EmailQueue] Error getting stats:', error);
		return { error: error.message };
	}
};

/**
 * Get failed jobs for review
 * @param {number} limit - Max jobs to return
 * @returns {Promise<Array>}
 */
const getFailedJobs = async (limit = 10) => {
	try {
		const failed = await emailQueue.getFailed(0, limit - 1);
		return failed.map((job) => ({
			id: job.id,
			data: job.data,
			failedReason: job.failedReason,
			attempts: job.attemptsMade,
			stacktrace: job.stacktrace,
		}));
	} catch (error) {
		console.error('[EmailQueue] Error getting failed jobs:', error);
		return [];
	}
};

/**
 * Retry a specific failed job
 * @param {number} jobId - Job ID to retry
 * @returns {Promise<Boolean>}
 */
const retryFailedJob = async (jobId) => {
	try {
		const job = await emailQueue.getJob(jobId);
		if (job) {
			await job.retry();
			console.log(`[EmailQueue] Job ${jobId} queued for retry`);
			return true;
		}
		return false;
	} catch (error) {
		console.error('[EmailQueue] Error retrying job:', error);
		return false;
	}
};

/**
 * Clean up queue (remove old completed/failed jobs)
 * @param {number} gracePeriod - Time in ms after which to remove jobs (default: 7 days)
 */
const cleanupQueue = async (gracePeriod = 7 * 24 * 60 * 60 * 1000) => {
	try {
		await emailQueue.clean(gracePeriod, 'completed');
		await emailQueue.clean(gracePeriod, 'failed');
		console.log('[EmailQueue] Cleanup completed');
	} catch (error) {
		console.error('[EmailQueue] Cleanup error:', error);
	}
};

/**
 * Initialize queue (health check and cleanup)
 */
const initializeEmailQueue = async () => {
	try {
		// Test queue connectivity
		const client = emailQueue.client;
		await client.ping();
		console.log('[EmailQueue] ✓ Connected to Redis');

		// Schedule weekly cleanup
		setInterval(() => {
			cleanupQueue();
		}, 7 * 24 * 60 * 60 * 1000); // Weekly

		return true;
	} catch (error) {
		console.error('[EmailQueue] ✗ Failed to initialize:', error.message);
		console.error('[EmailQueue] Make sure Redis is running on', process.env.REDIS_URL || 'redis://127.0.0.1:6379');
		return false;
	}
};

/**
 * Graceful shutdown
 */
const closeEmailQueue = async () => {
	try {
		await emailQueue.close();
		console.log('[EmailQueue] Queue closed gracefully');
	} catch (error) {
		console.error('[EmailQueue] Error closing queue:', error);
	}
};

module.exports = {
	emailQueue,
	queueEmailJob,
	initializeEmailQueue,
	closeEmailQueue,
	getQueueStats,
	getFailedJobs,
	retryFailedJob,
	cleanupQueue,
};

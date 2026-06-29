const { Queue } = require('bullmq');
const IORedis = require('ioredis');

const connection = process.env.REDIS_URL
  ? new IORedis(process.env.REDIS_URL, { maxRetriesPerRequest: null })
  : new IORedis({
      host: process.env.REDIS_HOST || 'localhost',
      port: parseInt(process.env.REDIS_PORT) || 6379,
      maxRetriesPerRequest: null,
    });

const notificationQueue = new Queue('notification', {
  connection,
  defaultJobOptions: {
    attempts: 3,
    backoff: {
      type: 'exponential',
      delay: 1000, // 1s, 2s, 4s
    },
    removeOnComplete: { age: 86400 },
    removeOnFail: { age: 7 * 86400 },
  },
});

/**
 * Add a notification job to the queue.
 *
 * @param {Object} data - Job data
 * @param {string} data.userEmail - Recipient email
 * @param {string} data.userName - Recipient name
 * @param {string} data.verificationId - UUID of the verification
 * @param {string} data.status - Verification status (approved/rejected/manual_review)
 * @param {string} [data.notes] - Optional review notes
 */
async function addNotificationJob(data) {
  const job = await notificationQueue.add('send-notification', data);
  console.log(`Notification job ${job.id} added to queue`);
  return job;
}

module.exports = { notificationQueue, addNotificationJob };

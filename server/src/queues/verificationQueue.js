const { Queue } = require('bullmq');
const IORedis = require('ioredis');

const connection = new IORedis({
  host: process.env.REDIS_HOST || 'localhost',
  port: parseInt(process.env.REDIS_PORT) || 6379,
  maxRetriesPerRequest: null,
});

const verificationQueue = new Queue('verification', {
  connection,
  defaultJobOptions: {
    attempts: 3,
    backoff: {
      type: 'exponential',
      delay: 2000, // 2s, 4s, 8s
    },
    removeOnComplete: { age: 86400 },     // Clean up completed jobs after 24h
    removeOnFail: { age: 7 * 86400 },     // Keep failed jobs for 7 days
  },
});

/**
 * Add a document verification job to the queue.
 *
 * @param {Object} data - Job data
 * @param {string} data.verificationId - UUID of the verification record
 * @param {string} data.documentPath - Path to the uploaded document file
 * @param {string} data.documentType - 'pan' or 'aadhaar'
 * @param {string} data.documentHash - SHA-256 hash of the document
 * @param {string} data.userId - UUID of the uploading user
 */
async function addVerificationJob(data) {
  const job = await verificationQueue.add('process-document', data, {
    jobId: data.verificationId, // Use verification ID as job ID for deduplication
  });

  console.log(`Verification job ${job.id} added to queue`);
  return job;
}

module.exports = { verificationQueue, addVerificationJob };

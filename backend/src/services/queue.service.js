import Queue from 'bull';
import dotenv from 'dotenv';
dotenv.config();

const redisConfig = {
  host: process.env.REDIS_HOST || 'localhost',
  port: process.env.REDIS_PORT || 6379,
};

// Queues principales
export const vmQueue = new Queue('vm-operations', { redis: redisConfig });
export const emailQueue = new Queue('email-notifications', { redis: redisConfig });
export const syncQueue = new Queue('sync-operations', { redis: redisConfig });

// Events globaux pour monitoring
vmQueue.on('failed', (job, err) => {
  console.error(`❌ Job ${job.id} failed:`, err.message);
});

vmQueue.on('completed', (job, result) => {
  console.log(`✅ Job ${job.id} completed`);
});

export default { vmQueue, emailQueue, syncQueue };
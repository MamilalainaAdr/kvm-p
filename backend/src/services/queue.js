import Queue from 'bull';

const redis = {
  host: process.env.REDIS_HOST || 'localhost',
  port: process.env.REDIS_PORT || 6379
};

export const vmQueue = new Queue('vm-ops', { redis });
export const emailQueue = new Queue('email-notifications', { redis });
vmQueue.on('error', (err) => console.error('[VM Queue] Redis error:', err));
emailQueue.on('error', (err) => console.error('[Email Queue] Redis error:', err));

vmQueue.on('failed', (job, err) => console.error(`Job ${job.id} failed:`, err.message));
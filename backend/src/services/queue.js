import Queue from 'bull';

const redis = {
  host: process.env.REDIS_HOST || 'localhost',
  port: process.env.REDIS_PORT || 6379
};

// PRIORITÉS DÉFINIES (0 = plus haute)
export const PRIORITIES = {
  CRITICAL: 0,   // Destroy, delete user (doit passer IMMÉDIATEMENT)
  HIGH: 100,     // Create, VM actions (start/stop/reboot)
  NORMAL: 500,   // Emails
  LOW: 1000      // Sync state, monitoring
};

export const vmQueue = new Queue('vm-ops', { redis });
export const emailQueue = new Queue('email-notifications', { redis });
export const monitoringQueue = new Queue('monitoring', { redis }); // NOUVELLE QUEUE


vmQueue.on('error', (err) => console.error('[VM Queue] Redis error:', err));
emailQueue.on('error', (err) => console.error('[Email Queue] Redis error:', err));
monitoringQueue.on('error', (err) => console.error('[Monitoring Queue] Redis error:', err));


vmQueue.on('failed', (job, err) => console.error(`[ VM ] Job ${job.id} failed:`, err.message));
emailQueue.on('failed', (job, err) => console.error(`[ Email ] Job ${job.id} failed:`, err.message));
monitoringQueue.on('failed', (job, err) => console.error(`[Monitoring] Job failed:`, err.message));
import express from 'express';
import cookieParser from 'cookie-parser';
import cors from 'cors';
import helmet from 'helmet';
import dotenv from 'dotenv';
dotenv.config();

import sequelize from './models/index.js';
import authRoutes from './routes/api/auth.js';
import vmsRoutes from './routes/api/vms.js';
import adminRoutes from './routes/api/admin.js';
import profileRoutes from './routes/api/profile.js'; // NOUVEAU
import { createDefaultAdmin } from './config/initAdmin.js';
import { vmQueue, emailQueue, syncQueue } from './services/queue.service.js';

const app = express();

app.use(helmet());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());
app.use(cors({
  origin: process.env.CORS_ORIGIN || 'http://localhost:5173',
  credentials: true
}));

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/vms', vmsRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/profile', profileRoutes); // NOUVEAU

app.get('/api/health', (req, res) => res.json({ status: 'ok' }));

const PORT = process.env.PORT || 4000;

(async () => {
  try {
    await sequelize.authenticate();
    await sequelize.sync();
    console.log('✅ DB connected and synced');

    await createDefaultAdmin();

    // Workers
    if (process.env.START_WORKERS !== 'false') {
      const { spawn } = await import('child_process');
      ['vm.worker.js', 'email.worker.js', 'sync.worker.js'].forEach(worker => {
        spawn('node', [`src/workers/${worker}`], { 
          stdio: 'inherit',
          env: { ...process.env, START_WORKERS: 'false' }
        });
      });

      // Sync toutes les 5 min seulement
      syncQueue.add('sync-state', {}, { repeat: { cron: '*/5 * * * *' } });
    }

    app.listen(PORT, () => console.log(`🚀 Backend running on http://localhost:${PORT}`));
  } catch (err) {
    console.error('❌ Startup error:', err);
    process.exit(1);
  }
})();
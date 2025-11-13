import 'dotenv/config';
import express from 'express';
import cookieParser from 'cookie-parser';
import cors from 'cors';
import helmet from 'helmet';
import { sequelize, User, VirtualMachine } from './models/index.js';
import { createDefaultAdmin } from './config/initAdmin.js';
import authRoutes from './routes/auth.js';
import vmRoutes from './routes/vms.js';
import adminRoutes from './routes/admin.js';
import profileRoutes from './routes/profile.js';
import { vmQueue, emailQueue } from './services/queue.js';
import { spawn } from 'child_process';

const app = express();

app.use(helmet());
app.use(express.json());
app.use(cookieParser());
app.use(cors({ origin: process.env.CORS_ORIGIN, credentials: true }));

app.use('/api/auth', authRoutes);
app.use('/api/vms', vmRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/profile', profileRoutes);

app.get('/api/health', (req, res) => res.json({ status: 'ok' }));

const PORT = process.env.PORT || 4000;

(async () => {
  try {
    await sequelize.authenticate();
    await sequelize.sync();
    console.log('✅ DB connected');
    await createDefaultAdmin();

    if (process.env.START_WORKERS === 'true') {
      const workers = ['vm.js', 'email.js'];
      workers.forEach(w => spawn('node', [`src/workers/${w}`], { stdio: 'inherit' }));
      
      // Sync every 5 min
      setInterval(() => vmQueue.add('sync-state'), 5 * 60 * 1000);
    }

    app.listen(PORT, () => console.log(`🚀 Backend on http://localhost:${PORT}`));
  } catch (err) {
    console.error('❌ Startup error:', err);
    process.exit(1);
  }
})();
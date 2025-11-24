// backend/src/app.js
import 'dotenv/config';
import express from 'express';
import cookieParser from 'cookie-parser';
import cors from 'cors';
import helmet from 'helmet';
import { createServer } from 'http';
import { sequelize } from './models/index.js';
import { createDefaultAdmin } from './config/initAdmin.js';
import authRoutes from './routes/auth.js';
import vmRoutes from './routes/vms.js';
import adminRoutes from './routes/admin.js';
import profileRoutes from './routes/profile.js';
import monitoringRoutes from './routes/monitoring.js';
import { vmQueue, PRIORITIES } from './services/queue.js';
import { spawn } from 'child_process';
import { setupSocket } from './services/socket.js';

const app = express();
const server = createServer(app);

// ✅ Flag unique pour éviter de démarrer plusieurs workers
let startupDone = false;

// ✅ Initialiser Socket.IO depuis le fichier dédié
const io = setupSocket(server, app);

// ✅ Middleware Express
app.use(helmet());
app.use(express.json());
app.use(cookieParser());
app.use(cors({ origin: process.env.CORS_ORIGIN, credentials: true }));

// ✅ Routes
app.use('/api/auth', authRoutes);
app.use('/api/vms', vmRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/profile', profileRoutes);
app.use('/api/monitoring', monitoringRoutes);

app.get('/api/health', (req, res) => res.json({ status: 'ok' }));

const PORT = process.env.PORT || 4000;

(async () => {
  try {
    await sequelize.authenticate();
    await sequelize.sync();
    console.log('✅ DB connected');
    await createDefaultAdmin();

    // ✅ Démarrage unique et sécurisé
    if (!startupDone) {
      startupDone = true;
      
      // Démarrer les workers
      const workers = ['vm.js', 'email.js', 'monitoring.js'];
      workers.forEach(w => {
        const worker = spawn('node', [`src/workers/${w}`], { stdio: 'inherit' });
        worker.on('error', (err) => console.error(`[Worker] Erreur démarrage ${w}:`, err));
        console.log(`[Worker] ${w} démarré`);
      });
      
      // Supprimer les anciens jobs de sync
      const jobs = await vmQueue.getRepeatableJobs();
      const syncJobs = jobs.filter(j => j.name === 'sync-state');
      for (const job of syncJobs) {
        await vmQueue.removeRepeatableByKey(job.key);
        console.log(`[App] Ancien job sync-state supprimé: ${job.key}`);
      }
      
      // Programmer le sync toutes les 5 minutes
      await vmQueue.add('sync-state', {}, {
        repeat: { every: 5 * 60 * 1000 },
        priority: PRIORITIES.LOW,
        jobId: 'periodic-sync-state'
      });
      
      console.log('[App] Sync-state programmé toutes les 5 minutes');
    }

    // ✅ Démarrer le serveur avec Socket.IO
    server.listen(PORT, () => console.log(`🚀 Backend on http://localhost:${PORT}`));
  } catch (err) {
    console.error('❌ Startup error:', err);
    process.exit(1);
  }
})();
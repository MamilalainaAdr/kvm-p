import 'dotenv/config';
import express from 'express';
import cookieParser from 'cookie-parser';
import cors from 'cors';
import helmet from 'helmet';
import { createServer } from 'http';
import { Server} from 'socket.io'
import { sequelize } from './models/index.js';
import { createDefaultAdmin } from './config/initAdmin.js';
import authRoutes from './routes/auth.js';
import vmRoutes from './routes/vms.js';
import adminRoutes from './routes/admin.js';
import profileRoutes from './routes/profile.js';
import monitoringRoutes from './routes/monitoring.js';
import { vmQueue, emailQueue, monitoringQueue, PRIORITIES } from './services/queue.js';
import { spawn } from 'child_process';
import { getSystemStats, getVMStats } from './services/monitoring.js';

const app = express();
const server = createServer(app);

let syncJobScheduled = false;

const io = new Server(server, {
  cors: {
    origin: process.env.CORS_ORIGIN || 'http://localhost:5173',
    credentials: true,
    methods: ['GET', 'POST']
  }
});

// ✅ MIDDLEWARE SOCKET.IO D'AUTH
io.use(async (socket, next) => {
  try {
    // Récupérer token depuis cookie ou auth header
    const token = socket.handshake.auth.token || 
                  socket.handshake.headers.cookie?.split('token=')[1]?.split(';')[0];
    
    if (!token) {
      console.warn('[Socket] ❌ Token manquant');
      return next(new Error('Authentication error'));
    }

    const jwt = await import('jsonwebtoken');
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    socket.user = decoded;
    console.log(`[Socket] ✅ ${decoded.email} (${decoded.role}) connecté`);
    next();
  } catch (err) {
    console.error('[Socket] ❌ Auth failed:', err.message);
    next(new Error('Authentication error'));
  }
});

io.on('connection', (socket) => {
  console.log(`[Socket] Client connecté: ${socket.user.email}`);
  
  // ✅ ADMIN: Stats système
  socket.on('subscribe-system', async () => {
    if (socket.user.role !== 'admin') {
      socket.disconnect();
      return;
    }
    
    // Envoi immédiat
    try {
      const stats = await getSystemStats();
      socket.emit('system-stats', stats);
    } catch (err) {
      socket.emit('error', { message: 'Failed to fetch stats' });
    }
    
    // Interval sans bloquer
    const interval = setInterval(async () => {
      try {
        const stats = await getSystemStats();
        socket.emit('system-stats', stats);
      } catch (err) {
        console.error('[Socket] System stats error:', err.message);
      }
    }, 5000);
    
    socket.on('disconnect', () => {
      console.log('[Socket] Admin disconnected');
      clearInterval(interval);
    });
  });

  // ✅ USER: Stats VMs
  socket.on('subscribe-vms', async (userId) => {
    if (socket.user.id !== userId && socket.user.role !== 'admin') {
      socket.disconnect();
      return;
    }
    
    // Envoi immédiat
    try {
      const stats = await getVMStats(userId, socket.user.role === 'admin');
      socket.emit('vm-stats', stats);
    } catch (err) {
      socket.emit('error', { message: 'Failed to fetch VM stats' });
    }
    
    // Interval
    const interval = setInterval(async () => {
      try {
        const stats = await getVMStats(userId, socket.user.role === 'admin');
        socket.emit('vm-stats', stats);
      } catch (err) {
        console.error('[Socket] VM stats error:', err.message);
      }
    }, 5000);
    
    socket.on('disconnect', () => clearInterval(interval));
  });
});

// LOG lorsqu'un job monitoring est complété
monitoringQueue.on('completed', (job, result) => {
  if (job.data.type === 'system') {
    console.log('[App] Job monitoring system completed, émission socket');
    io.emit('admin-system-update', result.data);
  }
});

app.use(helmet());
app.use(express.json());
app.use(cookieParser());
app.use(cors({ origin: process.env.CORS_ORIGIN, credentials: true }));

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

    // ✅ PROGRAMMATION SYNC UNIQUE ET SÉCURISÉE
    if (!syncJobScheduled) {
      syncJobScheduled = true;
      const workers = ['vm.js', 'email.js', 'monitoring.js'];
      workers.forEach(w => spawn('node', [`src/workers/${w}`], { stdio: 'inherit' }));
      
      // Supprimer les jobs sync-state existants pour éviter doublons
      const jobs = await vmQueue.getRepeatableJobs();
      const syncJobs = jobs.filter(j => j.name === 'sync-state');
      for (const job of syncJobs) {
        await vmQueue.removeRepeatableByKey(job.key);
        console.log(`[App] Ancien job sync-state supprimé: ${job.key}`);
      }
      
      // ✅ Utilisation de Bull repeatable job (plus fiable que setInterval)
      await vmQueue.add('sync-state', {}, {
        repeat: {
          every: 5 * 60 * 1000, // Toutes les 5 minutes
        },
        priority: PRIORITIES.LOW,
        jobId: 'periodic-sync-state' // ID unique pour éviter doublons
      });
      
      console.log('[App] Sync-state programmé toutes les 5 minutes');
    }

    app.listen(PORT, () => console.log(`🚀 Backend on http://localhost:${PORT}`));
  } catch (err) {
    console.error('❌ Startup error:', err);
    process.exit(1);
  }
})();
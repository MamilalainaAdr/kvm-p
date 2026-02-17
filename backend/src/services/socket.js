import { Server } from 'socket.io';
import jwt from 'jsonwebtoken';
import { getSystemStats, getUserVMsStats } from './monitoring.js';
import { monitoringQueue } from './queue.js';

export const setupSocket = (server, app) => {
  const io = new Server(server, {
    cors: {
      origin: process.env.CORS_ORIGIN || 'http://localhost:5173',
      credentials: true,
      methods: ['GET', 'POST']
    }
  });

  io.use(async (socket, next) => {
    try {
      const token = socket.handshake.auth.token || 
                    socket.handshake.headers.cookie?.split('token=')[1]?.split(';')[0];
      if (!token) return next(new Error('Authentication error'));
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      socket.user = decoded;
      next();
    } catch (err) {
      next(new Error('Authentication error'));
    }
  });

  io.on('connection', (socket) => {
    console.log(`[Socket] Client connecté: ${socket.user.email}`);

    // ADMIN: stats système
    socket.on('subscribe-system', async () => {
      if (socket.user.role !== 'admin') {
        socket.disconnect();
        return;
      }
      const sendStats = async () => {
        try {
          const stats = await getSystemStats();
          socket.emit('system-stats', stats);
        } catch (err) {
          console.error('[Socket] System stats error:', err.message);
        }
      };
      sendStats();
      const interval = setInterval(sendStats, 5000);
      socket.on('disconnect', () => clearInterval(interval));
    });

    // USER: stats VMs
    socket.on('subscribe-vms', async (userId) => {
      if (socket.user.id !== userId && socket.user.role !== 'admin') {
        socket.disconnect();
        return;
      }
      const sendStats = async () => {
        try {
          const stats = await getUserVMsStats(userId, socket.user.role === 'admin');
          socket.emit('vm-stats', { vms: stats, total: stats.length });
        } catch (err) {
          console.error('[Socket] VM stats error:', err.message);
        }
      };
      sendStats();
      const interval = setInterval(sendStats, 5000);
      socket.on('disconnect', () => clearInterval(interval));
    });
  });

  monitoringQueue.on('completed', (job, result) => {
    if (job.data.type === 'system') {
      io.emit('admin-system-update', result.data);
    }
  });

  return io;
};
// backend/src/services/socket.js
import { Server } from 'socket.io';
import jwt from 'jsonwebtoken';
import { getSystemStats, getVMStats } from './monitoring.js';
import { monitoringQueue } from './queue.js';

export const setupSocket = (server, app) => {
  const io = new Server(server, {
    cors: {
      origin: process.env.CORS_ORIGIN || 'http://localhost:5173',
      credentials: true,
      methods: ['GET', 'POST']
    }
  });

  //  Middleware d'authentification
  io.use(async (socket, next) => {
    try {
      const token = socket.handshake.auth.token || 
                    socket.handshake.headers.cookie?.split('token=')[1]?.split(';')[0];
      
      if (!token) {
        console.warn('[Socket] ❌ Token manquant');
        return next(new Error('Authentication error'));
      }

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
    
    //  ADMIN: Stats système
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
      
      socket.on('disconnect', () => {
        console.log('[Socket] Admin disconnected');
        clearInterval(interval);
      });
    });

    //  USER: Stats VMs
    socket.on('subscribe-vms', async (userId) => {
      if (socket.user.id !== userId && socket.user.role !== 'admin') {
        socket.disconnect();
        return;
      }
      
      const sendStats = async () => {
        try {
          const stats = await getVMStats(userId, socket.user.role === 'admin');
          socket.emit('vm-stats', stats);
        } catch (err) {
          console.error('[Socket] VM stats error:', err.message);
        }
      };
      
      sendStats();
      const interval = setInterval(sendStats, 5000);
      socket.on('disconnect', () => clearInterval(interval));
    });
  });

  //  LOG lorsqu'un job monitoring est complété
  monitoringQueue.on('completed', (job, result) => {
    if (job.data.type === 'system') {
      console.log('[App] Job monitoring system completed, émission socket');
      io.emit('admin-system-update', result.data);
    }
  });

  return io;
};
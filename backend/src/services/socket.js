import { getSystemStats, getVMStats } from './monitoring.js';

export function setupSocket(io) {
  io.on('connection', (socket) => {
    console.log(`[Socket] Client connecté: ${socket.id}`);
    
    // ✅ ADMIN: Recevoir stats système
    socket.on('subscribe-system', async () => {
      if (!socket.user?.role === 'admin') return socket.disconnect();
      
      const sendStats = async () => {
        const stats = await getSystemStats();
        socket.emit('system-stats', stats);
      };
      
      sendStats();
      const interval = setInterval(sendStats, 5000);
      socket.on('disconnect', () => clearInterval(interval));
    });
    
    // ✅ USER: Recevoir stats de ses VMs
    socket.on('subscribe-vms', async (userId) => {
      if (socket.user?.id !== userId && socket.user?.role !== 'admin') return socket.disconnect();
      
      const sendStats = async () => {
        const stats = await getVMStats(userId, socket.user?.role === 'admin');
        socket.emit('vm-stats', stats);
      };
      
      sendStats();
      const interval = setInterval(sendStats, 5000);
      socket.on('disconnect', () => clearInterval(interval));
    });
  });
}
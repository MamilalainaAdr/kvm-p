import { useState, useEffect } from 'react';
import { io } from 'socket.io-client';
import { useAuth } from '../context/AuthContext';

export default function AdminMonitoring() {
  const [systemStats, setSystemStats] = useState(null);
  const [debug, setDebug] = useState(''); // ✅ Pour diagnostic
  const { user } = useAuth();

  useEffect(() => {
    if (!user || user.role !== 'admin') return;

    setDebug('Connexion Socket.io...');
    
    const socket = io('/', {
      withCredentials: true,
      auth: { token: localStorage.getItem('token') },
      transports: ['websocket', 'polling']
    });

    socket.on('connect', () => {
      setDebug('✅ Connecté, abonnement...');
      socket.emit('subscribe-system');
    });

    socket.on('system-stats', (stats) => {
      console.log('[AdminMonitoring] Stats reçues:', stats);
      setDebug(`Stats reçues: ${JSON.stringify(stats)}`);
      setSystemStats(stats);
    });

    socket.on('error', (err) => {
      setDebug(`❌ Erreur socket: ${err.message}`);
      // Fallback immédiat si socket échoue
      fetchStatsREST();
    });

    socket.on('connect_error', (err) => {
      setDebug(`❌ Connexion échouée: ${err.message} → Fallback REST`);
      fetchStatsREST();
    });

    return () => {
      console.log('[AdminMonitoring] Déconnexion');
      socket.disconnect();
    };
  }, [user]);

  // ✅ FIX: URL relative pour passer par le proxy Vite
  const fetchStatsREST = async () => {
    setDebug('🔄 Tentative fallback REST...');
    try {
      const res = await fetch('/api/monitoring/system', {
        credentials: 'include',
        headers: { 'Accept': 'application/json' }
      });
      
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      
      const stats = await res.json();
      console.log('[AdminMonitoring] Stats REST reçues:', stats);
      setDebug('✅ Fallback REST OK');
      setSystemStats(stats);
    } catch (err) {
      console.error('[AdminMonitoring] Fallback REST échoué:', err);
      setDebug(`❌ REST échoué: ${err.message}`);
      setSystemStats({ error: 'REST fallback failed' });
    }
  };

  if (!systemStats) {
    return (
      <div className="mt-4 p-4 bg-gray-100 rounded">
        Chargement stats...
        <div className="text-xs text-gray-500 mt-2">{debug}</div>
      </div>
    );
  }

  if (systemStats.error) {
    return (
      <div className="mt-4 p-4 bg-red-100 text-red-700 rounded">
        Erreur: {systemStats.error}
        <div className="text-xs mt-2">{debug}</div>
      </div>
    );
  }

  return (
    <div className="mt-6 space-y-4">
      <h2 className="text-xl font-bold flex justify-between">
        Informations sur le système
        <span className="text-xs font-normal text-gray-500">{debug}</span>
      </h2>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-slate-50 p-4 rounded">
          <h3 className="font-semibold text-slate-700">CPU Hôte</h3>
          <p className="text-2xl font-bold text-blue-600">{systemStats.system?.cpuUsage ?? 'N/A'}%</p>
        </div>
        <div className="bg-slate-50 p-4 rounded">
          <h3 className="font-semibold text-slate-700">RAM Hôte</h3>
          <p className="text-2xl font-bold text-green-600">{systemStats.system?.memoryUsage ?? 'N/A'}%</p>
        </div>
        <div className="bg-slate-50 p-4 rounded">
          <h3 className="font-semibold text-slate-700">Disque Hôte</h3>
          <p className="text-2xl font-bold text-yellow-600">{systemStats.system?.diskUsage ?? 'N/A'}%</p>
        </div>
        <div className="bg-slate-50 p-4 rounded">
          <h3 className="font-semibold text-slate-700">VMs Actives</h3>
          <p className="text-2xl font-bold text-purple-600">{systemStats.system?.activeVMs ?? 0}</p>
        </div>
        <div className="bg-slate-50 p-4 rounded">
          <h3 className="font-semibold text-slate-700">RAM Libvirt</h3>
          <p className="text-2xl font-bold text-red-600">{systemStats.libvirt?.memoryMB ?? 0} MB</p>
        </div>
      </div>
    </div>
  );
}
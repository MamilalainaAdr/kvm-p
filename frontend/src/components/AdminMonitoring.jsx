import { useState, useEffect } from 'react';
import { io } from 'socket.io-client';
import { useAuth } from '../context/AuthContext';

export default function AdminMonitoring() {
  const [systemStats, setSystemStats] = useState(null);
  const { user } = useAuth();

  useEffect(() => {
    if (!user || user.role !== 'admin') return;
    
    const socket = io('/', {
      withCredentials: true,
      auth: { token: localStorage.getItem('token') },
      transports: ['websocket', 'polling']
    });

    socket.on('connect', () => {
      socket.emit('subscribe-system');
    });

    socket.on('system-stats', (stats) => {
      console.log('[AdminMonitoring] Stats reçues:', stats);
      setSystemStats(stats);
    });

    socket.on('error', (err) => {
      // Fallback immédiat si socket échoue
      fetchStatsREST();
    });

    socket.on('connect_error', (err) => {
      fetchStatsREST();
    });

    return () => {
      console.log('[AdminMonitoring] Déconnexion');
      socket.disconnect();
    };
  }, [user]);

  // ✅ FIX: URL relative pour passer par le proxy Vite
  const fetchStatsREST = async () => {
    try {
      const res = await fetch('/api/monitoring/system', {
        credentials: 'include',
        headers: { 'Accept': 'application/json' }
      });
      
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      
      const stats = await res.json();
      console.log('[AdminMonitoring] Stats REST reçues:', stats);
      setSystemStats(stats);
    } catch (err) {
      console.error('[AdminMonitoring] Fallback REST échoué:', err);
      setSystemStats({ error: 'REST fallback failed' });
    }
  };

  if (!systemStats) {
    return (
      <div className="mt-4 p-4 bg-gray-100 rounded">
        Chargement stats...
      </div>
    );
  }

  if (systemStats.error) {
    return (
      <div className="mt-4 p-4 bg-red-100 text-red-700 rounded">
        Erreur: {systemStats.error}
      </div>
    );
  }

  return (
    <div className=" bg-white p-4 rounded shadow mt-6 space-y-4">
      <h2 className="text-xl font-bold flex justify-between">
        Informations sur le système
      </h2>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-slate-100 p-4 rounded">
          <h3 className="font-semibold text-slate-700">CPU Hôte</h3>
          <p className="text-2xl font-bold text-blue-600">{systemStats.system?.cpuUsage ?? 'N/A'}%</p>
        </div>
        <div className="bg-slate-100 p-4 rounded">
          <h3 className="font-semibold text-slate-700">RAM Hôte</h3>
          <p className="text-2xl font-bold text-green-600">{systemStats.system?.memoryUsage ?? 'N/A'}%</p>
        </div>
        <div className="bg-slate-100 p-4 rounded">
          <h3 className="font-semibold text-slate-700">Disque Hôte</h3>
          <p className="text-2xl font-bold text-yellow-600">{systemStats.system?.diskUsage ?? 'N/A'}%</p>
        </div>
        <div className="bg-slate-100 p-4 rounded">
          <h3 className="font-semibold text-slate-700">VMs Actives</h3>
          <p className="text-2xl font-bold text-purple-600">{systemStats.system?.activeVMs ?? 0}</p>
        </div>
        <div className="bg-slate-100 p-4 rounded">
          <h3 className="font-semibold text-slate-700">RAM Libvirt</h3>
          <p className="text-2xl font-bold text-red-600">{systemStats.libvirt?.memoryMB ?? 0} MB</p>
        </div>
      </div>
    </div>
  );
}
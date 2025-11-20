import { useState, useEffect } from 'react';
import { io } from 'socket.io-client';
import { useAuth } from '../context/AuthContext';

export default function UserMonitoring() {
  const [vmStats, setVmStats] = useState({ vms: [], total: 0 });
  const [debug, setDebug] = useState('');
  const { user } = useAuth();

  useEffect(() => {
    if (!user) return;

    setDebug('Connexion...');
    
    const socket = io('http://localhost:4000', {
      withCredentials: true,
      auth: { token: localStorage.getItem('token') },
      transports: ['websocket', 'polling']
    });

    socket.on('connect', () => {
      setDebug('✅ Connecté, abonnement...');
      socket.emit('subscribe-vms', user.id);
    });

    socket.on('vm-stats', (stats) => {
      console.log('[UserMonitoring] Stats reçues:', stats);
      setDebug(`Stats reçues: ${stats.total} VMs`);
      setVmStats(stats);
    });

    socket.on('error', (err) => {
      setDebug(`❌ Erreur: ${err.message}`);
      fetchVMStatsREST();
    });

    socket.on('connect_error', (err) => {
      setDebug(`❌ Connexion échouée: ${err.message}`);
      fetchVMStatsREST();
    });

    const timeout = setTimeout(() => {
      if (vmStats.total === 0) {
        setDebug('⏰ Timeout → Fallback REST');
        fetchVMStatsREST();
      }
    }, 3000);

    return () => {
      clearTimeout(timeout);
      socket.disconnect();
    };
  }, [user?.id]);

  // ✅ FIX: URL relative
  const fetchVMStatsREST = async () => {
    setDebug('🔄 Fallback REST...');
    try {
      const res = await fetch('/api/monitoring/vms', { // ✅ URL relative
        credentials: 'include',
        headers: { 'Accept': 'application/json' }
      });
      
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      
      const stats = await res.json();
      setDebug('✅ REST OK');
      setVmStats(stats);
    } catch (err) {
      console.error('[UserMonitoring] REST échoué:', err);
      setDebug(`❌ REST échoué: ${err.message}`);
      setVmStats({ vms: [], total: 0, error: err.message });
    }
  };

  if (vmStats.error) {
    return (
      <div className="mt-4 p-4 bg-red-100 text-red-700 rounded">
        Erreur: {vmStats.error}
        <div className="text-xs mt-2">{debug}</div>
      </div>
    );
  }

  return (
    <div className="mt-6">
      <h2 className="text-xl font-bold mb-4 flex justify-between">
        Mes Machines Virtuelles ({vmStats.total})
        <span className="text-xs font-normal text-gray-500">{debug}</span>
      </h2>
      
      {vmStats.total === 0 ? (
        <div className="bg-slate-50 p-6 rounded text-center text-slate-500">
          Aucune VM créée. <a href="/vms" className="text-blue-600 hover:underline">Créer ma première VM</a>
        </div>
      ) : (
        <div className="space-y-3">
          {vmStats.vms.map(vm => (
            <div key={vm.id} className="bg-slate-50 p-4 rounded flex justify-between items-center">
              <div>
                <h3 className="font-semibold text-slate-800">{vm.name}</h3>
                <p className="text-sm text-slate-600">IP: {vm.ip_address || 'N/A'}</p>
                <p className="text-xs text-slate-500">Status: {vm.status}</p>
              </div>
              <div className="text-right text-sm space-y-1">
                <p className="text-blue-600 font-medium">CPU: {vm.cpu ?? 0}ms</p>
                <p className="text-green-600 font-medium">RAM: {vm.memory ?? 0}MB</p>
                <p className="text-yellow-600 font-medium">
                  Disque: {vm.diskUsed?.toFixed(1) ?? '0.0'}GB / {vm.diskTotal ?? vm.disk_size}GB
                </p>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
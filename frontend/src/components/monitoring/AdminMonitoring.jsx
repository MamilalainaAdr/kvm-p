import { useState, useEffect } from 'react';
import { io } from 'socket.io-client';
import { useAuth } from '../../context/AuthContext';
import { Server, Cpu, HardDrive, Activity, Zap, MemoryStick, Users } from 'lucide-react';
import { Card } from '../ui/Card';
import API from '../../services/api';

export default function AdminMonitoring() {
  const [systemStats, setSystemStats] = useState(null);
  const [globalStats, setGlobalStats] = useState({ totalUsers: 0, totalVMs: 0 });
  const { user } = useAuth();

  // Socket pour les stats système
  useEffect(() => {
    if (!user || user.role !== 'admin') return;
    
    const socket = io({
      withCredentials: true,
      auth: { token: localStorage.getItem('token') },
      transports: ['websocket', 'polling']
    });

    socket.on('connect', () => socket.emit('subscribe-system'));
    socket.on('system-stats', setSystemStats);
    socket.on('error', fetchStatsREST);
    socket.on('connect_error', fetchStatsREST);

    return () => socket.disconnect();
  }, [user]);

  const fetchStatsREST = async () => {
    try {
      const res = await fetch('/api/monitoring/system', {
        credentials: 'include',
        headers: { 'Accept': 'application/json' }
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const stats = await res.json();
      setSystemStats(stats);
    } catch (err) {
      console.error('REST fallback failed:', err);
      setSystemStats({ error: 'REST fallback failed' });
    }
  };

  // Stats globales (users + VMs)
  useEffect(() => {
    if (!user || user.role !== 'admin') return;

    const fetchGlobalStats = async () => {
      try {
        const [usersRes, vmsRes] = await Promise.all([
          API.get('/admin/users'),
          API.get('/vms')
        ]);
        
        setGlobalStats({
          totalUsers: usersRes.data.users?.length || 0,
          totalVMs: vmsRes.data.vms?.length || 0
        });
      } catch (err) {
        console.error('Erreur chargement stats globales:', err);
      }
    };

    fetchGlobalStats();
    const interval = setInterval(fetchGlobalStats, 30000);
    return () => clearInterval(interval);
  }, [user]);

  if (!systemStats) {
    return (
      <Card className="mt-6">
        <div className="flex items-center gap-3 text-muted">
          Chargement des stats système...
        </div>
      </Card>
    );
  }

  if (systemStats.error) {
    return (
      <Card className="mt-6 bg-error/10 border-error">
        <p className="text-error">Erreur: {systemStats.error}</p>
      </Card>
    );
  }

  const stats = [
    { 
      label: 'CPU Hôte', 
      value: `${systemStats.system?.cpuUsage ?? 'N/A'}%`,
      icon: Cpu,
      color: 'text-accent'
    },
    { 
      label: 'RAM Hôte', 
      value: `${systemStats.system?.memoryUsage ?? 'N/A'}%`,
      icon: MemoryStick,
      color: 'text-success'
    },
    { 
      label: 'Disque Hôte', 
      value: `${systemStats.system?.diskUsage ?? 'N/A'}%`,
      icon: HardDrive,
      color: 'text-warning'
    },
    { 
      label: 'VMs Actives', 
      value: systemStats.system?.activeVMs ?? 0,
      icon: Server,
      color: 'text-primary'
    },
    { 
      label: 'RAM Libvirt', 
      value: `${systemStats.libvirt?.memoryMB ?? 0} MB`,
      icon: Zap,
      color: 'text-error'
    },
  ];

  return (
    <div className="space-y-6">
      {/* ✅ STATS GLOBALES */}
      <Card>
        <div>
          <h2 className="text-xl font-bold text-text mb-4 flex items-center gap-2">
            Bienvenue, <em><b className='text-primary'>{user.name}</b></em>
          </h2>
          <div className="grid grid-cols-3 gap-4 text-sm">
            <div className="text-center p-2 bg-background rounded hover:shadow-md transition-shadow">
              <p className="text-muted text-xs">Utilisateurs</p>
              <p className="font-medium text-text">{globalStats.totalUsers}</p>
            </div>
            <div className="text-center p-2 bg-background rounded hover:shadow-md transition-shadow">
              <p className="text-muted text-xs">Total VMs</p>
              <p className="font-medium text-warning">{globalStats.totalVMs}</p>
            </div>
            <div className="text-center p-2 bg-background rounded hover:shadow-md transition-shadow">
              <p className="text-muted text-xs">VMs Actives</p>
              <p className="font-medium text-success">{systemStats.system?.activeVMs ?? 0}</p>
            </div>
          </div>
        </div>
      </Card>
      
      {/* ✅ MONITORING SYSTÈME */}
      <Card>
        <h2 className="text-xl font-bold text-text mb-4 flex items-center gap-2">
          Informations Système
        </h2>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-4">
          {stats.map(({ label, value, icon: Icon, color }) => (
            <div key={label} className="bg-background rounded-lg p-4 text-center hover:shadow-md transition-shadow border border-transparent hover:border-primary/20">
              <Icon className={`w-8 h-8 mx-auto mb-2 ${color}`} />
              <p className="text-sm text-muted mb-1">{label}</p>
              <p className="text-2xl font-bold text-text">{value}</p>
            </div>
          ))}
        </div>
      </Card>
    </div>
  );
}
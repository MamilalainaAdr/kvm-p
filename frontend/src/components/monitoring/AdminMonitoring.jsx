import { useState, useEffect } from 'react';
import { io } from 'socket.io-client';
import { useAuth } from '../../context/AuthContext';
import { Cpu, HardDrive, MemoryStick, Server } from 'lucide-react';
import { Card } from '../ui/Card';
import API from '../../services/api';

export default function AdminMonitoring() {
  const [systemStats, setSystemStats] = useState(null);
  const [globalStats, setGlobalStats] = useState({ totalUsers: 0, totalVMs: 0 });
  const { user } = useAuth();

  useEffect(() => {
    if (!user || user.role !== 'admin') return;
    const socket = io({
      withCredentials: true,
      auth: { token: localStorage.getItem('token') },
      transports: ['websocket', 'polling']
    });
    socket.on('connect', () => socket.emit('subscribe-system'));
    socket.on('system-stats', setSystemStats);
    socket.on('connect_error', fetchStatsREST);
    return () => socket.disconnect();
  }, [user]);

  const fetchStatsREST = async () => {
    try {
      const { data } = await API.get('/monitoring/system');
      setSystemStats(data);
    } catch (err) {
      console.error('REST fallback failed:', err);
    }
  };

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
        <div className="text-center py-4 text-muted">Chargement des stats système...</div>
      </Card>
    );
  }

  const statsCards = [
    {
      label: 'CPU Hôte',
      value: `${systemStats.cpu?.usage ?? 0}% `,
      real: `sur ${systemStats.cpu?.cores ?? 0} cores`,
      icon: Cpu,
      color: 'text-accent'
    },
    {
      label: 'RAM Hôte',
      value: `${systemStats.ram?.percent ?? 0}% `,
      real: `${systemStats.ram?.used ?? 0} MB / ${systemStats.ram?.total ?? 0} MB`,
      icon: MemoryStick,
      color: 'text-success'
    },
    {
      label: 'Disque Hôte',
      value: `${systemStats.disk?.percent ?? 0}%`,
      real: `${systemStats.disk?.used ?? 0} GB / ${systemStats.disk?.total ?? 0} GB`,
      icon: HardDrive,
      color: 'text-warning'
    },
    {
      label: 'VMs Actives',
      value: systemStats.activeVMs ?? 0,
      real: `sur ${globalStats.totalVMs}`,
      icon: Server,
      color: 'text-primary'
    }
  ];

  return (
    <div className="space-y-6">
      <Card>
        <h2 className="text-2xl font-bold text-text mb-4 flex items-center gap-2">
          Bienvenue, <em><b className='text-primary'>{user.name}</b></em>
        </h2>
        <div className="grid grid-cols-3 gap-4 text-sm">
          <div className="text-center p-2 bg-background/20 rounded">
            <p className="text-muted text-sm">Utilisateurs</p>
            <p className="font-medium text-xl">{globalStats.totalUsers}</p>
          </div>
          <div className="text-center p-2 bg-background/20 rounded">
            <p className="text-muted text-sm">Total VMs</p>
            <p className="font-medium text-xl text-warning">{globalStats.totalVMs}</p>
          </div>
          <div className="text-center p-2 bg-background/20 rounded">
            <p className="text-muted text-sm">VMs Actives</p>
            <p className="font-medium text-xl text-success">{systemStats.activeVMs ?? 0}</p>
          </div>
        </div>
      </Card>

      <Card>
        <h2 className="text-2xl font-bold text-text mb-4">Informations Système</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {statsCards.map(({ label, value, real, icon: Icon, color }) => (
            <div key={label} className="bg-background/20 rounded-lg p-4 text-center">
              <Icon className={`w-8 h-8 mx-auto mb-2 ${color}`} />
              <p className="text-sm text-muted mb-1">{label}</p>
              <p className="text-lg font-bold text-text">{value}</p>
              <p className="text-xs font-bold text-muted">{real}</p>
            </div>
          ))}
        </div>
      </Card>
    </div>
  );
}
import { useState, useEffect } from 'react';
import { io } from 'socket.io-client';
import { useAuth } from '../../context/AuthContext';
import { Server, Cpu, HardDrive, Activity, Power } from 'lucide-react';
import { Card } from '../ui/Card';
import toast from 'react-hot-toast';

export default function UserMonitoring() {
  const [vmStats, setVmStats] = useState({ vms: [], total: 0 });
  const { user } = useAuth();

  useEffect(() => {
    if (!user) return;

    const socket = io({
      withCredentials: true,
      auth: { token: localStorage.getItem('token') },
      transports: ['websocket', 'polling']
    });

    socket.on('connect', () => socket.emit('subscribe-vms', user.id));
    socket.on('vm-stats', setVmStats);

    const timeout = setTimeout(() => {
      if (vmStats.total === 0) fetchVMStatsREST();
    }, 3000);

    return () => {
      clearTimeout(timeout);
      socket.disconnect();
    };
  }, [user?.id]);

  const fetchVMStatsREST = async () => {
    try {
      const res = await fetch('/api/monitoring/vms', {
        credentials: 'include',
        headers: { 'Accept': 'application/json' }
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const stats = await res.json();
      setVmStats(stats);
    } catch (err) {
      console.error('REST failed:', err);
      toast.error('Erreur de connexion au monitoring');
      setVmStats({ vms: [], total: 0, error: err.message });
    }
  };

  if (vmStats.error) {
    return (
      <Card className="bg-error/10 border-error">
        <p className="text-error">Erreur: {vmStats.error}</p>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <Card>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-bold text-text flex items-center gap-2">
            Toutes les machines
          </h2>
        </div>

        {vmStats.total === 0 ? (
          <div className="text-center py-8 text-muted rounded bg-muted/10">
            <p>Aucune VM trouvée</p>
            {user.role === 'user' &&
            <>
              <a href='/vms' className="text-sm underline text-blue-500 hover:text-blue-700 mt-2">Créez votre première machine virtuelle</a>
            </>}
          </div>
        ) : (
          <div className="space-y-3">
            {vmStats.vms.map(vm => (
              <div key={vm.id} className="bg-background rounded-lg p-4 hover:shadow-md transition-shadow border border-transparent hover:border-primary/20">
                <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
                  <div className="flex-1">
                    <h3 className="font-semibold text-text flex items-center gap-2">
                      {vm.name}
                      <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium ${
                        vm.status === 'running' ? 'bg-success/10 text-success' : 'bg-error/10 text-error'
                      }`}>
                        {vm.status}
                      </span>
                    </h3>
                    <div className="flex flex-wrap gap-4 mt-2 text-sm text-muted">
                      <span>IP: {vm.ip_address || 'N/A'}</span>
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-3 gap-4 text-sm">
                    <div className="text-center p-2 bg-surface rounded">
                      <Cpu className="w-4 h-4 mx-auto mb-1 text-accent" />
                      <p className="text-muted text-xs">CPU</p>
                      <p className="font-medium text-text">{vm.cpu ?? 0}ms</p>
                    </div>
                    <div className="text-center p-2 bg-surface rounded">
                      <Activity className="w-4 h-4 mx-auto mb-1 text-success" />
                      <p className="text-muted text-xs">RAM</p>
                      <p className="font-medium text-text">{vm.memory ?? 0}MB</p>
                    </div>
                    <div className="text-center p-2 bg-surface rounded">
                      <HardDrive className="w-4 h-4 mx-auto mb-1 text-warning" />
                      <p className="text-muted text-xs">Disque</p>
                      <p className="font-medium text-text">
                        {vm.diskUsed?.toFixed(1) ?? '0.0'}GB / {vm.diskTotal ?? vm.disk_size}GB
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </Card>
    </div>
  );
}
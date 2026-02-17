import { useState, useEffect } from 'react';
import { io } from 'socket.io-client';
import { useAuth } from '../../context/AuthContext';
import { Cpu, HardDrive, Activity } from 'lucide-react';
import { Card } from '../ui/Card';

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
    return () => socket.disconnect();
  }, [user?.id]);

  return (
    <div className="space-y-6">
      {user.role === 'user' && (
        <Card>
          <div className="flex items-center justify-between">
            <h2 className="text-2xl font-bold text-text">Bienvenue, <span className='text-primary italic'>{user.name}</span></h2>
          </div>
        </Card>
      )}
      <Card>
        <h2 className="text-2xl font-bold text-text mb-4">État des ressources</h2>
        {vmStats.total === 0 ? (
          <div className="text-center py-8 text-muted bg-muted/10 rounded">
            <p>Aucune VM active</p>
          </div>
        ) : (
          <div className="space-y-3">
            {vmStats.vms.map(vm => (
              <div key={vm.id} className="bg-background/30 rounded-lg p-4 border">
                <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
                  <div className="flex-1">
                    <h3 className="font-semibold text-text flex items-center gap-2">
                      {vm.name}
                      <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${
                        vm.status === 'running' ? 'bg-success/10 text-success' : 'bg-gray-200 text-gray-600'
                      }`}>
                        {vm.status}
                      </span>
                    </h3>
                    <p className="text-xs text-muted mt-1">{vm.ip_address || 'N/A'}</p>
                  </div>
                  <div className="grid grid-cols-3 gap-4 text-sm">
                    <div className="text-center p-2 bg-surface rounded">
                      <Cpu className="w-4 h-4 mx-auto mb-1 text-accent" />
                      <p className="text-muted text-xs">CPU</p>
                      <p className="font-medium text-text text-xs">
                        {vm.status === 'running' ? `${vm.cpu?.usage ?? 0}%` : '-'} / {vm.vcpu?.vcpu ?? 1 } vCPU
                      </p>
                    </div>
                    <div className="text-center p-2 bg-surface rounded">
                      <Activity className="w-4 h-4 mx-auto mb-1 text-success" />
                      <p className="text-muted text-xs">RAM</p>
                      <p className="font-medium text-text text-xs">
                        {vm.status === 'running' ? `${vm.ram?.percent ?? 0}%` : '-'} ({vm.memory} MB)
                      </p>
                    </div>
                    <div className="text-center p-2 bg-surface rounded">
                      <HardDrive className="w-4 h-4 mx-auto mb-1 text-warning" />
                      <p className="text-muted text-xs">Disque</p>
                      <p className="font-medium text-text text-xs">
                        {vm.status === 'running' ? `${vm.disk?.percent ?? 0}%` : '-'} ({vm.disk_size} GB)
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
        {user.role === 'user' && (
          <div className='text-center mt-4 text-blue-700 underline hover:text-blue-900'>
            <a href="/vms">Créer une nouvelle VM</a>
          </div>
        )}
      </Card>
    </div>
  );
}
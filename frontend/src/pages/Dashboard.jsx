import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import AdminMonitoring from '../components/monitoring/AdminMonitoring';
import UserMonitoring from '../components/monitoring/UserMonitoring';
import API from '../services/api';

export default function Dashboard() {
  const { user } = useAuth();
  const [vmStats, setVmStats] = useState({ total: 0, running: 0 });

  // ✅ Récupérer les stats des VMs
  useEffect(() => {
    const fetchVMStats = async () => {
      try {
        const { data } = await API.get('/vms');
        const vms = data.vms || [];
        const runningCount = vms.filter(vm => vm.status === 'running').length;
        setVmStats({ total: vms.length, running: runningCount });
      } catch (err) {
        console.error('Erreur chargement stats VMs:', err);
      }
    };

    fetchVMStats();
    // Rafraîchir toutes les 30s
    const interval = setInterval(fetchVMStats, 30000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="space-y-6">
      {user?.role === 'admin' ? (
        <>
          <AdminMonitoring />
          <UserMonitoring />
        </>
      ) : (
        <UserMonitoring />
      )}
    </div>
  );
}
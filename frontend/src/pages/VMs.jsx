import { useState, useEffect } from 'react';
import API from '../services/api';
import { useAuth } from '../context/AuthContext';
import { Toaster, toast } from 'react-hot-toast';
import OSVersionPicker from '../components/OSVersionPicker';

const statusColors = {
  creating: 'bg-yellow-100 text-yellow-800',
  pending: 'bg-gray-100 text-gray-800',
  running: 'bg-green-100 text-green-800',
  stopped: 'bg-red-100 text-red-800',
  error: 'bg-red-100 text-red-600',
  deleting: 'bg-orange-100 text-orange-800'
};

export default function VMs() {
  const { user } = useAuth();
  const [vms, setVms] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showCreate, setShowCreate] = useState(false);
  const [form, setForm] = useState({ name: '', os_type: '', version: '', vcpu: 1, memory: 512, disk_size: 10 });

  const fetchVMs = async () => {
    try {
      const { data } = await API.get('/vms');
      setVms(data.vms);
    } catch {
      toast.error('Erreur chargement VMs');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchVMs();
    const interval = setInterval(fetchVMs, 30000);
    return () => clearInterval(interval);
  }, []);

  const createVM = async (e) => {
    e.preventDefault();
    try {
      await API.post('/vms', form);
      setShowCreate(false);
      setForm({ name: '', os_type: '', version: '', vcpu: 1, memory: 512, disk_size: 10 });
      setTimeout(fetchVMs, 2000);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Erreur');
    }
  };

  const deleteVM = async (id) => {
    if (!confirm('Supprimer ?')) return;
    await API.delete(`/vms/${id}`);
    fetchVMs();
  };

  const actionVM = async (id, action) => {
    await API.post(`/vms/${id}/action`, { action });
    setTimeout(fetchVMs, 1000);
  };

  if (!user) return <div className="p-4">Non authentifié</div>;

  return (
    <div className="container mt-8">
      <Toaster position="top-right" />
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-2xl font-bold">{user.role === 'admin' ? 'Toutes les VMs' : 'Mes VMs'}</h2>
        {user.role === 'user' && (
          <button onClick={() => setShowCreate(true)} className="px-3 py-1 bg-green-600 text-white rounded hover:bg-green-700">+ Créer VM</button>
        )}
      </div>

      {loading ? (
        <p>Chargement...</p>
      ) : (
        <div className="bg-white rounded shadow overflow-x-auto">
          <table className="w-full">
            <thead className="bg-slate-100">
              <tr>
                <th className="p-2 text-left">Nom</th>
                <th className="p-2 text-left">IP</th>
                <th className="p-2 text-left">Statut</th>
                <th className="p-2 text-left">Actions</th>
              </tr>
            </thead>
            <tbody>
              {vms.map(vm => (
                <tr key={vm.id} className="border-t">
                  <td className="p-2">{vm.name}</td>
                  <td className="p-2">{vm.ip_address || 'N/A'}</td>
                  <td className="p-2"><span className={`px-2 py-1 rounded-full text-xs ${statusColors[vm.status]}`}>{vm.status}</span></td>
                  <td className="p-2">
                    <div className="flex gap-2">
                      {vm.status === 'running' && (
                        <>
                          <button onClick={() => actionVM(vm.id, 'reboot')} className="px-2 py-1 bg-yellow-600 text-white rounded text-xs">Reboot</button>
                          <button onClick={() => actionVM(vm.id, 'stop')} className="px-2 py-1 bg-red-600 text-white rounded text-xs">Stop</button>
                        </>
                      )}
                      {vm.status === 'stopped' && (
                        <button onClick={() => actionVM(vm.id, 'start')} className="px-2 py-1 bg-green-600 text-white rounded text-xs">Start</button>
                      )}
                      <button onClick={() => deleteVM(vm.id)} disabled={vm.status === 'deleting'} className="px-2 py-1 bg-gray-800 text-white rounded text-xs disabled:opacity-50">Supprimer</button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {showCreate && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-lg max-w-2xl w-full p-6">
            <h2 className="text-xl font-bold mb-4">Créer VM</h2>
            <form onSubmit={createVM} className="space-y-4">
              <input placeholder="Nom VM" value={form.name} onChange={e => setForm({...form, name: e.target.value})} className="w-full p-2 border rounded" required />
              <OSVersionPicker value={`${form.os_type}:${form.version}`} onChange={({os_type, version, ext}) => setForm({...form, os_type, version, ext})} />
              <div className="grid grid-cols-3 gap-4">
                <input type="number" placeholder="vCPU" value={form.vcpu} onChange={e => setForm({...form, vcpu: +e.target.value})} className="p-2 border rounded" />
                <input type="number" placeholder="RAM (MB)" value={form.memory} onChange={e => setForm({...form, memory: +e.target.value})} className="p-2 border rounded" />
                <input type="number" placeholder="Disque (GB)" value={form.disk_size} onChange={e => setForm({...form, disk_size: +e.target.value})} className="p-2 border rounded" />
              </div>
              <div className="flex gap-2 justify-end">
                <button type="button" onClick={() => setShowCreate(false)} className="px-4 py-2 bg-slate-100 rounded">Annuler</button>
                <button type="submit" className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700">Créer</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
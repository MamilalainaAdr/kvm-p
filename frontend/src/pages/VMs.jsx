import React, { useEffect, useState } from 'react';
import API from '../services/api';
import { useAuth } from '../context/AuthContext';
import { Toaster, toast } from 'react-hot-toast';
import SimpleModal from '../components/SimpleModal';
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
  const [createOpen, setCreateOpen] = useState(false);
  const [form, setForm] = useState({ 
    name: '', 
    os_type: '', 
    version: '', 
    vcpu: 1, 
    memory: 512, 
    disk_size: 10 
  });

  useEffect(() => {
    fetchVMs();
    const interval = setInterval(fetchVMs, 30000); // 30s seulement
    return () => clearInterval(interval);
  }, []);

  const fetchVMs = async () => {
    try {
      const { data } = await API.get('/vms');
      setVms(data.vms || []);
    } catch (err) {
      toast.error('Erreur chargement VMs');
    } finally {
      setLoading(false);
    }
  };

  const createVM = async (e) => {
    e.preventDefault();
    if (!form.name || !form.os_type || !form.version) {
      toast.error('Tous les champs sont requis');
      return;
    }

    try {
      toast.loading('Création en cours...', { id: 'create-vm' });
      const { data } = await API.post('/vms', form);
      toast.success(data.message, { id: 'create-vm' });
      
      setCreateOpen(false);
      setForm({ name: '', os_type: '', version: '', vcpu: 1, memory: 512, disk_size: 10 });
      setTimeout(fetchVMs, 2000);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Erreur', { id: 'create-vm' });
    }
  };

  const deleteVM = async (id) => {
    if (!confirm('Supprimer cette VM ?')) return;
    try {
      toast.loading('Suppression...', { id: 'delete-vm' });
      const { data } = await API.delete(`/vms/${id}`);
      toast.success(data.message, { id: 'delete-vm' });
      fetchVMs();
    } catch (err) {
      toast.error('Erreur', { id: 'delete-vm' });
    }
  };

  const performAction = async (vmId, action) => {
    const actions = { start: 'démarrage', stop: 'arrêt', reboot: 'redémarrage' };
    try {
      await toast.promise(
        API.post(`/vms/${vmId}/action`, { action }),
        {
          loading: `${actions[action]} en cours...`,
          success: `${actions[action]} effectué`,
          error: `Erreur lors du ${actions[action]}`
        }
      );
      setTimeout(fetchVMs, 1000);
    } catch (err) {
      console.error(`Action ${action} error:`, err);
    }
  };

  if (!user) return <div className="container mt-8">Non authentifié</div>;

  return (
    <div className="container mt-8">
      <Toaster position="top-right" />
      
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-2xl font-bold">Machines Virtuelles</h2>
        {user.role === 'user' && (
          <button 
            onClick={() => setCreateOpen(true)}
            className="flex items-center gap-2 bg-green-600 text-white px-3 py-1 rounded hover:bg-green-700"
          >
            <span className="text-lg font-bold">+</span> Créer
          </button>
        )}
      </div>

      {loading ? (
        <div className="text-center py-8">Chargement...</div>
      ) : (
        <div className="grid grid-cols-1 gap-4">
          {vms.length > 0 ? (
            <div className="bg-white p-4 rounded shadow overflow-x-auto">
              <table className="w-full text-left">
                <thead className="bg-slate-100">
                  <tr>
                    <th className="p-2">Nom</th>
                    <th className="p-2">IP</th>
                    <th className="p-2">Statut</th>
                    <th className="p-2">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {vms.map(vm => (
                    <tr key={vm.id} className="border-t">
                      <td className="p-2 font-medium">{vm.name}</td>
                      <td className="p-2">{vm.ip_address || 'N/A'}</td>
                      <td className="p-2">
                        <span className={`inline-block px-2 py-1 rounded-full text-xs ${statusColors[vm.status] || statusColors.error}`}>
                          {vm.status}
                        </span>
                      </td>
                      <td className="p-2">
                        <div className="flex gap-2">
                          {vm.status === 'running' && (
                            <>
                              <button className="px-2 py-1 bg-yellow-600 text-white rounded text-xs hover:bg-yellow-700"
                                onClick={() => performAction(vm.id, 'reboot')}>Reboot</button>
                              <button className="px-2 py-1 bg-red-600 text-white rounded text-xs hover:bg-red-700"
                                onClick={() => performAction(vm.id, 'stop')}>Stop</button>
                            </>
                          )}
                          {vm.status === 'stopped' && (
                            <button className="px-2 py-1 bg-green-600 text-white rounded text-xs hover:bg-green-700"
                              onClick={() => performAction(vm.id, 'start')}>Start</button>
                          )}
                          <button className="px-2 py-1 bg-red-800 text-white rounded text-xs hover:bg-red-900 disabled:opacity-50"
                            onClick={() => deleteVM(vm.id)} disabled={vm.status === 'deleting'}>
                            {vm.status === 'deleting' ? 'Suppression...' : 'Supprimer'}
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="bg-white p-4 rounded shadow text-center text-slate-500">
              Aucune VM créée
            </div>
          )}
        </div>
      )}

      <SimpleModal open={createOpen} title="Créer une VM" onClose={() => setCreateOpen(false)}>
        <form onSubmit={createVM} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Nom</label>
            <input className="w-full p-2 border border-slate-300 rounded focus:ring-2 focus:ring-green-500"
              placeholder="ma-vm" value={form.name} onChange={e => setForm({...form, name: e.target.value})} required />
          </div>

          <OSVersionPicker value={`${form.os_type}:${form.version}`} onChange={({os_type, version}) => {
            setForm({...form, os_type, version});
          }} />

          <div className="grid grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">vCPU</label>
              <input type="number" min="1" className="w-full p-2 border border-slate-300 rounded focus:ring-2 focus:ring-green-500"
                value={form.vcpu} onChange={e => setForm({...form, vcpu: parseInt(e.target.value || 1)})} />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">RAM (MB)</label>
              <input type="number" min="512" className="w-full p-2 border border-slate-300 rounded focus:ring-2 focus:ring-green-500"
                value={form.memory} onChange={e => setForm({...form, memory: parseInt(e.target.value || 512)})} />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Disque (GB)</label>
              <input type="number" min="10" className="w-full p-2 border border-slate-300 rounded focus:ring-2 focus:ring-green-500"
                value={form.disk_size} onChange={e => setForm({...form, disk_size: parseInt(e.target.value || 10)})} />
            </div>
          </div>

          <div className="flex gap-2 justify-end pt-4 border-t">
            <button type="button" onClick={() => setCreateOpen(false)} 
              className="px-4 py-2 bg-slate-100 text-slate-700 rounded hover:bg-slate-200">Annuler</button>
            <button type="submit" className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700">Créer</button>
          </div>
        </form>
      </SimpleModal>
    </div>
  );
}
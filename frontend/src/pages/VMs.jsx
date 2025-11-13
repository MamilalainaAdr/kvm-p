import React, { useEffect, useState } from 'react';
import API from '../services/api';
import { useAuth } from '../context/AuthContext';
import SimpleModal from '../components/SimpleModal'; // CHANGE ICI
import toast from 'react-hot-toast';

const statusColors = {
  creating: 'bg-yellow-100 text-yellow-800',
  pending: 'bg-gray-100 text-gray-800',
  running: 'bg-green-100 text-green-800',
  stopped: 'bg-red-100 text-red-800',
  error: 'bg-red-100 text-red-600',
  deleting: 'bg-orange-100 text-orange-800'
};

export default function VMs() {
  const { user, loading: authLoading } = useAuth();
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

  // Debug log
  useEffect(() => {
    console.log('VMs component - User:', user, 'Auth loading:', authLoading);
  }, [user, authLoading]);

  // Polling
  useEffect(() => {
    if (!authLoading && user) {
      fetchVMs();
      const interval = setInterval(fetchVMs, 10000);
      return () => clearInterval(interval);
    }
  }, [authLoading, user]);

  const fetchVMs = async () => {
    try {
      setLoading(true);
      const { data } = await API.get('/vms');
      setVms(data.vms || []);
    } catch (err) {
      console.error('Failed to fetch VMs:', err);
      toast.error('Erreur chargement VMs');
    } finally {
      setLoading(false);
    }
  };

  const createVM = async (e) => {
    e.preventDefault();
    
    // Validation
    if (!form.name || !form.os_type || !form.version) {
      toast.error('Tous les champs sont requis');
      return;
    }

    try {
      // Toast de chargement
      const loadingToast = toast.loading('Création de la VM en cours...');
      
      const { data } = await API.post('/vms', form);
      
      // Fermer le toast de chargement
      toast.dismiss(loadingToast);
      
      // ✅ NOTIFIER ET FERMER DANS LE BON ORDRE
      toast.success(data.message || 'VM créée avec succès');
      
      // Fermer le modal
      setCreateOpen(false);
      
      // Réinitialiser le formulaire
      setForm({ name: '', os_type: '', version: '', vcpu: 1, memory: 512, disk_size: 10 });
      
      // Rafraîchir
      setTimeout(fetchVMs, 2000);
      
    } catch (err) {
      console.error('Create VM error:', err);
      toast.error(err.response?.data?.message || 'Erreur création VM');
    }
  };

  const deleteVM = async (id) => {
    if (!confirm('Supprimer cette VM ?')) return;
    
    try {
      const { data } = await API.delete(`/vms/${id}`);
      toast.success(data.message || 'VM supprimée');
      fetchVMs();
    } catch (err) {
      toast.error('Erreur suppression VM');
    }
  };

  const performAction = async (vmId, action) => {
    try {
      const actions = { start: 'démarrage', stop: 'arrêt', reboot: 'redémarrage' };
      
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

  if (authLoading) {
    return <div className="container mt-8">Chargement utilisateur...</div>;
  }

  if (!user) {
    return <div className="container mt-8">Erreur: Non authentifié</div>;
  }

  const [stableStatuses, setStableStatuses] = useState({});

  useEffect(() => {
    // Sauvegarder les statuts des VMs en cours
    vms.forEach(vm => {
      if (vm.status === 'running') {
        setStableStatuses(prev => ({ ...prev, [vm.id]: 'running' }));
      }
    });
  }, [vms]);

  return (
    <div className="container mt-8">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-2xl font-bold">Machines Virtuelles</h2>
        {user?.role !== 'admin' && (
          <button 
            onClick={() => {
              console.log('Opening modal - before:', createOpen);
              setCreateOpen(true);
            }} 
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
                        <span className={`inline-block px-2 py-1 rounded-full text-xs ${statusColors[vm.status] || (stableStatuses[vm.id] ? statusColors['running'] : statusColors['error'])}`}>
                          {vm.status === 'unknown' && stableStatuses[vm.id] ? 'running (vérification...)' : vm.status}
                        </span>
                      </td>
                      <td className="p-2">
                        <div className="flex gap-2">
                          {vm.status === 'running' && (
                            <>
                              <button 
                                className="px-2 py-1 bg-yellow-600 text-white rounded text-xs hover:bg-yellow-700"
                                onClick={() => performAction(vm.id, 'reboot')}
                              >
                                Redémarrer
                              </button>
                              <button 
                                className="px-2 py-1 bg-red-600 text-white rounded text-xs hover:bg-red-700"
                                onClick={() => performAction(vm.id, 'stop')}
                              >
                                Stop
                              </button>
                            </>
                          )}
                          {vm.status === 'stopped' && (
                            <button 
                              className="px-2 py-1 bg-green-600 text-white rounded text-xs hover:bg-green-700"
                              onClick={() => performAction(vm.id, 'start')}
                            >
                              Démarrer
                            </button>
                          )}
                          <button 
                            className="px-2 py-1 bg-red-800 text-white rounded text-xs hover:bg-red-900 disabled:opacity-50"
                            onClick={() => deleteVM(vm.id)}
                            disabled={vm.status === 'deleting'}
                          >
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

      {/* ✅ SIMPLEMODAL AU LIEU DE MODAL */}
      <SimpleModal open={createOpen} title="Créer une VM" onClose={() => {
        console.log('Fermeture modal');
        setCreateOpen(false);
      }}>
        <form onSubmit={createVM} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Nom</label>
            <input 
              className="w-full p-2 border border-slate-300 rounded focus:outline-none focus:ring-2 focus:ring-green-500"
              placeholder="ma-vm" 
              value={form.name} 
              onChange={e => setForm({...form, name: e.target.value})}
              required 
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">OS (ex: ubuntu, debian)</label>
            <input 
              className="w-full p-2 border border-slate-300 rounded focus:outline-none focus:ring-2 focus:ring-green-500"
              placeholder="ubuntu" 
              value={form.os_type} 
              onChange={e => setForm({...form, os_type: e.target.value})}
              required 
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Version (ex: 2404, 12)</label>
            <input 
              className="w-full p-2 border border-slate-300 rounded focus:outline-none focus:ring-2 focus:ring-green-500"
              placeholder="2404" 
              value={form.version} 
              onChange={e => setForm({...form, version: e.target.value})}
              required 
            />
          </div>

          <div className="grid grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">vCPU</label>
              <input 
                type="number" 
                min="1"
                className="w-full p-2 border border-slate-300 rounded focus:outline-none focus:ring-2 focus:ring-green-500"
                value={form.vcpu} 
                onChange={e => setForm({...form, vcpu: parseInt(e.target.value || 1)})}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">RAM (MB)</label>
              <input 
                type="number" 
                min="512"
                className="w-full p-2 border border-slate-300 rounded focus:outline-none focus:ring-2 focus:ring-green-500"
                value={form.memory} 
                onChange={e => setForm({...form, memory: parseInt(e.target.value || 512)})}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Disque (GB)</label>
              <input 
                type="number" 
                min="10"
                className="w-full p-2 border border-slate-300 rounded focus:outline-none focus:ring-2 focus:ring-green-500"
                value={form.disk_size} 
                onChange={e => setForm({...form, disk_size: parseInt(e.target.value || 10)})}
              />
            </div>
          </div>

          <div className="flex gap-2 justify-end pt-4 border-t">
            <button 
              type="button" 
              onClick={() => setCreateOpen(false)} 
              className="px-4 py-2 bg-slate-100 text-slate-700 rounded hover:bg-slate-200"
            >
              Annuler
            </button>
            <button 
              type="submit" 
              className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700"
            >
              Créer la VM
            </button>
          </div>
        </form>
      </SimpleModal>
    </div>
  );
}
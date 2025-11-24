import { useState, useEffect } from 'react';
import API from '../services/api';
import { useAuth } from '../context/AuthContext';
import { Toaster, toast } from 'react-hot-toast';
import OSVersionPicker from '../components/OSVersionPicker';
import ConfirmModal from '../components/ConfirmModal';
import PlanSelector from '../components/PlanSelector';

const statusColors = {
  creating: 'bg-yellow-100 text-yellow-800',
  pending: 'bg-gray-100 text-gray-800',
  running: 'bg-green-100 text-green-800',
  stopped: 'bg-red-100 text-red-800',
  'shut off' : 'bg-gray-100 text-gray-800',
  error: 'bg-red-100 text-red-600',
  deleting: 'bg-orange-100 text-orange-800'
};

export default function VMs() {
  const { user } = useAuth();
  const [vms, setVms] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showCreate, setShowCreate] = useState(false);
  const [step, setStep] = useState(1);
  const [selectedPlan, setSelectedPlan] = useState(null);
  const [form, setForm] = useState({ 
    name: '', 
    os_type: '', 
    version: '', 
    vcpu: 1, 
    memory: 512, 
    disk_size: 10 
  });
  const [actionConfirm, setActionConfirm] = useState({ open: false, action: null, vmId: null });

  // ✅ CORRECTION : Définir selectPlan À L'INTÉRIEUR du composant
  const selectPlan = (plan) => {
    setSelectedPlan(plan);
    setForm(prevForm => ({ 
      ...prevForm,  // ✅ Utiliser la forme fonctionnelle pour éviter les problèmes de fermeture
      vcpu: plan.vcpu, 
      memory: plan.memory, 
      disk_size: plan.disk 
    }));
  };

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

  const nextStep = () => {
    if (!selectedPlan) {
      toast.error('Veuillez sélectionner un plan');
      return;
    }
    setStep(2);
  };

  const createVM = async (e) => {
    e.preventDefault();
    
    // ✅ VALIDATION complète avant envoi
    if (!form.name || !form.os_type || !form.version) {
      toast.error('Veuillez remplir tous les champs obligatoires');
      return;
    }
    
    // ✅ Debug log
    console.log('Création VM avec données:', form);
    
    try {
      await API.post('/vms', form);
      setShowCreate(false);
      setStep(1);
      setSelectedPlan(null);
      setForm({ name: '', os_type: '', version: '', vcpu: 1, memory: 512, disk_size: 10 });
      setTimeout(fetchVMs, 2000);
      toast.success('VM en cours de création');
    } catch (err) {
      console.error('Erreur création VM:', err.response?.data || err);
      toast.error(err.response?.data?.message || 'Erreur lors de la création');
    }
  };

  const deleteVM = async (id) => {
    setActionConfirm({ open: true, action: 'delete', vmId: id });
  };

  const confirmDelete = async () => {
    await API.delete(`/vms/${actionConfirm.vmId}`);
    setActionConfirm({ open: false, action: null, vmId: null });
    fetchVMs();
  };

  const actionVM = async (id, action) => {
    setActionConfirm({ open: true, action, vmId: id });
  };

  const confirmAction = async () => {
    await API.post(`/vms/${actionConfirm.vmId}/action`, { action: actionConfirm.action });
    setActionConfirm({ open: false, action: null, vmId: null });
    setTimeout(fetchVMs, 1000);
  };

  if (!user) return <div className="p-4">Non authentifié</div>;

  return (
    <>
      <ConfirmModal
        isOpen={actionConfirm.open}
        onClose={() => setActionConfirm({ open: false, action: null, vmId: null })}
        onConfirm={actionConfirm.action === 'delete' ? confirmDelete : confirmAction}
        title={`Confirmer ${actionConfirm.action === 'delete' ? 'la suppression' : 'l\'action'}`}
        message={`Êtes-vous sûr de vouloir ${actionConfirm.action === 'delete' ? 'supprimer' : actionConfirm.action} cette VM ?`}
      />

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
                  <tr key={vm.id} className="border-t hover:bg-slate-50">
                    <td className="p-2">{vm.name}</td>
                    <td className="p-2">{vm.ip_address || 'N/A'}</td>
                    <td className="p-2">
                      <span className={`px-2 py-1 rounded-full text-xs ${statusColors[vm.status]}`}>
                        {vm.status}
                      </span>
                    </td>
                    <td className="p-2">
                      <div className="flex gap-2">
                        {vm.status?.toLowerCase() === 'running' && (
                          <>
                            <button onClick={() => actionVM(vm.id, 'reboot')} className="px-2 py-1 bg-yellow-600 text-white rounded text-xs hover:bg-yellow-700">Reboot</button>
                            <button onClick={() => actionVM(vm.id, 'stop')} className="px-2 py-1 bg-red-600 text-white rounded text-xs hover:bg-red-700">Stop</button>
                          </>
                        )}
                        {vm.status?.toLowerCase() === 'stopped' || vm.status?.toLowerCase() === 'shut off' && (
                          <button onClick={() => actionVM(vm.id, 'start')} className="px-2 py-1 bg-green-600 text-white rounded text-xs hover:bg-green-700">Start</button>
                        )}
                        <button onClick={() => deleteVM(vm.id)} disabled={vm.status === 'deleting'} className="px-2 py-1 bg-gray-800 text-white rounded text-xs hover:bg-gray-900 disabled:opacity-50">Supprimer</button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {showCreate && (
          <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
            <div className="bg-white rounded-lg max-w-4xl w-full p-6 max-h-screen overflow-y-auto">
              <h2 className="text-xl font-bold mb-4">Créer une VM - Étape {step}/2</h2>
              
              {step === 1 && (
                <>
                  <p className="text-gray-600 mb-4">Sélectionnez un plan :</p>
                  <PlanSelector selectedPlan={selectedPlan} onSelect={selectPlan} />
                  <div className="flex gap-2 justify-end mt-6">
                    <button onClick={() => setShowCreate(false)} className="px-4 py-2 bg-slate-100 rounded hover:bg-slate-200">Annuler</button>
                    <button onClick={nextStep} className="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700">Suivant</button>
                  </div>
                </>
              )}

              {step === 2 && selectedPlan && (
                <>
                  <div className="bg-slate-50 rounded-lg mb-4">
                    <h3 className="font-bold text-lg text-red-600 mb-2">{selectedPlan.name}</h3>
                    <div className="grid grid-cols-3 gap-4 text-sm">
                      <div className="text-center p-2 bg-slate-100 border-slate-200 border">
                        <p className="text-gray-500">VCPU</p>
                        <p className="font-bold">{selectedPlan.vcpu}</p>
                      </div>
                      <div className="text-center p-2 bg-slate-100 border-slate-200 border">
                        <p className="text-gray-500">RAM</p>
                        <p className="font-bold">{selectedPlan.memory} Mo</p>
                      </div>
                      <div className="text-center p-2 bg-slate-100 border-slate-200 border">
                        <p className="text-gray-500">Disque</p>
                        <p className="font-bold">{selectedPlan.disk} Go</p>
                      </div>
                    </div>
                  </div>

                  <form onSubmit={createVM} className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium mb-1">Nom de la VM *</label>
                      <input 
                        placeholder="nom-de-la-vm" 
                        value={form.name} 
                        onChange={e => setForm({...form, name: e.target.value})} 
                        className="w-full p-2 border rounded" 
                        required 
                        pattern="[a-z0-9-]+"
                        title="Uniquement des lettres minuscules, chiffres et tirets"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium mb-1">Système d'exploitation *</label>
                      <OSVersionPicker 
                        value={form.os_type && form.version ? `${form.os_type}:${form.version}` : ''} 
                        onChange={({os_type, version, ext}) => setForm({...form, os_type, version, ext})} 
                      />
                    </div>

                    <div className="flex gap-2 justify-end">
                      <button type="button" onClick={() => setStep(1)} className="px-4 py-2 bg-slate-100 rounded hover:bg-slate-200">Précédent</button>
                      <button type="submit" className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700">Créer la VM</button>
                    </div>
                  </form>
                </>
              )}
            </div>
          </div>
        )}
      </div>
    </>
  );
}
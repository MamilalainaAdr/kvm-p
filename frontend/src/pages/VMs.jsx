import { useState, useEffect } from 'react';
import API from '../services/api';
import { useAuth } from '../context/AuthContext';
import { 
  Play, RotateCw, Trash2, Plus, Power, Settings, Download
} from 'lucide-react';
import { Button } from '../components/ui/Button';
import { Modal } from '../components/ui/Modal';
import { Card } from '../components/ui/Card';
import { Input } from '../components/ui/Input';
import OSVersionPicker from '../components/OSVersionPicker';
import PlanSelector from '../components/PlanSelector';
import toast from 'react-hot-toast';

// Styles des badges de statut alignés sur le backend et le design
const statusColors = {
  creating: 'bg-warning/20 text-warning',
  pending: 'bg-gray-200 text-gray-600',
  running: 'bg-success/20 text-success',
  stopped: 'bg-error/20 text-error',
  'shut off': 'bg-gray-200 text-gray-600',
  error: 'bg-error text-white',
  deleting: 'bg-red-900 text-white',
};

export default function VMs() {
  const { user } = useAuth();
  const [vms, setVms] = useState([]);
  
  // États Modals
  const [showCreate, setShowCreate] = useState(false);
  const [step, setStep] = useState(1);
  const [selectedPlan, setSelectedPlan] = useState(null);
  const [updateModal, setUpdateModal] = useState({ open: false, vm: null });
  const [actionConfirm, setActionConfirm] = useState({ open: false, action: null, vmId: null });

  // États Formulaires
  // Utilisation de 'createForm' pour coller au style du premier exemple
  const [createForm, setCreateForm] = useState({ name: '', os_type: '', version: '', vcpu: 1, memory: 512, disk_size: 10 });
  // Utilisation de 'updateForm' avec disk_size, selon la logique du deuxième exemple
  const [updateForm, setUpdateForm] = useState({ vcpu: 1, memory: 512, disk_size: 10 }); 

  const fetchVMs = async () => {
    try {
      const { data } = await API.get('/vms');
      setVms(data.vms);
    } catch (err) {
      // Géré par l'interceptor API (ou laisser vide si l'interceptor gère le toast)
    }
  };

  useEffect(() => {
    fetchVMs();
    const interval = setInterval(fetchVMs, 10000); // Polling toutes les 10s (comme le 1er ex.)
    return () => clearInterval(interval);
  }, []);

  // --- Logique Création ---
  const handleSelectPlan = (plan) => { // Renommée pour coller au style du 1er ex.
    setSelectedPlan(plan);
    setCreateForm(prev => ({ 
      ...prev, 
      vcpu: plan.vcpu, 
      memory: plan.memory, 
      disk_size: plan.disk 
    }));
  };

  const submitCreate = async (e) => { // Renommée pour coller au style du 1er ex.
    e.preventDefault();
    if (!createForm.name || !createForm.os_type || !createForm.version) return toast.error('Veuillez remplir tous les champs'); // Vérification complète

    try {
      await API.post('/vms', createForm);
      setShowCreate(false);
      setStep(1);
      setSelectedPlan(null); // Reset Plan
      setCreateForm({ name: '', os_type: '', version: '', vcpu: 1, memory: 512, disk_size: 10 });
      toast.success('Création de la VM initiée');
      setTimeout(fetchVMs, 1000); // Rafraîchissement rapide après action
    } catch (err) {
      toast.error(err.response?.data?.message || 'Erreur création');
    }
  };

  // --- Logique Mise à jour ---
  const openUpdateModal = (vm) => {
    setUpdateModal({ open: true, vm });
    // Pré-remplir avec les valeurs actuelles, y compris disk_size (selon le 2ème ex.)
    setUpdateForm({ vcpu: vm.vcpu, memory: vm.memory, disk_size: vm.disk_size });
  };

  const submitUpdate = async (e) => {
    e.preventDefault();
    try {
      // Utilisation de la route du 2ème exemple pour mettre à jour les ressources
      await API.put(`/vms/${updateModal.vm.id}`, updateForm); 
      setUpdateModal({ open: false, vm: null });
      toast.success('Mise à jour demandée.');
      setTimeout(fetchVMs, 1000); // Rafraîchissement rapide
    } catch (err) {
      toast.error(err.response?.data?.message || 'Erreur mise à jour');
    }
  };

  // --- Logique Actions & Clés ---
  const confirmAction = async () => {
    const ep = actionConfirm.action === 'delete' ? '' : '/action';
    const method = actionConfirm.action === 'delete' ? 'delete' : 'post';
    const url = `/vms/${actionConfirm.vmId}${ep}`;
    const body = actionConfirm.action === 'delete' ? {} : { action: actionConfirm.action };

    try {
      if (method === 'delete') await API.delete(url);
      else await API.post(url, body);
      toast.success(`Action ${actionConfirm.action} lancée`);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Erreur action');
    } finally {
      setActionConfirm({ open: false, action: null, vmId: null });
      setTimeout(fetchVMs, 1000); // Rafraîchissement rapide après action
    }
  };

  const downloadSSHKey = (keyContent, vmName) => { // Renommée pour coller au style du 1er ex.
    if (!keyContent) return toast.error("Aucune clé disponible");
    const element = document.createElement("a");
    const file = new Blob([keyContent], {type: 'text/plain'});
    element.href = URL.createObjectURL(file);
    element.download = `${vmName}-ssh-key.pem`;
    document.body.appendChild(element);
    element.click();
    document.body.removeChild(element);
    toast.success("Clé téléchargée");
  };

  return (
    <div className="space-y-6">
      <Card>
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-6">
          <h1 className="text-2xl font-bold text-text flex items-center gap-2">
            Gestion des Machines
          </h1>
          {user.role === 'user' && (
            <Button onClick={() => setShowCreate(true)} title="Nouvelle VM">
              <Plus className="w-4 h-4" />
            </Button>
          )}
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left">
            <thead className="bg-background uppercase text-muted font-bold text-xs">
              <tr>
                <th className="p-3 rounded-tl-lg">Nom</th>
                <th className="p-3">IP & OS</th>
                <th className="p-3">Ressources</th>
                <th className="p-3 text-center">Clé SSH</th>
                <th className="p-3">État</th>
                <th className="p-3 rounded-tr-lg">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {vms.map(vm => (
                <tr key={vm.id} className="hover:bg-gray-50 transition-colors">
                  <td className="p-3 font-medium text-text">{vm.name}</td>
                  <td className="p-3">
                    <div className="flex flex-col">
                      <span className="font-mono text-xs">{vm.ip_address || '...'}</span>
                      <span className="text-xs text-muted">{vm.os_type} {vm.version}</span>
                    </div>
                  </td>
                  <td className="p-3 text-xs text-muted">
                    {vm.vcpu} vCPU <br/> {vm.memory} Mo RAM <br/> {vm.disk_size} Go Disk
                  </td>
                  <td className="p-3 text-center">
                    {vm.ssh_key ? (
                      <Button 
                        variant="primary" // Style personnalisé du 1er ex.
                        size="sm" 
                        onClick={() => downloadSSHKey(vm.ssh_key, vm.name)}
                        title="Télécharger la clé privée"
                        className="flex items-center gap-1 text-white"
                      >
                        <Download className="w-4 h-4" />
                        Télécharger
                      </Button>
                    ) : (
                      <span className="text-xs text-gray-300">-</span>
                    )}
                  </td>
                  <td className="p-3">
                    <span className={`px-2 py-1 rounded-full text-xs font-bold ${statusColors[vm.status] || 'bg-gray-200'}`}>
                      {vm.status}
                    </span>
                  </td>
                  <td className="p-3">
                    <div className="flex items-center gap-2">
                      {/* Actions Power */}
                      {vm.status === 'running' && (
                        <>
                          <button 
                            onClick={() => openUpdateModal(vm)}
                            className="p-1.5 text-blue-800 hover:bg-blue-100 rounded border border-blue-500"
                            title="Modifier les ressources"
                          >
                            <Settings className="w-4 h-4" />
                          </button>
                          <button onClick={() => setActionConfirm({ open: true, action: 'reboot', vmId: vm.id })} className="p-1.5 text-yellow-800 hover:bg-yellow-200 rounded border border-yellow-500" title="Redémarrer">
                            <RotateCw className="w-4 h-4" />
                          </button>
                          <button onClick={() => setActionConfirm({ open: true, action: 'stop', vmId: vm.id })} className="p-1.5 text-red-800 hover:bg-red-200 rounded border border-red-500" title="Arrêter">
                            <Power className="w-4 h-4" />
                          </button>
                          <button 
                            onClick={() => setActionConfirm({ open: true, action: 'delete', vmId: vm.id })} 
                            className="p-1.5 text-gray-800 hover:bg-gray-100 rounded border border-gray-500"
                            title="Supprimer"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </>
                      )}
                      {(vm.status === 'stopped' || vm.status === 'shut off') && (
                        <button onClick={() => setActionConfirm({ open: true, action: 'start', vmId: vm.id })} className="p-1.5 text-green-800 hover:bg-green-100 rounded border border-green-500" title="Démarrer">
                          <Play className="w-4 h-4" />
                        </button>
                      )}
                                            
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {vms.length === 0 && <div className="text-center py-8 text-muted">Aucune machine virtuelle trouvée.</div>}
        </div>
      </Card>

      {/* --- Modal Création --- */}
      <Modal
        isOpen={showCreate}
        onClose={() => { setShowCreate(false); setStep(1); setSelectedPlan(null); }}
        title={`Créer une VM - Étape ${step}/2`}
        size="lg"
      >
        {step === 1 && (
          <div className="space-y-4">
            <p className="text-sm text-muted">Choisissez une configuration de départ :</p>
            <PlanSelector selectedPlan={selectedPlan} onSelect={handleSelectPlan} />
            <div className="flex justify-end mt-6">
              <Button onClick={() => selectedPlan ? setStep(2) : toast.error('Sélectionnez un plan')} disabled={!selectedPlan}>
                Suivant
              </Button>
            </div>
          </div>
        )}

        {step === 2 && (
          <form onSubmit={submitCreate} className="space-y-6">
            <div className="grid grid-cols-3 gap-4 text-center mb-6 bg-gray-50 p-4 rounded-lg">
              <div><p className="text-xs text-muted">vCPU</p><p className="font-bold">{createForm.vcpu}</p></div>
              <div><p className="text-xs text-muted">RAM</p><p className="font-bold">{createForm.memory} Mo</p></div>
              <div><p className="text-xs text-muted">Disque</p><p className="font-bold">{createForm.disk_size} Go</p></div>
            </div>

            <div className="space-y-4">
              <div className="pb-4">
                <label className="block font-semibold mb-1">Nom de la machine</label>
                <Input 
                  value={createForm.name} 
                  onChange={e => setCreateForm({...createForm, name: e.target.value})} 
                  placeholder="mon-serveur-web" 
                  pattern="[a-z0-9-]+"
                  required 
                />
              </div>

              <div>
                <label className="block font-semibold mb-1">Système d'exploitation</label>
                <OSVersionPicker 
                  value={createForm.os_type && createForm.version ? `${createForm.os_type}:${createForm.version}` : ''}
                  onChange={({os_type, version}) => setCreateForm({...createForm, os_type, version})}
                />
              </div>
            </div>

            <div className="flex justify-end gap-3 mt-6">
              <Button type="button" variant="outline" onClick={() => setStep(1)}>Retour</Button>
              <Button type="submit">Créer</Button>
            </div>
          </form>
        )}
      </Modal>

      {/* --- Modal Mise à Jour Ressources --- */}
      <Modal
        isOpen={updateModal.open}
        onClose={() => setUpdateModal({ open: false, vm: null })}
        title="Mettre à jour les ressources"
        size="md"
      >
        
        <form onSubmit={submitUpdate} className="space-y-4">
          
          {/* Affichez les valeurs actuelles pour référence (Style du 1er ex.) */}
          <div className="grid grid-cols-3 gap-4 text-center mb-4 p-3 bg-slate-50 rounded">
            <div>
              <p className="text-xs text-muted">vCPU Actuel</p>
              <p className="font-bold">{updateModal.vm?.vcpu}</p>
            </div>
            <div>
              <p className="text-xs text-muted">RAM Actuelle (Mo)</p>
              <p className="font-bold">{updateModal.vm?.memory}</p>
            </div>
             <div>
              <p className="text-xs text-muted">Disque Actuel (Go)</p>
              <p className="font-bold">{updateModal.vm?.disk_size}</p>
            </div>
          </div>
          
          <div>
            <label className="block text-sm font-medium mb-1">Nouveau vCPU</label>
            <Input 
              type="number" 
              min="1" 
              max="8"
              value={updateForm.vcpu} 
              onChange={e => setUpdateForm({...updateForm, vcpu: parseInt(e.target.value)})} 
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Nouvelle Mémoire RAM (Mo)</label>
            <Input 
              type="number" 
              min="512" 
              step="512"
              value={updateForm.memory} 
              onChange={e => setUpdateForm({...updateForm, memory: parseInt(e.target.value)})} 
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Nouveau Disque (Go)</label>
            <Input 
              type="number" 
              min={updateModal.vm?.disk_size} // Logique du 2ème exemple
              value={updateForm.disk_size} 
              onChange={e => setUpdateForm({...updateForm, disk_size: parseInt(e.target.value)})} 
            />
          </div>

          <div className="flex justify-end gap-3 mt-6">
            <Button type="button" variant="outline" onClick={() => setUpdateModal({ open: false, vm: null })}>Annuler</Button>
            <Button type="submit">Appliquer les changements</Button>
          </div>
        </form>
      </Modal>

      {/* --- Modal Confirmation Actions --- */}
      <Modal
        isOpen={actionConfirm.open}
        onClose={() => setActionConfirm({ open: false, action: null, vmId: null })}
        title="Confirmation requise"
        footer={
          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => setActionConfirm({ open: false, action: null, vmId: null })}>Annuler</Button>
            <Button variant={actionConfirm.action === 'delete' ? 'danger' : 'primary'} onClick={confirmAction}>
              Confirmer
            </Button>
          </div>
        }
      >
        {/* Texte du 1er exemple, adapté à la logique du 2ème exemple */}
        <p>Êtes-vous sûr de vouloir <strong>{actionConfirm.action === 'delete' ? 'supprimer définitivement' : actionConfirm.action}</strong> cette machine ?</p>
        {actionConfirm.action === 'delete' && <p className="text-error text-sm mt-2 font-bold">Cette action est irréversible.</p>}
      </Modal>
    </div>
  );
}
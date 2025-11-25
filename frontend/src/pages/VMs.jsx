import { useState, useEffect } from 'react';
import API from '../services/api';
import { useAuth } from '../context/AuthContext';
import { 
  Play, Square, RotateCw, Trash2, Plus, X, Power, 
  Server, Cpu, HardDrive, MemoryStick 
} from 'lucide-react';
import { Button } from '../components/ui/Button';
import { Modal } from '../components/ui/Modal';
import { Card } from '../components/ui/Card';
import { Input } from '../components/ui/Input';
import OSVersionPicker from '../components/OSVersionPicker';
import PlanSelector from '../components/PlanSelector';
import toast from 'react-hot-toast';

const statusColors = {
  creating: 'bg-warning text-text',
  pending: 'bg-background text-text',
  running: 'bg-success text-white',
  stopped: 'bg-error text-white',
  'shut off': 'bg-background text-text',
  error: 'bg-error text-white',
  deleting: 'bg-warning text-text',
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

  const selectPlan = (plan) => {
    setSelectedPlan(plan);
    setForm(prev => ({ ...prev, vcpu: plan.vcpu, memory: plan.memory, disk_size: plan.disk }));
  };

  const createVM = async (e) => {
    e.preventDefault();
    if (!form.name || !form.os_type || !form.version) {
      toast.error('Veuillez remplir tous les champs');
      return;
    }
    
    try {
      await API.post('/vms', form);
      setShowCreate(false);
      setStep(1);
      setSelectedPlan(null);
      setForm({ name: '', os_type: '', version: '', vcpu: 1, memory: 512, disk_size: 10 });
      toast.success('VM en cours de création');
      setTimeout(fetchVMs, 2000);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Erreur création VM');
    }
  };

  const confirmAction = async () => {
    try {
      await API.post(`/vms/${actionConfirm.vmId}/action`, { action: actionConfirm.action });
      toast.success(`Action "${actionConfirm.action}" lancée`);
    } catch (err) {
      toast.error('Erreur lors de l\'action');
    } finally {
      setActionConfirm({ open: false, action: null, vmId: null });
      setTimeout(fetchVMs, 1000);
    }
  };

  const confirmDelete = async () => {
    try {
      await API.delete(`/vms/${actionConfirm.vmId}`);
      toast.success('VM supprimée');
    } catch (err) {
      toast.error('Erreur suppression');
    } finally {
      setActionConfirm({ open: false, action: null, vmId: null });
      fetchVMs();
    }
  };

  return (
    <div className="space-y-6">
      <Card>
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-6">
          <h1 className="text-2xl font-bold text-text flex items-center gap-2">
            {user.role === 'admin' ? 'Toutes les VMs' : 'Mes machines'}
          </h1>
          {user.role === 'user' && (
            <Button onClick={() => setShowCreate(true)}>
              <Plus className="w-4 h-4" />
            </Button>
          )}
        </div>

        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-slate-100">
              <tr className="border-b">
                <th className="text-left p-3 font-semibold text-text">Nom</th>
                <th className="text-left p-3 font-semibold text-text">IP</th>
                <th className="text-left p-3 font-semibold text-text">Status</th>
                <th className="text-left p-3 font-semibold text-text">Actions</th>
              </tr>
            </thead>
            <tbody>
              {vms.map(vm => (
                <tr key={vm.id} className="border-b hover:bg-background">
                  <td className="p-3 font-medium text-text">{vm.name}</td>
                  <td className="p-3 text-muted">{vm.ip_address || 'N/A'}</td>
                  <td className="p-3">
                    <span className={`px-2 py-1 rounded-full text-xs font-medium inline-flex items-center gap-1 ${statusColors[vm.status]}`}>
                      {vm.status}
                    </span>
                  </td>
                  <td className="p-3">
                    <div className="flex gap-2">
                      {vm.status?.toLowerCase() === 'running' && (
                        <>
                          <Button 
                            size="sm" 
                            variant="warning"
                            onClick={() => setActionConfirm({ open: true, action: 'reboot', vmId: vm.id })}
                          >
                            <RotateCw className="w-4 h-4" />
                          </Button>
                          <Button 
                            size="sm" 
                            variant="secondary"
                            onClick={() => setActionConfirm({ open: true, action: 'stop', vmId: vm.id })}
                          >
                            <Square className="w-4 h-4" />
                          </Button>
                        </>
                      )}
                      {(vm.status?.toLowerCase() === 'stopped' || vm.status?.toLowerCase() === 'shut off') && (
                        <Button 
                          size="sm" 
                          variant="success"
                          onClick={() => setActionConfirm({ open: true, action: 'start', vmId: vm.id })}
                        >
                          <Play className="w-4 h-4" />
                        </Button>
                      )}
                      <Button 
                        size="sm" 
                        variant="danger"
                        onClick={() => setActionConfirm({ open: true, action: 'delete', vmId: vm.id })}
                        disabled={vm.status === 'deleting'}
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {vms.length === 0 && (
          <div className="text-center py-8 text-muted">
            Aucune VM trouvée
          </div>
        )}
      </Card>

      {/* Modal création VM */}
      <Modal
        isOpen={showCreate}
        onClose={() => {
          setShowCreate(false);
          setStep(1);
          setSelectedPlan(null);
        }}
        title={`Créer une VM - Étape ${step}/2`}
        size="lg"
      >
        {step === 1 && (
          <div className="space-y-4">
            <p className="text-muted">Sélectionnez un plan :</p>
            <PlanSelector selectedPlan={selectedPlan} onSelect={selectPlan} />
            <div className="flex justify-end gap-3 mt-6">
              <Button 
                variant="outline" 
                onClick={() => {
                  setShowCreate(false);
                  setStep(1);
                  setSelectedPlan(null);
                }}
              >
                Annuler
              </Button>
              <Button 
                onClick={() => selectedPlan ? setStep(2) : toast.error('Sélectionnez un plan')}
              >
                Suivant
              </Button>
            </div>
          </div>
        )}

        {step === 2 && selectedPlan && (
          <form onSubmit={createVM} className="space-y-4">
            <div className="rounded-lg p-4">
              <h3 className="font-bold text-lg text-primary mb-3">{selectedPlan.name}</h3>
              <div className="grid grid-cols-3 gap-3 text-sm">
                <div className="text-center p-3 shadow rounded-lg">
                  <Cpu className="w-5 h-5 mx-auto mb-1 text-accent" />
                  <p className="text-muted">VCPU</p>
                  <p className="font-bold">{selectedPlan.vcpu}</p>
                </div>
                <div className="text-center p-3 shadow rounded-lg">
                  <MemoryStick className="w-5 h-5 mx-auto mb-1 text-accent" />
                  <p className="text-muted">RAM</p>
                  <p className="font-bold">{selectedPlan.memory} Mo</p>
                </div>
                <div className="text-center p-3 shadow rounded-lg">
                  <HardDrive className="w-5 h-5 mx-auto mb-1 text-accent" />
                  <p className="text-muted">Disque</p>
                  <p className="font-bold">{selectedPlan.disk} Go</p>
                </div>
              </div>
            </div>

            <div>
              <label className="block text-medium mt-8 font-medium text-text mb-1">
                Nom de la VM : <span className='text-error'>*</span>
              </label>
              <Input 
                placeholder="ma-vm"
                value={form.name}
                onChange={e => setForm({...form, name: e.target.value})}
                required
                pattern="[a-z0-9-]+"
                title="Uniquement des lettres minuscules, chiffres et tirets"
              />
            </div>

            <div>
              <label className="block text-medium font-medium mt-8 text-text mb-1">
                Choisir le système d'exploitation : <span className='text-error'>*</span>
              </label>
              <OSVersionPicker 
                value={form.os_type && form.version ? `${form.os_type}:${form.version}` : ''}
                onChange={({os_type, version, ext}) => setForm({...form, os_type, version, ext})}
              />
            </div>

            <div className="flex justify-end gap-3 mt-6">
              <Button type="button" variant="outline" onClick={() => setStep(1)}>
                Précédent
              </Button>
              <Button type="submit">
                Créer la VM
              </Button>
            </div>
          </form>
        )}
      </Modal>

      {/* Modal confirmation actions */}
      <Modal
        isOpen={actionConfirm.open}
        onClose={() => setActionConfirm({ open: false, action: null, vmId: null })}
        title={`Confirmer ${actionConfirm.action === 'delete' ? 'la suppression' : 'l\'action'}`}
        footer={
          <>
            <Button 
              variant="outline" 
              onClick={() => setActionConfirm({ open: false, action: null, vmId: null })}
            >
              Annuler
            </Button>
            <Button 
              variant={actionConfirm.action === 'delete' ? 'danger' : 'primary'}
              onClick={actionConfirm.action === 'delete' ? confirmDelete : confirmAction}
            >
              {actionConfirm.action === 'delete' ? 'Supprimer' : 'Confirmer'}
            </Button>
          </>
        }
      >
        <p className="text-text">
          Êtes-vous sûr de vouloir "<strong>{actionConfirm.action}</strong>" cette VM ?
        </p>
      </Modal>
    </div>
  );
}
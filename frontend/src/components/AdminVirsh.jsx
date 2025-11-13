import React, { useEffect, useState } from 'react';
import API from '../services/api';
import Modal from './SimpleModal';
import toast from 'react-hot-toast';

function prettyBytes(bytes) {
  if (bytes == null || bytes === 0 || isNaN(bytes)) return 'N/A';
  
  const units = ['B', 'KiB', 'MiB', 'GiB', 'TiB'];
  let size = bytes;
  let unitIndex = 0;
  
  while (size >= 1024 && unitIndex < units.length - 1) {
    size /= 1024;
    unitIndex++;
  }
  
  return `${size.toFixed(2)} ${units[unitIndex]}`;
}

function prettySizeFromMiB(mib) {
  if (mib == null || mib === 0 || isNaN(mib)) return 'N/A';
  
  if (mib >= 1024) {
    return `${(mib / 1024).toFixed(2)} GiB`;
  }
  return `${mib.toFixed(2)} MiB`;
}

export default function AdminVirsh() {
  const [vms, setVms] = useState([]);
  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState('');

  const [modalOpen, setModalOpen] = useState(false);
  const [modalTitle, setModalTitle] = useState('');
  const [modalContent, setModalContent] = useState(null);
  const [modalLoading, setModalLoading] = useState(false);

  const fetchList = async () => {
    try {
      setLoading(true);
      setMsg('');
      const { data } = await API.get('/admin/virsh');
      setVms(data.vms || []);
    } catch (err) {
      setMsg('Erreur: ' + (err.response?.data?.message || err.message));
      setVms([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchList(); }, []);

  const openResourcesModal = async (name) => {
    setModalOpen(true);
    setModalTitle(`${name} — Ressources`);
    setModalContent(null);
    setModalLoading(true);
    try {
      const { data } = await API.get(`/admin/virsh/${encodeURIComponent(name)}/resources`);
      setModalContent(data);
    } catch (err) {
      setModalContent({ error: err.response?.data?.message || err.message });
    } finally {
      setModalLoading(false);
    }
  };

  // Ajouter fonction pour actions admin
  const performAdminAction = async (vmName, action) => {
    try {
      await toast.promise(
        API.post(`/admin/vms/${encodeURIComponent(vmName)}/action`, { action }),
        {
          loading: `Action ${action} sur ${vmName}...`,
          success: 'Action effectuée',
          error: 'Erreur action'
        }
      );
      fetchList();
    } catch (err) {
      // déjà géré
    }
  };

  return (
    <div>
      <div className="flex items-end">
        <div>
          <button className="px-3 py-1 mb-4 bg-yellow-600 text-white rounded" onClick={fetchList} disabled={loading}>
            {loading ? 'Chargement...' : 'Rafraîchir'}
          </button>
        </div>
      </div>

      {msg && <div className="my-2 text-red-600">{msg}</div>}

      <div className="bg-white p-3 rounded shadow overflow-auto">
        <table className="w-full text-sm">
          <thead className="bg-slate-100">
            <tr>
              <th className="p-2 text-left">Nom</th>
              <th className="p-2 text-left">État</th>
              <th className="p-2 text-left">vCPU</th>
              <th className="p-2 text-left">RAM</th>
              <th className="p-2 text-left">Provisioned</th>
              <th className="p-2 text-left">Used</th>
              <th className="p-2 text-left">Actions</th>
            </tr>
          </thead>
          <tbody>
            {vms.length ? vms.map(vm => (
              <tr key={vm.name} className="border-t border-slate-100">
                <td className="p-2 font-medium">{vm.name}</td>
                <td className="p-2">
                  <span className={
                    'inline-block px-2 py-0.5 rounded-full text-xs ' +
                    (vm.state && vm.state.toLowerCase().includes('run') ? 'bg-green-100 text-green-800' : 'bg-slate-100 text-slate-700')
                  }>
                    {vm.state || 'unknown'}
                  </span>
                </td>
                <td className="p-2">{vm.vcpu ?? 'N/A'}</td>
                <td className="p-2">{prettySizeFromMiB(vm.memory_mib)}</td>
                <td className="p-2">
                  {vm.virtual_bytes ? prettyBytes(vm.virtual_bytes) : prettySizeFromMiB(vm.size?.capacity_mib)}
                  {vm.thin_provisioned && <span className="ml-2 text-xs text-yellow-600">thin</span>}
                </td>
                <td className="p-2">
                  {vm.actual_bytes ? prettyBytes(vm.actual_bytes) : prettySizeFromMiB(vm.size?.allocation_mib)}
                </td>
                <td className="p-2">
                  <button className="px-2 py-1 bg-gray-700 text-white rounded text-sm" onClick={() => openResourcesModal(vm.name)}>Ressources</button>
                  {vm.state?.toLowerCase().includes('run') && (
                    <>
                      <button className="px-2 py-1 bg-yellow-600 text-white rounded text-sm mr-2" onClick={() => performAdminAction(vm.name, 'reboot')}>
                        Reboot
                      </button>
                      <button className="px-2 py-1 bg-red-600 text-white rounded text-sm mr-2" onClick={() => performAdminAction(vm.name, 'stop')}>
                        Stop
                      </button>
                    </>
                  )}
                  {vm.state?.toLowerCase().includes('shut') && (
                    <button className="px-2 py-1 bg-green-600 text-white rounded text-sm mr-2" onClick={() => performAdminAction(vm.name, 'start')}>
                      Start
                    </button>
                  )}
                </td>                
              </tr>
            )) : (
              <tr><td colSpan={7} className="p-4 text-sm text-slate-500">Aucune VM détectée.</td></tr>
            )}
          </tbody>
        </table>
      </div>

      <Modal open={modalOpen} title={modalTitle} onClose={() => setModalOpen(false)}>
        {modalLoading ? <div>Chargement...</div> : (
          <div>
            <pre className="whitespace-pre-wrap bg-slate-50 p-2 rounded text-sm">
              {typeof modalContent === 'string' ? modalContent : JSON.stringify(modalContent, null, 2)}
            </pre>
          </div>
        )}
      </Modal>
    </div>
  );
}
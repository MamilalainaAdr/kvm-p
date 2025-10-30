import React, { useEffect, useState } from 'react';
import API from '../services/api';
import Modal from './Modal';

function prettyBytes(bytes) {
  if (bytes == null) return 'N/A';
  const gb = bytes / (1024 ** 3);
  if (gb >= 1024) return `${(bytes / (1024 ** 4)).toFixed(2)} TiB`;
  if (gb >= 1) return `${gb.toFixed(2)} GiB`;
  const mb = bytes / (1024 ** 2);
  if (mb >= 1) return `${mb.toFixed(2)} MiB`;
  const kb = bytes / 1024;
  if (kb >= 1) return `${kb.toFixed(2)} KiB`;
  return `${bytes} B`;
}

function prettySizeFromMiB(mib) {
  if (typeof mib !== 'number' || isNaN(mib)) return 'N/A';
  if (mib >= 1024) return `${(mib / 1024).toFixed(2)} GiB`;
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
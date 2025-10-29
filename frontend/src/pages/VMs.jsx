import React, { useEffect, useState } from 'react';
import API from '../services/api';
import { useAuth } from '../context/AuthContext';
import Modal from '../components/Modal';

export default function VMs(){
  const { user } = useAuth();
  const [vms, setVms] = useState([]);
  const [msg, setMsg] = useState('');
  const [loading, setLoading] = useState(true);

  // Modal state for create VM
  const [createOpen, setCreateOpen] = useState(false);
  const [form, setForm] = useState({ name: '', os_type: '', version: '', vcpu: 1, memory: 512, disk_size: 10 });

  const fetch = async () => {
    setLoading(true);
    try {
      const { data } = await API.get('/vms');
      setVms(data.vms || []);
    } catch (err) {
      setMsg(err.response?.data?.message || err.message || 'Erreur chargement');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetch(); }, []);

  const openCreate = () => {
    setForm({ name: '', os_type: '', version: '', vcpu: 1, memory: 512, disk_size: 10 });
    setCreateOpen(true);
    setMsg('');
  };

  const create = async (e) => {
    e.preventDefault();
    try {
      await API.post('/vms', form);
      setMsg('VM créée');
      setCreateOpen(false);
      fetch();
    } catch (err) {
      setMsg(err.response?.data?.message || err.message || 'Erreur');
    }
  };

  const remove = async (id) => {
    if (!confirm('Supprimer cette VM ?')) return;
    try {
      await API.delete(`/vms/${id}`);
      fetch();
    } catch (err) { setMsg('Erreur'); }
  };

  return (
    <div className="container mt-8">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-2xl font-bold">Machines Virtuelles</h2>
        {/* Create button: hidden for admin (server also blocks) */}
        {user?.role !== 'admin' && (
          <button onClick={openCreate} className="flex items-center gap-2 bg-green-600 text-white px-3 py-1 rounded">
            <span className="text-lg font-bold">+</span> Créer
          </button>
        )}
      </div>

      {msg && <div className="my-2 text-red-600 whitespace-pre-wrap">{msg}</div>}

      {loading ? (
        <div>Chargement...</div>
      ) : (
        <div className="grid grid-cols-1 gap-4">
          {vms.length ? (
            <div className="bg-white p-4 rounded shadow overflow-auto">
              <table className="w-full text-left">
                <thead className="bg-slate-100"><tr><th className="p-2">Nom</th><th className="p-2">IP</th><th className="p-2">Statut</th><th className="p-2">Action</th></tr></thead>
                <tbody>
                  {vms.map(vm => (
                    <tr key={vm.id} className="border-t">
                      <td className="p-2">{vm.name}</td>
                      <td className="p-2">{vm.ip_address || 'N/A'}</td>
                      <td className="p-2">{vm.status}</td>
                      <td className="p-2"><button className="px-2 py-1 bg-red-600 text-white rounded" onClick={()=>remove(vm.id)}>Supprimer</button></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : <div className="bg-white p-4 rounded shadow">Aucune VM</div>}
        </div>
      )}

      {/* Create VM Modal */}
      <Modal open={createOpen} title="Créer une VM" onClose={() => setCreateOpen(false)}>
        <form onSubmit={create}>
          <input className="w-full mb-2 p-2 border" placeholder="Nom" value={form.name} onChange={e=>setForm({...form, name:e.target.value})} required/>
          <input className="w-full mb-2 p-2 border" placeholder="OS (ex: ubuntu)" value={form.os_type} onChange={e=>setForm({...form, os_type:e.target.value})} required/>
          <input className="w-full mb-2 p-2 border" placeholder="Version" value={form.version} onChange={e=>setForm({...form, version:e.target.value})} required/>
          <div className="grid grid-cols-3 gap-2">
            <input className="mb-2 p-2 border" type="number" placeholder="vCPU" value={form.vcpu} onChange={e=>setForm({...form, vcpu:parseInt(e.target.value||1)})}/>
            <input className="mb-2 p-2 border" type="number" placeholder="Memory (MB)" value={form.memory} onChange={e=>setForm({...form, memory:parseInt(e.target.value||512)})}/>
            <input className="mb-2 p-2 border" type="number" placeholder="Disk (GB)" value={form.disk_size} onChange={e=>setForm({...form, disk_size:parseInt(e.target.value||10)})}/>
          </div>
          <div className="flex gap-2 justify-end mt-3">
            <button type="button" onClick={() => setCreateOpen(false)} className="px-3 py-1 bg-slate-100 rounded">Annuler</button>
            <button type="submit" className="px-3 py-1 bg-green-600 text-white rounded">Créer</button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
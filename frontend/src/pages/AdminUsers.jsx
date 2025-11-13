import React, { useEffect, useState } from 'react';
import API from '../services/api';
import toast from 'react-hot-toast';

export default function AdminUsers() {
  const [users, setUsers] = useState([]);
  const [msg, setMsg] = useState('');
  const [loading, setLoading] = useState(true);

  const fetchUsers = async () => {
    setLoading(true);
    setMsg('');
    try {
      const { data } = await API.get('/admin/users');
      setUsers(data.users || []);
    } catch (err) {
      setMsg(err.response?.data?.message || err.message || 'Erreur chargement');
      setUsers([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchUsers(); }, []);

  const toggleRole = async (id) => {
    try {
      await toast.promise(
        API.post(`/admin/users/${id}/toggle-role`),
        {
          loading: 'Modification...',
          success: 'Rôle modifié',
          error: 'Erreur'
        }
      );
      fetchUsers();
    } catch (err) {
      setMsg(err.response?.data?.message || 'Erreur');
    }
  };

  const deleteUser = async (id) => {
    if (!confirm('Supprimer cet utilisateur ?')) return;
    try {
      await toast.promise(
        API.delete(`/admin/users/${id}`),
        {
          loading: 'Suppression...',
          success: 'Utilisateur supprimé',
          error: 'Erreur suppression'
        }
      );
      fetchUsers();
    } catch (err) {
      setMsg('Erreur: ' + (err.response?.data?.message || err.message));
    }
  };

  return (
    <div>
      {msg && <div className="mb-3 text-red-600">{msg}</div>}
      {loading ? <div>Chargement...</div> : (
        <div className="bg-white p-3 rounded shadow overflow-auto">
          <table className="w-full text-sm">
            <thead className="bg-slate-100">
              <tr>
                <th className="p-2 text-left">ID</th>
                <th className="p-2 text-left">Nom</th>
                <th className="p-2 text-left">Email</th>
                <th className="p-2 text-left">Rôle</th>
                <th className="p-2 text-left">VMs</th>
                <th className="p-2 text-left">Actions</th>
              </tr>
            </thead>
            <tbody>
              {users.map(u => (
                <tr key={u.id} className="border-t border-slate-100">
                  <td className="p-2">{u.id}</td>
                  <td className="p-2">{u.name}</td>
                  <td className="p-2">{u.email}</td>
                  <td className="p-2">{u.role}</td>
                  <td className="p-2">{u.VirtualMachines?.length || 0}</td>
                  <td className="p-2">
                    <button className="mr-2 px-2 py-1 bg-yellow-500 text-white rounded" onClick={() => toggleRole(u.id)}>Toggle rôle</button>
                    <button className="px-2 py-1 bg-red-600 text-white rounded" onClick={() => deleteUser(u.id)}>Supprimer</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
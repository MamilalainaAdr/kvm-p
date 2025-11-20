import { useState, useEffect } from 'react';
import API from '../services/api';
import { useAuth } from '../context/AuthContext';
import toast from 'react-hot-toast';

export default function AdminUsers() {
  const [users, setUsers] = useState([]);
  const { user: currentUser } = useAuth();

  const fetchUsers = async () => {
    try {
      const { data } = await API.get('/admin/users');
      setUsers(data.users);
    } catch (err) {
      toast.error('Erreur chargement utilisateurs');
    }
  };

  const deleteUser = async (userId, userName) => {
    if (!confirm(`⚠️ Supprimer ${userName} et TOUTES ses VMs ? Cette action est irréversible.`)) return;
    
    try {
      await API.delete(`/admin/users/${userId}`);
      toast.success(`Utilisateur ${userName} supprimé`);
      fetchUsers();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Erreur suppression');
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  return (
    <div className="bg-white p-6 rounded shadow">
      <h2 className="text-xl font-bold mb-4">Gestion des Utilisateurs</h2>
      
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="bg-slate-100">
            <tr>
              <th className="p-3 text-left">Nom</th>
              <th className="p-3 text-left">Email</th>
              <th className="p-3 text-left">Rôle</th>
              <th className="p-3 text-left">VMs</th>
              <th className="p-3 text-left">Vérifié</th>
              <th className="p-3 text-left">Actions</th>
            </tr>
          </thead>
          <tbody>
            {users.map(u => (
              <tr key={u.id} className="border-t hover:bg-slate-50">
                <td className="p-3 font-medium">{u.name}</td>
                <td className="p-3 text-slate-600">{u.email}</td>
                <td className="p-3">
                  <span className={`px-2 py-1 rounded-full text-xs ${
                    u.role === 'admin' ? 'bg-purple-100 text-purple-800' : 'bg-gray-100 text-gray-800'
                  }`}>
                    {u.role}
                  </span>
                </td>
                <td className="p-3 text-center">{u.vmCount}</td>
                <td className="p-3">
                  <span className={`px-2 py-1 rounded-full text-xs ${
                    u.isVerified ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'
                  }`}>
                    {u.isVerified ? 'Oui' : 'Non'}
                  </span>
                </td>
                <td className="p-3 space-x-2">
                  <button 
                    onClick={() => deleteUser(u.id, u.name)}
                    disabled={u.id === currentUser?.id}
                    className="px-3 py-1 bg-red-600 text-white rounded text-xs hover:bg-red-700 disabled:opacity-50"
                  >
                    Supprimer
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      
      {users.length === 0 && (
        <p className="text-center text-slate-500 mt-4">Aucun utilisateur</p>
      )}
    </div>
  );
}
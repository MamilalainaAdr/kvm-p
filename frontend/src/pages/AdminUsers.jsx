import { useState, useEffect } from 'react';
import API from '../services/api';
import { useAuth } from '../context/AuthContext';
import { Trash2, Users } from 'lucide-react'; // Ajout de Users pour le titre
import { Button } from '../components/ui/Button';
import { Modal } from '../components/ui/Modal';
import { Card } from '../components/ui/Card';
import toast from 'react-hot-toast';

// Styles des badges basés sur le style du premier exemple (VMs)
const roleColors = {
  admin: 'bg-primary/20 text-primary font-bold', // Inspiré du "running" ou "success"
  user: 'bg-gray-200 text-gray-600',
};

const verificationColors = {
  true: 'bg-success/20 text-success',
  false: 'bg-warning/20 text-warning',
}

export default function AdminUsers() {
  const [users, setUsers] = useState([]);
  const { user: currentUser } = useAuth();
  const [deleteConfirm, setDeleteConfirm] = useState({ open: false, userId: null, userName: '' });
  const [loading, setLoading] = useState(true);

  const fetchUsers = async () => {
    try {
      const { data } = await API.get('/admin/users');
      setUsers(data.users);
    } catch (err) {
      toast.error('Erreur chargement utilisateurs');
    } finally {
      setLoading(false);
    }
  };

  // Logique du 2ème exemple
  const deleteUser = (userId, userName) => {
    if (userId === currentUser?.id) {
      toast.error('Vous ne pouvez pas vous supprimer vous-même');
      return;
    }
    setDeleteConfirm({ open: true, userId, userName });
  };

  const confirmDelete = async () => {
    try {
      await API.delete(`/admin/users/${deleteConfirm.userId}`);
      toast.success(`Utilisateur ${deleteConfirm.userName} supprimé`);
      setTimeout(fetchUsers, 500); // Rafraîchissement rapide
    } catch (err) {
      toast.error(err.response?.data?.message || 'Erreur suppression');
    } finally {
      setDeleteConfirm({ open: false, userId: null, userName: '' });
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  if (loading) {
    return (
      <Card>
        <div className="text-center py-8 text-muted">Chargement des utilisateurs...</div>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <Card>
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-6">
          <h1 className="text-2xl font-bold text-text flex items-center gap-2">
            Gestion des Utilisateurs
          </h1>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left">
            <thead className="bg-background uppercase text-muted font-bold text-xs">
              <tr>
                <th className="p-3 rounded-tl-lg">Nom</th>
                <th className="p-3">Email</th>
                <th className="p-3">Rôle</th>
                <th className="p-3 text-center">VMs</th>
                <th className="p-3">Vérifié</th>
                <th className="p-3 rounded-tr-lg">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {users.map(u => (
                <tr key={u.id} className="hover:bg-gray-50 transition-colors">
                  <td className="p-3 font-medium text-text">{u.name}</td>
                  <td className="p-3 text-muted">{u.email}</td>
                  <td className="p-3">
                    <span className={`px-2 py-1 rounded-full text-xs font-bold ${roleColors[u.role]}`}>
                      {u.role}
                    </span>
                  </td>
                  <td className="p-3 text-center text-text font-medium">{u.vmCount}</td>
                  <td className="p-3">
                    <span className={`px-2 py-1 rounded-full text-xs font-bold ${verificationColors[u.isVerified]}`}>
                      {u.isVerified ? 'Oui' : 'Non'}
                    </span>
                  </td>
                  <td className="p-3">
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => deleteUser(u.id, u.name)}
                        className={`p-1.5 rounded border ${
                          u.id === currentUser?.id 
                            ? 'text-gray-400 bg-gray-100 border-gray-200 cursor-not-allowed' 
                            : 'text-red-600 hover:bg-red-100 border-red-200'
                        }`}
                        title={u.id === currentUser?.id ? "Impossible de vous supprimer" : "Supprimer l'utilisateur"}
                        disabled={u.id === currentUser?.id}
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>

                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {users.length === 0 && <div className="text-center py-8 text-muted">Aucun utilisateur trouvé.</div>}
        </div>
      </Card>

      {/* --- Modal Confirmation Suppression --- */}
      <Modal
        isOpen={deleteConfirm.open}
        onClose={() => setDeleteConfirm({ open: false, userId: null, userName: '' })}
        title="Confirmation requise : Suppression"
        footer={
          <div className="flex justify-start gap-2">
            <Button variant="outline" onClick={() => setDeleteConfirm({ open: false, userId: null, userName: '' })}>
              Annuler
            </Button>
            <Button variant="danger" onClick={confirmDelete}>
              Confirmer la suppression
            </Button>
          </div>
        }
      >
        <p className="mb-2">
          Êtes-vous sûr de vouloir <strong>supprimer définitivement</strong> l'utilisateur *{deleteConfirm.userName}* ?
        </p>
        <p className="text-error text-sm font-bold">
          Toutes les machines associées à cet utilisateur seront également supprimées. Cette action est irréversible.
        </p>
      </Modal>
    </div>
  );
}
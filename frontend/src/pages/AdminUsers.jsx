import { useState, useEffect } from 'react';
import API from '../services/api';
import { useAuth } from '../context/AuthContext';
import { Trash2, UserCheck, Shield } from 'lucide-react';
import { Button } from '../components/ui/Button';
import { Modal } from '../components/ui/Modal';
import { Card } from '../components/ui/Card';
import toast from 'react-hot-toast';

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
      fetchUsers();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Erreur suppression');
    } finally {
      setDeleteConfirm({ open: false, userId: null, userName: '' });
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  return (
    <div className="space-y-6">
      <Card>
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-2xl font-bold text-text flex items-center gap-2">
            Gestion des Utilisateurs
          </h1>
          <span className="text-sm text-muted">{users.length} utilisateurs</span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b bg-slate-100">
                <th className="text-left p-3 font-semibold text-text">Nom</th>
                <th className="text-left p-3 font-semibold text-text">Email</th>
                <th className="text-left p-3 font-semibold text-text">Rôle</th>
                <th className="text-left p-3 font-semibold text-text">VMs</th>
                <th className="text-left p-3 font-semibold text-text">Vérifié</th>
                <th className="text-left p-3 font-semibold text-text">Actions</th>
              </tr>
            </thead>
            <tbody>
              {users.map(u => (
                <tr key={u.id} className="border-b hover:bg-background">
                  <td className="p-3">
                    <div className="flex items-center gap-2">
                      <span className="font-medium text-text">{u.name}</span>
                    </div>
                  </td>
                  <td className="p-3 text-muted">{u.email}</td>
                  <td className="p-3">
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                      u.role === 'admin' 
                        ? 'bg-primary text-white' 
                        : 'bg-background text-text'
                    }`}>
                      {u.role}
                    </span>
                  </td>
                  <td className="p-3 text-center font-medium">{u.vmCount}</td>
                  <td className="p-3">
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                      u.isVerified 
                        ? 'bg-success text-white' 
                        : 'bg-warning text-text'
                    }`}>
                      {u.isVerified ? 'Oui' : 'Non'}
                    </span>
                  </td>
                  <td className="p-3">
                    <Button
                      variant="danger"
                      size="sm"
                      onClick={() => deleteUser(u.id, u.name)}
                      disabled={u.id === currentUser?.id}
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {users.length === 0 && (
          <div className="text-center py-8 text-muted">
            Aucun utilisateur
          </div>
        )}
      </Card>

      <Modal
        isOpen={deleteConfirm.open}
        onClose={() => setDeleteConfirm({ open: false, userId: null, userName: '' })}
        title="Supprimer l'utilisateur"
        footer={
          <>
            <Button 
              variant="outline" 
              onClick={() => setDeleteConfirm({ open: false, userId: null, userName: '' })}
            >
              Annuler
            </Button>
            <Button 
              variant="danger" 
              onClick={confirmDelete}
            >
              Supprimer
            </Button>
          </>
        }
      >
        <p className="text-text">
          Supprimer <strong>{deleteConfirm.userName}</strong> et TOUTES ses VMs ? 
          <br />Cette action est <strong className="text-error">irréversible</strong>.
        </p>
      </Modal>
    </div>
  );
}
import { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import API from '../services/api';
import { Mail, LogOut } from 'lucide-react';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { Card } from '../components/ui/Card';

export default function Profile() {
  const { user, logout } = useAuth();
  const [name, setName] = useState(user.name);
  const [passwords, setPasswords] = useState({ current: '', new: '', confirm: '' });
  const [loading, setLoading] = useState(false);

  const updateName = async (e) => {
    e.preventDefault();
    if (name === user.name) return;
    setLoading(true);
    try {
      await API.put('/profile', { name });
      logout();
    } finally {
      setLoading(false);
    }
  };

  const changePassword = async (e) => {
    e.preventDefault();
    if (passwords.new !== passwords.confirm) {
      alert('Mots de passe différents');
      return;
    }
    setLoading(true);
    try {
      await API.put('/profile/password', { 
        currentPassword: passwords.current, 
        newPassword: passwords.new 
      });
      logout();
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      {/* Header */}
      <Card>
        <div className="flex items-center gap-4">
          <img
            src={`https://ui-avatars.com/api/?name=${encodeURIComponent(user.name)}&background=374951&color=fff`}
            alt="avatar"
            className="w-20 h-20 rounded-full"
          />
          <div>
            <h1 className="text-2xl font-bold text-text">{user.name}</h1>
            <p className="text-muted flex items-center gap-2">
              <Mail className="w-4 h-4" />
              {user.email}
            </p>
          </div>
        </div>
      </Card>

      {/* Modifier nom */}
      <Card>
        <h2 className="text-lg font-semibold text-text mb-4 flex items-center gap-2">
          Modifier le nom
        </h2>
        <form onSubmit={updateName} className="space-y-4">
          <Input
            value={name}
            onChange={e => setName(e.target.value)}
            placeholder="Nouveau nom"
          />
          <Button type="submit" loading={loading}>
            Mettre à jour
          </Button>
        </form>
      </Card>

      {/* Changer mot de passe */}
      <Card>
        <h2 className="text-lg font-semibold text-text mb-4 flex items-center gap-2">
          Changer le mot de passe
        </h2>
        <form onSubmit={changePassword} className="space-y-4">
          <Input
            type="password"
            placeholder="Mot de passe actuel"
            value={passwords.current}
            onChange={e => setPasswords({ ...passwords, current: e.target.value })}
            required
          />
          <Input
            type="password"
            placeholder="Nouveau mot de passe"
            value={passwords.new}
            onChange={e => setPasswords({ ...passwords, new: e.target.value })}
            required
          />
          <Input
            type="password"
            placeholder="Confirmer le mot de passe"
            value={passwords.confirm}
            onChange={e => setPasswords({ ...passwords, confirm: e.target.value })}
            required
          />
          <Button type="submit" variant="danger" loading={loading}>
            <LogOut className="w-4 h-4" />
            Changer et me déconnecter
          </Button>
        </form>
      </Card>
    </div>
  );
}
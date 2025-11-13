import React, { useState } from 'react';
import API from '../services/api';
import { useAuth } from '../context/AuthContext';
import toast from 'react-hot-toast';

export default function Profile() {
  const { user, setUser, logout } = useAuth();
  const [name, setName] = useState(user.name);
  const [email] = useState(user.email);
  const [passwords, setPasswords] = useState({ current: '', new: '', confirm: '' });
  const [loading, setLoading] = useState(false);

  const updateName = async (e) => {
    e.preventDefault();
    if (name === user.name) return;
    
    try {
      setLoading(true);
      const { data } = await API.put('/profile', { name });
      setUser(prev => ({ ...prev, name }));
      toast.success('Nom mis à jour', { id: 'update-name' });
    } catch (err) {
      toast.error(err.response?.data?.message || 'Erreur', { id: 'update-name' });
    } finally {
      setLoading(false);
    }
  };

  const changePassword = async (e) => {
    e.preventDefault();
    if (passwords.new !== passwords.confirm) {
      toast.error('Les mots de passe ne correspondent pas');
      return;
    }
    
    try {
      setLoading(true);
      const { data } = await API.put('/profile/password', {
        currentPassword: passwords.current,
        newPassword: passwords.new
      });
      toast.success(data.message);
      logout(); // Déconnexion après changement
    } catch (err) {
      toast.error(err.response?.data?.message || 'Erreur');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className=" bg-white container rounded shadow">
      <div className="max-w-2xl mx-auto space-y-6">
        
        {/* Carte Infos Utilisateur */}
        <div className="p-6">
          <h2 className="text-xl font-bold mb-4">Profil</h2>
          <div className="space-y-3">
            <div>
              <label className="block text-sm font-medium text-slate-700">Nom d'utilisateur</label>
              <div className="mt-1 px-3 py-2 bg-slate-50 rounded-md">{user.name}</div>
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700">Email</label>
              <div className="mt-1 px-3 py-2 bg-slate-50 rounded-md">{user.email}</div>
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700">Rôle</label>
              <div className="mt-1 px-3 py-2 bg-slate-50 rounded-md capitalize">{user.role}</div>
            </div>
          </div>
        </div>

        {/* Carte Modifier Nom */}
        <div className="p-6">
          <h3 className="text-lg font-semibold mb-4">Modifier le nom</h3>
          <form onSubmit={updateName} className="space-y-4">
            <input
              type="text"
              className="w-full p-2 border border-slate-300 rounded focus:ring-2 focus:ring-blue-500"
              value={name}
              onChange={e => setName(e.target.value)}
              required
            />
            <button
              type="submit"
              disabled={loading || name === user.name}
              className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50"
            >
              {loading ? 'Sauvegarde...' : 'Mettre à jour le nom'}
            </button>
          </form>
        </div>

        {/* Carte Changer Mot de passe */}
        <div className="bg-white p-6 rounded shadow">
          <h3 className="text-lg font-semibold mb-4">Changer le mot de passe</h3>
          <form onSubmit={changePassword} className="space-y-4">
            <input
              type="password"
              className="w-full p-2 border border-slate-300 rounded focus:ring-2 focus:ring-yellow-500"
              placeholder="Mot de passe actuel"
              value={passwords.current}
              onChange={e => setPasswords({...passwords, current: e.target.value})}
              required
            />
            <input
              type="password"
              className="w-full p-2 border border-slate-300 rounded focus:ring-2 focus:ring-yellow-500"
              placeholder="Nouveau mot de passe"
              value={passwords.new}
              onChange={e => setPasswords({...passwords, new: e.target.value})}
              required
            />
            <input
              type="password"
              className="w-full p-2 border border-slate-300 rounded focus:ring-2 focus:ring-yellow-500"
              placeholder="Confirmer le nouveau mot de passe"
              value={passwords.confirm}
              onChange={e => setPasswords({...passwords, confirm: e.target.value})}
              required
            />
            <button
              type="submit"
              disabled={loading}
              className="px-4 py-2 bg-yellow-600 text-white rounded hover:bg-yellow-700 disabled:opacity-50"
            >
              {loading ? 'Modification...' : 'Changer le mot de passe'}
            </button>
          </form>
        </div>

      </div>
    </div>
  );
}
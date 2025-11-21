import { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import API from '../services/api';

export default function Profile() {
  const { user, logout } = useAuth();
  const [name, setName] = useState(user.name);
  const [passwords, setPasswords] = useState({ current: '', new: '', confirm: '' });

  const updateName = async (e) => {
    e.preventDefault();
    if (name === user.name) return;
    await API.put('/profile', { name });
    logout();
  };

  const changePassword = async (e) => {
    e.preventDefault();
    if (passwords.new !== passwords.confirm) return alert('Mots de passe différents');
    await API.put('/profile/password', { currentPassword: passwords.current, newPassword: passwords.new });
    logout();
  };

  return (
    <div className="bg-white p-8 rounded shadow space-y-6">      
      {/* --- Header profil avec avatar --- */}
      <div className="flex items-center gap-6">
        <img
          src={`https://ui-avatars.com/api/?name=${encodeURIComponent(user.name)}&background=374951&color=fff`}
          alt="avatar"
          className="w-16 h-16 rounded-full"
        />
        <div className="space-y-1">
          <div className="text-lg font-semibold text-gray-800">{user.name}</div>
          <div className="text-sm text-gray-500">{user.email}</div>
          <div className="text-sm text-gray-400">{user.role === 'user' ? 'Utilisateur' : 'Administrateur'}</div>
        </div>
      </div>

      {/* --- Ligne de séparation centrée --- */}
      <div className="h-px w-24 bg-slate-300 mx-auto"></div>

      {/* --- Modifier le nom --- */}
      <div>
        <h3 className="mt-16 text-lg font-semibold mb-4 text-gray-700">Modifier nom</h3>
        <form onSubmit={updateName} className="flex flex-col gap-4">
          <input
            value={name}
            onChange={e => setName(e.target.value)}
            className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-gray-500 outline-none"
          />
          <button
            type="submit"
            className="px-4 py-2 bg-red-600 text-white font-semibold rounded-lg hover:bg-red-700 transition"
          >
            Mettre à jour
          </button>
        </form>
      </div>

      {/* --- Changer mot de passe --- */}
      <div>
        <h3 className="mt-16 text-lg font-semibold mb-4 text-gray-700">Changer mot de passe</h3>
        <form onSubmit={changePassword} className="mt-6 flex flex-col gap-4">
          <input
            type="password"
            placeholder="Mot de passe actuel"
            value={passwords.current}
            onChange={e => setPasswords({ ...passwords, current: e.target.value })}
            className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-gray-500 outline-none"
            required
          />
          <input
            type="password"
            placeholder="Nouveau mot de passe"
            value={passwords.new}
            onChange={e => setPasswords({ ...passwords, new: e.target.value })}
            className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-gray-500 outline-none"
            required
          />
          <input
            type="password"
            placeholder="Confirmer"
            value={passwords.confirm}
            onChange={e => setPasswords({ ...passwords, confirm: e.target.value })}
            className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-gray-500 outline-none"
            required
          />
          <button
            type="submit"
            className="mb-10 px-4 py-2 bg-red-600 font-semibold text-white rounded-lg hover:bg-red-700 transition"
          >
            Changer mot de passe
          </button>
        </form>
      </div>
    </div>
  );
}
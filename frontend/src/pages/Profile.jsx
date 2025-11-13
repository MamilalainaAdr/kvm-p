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
    <div className="bg-white p-6 rounded shadow space-y-6">
      <div>
        <h2 className="text-xl font-bold mb-4">Profil</h2>
        <div className="space-y-2">
          <div><label className="block font-medium text-gray-500">Nom</label><div className=" bg-slate-50 rounded">{user.name}</div></div>
          <div><label className="block font-medium text-gray-500">Email</label><div className=" bg-slate-50 rounded">{user.email}</div></div>
          <div><label className="block font-medium text-gray-500">Rôle</label><div className="bg-slate-50 rounded">{user.role}</div></div>
        </div>
      </div>

      <div>
        <h3 className="text-lg font-semibold mb-4">Modifier nom</h3>
        <form onSubmit={updateName} className="flex flex-col gap-2">
          <input value={name} onChange={e => setName(e.target.value)} className="flex-1 p-2 border rounded" />
          <button type="submit" className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700">Mettre à jour</button>
        </form>
      </div>

      <div>
        <h3 className="text-lg font-semibold mb-4">Changer mot de passe</h3>
        <form onSubmit={changePassword} className="space-y-4">
          <input type="password" placeholder="Mot de passe actuel" value={passwords.current} onChange={e => setPasswords({...passwords, current: e.target.value})} className="w-full p-2 border rounded" required />
          <input type="password" placeholder="Nouveau mot de passe" value={passwords.new} onChange={e => setPasswords({...passwords, new: e.target.value})} className="w-full p-2 border rounded" required />
          <input type="password" placeholder="Confirmer" value={passwords.confirm} onChange={e => setPasswords({...passwords, confirm: e.target.value})} className="w-full p-2 border rounded" required />
          <button type="submit" className="w-full px-4 py-2 bg-yellow-600 text-white rounded hover:bg-yellow-700">Changer mot de passe</button>
        </form>
      </div>
    </div>
  );
}
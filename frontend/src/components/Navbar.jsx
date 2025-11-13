import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function Navbar({ onToggle, sidebarOpen }) {
  const { user, logout } = useAuth();
  const [open, setOpen] = useState(false);

  return (
    <header className="fixed top-0 left-0 right-0 z-50 bg-white border-b shadow-sm">
      <div className="flex items-center justify-between h-16 px-4">
        <button onClick={onToggle} className="p-2">☰</button>
        <Link to="/" className="font-bold text-red-600">OBox</Link>
        
        {user ? (
          <div className="relative">
            <button onClick={() => setOpen(!open)} className="flex items-center gap-2">
              <img src={`https://ui-avatars.com/api/?name=${user.name}&background=374151&color=fff`} className="w-8 h-8 rounded-full" />
            </button>
            {open && (
              <div className="absolute right-0 mt-4 w-30 bg-white border rounded shadow-lg">
                <Link to="/profile" className="block px-4 py-2 hover:bg-gray-100">Profil</Link>
                <button onClick={logout} className="block w-full text-left text-red-500 px-4 py-2 hover:bg-red-800 rounded">Déconnexion</button>
              </div>
            )}
          </div>
        ) : (
          <div className="flex gap-2">
            <Link to="/login" className="text-sky-600">Connexion</Link>
            <Link to="/register" className="text-green-600">Inscription</Link>
          </div>
        )}
      </div>
    </header>
  );
}
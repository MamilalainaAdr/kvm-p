// frontend/src/components/Navbar.jsx
import { useState, useEffect, useRef } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import ConfirmModal from './ConfirmModal';

export default function Navbar({ onToggle, sidebarOpen }) {
  const { user, logout } = useAuth();
  const location = useLocation();
  const [open, setOpen] = useState(false);
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);
  const menuRef = useRef(null);
  const avatarRef = useRef(null);

  // ✅ Fermer le menu quand on change de page
  useEffect(() => {
    setOpen(false);
  }, [location.pathname]);

  // ✅ Fermer le menu quand on clique en dehors
  useEffect(() => {
    const handleClickOutside = (event) => {
      // Si le clic n'est pas sur le menu ET pas sur l'avatar
      if (
        menuRef.current && 
        !menuRef.current.contains(event.target) && 
        avatarRef.current && 
        !avatarRef.current.contains(event.target)
      ) {
        setOpen(false);
      }
    };
    
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleLogout = () => {
    logout();
    setOpen(false);
    setShowLogoutConfirm(false);
  };

  const toggleMenu = () => setOpen(!open);

  return (
    <>
      <ConfirmModal
        isOpen={showLogoutConfirm}
        onClose={() => setShowLogoutConfirm(false)}
        onConfirm={handleLogout}
        title="Déconnexion"
        message="Êtes-vous sûr de vouloir vous déconnecter ?"
        confirmText="Se déconnecter"
      />

      <header className="fixed top-0 left-0 right-0 z-50 bg-white border-b shadow-sm">
        <div className="flex items-center justify-between h-16 px-4">
          {user ? (
            <>
              <button onClick={onToggle} className="p-2">☰</button>
              <Link to="/" className="font-bold text-red-600">OBox</Link>
            </>
          ) : (
            <Link to="/" className="font-semibold pl-1 pr-2 text-white rounded-sm bg-red-600 hover:-translate-y-1 hover:shadow-lg">OBox</Link>
          )}
          
          {user ? (
            <div className="relative">
              <button 
                ref={avatarRef}
                onClick={toggleMenu} 
                className="flex items-center gap-2"
              >
                <img 
                  src={`https://ui-avatars.com/api/?name=${user.name}&background=374151&color=fff`} 
                  className="w-8 h-8 rounded-full" 
                  alt={user.name} 
                />
              </button>
              
              {open && (
                <div 
                  ref={menuRef}
                  className="absolute right-0 mt-4 w-32 bg-white border rounded shadow-lg z-50"
                >
                  <Link 
                    to="/profile" 
                    className="block px-4 py-2 text-sm hover:bg-gray-100 transition-colors"
                  >
                    Profil
                  </Link>
                  <button 
                    onClick={() => setShowLogoutConfirm(true)} 
                    className="block w-full text-left text-sm text-red-600 px-4 py-2 hover:bg-red-50 hover:text-red-700 transition-colors"
                  >
                    Déconnexion
                  </button>
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
    </>
  );
}
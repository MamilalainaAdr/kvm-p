import { useState, useEffect, useRef } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { 
  Menu, X, LogOut, ChevronDown, Settings
} from 'lucide-react';
import { Modal } from '../ui/Modal';
import { Button } from '../ui/Button';

export default function Navbar({ onToggle, sidebarOpen }) {
  const { user, logout } = useAuth();
  const location = useLocation();
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false); // ✅ Dropdown profil
  const menuRef = useRef(null);
  const avatarRef = useRef(null);

  // ✅ Fermer le menu quand on change de page
  useEffect(() => {
    setProfileOpen(false);
  }, [location.pathname]);

  // ✅ Fermer le menu quand on clique en dehors
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (
        menuRef.current && 
        !menuRef.current.contains(event.target) && 
        avatarRef.current && 
        !avatarRef.current.contains(event.target)
      ) {
        setProfileOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleLogout = async () => {
    await logout();
    setProfileOpen(false);
    setShowLogoutConfirm(false);
  };

  return (
    <>
      <Modal
        isOpen={showLogoutConfirm}
        onClose={() => setShowLogoutConfirm(false)}
        title="Déconnexion"
        footer={
          <>
            <Button variant="outline" onClick={() => setShowLogoutConfirm(false)}>
              Annuler
            </Button>
            <Button variant="danger" onClick={handleLogout}>
              Se déconnecter
            </Button>
          </>
        }
      >
        <p>Êtes-vous sûr de vouloir vous déconnecter ?</p>
      </Modal>

      <header className="fixed top-0 left-0 right-0 z-50 bg-surface border-b shadow-sm">
        <div className="flex items-center justify-between h-16 px-4 md:px-6">
          <div className="flex items-center gap-3">
            {/* ✅ BOUTON BURGER POUR SIDEBAR */}
            {user && (
              <button 
                onClick={onToggle} 
                className="p-2 text-text hover:bg-background rounded-lg transition-colors"
                aria-label="Toggle menu"
              >
                {sidebarOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
              </button>
            )}
            
            <Link to="/" className="flex items-center gap-2">
              <span className="font-bold text-xl text-primary">OBox</span>
            </Link>
          </div>
          
          {user ? (
            <div className="flex items-center gap-3">
              {/* ✅ DROPDOWN PROFILE RESTORÉ */}
              <div className="relative">
                <button 
                  ref={avatarRef}
                  onClick={() => setProfileOpen(!profileOpen)} 
                  className="flex items-center gap-3 p-2 hover:bg-background rounded-lg transition-colors"
                >
                  <img 
                    src={`https://ui-avatars.com/api/?name=${user.name}&background=374151&color=fff`} 
                    className="w-8 h-8 rounded-full" 
                    alt={user.name} 
                  />
                  <div className="hidden sm:block text-left">
                    <p className="text-sm font-medium text-text">{user.name}</p>
                    <p className="text-xs text-muted">{user.role === 'admin' ? 'Administrateur' : 'Utilisateur'}</p>
                  </div>
                  <ChevronDown className={`w-4 h-4 text-muted transition-transform ${profileOpen ? 'rotate-180' : ''}`} />
                </button>
                
                {profileOpen && (
                  <div 
                    ref={menuRef}
                    className="absolute right-0 mt-2 w-48 bg-surface border rounded-lg shadow-lg z-50 py-1"
                  >
                    <Link 
                      to="/profile" 
                      className="flex items-center gap-2 px-4 py-2 text-sm text-text hover:bg-background transition-colors"
                      onClick={() => setProfileOpen(false)}
                    >
                      <Settings className="w-4 h-4" />
                      Profil
                    </Link>
                    <button 
                      onClick={() => {
                        setShowLogoutConfirm(true);
                        setProfileOpen(false);
                      }} 
                      className="flex w-full items-center gap-2 px-4 py-2 text-sm text-error hover:bg-red-50 hover:text-error transition-colors"
                    >
                      <LogOut className="w-4 h-4" />
                      Déconnexion
                    </button>
                  </div>
                )}
              </div>
            </div>
          ) : (
            <div className="flex items-center gap-2">
              <Link 
                to="/login" 
                className="px-4 py-2 text-accent hover:bg-background rounded-lg transition-colors font-medium"
              >
                Connexion
              </Link>
              <Link 
                to="/register" 
                className="px-4 py-2 bg-primary hover:bg-primaryDark text-white rounded-lg transition-colors font-medium"
              >
                Inscription
              </Link>
            </div>
          )}
        </div>
      </header>
    </>
  );
}
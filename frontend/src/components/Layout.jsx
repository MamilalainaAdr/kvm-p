import { useState, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import Navbar from './Navbar';
import Sidebar from './Sidebar';
import { useAuth } from '../context/AuthContext';
import bg from '../assets/background.jpg';

export default function Layout({ children }) {
  // CORRECTION: Par défaut fermé
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const location = useLocation();
  const { user } = useAuth();
  
  // Fermer sidebar lors de la déconnexion
  useEffect(() => {
    if (!user) {
      setSidebarOpen(false);
    }
  }, [user]);

  return (
    <div className={`min-h-screen bg-center bg-no-repeat ${
        user ? 'bg-slate-50' : 'bg-cover'
      }`}
      style={{
        backgroundImage: !user ? `url(${bg})` : 'none',
      }}
    >
      <Navbar onToggle={() => setSidebarOpen(s => !s)} sidebarOpen={sidebarOpen} />
      {user && <Sidebar open={sidebarOpen} />}
      <div className={`${sidebarOpen && user ? 'md:ml-64' : 'md:ml-0'} transition-all pt-16`}>
        <main className="p-4 max-w-6xl mx-auto">{children}</main>
      </div>
    </div>
  );
}
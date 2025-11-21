import { useState, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import Navbar from './Navbar';
import Sidebar from './Sidebar';
import { useAuth } from '../context/AuthContext';
import bg from '../assets/background.jpg'

export default function Layout({ children }) {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const location = useLocation();
  const { user } = useAuth();
  
  const noLayout = ['/verify-email', '/reset-password'];
  if (noLayout.includes(location.pathname)) return <>{children}</>;

  return (
    <div className={`min-h-screen bg-center bg-no-repeat ${
        user ? 'bg-slate-50' : 'bg-cover'
      }`}
      style={{
        backgroundImage: !user ? `url(${bg})` : 'none',
      }}
    >
      <Navbar onToggle={() => setSidebarOpen(s => !s)} sidebarOpen={!sidebarOpen} />
      <Sidebar open={sidebarOpen} />
      <div className={`${sidebarOpen ? 'md:ml-64' : 'md:ml-0'} transition-all pt-16`}>
        <main className="p-4 max-w-6xl mx-auto ">{children}</main>
      </div>
    </div>
  );
}
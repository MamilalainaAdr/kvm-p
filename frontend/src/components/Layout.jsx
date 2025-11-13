import { useState, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import Navbar from './Navbar';
import Sidebar from './Sidebar';

export default function Layout({ children }) {
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const location = useLocation();
  
  const noLayout = ['/', '/login', '/register', '/verify-email', '/reset-password'];
  if (noLayout.includes(location.pathname)) return <>{children}</>;

  return (
    <div className="min-h-screen bg-slate-50">
      <Navbar onToggle={() => setSidebarOpen(s => !s)} sidebarOpen={sidebarOpen} />
      <Sidebar open={sidebarOpen} />
      <div className={`${sidebarOpen ? 'md:ml-64' : 'md:ml-0'} transition-all pt-16`}>
        <main className="p-4 max-w-6xl mx-auto">{children}</main>
      </div>
    </div>
  );
}
import React, { useEffect, useState } from 'react';
import { useLocation } from 'react-router-dom';
import Navbar from './Navbar';
import Sidebar from './Sidebar';

export default function Layout({ children }) {
  const [sidebarOpen, setSidebarOpen] = useState(() => {
    try {
      return localStorage.getItem('sidebarOpen') === 'true';
    } catch {
      return true;
    }
  });
  const location = useLocation();

  useEffect(() => {
    try {
      localStorage.setItem('sidebarOpen', String(sidebarOpen));
    } catch {}
  }, [sidebarOpen]);

  // Pages publiques sans layout
  const noLayoutPaths = ['/', '/login', '/register', '/verify-email', '/reset-password'];
  const hideLayout = noLayoutPaths.includes(location.pathname);

  if (hideLayout) {
    return <>{children}</>; // Simplement rendre les enfants sans wrapper
  }

  return (
    <div className="min-h-screen bg-slate-50">
      <Navbar onToggleSidebar={() => setSidebarOpen(prev => !prev)} sidebarOpen={sidebarOpen} />

      {/* Overlay mobile */}
      <div
        className={`fixed inset-0 z-30 md:hidden transition-opacity duration-100 ${
          sidebarOpen ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'
        }`}
        onClick={() => setSidebarOpen(false)}
      />

      {/* Sidebar */}
      <div
        className={`fixed left-0 top-0 z-40 h-screen w-64 transform transition-transform duration-300 ease-in-out ${
          sidebarOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        <Sidebar />
      </div>

      {/* Contenu */}
      <div className={`${sidebarOpen ? 'md:ml-64' : 'md:ml-0'} pt-16`}>
        <main style={{ minHeight: 'calc(100vh - 4rem)', overflow: 'auto' }}>
          <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 p-4">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}
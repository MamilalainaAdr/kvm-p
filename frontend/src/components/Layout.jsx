import React, { useEffect, useState } from 'react';
import { useLocation } from 'react-router-dom';
import Navbar from './Navbar';
import Sidebar from './Sidebar';

export default function Layout({ children }) {
  const [sidebarOpen, setSidebarOpen] = useState(() => {
    try {
      return localStorage.getItem('sidebarOpen') === null ? true : localStorage.getItem('sidebarOpen') === 'true';
    } catch {
      return true;
    }
  });
  const location = useLocation();

  useEffect(() => {
    try {
      localStorage.setItem('sidebarOpen', sidebarOpen ? 'true' : 'false');
    } catch {}
  }, [sidebarOpen]);

  // paths where we don't want full layout (public pages)
  const noLayoutPaths = ['/', '/login', '/register', '/verify-email'];
  const hideLayout = noLayoutPaths.includes(location.pathname);

  if (hideLayout) {
    return (
      <div className="min-h-screen bg-slate-50">
        <main className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {children}
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50">
      <Navbar onToggleSidebar={() => setSidebarOpen(prev => !prev)} sidebarOpen={sidebarOpen} />

      {/* Sidebar + overlay */}
      {/* Sidebar wrapper is always present so we can animate it via translateX */}
      {/* We use tailwind utilities for transform/transition; -translate-x-full hides it, translate-x-0 shows it */}
      <div>
        {/* Overlay for mobile (animated opacity). Visible only on small screens when sidebarOpen */}
        <div
          className={`fixed inset-0 z-30 md:hidden transition-opacity duration-100 ${sidebarOpen ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'}`}
          onClick={() => setSidebarOpen(false)}
          aria-hidden={!sidebarOpen}
        >
          {/* empty div acts as clickable overlay */}
        </div>

        {/* Sidebar element: fixed so it occupies full height; we animate its translateX.
            On desktop the same animation is used; md:ml applied to content adjusts layout. */}
        <div
          className={`fixed left-0 top-0 z-40 h-screen w-64 transform transition-transform duration-300 ease-in-out
            ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'}`}
          aria-hidden={!sidebarOpen}
        >
          <Sidebar />
        </div>

        {/* Main content shifts when sidebarOpen on md: */}
        <div className={`${sidebarOpen ? 'md:ml-64' : 'md:ml-0'} pt-16`}>
          <main style={{ minHeight: 'calc(100vh - 4rem)', overflow: 'auto' }}>
            <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 p-4">
              {children}
            </div>
          </main>
        </div>
      </div>
    </div>
  );
}
import React, { useState, useRef, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function Navbar({ onToggleSidebar, sidebarOpen }) {
  const { user, logout } = useAuth();
  const [open, setOpen] = useState(false);
  const dropdownRef = useRef();

  // Fermer le dropdown quand on clique à l’extérieur
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <header className="fixed top-0 left-0 right-0 z-50 bg-white border-b shadow-sm">
      <div className="w-full px-4 sm:px-6 lg:px-8">
        <div className="relative flex items-center justify-center h-16">

          {/* --- LEFT: burger + logo --- */}
          <div className="absolute left-0 flex items-center gap-2">
            <button
              onClick={onToggleSidebar}
              className="p-2 rounded-md text-slate-600 hover:bg-slate-100"
              aria-label="Toggle sidebar"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 12h16M4 18h16" />
              </svg>
            </button>

            <Link to="/" className="flex items-center gap-2">
              <div className="bg-sky-600 text-white font-bold px-2 py-1 rounded">KVM-P</div>
            </Link>
          </div>

          {/* --- RIGHT: user dropdown --- */}
          <div className="absolute right-0 flex items-center gap-3">
            {!user ? (
              <>
                <Link to="/login" className="text-sky-600 hidden sm:inline">Connexion</Link>
                <Link to="/register" className="text-green-600 hidden sm:inline">Inscription</Link>
              </>
            ) : (
              <div className="relative" ref={dropdownRef}>
                {/* Bouton principal */}
                <button
                  onClick={() => setOpen(!open)}
                  className="flex items-center gap-3 px-3 py-2 rounded-md hover:bg-gray-50 focus:outline-none"
                >
                  <img
                    src={`https://ui-avatars.com/api/?name=${user.name}&background=374151&color=fff`}
                    alt="avatar"
                    className="w-8 h-8 rounded-full"
                  />
                  <div className="hidden sm:block text-sm text-slate-700 text-left">
                    <div className="font-medium">{user.name}</div>
                    <div className="text-xs text-slate-400">{user.role}</div>
                  </div>
                  <svg
                    className={`w-4 h-4 text-slate-500 transition-transform ${open ? "rotate-180" : ""}`}
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="3"
                    viewBox="0 0 24 24"
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
                  </svg>
                </button>

                {/* Menu déroulant */}
                {open && (
                  <div className="absolute right-0 mt-2 w-44 bg-white border border-gray-200 rounded-md shadow-lg z-50">
                    <div className="py-1">
                      <Link
                        to="#"
                        onClick={() => setOpen(false)}
                        className="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                      >
                        Profil
                      </Link>
                      <Link
                        to="#"
                        onClick={() => setOpen(false)}
                        className="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                      >
                        Paramètres
                      </Link>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </header>
  );
}

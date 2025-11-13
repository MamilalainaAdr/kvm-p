import React from 'react';
import { NavLink } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

function Item({ to, children, end = false }) {
  return (
    <NavLink
      to={to}
      end={end}
      className={({ isActive }) =>
        'relative flex items-center gap-3 px-4 py-2 rounded-md text-sm hover:bg-slate-50 ' +
        (isActive ? 'bg-slate-50 font-semibold text-slate-900' : 'text-slate-700')
      }
    >
      {({ isActive }) => (
        <>
          {isActive && <span className="absolute left-0 top-0 bottom-0 w-1 bg-yellow-500 rounded-r" />}
          <span className="pl-3">{children}</span>
        </>
      )}
    </NavLink>
  );
}

export default function Sidebar() {
  const { user, logout } = useAuth();

  return (
    <aside className="w-auto bg-white h-screen p-3 border-r flex flex-col" aria-label="Sidebar">
      <div className="pt-16 flex-1 overflow-y-auto">
        <nav className="space-y-1 mb-10">
          <div className="mb-3 px-2 text-xs text-slate-400 uppercase">Navigation</div>
          
          <Item to="/dashboard" end={true}>Dashboard</Item>
          
          {user?.role === 'admin' && (
            <Item to="/admin/vms">Machines</Item>
          )}
          
          {user?.role === 'user' && (
            <Item to="/vms">Machines</Item>
          )}
        </nav>
      </div>
      
      <div className="mt-4 mb-5">
        <button onClick={logout}
          className="w-full flex justify-center py-2 rounded-md text-sm bg-red-600 hover:bg-red-700 text-white font-medium">
          Logout
        </button>
      </div>
    </aside>
  );
}
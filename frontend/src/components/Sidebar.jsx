import { NavLink } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function Sidebar({ open }) {
  const { user } = useAuth();

  return (
    <aside className={`${open ? 'translate-x-0' : '-translate-x-full'} fixed left-0 top-0 z-40 h-screen w-64 bg-white border-r transition-transform`}>
      <nav className="pt-20 p-4 space-y-2">
        <NavLink to="/dashboard" className={({ isActive }) => `block p-2 rounded ${isActive ? 'bg-slate-100 font-semibold' : ''}`}>
          Dashboard
        </NavLink>
        {user?.role === 'admin' ? (
          <NavLink to="/admin/vms" className={({ isActive }) => `block p-2 rounded ${isActive ? 'bg-slate-100 font-semibold' : ''}`}>
            Machines
          </NavLink>
        ) : (
          <NavLink to="/vms" className={({ isActive }) => `block p-2 rounded ${isActive ? 'bg-slate-100 font-semibold' : ''}`}>
            Mes VMs
          </NavLink>
        )}
      </nav>
    </aside>
  );
}
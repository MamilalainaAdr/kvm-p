import { NavLink } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function Sidebar({ open }) {
  const { user } = useAuth();

  const linkClasses = (isActive) =>
    `flex items-center p-2 border-l-4 ${
      isActive
        ? 'border-yellow-500 bg-slate-100 font-semibold' // actif : bordure colorée + fond + texte en gras
        : 'border-transparent hover:bg-slate-50' // inactif : bordure transparente + hover
    }`;

  return (
    <aside
      className={`${
        open ? 'translate-x-0' : '-translate-x-full'
      } fixed left-0 top-0 z-40 h-screen w-64 bg-white border-r transition-transform`}
    >
      <nav className="pt-20 p-4 space-y-2">
        <NavLink to="/dashboard" className={({ isActive }) => linkClasses(isActive)}>
          Dashboard
        </NavLink>

        {user?.role === 'admin' ? (
          <>
            <NavLink to="/admin/users" className={({ isActive }) => linkClasses(isActive)}>
              Utilisateurs
            </NavLink>
            <NavLink to="/admin/vms" className={({ isActive }) => linkClasses(isActive)}>
              Machines
            </NavLink>
          </>
        ) : (
          <NavLink to="/vms" className={({ isActive }) => linkClasses(isActive)}>
            Machines
          </NavLink>
        )}
      </nav>
    </aside>
  );
}

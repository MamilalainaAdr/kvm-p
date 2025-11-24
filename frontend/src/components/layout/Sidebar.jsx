import { NavLink } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { LayoutDashboard, Server, Users } from 'lucide-react';

const navItems = [
  { path: '/dashboard', label: 'Dashboard', icon: LayoutDashboard, roles: ['user', 'admin'] },
  { path: '/vms', label: 'Machines', icon: Server, roles: ['user'] },
  { path: '/admin/users', label: 'Utilisateurs', icon: Users, roles: ['admin'] },
  { path: '/admin/vms', label: 'Machines', icon: Server, roles: ['admin'] },
];

export default function Sidebar({ open }) {
  const { user } = useAuth();
  if (!user) return null;

  return (
    <aside
      className={[
        'fixed left-0 top-0 z-40 h-screen w-64 bg-surface border-r',
        'transition-transform duration-300 ease-in-out',
        // ✅ CORRECTION : Retirer md:translate-x-0 pour que le toggle fonctionne sur toutes les tailles
        open ? 'translate-x-0' : '-translate-x-full'
      ].join(' ')}
    >
      <nav className="pt-20 p-4 space-y-1">
        {navItems
          .filter(item => item.roles.includes(user.role))
          .map(({ path, label, icon: Icon }) => (
            <NavLink 
              key={path}
              to={path} 
              className={({ isActive }) => [
                'flex items-center gap-3 px-4 py-3 rounded-lg transition-all',
                'text-text hover:bg-background',
                isActive && 'bg-primary text-white hover:bg-primary'
              ].join(' ')}
            >
              <Icon className="w-5 h-5" />
              <span className="font-medium">{label}</span>
            </NavLink>
          ))
        }
      </nav>
    </aside>
  );
}
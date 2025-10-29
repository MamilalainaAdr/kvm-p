import React from 'react';
import { Outlet, useLocation } from 'react-router-dom';

export default function AdminLayout() {
  const location = useLocation();
  const title = location.pathname.endsWith('/vms') ? 'Machines virtuelles' : 'Utilisateurs du système';

  return (
    <div className="container mt-6">
      <div>
        <div className="flex items-center justify-between">
          <h2 className="text-2xl font-bold">{title}</h2>
        </div>

        <div className="mt-4">
          <Outlet />
        </div>
      </div>
    </div>
  );
}
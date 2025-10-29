import React from 'react';
import { Routes, Route } from 'react-router-dom';
import Layout from './components/Layout';
import Home from './pages/Home';
import Login from './pages/Login';
import Register from './pages/Register';
import VerifyEmail from './pages/VerifyEmail';
import Dashboard from './pages/Dashboard';
import VMs from './pages/VMs';
import AdminLayout from './pages/AdminLayout';
import AdminUsers from './pages/AdminUsers';
import AdminVirsh from './components/AdminVirsh';
import PrivateRoute from './components/PrivateRoute';
import AdminRoute from './components/AdminRoute';

export default function App() {
  return (
    <Layout>
      <Routes>
        {/* Public */}
        <Route path="/" element={<Home />} />
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route path="/verify-email" element={<VerifyEmail />} />

        {/* User routes */}
        <Route
          path="/dashboard"
          element={<PrivateRoute><Dashboard /></PrivateRoute>}
        />
        <Route
          path="/dashboard/vms"
          element={<PrivateRoute><VMs /></PrivateRoute>}
        />

        {/* Admin area: AdminRoute protects the whole section.
            Navigation between "Utilisateurs" and "Machines" is handled by the sidebar.
            /admin -> AdminUsers (index)
            /admin/vms -> AdminVirsh */}
        <Route path="/admin" element={<AdminRoute><AdminLayout /></AdminRoute>}>
          <Route index element={<AdminUsers />} />
          <Route path="vms" element={<AdminVirsh />} />
        </Route>

        {/* Fallback: redirect unknown to home (or custom 404) */}
        <Route path="*" element={<Home />} />
      </Routes>
    </Layout>
  );
}
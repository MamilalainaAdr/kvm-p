import React, { useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function Home(){
  const { user, loading } = useAuth();
  const nav = useNavigate();

  useEffect(() => {
    if (!loading && user) {
      nav('/dashboard', { replace: true });
    }
  }, [user, loading, nav]);

  if (!loading && user) return null;

  return (
    <div className="text-center mt-10">
      <h1 className="text-3xl font-bold">KVM Platform</h1>
      <p className="mt-4">Gestion simple de VMs — admin et utilisateurs</p>
      <div className="mt-6 flex justify-center gap-4">
        <Link to="/register" className="px-4 py-2 bg-green-600 text-white rounded">S'inscrire</Link>
        <Link to="/login" className="px-4 py-2 bg-blue-600 text-white rounded">Se connecter</Link>
      </div>
    </div>
  );
}
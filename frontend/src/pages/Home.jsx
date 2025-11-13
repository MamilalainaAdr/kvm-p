import React from 'react';
import { Link } from 'react-router-dom';

export default function Home() {
  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center">
      <div className="text-center">
        <h1 className="text-5xl font-bold text-slate-900 mb-4">OBox</h1>
        <p className="text-lg text-slate-600 mb-8">Gestion simple de VMs — admin et utilisateurs</p>
        <div className="flex justify-center gap-4">
          <Link to="/register" className="px-6 py-3 bg-green-600 text-white rounded-lg font-medium hover:bg-green-700 transition">
            S'inscrire
          </Link>
          <Link to="/login" className="px-6 py-3 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 transition">
            Se connecter
          </Link>
        </div>
      </div>
    </div>
  );
}
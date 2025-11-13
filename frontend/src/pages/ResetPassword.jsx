import React, { useState, useEffect } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import API from '../services/api';
import toast from 'react-hot-toast';

export default function ResetPassword() {
  const [searchParams] = useSearchParams();
  const token = searchParams.get('token');
  const [step, setStep] = useState('request'); // request | reset | success
  const [email, setEmail] = useState('');
  const [passwords, setPasswords] = useState({ new: '', confirm: '' });

  useEffect(() => {
    if (token) setStep('reset');
  }, [token]);

  const requestReset = async (e) => {
    e.preventDefault();
    try {
      await API.post('/profile/reset-password-request', { email });
      toast.success('Email envoyé! Vérifiez votre boîte.');
      setStep('success');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Erreur');
    }
  };

  const reset = async (e) => {
    e.preventDefault();
    if (passwords.new !== passwords.confirm) {
      toast.error('Mots de passe différents');
      return;
    }
    
    try {
      await API.post('/profile/reset-password', { token, newPassword: passwords.new });
      toast.success('Mot de passe réinitialisé! Connectez-vous.');
      setStep('success');
    } catch (err) {
      toast.error('Token invalide ou expiré');
    }
  };

  return (
    <div className="container mt-8">
      {step === 'request' && (
        <div className="max-w-md mx-auto bg-white p-6 rounded shadow">
          <h2 className="text-xl font-bold mb-4">Réinitialiser Mot de passe</h2>
          <form onSubmit={requestReset} className="space-y-4">
            <input type="email" className="w-full p-2 border rounded" placeholder="Email"
              value={email} onChange={e => setEmail(e.target.value)} required />
            <button type="submit" className="w-full bg-blue-600 text-white p-2 rounded hover:bg-blue-700">
              Envoyer Email
            </button>
          </form>
          <div className="mt-4 text-center">
            <Link to="/login" className="text-blue-600 text-sm">Retour à la connexion</Link>
          </div>
        </div>
      )}

      {step === 'reset' && (
        <div className="max-w-md mx-auto bg-white p-6 rounded shadow">
          <h2 className="text-xl font-bold mb-4">Nouveau Mot de passe</h2>
          <form onSubmit={reset} className="space-y-4">
            <input type="password" className="w-full p-2 border rounded" placeholder="Nouveau mot de passe"
              value={passwords.new} onChange={e => setPasswords({...passwords, new: e.target.value})} required />
            <input type="password" className="w-full p-2 border rounded" placeholder="Confirmer"
              value={passwords.confirm} onChange={e => setPasswords({...passwords, confirm: e.target.value})} required />
            <button type="submit" className="w-full bg-green-600 text-white p-2 rounded hover:bg-green-700">
              Réinitialiser
            </button>
          </form>
        </div>
      )}

      {step === 'success' && (
        <div className="max-w-md mx-auto bg-white p-6 rounded shadow text-center">
          <h3 className="text-green-600 font-bold mb-4">✅ Succès</h3>
          <p className="mb-4">Mot de passe mis à jour!</p>
          <Link to="/login" className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700">
            Se connecter
          </Link>
        </div>
      )}
    </div>
  );
}
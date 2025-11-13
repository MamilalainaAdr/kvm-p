import { useState, useEffect } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import API from '../services/api';

export default function ResetPassword() {
  const [searchParams] = useSearchParams();
  const token = searchParams.get('token');
  const [step, setStep] = useState(token ? 'reset' : 'request');
  const [email, setEmail] = useState('');
  const [passwords, setPasswords] = useState({ new: '', confirm: '' });

  const request = async (e) => {
    e.preventDefault();
    await API.post('/auth/reset-password-request', { email });
    setStep('success');
  };

  const reset = async (e) => {
    e.preventDefault();
    if (passwords.new !== passwords.confirm) return alert('Mots de passe différents');
    await API.post('/auth/reset-password', { token, newPassword: passwords.new });
    setStep('success');
  };

  return (
    <div className="container mt-8">
      {step === 'request' && (
        <form onSubmit={request} className="max-w-md mx-auto bg-white p-6 rounded shadow space-y-4">
          <h2 className="text-xl font-bold">Réinitialiser mot de passe</h2>
          <input type="email" placeholder="Email" value={email} onChange={e => setEmail(e.target.value)} className="w-full p-2 border rounded" required />
          <button type="submit" className="w-full bg-blue-600 text-white p-2 rounded">Envoyer</button>
        </form>
      )}
      {step === 'reset' && (
        <form onSubmit={reset} className="max-w-md mx-auto bg-white p-6 rounded shadow space-y-4">
          <h2 className="text-xl font-bold">Nouveau mot de passe</h2>
          <input type="password" placeholder="Nouveau mot de passe" value={passwords.new} onChange={e => setPasswords({...passwords, new: e.target.value})} className="w-full p-2 border rounded" required />
          <input type="password" placeholder="Confirmer" value={passwords.confirm} onChange={e => setPasswords({...passwords, confirm: e.target.value})} className="w-full p-2 border rounded" required />
          <button type="submit" className="w-full bg-green-600 text-white p-2 rounded">Réinitialiser</button>
        </form>
      )}
      {step === 'success' && (
        <div className="max-w-md mx-auto bg-white p-6 rounded shadow text-center">
          <p className="text-green-600 mb-4">Email envoyé ! Vérifiez votre boîte.</p>
          <Link to="/login" className="text-blue-600">Se connecter</Link>
        </div>
      )}
    </div>
  );
}
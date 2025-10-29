import React, { useState, useEffect } from 'react';
import API from '../services/api';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function Login(){
  const [email,setEmail]=useState('');
  const [password,setPassword]=useState('');
  const [err,setErr]=useState(null);
  const nav = useNavigate();
  const { user, loading, refresh } = useAuth();

  // si déjà connecté, rediriger vers /dashboard
  useEffect(() => {
    if (!loading && user) {
      nav('/dashboard', { replace: true });
    }
  }, [user, loading, nav]);

  const submit = async (e) => {
    e.preventDefault();
    try {
      await API.post('/auth/login', { email, password });
      await refresh();
      const me = (await API.get('/auth/me')).data?.user;
      if (me?.role === 'admin') {
        nav('/admin');
      } else {
        nav('/dashboard');
      }
    } catch (err) {
      setErr(err.response?.data?.message || 'Erreur');
    }
  };

  if (!loading && user) return null; // évite flicker pendant redirection

  return (
    <div className="max-w-md mx-auto mt-8 bg-white p-6 rounded shadow">
      <h2 className="text-xl font-bold mb-4">Se connecter</h2>
      {err && <div className="mb-2 text-red-600">{err}</div>}
      <form onSubmit={submit}>
        <input className="w-full mb-2 p-2 border" placeholder="Email" value={email} onChange={e=>setEmail(e.target.value)} />
        <input className="w-full mb-2 p-2 border" placeholder="Mot de passe" type="password" value={password} onChange={e=>setPassword(e.target.value)} />
        <button className="w-full bg-blue-600 text-white p-2 rounded">Se connecter</button>
      </form>
    </div>
  );
}
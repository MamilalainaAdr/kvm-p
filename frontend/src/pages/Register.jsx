import React, { useState, useEffect } from 'react';
import API from '../services/api';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function Register(){
  const [name,setName]=useState('');
  const [email,setEmail]=useState('');
  const [password,setPassword]=useState('');
  const [msg,setMsg]=useState(null);
  const nav = useNavigate();
  const { user, loading } = useAuth();

  // si déjà connecté, rediriger vers /dashboard
  useEffect(() => {
    if (!loading && user) {
      nav('/dashboard', { replace: true });
    }
  }, [user, loading, nav]);

  const submit = async (e) => {
    e.preventDefault();
    try {
      await API.post('/auth/register', { name, email, password });
      setMsg('Inscription ok. Vérifiez votre email.');
      nav('/login');
    } catch (err) {
      setMsg(err.response?.data?.message || 'Erreur');
    }
  };

  if (!loading && user) return null;

  return (
    <div className="max-w-md mx-auto mt-8 bg-white p-6 rounded shadow">
      <h2 className="text-xl font-bold mb-4">S'inscrire</h2>
      {msg && <div className="mb-2 text-red-600">{msg}</div>}
      <form onSubmit={submit}>
        <input className="w-full mb-2 p-2 border" placeholder="Nom" value={name} onChange={e=>setName(e.target.value)} />
        <input className="w-full mb-2 p-2 border" placeholder="Email" value={email} onChange={e=>setEmail(e.target.value)} />
        <input className="w-full mb-2 p-2 border" placeholder="Mot de passe" type="password" value={password} onChange={e=>setPassword(e.target.value)} />
        <button className="w-full bg-green-600 text-white p-2 rounded">S'inscrire</button>
      </form>
    </div>
  );
}
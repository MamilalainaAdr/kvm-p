import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import API from '../services/api';

export default function Register() {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [message, setMessage] = useState('');
  const navigate = useNavigate();
  const { user, loading } = useAuth();

  useEffect(() => {
    if (!loading && user) navigate('/dashboard', { replace: true });
  }, [user, loading, navigate]);

  const submit = async (e) => {
    e.preventDefault();
    try {
      await API.post('/auth/register', { name, email, password });
      setMessage('Compte créé ! Consultez vos emails.');
      setTimeout(() => navigate('/login'), 2000);
    } catch (err) {
      setMessage(err.response?.data?.message || 'Erreur');
    }
  };

  if (!loading && user) return null;

  return (
    <div className="max-w-md mx-auto mt-8 bg-white p-6 rounded shadow">
      <h2 className="text-xl font-bold mb-4">S'inscrire</h2>
      {message && <div className="mb-4 text-green-600">{message}</div>}
      <form onSubmit={submit} className="space-y-4">
        <input placeholder="Nom" value={name} onChange={e => setName(e.target.value)} className="w-full p-2 border rounded" required />
        <input type="email" placeholder="Email" value={email} onChange={e => setEmail(e.target.value)} className="w-full p-2 border rounded" required />
        <input type="password" placeholder="Mot de passe" value={password} onChange={e => setPassword(e.target.value)} className="w-full p-2 border rounded" required />
        <button type="submit" className="w-full bg-green-600 text-white p-2 rounded hover:bg-green-700">S'inscrire</button>
      </form>
      <div className='mt-4 text-center'>
        <p className='text-sm text-gray-600'>Vous avez déjà un compte? <a className='text-sm text-blue-600 hover:text-blue-800 ' href="/login">Se connecter</a></p>
      </div>
      
    </div>
  );
}
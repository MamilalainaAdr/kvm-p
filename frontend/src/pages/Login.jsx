import { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import API from '../services/api';

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const navigate = useNavigate();
  const { user, loading, refresh } = useAuth();

  useEffect(() => {
    if (!loading && user) navigate('/dashboard', { replace: true });
  }, [user, loading, navigate]);

  const submit = async (e) => {
    e.preventDefault();
    try {
      await API.post('/auth/login', { email, password });
      await refresh();
      navigate('/dashboard');
    } catch (err) {
      setError(err.response?.data?.message || 'Erreur');
    }
  };

  if (!loading && user) return null;

  return (
    <div className="max-w-md mx-auto mt-8 bg-white p-6 rounded shadow">
      <h2 className="text-xl font-bold mb-4">Se connecter</h2>
      {error && <div className="mb-4 text-red-600">{error}</div>}
      <form onSubmit={submit} className="space-y-4">
        <input type="email" placeholder="Email" value={email} onChange={e => setEmail(e.target.value)} className="w-full p-2 border rounded" required />
        <input type="password" placeholder="Mot de passe" value={password} onChange={e => setPassword(e.target.value)} className="w-full p-2 border rounded" required />
        <button type="submit" className="w-full bg-blue-600 text-white p-2 rounded hover:bg-blue-700">Se connecter</button>
      </form>
      <div className="mt-4 text-center">
        <Link to="/reset-password" className="text-sm text-blue-600">Mot de passe oublié ?</Link>
      </div>
      <div className='mt-4 text-center'>
        <p className='text-sm text-gray-600'>Vous n'avez pas de compte? <Link className='text-sm text-green-600 hover:text-green-800' to="/register">S'inscrire</Link></p>
      </div>
    </div>
  );
}
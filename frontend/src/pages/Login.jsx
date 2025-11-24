import { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import API from '../services/api';
import ConfirmModal from '../components/ConfirmModal';

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
    <div className="w-full min-h-screen flex items-start justify-center">
      <div className="flex flex-1 mt-52 flex-col md:flex-row items-center justify-start gap-x-20 w-full h-full px-6 md:px-16 lg:px-24">

        <div className="hidden md:flex flex-col justify-center space-y-8 text-left w-full md:w-1/2">
          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold text-gray-600 leading-tight">
            Facile, <br /> complète <br /> et personnalisée
          </h1>

          <p className="text-gray-700 text-lg md:text-xl">
            Gérez vos machines simplement avec{' '}
            <span className="font-semibold text-red-600">OBox</span>.
          </p>
        </div>

        <div className="w-full md:w-1/2 flex justify-center mt-10 md:mt-0 jump">
          <div className="w-full max-w-md bg-white p-8 rounded-xl shadow-lg">
            <h2 className="text-2xl text-center font-bold mb-4 text-gray-800">Se connecter</h2>

            {error && <div className="mb-4 text-red-600">{error}</div>}

            <form onSubmit={submit} className="space-y-4">
              <input
                type="email"
                placeholder="Email"
                value={email}
                onChange={e => setEmail(e.target.value)}
                className="w-full p-3 border rounded-lg focus:ring-2 focus:ring-red-500 outline-none"
                required
              />

              <input
                type="password"
                placeholder="Mot de passe"
                value={password}
                onChange={e => setPassword(e.target.value)}
                className="w-full p-3 border rounded-lg focus:ring-2 focus:ring-red-500 outline-none"
                required
              />

              <button
                type="submit"
                className="w-full bg-red-600 text-white p-3 rounded-lg font-semibold hover:bg-red-700 shadow-md transition"
              >
                Se connecter
              </button>
            </form>

            <div className="mt-4 mb-6 text-center">
              <Link to="/reset-password" className="text-sm underline text-orange-600 hover:text-orange-800">
                Mot de passe oublié ?
              </Link>
            </div>
            <div className="mt-2 h-px w-1/3 bg-slate-400 mx-auto"></div>

            <div className="mt-6 mb-10 text-center">
              <p className="text-sm text-gray-600">
                Vous n'avez pas de compte ?{' '}
                <Link
                  className="text-sm text-yellow-600 hover:text-yellow-800 hover:underline"
                  to="/register"
                >
                  S'inscrire
                </Link>
              </p>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}
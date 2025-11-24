import { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import API from '../../services/api';
import { Mail} from 'lucide-react';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { Card } from '../../components/ui/Card';
import AuthLayout from '../../components/layout/AuthLayout';

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const { user, loading: authLoading, refresh } = useAuth();

  useEffect(() => {
    if (!authLoading && user) navigate('/dashboard', { replace: true });
  }, [user, authLoading, navigate]);

  const submit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      await API.post('/auth/login', { email, password });
      await refresh();
      navigate('/dashboard');
    } catch (err) {
      setError(err.response?.data?.message || 'Erreur de connexion');
    } finally {
      setLoading(false);
    }
  };

  if (!authLoading && user) return null;

  return (
    <AuthLayout>
      <div className="min-h-screen flex items-start justify-center px-4 py-8">
        <div className="w-full max-w-md">
          <Card>
            <div className="text-center mb-6">
              <h2 className="text-2xl font-bold text-text">Connexion</h2>
              <p className="text-muted mt-1">Bienvenue sur OBox</p>
            </div>

            {error && (
              <div className="mb-4 p-3 bg-error/10 text-error rounded-lg text-sm">
                {error}
              </div>
            )}

            <form onSubmit={submit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-text mb-1">Email</label>
                <Input
                  type="email"
                  placeholder="vous@exemple.com"
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  required
                  icon={<Mail className="w-5 h-5 text-muted" />}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-text mb-1">Mot de passe</label>
                <Input
                  type="password"
                  placeholder="••••••••"
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  required
                />
              </div>

              <Button 
                type="submit" 
                loading={loading}
                className="w-full"
                size="lg"
              >
                Se connecter
              </Button>
            </form>

            <div className="mt-6 space-y-3 text-center">
              <Link 
                to="/reset-password" 
                className="text-sm underline text-accent hover:underline font-medium"
              >
                Mot de passe oublié ?
              </Link>
              
              <div className="text-sm text-muted">
                Vous n'avez pas de compte ? {' '}
                <Link 
                  to="/register" 
                  className="text-primary hover:text-primaryDark font-semibold inline-flex items-center gap-1"
                >
                  S'inscrire
                </Link>
              </div>
            </div>
          </Card>
        </div>
      </div>
    </AuthLayout>
 );
}
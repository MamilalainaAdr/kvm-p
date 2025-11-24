import { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import API from '../../services/api';
import { User, Mail, Lock, ArrowRight } from 'lucide-react';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { Card } from '../../components/ui/Card';
import AuthLayout from '../../components/layout/AuthLayout';

export default function Register() {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const { user, loading: authLoading } = useAuth();

  useEffect(() => {
    if (!authLoading && user) navigate('/dashboard', { replace: true });
  }, [user, authLoading, navigate]);

  const submit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      await API.post('/auth/register', { name, email, password });
      setMessage('Compte créé ! Consultez vos emails.');
      setTimeout(() => navigate('/login'), 2000);
    } catch (err) {
      setMessage(err.response?.data?.message || 'Erreur');
    } finally {
      setLoading(false);
    }
  };

  if (!authLoading && user) return null;

  return (
    <AuthLayout>
      <div className="min-h-screen flex items-start justify-center px-4">
        <div className="w-full max-w-md">
          <Card>
            <div className="text-center mb-6">
              <h2 className="text-2xl font-bold text-text">Inscription</h2>
              <p className="text-muted mt-1">Créez votre compte OBox</p>
            </div>

            {message && (
              <div className="mb-4 p-3 bg-success/10 text-success rounded-lg text-sm">
                {message}
              </div>
            )}

            <form onSubmit={submit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-text mb-1">Nom</label>
                <Input
                  placeholder="Jean Dupont"
                  value={name}
                  onChange={e => setName(e.target.value)}
                  required
                  icon={<User className="w-5 h-5 text-muted" />}
                />
              </div>

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
                  minLength={6}
                />
              </div>

              <Button 
                type="submit" 
                loading={loading}
                className="w-full"
                size="lg"
              >
                S'inscrire
              </Button>
            </form>

            <div className="mt-6 text-center text-sm text-muted">
              Vous avez déjà un compte ? {' '}
              <Link 
                to="/login" 
                className="text-primary hover:text-primaryDark font-semibold inline-flex items-center gap-1"
              >
                Se connecter
              </Link>
            </div>
          </Card>
        </div>
      </div>
    </AuthLayout>
  );
}
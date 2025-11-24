import { useState, useEffect } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import API from '../services/api';
import { Key, Mail, CheckCircle, XCircle } from 'lucide-react';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { Card } from '../components/ui/Card';
import toast from 'react-hot-toast';
import AuthLayout from '../components/layout/AuthLayout';

export default function ResetPassword() {
  const [searchParams] = useSearchParams();
  const token = searchParams.get('token');
  const [step, setStep] = useState(token ? 'reset' : 'request');
  const [email, setEmail] = useState('');
  const [passwords, setPasswords] = useState({ new: '', confirm: '' });
  const [loading, setLoading] = useState(false);
  const [tokenValid, setTokenValid] = useState(false);

  useEffect(() => {
    if (token) validateToken();
  }, [token]);

  const validateToken = async () => {
    try {
      await API.get(`/auth/verify-reset-token?token=${encodeURIComponent(token)}`);
      setTokenValid(true);
    } catch (err) {
      toast.error('Token invalide ou expiré');
      setStep('request');
    }
  };

  const request = async (e) => {
    e.preventDefault();
    if (!email?.includes('@')) {
      toast.error('Email invalide');
      return;
    }
    setLoading(true);
    try {
      await API.post('/auth/reset-password-request', { email });
      toast.success('Email envoyé ! Vérifiez votre boîte (et les spams)');
      setStep('success');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Erreur envoi email');
    } finally {
      setLoading(false);
    }
  };

  const reset = async (e) => {
    e.preventDefault();
    if (passwords.new.length < 6) {
      toast.error('Mot de passe trop court (min 6 caractères)');
      return;
    }
    if (passwords.new !== passwords.confirm) {
      toast.error('Les mots de passe ne correspondent pas');
      return;
    }
    setLoading(true);
    try {
      await API.post('/auth/reset-password', { token, newPassword: passwords.new });
      toast.success('Mot de passe réinitialisé ! Vous pouvez vous connecter');
      setStep('success');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Erreur réinitialisation');
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthLayout>
      <div className="min-h-screen flex items-start justify-center px-4 py-8">
        <div className="w-full max-w-md">
          {step === 'request' && (
            <Card>
              <div className="text-center mb-6">
                <h2 className="text-2xl font-bold text-text flex items-center justify-center gap-2">
                  Mot de passe oublié ?
                </h2>
                <p className="text-muted mt-1">Entrez votre email</p>
              </div>

              <form onSubmit={request} className="space-y-4">
                <Input
                  type="email"
                  placeholder="vous@exemple.com"
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  required
                  icon={<Mail className="w-5 h-5" />}
                />
                <Button type="submit" loading={loading} className="w-full">
                  Envoyer le lien
                </Button>
              </form>
            </Card>
          )}

          {step === 'reset' && (
            <Card>
              <div className="text-center mb-6">
                <h2 className="text-2xl font-bold text-text flex items-center justify-center gap-2">
                  Nouveau mot de passe
                </h2>
              </div>

              {!tokenValid && (
                <div className="mb-4 p-3 bg-error/10 text-error rounded-lg flex items-center gap-2">
                  <XCircle className="w-4 h-4" />
                  Token invalide ou expiré
                </div>
              )}

              <form onSubmit={reset} className="space-y-4">
                <Input
                  type="password"
                  placeholder="Nouveau mot de passe"
                  value={passwords.new}
                  onChange={e => setPasswords({...passwords, new: e.target.value})}
                  required
                  disabled={!tokenValid || loading}
                />
                <Input
                  type="password"
                  placeholder="Confirmer le mot de passe"
                  value={passwords.confirm}
                  onChange={e => setPasswords({...passwords, confirm: e.target.value})}
                  required
                  disabled={!tokenValid || loading}
                />
                <Button 
                  type="submit" 
                  loading={loading}
                  disabled={!tokenValid || loading}
                  className="w-full"
                  variant="primary"
                >
                  Réinitialiser
                </Button>
              </form>
            </Card>
          )}

          {step === 'success' && (
            <Card>
              <div className="text-center space-y-4">
                <CheckCircle className="w-12 h-12 text-success mx-auto" />
                <h2 className="text-xl font-bold text-text">
                  {token ? 'Mot de passe réinitialisé !' : 'Email envoyé !'}
                </h2>
                <p className="text-muted">
                  {token 
                    ? 'Vous pouvez maintenant vous connecter avec votre nouveau mot de passe.' 
                    : 'Vérifiez votre boîte mail pour le lien de réinitialisation.'}
                </p>
                <Link 
                  to="/login" 
                  className="inline-flex items-center gap-2 px-4 py-2 bg-primary hover:bg-primaryDark text-white rounded-lg font-medium transition-colors"
                >
                  Se connecter
                </Link>
              </div>
            </Card>
          )}
        </div>
      </div>
    </AuthLayout>
  );
}
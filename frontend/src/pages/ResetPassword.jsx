import { useState, useEffect } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import API from '../services/api';
import toast from 'react-hot-toast';

export default function ResetPassword() {
  const [searchParams] = useSearchParams();
  const token = searchParams.get('token');
  const [step, setStep] = useState(token ? 'reset' : 'request');
  const [email, setEmail] = useState('');
  const [passwords, setPasswords] = useState({ new: '', confirm: '' });
  const [loading, setLoading] = useState(false);
  const [tokenValid, setTokenValid] = useState(false);

  // ✅ VALIDATION DU TOKEN AU CHARGEMENT
  useEffect(() => {
    if (token) {
      validateToken();
    }
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
    if (!email || !email.includes('@')) {
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
    
    // ✅ VALIDATION CÔTÉ CLIENT
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
    <div className="min-h-screen flex items-start justify-center mt-48">
      <div className="w-full max-w-md">
        
        {step === 'request' && (
          <form onSubmit={request} className="bg-white p-8 rounded-xl shadow-lg space-y-4">
            <h2 className="text-2xl text-center text-slate-800 font-bold">Mot de passe oublié ?</h2>
            <p className="text-slate-600 text-sm">Entrez votre email :</p>
            <input 
              type="email" 
              placeholder="exemple@gmail.com" 
              value={email} 
              onChange={e => setEmail(e.target.value)} 
              className="w-full p-3 border border-slate-300 rounded-lg focus:border-slate-500 " 
              required 
              disabled={loading}
            />
            <button 
              type="submit" 
              disabled={loading}
              className="w-full bg-orange-600 hover:bg-orange-700 disabled:bg-orange-300 transition font-semibold text-white p-3 rounded-lg"
            >
              {loading ? 'Envoi en cours...' : 'Réinitialiser'}
            </button>
          </form>
        )}

        {step === 'reset' && (
          <form onSubmit={reset} className="bg-white p-8 rounded-xl shadow-lg space-y-4">
            <h2 className="text-2xl font-bold text-center text-slate-800">Nouveau mot de passe</h2>
            
            {!tokenValid && (
              <div className="p-3 bg-red-100 text-red-700 rounded-lg">
                Token invalide ou expiré
              </div>
            )}

            <input 
              type="password" 
              placeholder="Nouveau mot de passe" 
              value={passwords.new} 
              onChange={e => setPasswords({...passwords, new: e.target.value})} 
              className="w-full p-3 border border-slate-300 rounded-lg" 
              required 
              disabled={!tokenValid || loading}
            />
            <input 
              type="password" 
              placeholder="Confirmer le mot de passe" 
              value={passwords.confirm} 
              onChange={e => setPasswords({...passwords, confirm: e.target.value})} 
              className="w-full p-3 border border-slate-300 rounded-lg" 
              required 
              disabled={!tokenValid || loading}
            />
            <button 
              type="submit" 
              disabled={!tokenValid || loading}
              className="w-full bg-orange-600 hover:bg-orange-700 disabled:bg-green-300 transition font-semibold text-white p-3 rounded-lg"
            >
              {loading ? 'Mise à jour...' : 'Réinitialiser'}
            </button>
          </form>
        )}

        {step === 'success' && (
          <div className="bg-white p-8 rounded-xl shadow-lg text-center space-y-4">
            <h2 className="text-xl font-bold text-orange-600">
              {token ? 'Mot de passe réinitialisé !' : 'Email envoyé !'}
            </h2>
            <p className="text-slate-600">
              {token 
                ? '' 
                : 'Vérifiez votre boîte mail pour le lien de réinitialisation.'}
            </p>
            <Link 
              to="/login" 
              className="inline-block w-full bg-orange-600 hover:bg-orange-700 text-white font-semibold p-3 rounded-lg"
            >
              Se connecter
            </Link>
          </div>
        )}
        
      </div>
    </div>
  );
}
import { useEffect, useState } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import API from '../services/api';
import { Mail, CheckCircle, XCircle, ArrowRight } from 'lucide-react';
import { Card } from '../components/ui/Card';

export default function VerifyEmail() {
  const [searchParams] = useSearchParams();
  const token = searchParams.get('token');
  const [status, setStatus] = useState('loading');
  const [message, setMessage] = useState('');

  useEffect(() => {
    if (!token) {
      setStatus('error');
      setMessage('Token manquant');
      return;
    }

    API.get(`/auth/verify-email?token=${encodeURIComponent(token)}`)
      .then((res) => {
        setStatus('success');
        setMessage(res.data.message);
      })
      .catch((err) => {
        setStatus('error');
        setMessage(err.response?.data?.message || 'Erreur');
      });
  }, [token]);

  return (
    <div className="min-h-screen flex items-center justify-center px-4 py-8">
      <div className="w-full max-w-md">
        <Card>
          <div className="text-center space-y-4">
            {status === 'loading' && (
              <>
                <Mail className="w-12 h-12 text-accent animate-pulse mx-auto" />
                <p className="text-muted">Vérification en cours...</p>
              </>
            )}
            
            {status === 'success' && (
              <>
                <CheckCircle className="w-12 h-12 text-success mx-auto" />
                <p className="text-muted font-medium">{message}</p>
                <Link 
                  to="/login" 
                  className="inline-flex items-center gap-2 px-4 py-2 bg-primary hover:bg-primaryDark text-white rounded-lg font-medium transition-colors"
                >
                  Se connecter
                  <ArrowRight className="w-4 h-4" />
                </Link>
              </>
            )}
            
            {status === 'error' && (
              <>
                <XCircle className="w-12 h-12 text-error mx-auto" />
                <p className="text-muted font-medium">{message}</p>
                <Link 
                  to="/register" 
                  className="inline-flex items-center gap-2 px-4 py-2 bg-accent hover:bg-blue-600 text-white rounded-lg font-medium transition-colors"
                >
                  S'inscrire
                  <ArrowRight className="w-4 h-4" />
                </Link>
              </>
            )}
          </div>
        </Card>
      </div>
    </div>
  );
}
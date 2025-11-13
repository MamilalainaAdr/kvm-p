import { useEffect, useState } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import API from '../services/api';

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
    <div className="container mt-8">
      <div className="max-w-md mt-6 mx-auto bg-white p-6 rounded shadow text-center">
        {status === 'loading' && <p>Vérification en cours...</p>}
        {status === 'success' && (
          <>
            <p className="text-green-600 mb-4">{message}</p>
            <Link to="/login" className="text-blue-600">Se connecter</Link>
          </>
        )}
        {status === 'error' && <p className="text-red-600">{message}</p>}
      </div>
    </div>
  );
}
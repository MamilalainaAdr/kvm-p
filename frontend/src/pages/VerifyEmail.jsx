import React, { useEffect, useState } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import API from '../services/api';

export default function VerifyEmail(){
  const [searchParams] = useSearchParams();
  const token = searchParams.get('token');
  const [status, setStatus] = useState('loading');
  const [message, setMessage] = useState('');

  useEffect(() => {
    if (!token) {
      setStatus('error'); setMessage('Token manquant'); return;
    }
    API.get(`/auth/verify-email?token=${encodeURIComponent(token)}`)
      .then(res => { setStatus('success'); setMessage(res.data.message); })
      .catch(err => { setStatus('error'); setMessage(err.response?.data?.message || 'Erreur'); });
  }, [token]);

  return (
    <div className="container mt-8">
      <div className="max-w-md mx-auto bg-white p-6 rounded shadow text-center">
        {status === 'loading' && <p>Vérification en cours...</p>}
        {status === 'success' && <>
          <h3 className="text-green-600 font-bold">Vérifié</h3>
          <p>{message}</p>
          <Link to="/login" className="text-blue-600">Se connecter</Link>
        </>}
        {status === 'error' && <>
          <h3 className="text-red-600 font-bold">Erreur</h3>
          <p>{message}</p>
        </>}
      </div>
    </div>
  );
}
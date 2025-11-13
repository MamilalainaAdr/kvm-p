import React, { createContext, useContext, useEffect, useState } from 'react';
import API from '../services/api';
import toast from 'react-hot-toast';

const AuthContext = createContext();
export const useAuth = () => useContext(AuthContext);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  const fetchMe = async () => {
    try {
      const { data } = await API.get('/auth/me');
      setUser(data.user);
    } catch (err) {
      // Erreur silencieuse (non connecté ou token expiré)
      setUser(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMe();
  }, []);

  const logout = async () => {
    try {
      await API.post('/auth/logout');
      toast.success('Déconnecté');
    } catch (e) {
      toast.error('Erreur déconnexion');
    }
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, setUser, loading, logout, refresh: fetchMe }}>
      {children}
    </AuthContext.Provider>
  );
};
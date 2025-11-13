import axios from 'axios';
import toast from 'react-hot-toast';

// IMPORTANT : Utilise un chemin relatif pour passer par le proxy Vite
const API = axios.create({
  baseURL: import.meta.env.VITE_API_BASE || '/api',
  withCredentials: true
});

// Intercepteur pour les erreurs
API.interceptors.response.use(
  response => response,
  error => {
    // Ne pas toast pour /me (géré dans AuthContext)
    if (!error.config?.url?.includes('/auth/me')) {
      const message = error.response?.data?.message || 'Une erreur est survenue';
      toast.error(message);
    }
    return Promise.reject(error);
  }
);

export default API;
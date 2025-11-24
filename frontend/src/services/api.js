import axios from 'axios';
import toast from 'react-hot-toast';

const API = axios.create({
  baseURL: '/api',
  withCredentials: true
});

// Interceptor pour erreurs (hors /auth/me)
API.interceptors.response.use(
  response => response,
  error => {
    const message = error.response?.data?.message || 'Une erreur est survenue';
    if (!error.config?.url?.includes('/auth/me')) {
      toast.error(message);
    }
    return Promise.reject(error);
  }
);

export default API;
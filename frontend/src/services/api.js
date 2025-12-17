import axios from 'axios';
import toast from 'react-hot-toast';

const API = axios.create({
  baseURL: '/api',
  withCredentials: true
});

// Interceptor allégé: n'affiche de toast que pour les erreurs 500 ou connexion
// Les erreurs 400/401/403/409 sont souvent gérées localement par les formulaires
API.interceptors.response.use(
  response => response,
  error => {
    // Si la page gère l'erreur elle-même (ex: formulaire invalide), on évite le doublon
    // On notifie seulement si c'est critique ou inattendu
    if (!error.response || error.response.status >= 500) {
      toast.error('Erreur serveur ou connexion');
    }
    return Promise.reject(error);
  }
);

export default API;
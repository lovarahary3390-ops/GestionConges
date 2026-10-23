import axios from 'axios';

// Nettoyage de l'URL de base pour éviter les problèmes de double slash '//'
const rawBaseURL = import.meta.env.VITE_API_URL || 'http://127.0.0.1:8000';
const baseURL = rawBaseURL.endsWith('/') ? rawBaseURL.slice(0, -1) : rawBaseURL;

const api = axios.create({
    baseURL: baseURL,
});

// 1. Intercepteur de requête : Ajoute automatiquement le token access
api.interceptors.request.use(
    (config) => {
        const token = localStorage.getItem('access_token');
        if (token) {
            config.headers.Authorization = `Bearer ${token}`;
        }
        return config;
    },
    (error) => Promise.reject(error)
);

// 2. Intercepteur de réponse : Rafraîchissement automatique du token expiré
api.interceptors.response.use(
    (response) => response,
    async (error) => {
        const originalRequest = error.config;

        // Si l'erreur est 401 et qu'il ne s'agit pas d'une tentative de refresh déjà échouée
        if (
            error.response?.status === 401 &&
            originalRequest &&
            !originalRequest._retry &&
            !originalRequest.url.includes('/token/refresh/')
        ) {
            originalRequest._retry = true;

            const refreshToken = localStorage.getItem('refresh_token');

            if (refreshToken) {
                try {
                    // Utilisation d'un appel axios classique pour éviter de repasser par l'intercepteur request
                    const response = await axios.post(`${baseURL}/api/token/refresh/`, {
                        refresh: refreshToken,
                    });

                    const newAccessToken = response.data.access;
                    localStorage.setItem('access_token', newAccessToken);

                    if (response.data.refresh) {
                        localStorage.setItem('refresh_token', response.data.refresh);
                    }

                    // Mise à jour du header pour la requête échouée
                    originalRequest.headers.Authorization = `Bearer ${newAccessToken}`;

                    // Relancer la requête initiale avec le nouveau token
                    return api(originalRequest);
                } catch (refreshError) {
                    // En cas d'échec du refresh (token expiré ou invalide), on déconnecte l'utilisateur
                    localStorage.removeItem('access_token');
                    localStorage.removeItem('refresh_token');
                    localStorage.removeItem('user');

                    window.location.href = '/login';

                    return Promise.reject(refreshError);
                }
            }
        }

        return Promise.reject(error);
    }
);

export default api;
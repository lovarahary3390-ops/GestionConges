import { createContext, useContext, useEffect, useState } from 'react';
import api from '../services/api';

const AuthContext = createContext(null);

function lireUtilisateur() {
    try {
        const brut = localStorage.getItem('user');
        if (!brut) return null;

        let infos = JSON.parse(brut);

        // Ancien format erroné { user: {...} } : on récupère l'objet interne
        if (infos && infos.user && !infos.role) {
            infos = infos.user;
        }

        // Données inexploitables (pas de rôle) : on les ignore
        if (!infos || !infos.role) return null;

        return infos;
    } catch {
        return null;
    }
}

function effacerSession() {
    localStorage.removeItem('access_token');
    localStorage.removeItem('refresh_token');
    localStorage.removeItem('user');
}

export function AuthProvider({ children }) {
    const [user, setUser] = useState(lireUtilisateur);
    // Tant qu'on vérifie la session auprès du serveur, on attend avant d'afficher les pages
    const [loading, setLoading] = useState(Boolean(localStorage.getItem('access_token')));

    useEffect(() => {
        const token = localStorage.getItem('access_token');

        if (!token) {
            effacerSession();
            setUser(null);
            setLoading(false);
            return;
        }

        let annule = false;

        api.get('/employees/me/')
            .then((res) => {
                if (annule) return;
                // Données fraîches venant du serveur
                localStorage.setItem('user', JSON.stringify(res.data));
                setUser(res.data);
            })
            .catch((err) => {
                if (annule) return;
                if (err.response?.status === 401) {
                    // Session expirée ou invalide : on déconnecte proprement
                    effacerSession();
                    setUser(null);
                }
                // Autre erreur (serveur arrêté...) : on garde les données locales valides
            })
            .finally(() => {
                if (!annule) setLoading(false);
            });

        return () => {
            annule = true;
        };
    }, []);

    const login = async (username, password) => {
        effacerSession();
        const res = await api.post('/login/', { username, password });
        const { access, refresh, user: infos } = res.data;

        localStorage.setItem('access_token', access);
        localStorage.setItem('refresh_token', refresh);
        localStorage.setItem('user', JSON.stringify(infos));
        setUser(infos);
        return infos;
    };

    const logout = async () => {
        try {
            const refresh = localStorage.getItem('refresh_token');
            if (refresh) await api.post('/logout/', { refresh });
        } catch {
            // on déconnecte quand même côté navigateur
        }
        effacerSession();
        setUser(null);
    };

    const valeur = {
        user,
        login,
        logout,
        loading,
        estConnecte: Boolean(user),
        isAuthenticated: Boolean(user),
    };

    return <AuthContext.Provider value={valeur}>{children}</AuthContext.Provider>;
}

export function useAuth() {
    const contexte = useContext(AuthContext);
    if (!contexte) {
        throw new Error("useAuth doit être utilisé à l'intérieur de AuthProvider");
    }
    return contexte;
}
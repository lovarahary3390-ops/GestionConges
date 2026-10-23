
import { useState } from 'react';
import { Navigate, useNavigate, useLocation } from 'react-router-dom';
import {
    User,
    Lock,
    Eye,
    EyeOff,
    LogIn,
    UserPlus,
    Calendar
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';

function messageErreur(err) {
    if (!err.response) {
        return 'Serveur injoignable. Vérifiez que le backend est lancé.';
    }

    const statut = err.response.status;

    if (statut === 401 || statut === 400) {
        return 'Identifiant ou mot de passe incorrect.';
    }

    if (statut === 404) {
        return 'Adresse de connexion introuvable (404).';
    }

    return `Erreur du serveur (${statut}).`;
}

export default function Login() {
    const { login, estConnecte } = useAuth();
    const navigate = useNavigate();
    const location = useLocation();

    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [voirMotDePasse, setVoirMotDePasse] = useState(false);
    const [souvenir, setSouvenir] = useState(false);
    const [erreur, setErreur] = useState('');
    const [envoi, setEnvoi] = useState(false);

    const [messageSucces] = useState(
        location.state?.inscriptionReussie
            ? 'Compte créé avec succès. Vous pouvez vous connecter.'
            : ''
    );

    if (estConnecte) {
        return <Navigate to="/dashboard" replace />;
    }

    const soumettre = async (e) => {
        e.preventDefault();
        setErreur('');
        setEnvoi(true);

        try {
            await login(username.trim(), password);
            navigate('/dashboard', { replace: true });
        } catch (err) {
            console.error('Erreur de connexion :', err);
            setErreur(messageErreur(err));
        } finally {
            setEnvoi(false);
        }
    };

    return (
        <div style={styles.page}>
            <form style={styles.carte} onSubmit={soumettre}>
                <div style={styles.logoIcone}>
                    <Calendar size={30} color="#fff" />
                </div>

                <h1 style={styles.titre}>Gestion des Congés</h1>

                <p style={styles.sousTitre}>
                    Connectez-vous pour accéder à votre espace
                    <br />
                    de gestion des congés
                </p>

                {messageSucces && (
                    <p style={styles.succes}>
                        {messageSucces}
                    </p>
                )}

                <div style={styles.champAvecIcone}>
                    <User size={18} color="#94a3b8" />

                    <input
                        style={styles.inputPlain}
                        type="text"
                        placeholder="Identifiant"
                        value={username}
                        onChange={(e) => setUsername(e.target.value)}
                        autoComplete="username"
                        required
                    />
                </div>

                <div style={styles.champAvecIcone}>
                    <Lock size={18} color="#94a3b8" />

                    <input
                        style={styles.inputPlain}
                        type={voirMotDePasse ? 'text' : 'password'}
                        placeholder="Mot de passe"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        autoComplete="current-password"
                        required
                    />

                    <button
                        type="button"
                        style={styles.boutonOeil}
                        onClick={() =>
                            setVoirMotDePasse((visible) => !visible)
                        }
                        aria-label={
                            voirMotDePasse
                                ? 'Masquer le mot de passe'
                                : 'Afficher le mot de passe'
                        }
                    >
                        {voirMotDePasse
                            ? <EyeOff size={18} color="#94a3b8" />
                            : <Eye size={18} color="#94a3b8" />
                        }
                    </button>
                </div>

                <div style={styles.ligneOptions}>
                    <label style={styles.caseACocher}>
                        <input
                            type="checkbox"
                            checked={souvenir}
                            onChange={(e) =>
                                setSouvenir(e.target.checked)
                            }
                        />
                        Se souvenir de moi
                    </label>

                    <button
                        type="button"
                        style={styles.lienOublie}
                        onClick={() =>
                            navigate('/mot-de-passe-oublie')
                        }
                    >
                        Mot de passe oublié ?
                    </button>
                </div>

                {erreur && (
                    <p style={styles.erreur} role="alert">
                        {erreur}
                    </p>
                )}

                <button
                    type="submit"
                    style={{
                        ...styles.bouton,
                        opacity: envoi ? 0.7 : 1,
                        cursor: envoi ? 'wait' : 'pointer',
                    }}
                    disabled={envoi}
                >
                    <LogIn size={18} />
                    {envoi ? 'Connexion...' : 'Se connecter'}
                </button>

                <div style={styles.separateur}>
                    <span style={styles.trait} />
                    <span style={styles.texteOu}>ou</span>
                    <span style={styles.trait} />
                </div>

                <button
                    type="button"
                    style={styles.boutonSecondaire}
                    onClick={() => navigate('/inscription')}
                >
                    <UserPlus size={18} />
                    Créer un compte
                </button>
            </form>
        </div>
    );
}

const BLEU = '#2563eb';
const NAVY = '#0f2557';

const styles = {
    page: {
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: '#f4f6fb',
        fontFamily: "'Segoe UI', Roboto, sans-serif",
        padding: '1.5rem',
        boxSizing: 'border-box',
    },

    carte: {
        width: '100%',
        maxWidth: '460px',
        boxSizing: 'border-box',
        backgroundColor: '#fff',
        borderRadius: '18px',
        padding: '2.8rem 2.4rem',
        boxShadow: '0 10px 40px rgba(15,37,87,0.08)',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
    },

    logoIcone: {
        width: '68px',
        height: '68px',
        borderRadius: '18px',
        backgroundColor: BLEU,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: '1.2rem',
        boxShadow: '0 8px 20px rgba(37,99,235,0.3)',
    },

    titre: {
        margin: '0 0 0.5rem',
        fontSize: '1.6rem',
        color: NAVY,
        fontWeight: 800,
        textAlign: 'center',
    },

    sousTitre: {
        margin: '0 0 1.8rem',
        fontSize: '0.92rem',
        color: '#6b7a99',
        textAlign: 'center',
        lineHeight: 1.5,
    },

    succes: {
        width: '100%',
        boxSizing: 'border-box',
        color: '#15803d',
        backgroundColor: '#f0fdf4',
        border: '1px solid #bbf7d0',
        borderRadius: '8px',
        padding: '0.75rem',
        fontSize: '0.9rem',
        margin: '0 0 1rem',
    },

    champAvecIcone: {
        width: '100%',
        boxSizing: 'border-box',
        display: 'flex',
        alignItems: 'center',
        gap: '0.7rem',
        border: '1px solid #dbe1ee',
        borderRadius: '10px',
        padding: '0.85rem 1rem',
        marginBottom: '1rem',
    },

    inputPlain: {
        border: 'none',
        outline: 'none',
        flexGrow: 1,
        fontSize: '0.95rem',
        backgroundColor: 'transparent',
        minWidth: 0,
    },

    boutonOeil: {
        background: 'none',
        border: 'none',
        cursor: 'pointer',
        display: 'flex',
        padding: 0,
    },

    ligneOptions: {
        width: '100%',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        margin: '0.2rem 0 1.4rem',
        fontSize: '0.85rem',
        flexWrap: 'wrap',
        gap: '0.5rem',
    },

    caseACocher: {
        display: 'flex',
        alignItems: 'center',
        gap: '0.5rem',
        color: '#4b5f86',
    },

    lienOublie: {
        background: 'none',
        border: 'none',
        color: BLEU,
        fontWeight: 600,
        cursor: 'pointer',
        fontSize: '0.85rem',
        padding: 0,
    },

    erreur: {
        alignSelf: 'flex-start',
        color: '#c0175d',
        fontSize: '0.85rem',
        margin: '0 0 1rem',
    },

    bouton: {
        width: '100%',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        gap: '0.5rem',
        backgroundColor: BLEU,
        color: '#fff',
        border: 'none',
        borderRadius: '10px',
        padding: '0.9rem',
        fontSize: '1rem',
        fontWeight: 600,
        cursor: 'pointer',
        boxShadow: '0 6px 16px rgba(37,99,235,0.3)',
    },

    separateur: {
        width: '100%',
        display: 'flex',
        alignItems: 'center',
        gap: '0.9rem',
        margin: '1.5rem 0',
    },

    trait: {
        flexGrow: 1,
        height: '1px',
        backgroundColor: '#e5e9f2',
    },

    texteOu: {
        fontSize: '0.85rem',
        color: '#9aa5bd',
    },

    boutonSecondaire: {
        width: '100%',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        gap: '0.5rem',
        backgroundColor: '#fff',
        color: BLEU,
        border: `1.5px solid ${BLEU}`,
        borderRadius: '10px',
        padding: '0.85rem',
        fontSize: '0.95rem',
        fontWeight: 600,
        cursor: 'pointer',
    },
};

import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { User, Lock, Eye, EyeOff, UserPlus, Calendar, ArrowLeft, Mail } from 'lucide-react';
import api from '../services/api';

function erreursDepuisApi(err) {
    if (!err.response) {
        return { generale: 'Serveur injoignable. Vérifiez que le backend est lancé.' };
    }
    const data = err.response.data;
    if (!data || typeof data !== 'object') {
        return { generale: "Erreur lors de l'inscription." };
    }
    const champs = {};
    let generale = '';
    Object.entries(data).forEach(([cle, valeur]) => {
        const message = Array.isArray(valeur) ? valeur.join(' ') : String(valeur);
        if (['first_name', 'last_name', 'username', 'email', 'password', 'password2'].includes(cle)) {
            champs[cle] = message;
        } else {
            generale = generale || message;
        }
    });
    return { champs, generale };
}

export default function Inscription() {
    const navigate = useNavigate();
    const [form, setForm] = useState({
        first_name: '', last_name: '', username: '', email: '', password: '', password2: '',
    });
    const [voirMdp, setVoirMdp] = useState(false);
    const [voirMdp2, setVoirMdp2] = useState(false);
    const [erreurs, setErreurs] = useState({});
    const [erreurGenerale, setErreurGenerale] = useState('');
    const [envoi, setEnvoi] = useState(false);

    const changer = (e) => {
        const { name, value } = e.target;
        setForm((f) => ({ ...f, [name]: value }));
        if (erreurs[name]) setErreurs((er) => ({ ...er, [name]: '' }));
    };

    const validerLocal = () => {
        const e = {};
        if (!form.first_name.trim()) e.first_name = 'Le prénom est obligatoire.';
        if (!form.last_name.trim()) e.last_name = 'Le nom est obligatoire.';
        if (!form.username.trim()) e.username = "Le nom d'utilisateur est obligatoire.";
        if (!form.email.trim()) e.email = "L'adresse e-mail est obligatoire.";
        if (!form.password) e.password = 'Le mot de passe est obligatoire.';
        if (form.password && form.password2 && form.password !== form.password2) {
            e.password2 = 'Les mots de passe ne correspondent pas.';
        }
        setErreurs(e);
        return Object.keys(e).length === 0;
    };

    const soumettre = async (e) => {
        e.preventDefault();
        setErreurGenerale('');
        if (!validerLocal()) return;

        setEnvoi(true);
        try {
            await api.post('/register/', form);
            navigate('/login', { state: { inscriptionReussie: true }, replace: true });
        } catch (err) {
            const { champs, generale } = erreursDepuisApi(err);
            if (champs) setErreurs((er) => ({ ...er, ...champs }));
            if (generale) setErreurGenerale(generale);
        } finally {
            setEnvoi(false);
        }
    };

    return (
        <div style={styles.page}>
            <form style={styles.carte} onSubmit={soumettre}>
                <button type="button" style={styles.retour} onClick={() => navigate('/login')}>
                    <ArrowLeft size={16} /> Retour à la connexion
                </button>

                <div style={styles.logoIcone}>
                    <Calendar size={28} color="#fff" />
                </div>
                <h1 style={styles.titre}>Créer un compte</h1>
                <p style={styles.sousTitre}>Rejoignez l'espace de gestion des congés</p>

                {erreurGenerale && <p style={styles.erreurGenerale}>{erreurGenerale}</p>}

                <div style={styles.ligne}>
                    <Champ
                        icone={User} name="first_name" placeholder="Prénom"
                        value={form.first_name} onChange={changer} erreur={erreurs.first_name}
                    />
                    <Champ
                        icone={User} name="last_name" placeholder="Nom"
                        value={form.last_name} onChange={changer} erreur={erreurs.last_name}
                    />
                </div>

                <Champ
                    icone={User} name="username" placeholder="Nom d'utilisateur"
                    value={form.username} onChange={changer} erreur={erreurs.username}
                />

                <Champ
                    icone={Mail} name="email" type="email" placeholder="Adresse e-mail"
                    value={form.email} onChange={changer} erreur={erreurs.email}
                />

                <Champ
                    icone={Lock} name="password" placeholder="Mot de passe"
                    type={voirMdp ? 'text' : 'password'} value={form.password} onChange={changer}
                    erreur={erreurs.password}
                    boutonOeil={{ actif: voirMdp, onClick: () => setVoirMdp((v) => !v) }}
                />

                <Champ
                    icone={Lock} name="password2" placeholder="Confirmer le mot de passe"
                    type={voirMdp2 ? 'text' : 'password'} value={form.password2} onChange={changer}
                    erreur={erreurs.password2}
                    boutonOeil={{ actif: voirMdp2, onClick: () => setVoirMdp2((v) => !v) }}
                />

                <button type="submit" style={styles.bouton} disabled={envoi}>
                    <UserPlus size={18} />
                    {envoi ? 'Création du compte...' : 'Créer mon compte'}
                </button>
            </form>
        </div>
    );
}

function Champ({ icone: Icone, erreur, boutonOeil, ...props }) {
    return (
        <div style={styles.champBloc}>
            <div style={{ ...styles.champAvecIcone, ...(erreur ? styles.champErreur : {}) }}>
                <Icone size={17} color="#94a3b8" />
                <input style={styles.inputPlain} {...props} />
                {boutonOeil && (
                    <button type="button" style={styles.boutonOeil} onClick={boutonOeil.onClick} tabIndex={-1}>
                        {boutonOeil.actif ? <EyeOff size={17} color="#94a3b8" /> : <Eye size={17} color="#94a3b8" />}
                    </button>
                )}
            </div>
            {erreur && <span style={styles.messageErreur}>{erreur}</span>}
        </div>
    );
}

const BLEU = '#2563eb';
const NAVY = '#0f2557';

const styles = {
    page: { minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', backgroundColor: '#f4f6fb', fontFamily: "'Segoe UI', Roboto, sans-serif", padding: '1.5rem' },
    carte: { width: '100%', maxWidth: '480px', backgroundColor: '#fff', borderRadius: '18px', padding: '2.2rem 2.2rem', boxShadow: '0 10px 40px rgba(15,37,87,0.08)', display: 'flex', flexDirection: 'column', alignItems: 'center', position: 'relative' },
    retour: { alignSelf: 'flex-start', display: 'flex', alignItems: 'center', gap: '0.4rem', background: 'none', border: 'none', color: BLEU, cursor: 'pointer', fontSize: '0.85rem', marginBottom: '1rem', padding: 0 },
    logoIcone: { width: '56px', height: '56px', borderRadius: '14px', backgroundColor: BLEU, display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '0.9rem', boxShadow: '0 6px 16px rgba(37,99,235,0.3)' },
    titre: { margin: '0 0 0.3rem', fontSize: '1.4rem', color: NAVY, fontWeight: 800, textAlign: 'center' },
    sousTitre: { margin: '0 0 1.4rem', fontSize: '0.88rem', color: '#6b7a99', textAlign: 'center' },
    erreurGenerale: { alignSelf: 'stretch', backgroundColor: '#fee2e2', color: '#b91c1c', padding: '0.6rem 0.8rem', borderRadius: '8px', fontSize: '0.85rem', margin: '0 0 1rem' },
    ligne: { width: '100%', display: 'flex', gap: '0.8rem', flexWrap: 'wrap' },
    champBloc: { width: '100%', marginBottom: '0.9rem', flex: '1 1 180px' },
    champAvecIcone: { width: '100%', boxSizing: 'border-box', display: 'flex', alignItems: 'center', gap: '0.6rem', border: '1px solid #dbe1ee', borderRadius: '10px', padding: '0.75rem 0.9rem' },
    champErreur: { borderColor: '#dc2626' },
    inputPlain: { border: 'none', outline: 'none', flexGrow: 1, fontSize: '0.9rem', backgroundColor: 'transparent', minWidth: 0 },
    boutonOeil: { background: 'none', border: 'none', cursor: 'pointer', display: 'flex', padding: 0 },
    messageErreur: { display: 'block', color: '#dc2626', fontSize: '0.78rem', marginTop: '0.3rem' },
    bouton: { width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem', backgroundColor: BLEU, color: '#fff', border: 'none', borderRadius: '10px', padding: '0.85rem', fontSize: '0.95rem', fontWeight: 600, cursor: 'pointer', marginTop: '0.4rem', boxShadow: '0 6px 16px rgba(37,99,235,0.3)' },
};
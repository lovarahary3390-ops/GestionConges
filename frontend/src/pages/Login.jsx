import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
    User, Lock, Eye, EyeOff, LogIn, ShieldCheck,
    Calendar, Users, ClipboardCheck,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';

function messageErreur(err) {
    if (!err.response) {
        return 'Serveur injoignable. Vérifiez que le backend est lancé.';
    }
    const statut = err.response.status;
    if (statut === 401 || statut === 400) return "Identifiant ou mot de passe incorrect";
    if (statut === 404) return 'Adresse de connexion introuvable (404).';
    return `Erreur du serveur (${statut}).`;
}

export default function Login() {
    const { login } = useAuth();
    const navigate = useNavigate();
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [voirMotDePasse, setVoirMotDePasse] = useState(false);
    const [souvenir, setSouvenir] = useState(false);
    const [erreur, setErreur] = useState('');
    const [envoi, setEnvoi] = useState(false);

    const soumettre = async (e) => {
        e.preventDefault();
        setErreur('');
        setEnvoi(true);
        try {
            await login(username.trim(), password);
            // replace: true remplace la page de login dans l'historique,
            // donc la flèche retour du navigateur ne ramène jamais ici
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
            {/* PANNEAU GAUCHE */}
            <div style={styles.panneauGauche}>
                <div style={styles.enteteGauche}>
                    <div style={styles.logoIcone}><Calendar size={26} color="#fff" /></div>
                    <div>
                        <h1 style={styles.titreGauche}>Gestion des congés</h1>
                        <p style={styles.sousTitreGauche}>
                            Une solution simple et efficace pour la gestion de vos congés d'entreprise.
                        </p>
                    </div>
                </div>

                <div style={styles.listeAtouts}>
                    <Atout icone={Calendar} titre="Demande de congés" texte="Faites vos demandes en quelques clics" />
                    <Atout icone={Users} titre="Suivi des demandes" texte="Suivez l'état de vos demandes" />
                    <Atout icone={ClipboardCheck} titre="Gestion des employés" texte="Une meilleure organisation pour tous" />
                </div>

                <div style={styles.illustration}>
                    <div style={styles.formeCercle1} />
                    <div style={styles.formeCercle2} />
                </div>

                <p style={styles.citation}>Un meilleur équilibre entre travail et vie personnelle !</p>
            </div>

            {/* PANNEAU DROIT — FORMULAIRE */}
            <div style={styles.panneauDroit}>
                <form style={styles.carte} onSubmit={soumettre}>
                    <div style={styles.avatarZone}>
                        <User size={30} color="#fff" />
                    </div>
                    <h2 style={styles.titreForm}>Bon retour !</h2>
                    <p style={styles.sousTitreForm}>
                        Connectez-vous à votre compte pour accéder à votre espace.
                    </p>

                    <label style={styles.label}>Identifiant</label>
                    <div style={styles.champAvecIcone}>
                        <User size={17} color="#94a3b8" />
                        <input
                            style={styles.inputPlain}
                            type="text"
                            placeholder="Entrez votre identifiant"
                            value={username}
                            onChange={(e) => setUsername(e.target.value)}
                            autoComplete="username"
                            required
                        />
                    </div>

                    <label style={styles.label}>Mot de passe</label>
                    <div style={styles.champAvecIcone}>
                        <Lock size={17} color="#94a3b8" />
                        <input
                            style={styles.inputPlain}
                            type={voirMotDePasse ? 'text' : 'password'}
                            placeholder="Entrez votre mot de passe"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            autoComplete="current-password"
                            required
                        />
                        <button
                            type="button"
                            style={styles.boutonOeil}
                            onClick={() => setVoirMotDePasse((v) => !v)}
                            tabIndex={-1}
                        >
                            {voirMotDePasse ? <EyeOff size={17} color="#94a3b8" /> : <Eye size={17} color="#94a3b8" />}
                        </button>
                    </div>

                    <div style={styles.ligneOptions}>
                        <label style={styles.caseACocher}>
                            <input type="checkbox" checked={souvenir} onChange={(e) => setSouvenir(e.target.checked)} />
                            Se souvenir de moi
                        </label>
                        <a href="#" style={styles.lienOublie} onClick={(e) => e.preventDefault()}>
                            Mot de passe oublié ?
                        </a>
                    </div>

                    {erreur && <p style={styles.erreur}>{erreur}</p>}

                    <button type="submit" style={styles.bouton} disabled={envoi}>
                        <LogIn size={18} />
                        {envoi ? 'Connexion...' : 'Se connecter'}
                    </button>

                    <div style={styles.separateur}>
                        <span style={styles.trait} /><span style={styles.texteOu}>Ou</span><span style={styles.trait} />
                    </div>

                    <div style={styles.zoneSecurite}>
                        <ShieldCheck size={20} color="#2563eb" />
                        <div>
                            <div style={styles.securiteTitre}>Accès sécurisé</div>
                            <div style={styles.securiteTexte}>Vos données sont protégées</div>
                        </div>
                    </div>
                </form>
            </div>
        </div>
    );
}

function Atout({ icone: Icone, titre, texte }) {
    return (
        <div style={styles.atout}>
            <div style={styles.atoutIcone}><Icone size={20} color="#2563eb" /></div>
            <div>
                <div style={styles.atoutTitre}>{titre}</div>
                <div style={styles.atoutTexte}>{texte}</div>
            </div>
        </div>
    );
}

const BLEU = '#2563eb';
const NAVY = '#0f2557';

const styles = {
    page: {
        display: 'flex',
        minHeight: '100vh',
        fontFamily: "'Segoe UI', Roboto, sans-serif",
        flexWrap: 'wrap',
    },
    panneauGauche: {
        flex: '1 1 420px',
        minHeight: '100vh',
        background: `linear-gradient(160deg, #dbeafe 0%, #eff6ff 55%, ${BLEU} 140%)`,
        padding: '3rem 3rem 2rem',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'space-between',
        position: 'relative',
        overflow: 'hidden',
    },
    enteteGauche: { display: 'flex', gap: '1rem', alignItems: 'flex-start', marginBottom: '2rem' },
    logoIcone: { width: '54px', height: '54px', borderRadius: '14px', backgroundColor: BLEU, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, boxShadow: '0 4px 12px rgba(37,99,235,0.35)' },
    titreGauche: { margin: '0 0 0.4rem', fontSize: '1.7rem', color: NAVY, fontWeight: 800 },
    sousTitreGauche: { margin: 0, color: '#4b5f86', fontSize: '0.95rem', maxWidth: '360px' },
    listeAtouts: { display: 'flex', flexDirection: 'column', gap: '1.2rem', zIndex: 1 },
    atout: { display: 'flex', gap: '0.9rem', alignItems: 'flex-start' },
    atoutIcone: { width: '42px', height: '42px', borderRadius: '50%', backgroundColor: '#dbeafe', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 },
    atoutTitre: { fontWeight: 700, color: NAVY, fontSize: '0.95rem' },
    atoutTexte: { color: '#5b6b8c', fontSize: '0.85rem' },
    illustration: { position: 'relative', flexGrow: 1, minHeight: '120px' },
    formeCercle1: { position: 'absolute', bottom: '-40px', right: '-30px', width: '220px', height: '220px', borderRadius: '50%', backgroundColor: 'rgba(255,255,255,0.25)' },
    formeCercle2: { position: 'absolute', bottom: '20px', right: '60px', width: '90px', height: '90px', borderRadius: '50%', backgroundColor: 'rgba(255,255,255,0.35)' },
    citation: { fontStyle: 'italic', color: NAVY, fontSize: '0.95rem', fontWeight: 600, zIndex: 1, margin: 0 },
    panneauDroit: {
        flex: '1 1 380px',
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: '#f7f9fc',
        padding: '2rem 1.2rem',
    },
    carte: {
        width: '100%',
        maxWidth: '400px',
        backgroundColor: '#fff',
        borderRadius: '16px',
        padding: '2.4rem 2rem',
        boxShadow: '0 4px 24px rgba(15,37,87,0.08)',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
    },
    avatarZone: { width: '64px', height: '64px', borderRadius: '50%', backgroundColor: BLEU, display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '1rem', boxShadow: '0 6px 16px rgba(37,99,235,0.35)' },
    titreForm: { margin: '0 0 0.4rem', fontSize: '1.4rem', color: NAVY, fontWeight: 800 },
    sousTitreForm: { margin: '0 0 1.6rem', fontSize: '0.85rem', color: '#6b7a99', textAlign: 'center' },
    label: { alignSelf: 'flex-start', fontSize: '0.85rem', fontWeight: 600, color: NAVY, marginBottom: '0.4rem', marginTop: '0.4rem' },
    champAvecIcone: { width: '100%', display: 'flex', alignItems: 'center', gap: '0.6rem', border: '1px solid #dbe1ee', borderRadius: '8px', padding: '0.7rem 0.9rem', marginBottom: '0.2rem' },
    inputPlain: { border: 'none', outline: 'none', flexGrow: 1, fontSize: '0.9rem', backgroundColor: 'transparent' },
    boutonOeil: { background: 'none', border: 'none', cursor: 'pointer', display: 'flex', padding: 0 },
    ligneOptions: { width: '100%', display: 'flex', justifyContent: 'space-between', alignItems: 'center', margin: '0.8rem 0 1.2rem', fontSize: '0.82rem' },
    caseACocher: { display: 'flex', alignItems: 'center', gap: '0.4rem', color: '#4b5f86' },
    lienOublie: { color: BLEU, textDecoration: 'none', fontWeight: 600 },
    erreur: { alignSelf: 'flex-start', color: '#c0175d', fontSize: '0.82rem', margin: '0 0 0.8rem' },
    bouton: { width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem', backgroundColor: BLEU, color: '#fff', border: 'none', borderRadius: '8px', padding: '0.8rem', fontSize: '0.95rem', fontWeight: 600, cursor: 'pointer', boxShadow: '0 4px 12px rgba(37,99,235,0.3)' },
    separateur: { width: '100%', display: 'flex', alignItems: 'center', gap: '0.8rem', margin: '1.4rem 0 1.2rem' },
    trait: { flexGrow: 1, height: '1px', backgroundColor: '#e5e9f2' },
    texteOu: { fontSize: '0.78rem', color: '#9aa5bd' },
    zoneSecurite: { display: 'flex', alignItems: 'center', gap: '0.7rem' },
    securiteTitre: { fontWeight: 700, fontSize: '0.85rem', color: NAVY },
    securiteTexte: { fontSize: '0.78rem', color: '#6b7a99' },
};
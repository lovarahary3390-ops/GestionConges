import { useEffect, useState } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import {
    LayoutDashboard, Users, FileText, Send, CheckSquare,
    Calendar, BarChart3, Settings, LogOut, ChevronDown, Menu, X, Info,
} from 'lucide-react';

const TOUS_LES_LIENS = [
    { to: '/dashboard', icone: LayoutDashboard, texte: 'Accueil' },
    { to: '/employes', icone: Users, texte: 'Employés', roles: ['ADMIN'] },
    { to: '/demandes', icone: FileText, texte: 'Mes demandes' },
    { to: '/demandes/nouvelle', icone: Send, texte: 'Nouvelle demande' },
    { to: '/demandes/valider', icone: CheckSquare, texte: 'Validation', roles: ['RESPONSABLE', 'ADMIN'] },
    { to: '/calendrier', icone: Calendar, texte: 'Calendrier' },
    { to: '/rapports', icone: BarChart3, texte: 'Rapports', roles: ['ADMIN'] },
    { to: '/parametres', icone: Settings, texte: 'Paramètres', roles: ['ADMIN'] },
    { to: '/apropos', icone: Info, texte: 'À propos' },
];

const SEUIL_MOBILE = 768;

function useLargeurFenetre() {
    const [largeur, setLargeur] = useState(window.innerWidth);
    useEffect(() => {
        const majLargeur = () => setLargeur(window.innerWidth);
        window.addEventListener('resize', majLargeur);
        return () => window.removeEventListener('resize', majLargeur);
    }, []);
    return largeur;
}

export default function Layout({ children }) {
    const { user, logout } = useAuth();
    const navigate = useNavigate();
    const largeur = useLargeurFenetre();
    const estMobile = largeur < SEUIL_MOBILE;
    const [menuOuvert, setMenuOuvert] = useState(false);

    // Ferme le menu mobile à chaque navigation
    useEffect(() => {
        setMenuOuvert(false);
    }, [largeur]);

    const handleLogout = async () => {
        await logout();
        navigate('/login', { replace: true });
    };

    const role = String(user?.role || '').toUpperCase();
    const liens = TOUS_LES_LIENS.filter((l) => !l.roles || l.roles.includes(role));

    const sidebarVisible = !estMobile || menuOuvert;

    return (
        <div style={styles.page}>
            {/* Fond sombre derrière le menu mobile ouvert */}
            {estMobile && menuOuvert && (
                <div style={styles.voile} onClick={() => setMenuOuvert(false)} />
            )}

            {/* SIDEBAR */}
            <aside
                style={{
                    ...styles.sidebar,
                    ...(estMobile ? styles.sidebarMobile : {}),
                    ...(estMobile && !sidebarVisible ? styles.sidebarCachee : {}),
                }}
            >
                <div style={styles.logoZone}>
                    <div style={styles.logoIcone}>📅</div>
                    <span style={styles.logoTexte}>Gestion des congés</span>
                    {estMobile && (
                        <button style={styles.boutonFermer} onClick={() => setMenuOuvert(false)}>
                            <X size={20} />
                        </button>
                    )}
                </div>

                <nav style={styles.nav}>
                    {liens.map((lien) => (
                        <NavLink
                            key={lien.to}
                            to={lien.to}
                            end
                            onClick={() => setMenuOuvert(false)}
                            style={({ isActive }) => ({
                                ...styles.navLien,
                                ...(isActive ? styles.navLienActif : {}),
                            })}
                        >
                            <lien.icone size={18} />
                            {lien.texte}
                        </NavLink>
                    ))}
                </nav>

                <button onClick={handleLogout} style={styles.deconnexion}>
                    <LogOut size={18} />
                    Déconnexion
                </button>
            </aside>

            {/* CONTENU PRINCIPAL */}
            <div style={styles.contenuPrincipal}>
                <header style={styles.topbar}>
                    {estMobile ? (
                        <button style={styles.boutonMenu} onClick={() => setMenuOuvert(true)}>
                            <Menu size={22} color="#0f2557" />
                        </button>
                    ) : (
                        <div />
                    )}
                    <div style={styles.topbarDroite}>
                        {!estMobile && (
                            <span style={styles.date}>
                                {new Date().toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}
                            </span>
                        )}
                        <div style={styles.utilisateurZone}>
                            <div style={styles.avatar}>
                                {(user?.first_name?.[0] || user?.username?.[0] || '?').toUpperCase()}
                            </div>
                            {!estMobile && <span>{user?.first_name || user?.username}</span>}
                            <ChevronDown size={16} />
                        </div>
                    </div>
                </header>

                <main style={{ ...styles.main, ...(estMobile ? styles.mainMobile : {}) }}>
                    {children}
                </main>
            </div>
        </div>
    );
}

const NAVY = '#0f2557';
const NAVY_LIGHT = '#16336e';
const BLUE = '#2563eb';

const styles = {
    page: {
        display: 'flex',
        minHeight: '100vh',
        backgroundColor: '#f4f6fb',
        fontFamily: "'Segoe UI', Roboto, sans-serif",
        position: 'relative',
    },
    voile: {
        position: 'fixed',
        inset: 0,
        backgroundColor: 'rgba(15,37,87,0.5)',
        zIndex: 40,
    },
    sidebar: {
        width: '230px',
        flexShrink: 0,
        backgroundColor: NAVY,
        color: '#fff',
        display: 'flex',
        flexDirection: 'column',
        padding: '1.2rem 0.9rem',
        position: 'sticky',
        top: 0,
        height: '100vh',
        transition: 'transform 0.25s ease',
    },
    sidebarMobile: {
        position: 'fixed',
        top: 0,
        left: 0,
        zIndex: 50,
        width: '78%',
        maxWidth: '280px',
        transform: 'translateX(0)',
    },
    sidebarCachee: {
        transform: 'translateX(-105%)',
    },
    logoZone: {
        display: 'flex',
        alignItems: 'center',
        gap: '0.6rem',
        padding: '0 0.4rem 1.5rem',
        borderBottom: `1px solid ${NAVY_LIGHT}`,
        marginBottom: '1rem',
        position: 'relative',
    },
    logoIcone: {
        width: '34px',
        height: '34px',
        backgroundColor: BLUE,
        borderRadius: '8px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        fontSize: '1rem',
        flexShrink: 0,
    },
    logoTexte: { fontWeight: 600, fontSize: '0.95rem', flexGrow: 1 },
    boutonFermer: {
        background: 'none',
        border: 'none',
        color: '#c9d3ea',
        cursor: 'pointer',
        display: 'flex',
        padding: '0.2rem',
    },
    nav: {
        display: 'flex',
        flexDirection: 'column',
        gap: '0.2rem',
        flexGrow: 1,
        overflowY: 'auto',
    },
    navLien: {
        display: 'flex',
        alignItems: 'center',
        gap: '0.7rem',
        padding: '0.65rem 0.8rem',
        borderRadius: '8px',
        color: '#c9d3ea',
        textDecoration: 'none',
        fontSize: '0.9rem',
        transition: 'background-color 0.15s',
    },
    navLienActif: {
        backgroundColor: BLUE,
        color: '#fff',
    },
    deconnexion: {
        display: 'flex',
        alignItems: 'center',
        gap: '0.7rem',
        padding: '0.65rem 0.8rem',
        backgroundColor: 'transparent',
        border: 'none',
        color: '#c9d3ea',
        cursor: 'pointer',
        fontSize: '0.9rem',
        borderTop: `1px solid ${NAVY_LIGHT}`,
        marginTop: '1rem',
        paddingTop: '1rem',
    },
    contenuPrincipal: {
        flexGrow: 1,
        minWidth: 0,
        display: 'flex',
        flexDirection: 'column',
        width: '100%',
    },
    topbar: {
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: '1rem 1.2rem',
        backgroundColor: '#fff',
        borderBottom: '1px solid #e5e9f2',
        position: 'sticky',
        top: 0,
        zIndex: 20,
    },
    boutonMenu: {
        background: 'none',
        border: 'none',
        cursor: 'pointer',
        display: 'flex',
        padding: '0.3rem',
    },
    topbarDroite: {
        display: 'flex',
        alignItems: 'center',
        gap: '1.5rem',
        marginLeft: 'auto',
    },
    date: { color: '#666', fontSize: '0.85rem' },
    utilisateurZone: {
        display: 'flex',
        alignItems: 'center',
        gap: '0.5rem',
        fontSize: '0.9rem',
        fontWeight: 500,
    },
    avatar: {
        width: '32px',
        height: '32px',
        borderRadius: '50%',
        backgroundColor: BLUE,
        color: '#fff',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        fontWeight: 600,
        fontSize: '0.85rem',
        flexShrink: 0,
    },
    main: {
        flexGrow: 1,
        padding: '2rem',
    },
    mainMobile: {
        padding: '1rem',
    },
};
import { useEffect, useMemo, useState } from 'react';
import {
    BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid,
    PieChart, Pie, Cell,
} from 'recharts';
import { Users, Clock, CheckCircle, CalendarDays } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';
import {
    normaliserStatut, STATUTS, nombreJours, formaterDate,
    libelleType, libelleEmploye, idDe,
} from '../utils/conges';

const COULEURS_DONUT = ['#2563eb', '#16a34a', '#f59e0b', '#ef4444', '#8b5cf6', '#0ea5e9'];
const MOIS = ['Jan', 'Fév', 'Mar', 'Avr', 'Mai', 'Juin', 'Juil', 'Août', 'Sep', 'Oct', 'Nov', 'Déc'];

// Cherche le nombre de jours restants sous plusieurs noms de champs possibles
const restant = (s) => {
    const v = s.jours_restants ?? s.solde ?? s.reste ?? s.remaining ?? s.jours_disponibles;
    return typeof v === 'number' ? v : Number(v);
};

export default function Dashboard() {
    const { user } = useAuth();
    const [demandes, setDemandes] = useState([]);
    const [types, setTypes] = useState([]);
    const [employes, setEmployes] = useState(null); // null = non accessible
    const [soldes, setSoldes] = useState([]);
    const [chargement, setChargement] = useState(true);
    const [erreur, setErreur] = useState('');

    useEffect(() => {
        const charger = async () => {
            try {
                const res = await api.get('/leaves/');
                setDemandes(res.data.results || res.data);
            } catch (err) {
                setErreur(`Impossible de charger les demandes (${err.response?.status || err.message}) - ${err.config?.url}`);
            }
            try {
                const r = await api.get('/leave-types/');
                setTypes(r.data.results || r.data);
            } catch { /* facultatif */ }

            // Seul l'ADMIN a le droit de lister les employés (sinon erreur 403)
            if (user?.role === 'ADMIN') {
                try {
                    const r = await api.get('/employees/');
                    setEmployes(r.data.results || r.data);
                } catch { setEmployes(null); }
            }

            try {
                const r = await api.get('/leave-balances/');
                setSoldes(r.data.results || r.data);
            } catch { /* facultatif */ }
            setChargement(false);
        };
        charger();
    }, [user?.role]);

    const annee = new Date().getFullYear();
    const estAdmin = user?.role === 'ADMIN';
    const monId = user?.id_employe ?? user?.id;

    const donnees = useMemo(() => {
        const delAnnee = demandes.filter(
            (d) => d.date_debut && new Date(d.date_debut).getFullYear() === annee
        );
        const enAttente = demandes.filter((d) => normaliserStatut(d.statut ?? d.status) === 'EN_ATTENTE');
        const approuveesAnnee = delAnnee.filter((d) => normaliserStatut(d.statut ?? d.status) === 'APPROUVEE');

        const parMois = MOIS.map((mois) => ({ mois, jours: 0 }));
        approuveesAnnee.forEach((d) => {
            parMois[new Date(d.date_debut).getMonth()].jours += nombreJours(d.date_debut, d.date_fin);
        });

        const compteTypes = {};
        delAnnee.forEach((d) => {
            const nom = libelleType(d, types);
            compteTypes[nom] = (compteTypes[nom] || 0) + 1;
        });
        const total = Object.values(compteTypes).reduce((a, b) => a + b, 0);
        const repartition = Object.entries(compteTypes).map(([nom, valeur]) => ({
            nom,
            valeur,
            pourcentage: total ? Math.round((valeur / total) * 100) : 0,
        }));

        // Mon solde de l'année en cours (et non celui de tous les employés)
        const mesSoldes = soldes.filter((s) => {
            const idEmp = s.employe && typeof s.employe === 'object' ? idDe(s.employe) : s.employe;
            const memeEmploye = monId === undefined || idEmp === undefined || String(idEmp) === String(monId);
            const memeAnnee = s.annee === undefined || Number(s.annee) === annee;
            return memeEmploye && memeAnnee;
        });
        const valeursSoldes = mesSoldes.map(restant).filter((v) => Number.isFinite(v));
        const joursRestants = valeursSoldes.length ? valeursSoldes.reduce((a, b) => a + b, 0) : null;

        const recentes = [...demandes]
            .sort((a, b) => new Date(b.date_debut || 0) - new Date(a.date_debut || 0))
            .slice(0, 5);

        return {
            enAttente: enAttente.length,
            approuvees: approuveesAnnee.length,
            parMois,
            repartition,
            joursRestants,
            recentes,
        };
    }, [demandes, types, soldes, annee, monId]);

    const cartes = [
        // La carte "Employés" n'est visible que pour l'ADMIN
        ...(estAdmin
            ? [{ titre: 'Employés', valeur: employes ? employes.length : '-', icone: Users, couleur: '#2563eb', fond: '#e8f0fe' }]
            : []),
        { titre: 'Demandes en attente', valeur: donnees.enAttente, icone: Clock, couleur: '#f59e0b', fond: '#fef3c7' },
        { titre: `Congés approuvés ${annee}`, valeur: donnees.approuvees, icone: CheckCircle, couleur: '#16a34a', fond: '#dcfce7' },
        { titre: 'Mes jours restants', valeur: donnees.joursRestants ?? '-', icone: CalendarDays, couleur: '#8b5cf6', fond: '#ede9fe' },
    ];

    return (
        <div style={{ textAlign: 'left' }}>
            <h1 style={styles.titre}>Bonjour {user?.first_name || user?.username} 👋</h1>
            <p style={styles.sousTitre}>Voici un aperçu de la gestion des congés.</p>

            {erreur && <div style={styles.erreur}>{erreur}</div>}

            <div style={styles.grilleCartes}>
                {cartes.map((c) => (
                    <div key={c.titre} style={styles.carte}>
                        <div style={{ ...styles.carteIcone, backgroundColor: c.fond, color: c.couleur }}>
                            <c.icone size={22} />
                        </div>
                        <div>
                            <div style={styles.carteValeur}>{chargement ? '...' : c.valeur}</div>
                            <div style={styles.carteTitre}>{c.titre}</div>
                        </div>
                    </div>
                ))}
            </div>

            <div style={styles.grilleGraphiques}>
                <div style={{ ...styles.panneau, flex: 2 }}>
                    <h3 style={styles.panneauTitre}>Jours de congé approuvés par mois ({annee})</h3>
                    <div style={{ width: '100%', height: 280 }}>
                        <ResponsiveContainer>
                            <BarChart data={donnees.parMois}>
                                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e5e9f2" />
                                <XAxis dataKey="mois" tickLine={false} axisLine={false} fontSize={12} />
                                <YAxis tickLine={false} axisLine={false} fontSize={12} allowDecimals={false} />
                                <Tooltip cursor={{ fill: '#f4f6fb' }} />
                                <Bar dataKey="jours" fill="#2563eb" radius={[6, 6, 0, 0]} />
                            </BarChart>
                        </ResponsiveContainer>
                    </div>
                </div>

                <div style={{ ...styles.panneau, flex: 1 }}>
                    <h3 style={styles.panneauTitre}>Répartition par type</h3>
                    {donnees.repartition.length === 0 ? (
                        <p style={{ color: '#888' }}>Aucune demande en {annee}.</p>
                    ) : (
                        <>
                            <div style={{ width: '100%', height: 200 }}>
                                <ResponsiveContainer>
                                    <PieChart>
                                        <Pie data={donnees.repartition} dataKey="valeur" nameKey="nom"
                                            innerRadius={55} outerRadius={85} paddingAngle={2}>
                                            {donnees.repartition.map((_, i) => (
                                                <Cell key={i} fill={COULEURS_DONUT[i % COULEURS_DONUT.length]} />
                                            ))}
                                        </Pie>
                                        <Tooltip />
                                    </PieChart>
                                </ResponsiveContainer>
                            </div>
                            <div style={styles.legende}>
                                {donnees.repartition.map((t, i) => (
                                    <div key={t.nom} style={styles.legendeLigne}>
                                        <span style={{ ...styles.pastille, backgroundColor: COULEURS_DONUT[i % COULEURS_DONUT.length] }} />
                                        <span style={{ flexGrow: 1 }}>{t.nom}</span>
                                        <strong>{t.pourcentage}%</strong>
                                    </div>
                                ))}
                            </div>
                        </>
                    )}
                </div>
            </div>

            <div style={{ ...styles.panneau, marginTop: '1rem' }}>
                <h3 style={styles.panneauTitre}>Dernières demandes</h3>
                <table style={styles.table}>
                    <thead>
                        <tr>
                            <th style={styles.th}>Employé</th>
                            <th style={styles.th}>Type</th>
                            <th style={styles.th}>Du</th>
                            <th style={styles.th}>Au</th>
                            <th style={styles.th}>Statut</th>
                        </tr>
                    </thead>
                    <tbody>
                        {donnees.recentes.map((d) => {
                            const brut = d.statut ?? d.status;
                            const st = STATUTS[normaliserStatut(brut)] || { texte: brut || '-', fond: '#eee', couleur: '#444' };
                            return (
                                <tr key={idDe(d)} style={styles.tr}>
                                    <td style={styles.td}>{libelleEmploye(d, employes || [])}</td>
                                    <td style={styles.td}>{libelleType(d, types)}</td>
                                    <td style={styles.td}>{formaterDate(d.date_debut)}</td>
                                    <td style={styles.td}>{formaterDate(d.date_fin)}</td>
                                    <td style={styles.td}>
                                        <span style={{ ...styles.badge, backgroundColor: st.fond, color: st.couleur }}>{st.texte}</span>
                                    </td>
                                </tr>
                            );
                        })}
                        {donnees.recentes.length === 0 && (
                            <tr><td colSpan={5} style={{ ...styles.td, textAlign: 'center', color: '#888' }}>Aucune demande.</td></tr>
                        )}
                    </tbody>
                </table>
            </div>
        </div>
    );
}

const styles = {
    titre: { margin: 0, fontSize: '1.5rem', color: '#0f2557' },
    sousTitre: { color: '#666', marginTop: '0.3rem', marginBottom: '1.5rem' },
    grilleCartes: { display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(210px, 1fr))', gap: '1rem', marginBottom: '1.5rem' },
    carte: { backgroundColor: '#fff', borderRadius: '12px', padding: '1.2rem', display: 'flex', alignItems: 'center', gap: '1rem', boxShadow: '0 1px 3px rgba(15,37,87,0.08)' },
    carteIcone: { width: '48px', height: '48px', borderRadius: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center' },
    carteValeur: { fontSize: '1.6rem', fontWeight: 700, color: '#0f2557' },
    carteTitre: { fontSize: '0.85rem', color: '#666' },
    grilleGraphiques: { display: 'flex', gap: '1rem', flexWrap: 'wrap' },
    panneau: { backgroundColor: '#fff', borderRadius: '12px', padding: '1.2rem', boxShadow: '0 1px 3px rgba(15,37,87,0.08)', minWidth: '280px', overflowX: 'auto' },
    panneauTitre: { margin: '0 0 1rem', fontSize: '1rem', color: '#0f2557' },
    legende: { display: 'flex', flexDirection: 'column', gap: '0.4rem', marginTop: '0.5rem' },
    legendeLigne: { display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.85rem' },
    pastille: { width: '10px', height: '10px', borderRadius: '50%' },
    table: { width: '100%', borderCollapse: 'collapse' },
    th: { textAlign: 'left', padding: '0.6rem', fontSize: '0.8rem', color: '#888', textTransform: 'uppercase', borderBottom: '1px solid #e5e9f2' },
    tr: { borderBottom: '1px solid #f0f2f8' },
    td: { padding: '0.6rem', fontSize: '0.9rem' },
    badge: { padding: '0.2rem 0.6rem', borderRadius: '999px', fontSize: '0.75rem', fontWeight: 600 },
    erreur: { backgroundColor: '#fee2e2', color: '#b91c1c', padding: '0.6rem 0.8rem', borderRadius: '8px', marginBottom: '1rem', fontSize: '0.85rem' },
};
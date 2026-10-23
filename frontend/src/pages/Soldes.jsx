import { useEffect, useMemo, useState } from 'react';
import { Search } from 'lucide-react';
import api from '../services/api';
import { useAuth } from '../context/AuthContext';
import { messageApi } from '../utils/messageApi';

const nombre = (v) => {
    const n = Number(v);
    return Number.isFinite(n) ? n : 0;
};
const fmt = (n) => (Number.isInteger(n) ? String(n) : n.toFixed(1).replace('.', ','));

export default function Soldes() {
    const { user } = useAuth();
    const [soldes, setSoldes] = useState([]);
    const [chargement, setChargement] = useState(true);
    const [erreur, setErreur] = useState('');
    const [recherche, setRecherche] = useState('');
    const [annee, setAnnee] = useState('');

    useEffect(() => {
        api.get('/leave-balances/')
            .then((res) => setSoldes(res.data.results || res.data))
            .catch((err) => setErreur(messageApi(err, 'Impossible de charger les soldes.')))
            .finally(() => setChargement(false));
    }, []);

    const annees = useMemo(
        () => [...new Set(soldes.map((s) => Number(s.annee)))].sort((a, b) => b - a),
        [soldes]
    );

    // Année affichée : celle choisie, sinon l'année en cours si elle existe, sinon la plus récente
    const anneeAffichee = annee !== ''
        ? Number(annee)
        : (annees.includes(new Date().getFullYear()) ? new Date().getFullYear() : annees[0]);

    const lignes = useMemo(() => {
        const mot = recherche.trim().toLowerCase();
        return soldes
            .filter((s) => Number(s.annee) === anneeAffichee)
            .map((s) => ({
                ...s,
                nom: (s.employe_nom || '').trim() || `Employé n°${s.employe}`,
                acquis: nombre(s.jours_acquis),
                pris: nombre(s.jours_pris),
                restants: nombre(s.jours_restants),
            }))
            .filter((s) => !mot || s.nom.toLowerCase().includes(mot))
            .sort((a, b) => a.nom.localeCompare(b.nom, 'fr'));
    }, [soldes, anneeAffichee, recherche]);

    const totaux = lignes.reduce(
        (t, s) => ({ acquis: t.acquis + s.acquis, pris: t.pris + s.pris, restants: t.restants + s.restants }),
        { acquis: 0, pris: 0, restants: 0 }
    );

    const couleur = (restants) => (restants <= 0 ? '#dc2626' : restants <= 5 ? '#f59e0b' : '#2563eb');
    const estAdmin = user?.role === 'ADMIN';

    return (
        <div style={{ textAlign: 'left' }}>
            <h1 style={styles.titre}>{estAdmin ? 'Soldes de congés' : 'Mon solde de congés'}</h1>
            <p style={styles.sousTitre}>
                {estAdmin ? 'Jours acquis, pris et restants de chaque employé.' : 'Vos jours acquis, pris et restants.'}
            </p>

            {erreur && <div style={styles.erreur}>{erreur}</div>}

            <div style={styles.barreOutils}>
                {estAdmin && (
                    <div style={styles.champRecherche}>
                        <Search size={16} color="#94a3b8" />
                        <input
                            style={styles.inputRecherche}
                            placeholder="Rechercher un employé..."
                            value={recherche}
                            onChange={(e) => setRecherche(e.target.value)}
                        />
                    </div>
                )}
                <select
                    style={styles.select}
                    value={anneeAffichee ?? ''}
                    onChange={(e) => setAnnee(e.target.value)}
                >
                    {annees.map((a) => (
                        <option key={a} value={a}>Année {a}</option>
                    ))}
                </select>
            </div>

            <div style={styles.panneau}>
                {chargement ? (
                    <p style={{ padding: '1rem' }}>Chargement...</p>
                ) : (
                    <table style={styles.table}>
                        <thead>
                            <tr>
                                <th style={styles.th}>Employé</th>
                                <th style={{ ...styles.th, textAlign: 'right' }}>Acquis</th>
                                <th style={{ ...styles.th, textAlign: 'right' }}>Pris</th>
                                <th style={{ ...styles.th, textAlign: 'right' }}>Restants</th>
                                <th style={styles.th}>Consommation</th>
                            </tr>
                        </thead>
                        <tbody>
                            {lignes.map((s) => {
                                const pct = s.acquis > 0 ? Math.min(100, (s.pris / s.acquis) * 100) : 0;
                                return (
                                    <tr key={s.id_solde} style={styles.tr}>
                                        <td style={styles.td}>
                                            <div style={styles.cellUtilisateur}>
                                                <div style={styles.avatar}>{s.nom[0]?.toUpperCase() || '?'}</div>
                                                <strong>{s.nom}</strong>
                                            </div>
                                        </td>
                                        <td style={{ ...styles.td, textAlign: 'right' }}>{fmt(s.acquis)}</td>
                                        <td style={{ ...styles.td, textAlign: 'right' }}>{fmt(s.pris)}</td>
                                        <td style={{ ...styles.td, textAlign: 'right' }}>
                                            <span style={{ ...styles.badge, backgroundColor: couleur(s.restants) }}>
                                                {fmt(s.restants)}
                                            </span>
                                        </td>
                                        <td style={{ ...styles.td, minWidth: '160px' }}>
                                            <div style={styles.barreFond}>
                                                <div style={{ ...styles.barre, width: `${pct}%`, backgroundColor: couleur(s.restants) }} />
                                            </div>
                                        </td>
                                    </tr>
                                );
                            })}
                            {lignes.length === 0 && (
                                <tr>
                                    <td colSpan={5} style={{ ...styles.td, textAlign: 'center', color: '#888' }}>
                                        Aucun solde enregistré pour cette année.
                                    </td>
                                </tr>
                            )}
                        </tbody>
                        {lignes.length > 1 && (
                            <tfoot>
                                <tr>
                                    <td style={{ ...styles.td, fontWeight: 700 }}>Total</td>
                                    <td style={{ ...styles.td, textAlign: 'right', fontWeight: 700 }}>{fmt(totaux.acquis)}</td>
                                    <td style={{ ...styles.td, textAlign: 'right', fontWeight: 700 }}>{fmt(totaux.pris)}</td>
                                    <td style={{ ...styles.td, textAlign: 'right', fontWeight: 700 }}>{fmt(totaux.restants)}</td>
                                    <td />
                                </tr>
                            </tfoot>
                        )}
                    </table>
                )}
            </div>
        </div>
    );
}

const styles = {
    titre: { margin: 0, fontSize: '1.5rem', color: '#0f2557' },
    sousTitre: { margin: '0.3rem 0 1.5rem', color: '#666', fontSize: '0.9rem' },
    barreOutils: { display: 'flex', gap: '0.8rem', flexWrap: 'wrap', marginBottom: '1rem' },
    champRecherche: { display: 'flex', alignItems: 'center', gap: '0.5rem', backgroundColor: '#fff', border: '1px solid #d5dbe8', borderRadius: '8px', padding: '0.5rem 0.8rem', minWidth: '260px' },
    inputRecherche: { border: 'none', outline: 'none', flexGrow: 1, fontSize: '0.9rem', backgroundColor: 'transparent' },
    select: { padding: '0.55rem 0.8rem', border: '1px solid #d5dbe8', borderRadius: '8px', fontSize: '0.9rem', backgroundColor: '#fff' },
    panneau: { backgroundColor: '#fff', borderRadius: '12px', padding: '1rem', boxShadow: '0 1px 3px rgba(15,37,87,0.08)', overflowX: 'auto' },
    table: { width: '100%', borderCollapse: 'collapse' },
    th: { textAlign: 'left', padding: '0.75rem', fontSize: '0.8rem', color: '#888', textTransform: 'uppercase', borderBottom: '1px solid #e5e9f2' },
    tr: { borderBottom: '1px solid #f0f2f8' },
    td: { padding: '0.75rem', fontSize: '0.9rem' },
    cellUtilisateur: { display: 'flex', alignItems: 'center', gap: '0.6rem' },
    avatar: { width: '32px', height: '32px', borderRadius: '50%', backgroundColor: '#2563eb', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 600, fontSize: '0.85rem' },
    badge: { color: '#fff', padding: '0.2rem 0.65rem', borderRadius: '999px', fontSize: '0.8rem', fontWeight: 600 },
    barreFond: { backgroundColor: '#eef1f7', borderRadius: '999px', height: '10px', overflow: 'hidden' },
    barre: { height: '100%', borderRadius: '999px', transition: 'width 0.3s' },
    erreur: { backgroundColor: '#fee2e2', color: '#b91c1c', padding: '0.6rem 0.8rem', borderRadius: '8px', marginBottom: '1rem', fontSize: '0.85rem' },
};
import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Plus } from 'lucide-react';
import api from '../services/api';

// Les statuts sont comparés sans tenir compte des majuscules/minuscules
const STATUTS = {
    EN_ATTENTE: { texte: 'En attente', fond: '#fef3c7', couleur: '#b45309' },
    APPROUVEE: { texte: 'Approuvée', fond: '#dcfce7', couleur: '#15803d' },
    REFUSEE: { texte: 'Refusée', fond: '#fee2e2', couleur: '#b91c1c' },
};

// Regroupe les variantes possibles du backend (approuvee, approved, validee...)
function normaliserStatut(s) {
    const v = String(s || '').toUpperCase().replace(/[ÉÈ]/g, 'E');
    if (v.includes('ATTENTE') || v.includes('PENDING') || v.includes('SOUMIS')) return 'EN_ATTENTE';
    if (v.includes('APPROUV') || v.includes('APPROVED') || v.includes('VALID')) return 'APPROUVEE';
    if (v.includes('REFUS') || v.includes('REJECT')) return 'REFUSEE';
    return v;
}

const formaterDate = (d) => (d ? new Date(d).toLocaleDateString('fr-FR') : '-');
const nomType = (t) => t?.nom || t?.libelle || t?.name || t?.label || '';

export default function MesDemandes() {
    const navigate = useNavigate();
    const [demandes, setDemandes] = useState([]);
    const [types, setTypes] = useState([]);
    const [filtre, setFiltre] = useState('TOUS');
    const [chargement, setChargement] = useState(true);
    const [erreur, setErreur] = useState('');

    useEffect(() => {
        const charger = async () => {
            try {
                const res = await api.get('/leaves/');
                setDemandes(res.data.results || res.data);
            } catch (err) {
                setErreur(
                    `Impossible de charger les demandes (${err.response?.status || err.message}) - ${err.config?.url}`
                );
            }
            try {
                const resTypes = await api.get('/leave-types/');
                setTypes(resTypes.data.results || resTypes.data);
            } catch {
                /* les types sont facultatifs pour l'affichage */
            }
            setChargement(false);
        };
        charger();
    }, []);

    // Retrouve le nom du type, qu'il arrive comme id, comme objet ou comme texte
    const libelleType = (d) => {
        const t = d.type_conge ?? d.type ?? d.leave_type;
        if (t && typeof t === 'object') return nomType(t) || '-';
        const trouve = types.find((x) => x.id === t);
        if (trouve) return nomType(trouve);
        return d.type_conge_nom || d.type_nom || t || '-';
    };

    const affichees =
        filtre === 'TOUS' ? demandes : demandes.filter((d) => normaliserStatut(d.statut ?? d.status) === filtre);

    return (
        <div style={{ textAlign: 'left' }}>
            <div style={styles.entete}>
                <div>
                    <h1 style={styles.titre}>Mes demandes</h1>
                    <p style={styles.sousTitre}>{demandes.length} demande(s)</p>
                </div>
                <button style={styles.boutonPrimaire} onClick={() => navigate('/demandes/nouvelle')}>
                    <Plus size={18} /> Nouvelle demande
                </button>
            </div>

            <div style={styles.panneau}>
                <div style={styles.filtres}>
                    {['TOUS', ...Object.keys(STATUTS)].map((s) => (
                        <button
                            key={s}
                            onClick={() => setFiltre(s)}
                            style={{ ...styles.filtre, ...(filtre === s ? styles.filtreActif : {}) }}
                        >
                            {s === 'TOUS' ? 'Toutes' : STATUTS[s].texte}
                        </button>
                    ))}
                </div>

                {erreur && <div style={styles.erreur}>{erreur}</div>}

                {chargement ? (
                    <p style={{ padding: '1rem' }}>Chargement...</p>
                ) : (
                    <table style={styles.table}>
                        <thead>
                            <tr>
                                <th style={styles.th}>Type</th>
                                <th style={styles.th}>Du</th>
                                <th style={styles.th}>Au</th>
                                <th style={styles.th}>Motif</th>
                                <th style={styles.th}>Statut</th>
                            </tr>
                        </thead>
                        <tbody>
                            {affichees.map((d) => {
                                const brut = d.statut ?? d.status;
                                const cle = normaliserStatut(brut);
                                const st = STATUTS[cle] || { texte: brut || '-', fond: '#eee', couleur: '#444' };
                                return (
                                    <tr key={d.id} style={styles.tr}>
                                        <td style={styles.td}>{libelleType(d)}</td>
                                        <td style={styles.td}>{formaterDate(d.date_debut)}</td>
                                        <td style={styles.td}>{formaterDate(d.date_fin)}</td>
                                        <td style={styles.td}>{d.motif || '-'}</td>
                                        <td style={styles.td}>
                                            <span style={{ ...styles.badge, backgroundColor: st.fond, color: st.couleur }}>
                                                {st.texte}
                                            </span>
                                        </td>
                                    </tr>
                                );
                            })}
                            {affichees.length === 0 && (
                                <tr>
                                    <td colSpan={5} style={{ ...styles.td, textAlign: 'center', color: '#888' }}>
                                        Aucune demande.
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                )}
            </div>
        </div>
    );
}

const styles = {
    entete: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' },
    titre: { margin: 0, fontSize: '1.5rem', color: '#0f2557' },
    sousTitre: { margin: '0.3rem 0 0', color: '#666', fontSize: '0.9rem' },
    boutonPrimaire: { display: 'flex', alignItems: 'center', gap: '0.5rem', backgroundColor: '#2563eb', color: '#fff', border: 'none', padding: '0.65rem 1.1rem', borderRadius: '8px', cursor: 'pointer', fontWeight: 600, fontSize: '0.9rem' },
    panneau: { backgroundColor: '#fff', borderRadius: '12px', padding: '1rem', boxShadow: '0 1px 3px rgba(15,37,87,0.08)' },
    filtres: { display: 'flex', gap: '0.5rem', marginBottom: '1rem', flexWrap: 'wrap' },
    filtre: { padding: '0.4rem 0.9rem', borderRadius: '999px', border: '1px solid #d5dbe8', background: '#fff', cursor: 'pointer', fontSize: '0.85rem', color: '#444' },
    filtreActif: { backgroundColor: '#2563eb', borderColor: '#2563eb', color: '#fff' },
    table: { width: '100%', borderCollapse: 'collapse' },
    th: { textAlign: 'left', padding: '0.75rem', fontSize: '0.8rem', color: '#888', textTransform: 'uppercase', borderBottom: '1px solid #e5e9f2' },
    tr: { borderBottom: '1px solid #f0f2f8' },
    td: { padding: '0.75rem', fontSize: '0.9rem' },
    badge: { padding: '0.2rem 0.6rem', borderRadius: '999px', fontSize: '0.75rem', fontWeight: 600 },
    erreur: { backgroundColor: '#fee2e2', color: '#b91c1c', padding: '0.6rem 0.8rem', borderRadius: '8px', marginBottom: '1rem', fontSize: '0.85rem' },
};
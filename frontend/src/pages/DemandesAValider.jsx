import { useEffect, useState } from 'react';
import { Check, X } from 'lucide-react';
import api from '../services/api';
import {
    normaliserStatut, formaterDate, idDe, libelleType, libelleEmploye,
} from '../utils/conges';

// ⚠️ À ADAPTER selon backend/approvals/views.py
const CONFIG = {
    listeUrl: '/leaves/',                              // demandes à afficher
    approuverUrl: (id) => `/leaves/${id}/approve/`,    // action "approuver"
    refuserUrl: (id) => `/leaves/${id}/reject/`,       // action "refuser"
    champCommentaire: 'commentaire',                   // nom du champ commentaire envoyé
};

export default function DemandesAValider() {
    const [demandes, setDemandes] = useState([]);
    const [types, setTypes] = useState([]);
    const [employes, setEmployes] = useState([]);
    const [chargement, setChargement] = useState(true);
    const [erreur, setErreur] = useState('');
    const [succes, setSucces] = useState('');
    const [enCours, setEnCours] = useState(null);
    const [refus, setRefus] = useState(null);
    const [commentaire, setCommentaire] = useState('');

    useEffect(() => {
        const charger = async () => {
            try {
                const res = await api.get(CONFIG.listeUrl);
                const liste = res.data.results || res.data;
                console.log('Exemple de demande :', liste[0]);
                setDemandes(liste.filter((d) => normaliserStatut(d.statut ?? d.status) === 'EN_ATTENTE'));
            } catch (err) {
                setErreur(
                    `Impossible de charger les demandes (${err.response?.status || err.message}) - ${err.config?.url}`
                );
            }

            try {
                const r = await api.get('/leave-types/');
                setTypes(r.data.results || r.data);
            } catch { /* facultatif */ }

            try {
                const r = await api.get('/employees/');
                setEmployes(r.data.results || r.data);
            } catch { /* facultatif : réservé aux rôles autorisés */ }

            setChargement(false);
        };
        charger();
    }, []);

    const envoyerDecision = async (url, id, corps = {}) => {
        setEnCours(id);
        setErreur('');
        setSucces('');
        try {
            await api.post(url, corps);
            setDemandes((liste) => liste.filter((d) => idDe(d) !== id));
            return true;
        } catch (err) {
            const detail = err.response?.data;
            setErreur(
                `Action impossible (${err.response?.status || err.message}) sur ${err.config?.url} : ${detail ? JSON.stringify(detail) : ''}`
            );
            return false;
        } finally {
            setEnCours(null);
        }
    };

    const approuver = async (d) => {
        const id = idDe(d);
        const ok = await envoyerDecision(CONFIG.approuverUrl(id), id);
        if (ok) setSucces('Demande approuvée.');
    };

    const confirmerRefus = async () => {
        const id = idDe(refus);
        const ok = await envoyerDecision(CONFIG.refuserUrl(id), id, {
            [CONFIG.champCommentaire]: commentaire,
        });
        if (ok) {
            setSucces('Demande refusée.');
            setRefus(null);
            setCommentaire('');
        }
    };

    return (
        <div style={{ textAlign: 'left' }}>
            <h1 style={styles.titre}>Demandes à valider</h1>
            <p style={styles.sousTitre}>{demandes.length} demande(s) en attente</p>

            {erreur && <div style={styles.erreur}>{erreur}</div>}
            {succes && <div style={styles.succes}>{succes}</div>}

            <div style={styles.panneau}>
                {chargement ? (
                    <p style={{ padding: '1rem' }}>Chargement...</p>
                ) : (
                    <table style={styles.table}>
                        <thead>
                            <tr>
                                <th style={styles.th}>Employé</th>
                                <th style={styles.th}>Type</th>
                                <th style={styles.th}>Du</th>
                                <th style={styles.th}>Au</th>
                                <th style={styles.th}>Motif</th>
                                <th style={{ ...styles.th, textAlign: 'right' }}>Décision</th>
                            </tr>
                        </thead>
                        <tbody>
                            {demandes.map((d) => {
                                const id = idDe(d);
                                const nom = libelleEmploye(d, employes);
                                return (
                                    <tr key={id} style={styles.tr}>
                                        <td style={styles.td}>
                                            <div style={styles.cellUtilisateur}>
                                                <div style={styles.avatar}>{nom[0]?.toUpperCase() || '?'}</div>
                                                <strong>{nom}</strong>
                                            </div>
                                        </td>
                                        <td style={styles.td}>{libelleType(d, types)}</td>
                                        <td style={styles.td}>{formaterDate(d.date_debut)}</td>
                                        <td style={styles.td}>{formaterDate(d.date_fin)}</td>
                                        <td style={styles.td}>{d.motif || '-'}</td>
                                        <td style={{ ...styles.td, textAlign: 'right', whiteSpace: 'nowrap' }}>
                                            <button
                                                style={styles.boutonApprouver}
                                                disabled={enCours === id}
                                                onClick={() => approuver(d)}
                                            >
                                                <Check size={15} /> Approuver
                                            </button>
                                            <button
                                                style={styles.boutonRefuser}
                                                disabled={enCours === id}
                                                onClick={() => setRefus(d)}
                                            >
                                                <X size={15} /> Refuser
                                            </button>
                                        </td>
                                    </tr>
                                );
                            })}
                            {demandes.length === 0 && (
                                <tr>
                                    <td colSpan={6} style={{ ...styles.td, textAlign: 'center', color: '#888' }}>
                                        Aucune demande en attente.
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                )}
            </div>

            {/* FENÊTRE DE REFUS */}
            {refus && (
                <div style={styles.fond} onClick={() => setRefus(null)}>
                    <div style={styles.modale} onClick={(e) => e.stopPropagation()}>
                        <h3 style={{ margin: '0 0 0.5rem', color: '#0f2557' }}>Refuser la demande</h3>
                        <p style={{ margin: '0 0 1rem', color: '#666', fontSize: '0.9rem' }}>
                            Demande de <strong>{libelleEmploye(refus, employes)}</strong> du{' '}
                            {formaterDate(refus.date_debut)} au {formaterDate(refus.date_fin)}.
                        </p>
                        <textarea
                            style={styles.textarea}
                            placeholder="Motif du refus (facultatif)..."
                            value={commentaire}
                            onChange={(e) => setCommentaire(e.target.value)}
                        />
                        <div style={styles.actionsModale}>
                            <button style={styles.boutonSecondaire} onClick={() => setRefus(null)}>
                                Annuler
                            </button>
                            <button style={styles.boutonRefuserPlein} onClick={confirmerRefus}>
                                Confirmer le refus
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}

const styles = {
    titre: { margin: 0, fontSize: '1.5rem', color: '#0f2557' },
    sousTitre: { margin: '0.3rem 0 1.5rem', color: '#666', fontSize: '0.9rem' },
    panneau: { backgroundColor: '#fff', borderRadius: '12px', padding: '1rem', boxShadow: '0 1px 3px rgba(15,37,87,0.08)', overflowX: 'auto' },
    table: { width: '100%', borderCollapse: 'collapse' },
    th: { textAlign: 'left', padding: '0.75rem', fontSize: '0.8rem', color: '#888', textTransform: 'uppercase', borderBottom: '1px solid #e5e9f2' },
    tr: { borderBottom: '1px solid #f0f2f8' },
    td: { padding: '0.75rem', fontSize: '0.9rem' },
    cellUtilisateur: { display: 'flex', alignItems: 'center', gap: '0.6rem' },
    avatar: { width: '32px', height: '32px', borderRadius: '50%', backgroundColor: '#2563eb', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 600, fontSize: '0.85rem' },
    boutonApprouver: { display: 'inline-flex', alignItems: 'center', gap: '0.3rem', backgroundColor: '#dcfce7', color: '#15803d', border: 'none', padding: '0.4rem 0.8rem', borderRadius: '8px', cursor: 'pointer', fontWeight: 600, fontSize: '0.8rem', marginRight: '0.5rem' },
    boutonRefuser: { display: 'inline-flex', alignItems: 'center', gap: '0.3rem', backgroundColor: '#fee2e2', color: '#b91c1c', border: 'none', padding: '0.4rem 0.8rem', borderRadius: '8px', cursor: 'pointer', fontWeight: 600, fontSize: '0.8rem' },
    boutonRefuserPlein: { backgroundColor: '#dc2626', color: '#fff', border: 'none', padding: '0.6rem 1.1rem', borderRadius: '8px', cursor: 'pointer', fontWeight: 600 },
    boutonSecondaire: { backgroundColor: '#fff', color: '#444', border: '1px solid #d5dbe8', padding: '0.6rem 1.1rem', borderRadius: '8px', cursor: 'pointer' },
    erreur: { backgroundColor: '#fee2e2', color: '#b91c1c', padding: '0.6rem 0.8rem', borderRadius: '8px', marginBottom: '1rem', fontSize: '0.85rem' },
    succes: { backgroundColor: '#dcfce7', color: '#15803d', padding: '0.6rem 0.8rem', borderRadius: '8px', marginBottom: '1rem', fontSize: '0.85rem' },
    fond: { position: 'fixed', inset: 0, backgroundColor: 'rgba(15,37,87,0.45)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 50 },
    modale: { backgroundColor: '#fff', borderRadius: '12px', padding: '1.5rem', width: '100%', maxWidth: '440px' },
    textarea: { width: '100%', minHeight: '90px', padding: '0.65rem 0.8rem', border: '1px solid #d5dbe8', borderRadius: '8px', fontSize: '0.9rem', resize: 'vertical', outline: 'none' },
    actionsModale: { display: 'flex', justifyContent: 'flex-end', gap: '0.6rem', marginTop: '1rem' },
};
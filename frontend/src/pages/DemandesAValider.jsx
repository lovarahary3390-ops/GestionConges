import { useEffect, useState } from 'react';
import { Check, X } from 'lucide-react';
import api from '../services/api';
import { useAuth } from '../context/AuthContext';
import { messageApi } from '../utils/messageApi';
import {
    normaliserStatut, formaterDate, idDe, libelleType, libelleEmploye,
} from '../utils/conges';

const CONFIG = {
    listeUrl: '/leaves/',
    approuverUrl: (id) => `/leaves/${id}/approve/`,
    refuserUrl: (id) => `/leaves/${id}/reject/`,
    champCommentaire: 'commentaire',
};

export default function DemandesAValider() {
    const { user } = useAuth();
    const [demandes, setDemandes] = useState([]);
    const [types, setTypes] = useState([]);
    const [employes, setEmployes] = useState([]);
    const [chargement, setChargement] = useState(true);
    const [erreur, setErreur] = useState('');
    const [succes, setSucces] = useState('');
    const [enCours, setEnCours] = useState(null);
    const [refus, setRefus] = useState(null);
    const [commentaire, setCommentaire] = useState('');
    const [erreurRefus, setErreurRefus] = useState('');

    useEffect(() => {
        const charger = async () => {
            try {
                const res = await api.get(CONFIG.listeUrl);
                const liste = res.data.results || res.data;
                setDemandes(liste.filter((d) => normaliserStatut(d.statut ?? d.status) === 'EN_ATTENTE'));
            } catch (err) {
                setErreur(messageApi(err, 'Impossible de charger les demandes.'));
            }

            try {
                const r = await api.get('/leave-types/');
                setTypes(r.data.results || r.data);
            } catch { /* facultatif */ }

            if (user?.role === 'ADMIN') {
                try {
                    const r = await api.get('/employees/');
                    setEmployes(r.data.results || r.data);
                } catch { /* facultatif */ }
            }

            setChargement(false);
        };
        charger();
    }, [user?.role]);

    // Identifie mes propres demandes : affichées, mais non actionnables
    const monId = user?.id_employe ?? user?.id;
    const estMaDemande = (d) => {
        const e = d.employe;
        const idEmploye = e && typeof e === 'object' ? idDe(e) : e;
        return monId !== undefined && idEmploye !== undefined && String(idEmploye) === String(monId);
    };

    const envoyerDecision = async (url, id, corps = {}) => {
        setEnCours(id);
        setSucces('');
        try {
            await api.post(url, corps);
            setDemandes((liste) => liste.filter((d) => idDe(d) !== id));
            return null;
        } catch (err) {
            return messageApi(err, 'Action impossible. Veuillez réessayer.');
        } finally {
            setEnCours(null);
        }
    };

    const approuver = async (d) => {
        setErreur('');
        const id = idDe(d);
        const message = await envoyerDecision(CONFIG.approuverUrl(id), id);
        if (message) setErreur(message);
        else setSucces('Demande approuvée.');
    };

    const ouvrirRefus = (d) => {
        setErreur('');
        setSucces('');
        setCommentaire('');
        setErreurRefus('');
        setRefus(d);
    };

    const fermerRefus = () => {
        setRefus(null);
        setCommentaire('');
        setErreurRefus('');
    };

    const confirmerRefus = async () => {
        const motif = commentaire.trim();
        if (!motif) {
            setErreurRefus('Le motif du refus est obligatoire.');
            return;
        }
        setErreurRefus('');
        const id = idDe(refus);
        const message = await envoyerDecision(CONFIG.refuserUrl(id), id, {
            [CONFIG.champCommentaire]: motif,
        });
        if (message) {
            setErreurRefus(message);
            return;
        }
        setSucces('Demande refusée.');
        fermerRefus();
    };

    const peutConfirmer = commentaire.trim() !== '' && enCours === null;

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
                                const estAMoi = estMaDemande(d);
                                return (
                                    <tr key={id} style={styles.tr}>
                                        <td style={styles.td}>
                                            <div style={styles.cellUtilisateur}>
                                                <div style={styles.avatar}>{nom[0]?.toUpperCase() || '?'}</div>
                                                <strong>{nom}</strong>
                                                {estAMoi && <span style={styles.badgeMoi}>Vous</span>}
                                            </div>
                                        </td>
                                        <td style={styles.td}>{libelleType(d, types)}</td>
                                        <td style={styles.td}>{formaterDate(d.date_debut)}</td>
                                        <td style={styles.td}>{formaterDate(d.date_fin)}</td>
                                        <td style={styles.td}>{d.motif || '-'}</td>
                                        <td style={{ ...styles.td, textAlign: 'right', whiteSpace: 'nowrap' }}>
                                            {estAMoi ? (
                                                <span style={styles.texteDesactive} title="Vous ne pouvez pas valider votre propre demande">
                                                    Non modifiable
                                                </span>
                                            ) : (
                                                <>
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
                                                        onClick={() => ouvrirRefus(d)}
                                                    >
                                                        <X size={15} /> Refuser
                                                    </button>
                                                </>
                                            )}
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
                <div style={styles.fond} onClick={fermerRefus}>
                    <div style={styles.modale} onClick={(e) => e.stopPropagation()}>
                        <h3 style={{ margin: '0 0 0.5rem', color: '#0f2557' }}>Refuser la demande</h3>
                        <p style={{ margin: '0 0 1rem', color: '#666', fontSize: '0.9rem' }}>
                            Demande de <strong>{libelleEmploye(refus, employes)}</strong> du{' '}
                            {formaterDate(refus.date_debut)} au {formaterDate(refus.date_fin)}.
                        </p>

                        <label style={styles.labelModale}>
                            Motif du refus <span style={{ color: '#dc2626' }}>*</span>
                        </label>
                        <textarea
                            autoFocus
                            style={styles.textarea}
                            placeholder="Expliquez la raison du refus..."
                            value={commentaire}
                            onChange={(e) => {
                                setCommentaire(e.target.value);
                                setErreurRefus('');
                            }}
                        />

                        {erreurRefus ? (
                            <div style={styles.erreurModale}>{erreurRefus}</div>
                        ) : (
                            !commentaire.trim() && (
                                <div style={styles.aide}>
                                    Le motif est obligatoire pour refuser une demande.
                                </div>
                            )
                        )}

                        <div style={styles.actionsModale}>
                            <button style={styles.boutonSecondaire} onClick={fermerRefus}>
                                Annuler
                            </button>
                            <button
                                style={{
                                    ...styles.boutonRefuserPlein,
                                    ...(peutConfirmer ? {} : styles.boutonDesactive),
                                }}
                                disabled={!peutConfirmer}
                                onClick={confirmerRefus}
                            >
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
    badgeMoi: { backgroundColor: '#e8f0fe', color: '#1d4ed8', fontSize: '0.7rem', fontWeight: 700, padding: '0.1rem 0.5rem', borderRadius: '999px' },
    texteDesactive: { color: '#9aa5bd', fontSize: '0.8rem', fontStyle: 'italic' },
    boutonApprouver: { display: 'inline-flex', alignItems: 'center', gap: '0.3rem', backgroundColor: '#dcfce7', color: '#15803d', border: 'none', padding: '0.4rem 0.8rem', borderRadius: '8px', cursor: 'pointer', fontWeight: 600, fontSize: '0.8rem', marginRight: '0.5rem' },
    boutonRefuser: { display: 'inline-flex', alignItems: 'center', gap: '0.3rem', backgroundColor: '#fee2e2', color: '#b91c1c', border: 'none', padding: '0.4rem 0.8rem', borderRadius: '8px', cursor: 'pointer', fontWeight: 600, fontSize: '0.8rem' },
    boutonRefuserPlein: { backgroundColor: '#dc2626', color: '#fff', border: 'none', padding: '0.6rem 1.1rem', borderRadius: '8px', cursor: 'pointer', fontWeight: 600 },
    boutonDesactive: { opacity: 0.45, cursor: 'not-allowed' },
    boutonSecondaire: { backgroundColor: '#fff', color: '#444', border: '1px solid #d5dbe8', padding: '0.6rem 1.1rem', borderRadius: '8px', cursor: 'pointer' },
    erreur: { backgroundColor: '#fee2e2', color: '#b91c1c', padding: '0.6rem 0.8rem', borderRadius: '8px', marginBottom: '1rem', fontSize: '0.85rem' },
    succes: { backgroundColor: '#dcfce7', color: '#15803d', padding: '0.6rem 0.8rem', borderRadius: '8px', marginBottom: '1rem', fontSize: '0.85rem' },
    fond: { position: 'fixed', inset: 0, backgroundColor: 'rgba(15,37,87,0.45)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 50 },
    modale: { backgroundColor: '#fff', borderRadius: '12px', padding: '1.5rem', width: '100%', maxWidth: '440px' },
    labelModale: { display: 'block', fontSize: '0.85rem', fontWeight: 600, color: '#0f2557', marginBottom: '0.35rem' },
    textarea: { width: '100%', minHeight: '90px', padding: '0.65rem 0.8rem', border: '1px solid #d5dbe8', borderRadius: '8px', fontSize: '0.9rem', resize: 'vertical', outline: 'none', boxSizing: 'border-box' },
    aide: { marginTop: '0.4rem', color: '#888', fontSize: '0.8rem' },
    erreurModale: { marginTop: '0.5rem', backgroundColor: '#fee2e2', color: '#b91c1c', padding: '0.5rem 0.7rem', borderRadius: '8px', fontSize: '0.85rem' },
    actionsModale: { display: 'flex', justifyContent: 'flex-end', gap: '0.6rem', marginTop: '1rem' },
};
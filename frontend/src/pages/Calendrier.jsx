import { useEffect, useMemo, useState } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import api from '../services/api';
import { normaliserStatut, versIso, libelleEmploye, libelleType } from '../utils/conges';

const JOURS = ['Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam', 'Dim'];
const COULEURS = {
    APPROUVEE: { fond: '#dcfce7', texte: '#15803d' },
    EN_ATTENTE: { fond: '#fef3c7', texte: '#b45309' },
};

export default function Calendrier() {
    const [mois, setMois] = useState(() => {
        const n = new Date();
        return new Date(n.getFullYear(), n.getMonth(), 1);
    });
    const [demandes, setDemandes] = useState([]);
    const [types, setTypes] = useState([]);
    const [erreur, setErreur] = useState('');

    useEffect(() => {
        api.get('/leaves/')
            .then((res) => setDemandes(res.data.results || res.data))
            .catch((err) =>
                setErreur(`Impossible de charger les congés (${err.response?.status || err.message}) - ${err.config?.url}`)
            );
        api.get('/leave-types/')
            .then((res) => setTypes(res.data.results || res.data))
            .catch(() => {});
    }, []);

    // Seules les demandes approuvées ou en attente apparaissent
    const visibles = useMemo(
        () => demandes.filter((d) => ['APPROUVEE', 'EN_ATTENTE'].includes(normaliserStatut(d.statut ?? d.status))),
        [demandes]
    );

    const cases = useMemo(() => {
        const annee = mois.getFullYear();
        const m = mois.getMonth();
        const decalage = (new Date(annee, m, 1).getDay() + 6) % 7; // lundi = 0
        const nbJours = new Date(annee, m + 1, 0).getDate();
        const liste = [];
        for (let i = 0; i < decalage; i++) liste.push(null);
        for (let j = 1; j <= nbJours; j++) liste.push(new Date(annee, m, j));
        while (liste.length % 7 !== 0) liste.push(null);
        return liste;
    }, [mois]);

    const demandesDuJour = (jour) => {
        const iso = versIso(jour);
        return visibles.filter((d) => {
            const debut = String(d.date_debut).slice(0, 10);
            const fin = String(d.date_fin).slice(0, 10);
            return debut <= iso && iso <= fin;
        });
    };

    const aujourdhui = versIso(new Date());
    const titre = mois.toLocaleDateString('fr-FR', { month: 'long', year: 'numeric' });
    const changerMois = (delta) => setMois(new Date(mois.getFullYear(), mois.getMonth() + delta, 1));

    return (
        <div style={{ textAlign: 'left' }}>
            <div style={styles.entete}>
                <div>
                    <h1 style={styles.titre}>Calendrier</h1>
                    <p style={styles.sousTitre}>Congés approuvés et en attente</p>
                </div>
                <div style={styles.navigation}>
                    <button style={styles.boutonNav} onClick={() => changerMois(-1)}><ChevronLeft size={18} /></button>
                    <span style={styles.moisTitre}>{titre}</span>
                    <button style={styles.boutonNav} onClick={() => changerMois(1)}><ChevronRight size={18} /></button>
                    <button style={styles.boutonAujourdhui} onClick={() => setMois(new Date(new Date().getFullYear(), new Date().getMonth(), 1))}>
                        Aujourd'hui
                    </button>
                </div>
            </div>

            {erreur && <div style={styles.erreur}>{erreur}</div>}

            <div style={styles.legende}>
                <span style={{ ...styles.pastille, backgroundColor: COULEURS.APPROUVEE.fond, color: COULEURS.APPROUVEE.texte }}>Approuvé</span>
                <span style={{ ...styles.pastille, backgroundColor: COULEURS.EN_ATTENTE.fond, color: COULEURS.EN_ATTENTE.texte }}>En attente</span>
            </div>

            <div style={styles.panneau}>
                <div style={styles.grille}>
                    {JOURS.map((j) => (
                        <div key={j} style={styles.enteteJour}>{j}</div>
                    ))}
                    {cases.map((jour, i) => {
                        if (!jour) return <div key={i} style={styles.caseVide} />;
                        const conges = demandesDuJour(jour);
                        const estAujourdhui = versIso(jour) === aujourdhui;
                        return (
                            <div key={i} style={{ ...styles.caseJour, ...(estAujourdhui ? styles.caseAujourdhui : {}) }}>
                                <div style={{ ...styles.numero, ...(estAujourdhui ? styles.numeroAujourdhui : {}) }}>
                                    {jour.getDate()}
                                </div>
                                {conges.slice(0, 2).map((d) => {
                                    const c = COULEURS[normaliserStatut(d.statut ?? d.status)];
                                    return (
                                        <div key={d.id} title={`${libelleEmploye(d)} - ${libelleType(d, types)}`}
                                            style={{ ...styles.puce, backgroundColor: c.fond, color: c.texte }}>
                                            {libelleEmploye(d)}
                                        </div>
                                    );
                                })}
                                {conges.length > 2 && <div style={styles.plus}>+{conges.length - 2} autre(s)</div>}
                            </div>
                        );
                    })}
                </div>
            </div>
        </div>
    );
}

const styles = {
    entete: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem', marginBottom: '1rem' },
    titre: { margin: 0, fontSize: '1.5rem', color: '#0f2557' },
    sousTitre: { margin: '0.3rem 0 0', color: '#666', fontSize: '0.9rem' },
    navigation: { display: 'flex', alignItems: 'center', gap: '0.6rem' },
    boutonNav: { background: '#fff', border: '1px solid #d5dbe8', borderRadius: '8px', padding: '0.4rem', cursor: 'pointer', display: 'flex' },
    boutonAujourdhui: { background: '#2563eb', color: '#fff', border: 'none', borderRadius: '8px', padding: '0.5rem 0.9rem', cursor: 'pointer', fontWeight: 600, fontSize: '0.85rem' },
    moisTitre: { minWidth: '150px', textAlign: 'center', fontWeight: 600, color: '#0f2557', textTransform: 'capitalize' },
    legende: { display: 'flex', gap: '0.6rem', marginBottom: '1rem' },
    pastille: { padding: '0.2rem 0.7rem', borderRadius: '999px', fontSize: '0.75rem', fontWeight: 600 },
    panneau: { backgroundColor: '#fff', borderRadius: '12px', padding: '1rem', boxShadow: '0 1px 3px rgba(15,37,87,0.08)', overflowX: 'auto' },
    grille: { display: 'grid', gridTemplateColumns: 'repeat(7, minmax(110px, 1fr))', gap: '4px' },
    enteteJour: { textAlign: 'center', fontSize: '0.8rem', fontWeight: 600, color: '#888', padding: '0.4rem 0', textTransform: 'uppercase' },
    caseVide: { minHeight: '92px' },
    caseJour: { minHeight: '92px', border: '1px solid #eef1f7', borderRadius: '8px', padding: '0.3rem', display: 'flex', flexDirection: 'column', gap: '2px' },
    caseAujourdhui: { borderColor: '#2563eb', backgroundColor: '#f5f8ff' },
    numero: { fontSize: '0.8rem', color: '#555', fontWeight: 600 },
    numeroAujourdhui: { color: '#2563eb' },
    puce: { fontSize: '0.7rem', padding: '1px 6px', borderRadius: '4px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', fontWeight: 600 },
    plus: { fontSize: '0.7rem', color: '#888' },
    erreur: { backgroundColor: '#fee2e2', color: '#b91c1c', padding: '0.6rem 0.8rem', borderRadius: '8px', marginBottom: '1rem', fontSize: '0.85rem' },
};
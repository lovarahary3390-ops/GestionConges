import { useEffect, useMemo, useState } from 'react';
import {
    BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid,
    PieChart, Pie, Cell,
} from 'recharts';
import { Download } from 'lucide-react';
import api from '../services/api';
import {
    normaliserStatut, STATUTS, nombreJours, libelleType, libelleEmploye, formaterDate,
} from '../utils/conges';

const COULEURS = ['#2563eb', '#16a34a', '#f59e0b', '#ef4444', '#8b5cf6', '#0ea5e9'];
const MOIS = ['Jan', 'Fév', 'Mar', 'Avr', 'Mai', 'Juin', 'Juil', 'Août', 'Sep', 'Oct', 'Nov', 'Déc'];

export default function Rapports() {
    const [demandes, setDemandes] = useState([]);
    const [types, setTypes] = useState([]);
    const [employes, setEmployes] = useState([]);
    const [annee, setAnnee] = useState(new Date().getFullYear());
    const [erreur, setErreur] = useState('');

    useEffect(() => {
        api.get('/leaves/')
            .then((res) => setDemandes(res.data.results || res.data))
            .catch((err) =>
                setErreur(`Impossible de charger les données (${err.response?.status || err.message}) - ${err.config?.url}`)
            );
        api.get('/leave-types/')
            .then((res) => setTypes(res.data.results || res.data))
            .catch(() => {});
        api.get('/employees/')
            .then((res) => setEmployes(res.data.results || res.data))
            .catch(() => {});
    }, []);

    const delAnnee = useMemo(
        () => demandes.filter((d) => d.date_debut && new Date(d.date_debut).getFullYear() === annee),
        [demandes, annee]
    );

    const stats = useMemo(() => {
        const compte = { EN_ATTENTE: 0, APPROUVEE: 0, REFUSEE: 0 };
        delAnnee.forEach((d) => {
            const s = normaliserStatut(d.statut ?? d.status);
            if (compte[s] !== undefined) compte[s]++;
        });

        const approuvees = delAnnee.filter((d) => normaliserStatut(d.statut ?? d.status) === 'APPROUVEE');
        const joursApprouves = approuvees.reduce((t, d) => t + nombreJours(d.date_debut, d.date_fin), 0);

        const parMois = MOIS.map((mois) => ({ mois, jours: 0 }));
        approuvees.forEach((d) => {
            parMois[new Date(d.date_debut).getMonth()].jours += nombreJours(d.date_debut, d.date_fin);
        });

        const parType = {};
        delAnnee.forEach((d) => {
            const nom = libelleType(d, types);
            parType[nom] = (parType[nom] || 0) + 1;
        });

        return {
            compte,
            joursApprouves,
            parMois,
            parType: Object.entries(parType).map(([nom, valeur]) => ({ nom, valeur })),
        };
    }, [delAnnee, types]);

    const exporterCsv = () => {
        const lignes = [['Employé', 'Type', 'Début', 'Fin', 'Jours', 'Statut', 'Motif']];
        delAnnee.forEach((d) => {
            const st = STATUTS[normaliserStatut(d.statut ?? d.status)]?.texte || d.statut || '';
            lignes.push([
                libelleEmploye(d, employes),
                libelleType(d, types),
                formaterDate(d.date_debut),
                formaterDate(d.date_fin),
                nombreJours(d.date_debut, d.date_fin),
                st,
                d.motif || '',
            ]);
        });
        const csv = lignes
            .map((l) => l.map((c) => `"${String(c).replace(/"/g, '""')}"`).join(';'))
            .join('\n');
        const blob = new Blob(['\uFEFF' + csv], { type: 'text/csv;charset=utf-8;' });
        const lien = document.createElement('a');
        lien.href = URL.createObjectURL(blob);
        lien.download = `rapport-conges-${annee}.csv`;
        lien.click();
        URL.revokeObjectURL(lien.href);
    };

    const cartes = [
        { titre: 'Demandes', valeur: delAnnee.length, couleur: '#2563eb' },
        { titre: 'En attente', valeur: stats.compte.EN_ATTENTE, couleur: '#f59e0b' },
        { titre: 'Approuvées', valeur: stats.compte.APPROUVEE, couleur: '#16a34a' },
        { titre: 'Refusées', valeur: stats.compte.REFUSEE, couleur: '#dc2626' },
        { titre: 'Jours approuvés', valeur: stats.joursApprouves, couleur: '#8b5cf6' },
    ];

    return (
        <div style={{ textAlign: 'left' }}>
            <div style={styles.entete}>
                <div>
                    <h1 style={styles.titre}>Rapports</h1>
                    <p style={styles.sousTitre}>Synthèse des congés</p>
                </div>
                <div style={styles.actions}>
                    <select style={styles.select} value={annee} onChange={(e) => setAnnee(Number(e.target.value))}>
                        {[0, 1, 2].map((i) => {
                            const a = new Date().getFullYear() - i;
                            return <option key={a} value={a}>{a}</option>;
                        })}
                    </select>
                    <button style={styles.boutonPrimaire} onClick={exporterCsv}>
                        <Download size={16} /> Exporter en CSV
                    </button>
                </div>
            </div>

            {erreur && <div style={styles.erreur}>{erreur}</div>}

            <div style={styles.grilleCartes}>
                {cartes.map((c) => (
                    <div key={c.titre} style={{ ...styles.carte, borderTop: `4px solid ${c.couleur}` }}>
                        <div style={styles.carteValeur}>{c.valeur}</div>
                        <div style={styles.carteTitre}>{c.titre}</div>
                    </div>
                ))}
            </div>

            <div style={styles.grilleGraphiques}>
                <div style={{ ...styles.panneau, flex: 2 }}>
                    <h3 style={styles.panneauTitre}>Jours de congé approuvés par mois</h3>
                    <div style={{ width: '100%', height: 280 }}>
                        <ResponsiveContainer>
                            <BarChart data={stats.parMois}>
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
                    <h3 style={styles.panneauTitre}>Demandes par type</h3>
                    {stats.parType.length === 0 ? (
                        <p style={{ color: '#888' }}>Aucune donnée pour {annee}.</p>
                    ) : (
                        <>
                            <div style={{ width: '100%', height: 200 }}>
                                <ResponsiveContainer>
                                    <PieChart>
                                        <Pie
                                            data={stats.parType}
                                            dataKey="valeur"
                                            nameKey="nom"
                                            innerRadius={50}
                                            outerRadius={80}
                                            paddingAngle={2}
                                        >
                                            {stats.parType.map((_, i) => (
                                                <Cell key={i} fill={COULEURS[i % COULEURS.length]} />
                                            ))}
                                        </Pie>
                                        <Tooltip />
                                    </PieChart>
                                </ResponsiveContainer>
                            </div>
                            {stats.parType.map((t, i) => (
                                <div key={t.nom} style={styles.legendeLigne}>
                                    <span style={{ ...styles.point, backgroundColor: COULEURS[i % COULEURS.length] }} />
                                    <span style={{ flexGrow: 1 }}>{t.nom}</span>
                                    <strong>{t.valeur}</strong>
                                </div>
                            ))}
                        </>
                    )}
                </div>
            </div>
        </div>
    );
}

const styles = {
    entete: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem', marginBottom: '1.5rem' },
    titre: { margin: 0, fontSize: '1.5rem', color: '#0f2557' },
    sousTitre: { margin: '0.3rem 0 0', color: '#666', fontSize: '0.9rem' },
    actions: { display: 'flex', gap: '0.6rem', alignItems: 'center' },
    select: { padding: '0.55rem 0.8rem', border: '1px solid #d5dbe8', borderRadius: '8px', backgroundColor: '#fff' },
    boutonPrimaire: { display: 'flex', alignItems: 'center', gap: '0.5rem', backgroundColor: '#2563eb', color: '#fff', border: 'none', padding: '0.6rem 1.1rem', borderRadius: '8px', cursor: 'pointer', fontWeight: 600, fontSize: '0.9rem' },
    grilleCartes: { display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: '1rem', marginBottom: '1.5rem' },
    carte: { backgroundColor: '#fff', borderRadius: '12px', padding: '1rem 1.2rem', boxShadow: '0 1px 3px rgba(15,37,87,0.08)' },
    carteValeur: { fontSize: '1.6rem', fontWeight: 700, color: '#0f2557' },
    carteTitre: { fontSize: '0.85rem', color: '#666' },
    grilleGraphiques: { display: 'flex', gap: '1rem', flexWrap: 'wrap' },
    panneau: { backgroundColor: '#fff', borderRadius: '12px', padding: '1.2rem', boxShadow: '0 1px 3px rgba(15,37,87,0.08)', minWidth: '280px' },
    panneauTitre: { margin: '0 0 1rem', fontSize: '1rem', color: '#0f2557' },
    legendeLigne: { display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.85rem', marginTop: '0.35rem' },
    point: { width: '10px', height: '10px', borderRadius: '50%' },
    erreur: { backgroundColor: '#fee2e2', color: '#b91c1c', padding: '0.6rem 0.8rem', borderRadius: '8px', marginBottom: '1rem', fontSize: '0.85rem' },
};
import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Plus, Search, Pencil, Trash2 } from 'lucide-react';
import api from '../services/api';

const COULEURS_ROLE = {
    ADMIN: { fond: '#fee2e2', texte: '#b91c1c' },
    RESPONSABLE: { fond: '#fef3c7', texte: '#b45309' },
    EMPLOYE: { fond: '#e8f0fe', texte: '#1d4ed8' },
};

export default function Employees() {
    const navigate = useNavigate();
    const [employes, setEmployes] = useState([]);
    const [recherche, setRecherche] = useState('');
    const [chargement, setChargement] = useState(true);
    const [erreur, setErreur] = useState('');

    useEffect(() => {
        api.get('/employees/')
            .then((res) => setEmployes(res.data.results || res.data))
            .catch((err) =>
                setErreur(
                    `Impossible de charger les employés (${err.response?.status || err.message}) - ${err.config?.url}`
                )
            )
            .finally(() => setChargement(false));
    }, []);

    const supprimer = async (emp) => {
        if (!window.confirm(`Supprimer ${emp.first_name || emp.username} ${emp.last_name || ''} ?`)) return;
        try {
            await api.delete(`/employees/${emp.id_employe}/`);
            setEmployes((liste) => liste.filter((e) => e.id_employe !== emp.id_employe));
        } catch (err) {
            setErreur(`Suppression impossible (${err.response?.status || err.message}).`);
        }
    };

    const filtres = employes.filter((e) =>
        `${e.first_name || ''} ${e.last_name || ''} ${e.email || ''} ${e.username || ''} ${e.poste || ''}`
            .toLowerCase()
            .includes(recherche.toLowerCase())
    );

    return (
        <div style={{ textAlign: 'left' }}>
            <div style={styles.entete}>
                <div>
                    <h1 style={styles.titre}>Employés</h1>
                    <p style={styles.sousTitre}>{employes.length} employé(s) au total</p>
                </div>
                <button style={styles.boutonPrimaire} onClick={() => navigate('/employes/nouveau')}>
                    <Plus size={18} /> Ajouter un employé
                </button>
            </div>

            <div style={styles.panneau}>
                <div style={styles.rechercheZone}>
                    <Search size={16} color="#888" />
                    <input
                        style={styles.rechercheInput}
                        placeholder="Rechercher un employé..."
                        value={recherche}
                        onChange={(e) => setRecherche(e.target.value)}
                    />
                </div>

                {erreur && <div style={styles.erreur}>{erreur}</div>}

                {chargement ? (
                    <p style={{ padding: '1rem' }}>Chargement...</p>
                ) : (
                    <table style={styles.table}>
                        <thead>
                            <tr>
                                <th style={styles.th}>Employé</th>
                                <th style={styles.th}>Poste</th>
                                <th style={styles.th}>Service</th>
                                <th style={styles.th}>Email</th>
                                <th style={styles.th}>Rôle</th>
                                <th style={styles.th}>Statut</th>
                                <th style={{ ...styles.th, textAlign: 'right' }}>Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {filtres.map((emp) => {
                                const couleur = COULEURS_ROLE[emp.role] || COULEURS_ROLE.EMPLOYE;
                                const service =
                                    emp.service_detail?.nom || emp.service_detail?.name || emp.service_detail?.libelle || '-';
                                return (
                                    <tr key={emp.id_employe} style={styles.tr}>
                                        <td style={styles.td}>
                                            <div style={styles.cellUtilisateur}>
                                                <div style={styles.avatar}>
                                                    {(emp.first_name?.[0] || emp.username?.[0] || '?').toUpperCase()}
                                                </div>
                                                <div>
                                                    <div style={{ fontWeight: 600 }}>
                                                        {emp.first_name} {emp.last_name}
                                                    </div>
                                                    <div style={{ fontSize: '0.8rem', color: '#888' }}>@{emp.username}</div>
                                                </div>
                                            </div>
                                        </td>
                                        <td style={styles.td}>{emp.poste || '-'}</td>
                                        <td style={styles.td}>{service}</td>
                                        <td style={styles.td}>{emp.email || '-'}</td>
                                        <td style={styles.td}>
                                            <span style={{ ...styles.badge, backgroundColor: couleur.fond, color: couleur.texte }}>
                                                {emp.role}
                                            </span>
                                        </td>
                                        <td style={styles.td}>
                                            <span
                                                style={{
                                                    ...styles.badge,
                                                    backgroundColor: emp.is_active ? '#dcfce7' : '#f1f5f9',
                                                    color: emp.is_active ? '#15803d' : '#64748b',
                                                }}
                                            >
                                                {emp.is_active ? 'Actif' : 'Inactif'}
                                            </span>
                                        </td>
                                        <td style={{ ...styles.td, textAlign: 'right', whiteSpace: 'nowrap' }}>
                                            <button
                                                style={styles.boutonIcone}
                                                onClick={() => navigate(`/employes/${emp.id_employe}/modifier`)}
                                            >
                                                <Pencil size={16} />
                                            </button>
                                            <button
                                                style={{ ...styles.boutonIcone, color: '#dc2626' }}
                                                onClick={() => supprimer(emp)}
                                            >
                                                <Trash2 size={16} />
                                            </button>
                                        </td>
                                    </tr>
                                );
                            })}
                            {filtres.length === 0 && (
                                <tr>
                                    <td colSpan={7} style={{ ...styles.td, textAlign: 'center', color: '#888' }}>
                                        Aucun employé trouvé.
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
    panneau: { backgroundColor: '#fff', borderRadius: '12px', padding: '1rem', boxShadow: '0 1px 3px rgba(15,37,87,0.08)', overflowX: 'auto' },
    rechercheZone: { display: 'flex', alignItems: 'center', gap: '0.5rem', border: '1px solid #e5e9f2', borderRadius: '8px', padding: '0.5rem 0.8rem', marginBottom: '1rem', maxWidth: '320px' },
    rechercheInput: { border: 'none', outline: 'none', flexGrow: 1, fontSize: '0.9rem' },
    table: { width: '100%', borderCollapse: 'collapse' },
    th: { textAlign: 'left', padding: '0.75rem', fontSize: '0.8rem', color: '#888', textTransform: 'uppercase', borderBottom: '1px solid #e5e9f2' },
    tr: { borderBottom: '1px solid #f0f2f8' },
    td: { padding: '0.75rem', fontSize: '0.9rem' },
    cellUtilisateur: { display: 'flex', alignItems: 'center', gap: '0.7rem' },
    avatar: { width: '36px', height: '36px', borderRadius: '50%', backgroundColor: '#2563eb', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 600 },
    badge: { padding: '0.2rem 0.6rem', borderRadius: '999px', fontSize: '0.75rem', fontWeight: 600 },
    boutonIcone: { background: 'none', border: 'none', cursor: 'pointer', padding: '0.4rem', color: '#555' },
    erreur: { backgroundColor: '#fee2e2', color: '#b91c1c', padding: '0.6rem 0.8rem', borderRadius: '8px', marginBottom: '1rem', fontSize: '0.85rem' },
};
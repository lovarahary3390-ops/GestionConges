import { useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';
import { nomType } from '../utils/conges';

export default function Parametres() {
    const { user } = useAuth();
    const [types, setTypes] = useState([]);
    const [soldes, setSoldes] = useState([]);
    const [erreur, setErreur] = useState('');

    useEffect(() => {
        api.get('/leave-types/')
            .then((res) => setTypes(res.data.results || res.data))
            .catch((err) => setErreur(`Types de congé indisponibles (${err.response?.status || err.message})`));
        api.get('/leave-balances/')
            .then((res) => {
                const liste = res.data.results || res.data;
                console.log('Soldes de congé :', liste);
                setSoldes(liste);
            })
            .catch(() => {});
    }, []);

    const profil = [
        ['Prénom', user?.first_name],
        ['Nom', user?.last_name],
        ['Nom d\'utilisateur', user?.username],
        ['Email', user?.email],
        ['Rôle', user?.role],
    ];

    const nomTypeSolde = (s) => {
        const t = s.type_conge ?? s.type ?? s.leave_type;
        if (t && typeof t === 'object') return nomType(t);
        const trouve = types.find((x) => x.id === t);
        return trouve ? nomType(trouve) : s.type_nom || (t ? `Type ${t}` : '-');
    };

    // Cherche la valeur restante sous plusieurs noms possibles
    const restant = (s) => s.jours_restants ?? s.solde ?? s.reste ?? s.remaining ?? s.jours_disponibles ?? '-';

    return (
        <div style={{ textAlign: 'left' }}>
            <h1 style={styles.titre}>Paramètres</h1>
            <p style={styles.sousTitre}>Votre profil et la configuration des congés</p>

            {erreur && <div style={styles.erreur}>{erreur}</div>}

            <div style={styles.grille}>
                <div style={styles.panneau}>
                    <h3 style={styles.panneauTitre}>Mon profil</h3>
                    {profil.map(([label, valeur]) => (
                        <div key={label} style={styles.ligne}>
                            <span style={styles.label}>{label}</span>
                            <span style={styles.valeur}>{valeur || '-'}</span>
                        </div>
                    ))}
                </div>

                <div style={styles.panneau}>
                    <h3 style={styles.panneauTitre}>Types de congé</h3>
                    {types.length === 0 && <p style={{ color: '#888' }}>Aucun type défini.</p>}
                    {types.map((t) => (
                        <div key={t.id} style={styles.ligne}>
                            <span style={styles.valeur}>{nomType(t)}</span>
                            <span style={styles.label}>
                                {t.jours_par_an ?? t.nombre_jours ?? t.max_jours ?? ''}
                            </span>
                        </div>
                    ))}
                </div>

                <div style={styles.panneau}>
                    <h3 style={styles.panneauTitre}>Soldes de congé</h3>
                    {soldes.length === 0 && <p style={{ color: '#888' }}>Aucun solde disponible.</p>}
                    {soldes.map((s) => (
                        <div key={s.id} style={styles.ligne}>
                            <span style={styles.valeur}>{nomTypeSolde(s)}</span>
                            <span style={styles.badge}>{restant(s)} jour(s)</span>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
}

const styles = {
    titre: { margin: 0, fontSize: '1.5rem', color: '#0f2557' },
    sousTitre: { margin: '0.3rem 0 1.5rem', color: '#666', fontSize: '0.9rem' },
    grille: { display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '1rem' },
    panneau: { backgroundColor: '#fff', borderRadius: '12px', padding: '1.2rem', boxShadow: '0 1px 3px rgba(15,37,87,0.08)' },
    panneauTitre: { margin: '0 0 1rem', fontSize: '1rem', color: '#0f2557' },
    ligne: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0.6rem 0', borderBottom: '1px solid #f0f2f8', fontSize: '0.9rem' },
    label: { color: '#888' },
    valeur: { fontWeight: 600, color: '#0f2557' },
    badge: { backgroundColor: '#e8f0fe', color: '#1d4ed8', padding: '0.2rem 0.7rem', borderRadius: '999px', fontSize: '0.8rem', fontWeight: 600 },
    erreur: { backgroundColor: '#fee2e2', color: '#b91c1c', padding: '0.6rem 0.8rem', borderRadius: '8px', marginBottom: '1rem', fontSize: '0.85rem' },
};
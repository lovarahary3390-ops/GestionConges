import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Send, ArrowLeft } from 'lucide-react';
import api from '../services/api';
import { messageApi } from '../utils/messageApi';

// Retrouve l'identifiant d'un objet, quel que soit son nom exact
function idDe(obj) {
    if (!obj || typeof obj !== 'object') return obj;
    if (obj.id !== undefined) return obj.id;
    const cle = Object.keys(obj).find(
        (k) => k.startsWith('id_') || k.endsWith('_id') || k === 'pk' || k === 'code'
    );
    return cle ? obj[cle] : undefined;
}

const nomType = (t) => t?.nom || t?.libelle || t?.name || t?.label || `Type ${idDe(t)}`;

function calculerJours(debut, fin) {
    if (!debut || !fin) return 0;
    const diff = (new Date(fin) - new Date(debut)) / (1000 * 60 * 60 * 24);
    return diff >= 0 ? Math.round(diff) + 1 : 0;
}

// Date du jour (heure locale) au format AAAA-MM-JJ
function dateDuJour() {
    const d = new Date();
    d.setMinutes(d.getMinutes() - d.getTimezoneOffset());
    return d.toISOString().slice(0, 10);
}

export default function NouvelleDemande() {
    const navigate = useNavigate();
    const [types, setTypes] = useState([]);
    const [form, setForm] = useState({
        type_conge: '',
        date_debut: '',
        date_fin: '',
        motif: '',
    });
    const [erreur, setErreur] = useState('');
    const [envoi, setEnvoi] = useState(false);

    useEffect(() => {
        api.get('/leave-types/')
            .then((res) => {
                const liste = res.data.results || res.data;
                setTypes(liste);
                if (liste.length > 0) {
                    const id = idDe(liste[0]);
                    if (id === undefined) {
                        setErreur('Les types de congé sont indisponibles pour le moment.');
                    } else {
                        setForm((f) => ({ ...f, type_conge: id }));
                    }
                }
            })
            .catch((err) => setErreur(messageApi(err, 'Impossible de charger les types de congé.')));
    }, []);

    const changer = (e) => setForm({ ...form, [e.target.name]: e.target.value });
    const nbJours = calculerJours(form.date_debut, form.date_fin);

    const soumettre = async (e) => {
        e.preventDefault();
        setErreur('');
        if (nbJours === 0) {
            setErreur('La date de fin doit être après la date de début.');
            return;
        }
        if (!form.type_conge) {
            setErreur('Le type de congé est obligatoire.');
            return;
        }
        if (form.date_debut.slice(0, 4) !== form.date_fin.slice(0, 4)) {
            setErreur('Une demande ne peut pas couvrir deux années. Faites deux demandes séparées.');
            return;
        }
        setEnvoi(true);
        try {
            await api.post('/leaves/', {
                ...form,
                nombre_jours: nbJours,
            });
            navigate('/demandes');
        } catch (err) {
            setErreur(messageApi(err, "Erreur lors de l'envoi de la demande."));
        } finally {
            setEnvoi(false);
        }
    };

    return (
        <div style={{ textAlign: 'left' }}>
            <button style={styles.retour} onClick={() => navigate('/demandes')}>
                <ArrowLeft size={16} /> Retour à mes demandes
            </button>
            <h1 style={styles.titre}>Nouvelle demande de congé</h1>

            <form style={styles.carte} onSubmit={soumettre}>
                {erreur && <div style={styles.erreur}>{erreur}</div>}

                <div style={styles.champ}>
                    <label style={styles.label}>Type de congé</label>
                    <select style={styles.input} name="type_conge" value={form.type_conge} onChange={changer} required>
                        {types.map((t) => (
                            <option key={idDe(t)} value={idDe(t)}>{nomType(t)}</option>
                        ))}
                    </select>
                </div>

                <div style={styles.ligne}>
                    <div style={styles.champ}>
                        <label style={styles.label}>Date de début</label>
                        <input style={styles.input} type="date" name="date_debut"
                            value={form.date_debut} min={dateDuJour()} onChange={changer} required />
                    </div>
                    <div style={styles.champ}>
                        <label style={styles.label}>Date de fin</label>
                        <input style={styles.input} type="date" name="date_fin"
                            value={form.date_fin} min={form.date_debut || dateDuJour()} onChange={changer} required />
                    </div>
                </div>

                {nbJours > 0 && (
                    <div style={styles.resume}>
                        Durée : <strong>{nbJours} jour{nbJours > 1 ? 's' : ''}</strong>
                    </div>
                )}

                <div style={styles.champ}>
                    <label style={styles.label}>Motif (facultatif)</label>
                    <textarea style={{ ...styles.input, minHeight: '90px', resize: 'vertical' }}
                        name="motif" value={form.motif} onChange={changer}
                        placeholder="Précisez le motif de votre demande..." />
                </div>

                <div style={styles.actions}>
                    <button type="button" style={styles.boutonSecondaire} onClick={() => navigate('/demandes')}>
                        Annuler
                    </button>
                    <button type="submit" style={styles.boutonPrimaire} disabled={envoi}>
                        <Send size={16} /> {envoi ? 'Envoi...' : 'Envoyer la demande'}
                    </button>
                </div>
            </form>
        </div>
    );
}

const styles = {
    retour: { display: 'flex', alignItems: 'center', gap: '0.4rem', background: 'none', border: 'none', color: '#2563eb', cursor: 'pointer', marginBottom: '1rem', fontSize: '0.9rem' },
    titre: { margin: '0 0 1.5rem', fontSize: '1.5rem', color: '#0f2557' },
    carte: { backgroundColor: '#fff', borderRadius: '12px', padding: '1.5rem', boxShadow: '0 1px 3px rgba(15,37,87,0.08)', maxWidth: '640px', display: 'flex', flexDirection: 'column', gap: '1rem' },
    ligne: { display: 'flex', gap: '1rem', flexWrap: 'wrap' },
    champ: { flex: 1, minWidth: '200px', display: 'flex', flexDirection: 'column', gap: '0.35rem' },
    label: { fontSize: '0.85rem', fontWeight: 600, color: '#0f2557' },
    input: { padding: '0.65rem 0.8rem', border: '1px solid #d5dbe8', borderRadius: '8px', fontSize: '0.9rem', outline: 'none', backgroundColor: '#fff' },
    resume: { backgroundColor: '#e8f0fe', color: '#1d4ed8', padding: '0.6rem 0.8rem', borderRadius: '8px', fontSize: '0.9rem' },
    actions: { display: 'flex', justifyContent: 'flex-end', gap: '0.7rem', marginTop: '0.5rem' },
    boutonPrimaire: { display: 'flex', alignItems: 'center', gap: '0.5rem', backgroundColor: '#2563eb', color: '#fff', border: 'none', padding: '0.65rem 1.3rem', borderRadius: '8px', cursor: 'pointer', fontWeight: 600 },
    boutonSecondaire: { backgroundColor: '#fff', color: '#444', border: '1px solid #d5dbe8', padding: '0.65rem 1.3rem', borderRadius: '8px', cursor: 'pointer' },
    erreur: { backgroundColor: '#fee2e2', color: '#b91c1c', padding: '0.6rem 0.8rem', borderRadius: '8px', fontSize: '0.85rem' },
};
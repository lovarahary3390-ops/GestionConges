import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import api from '../services/api';

const VIDE = {
    first_name: '', last_name: '', username: '', email: '',
    telephone: '', poste: '', role: 'EMPLOYE', service: '',
    password: '', is_active: true,
};

const REGEX_NOM = /^[A-Za-zÀ-ÖØ-öø-ÿ' -]+$/;
const idService = (s) => s.id ?? s.id_service ?? s.pk;
const nomService = (s) => s.nom || s.name || s.libelle || s.label || `Service ${idService(s)}`;

function validerNom(valeur, champ) {
    const v = (valeur || '').trim();
    if (!v) return `${champ} est obligatoire.`;
    if (!REGEX_NOM.test(v)) return `${champ === 'Le prénom' ? 'Le prénom' : 'Le nom'} ne doit pas contenir de chiffres.`;
    return '';
}

export default function EmployeeForm() {
    const { id } = useParams();
    const navigate = useNavigate();
    const modeEdition = Boolean(id);

    const [form, setForm] = useState(VIDE);
    const [services, setServices] = useState([]);
    const [erreurs, setErreurs] = useState({});
    const [erreurGenerale, setErreurGenerale] = useState('');
    const [envoi, setEnvoi] = useState(false);

    useEffect(() => {
        api.get('/services/')
            .then((res) => setServices(res.data.results || res.data))
            .catch(() => {});
    }, []);

    useEffect(() => {
        if (!modeEdition) return;
        api.get(`/employees/${id}/`)
            .then((res) => {
                const e = res.data;
                setForm({
                    ...VIDE,
                    first_name: e.first_name || '',
                    last_name: e.last_name || '',
                    username: e.username || '',
                    email: e.email || '',
                    telephone: e.telephone || '',
                    poste: e.poste || '',
                    role: e.role || 'EMPLOYE',
                    service: e.service ?? '',
                    is_active: e.is_active ?? true,
                });
            })
            .catch((err) =>
                setErreurGenerale(`Impossible de charger l'employé (${err.response?.status || err.message}).`)
            );
    }, [id, modeEdition]);

    const changer = (e) => {
        const { name, value, type, checked } = e.target;
        setForm({ ...form, [name]: type === 'checkbox' ? checked : value });
        if (erreurs[name]) setErreurs({ ...erreurs, [name]: '' });
    };

    const validerLocal = () => {
        const nouvellesErreurs = {
            first_name: validerNom(form.first_name, 'Le prénom'),
            last_name: validerNom(form.last_name, 'Le nom'),
        };
        setErreurs(nouvellesErreurs);
        return !nouvellesErreurs.first_name && !nouvellesErreurs.last_name;
    };

    // Transforme les erreurs renvoyées par Django en objet { champ: message }
    const appliquerErreursServeur = (detail) => {
        if (!detail || typeof detail !== 'object') {
            setErreurGenerale("Erreur lors de l'enregistrement.");
            return;
        }
        const nouvellesErreurs = {};
        let generale = '';

        Object.entries(detail).forEach(([champ, valeur]) => {
            const message = Array.isArray(valeur) ? valeur.join(' ') : String(valeur);
            if (champ === 'first_name' || champ === 'last_name') {
                nouvellesErreurs[champ] = message;
            } else if (champ === 'non_field_errors' || champ === 'detail') {
                generale = message;
            } else {
                generale = generale || message;
            }
        });

        setErreurs((e) => ({ ...e, ...nouvellesErreurs }));
        setErreurGenerale(generale);
    };

    const soumettre = async (e) => {
        e.preventDefault();
        setErreurGenerale('');
        if (!validerLocal()) return;

        setEnvoi(true);
        try {
            const donnees = {
                first_name: form.first_name.trim(),
                last_name: form.last_name.trim(),
                username: form.username,
                email: form.email,
                telephone: form.telephone,
                poste: form.poste,
                role: form.role,
            };
            if (form.service !== '') donnees.service = Number(form.service);

            if (modeEdition) {
                donnees.is_active = form.is_active;
                await api.patch(`/employees/${id}/`, donnees);
            } else {
                donnees.password = form.password;
                await api.post('/employees/', donnees);
            }
            navigate('/employes');
        } catch (err) {
            appliquerErreursServeur(err.response?.data);
        } finally {
            setEnvoi(false);
        }
    };

    return (
        <div style={{ textAlign: 'left' }}>
            <button style={styles.retour} onClick={() => navigate('/employes')}>
                <ArrowLeft size={16} /> Retour à la liste
            </button>

            <h1 style={styles.titre}>{modeEdition ? "Modifier l'employé" : 'Ajouter un employé'}</h1>

            <form style={styles.carte} onSubmit={soumettre}>
                {erreurGenerale && <div style={styles.erreurGenerale}>{erreurGenerale}</div>}

                <div style={styles.ligne}>
                    <Champ
                        label="Prénom" name="first_name" value={form.first_name}
                        onChange={changer} required erreur={erreurs.first_name}
                    />
                    <Champ
                        label="Nom" name="last_name" value={form.last_name}
                        onChange={changer} required erreur={erreurs.last_name}
                    />
                </div>

                <div style={styles.ligne}>
                    <Champ label="Nom d'utilisateur" name="username" value={form.username} onChange={changer} required />
                    <Champ label="Email" name="email" type="email" value={form.email} onChange={changer} required />
                </div>

                <div style={styles.ligne}>
                    <Champ label="Téléphone" name="telephone" value={form.telephone} onChange={changer} />
                    <Champ label="Poste" name="poste" value={form.poste} onChange={changer} />
                </div>

                <div style={styles.ligne}>
                    <div style={styles.champ}>
                        <label style={styles.label}>Rôle</label>
                        <select style={styles.input} name="role" value={form.role} onChange={changer}>
                            <option value="EMPLOYE">Employé</option>
                            <option value="RESPONSABLE">Responsable</option>
                            <option value="ADMIN">Administrateur</option>
                        </select>
                    </div>
                    <div style={styles.champ}>
                        <label style={styles.label}>Service</label>
                        <select style={styles.input} name="service" value={form.service} onChange={changer}>
                            <option value="">— Aucun —</option>
                            {services.map((s) => (
                                <option key={idService(s)} value={idService(s)}>{nomService(s)}</option>
                            ))}
                        </select>
                    </div>
                </div>

                <div style={styles.ligne}>
                    <div style={styles.champ}>
                        <label style={styles.label}>Date d'embauche</label>
                        <input
                            style={{ ...styles.input, backgroundColor: '#f4f6fb', color: '#666' }}
                            value={new Date().toLocaleDateString('fr-FR')}
                            disabled
                        />
                    </div>
                </div>

                {!modeEdition && (
                    <div style={styles.ligne}>
                        <Champ label="Mot de passe" name="password" type="password"
                            value={form.password} onChange={changer} required />
                    </div>
                )}

                {modeEdition && (
                    <label style={styles.caseACocher}>
                        <input type="checkbox" name="is_active" checked={form.is_active} onChange={changer} />
                        Compte actif
                    </label>
                )}

                <div style={styles.actions}>
                    <button type="button" style={styles.boutonSecondaire} onClick={() => navigate('/employes')}>
                        Annuler
                    </button>
                    <button type="submit" style={styles.boutonPrimaire} disabled={envoi}>
                        {envoi ? 'Enregistrement...' : 'Enregistrer'}
                    </button>
                </div>
            </form>
        </div>
    );
}

function Champ({ label, erreur, ...props }) {
    return (
        <div style={styles.champ}>
            <label style={styles.label}>{label}</label>
            <input style={{ ...styles.input, ...(erreur ? styles.inputErreur : {}) }} {...props} />
            {erreur && <span style={styles.messageErreur}>{erreur}</span>}
        </div>
    );
}

const styles = {
    retour: { display: 'flex', alignItems: 'center', gap: '0.4rem', background: 'none', border: 'none', color: '#2563eb', cursor: 'pointer', marginBottom: '1rem', fontSize: '0.9rem' },
    titre: { margin: '0 0 1.5rem', fontSize: '1.5rem', color: '#0f2557' },
    carte: { backgroundColor: '#fff', borderRadius: '12px', padding: '1.5rem', boxShadow: '0 1px 3px rgba(15,37,87,0.08)', maxWidth: '720px' },
    ligne: { display: 'flex', gap: '1rem', flexWrap: 'wrap', marginBottom: '1rem' },
    champ: { flex: 1, minWidth: '220px', display: 'flex', flexDirection: 'column', gap: '0.35rem' },
    label: { fontSize: '0.85rem', fontWeight: 600, color: '#0f2557' },
    input: { padding: '0.65rem 0.8rem', border: '1px solid #d5dbe8', borderRadius: '8px', fontSize: '0.9rem', outline: 'none', backgroundColor: '#fff' },
    inputErreur: { borderColor: '#dc2626' },
    messageErreur: { color: '#dc2626', fontSize: '0.8rem' },
    caseACocher: { display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.9rem', marginBottom: '1rem' },
    actions: { display: 'flex', justifyContent: 'flex-end', gap: '0.7rem', marginTop: '1.5rem' },
    boutonPrimaire: { backgroundColor: '#2563eb', color: '#fff', border: 'none', padding: '0.65rem 1.3rem', borderRadius: '8px', cursor: 'pointer', fontWeight: 600 },
    boutonSecondaire: { backgroundColor: '#fff', color: '#444', border: '1px solid #d5dbe8', padding: '0.65rem 1.3rem', borderRadius: '8px', cursor: 'pointer' },
    erreurGenerale: { backgroundColor: '#fee2e2', color: '#b91c1c', padding: '0.6rem 0.8rem', borderRadius: '8px', marginBottom: '1rem', fontSize: '0.85rem' },
};
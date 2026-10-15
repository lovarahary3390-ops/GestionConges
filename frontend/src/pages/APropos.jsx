import { useState } from 'react';
import { Info, Layers, Database, ZoomIn } from 'lucide-react';

// Image du MPD, placée dans frontend/public/
// (si votre fichier est en .jpg, changez l'extension ici)
const MPD_IMAGE = '/mpd.png';

const FONCTIONNALITES = [
    'Authentification sécurisée par jeton JWT, avec trois rôles : Employé, Responsable, Administrateur',
    'Demande de congé avec calcul de la durée et vérification du solde',
    'Validation ou refus par le responsable, avec motif obligatoire en cas de refus',
    'Mise à jour automatique du solde et historique des validations',
    'Tableau de bord avec statistiques et graphiques',
    'Calendrier des congés et gestion des employés (administrateur)',
];

const TECHNOLOGIES = [
    { nom: 'React + Vite', role: "Interface utilisateur (frontend)" },
    { nom: 'Django + Django REST Framework', role: 'API et logique métier (backend)' },
    { nom: 'MySQL / MariaDB', role: 'Base de données' },
    { nom: 'JWT (SimpleJWT)', role: 'Authentification' },
];

export default function APropos() {
    const [imageManquante, setImageManquante] = useState(false);

    return (
        <div>
            <h1 style={styles.titre}>À propos</h1>
            <p style={styles.sousTitre}>Présentation du projet et de son modèle de données.</p>

            <section style={styles.carte}>
                <h2 style={styles.titreSection}><Info size={18} /> Le projet</h2>
                <p style={styles.texte}>
                    <strong>Gestion des congés</strong> est une application web qui permet aux employés
                    de soumettre leurs demandes de congé et aux responsables de les valider ou de les
                    refuser de manière rapide, fiable et traçable.
                </p>
                <ul style={styles.liste}>
                    {FONCTIONNALITES.map((f) => (
                        <li key={f} style={styles.element}>{f}</li>
                    ))}
                </ul>
            </section>

            <section style={styles.carte}>
                <h2 style={styles.titreSection}><Layers size={18} /> Technologies utilisées</h2>
                <div style={styles.grilleTech}>
                    {TECHNOLOGIES.map((t) => (
                        <div key={t.nom} style={styles.tech}>
                            <div style={styles.techNom}>{t.nom}</div>
                            <div style={styles.techRole}>{t.role}</div>
                        </div>
                    ))}
                </div>
            </section>

            <section style={styles.carte}>
                <h2 style={styles.titreSection}><Database size={18} /> Modèle physique de données (MPD)</h2>
                <p style={styles.texte}>Structure des tables de la base de données du projet.</p>

                {imageManquante ? (
                    <div style={styles.manquante}>
                        Image introuvable. Placez le fichier <code>mpd.png</code> dans le dossier{' '}
                        <code>frontend/public</code>, puis rechargez la page.
                    </div>
                ) : (
                    <>
                        <a href={MPD_IMAGE} target="_blank" rel="noreferrer" style={styles.lienImage}>
                            <img
                                src={MPD_IMAGE}
                                alt="Modèle physique de données du projet"
                                style={styles.image}
                                onError={() => setImageManquante(true)}
                            />
                        </a>
                        <p style={styles.astuce}>
                            <ZoomIn size={14} /> Cliquez sur l'image pour l'ouvrir en grand dans un nouvel onglet.
                        </p>
                    </>
                )}
            </section>
        </div>
    );
}

const NAVY = '#0f2557';

const styles = {
    titre: { margin: '0 0 0.3rem', fontSize: '1.5rem', color: NAVY },
    sousTitre: { margin: '0 0 1.5rem', color: '#6b7a99', fontSize: '0.95rem' },
    carte: {
        backgroundColor: '#fff',
        borderRadius: '12px',
        padding: '1.4rem 1.6rem',
        boxShadow: '0 1px 6px rgba(15,37,87,0.06)',
        marginBottom: '1.2rem',
    },
    titreSection: {
        display: 'flex',
        alignItems: 'center',
        gap: '0.5rem',
        margin: '0 0 0.8rem',
        fontSize: '1.05rem',
        color: NAVY,
    },
    texte: { margin: '0 0 0.8rem', color: '#4b5f86', lineHeight: 1.6, fontSize: '0.92rem' },
    liste: { margin: 0, paddingLeft: '1.2rem' },
    element: { color: '#4b5f86', fontSize: '0.9rem', lineHeight: 1.7 },
    grilleTech: {
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(210px, 1fr))',
        gap: '0.9rem',
    },
    tech: { border: '1px solid #e5e9f2', borderRadius: '10px', padding: '0.9rem 1rem' },
    techNom: { fontWeight: 700, color: NAVY, fontSize: '0.92rem' },
    techRole: { color: '#6b7a99', fontSize: '0.82rem', marginTop: '0.2rem' },
    lienImage: {
        display: 'block',
        overflow: 'auto',
        border: '1px solid #e5e9f2',
        borderRadius: '10px',
        padding: '0.6rem',
        backgroundColor: '#f7f9fc',
    },
    image: { display: 'block', maxWidth: '100%', height: 'auto', margin: '0 auto' },
    astuce: {
        display: 'flex',
        alignItems: 'center',
        gap: '0.4rem',
        margin: '0.7rem 0 0',
        color: '#6b7a99',
        fontSize: '0.82rem',
    },
    manquante: {
        backgroundColor: '#fff7ed',
        border: '1px solid #fed7aa',
        color: '#9a3412',
        borderRadius: '8px',
        padding: '0.9rem 1rem',
        fontSize: '0.88rem',
    },
};
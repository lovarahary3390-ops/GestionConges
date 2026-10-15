export function normaliserStatut(s) {
    const v = String(s || '').toUpperCase().replace(/[ÉÈ]/g, 'E');
    if (v.includes('ATTENTE') || v.includes('PENDING') || v.includes('SOUMIS')) return 'EN_ATTENTE';
    if (v.includes('APPROUV') || v.includes('APPROVED') || v.includes('VALID')) return 'APPROUVEE';
    if (v.includes('REFUS') || v.includes('REJECT')) return 'REFUSEE';
    return v;
}

export const STATUTS = {
    EN_ATTENTE: { texte: 'En attente', fond: '#fef3c7', couleur: '#b45309' },
    APPROUVEE: { texte: 'Approuvée', fond: '#dcfce7', couleur: '#15803d' },
    REFUSEE: { texte: 'Refusée', fond: '#fee2e2', couleur: '#b91c1c' },
};

export const formaterDate = (d) => (d ? new Date(d).toLocaleDateString('fr-FR') : '-');

// Retrouve l'identifiant d'un objet : id, id_employe, id_demande, id_type...
export function idDe(obj) {
    if (obj === null || obj === undefined || typeof obj !== 'object') return obj;
    if (obj.id !== undefined) return obj.id;
    const cle = Object.keys(obj).find((k) => k.startsWith('id_'));
    return cle ? obj[cle] : undefined;
}

export const nomType = (t) =>
    t?.nom || t?.libelle || t?.name || t?.label || (idDe(t) !== undefined ? `Type ${idDe(t)}` : '');

export const nomComplet = (e) =>
    `${e?.first_name || ''} ${e?.last_name || ''}`.trim() || e?.username || e?.nom || '';

// Nombre de jours (dates incluses)
export function nombreJours(debut, fin) {
    if (!debut || !fin) return 0;
    const diff = (new Date(fin) - new Date(debut)) / 86400000;
    return diff >= 0 ? Math.round(diff) + 1 : 0;
}

// Format AAAA-MM-JJ en heure locale
export const versIso = (date) => {
    const m = String(date.getMonth() + 1).padStart(2, '0');
    const j = String(date.getDate()).padStart(2, '0');
    return `${date.getFullYear()}-${m}-${j}`;
};

export function libelleType(demande, types = []) {
    const t = demande.type_conge ?? demande.type ?? demande.leave_type;
    if (t && typeof t === 'object') return nomType(t);
    const direct = demande.type_conge_nom || demande.type_nom || demande.type_libelle;
    if (direct) return direct;
    const trouve = types.find((x) => idDe(x) === t);
    return trouve ? nomType(trouve) : t ? `Type ${t}` : '-';
}

export function libelleEmploye(demande, employes = []) {
    const e = demande.employe ?? demande.employee ?? demande.user ?? demande.demandeur;
    if (e && typeof e === 'object') return nomComplet(e) || `Employé #${idDe(e)}`;
    const direct = demande.employe_nom || demande.employee_name || demande.demandeur_nom || demande.nom_employe;
    if (direct) return direct;
    const trouve = employes.find((x) => idDe(x) === e);
    if (trouve) return nomComplet(trouve) || `Employé #${e}`;
    return e ? `Employé #${e}` : '-';
}
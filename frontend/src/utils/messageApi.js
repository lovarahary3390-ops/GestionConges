// Transforme une erreur Axios en message lisible pour l'utilisateur
export function messageApi(err, defaut = "Une erreur est survenue. Veuillez réessayer.") {
    if (!err.response) return 'Serveur injoignable. Vérifiez votre connexion.';
    if (err.response.status >= 500) return 'Erreur du serveur. Veuillez réessayer plus tard.';

    const data = err.response.data;
    if (!data || typeof data !== 'object') return defaut;
    if (data.detail) return String(data.detail);

    // Erreurs de validation : { champ: ["message"], non_field_errors: ["message"] }
    const messages = Object.values(data).flat().filter((m) => typeof m === 'string');
    return messages.length ? messages.join(' ') : defaut;
}
// Fonction pour récupérer le numéro de la semaine de l'année (norme ISO-8601)
export function getWeekNumber() {
    const d = new Date();
    // Définit au jeudi le plus proche : jour actuel + 4 - jour actuel de la semaine
    d.setHours(0, 0, 0, 0);
    d.setDate(d.getDate() + 4 - (d.getDay() || 7));
    const yearStart = new Date(d.getFullYear(), 0, 1);
    // Calcule le nombre de jours complets écoulés
    const weekNo = Math.ceil((((d - yearStart) / 86400000) + 1) / 7);
    return weekNo;
}

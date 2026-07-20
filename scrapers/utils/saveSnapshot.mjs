import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

/** Date du jour au format YYYY-MM-DD */
export function getDateToday() {
    const d = new Date();
    const yyyy = d.getFullYear();
    const mm = String(d.getMonth() + 1).padStart(2, '0');
    const dd = String(d.getDate()).padStart(2, '0');
    return `${yyyy}-${mm}-${dd}`;
}

const DATA_DIR = path.resolve(__dirname, '../../frontend/src/data');
const ACTIVE_DATE_PATH = path.join(DATA_DIR, 'active-date.json');

/**
 * Met à jour frontend/src/data/active-date.json (utilisé par le frontend).
 * @param {string} date - Date YYYY-MM-DD
 */
export function setActiveDate(date) {
    fs.writeFileSync(
        ACTIVE_DATE_PATH,
        JSON.stringify({ dateDuJour: date }, null, 2) + '\n',
        'utf-8'
    );
    console.log(`Date active : ${date}`);
}

/**
 * Sauvegarde des données JSON dans frontend/src/data/snapshots/${dateToday}/
 * et pointe active-date.json vers cette date.
 * @param {string} filename - Nom du fichier (ex: "apple-movies.json")
 * @param {unknown} data - Données à sérialiser
 * @returns {string} Chemin absolu du fichier écrit
 */
export function saveSnapshot(filename, data) {
    const dateToday = getDateToday();
    const dir = path.join(DATA_DIR, 'snapshots', dateToday);

    fs.mkdirSync(dir, { recursive: true });

    const filepath = path.join(dir, filename);
    fs.writeFileSync(filepath, JSON.stringify(data, null, 2), 'utf-8');
    setActiveDate(dateToday);
    console.log(`Fichier sauvegardé avec succès : ${filepath}`);

    return filepath;
}

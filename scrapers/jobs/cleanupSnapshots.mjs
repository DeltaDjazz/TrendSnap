import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { getDateToday } from '../utils/saveSnapshot.mjs';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const SNAPSHOTS_DIR = path.resolve(__dirname, '../../frontend/src/data/snapshots');
const ACTIVE_DATE_PATH = path.resolve(__dirname, '../../frontend/src/data/active-date.json');

const DATE_FOLDER_PATTERN = /^\d{4}-\d{2}-\d{2}$/;
const RETENTION_DAYS = 7;
const ARCHIVE_DAY_OF_MONTH = 20;

function readActiveDate() {
    try {
        const raw = fs.readFileSync(ACTIVE_DATE_PATH, 'utf-8');
        return JSON.parse(raw).dateDuJour ?? null;
    } catch {
        return null;
    }
}

function daysOld(folderDate, today) {
    const folder = new Date(`${folderDate}T00:00:00`);
    const ref = new Date(`${today}T00:00:00`);
    return Math.floor((ref - folder) / (24 * 60 * 60 * 1000));
}

function shouldDelete(folderDate, today, activeDate) {
    if (folderDate === today) return false;
    if (folderDate === activeDate) return false;

    const dayOfMonth = Number(folderDate.slice(8, 10));
    if (dayOfMonth === ARCHIVE_DAY_OF_MONTH) return false;

    return daysOld(folderDate, today) > RETENTION_DAYS;
}

function listSnapshotFolders() {
    if (!fs.existsSync(SNAPSHOTS_DIR)) {
        return [];
    }

    return fs
        .readdirSync(SNAPSHOTS_DIR, { withFileTypes: true })
        .filter((entry) => entry.isDirectory() && DATE_FOLDER_PATTERN.test(entry.name))
        .map((entry) => entry.name);
}

function run() {
    const today = getDateToday();
    const activeDate = readActiveDate();
    const folders = listSnapshotFolders();

    console.log(
        `Nettoyage snapshots — date du jour : ${today}, rétention : ${RETENTION_DAYS} jours, archives du ${ARCHIVE_DAY_OF_MONTH} conservées`
    );

    if (activeDate) {
        console.log(`Date active protégée : ${activeDate}`);
    }

    const toDelete = folders.filter((folderDate) => shouldDelete(folderDate, today, activeDate));
    const kept = folders.filter((folderDate) => !shouldDelete(folderDate, today, activeDate));

    if (toDelete.length === 0) {
        console.log('Aucun dossier snapshot à supprimer.');
    } else {
        for (const folderDate of toDelete) {
            const folderPath = path.join(SNAPSHOTS_DIR, folderDate);
            fs.rmSync(folderPath, { recursive: true, force: true });
            console.log(`Supprimé : ${folderDate} (${daysOld(folderDate, today)} jours)`);
        }
    }

    if (kept.length > 0) {
        console.log(`Conservés (${kept.length}) : ${kept.join(', ')}`);
    }

    console.log(`Nettoyage terminé — ${toDelete.length} dossier(s) supprimé(s).`);
}

try {
    run();
} catch (error) {
    console.error('Erreur lors du nettoyage des snapshots :', error);
    process.exitCode = 1;
}

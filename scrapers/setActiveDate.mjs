/**
 * Rollback / bascule manuelle de la date affichée par le frontend.
 * Usage: node scrapers/setActiveDate.mjs 2026-07-19
 */
import { setActiveDate } from './utils/saveSnapshot.mjs';

const date = process.argv[2];

if (!date || !/^\d{4}-\d{2}-\d{2}$/.test(date)) {
    console.error('Usage: node scrapers/setActiveDate.mjs YYYY-MM-DD');
    process.exit(1);
}

setActiveDate(date);

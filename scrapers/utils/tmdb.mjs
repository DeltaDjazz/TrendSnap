import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT_DIR = path.resolve(__dirname, '../..');

export const TMDB_BASE = 'https://api.themoviedb.org/3';
export const IMAGE_BASE = 'https://image.tmdb.org/t/p/w500';
export const LANGUAGE = 'fr-FR';
export const REGION = 'FR';

/** Charge un fichier .env à la racine du projet (sans dépendance externe). */
export function loadEnvFile() {
    const envPath = path.join(ROOT_DIR, '.env');
    if (!fs.existsSync(envPath)) return;

    const lines = fs.readFileSync(envPath, 'utf-8').split(/\r?\n/);
    for (const line of lines) {
        const trimmed = line.trim();
        if (!trimmed || trimmed.startsWith('#')) continue;

        const eq = trimmed.indexOf('=');
        if (eq === -1) continue;

        const key = trimmed.slice(0, eq).trim();
        let value = trimmed.slice(eq + 1).trim();
        if (
            (value.startsWith('"') && value.endsWith('"')) ||
            (value.startsWith("'") && value.endsWith("'"))
        ) {
            value = value.slice(1, -1);
        }

        if (process.env[key] === undefined) {
            process.env[key] = value;
        }
    }
}

export function getAuth() {
    const accessToken = process.env.TMDB_ACCESS_TOKEN;
    const apiKey = process.env.TMDB_API_KEY;

    if (!accessToken && !apiKey) {
        throw new Error(
            'Variable manquante : définissez TMDB_ACCESS_TOKEN (jeton lecture) ou TMDB_API_KEY dans .env'
        );
    }

    return { accessToken, apiKey };
}

export async function tmdbFetch(pathname, auth, params = {}) {
    const url = new URL(`${TMDB_BASE}${pathname}`);
    for (const [key, value] of Object.entries(params)) {
        if (value != null && value !== '') url.searchParams.set(key, String(value));
    }
    if (auth.apiKey && !auth.accessToken) {
        url.searchParams.set('api_key', auth.apiKey);
    }

    const headers = { accept: 'application/json' };
    if (auth.accessToken) {
        headers.Authorization = `Bearer ${auth.accessToken}`;
    }

    const response = await fetch(url, { headers });
    if (!response.ok) {
        const body = await response.text();
        throw new Error(`TMDB ${pathname} → ${response.status}: ${body.slice(0, 300)}`);
    }

    return response.json();
}

export function posterUrl(posterPath) {
    if (!posterPath) return '';
    return `${IMAGE_BASE}${posterPath}`;
}

export function pickTrailerUrl(videos) {
    const results = videos?.results ?? [];
    const youtube = results.filter((v) => v.site === 'YouTube');
    const trailer =
        youtube.find((v) => v.type === 'Trailer' && v.official) ||
        youtube.find((v) => v.type === 'Trailer') ||
        youtube.find((v) => v.type === 'Teaser') ||
        youtube[0];

    return trailer?.key ? `https://www.youtube.com/watch?v=${trailer.key}` : '';
}

export function normalize(value) {
    return (value || '')
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, ' ')
        .trim();
}

export function isoDaysAgo(days) {
    const d = new Date();
    d.setUTCDate(d.getUTCDate() - days);
    const yyyy = d.getUTCFullYear();
    const mm = String(d.getUTCMonth() + 1).padStart(2, '0');
    const dd = String(d.getUTCDate()).padStart(2, '0');
    return `${yyyy}-${mm}-${dd}`;
}

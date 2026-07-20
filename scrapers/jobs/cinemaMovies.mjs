import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { saveSnapshot } from '../utils/saveSnapshot.mjs';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT_DIR = path.resolve(__dirname, '../..');

const TMDB_BASE = 'https://api.themoviedb.org/3';
const IMAGE_BASE = 'https://image.tmdb.org/t/p/w500';
const LANGUAGE = 'fr-FR';
const REGION = 'FR';
const TOP_N = 10;

/** Charge un fichier .env à la racine du projet (sans dépendance externe). */
function loadEnvFile() {
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

function getAuth() {
    const accessToken =
        process.env.TMDB_ACCESS_TOKEN ||
        process.env.TMDB_READ_ACCESS_TOKEN ||
        process.env.TMDB_BEARER_TOKEN;
    const apiKey = process.env.TMDB_API_KEY;

    if (!accessToken && !apiKey) {
        throw new Error(
            'Variable manquante : définissez TMDB_ACCESS_TOKEN (jeton lecture) ou TMDB_API_KEY dans .env'
        );
    }

    return { accessToken, apiKey };
}

async function tmdbFetch(pathname, auth, params = {}) {
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

function posterUrl(posterPath) {
    if (!posterPath) return '';
    return `${IMAGE_BASE}${posterPath}`;
}

function pickTrailerUrl(videos) {
    const results = videos?.results ?? [];
    const youtube = results.filter((v) => v.site === 'YouTube');
    const trailer =
        youtube.find((v) => v.type === 'Trailer' && v.official) ||
        youtube.find((v) => v.type === 'Trailer') ||
        youtube.find((v) => v.type === 'Teaser') ||
        youtube[0];

    return trailer?.key ? `https://www.youtube.com/watch?v=${trailer.key}` : '';
}

async function enrichMovie(listItem, rank, auth) {
    const details = await tmdbFetch(`/movie/${listItem.id}`, auth, {
        language: LANGUAGE,
        append_to_response: 'credits,videos',
    });

    const stars = (details.credits?.cast ?? [])
        .slice(0, 5)
        .map((person) => person.name)
        .filter(Boolean);

    const genres = (details.genres ?? []).map((g) => g.name).filter(Boolean);
    const originCountry =
        details.production_countries?.[0]?.name ||
        details.origin_country?.[0] ||
        '';

    const releaseDate = details.release_date || listItem.release_date || '';
    const year = releaseDate ? releaseDate.slice(0, 4) : '';
    const image = posterUrl(details.poster_path || listItem.poster_path);

    return {
        id: rank,
        poster: image,
        title: details.title || listItem.title || '',
        description: details.overview || listItem.overview || '',
        stars,
        imgVertical: image,
        pageInfosUrl: `https://www.themoviedb.org/movie/${listItem.id}`,
        year,
        genres,
        originCountry,
        trailerUrl: pickTrailerUrl(details.videos),
    };
}

async function fetchTop10(listPath, auth, label) {
    console.log(`Récupération TMDB ${label} (${listPath})...`);
    const data = await tmdbFetch(listPath, auth, {
        language: LANGUAGE,
        region: REGION,
        page: 1,
    });

    const top = (data.results ?? []).slice(0, TOP_N);
    if (top.length === 0) {
        console.warn(`Aucun résultat pour ${label}.`);
        return [];
    }

    const movies = [];
    for (let i = 0; i < top.length; i++) {
        const item = top[i];
        console.log(`[${i + 1}/${top.length}] Enrichissement : ${item.title}...`);
        try {
            movies.push(await enrichMovie(item, i + 1, auth));
        } catch (err) {
            console.error(`Échec enrichissement "${item.title}":`, err.message);
            movies.push({
                id: i + 1,
                poster: posterUrl(item.poster_path),
                title: item.title || '',
                description: item.overview || '',
                stars: [],
                imgVertical: posterUrl(item.poster_path),
                pageInfosUrl: `https://www.themoviedb.org/movie/${item.id}`,
                year: item.release_date ? item.release_date.slice(0, 4) : '',
                genres: [],
                originCountry: '',
                trailerUrl: '',
            });
        }
    }

    return movies;
}

async function run() {
    loadEnvFile();
    const auth = getAuth();

    try {
        const nowPlaying = await fetchTop10(
            '/movie/now_playing',
            auth,
            'films en salles'
        );
        saveSnapshot('cinema-movies.json', nowPlaying);

        const upcoming = await fetchTop10(
            '/movie/upcoming',
            auth,
            'films à venir'
        );
        saveSnapshot('cinema-upcoming.json', upcoming);

        console.log('Job cinéma TMDB terminé.');
    } catch (error) {
        console.error('Erreur job cinéma TMDB :', error.message);
        process.exitCode = 1;
    }
}

run();

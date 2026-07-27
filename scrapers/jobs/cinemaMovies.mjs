import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { getDateToday, saveSnapshot } from '../utils/saveSnapshot.mjs';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT_DIR = path.resolve(__dirname, '../..');

const TMDB_BASE = 'https://api.themoviedb.org/3';
const IMAGE_BASE = 'https://image.tmdb.org/t/p/w500';
const LANGUAGE = 'fr-FR';
const REGION = 'FR';
const TOP_N = 10;
const NOW_PLAYING_MAX_MONTHS = 4;
const NOW_PLAYING_MAX_PAGES = 5;
/** Priorité des types de sortie TMDB : 3 = salles, 2 = salles limitées, 1 = avant-première */
const RELEASE_TYPE_PRIORITY = [3, 2, 1];

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
    const accessToken = process.env.TMDB_ACCESS_TOKEN;
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

function toIsoDate(date) {
    const yyyy = date.getFullYear();
    const mm = String(date.getMonth() + 1).padStart(2, '0');
    const dd = String(date.getDate()).padStart(2, '0');
    return `${yyyy}-${mm}-${dd}`;
}

function getMinReleaseDate(todayIso) {
    const date = new Date(`${todayIso}T00:00:00`);
    date.setMonth(date.getMonth() - NOW_PLAYING_MAX_MONTHS);
    return toIsoDate(date);
}

/** Films en salles : entre aujourd'hui − 4 mois et aujourd'hui (inclus). */
function isReleaseDateInNowPlayingWindow(releaseDate, todayIso) {
    if (!releaseDate || !/^\d{4}-\d{2}-\d{2}/.test(releaseDate)) return false;

    const iso = releaseDate.slice(0, 10);
    const minDate = getMinReleaseDate(todayIso);
    return iso <= todayIso && iso >= minDate;
}

/** Films à venir : date de sortie >= aujourd'hui. */
function isUpcomingReleaseDate(releaseDate, todayIso) {
    if (!releaseDate || !/^\d{4}-\d{2}-\d{2}/.test(releaseDate)) return false;
    return releaseDate.slice(0, 10) >= todayIso;
}

/** Convertit une date ISO YYYY-MM-DD en dd/mm/yyyy. */
function formatDateFr(isoDate) {
    if (!isoDate || !/^\d{4}-\d{2}-\d{2}/.test(isoDate)) return '';
    const [yyyy, mm, dd] = isoDate.slice(0, 10).split('-');
    return `${dd}/${mm}/${yyyy}`;
}

/**
 * Date de sortie en salles pour la région cible (ex. FR).
 * `release_date` seul sur /movie/{id} est souvent la sortie US, pas la date française.
 */
function pickRegionalReleaseDate(releaseDatesPayload, regionCode = REGION) {
    const country = releaseDatesPayload?.results?.find(
        (entry) => entry.iso_3166_1 === regionCode
    );
    if (!country?.release_dates?.length) return '';

    for (const type of RELEASE_TYPE_PRIORITY) {
        const match = country.release_dates.find((entry) => entry.type === type);
        if (match?.release_date) {
            return match.release_date.slice(0, 10);
        }
    }

    const dates = country.release_dates
        .map((entry) => entry.release_date?.slice(0, 10))
        .filter(Boolean)
        .sort();

    return dates[0] || '';
}

function resolveReleaseDate(details, listItem) {
    return (
        pickRegionalReleaseDate(details.release_dates) ||
        listItem.release_date ||
        details.release_date ||
        ''
    );
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

async function enrichMovie(listItem, rank, auth, { withDateDeSortie = false } = {}) {
    const details = await tmdbFetch(`/movie/${listItem.id}`, auth, {
        language: LANGUAGE,
        append_to_response: 'credits,videos,release_dates',
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

    const releaseDate = resolveReleaseDate(details, listItem);
    const image = posterUrl(details.poster_path || listItem.poster_path);

    const movie = {
        id: rank,
        poster: image,
        title: details.title || listItem.title || '',
        description: details.overview || listItem.overview || '',
        stars,
        imgVertical: image,
        pageInfosUrl: `https://www.themoviedb.org/movie/${listItem.id}`,
        genres,
        originCountry,
        trailerUrl: pickTrailerUrl(details.videos),
    };

    if (withDateDeSortie) {
        movie.dateDeSortie = formatDateFr(releaseDate);
    } else {
        movie.year = releaseDate ? releaseDate.slice(0, 4) : '';
    }

    return movie;
}

function fallbackMovie(item, rank, { withDateDeSortie = false } = {}) {
    const movie = {
        id: rank,
        poster: posterUrl(item.poster_path),
        title: item.title || '',
        description: item.overview || '',
        stars: [],
        imgVertical: posterUrl(item.poster_path),
        pageInfosUrl: `https://www.themoviedb.org/movie/${item.id}`,
        genres: [],
        originCountry: '',
        trailerUrl: '',
    };

    if (withDateDeSortie) {
        movie.dateDeSortie = formatDateFr(item.release_date || '');
    } else {
        movie.year = item.release_date ? item.release_date.slice(0, 4) : '';
    }

    return movie;
}

async function fetchTop10(listPath, auth, label, options = {}) {
    const { filterNowPlayingWindow = false, filterUpcomingOnly = false } = options;
    const today = getDateToday();
    const minDate = filterNowPlayingWindow ? getMinReleaseDate(today) : null;

    console.log(`Récupération TMDB ${label} (${listPath})...`);
    if (filterNowPlayingWindow) {
        console.log(
            `Filtre date de sortie : ${minDate} → ${today} (max ${NOW_PLAYING_MAX_MONTHS} mois)`
        );
    } else if (filterUpcomingOnly) {
        console.log(`Filtre date de sortie : à partir du ${today}`);
    }

    const top = [];
    let page = 1;

    while (top.length < TOP_N && page <= NOW_PLAYING_MAX_PAGES) {
        const data = await tmdbFetch(listPath, auth, {
            language: LANGUAGE,
            region: REGION,
            page,
        });

        const results = data.results ?? [];
        if (results.length === 0) break;

        for (const item of results) {
            const releaseDate = item.release_date || '';

            if (
                filterNowPlayingWindow &&
                !isReleaseDateInNowPlayingWindow(releaseDate, today)
            ) {
                continue;
            }

            if (filterUpcomingOnly && !isUpcomingReleaseDate(releaseDate, today)) {
                continue;
            }

            top.push(item);
            if (top.length >= TOP_N) break;
        }

        if (page >= (data.total_pages ?? 1)) break;
        page++;
    }

    if (top.length === 0) {
        console.warn(`Aucun résultat pour ${label}.`);
        return [];
    }

    if (top.length < TOP_N) {
        console.warn(`Seulement ${top.length} film(s) après filtre date pour ${label}.`);
    }

    const movies = [];
    for (let i = 0; i < top.length; i++) {
        const item = top[i];
        console.log(`[${i + 1}/${top.length}] Enrichissement : ${item.title}...`);
        try {
            movies.push(await enrichMovie(item, i + 1, auth, options));
        } catch (err) {
            console.error(`Échec enrichissement "${item.title}":`, err.message);
            movies.push(fallbackMovie(item, i + 1, options));
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
            'films en salles',
            { withDateDeSortie: true, filterNowPlayingWindow: true }
        );
        saveSnapshot('cinema-movies.json', nowPlaying);

        const upcoming = await fetchTop10(
            '/movie/upcoming',
            auth,
            'films à venir',
            { withDateDeSortie: true, filterUpcomingOnly: true }
        );
        saveSnapshot('cinema-upcoming.json', upcoming);

        console.log('Job cinéma TMDB terminé.');
    } catch (error) {
        console.error('Erreur job cinéma TMDB :', error.message);
        process.exitCode = 1;
    }
}

run();

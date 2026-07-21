import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import puppeteer from 'puppeteer';
import { saveSnapshot, getDateToday } from '../utils/saveSnapshot.mjs';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT_DIR = path.resolve(__dirname, '../..');

const TMDB_BASE = 'https://api.themoviedb.org/3';
const IMAGE_BASE = 'https://image.tmdb.org/t/p/w500';
const LANGUAGE = 'fr-FR';
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

function normalize(value) {
    return (value || '')
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, ' ')
        .trim();
}

function isoDaysAgo(days) {
    const d = new Date();
    d.setUTCDate(d.getUTCDate() - days);
    const yyyy = d.getUTCFullYear();
    const mm = String(d.getUTCMonth() + 1).padStart(2, '0');
    const dd = String(d.getUTCDate()).padStart(2, '0');
    return `${yyyy}-${mm}-${dd}`;
}

function flixpatrolTop10Url(date) {
    return `https://flixpatrol.com/top10/hbo-max/france/${date}/`;
}

function upgradePosterUrl(url) {
    if (!url) return '';
    // Prefer a larger cached poster when FlixPatrol exposes a small thumbnail path.
    return url.replace(/\/w\d+\//, '/w350/');
}

async function launchBrowser() {
    return puppeteer.launch({
        headless: true,
        args: [
            '--no-sandbox',
            '--disable-setuid-sandbox',
            '--disable-blink-features=AutomationControlled',
        ],
    });
}

async function preparePage(browser) {
    const page = await browser.newPage();
    await page.setViewport({ width: 1366, height: 768 });
    await page.evaluateOnNewDocument(() => {
        Object.defineProperty(navigator, 'webdriver', {
            get: () => undefined,
        });
    });
    await page.setUserAgent(
        'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
    );
    return page;
}

async function dismissCookies(page) {
    try {
        const clicked = await page.evaluate(() => {
            const buttons = Array.from(document.querySelectorAll('button, a'));
            const btn = buttons.find((el) =>
                /accept|agree|j'accepte|accepter|ok/i.test(el.textContent || '')
            );
            if (btn) {
                btn.click();
                return true;
            }
            return false;
        });
        if (clicked) await new Promise((r) => setTimeout(r, 500));
    } catch {
        // ignore
    }
}

/**
 * Extrait le TOP 10 Séries depuis la page FlixPatrol du jour.
 * Les posters ne sont pas dans le tableau → récupérés ensuite sur la fiche titre.
 */
async function scrapeFlixpatrolLists(page, date) {
    const url = flixpatrolTop10Url(date);
    console.log(`Navigation FlixPatrol : ${url}`);
    await page.goto(url, { waitUntil: 'networkidle2', timeout: 60000 });
    await dismissCookies(page);
    await new Promise((r) => setTimeout(r, 1500));

    return page.evaluate((topN) => {
        const tableAfterHeading = (heading) => {
            if (!heading) return null;

            const headings = Array.from(document.querySelectorAll('h2, h3'));
            const idx = headings.indexOf(heading);
            const nextHeading = idx >= 0 ? headings[idx + 1] : null;

            return (
                Array.from(document.querySelectorAll('table')).find((table) => {
                    const afterHeading =
                        heading.compareDocumentPosition(table) &
                        Node.DOCUMENT_POSITION_FOLLOWING;
                    if (!afterHeading) return false;
                    if (!nextHeading) return true;
                    return (
                        nextHeading.compareDocumentPosition(table) &
                        Node.DOCUMENT_POSITION_PRECEDING
                    );
                }) || null
            );
        };

        const extractSection = (headingText) => {
            const heading = Array.from(document.querySelectorAll('h2, h3')).find((h) =>
                h.textContent.trim().includes(headingText)
            );
            const table = tableAfterHeading(heading);
            if (!table) return [];

            const items = [];
            for (const row of table.querySelectorAll('tr')) {
                const link = row.querySelector('a[href*="/title/"]');
                if (!link) continue;

                const rankText =
                    row.querySelector('td')?.textContent?.trim().replace(/\.$/, '') || '';
                const rank = parseInt(rankText, 10);
                if (!Number.isFinite(rank)) continue;

                items.push({
                    id: rank,
                    title: link.textContent.trim(),
                    flixpatrolUrl: link.href,
                    poster: '',
                });
            }

            return items.slice(0, topN);
        };

        return extractSection('TOP 10 TV Shows');
    }, TOP_N);
}

async function scrapeFlixpatrolPoster(page, item) {
    if (!item.flixpatrolUrl) return '';

    await page.goto(item.flixpatrolUrl, { waitUntil: 'domcontentloaded', timeout: 45000 });
    await new Promise((r) => setTimeout(r, 800));

    const poster = await page.evaluate(() => {
        const fromAspect =
            document.querySelector('.aspect-poster img')?.currentSrc ||
            document.querySelector('.aspect-poster img')?.src ||
            '';
        if (fromAspect) return fromAspect;

        const fromPosterPath =
            document.querySelector('img[src*="/posters/"]')?.currentSrc ||
            document.querySelector('img[src*="/posters/"]')?.src ||
            '';
        if (fromPosterPath) return fromPosterPath;

        return document.querySelector('meta[property="og:image"]')?.content || '';
    });

    return upgradePosterUrl(poster);
}

async function searchTmdb(title, mediaType, auth) {
    const data = await tmdbFetch(`/search/${mediaType}`, auth, {
        language: LANGUAGE,
        query: title,
        include_adult: false,
        page: 1,
    });

    const results = data.results ?? [];
    if (results.length === 0) return null;

    const target = normalize(title);
    const exactMatches = results.filter((r) => {
        const name = mediaType === 'movie' ? r.title : r.name;
        return normalize(name) === target;
    });

    // Parmi les correspondances exactes (ou le top 5 sinon), on garde le plus populaire.
    const pool = exactMatches.length > 0 ? exactMatches : results.slice(0, 5);
    return pool.sort((a, b) => (b.popularity || 0) - (a.popularity || 0))[0];
}

async function enrichWithTmdb(listItem, mediaType, auth) {
    const match = await searchTmdb(listItem.title, mediaType, auth);
    const flixPoster = listItem.poster || '';

    if (!match) {
        console.warn(`TMDB : aucun résultat pour "${listItem.title}"`);
        return {
            id: listItem.id,
            poster: flixPoster,
            title: listItem.title,
            description: '',
            stars: [],
            imgVertical: flixPoster,
            pageInfosUrl: listItem.flixpatrolUrl || '',
            genres: [],
            originCountry: '',
            trailerUrl: '',
            year: '',
            ...(mediaType === 'tv' ? { nbSaisons: '', nbEpisodes: '' } : {}),
        };
    }

    const details = await tmdbFetch(`/${mediaType}/${match.id}`, auth, {
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

    const isMovie = mediaType === 'movie';
    const title = isMovie
        ? details.title || listItem.title
        : details.name || listItem.title;
    const date = isMovie
        ? details.release_date || match.release_date || ''
        : details.first_air_date || match.first_air_date || '';
    const tmdbPoster = posterUrl(details.poster_path || match.poster_path);
    const image = flixPoster || tmdbPoster;

    const entry = {
        id: listItem.id,
        poster: image,
        title,
        description: details.overview || '',
        stars,
        imgVertical: image,
        pageInfosUrl: `https://www.themoviedb.org/${mediaType}/${match.id}`,
        genres,
        originCountry,
        trailerUrl: pickTrailerUrl(details.videos),
        year: date ? date.slice(0, 4) : '',
    };

    if (!isMovie) {
        entry.nbSaisons = details.number_of_seasons ?? '';
        entry.nbEpisodes = details.number_of_episodes ?? '';
    }

    return entry;
}

async function enrichList(items, mediaType, auth, page) {
    const entries = [];

    for (let i = 0; i < items.length; i++) {
        const item = items[i];
        console.log(`[${mediaType}] [${i + 1}/${items.length}] Poster FlixPatrol : ${item.title}...`);
        try {
            item.poster = await scrapeFlixpatrolPoster(page, item);
        } catch (err) {
            console.error(`Poster FlixPatrol échoué pour "${item.title}":`, err.message);
            item.poster = '';
        }

        console.log(`[${mediaType}] [${i + 1}/${items.length}] Enrichissement TMDB : ${item.title}...`);
        try {
            entries.push(await enrichWithTmdb(item, mediaType, auth));
        } catch (err) {
            console.error(`Enrichissement TMDB échoué pour "${item.title}":`, err.message);
            entries.push({
                id: item.id,
                poster: item.poster || '',
                title: item.title,
                description: '',
                stars: [],
                imgVertical: item.poster || '',
                pageInfosUrl: item.flixpatrolUrl || '',
                genres: [],
                originCountry: '',
                trailerUrl: '',
                year: '',
                ...(mediaType === 'tv' ? { nbSaisons: '', nbEpisodes: '' } : {}),
            });
        }

        await new Promise((r) => setTimeout(r, 400));
    }

    return entries;
}

async function run() {
    loadEnvFile();
    const auth = getAuth();
    let browser;

    try {
        browser = await launchBrowser();
        const page = await preparePage(browser);

        const candidateDates = [getDateToday(), isoDaysAgo(1)];
        let series = [];
        let usedDate = candidateDates[0];

        for (const date of candidateDates) {
            series = await scrapeFlixpatrolLists(page, date);
            usedDate = date;

            if (series.length > 0) break;
            console.warn(`Aucun TOP 10 séries FlixPatrol pour ${date}, essai jour précédent...`);
        }

        console.log(`FlixPatrol HBO Max (${usedDate}) : ${series.length} séries`);

        if (series.length === 0) {
            throw new Error('Impossible de récupérer le TOP 10 séries FlixPatrol HBO Max.');
        }

        const enrichedSeries = await enrichList(series, 'tv', auth, page);
        saveSnapshot('hbo-series.json', enrichedSeries);

        console.log('Job HBO/Max FlixPatrol + TMDB terminé.');
    } catch (error) {
        console.error('Erreur job HBO/Max :', error.message);
        process.exitCode = 1;
    } finally {
        if (browser) {
            await browser.close();
            console.log('Navigateur fermé.');
        }
    }
}

run();

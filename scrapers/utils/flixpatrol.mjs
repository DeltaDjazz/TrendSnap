import { getDateToday, saveSnapshot } from './saveSnapshot.mjs';
import {
    getAuth,
    isoDaysAgo,
    LANGUAGE,
    loadEnvFile,
    normalize,
    pickTrailerUrl,
    posterUrl,
    tmdbFetch,
} from './tmdb.mjs';
import { launchBrowser, preparePage, sleep } from './puppeteer.mjs';

export const TOP_N = 10;

export { getDateToday, getAuth, isoDaysAgo, loadEnvFile };

export function flixpatrolTop10Url(platform, date) {
    return `https://flixpatrol.com/top10/${platform}/france/${date}/`;
}

export function upgradePosterUrl(url) {
    if (!url) return '';
    return url.replace(/\/w\d+\//, '/w350/');
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
        if (clicked) await sleep(500);
    } catch {
        // ignore
    }
}

export async function scrapeFlixpatrolLists(page, date, platform, topN = TOP_N) {
    const url = flixpatrolTop10Url(platform, date);
    console.log(`Navigation FlixPatrol : ${url}`);
    await page.goto(url, { waitUntil: 'networkidle2', timeout: 60000 });
    await dismissCookies(page);
    await sleep(1500);

    return page.evaluate(
        (headingText, limit) => {
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

            return items.slice(0, limit);
        },
        'TOP 10 TV Shows',
        topN
    );
}

export async function scrapeFlixpatrolPoster(page, item) {
    if (!item.flixpatrolUrl) return '';

    await page.goto(item.flixpatrolUrl, { waitUntil: 'domcontentloaded', timeout: 45000 });
    await sleep(800);

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

export async function searchTmdb(title, mediaType, auth) {
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

    const pool = exactMatches.length > 0 ? exactMatches : results.slice(0, 5);
    return pool.sort((a, b) => (b.popularity || 0) - (a.popularity || 0))[0];
}

export async function enrichWithTmdb(listItem, mediaType, auth) {
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
        details.production_countries?.[0]?.name || details.origin_country?.[0] || '';

    const isMovie = mediaType === 'movie';
    const title = isMovie ? details.title || listItem.title : details.name || listItem.title;
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

export async function enrichFlixpatrolList(items, mediaType, auth, page) {
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

        await sleep(400);
    }

    return entries;
}

/**
 * Job FlixPatrol + TMDB générique pour une plateforme.
 * @param {object} config
 * @param {string} config.platform - Slug FlixPatrol (ex. hbo-max, paramount-plus)
 * @param {string} config.snapshotFile - Nom du fichier snapshot
 * @param {string} config.label - Label pour les logs
 */
export async function runFlixpatrolJob({ platform, snapshotFile, label }) {
    loadEnvFile();
    const auth = getAuth();
    let browser;

    try {
        browser = await launchBrowser();
        const page = await preparePage(browser, { userAgent: true });

        const candidateDates = [getDateToday(), isoDaysAgo(1)];
        let series = [];
        let usedDate = candidateDates[0];

        for (const date of candidateDates) {
            series = await scrapeFlixpatrolLists(page, date, platform);
            usedDate = date;

            if (series.length > 0) break;
            console.warn(`Aucun TOP 10 séries FlixPatrol pour ${date}, essai jour précédent...`);
        }

        console.log(`FlixPatrol ${label} (${usedDate}) : ${series.length} séries`);

        if (series.length === 0) {
            throw new Error(`Impossible de récupérer le TOP 10 séries FlixPatrol ${label}.`);
        }

        const enrichedSeries = await enrichFlixpatrolList(series, 'tv', auth, page);
        saveSnapshot(snapshotFile, enrichedSeries);

        console.log(`Job ${label} FlixPatrol + TMDB terminé.`);
    } catch (error) {
        console.error(`Erreur job ${label} :`, error.message);
        process.exitCode = 1;
    } finally {
        if (browser) {
            await browser.close();
            console.log('Navigateur fermé.');
        }
    }
}

import { getDateToday, saveSnapshot } from '../utils/saveSnapshot.mjs';
import {
    getAuth,
    LANGUAGE,
    loadEnvFile,
    pickTrailerUrl,
    posterUrl,
    REGION,
    tmdbFetch,
} from '../utils/tmdb.mjs';

const TOP_N = 10;
const NOW_PLAYING_MAX_MONTHS = 4;
const NOW_PLAYING_MAX_PAGES = 5;
/** Priorité des types de sortie TMDB : 3 = salles, 2 = salles limitées, 1 = avant-première */
const RELEASE_TYPE_PRIORITY = [3, 2, 1];

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

function isReleaseDateInNowPlayingWindow(releaseDate, todayIso) {
    if (!releaseDate || !/^\d{4}-\d{2}-\d{2}/.test(releaseDate)) return false;
    const iso = releaseDate.slice(0, 10);
    const minDate = getMinReleaseDate(todayIso);
    return iso <= todayIso && iso >= minDate;
}

function isUpcomingReleaseDate(releaseDate, todayIso) {
    if (!releaseDate || !/^\d{4}-\d{2}-\d{2}/.test(releaseDate)) return false;
    return releaseDate.slice(0, 10) >= todayIso;
}

function formatDateFr(isoDate) {
    if (!isoDate || !/^\d{4}-\d{2}-\d{2}/.test(isoDate)) return '';
    const [yyyy, mm, dd] = isoDate.slice(0, 10).split('-');
    return `${dd}/${mm}/${yyyy}`;
}

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
        details.production_countries?.[0]?.name || details.origin_country?.[0] || '';

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

            if (filterNowPlayingWindow && !isReleaseDateInNowPlayingWindow(releaseDate, today)) {
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
        const nowPlaying = await fetchTop10('/movie/now_playing', auth, 'films en salles', {
            withDateDeSortie: true,
            filterNowPlayingWindow: true,
        });
        saveSnapshot('cinema-movies.json', nowPlaying);

        const upcoming = await fetchTop10('/movie/upcoming', auth, 'films à venir', {
            withDateDeSortie: true,
            filterUpcomingOnly: true,
        });
        saveSnapshot('cinema-upcoming.json', upcoming);

        console.log('Job cinéma TMDB terminé.');
    } catch (error) {
        console.error('Erreur job cinéma TMDB :', error.message);
        process.exitCode = 1;
    }
}

run();

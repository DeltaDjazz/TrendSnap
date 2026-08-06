/**
 * Hero slides TrendSnap — 3 slides TMDB pour le carrousel d'accueil.
 *
 * 1. #1 cinéma FR (now playing)
 * 2. #1 série trending du jour
 * 3. #1 cinéma à venir FR
 *
 * Usage: node scrapers/jobs/heroSlides.mjs
 * Env: TMDB_ACCESS_TOKEN ou TMDB_API_KEY
 */
import { getDateToday, saveSnapshot } from '../utils/saveSnapshot.mjs';
import {
    getAuth,
    LANGUAGE,
    loadEnvFile,
    pickTrailerUrl,
    posterUrl,
    backdropUrl,
    REGION,
    tmdbFetch,
} from '../utils/tmdb.mjs';

const NOW_PLAYING_MAX_MONTHS = 4;
const NOW_PLAYING_MAX_PAGES = 5;
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
    if (!country?.release_dates?.length) return { date: '', certification: '' };

    let certification = '';
    for (const type of RELEASE_TYPE_PRIORITY) {
        const match = country.release_dates.find((entry) => entry.type === type);
        if (match?.release_date) {
            certification = match.certification || '';
            return { date: match.release_date.slice(0, 10), certification };
        }
    }

    const dates = country.release_dates
        .map((entry) => ({
            date: entry.release_date?.slice(0, 10),
            certification: entry.certification || '',
        }))
        .filter((entry) => entry.date)
        .sort((a, b) => a.date.localeCompare(b.date));

    return dates[0] || { date: '', certification: '' };
}

function pickTvCertification(contentRatings, regionCode = REGION) {
    const results = contentRatings?.results ?? [];
    const fr = results.find((entry) => entry.iso_3166_1 === regionCode);
    if (fr?.rating) return fr.rating;
    const us = results.find((entry) => entry.iso_3166_1 === 'US');
    return us?.rating || '';
}

async function fetchFirstNowPlaying(auth, todayIso) {
    for (let page = 1; page <= NOW_PLAYING_MAX_PAGES; page++) {
        const data = await tmdbFetch('/movie/now_playing', auth, {
            language: LANGUAGE,
            region: REGION,
            page,
        });
        for (const item of data.results ?? []) {
            if (isReleaseDateInNowPlayingWindow(item.release_date, todayIso) && item.backdrop_path) {
                return item;
            }
        }
        if (page >= (data.total_pages ?? 1)) break;
    }
    throw new Error('Aucun film now_playing FR avec backdrop.');
}

async function fetchFirstUpcoming(auth, todayIso, excludeIds = new Set()) {
    for (let page = 1; page <= NOW_PLAYING_MAX_PAGES; page++) {
        const data = await tmdbFetch('/movie/upcoming', auth, {
            language: LANGUAGE,
            region: REGION,
            page,
        });
        for (const item of data.results ?? []) {
            if (
                isUpcomingReleaseDate(item.release_date, todayIso) &&
                item.backdrop_path &&
                !excludeIds.has(item.id)
            ) {
                return item;
            }
        }
        if (page >= (data.total_pages ?? 1)) break;
    }
    throw new Error('Aucun film upcoming FR avec backdrop.');
}

async function fetchFirstTrendingTv(auth, excludeIds = new Set()) {
    const data = await tmdbFetch('/trending/tv/day', auth, {
        language: LANGUAGE,
    });
    for (const item of data.results ?? []) {
        if (item.backdrop_path && !excludeIds.has(item.id)) {
            return item;
        }
    }
    throw new Error('Aucune série trending avec backdrop.');
}

async function enrichMovieSlide(listItem, { slot, kind, badge, auth }) {
    const details = await tmdbFetch(`/movie/${listItem.id}`, auth, {
        language: LANGUAGE,
        append_to_response: 'credits,videos,release_dates',
    });

    const { date: regionalDate, certification } = pickRegionalReleaseDate(details.release_dates);
    const releaseDate = regionalDate || listItem.release_date || details.release_date || '';
    const image = posterUrl(details.poster_path || listItem.poster_path);
    const backdrop = backdropUrl(details.backdrop_path || listItem.backdrop_path);

    if (!backdrop) {
        throw new Error(`Film ${listItem.id} sans backdrop.`);
    }

    return {
        slot,
        kind,
        badge,
        mediaType: 'movie',
        tmdbId: listItem.id,
        title: details.title || listItem.title || '',
        backdropUrl: backdrop,
        posterUrl: image,
        poster: image,
        imgVertical: image,
        year: releaseDate ? releaseDate.slice(0, 4) : '',
        dateDeSortie: formatDateFr(releaseDate),
        genres: (details.genres ?? []).map((g) => g.name).filter(Boolean),
        runtimeMinutes: details.runtime || null,
        nbSaisons: null,
        nbEpisodes: null,
        certification: certification || '',
        description: details.overview || listItem.overview || '',
        trailerUrl: pickTrailerUrl(details.videos),
        stars: (details.credits?.cast ?? [])
            .slice(0, 5)
            .map((person) => person.name)
            .filter(Boolean),
        originCountry:
            details.production_countries?.[0]?.name || details.origin_country?.[0] || '',
        template: 'cinema',
        pageInfosUrl: `https://www.themoviedb.org/movie/${listItem.id}`,
    };
}

async function enrichTvSlide(listItem, { slot, kind, badge, auth }) {
    const details = await tmdbFetch(`/tv/${listItem.id}`, auth, {
        language: LANGUAGE,
        append_to_response: 'credits,videos,content_ratings',
    });

    const airDate = details.first_air_date || listItem.first_air_date || '';
    const image = posterUrl(details.poster_path || listItem.poster_path);
    const backdrop = backdropUrl(details.backdrop_path || listItem.backdrop_path);

    if (!backdrop) {
        throw new Error(`Série ${listItem.id} sans backdrop.`);
    }

    return {
        slot,
        kind,
        badge,
        mediaType: 'tv',
        tmdbId: listItem.id,
        title: details.name || listItem.name || '',
        backdropUrl: backdrop,
        posterUrl: image,
        poster: image,
        imgVertical: image,
        year: airDate ? airDate.slice(0, 4) : '',
        dateDeSortie: '',
        genres: (details.genres ?? []).map((g) => g.name).filter(Boolean),
        runtimeMinutes: Array.isArray(details.episode_run_time)
            ? details.episode_run_time[0] || null
            : null,
        nbSaisons: details.number_of_seasons ?? null,
        nbEpisodes: details.number_of_episodes ?? null,
        certification: pickTvCertification(details.content_ratings),
        description: details.overview || listItem.overview || '',
        trailerUrl: pickTrailerUrl(details.videos),
        stars: (details.credits?.cast ?? [])
            .slice(0, 5)
            .map((person) => person.name)
            .filter(Boolean),
        originCountry:
            details.production_countries?.[0]?.name || details.origin_country?.[0] || '',
        template: 'cinema',
        pageInfosUrl: `https://www.themoviedb.org/tv/${listItem.id}`,
    };
}

async function main() {
    loadEnvFile();
    const auth = getAuth();
    const today = getDateToday();

    console.log(`Hero slides TMDB (${today}, région ${REGION})...`);

    const nowPlaying = await fetchFirstNowPlaying(auth, today);
    console.log(`Slide 1 cinéma : ${nowPlaying.title} (${nowPlaying.id})`);

    const trendingTv = await fetchFirstTrendingTv(auth);
    console.log(`Slide 2 série : ${trendingTv.name} (${trendingTv.id})`);

    const upcoming = await fetchFirstUpcoming(auth, today, new Set([nowPlaying.id]));
    console.log(`Slide 3 upcoming : ${upcoming.title} (${upcoming.id})`);

    const slides = [
        await enrichMovieSlide(nowPlaying, {
            slot: 1,
            kind: 'cinema-now',
            badge: '#1 CINÉMA',
            auth,
        }),
        await enrichTvSlide(trendingTv, {
            slot: 2,
            kind: 'trending-tv',
            badge: '#1 SÉRIE DU JOUR',
            auth,
        }),
        await enrichMovieSlide(upcoming, {
            slot: 3,
            kind: 'cinema-upcoming',
            badge: 'BIENTÔT',
            auth,
        }),
    ];

    const payload = {
        updatedAt: new Date().toISOString(),
        slides,
    };

    saveSnapshot('hero-slides.json', payload);
    console.log('Job heroSlides terminé.');
}

main().catch((error) => {
    console.error('Erreur job heroSlides :', error.message);
    process.exitCode = 1;
});

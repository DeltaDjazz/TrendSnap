import { saveSnapshot } from './saveSnapshot.mjs';
import {
    getAuth,
    LANGUAGE,
    loadEnvFile,
    pickTrailerUrl,
    posterUrl,
    REGION,
    tmdbFetch,
} from './tmdb.mjs';

export const TOP_N = 10;

/** IDs TMDB watch providers (région FR). */
export const PROVIDER_IDS = {
    /** Max (ex-HBO Max) */
    max: 1899,
    /** Paramount+ */
    paramountPlus: 531,
};

/**
 * Top séries TMDB disponibles chez un provider, tri popularité.
 * Ce n'est pas le Top 10 officiel de la plateforme.
 */
export async function discoverPopularTvByProvider(auth, providerId, { topN = TOP_N } = {}) {
    const data = await tmdbFetch('/discover/tv', auth, {
        language: LANGUAGE,
        watch_region: REGION,
        with_watch_providers: String(providerId),
        with_watch_monetization_types: 'flatrate',
        sort_by: 'popularity.desc',
        include_adult: false,
        page: 1,
    });

    return (data.results ?? []).slice(0, topN);
}

async function enrichTvShow(listItem, rank, auth) {
    const details = await tmdbFetch(`/tv/${listItem.id}`, auth, {
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
    const airDate = details.first_air_date || listItem.first_air_date || '';
    const image = posterUrl(details.poster_path || listItem.poster_path);

    return {
        id: rank,
        poster: image,
        title: details.name || listItem.name || '',
        description: details.overview || listItem.overview || '',
        stars,
        imgVertical: image,
        pageInfosUrl: `https://www.themoviedb.org/tv/${listItem.id}`,
        genres,
        originCountry,
        trailerUrl: pickTrailerUrl(details.videos),
        year: airDate ? airDate.slice(0, 4) : '',
        nbSaisons: details.number_of_seasons ?? '',
        nbEpisodes: details.number_of_episodes ?? '',
    };
}

function fallbackTvShow(listItem, rank) {
    const image = posterUrl(listItem.poster_path);
    const airDate = listItem.first_air_date || '';

    return {
        id: rank,
        poster: image,
        title: listItem.name || '',
        description: listItem.overview || '',
        stars: [],
        imgVertical: image,
        pageInfosUrl: `https://www.themoviedb.org/tv/${listItem.id}`,
        genres: [],
        originCountry: '',
        trailerUrl: '',
        year: airDate ? airDate.slice(0, 4) : '',
        nbSaisons: '',
        nbEpisodes: '',
    };
}

/**
 * @param {object} config
 * @param {number} config.providerId - ID watch provider TMDB
 * @param {string} config.snapshotFile
 * @param {string} config.label
 */
export async function runTmdbProviderSeriesJob({ providerId, snapshotFile, label }) {
    loadEnvFile();
    const auth = getAuth();

    try {
        console.log(`TMDB Discover séries ${label} (provider ${providerId}, ${REGION})...`);
        const results = await discoverPopularTvByProvider(auth, providerId);

        if (results.length === 0) {
            throw new Error(`Aucun résultat TMDB Discover pour ${label}.`);
        }

        console.log(`TMDB ${label} : ${results.length} séries`);

        const series = [];
        for (let i = 0; i < results.length; i++) {
            const item = results[i];
            console.log(`[${i + 1}/${results.length}] Enrichissement : ${item.name}...`);
            try {
                series.push(await enrichTvShow(item, i + 1, auth));
            } catch (err) {
                console.error(`Échec enrichissement "${item.name}":`, err.message);
                series.push(fallbackTvShow(item, i + 1));
            }
        }

        saveSnapshot(snapshotFile, series);
        console.log(`Job ${label} TMDB terminé.`);
    } catch (error) {
        console.error(`Erreur job ${label} :`, error.message);
        process.exitCode = 1;
    }
}

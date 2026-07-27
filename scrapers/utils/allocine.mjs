import { sleep } from './puppeteer.mjs';

const COOKIE_SELECTOR = 'span.jad_cmp_paywall_cta-cookies';

export async function acceptAllocineCookies(page) {
    try {
        await page.waitForSelector(COOKIE_SELECTOR, { timeout: 2000 });
        await page.click(COOKIE_SELECTOR);
        console.log('Modale de cookies acceptée !');
        await sleep(500);
    } catch {
        console.log('Pas de modale de cookies affichée sur cette page.');
    }
}

function searchPath(type) {
    return type === 'series' ? 'series' : 'movie';
}

/**
 * Fonctions exécutées dans le navigateur via page.evaluate().
 * Chaque fonction doit être 100 % autonome (aucun appel à une autre fonction du module).
 */

function browserExtractFirstSearchResult(fallbackTitle) {
    const mainCard = document.querySelector('div.card.entity-card');
    if (!mainCard) {
        return { title: fallbackTitle, description: 'Non trouvée', pageInfosUrl: null };
    }

    const imgVertical =
        document.querySelector('div.card.entity-card img.thumbnail-img')?.getAttribute('data-src') || '';
    const titleElem = document.querySelector('div.meta h2.meta-title a.meta-title-link');
    const title = titleElem ? titleElem.textContent.trim() : 'Non trouvé';
    const descElem = mainCard.querySelector('div.content-txt');
    const description = descElem ? descElem.textContent.trim() : 'Non trouvée';

    const starsList = [];
    mainCard.querySelectorAll('div.meta-body-actor a').forEach((el) => {
        const name = el.textContent.trim();
        if (name && !starsList.includes(name) && el.href.includes('/personne/')) {
            starsList.push(name);
        }
    });

    return {
        title,
        description,
        stars: starsList,
        imgVertical,
        pageInfosUrl: titleElem ? titleElem.href : null,
    };
}

function browserExtractSearchResultWithYear(fallbackTitle, targetYear) {
    const normalizeTitle = (str) =>
        (str || '')
            .normalize('NFD')
            .replace(/[\u0300-\u036f]/g, '')
            .toLowerCase()
            .trim();

    const getCardTitle = (card) =>
        card
            .querySelector('h2.meta-title .meta-title-link, h2.meta-title a.meta-title-link')
            ?.textContent?.trim() || '';

    const getCardYear = (card) => {
        const metaInfo = card.querySelector('.meta-body-info')?.textContent || '';
        return metaInfo.match(/\b(19|20)\d{2}\b/)?.[0] || null;
    };

    const getPageUrl = (card) => {
        const titleLink = card.querySelector('h2.meta-title a.meta-title-link');
        if (titleLink?.href) return titleLink.href;

        const obfuscatedEl = card.querySelector('h2.meta-title .meta-title-link, .thumbnail-link');
        const encodedClass = obfuscatedEl?.className?.split(' ').find((c) => c.startsWith('ACr'));
        if (encodedClass) {
            const path = atob(encodedClass.substring(3));
            return path.startsWith('http') ? path : `https://www.allocine.fr${path}`;
        }

        return card.querySelector('a[href*="fichefilm"]')?.href || null;
    };

    const titleMatches = (card) =>
        normalizeTitle(getCardTitle(card)) === normalizeTitle(fallbackTitle);

    const cards = Array.from(document.querySelectorAll('div.card.entity-card'));
    const findMatchingCard = (yearToMatch) =>
        cards.find(
            (card) => titleMatches(card) && (!yearToMatch || getCardYear(card) === String(yearToMatch))
        );

    if (cards.length === 0) {
        return { title: fallbackTitle, pageInfosUrl: null, matchedYear: null };
    }

    let mainCard = null;
    let matchedYear = targetYear ? String(targetYear) : null;

    if (targetYear) {
        mainCard = findMatchingCard(targetYear);
        if (!mainCard) {
            const prevYear = String(Number(targetYear) - 1);
            mainCard = findMatchingCard(prevYear);
            if (mainCard) matchedYear = prevYear;
        }
        if (!mainCard) {
            const nextYear = String(Number(targetYear) + 1);
            mainCard = findMatchingCard(nextYear);
            if (mainCard) matchedYear = nextYear;
        }
    } else {
        mainCard = cards.find((card) => titleMatches(card));
    }

    if (cards.length === 1 && !mainCard) {
        mainCard = cards[0];
    }

    if (!mainCard) {
        return { title: fallbackTitle, pageInfosUrl: null, matchedYear: null };
    }

    const imgVertical = mainCard.querySelector('img.thumbnail-img')?.getAttribute('data-src') || '';
    const titleElem = mainCard.querySelector(
        'h2.meta-title .meta-title-link, h2.meta-title a.meta-title-link'
    );
    const title = titleElem ? titleElem.textContent.trim() : fallbackTitle;
    const descElem = mainCard.querySelector('div.content-txt');
    const description = descElem ? descElem.textContent.trim() : 'Non trouvée';

    const starsList = [];
    mainCard.querySelectorAll('div.meta-body-actor a').forEach((el) => {
        const name = el.textContent.trim();
        if (name && !starsList.includes(name) && el.href.includes('/personne/')) {
            starsList.push(name);
        }
    });

    return {
        title,
        description,
        stars: starsList,
        imgVertical,
        pageInfosUrl: getPageUrl(mainCard),
        matchedYear,
    };
}

function browserExtractFiche(ficheMode) {
    let trailerUrl = '';
    const playerElement = document.querySelector('figure.player');
    if (playerElement) {
        const rawData = playerElement.getAttribute('data-model');
        if (rawData) {
            try {
                const data = JSON.parse(rawData);
                const idDailymotion = data?.videos?.[0]?.idDailymotion;
                if (idDailymotion) {
                    trailerUrl = `https://www.dailymotion.com/video/${idDailymotion}`;
                }
            } catch {
                // Erreur JSON optionnelle
            }
        }
    }

    if (ficheMode === 'movie-full') {
        const date =
            document.querySelector('div.card.entity-card .meta-body-info a.date')?.textContent.trim() || '';
        const year = date.split(' ')[2] || '';

        const genresList = [];
        document.querySelectorAll('div.card.entity-card .meta-body-info a.dark-grey-link').forEach((el) => {
            const genre = el.textContent.trim();
            if (genre && !genresList.includes(genre)) genresList.push(genre);
        });

        const originCountry =
            document
                .querySelector('div.card.entity-card div.meta-body-item.meta-body-nationality a')
                ?.textContent.trim() || '';

        return { year, genres: genresList, originCountry, trailerUrl };
    }

    if (ficheMode === 'movie-meta') {
        const genresList = [];
        document.querySelectorAll('div.card.entity-card .meta-body-info a').forEach((el) => {
            const genre = el.textContent.trim();
            if (genre && !genresList.includes(genre)) genresList.push(genre);
        });

        const originCountry =
            document
                .querySelector('div.card.entity-card div.meta-body-item.meta-body-nationality a')
                ?.textContent.trim() || '';

        return { genres: genresList, originCountry, trailerUrl };
    }

    if (ficheMode === 'series-full') {
        let year = '';
        const element = document.querySelector('div.card.entity-card .meta-body-item.meta-body-info');
        if (element) {
            const match = element.textContent.trim().match(/\d{4}/);
            if (match) year = match[0];
        }

        const genresList = [];
        document.querySelectorAll('div.card.entity-card .meta-body-info a.dark-grey-link').forEach((el) => {
            const genre = el.textContent.trim();
            if (genre && !genresList.includes(genre)) genresList.push(genre);
        });

        const originCountry =
            document
                .querySelector('div.card.entity-card div.meta-body-item.meta-body-nationality a')
                ?.textContent.trim() || '';
        const nbSaisons =
            document.querySelector('section#synopsis-details div.stats-numbers-row-item div.stats-item')
                ?.textContent.trim() || '';
        const nbEpisodes =
            document
                .querySelector('section#synopsis-details div.stats-numbers-row-item:nth-child(2) div.stats-item')
                ?.textContent.trim() || '';

        return { year, genres: genresList, originCountry, nbSaisons, nbEpisodes, trailerUrl };
    }

    if (ficheMode === 'series-meta') {
        const originCountry =
            document
                .querySelector('div.card.entity-card div.meta-body-item.meta-body-nationality a')
                ?.textContent.trim() || '';
        const nbSaisons =
            document.querySelector('section#synopsis-details div.stats-numbers-row-item div.stats-item')
                ?.textContent.trim() || '';
        const nbEpisodes =
            document
                .querySelector('section#synopsis-details div.stats-numbers-row-item:nth-child(2) div.stats-item')
                ?.textContent.trim() || '';

        return { originCountry, nbSaisons, nbEpisodes, trailerUrl };
    }

    return {};
}

/**
 * Enrichit une liste d'items via AlloCiné.
 * @param {import('puppeteer').Page} page
 * @param {object[]} items
 * @param {object} options
 * @param {'movie'|'series'} options.type
 * @param {'simple'|'matchYear'} [options.searchMode='simple']
 * @param {'movie-full'|'movie-meta'|'series-full'|'series-meta'} options.ficheMode
 * @param {object} [options.errorDefaults={}]
 * @param {number} [options.delayMs=1000]
 */
export async function enrichListFromAllocine(page, items, options) {
    const {
        type,
        searchMode = 'simple',
        ficheMode,
        errorDefaults = {},
        delayMs = 1000,
    } = options;

    const searchFn =
        searchMode === 'matchYear'
            ? browserExtractSearchResultWithYear
            : browserExtractFirstSearchResult;

    for (let i = 0; i < items.length; i++) {
        const item = items[i];
        if (!item.title) continue;

        console.log(`[${i + 1}/${items.length}] Recherche Allociné de : ${item.title}...`);

        try {
            const searchUrl = `https://www.allocine.fr/rechercher/${searchPath(type)}/?q=${encodeURIComponent(item.title)}`;
            await page.goto(searchUrl, { waitUntil: 'domcontentloaded' });
            await acceptAllocineCookies(page);

            const searchArgs =
                searchMode === 'matchYear' ? [item.title, item.year] : [item.title];
            const details = await page.evaluate(searchFn, ...searchArgs);

            if (!details.pageInfosUrl) {
                if (searchMode === 'matchYear') {
                    const yearsTested = item.year
                        ? `${item.year}, ${Number(item.year) - 1}, ${Number(item.year) + 1}`
                        : 'aucune (titre seul)';
                    console.log(
                        `Aucun résultat AlloCiné pour "${item.title}" (années testées : ${yearsTested}), passage au suivant.`
                    );
                } else {
                    console.log(`Aucun résultat AlloCiné pour "${item.title}", passage au suivant.`);
                }
                continue;
            }

            if (details.matchedYear && details.matchedYear !== String(item.year)) {
                console.log(
                    `Correspondance AlloCiné trouvée avec l'année ${details.matchedYear} (au lieu de ${item.year}) pour "${item.title}".`
                );
            }

            item.title = details.title;
            item.description = details.description;
            item.stars = details.stars;
            item.imgVertical = details.imgVertical;
            item.pageInfosUrl = details.pageInfosUrl;

            try {
                await page.goto(item.pageInfosUrl, { waitUntil: 'domcontentloaded' });
                const detailsInfos = await page.evaluate(browserExtractFiche, ficheMode);
                Object.assign(item, detailsInfos);
            } catch (ficheErr) {
                console.error(
                    `Fiche AlloCiné incomplète pour "${item.title}":`,
                    ficheErr.message
                );
            }
        } catch (err) {
            console.error(`Impossible de récupérer les infos allocine pour "${item.title}":`, err.message);
            Object.assign(item, errorDefaults);
        }

        await sleep(delayMs);
    }
}

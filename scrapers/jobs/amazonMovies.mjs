/* on importe pupeteer*/
import puppeteer from 'puppeteer';
import { saveSnapshot } from '../utils/saveSnapshot.mjs';

let browser;
try {
    browser = await puppeteer.launch({ headless: true });
    const page = await browser.newPage();
    await page.goto('https://www.primevideo.com/-/fr/movie');
    await page.waitForSelector('h1');
    

    // 🔽 SCROLLER EN BAS DE PAGE
    await page.evaluate(async () => {
        await new Promise((resolve) => {
            let totalHeight = 0;
            const distance = 100;
            const timer = setInterval(() => {
                const scrollHeight = document.body.scrollHeight;
                window.scrollBy(0, distance);
                totalHeight += distance;
                
                if (totalHeight >= scrollHeight) {
                    clearInterval(timer);
                    resolve();
                }
            }, 100);
        });
    });
    
    // Attendre que le contenu chargé
    await new Promise(resolve => setTimeout(resolve, 2000));

    // --- ÉTAPE 1 : Récupérer les 10 premiers films titre, poster, logo, detailsPageUrl--
    const top10Movies = await page.evaluate(() => {
        
        // 1. Trouver la section du Top 10
        const headings = Array.from(document.querySelectorAll('section h2 span span'));
        //on console.log le texte de chaque heading
        headings.forEach(h => {
            console.log("Heading: " + h.textContent.trim());
        });

        // Nettoyer le texte avant de comparer
        const top10Heading = Array.from(document.querySelectorAll('section h2')).find(h => {
            const cleanText = h.textContent.replace(/\s+/g, ' ').trim();
            return cleanText.includes('Top 10 des films');
        });


        //const top10Heading = headings.find(h => h.textContent.trim() === "Top 10 des films en France");
        const topSection = top10Heading?.closest('section[data-testid="charts-container"]');
        if (!topSection) {
            return [];
        }

              // 2. Récupérer tous les éléments de film (li) dans cette section
        const movieItems = topSection.querySelectorAll('ul li');
        const moviesData = [];
        // 2. On récupère les éléments de la liste uniquement à l'intérieur de cette section
              // Itérer sur chaque élément de film
        movieItems.forEach((item, index) => {
            // Trouver l'article à l'intérieur du li
            const article = item.querySelector('article');
            if (!article) return;

            // --- Extraire les données ---

            // TITRE (title) : depuis l'attribut data-card-title de l'article
            const title = article.getAttribute('data-card-title') || '';

            // URL DE L'IMAGE (poster) : depuis l'image principale de la carte
            const posterImage = article.querySelector('.BVySw9 img');
            const poster = posterImage ? posterImage.src : '';

            // LIEN DE LA PAGE DETAILL (detailsPageUrl)
            const detailLink = article.querySelector('a[href*="/-/fr/detail/"]');
            const detailsPageUrl = detailLink ? detailLink.href : '';

            // Ajouter l'objet film au tableau
            moviesData.push({
            id: index + 1,
            title: title,
            poster: poster,
            detailsPageUrl: detailsPageUrl,
            });
        });
        return moviesData;
    });
      
    console.log(top10Movies);

    // --- ÉTAPE 2 : Aller sur la page de détail pour récupérer year, genre, duration ---
    for (let i = 0; i < top10Movies.length; i++) {
        const movie = top10Movies[i];
        console.log(`[${i+1}/${top10Movies.length}] Métadonnées Amazon de : ${movie.title}...`);
        
        if (!movie.detailsPageUrl) { continue;}


        await page.goto(movie.detailsPageUrl, { waitUntil: 'domcontentloaded' });
        const meta = await page.evaluate(() => {
            const year = document
                .querySelector('[data-automation-id="release-year-badge"]')
                ?.textContent?.trim() || null;

            let duration = document
                .querySelector('[data-automation-id="runtime-badge"]')
                ?.textContent?.trim() || null;
            //on retire les espaces comme  
            duration = duration.replace(/\s/g, '');
            //on rajoute un espace après le h
            duration = duration.replace('h', 'h ');


            const genre =
                document.querySelector('[data-testid="dv-node-dp-genres"] [data-testid="genre-texts"] a')?.textContent?.trim() || null;
            const description = document.querySelector('[data-testid="dp-atf-synopsis"]')?.textContent?.trim() || null;

            return { year, genre, duration, description };
        });
        movie.year = meta.year;
        movie.genre = meta.genre;
        movie.duration = meta.duration;
        movie.description = meta.description;
    }

    // --- ÉTAPE 3 : Aller sur allocine pour chaque film ---
    for (let i = 0; i < top10Movies.length; i++) {
        const movie = top10Movies[i];
        // si title est vide on passe au suivant
        if (!movie.title) { continue; }

        console.log(`[${i+1}/${top10Movies.length}] Recherche Allociné de : ${movie.title}...`);

        try {
            const searchUrl = `https://www.allocine.fr/rechercher/movie/?q=${encodeURIComponent(movie.title)}`;
            await page.goto(searchUrl, { waitUntil: 'domcontentloaded' });

            // --- BLOC COOKIES ISOLÉ ---
            // Ce bloc s'exécute, s'il échoue (cookie absent), il passe directement à la suite sans bloquer le film
            try {
                const cookieButtonSelector = 'span.jad_cmp_paywall_cta-cookies';
                // On réduit le timeout à 2000ms (2s) car si la modale doit apparaître, elle est instantanée
                await page.waitForSelector(cookieButtonSelector, { timeout: 2000 });
                await page.click(cookieButtonSelector);
                console.log("Modale de cookies acceptée !");
                await new Promise(resolve => setTimeout(resolve, 500)); // Pause rapide
            } catch (cookieError) {
                console.log("Pas de modale de cookies affichée sur cette page.");
            }

            // C'est Puppeteer qui va exécuter ce qui est à l'intérieur de evaluate() sur la page web
            const details = await page.evaluate((fallbackTitle, targetYear) => {
                //-- fonctions utilisées --
                const normalizeTitle = (str) =>
                    (str || '')
                        .normalize('NFD')
                        .replace(/[\u0300-\u036f]/g, '')
                        .toLowerCase()
                        .trim();

                const getCardTitle = (card) =>
                    card.querySelector('h2.meta-title .meta-title-link, h2.meta-title a.meta-title-link')
                        ?.textContent?.trim() || '';

                const getCardYear = (card) => {
                    const metaInfo = card.querySelector('.meta-body-info')?.textContent || '';
                    return metaInfo.match(/\b(19|20)\d{2}\b/)?.[0] || null;
                };

                const getPageUrl = (card) => {
                    const titleLink = card.querySelector('h2.meta-title a.meta-title-link');
                    if (titleLink?.href) return titleLink.href;

                    const obfuscatedEl = card.querySelector('h2.meta-title .meta-title-link, .thumbnail-link');
                    const encodedClass = obfuscatedEl?.className?.split(' ').find(c => c.startsWith('ACr'));
                    if (encodedClass) {
                        const path = atob(encodedClass.substring(3));
                        return path.startsWith('http') ? path : `https://www.allocine.fr${path}`;
                    }

                    return card.querySelector('a[href*="fichefilm"]')?.href || null;
                };

                const titleMatches = (card) =>
                    normalizeTitle(getCardTitle(card)) === normalizeTitle(fallbackTitle);

                // -- logique pour trouver le bon film --
                const cards = Array.from(document.querySelectorAll('div.card.entity-card'));

                const findMatchingCard = (yearToMatch) =>
                    cards.find(card =>
                        titleMatches(card) &&
                        (!yearToMatch || getCardYear(card) === String(yearToMatch))
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
                    mainCard = cards.find(card => titleMatches(card));
                }

                if (!mainCard) {
                    return { title: fallbackTitle, pageInfosUrl: null, matchedYear: null };
                }

                const imgVertical = mainCard.querySelector('img.thumbnail-img')?.getAttribute('data-src') || "";

                const titleElem = mainCard.querySelector('h2.meta-title .meta-title-link, h2.meta-title a.meta-title-link');
                const title = titleElem ? titleElem.textContent.trim() : fallbackTitle;

                const descElem = mainCard.querySelector('div.content-txt');
                const description = descElem ? descElem.textContent.trim() : "Non trouvée";

                const starElements = mainCard.querySelectorAll('div.meta-body-actor a');
                const starsList = [];

                starElements.forEach(el => {
                    const name = el.textContent.trim();
                    if (name && !starsList.includes(name) && el.href.includes('/personne/')) {
                        starsList.push(name);
                    }
                });

                const pageInfosUrl = getPageUrl(mainCard);

                return { title, description, stars: starsList, imgVertical, pageInfosUrl, matchedYear };
            }, movie.title, movie.year);

            // si description est vide on passe au suivanteeE
            if (!details.pageInfosUrl) {
                const yearsTested = movie.year
                    ? `${movie.year}, ${Number(movie.year) - 1}, ${Number(movie.year) + 1}`
                    : 'aucune (titre seul)';
                console.log(`Aucun résultat AlloCiné pour "${movie.title}" (années testées : ${yearsTested}), passage au suivant.`);
                continue;
            }

            if (details.matchedYear && details.matchedYear !== String(movie.year)) {
                console.log(`Correspondance AlloCiné trouvée avec l'année ${details.matchedYear} (au lieu de ${movie.year}) pour "${movie.title}".`);
            }

            // On enrichit l'objet movie existant
            movie.title = details.title;
            movie.description = details.description;
            movie.stars = details.stars;
            movie.imgVertical = details.imgVertical;
            movie.pageInfosUrl = details.pageInfosUrl;

            await page.goto(movie.pageInfosUrl, { waitUntil: 'domcontentloaded' });
            const detailsInfos = await page.evaluate(() => {
                const genreElements = document.querySelectorAll('div.card.entity-card .meta-body-info a');
                const genresList = [];
                genreElements.forEach(el => {
                    const genre = el.textContent.trim();
                    if (genre && !genresList.includes(genre)) {
                        genresList.push(genre);
                    }
                });

                const originCountry = document.querySelector('div.card.entity-card div.meta-body-item.meta-body-nationality a') ?.textContent.trim() || "";   

                //  Extraction de l'ID Dailymotion et génération de l'URL
                let trailerUrl = "";
                const playerElement = document.querySelector('figure.player');
                if (playerElement) {
                    const rawData = playerElement.getAttribute('data-model');
                    if (rawData) {
                        try {
                            const data = JSON.parse(rawData);
                            const idDailymotion = data?.videos?.[0]?.idDailymotion;
                            if (idDailymotion) {
                                // On reconstruit l'URL complète avec l'identifiant extrait
                                trailerUrl = `https://www.dailymotion.com/video/${idDailymotion}`;
                            }
                        } catch (e) {
                            // Erreur JSON optionnelle
                        }
                    }
                }


                return { originCountry: originCountry, trailerUrl: trailerUrl};
            });

            movie.genres = detailsInfos.genres;
            movie.originCountry = detailsInfos.originCountry;
            movie.trailerUrl = detailsInfos.trailerUrl;


        } catch (error) {
            console.error(`Impossible de récupérer les infos allocine pour "${movie.title}":`, error.message);
            movie.description = "";
            movie.stars = [];
            movie.imgVertical = "";
            movie.trailerUrl = "";
        }
        // Petit temps de pause pour être poli avec les serveurs d'allocine et éviter d'être bloqué
        await new Promise(resolve => setTimeout(resolve, 1000));
    }

        console.log(top10Movies);

         saveSnapshot('amazon-movies.json', top10Movies);


} catch (error) {
    console.error('Erreur lors du scraping :', error);
} finally {
    if (browser) {
        await browser.close();
        console.log('Navigateur fermé.');
    }
}
/* on importe pupeteer*/
import puppeteer from 'puppeteer';
import { saveSnapshot } from '../utils/saveSnapshot.mjs';

let browser;
try {
    browser = await puppeteer.launch({ 
        headless: true,
        args: [
            '--no-sandbox',
            '--disable-setuid-sandbox',
            '--disable-blink-features=AutomationControlled' 
        ]
    });
    
    const page = await browser.newPage();
    await page.goto('https://tv.apple.com/fr');
    await page.waitForSelector('h1');
    const title = await page.$eval('h1', el => el.textContent);
    console.log(title);

    // --- ÉTAPE 1 : Récupérer les 10 premiers series titre, poster, logo, detailsPageUrl---
    const top10Movies = await page.evaluate(() => {
        // 1. On trouve tous les h2 de la page
        const headings = Array.from(document.querySelectorAll('h2'));
        
        // 2. On cherche celui qui contient "Top 10 : films" (on nettoie les espaces éventuels)
        const top10Heading = headings.find(h => h.textContent.trim() === "Top 10 : séries");
        
        if (!top10Heading) {
          return []; // Retourne un tableau vide si la section n'est pas trouvée
        }
      
        // 3. On remonte au conteneur le plus proche qui englobe le titre ET la liste (souvent un <section> ou une div parente)
        const shelfSection = top10Heading.closest('div.section') || top10Heading.parentElement;
      
        // 4. On récupère les éléments de la liste uniquement à l'intérieur de cette section
        const items = shelfSection.querySelectorAll('.shelf-grid__list-item');
      
        // 5. On extrait les données des éléments (limité à 10 par sécurité)
        return Array.from(items).slice(0, 10).map((item, index) => {
            const posterSrcset = item.querySelector('[data-testid="artwork"] source[type="image/webp"]')?.getAttribute('srcset');
            const poster = posterSrcset ? posterSrcset.split(' ')[0] : null;
      
            const logoSrcset = item.querySelector('[data-testid="logo"] source[type="image/webp"]')?.getAttribute('srcset');
            const logo = logoSrcset ? logoSrcset.split(' ')[0] : null;
      
            const genre = item.querySelector('[data-testid="caption"]')?.textContent || null;

            const rawTitle = item.querySelector('[data-testid="logo"] img')?.getAttribute('alt') || null;
            // Si rawTitle existe, on le coupe au niveau du premier ":" et on prend la première partie, sinon null
            const title = rawTitle ? rawTitle.split(':')[0].trim() : null;


            const detailsPageUrl = item.querySelector('a')?.getAttribute('href') || null;
            return { id: index + 1, title, poster, logo, genre, detailsPageUrl };
        });
    });
      
    console.log(top10Movies);

    // --- ÉTAPE 2 : Aller sur la page de détail de chaque série  pour récupérer les infos : year ---
    for (let i = 0; i < top10Movies.length; i++) {
        const movie = top10Movies[i];
        console.log(`[${i+1}/${top10Movies.length}] Recherche de l'année de sortie de : ${movie.title}...`);
        
        if (!movie.detailsPageUrl) { continue;}


        await page.goto(movie.detailsPageUrl, { waitUntil: 'domcontentloaded' });
        const year = await page.evaluate(() => {
            return document
                .querySelector('.details [data-testid="metadata-list"] span:first-child')
                ?.textContent?.trim() || null;
        });
        movie.year = year;
    }

    // --- ÉTAPE 3 : Aller sur allocine pour chaque serie ---
    for (let i = 0; i < top10Movies.length; i++) {
        const movie = top10Movies[i];
        // si title est vide on passe au suivant
        if (!movie.title) { continue; }

        console.log(`[${i+1}/${top10Movies.length}] Recherche Allociné de : ${movie.title}...`);

        try {
            const searchUrl = `https://www.allocine.fr/rechercher/series/?q=${encodeURIComponent(movie.title)}`;
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
            const details = await page.evaluate((fallbackTitle) => {
                const firstResultSelector = 'div.card.entity-card';
                const mainCard = document.querySelector(firstResultSelector);
                
                // Sécurité au cas où la carte n'est pas trouvée
                if (!mainCard) {
                    return { title: fallbackTitle, description: "Non trouvée", pageInfosUrl: null };
                }
                // Extraction de l'URL de l'image
                const imgVertical = document.querySelector('div.card.entity-card img.thumbnail-img')?.getAttribute('data-src') || "";
                
                // Extraction du titre
                const titleElem = document.querySelector('div.meta h2.meta-title a.meta-title-link');
                const title = titleElem ? titleElem.textContent.trim() : "Non trouvé";
                // 1. Extraction de la description
                const descElem = mainCard.querySelector('div.content-txt');
                const description = descElem ? descElem.textContent.trim() : "Non trouvée";
                
                // 2. Récupération des stars
                const starElements = mainCard.querySelectorAll('div.meta-body-actor a');
                const starsList = [];
                
                starElements.forEach(el => {
                    const name = el.textContent.trim();
                    // Attention : sur AlloCiné l'URL contient '/personne/' et non '/name/' !
                    if (name && !starsList.includes(name) && el.href.includes('/personne/')) {
                        starsList.push(name);
                    }
                });

                const pageInfosUrl = titleElem ? titleElem.href : null;
                

                return { title, description, stars: starsList, imgVertical: imgVertical, pageInfosUrl: pageInfosUrl };
            }, movie.title);

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
                
                const originCountry = document.querySelector('div.card.entity-card div.meta-body-item.meta-body-nationality a') ?.textContent.trim() || "";
                const nbSaisons = document.querySelector('section#synopsis-details div.stats-numbers-row-item div.stats-item') ?.textContent.trim() || "";
                const nbEpisodes = document.querySelector('section#synopsis-details div.stats-numbers-row-item:nth-child(2) div.stats-item') ?.textContent.trim() || "";
                
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


                return { originCountry: originCountry, nbSaisons: nbSaisons, nbEpisodes: nbEpisodes, trailerUrl: trailerUrl};
            });

            
            movie.originCountry = detailsInfos.originCountry;
            movie.nbSaisons = detailsInfos.nbSaisons;
            movie.nbEpisodes = detailsInfos.nbEpisodes;
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

         saveSnapshot('apple-series.json', top10Movies);


} catch (error) {
    console.error('Erreur lors du scraping :', error);
} finally {
    if (browser) {
        await browser.close();
        console.log('Navigateur fermé.');
    }
}
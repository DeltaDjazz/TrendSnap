import puppeteer from 'puppeteer';
import { saveSnapshot } from '../utils/saveSnapshot.mjs';

async function run() {
    // 1. Lancer le navigateur en mode background (headless: true)
    //const browser = await puppeteer.launch({ headless: true });
    const browser = await puppeteer.launch({ 
        headless: true,
        args: [
            '--no-sandbox',
            '--disable-setuid-sandbox',
            '--disable-blink-features=AutomationControlled' 
        ]
    });
    
    const page = await browser.newPage();
    await page.setViewport({ width: 1366, height: 768 });
    
    // Le petit "plus" pour tromper les scripts d'IMDb :
    await page.evaluateOnNewDocument(() => {
        Object.defineProperty(navigator, 'webdriver', {
            get: () => undefined,
        });
    });

    try {
        // 2. Naviguer vers l'URL cible (remplacez par votre URL)
        console.log("Navigation vers la page cible...");
        await page.goto('https://www.netflix.com/tudum/top10/france', { waitUntil: 'domcontentloaded' });
        
        console.log("Extraction des données...");
        const movies = await page.evaluate(() => {
            const rows = document.querySelectorAll('section.medCard table tr');
            const dataTable = [];
            
            rows.forEach((row) => {
                // On cible le premier <td> qui contient la classe "title"
                const titleCell = row.querySelector('td.title');
                
                // Si la ligne ne contient pas cette cellule (ex: ligne d'entête th), on passe à la suivante
                if (!titleCell) return;
        
                // 2. Extraction du id (le texte dans la classe .id)
                const id = titleCell.querySelector('.rank')?.textContent.trim() || "";
        
                // 3. Extraction de l'URL de l'image (l'attribut src de la balise img)
                const imageUrl = titleCell.querySelector('img')?.src || "";
        
                // 4. Extraction et découpage du texte du bouton
                const fullButtonText = titleCell.querySelector('button')?.textContent.trim() || "";
                
                let title = fullButtonText;
        
                // Si le texte contient un ":", on le sépare en deux
                if (fullButtonText.includes(':')) {
                    const parts = fullButtonText.split(':');
                    title = parts[0].trim(); // Ce qu'il y a avant le ":"
                }
        
                //const detailsPageUrl = titleCell.querySelector('a')?.getAttribute('href') || null;

                // 5. Ajout des données structurées dans notre tableau
                dataTable.push({
                    id: parseInt(id),
                    poster: imageUrl,
                    title: title
                });
            });
            
            return dataTable;
        });


        // --- ÉTAPE 2 : Aller sur allocine pour chaque movie ---
        for (let i = 0; i < movies.length; i++) {
            const movie = movies[i];
            console.log(`[${i+1}/${movies.length}] Recherche Allociné de : ${movie.title}...`);

            try {
                // Utilisation de l'URL de recherche directe d'allocine
                const searchUrl = `https://www.allocine.fr/rechercher/movie/?q=${encodeURIComponent(movie.title)}`;
                await page.goto(searchUrl, { waitUntil: 'domcontentloaded' });

                // --- BLOC COOKIES ISOLÉ ---
                // Ce bloc s'exécute, s'il échoue (cookie absent), il passe directement à la suite sans bloquer le movie
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

                /*

                const img = await page.$('div.card.entity-card img.thumbnail-img');
                const html = await page.evaluate(el => el.outerHTML, img);
                console.log(html);

                */
                // C'est Puppeteer qui va exécuter ce qui est à l'intérieur de evaluate() sur la page web
                const details = await page.evaluate(() => {
                    const firstResultSelector = 'div.card.entity-card';
                    const mainCard = document.querySelector(firstResultSelector);
                    
                    // Sécurité au cas où la carte n'est pas trouvée
                    if (!mainCard) {
                        return { title: movie.title, description: "Non trouvée", pageInfosUrl: null };
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
                });

                // si description est vide on passe au suivanteeE
                if (!details.pageInfosUrl) {
                    console.log(`Aucun résultat AlloCiné pour "${movie.title}", passage au suivant.`);
                    continue;
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


                    return { genres: genresList, originCountry: originCountry, trailerUrl: trailerUrl};
                });

                movie.genres = detailsInfos.genres;
                movie.originCountry = detailsInfos.originCountry;
                movie.trailerUrl = detailsInfos.trailerUrl;

            } catch (err) {
                console.error(`Impossible de récupérer les infos allocine pour "${movie.title}":`, err.message);
                movie.description = "";
                movie.stars = [];
                movie.imgVertical = "";
                movie.trailerUrl = "";
            }

            // Petit temps de pause pour être poli avec les serveurs d'IMDb
            await new Promise(resolve => setTimeout(resolve, 1000));
        }
        console.log(movies);

        saveSnapshot('netflix-movies.json', movies);
        

    } catch (error) {
        console.error("Une erreur est survenue pendant le scraping :", error);
    } finally {
        // 6. Toujours fermer le navigateur
        await browser.close();
        console.log("Navigateur fermé.");
    }
}

run();
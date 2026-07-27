import { saveSnapshot } from '../utils/saveSnapshot.mjs';
import { enrichListFromAllocine } from '../utils/allocine.mjs';
import { launchBrowser, preparePage } from '../utils/puppeteer.mjs';

async function run() {
    const browser = await launchBrowser();
    const page = await preparePage(browser);

    try {
        console.log('Navigation vers la page cible...');
        await page.goto('https://www.netflix.com/tudum/top10/france/tv', { waitUntil: 'domcontentloaded' });

        console.log('Extraction des données...');
        const movies = await page.evaluate(() => {
            const rows = document.querySelectorAll('section.medCard table tr');
            const dataTable = [];

            rows.forEach((row) => {
                const titleCell = row.querySelector('td.title');
                if (!titleCell) return;

                const id = titleCell.querySelector('.rank')?.textContent.trim() || '';
                const imageUrl = titleCell.querySelector('img')?.src || '';
                const fullButtonText = titleCell.querySelector('button')?.textContent.trim() || '';
                let title = fullButtonText;

                if (fullButtonText.includes(':')) {
                    title = fullButtonText.split(':')[0].trim();
                }

                dataTable.push({
                    id: parseInt(id),
                    poster: imageUrl,
                    title,
                });
            });

            return dataTable;
        });

        await enrichListFromAllocine(page, movies, {
            type: 'series',
            searchMode: 'simple',
            ficheMode: 'series-full',
            errorDefaults: {
                description: '',
                stars: [],
                imgVertical: '',
                trailerUrl: '',
            },
        });

        console.log(movies);
        saveSnapshot('netflix-series.json', movies);
    } catch (error) {
        console.error('Une erreur est survenue pendant le scraping :', error);
    } finally {
        await browser.close();
        console.log('Navigateur fermé.');
    }
}

run();

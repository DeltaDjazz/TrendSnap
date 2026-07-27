import { saveSnapshot } from '../utils/saveSnapshot.mjs';
import { enrichListFromAllocine } from '../utils/allocine.mjs';
import { launchBrowser, scrollPageToBottom, sleep } from '../utils/puppeteer.mjs';

let browser;
try {
    browser = await launchBrowser();
    const page = await browser.newPage();
    await page.goto('https://www.primevideo.com/-/fr/movie');
    await page.waitForSelector('h1');

    await scrollPageToBottom(page);
    await sleep(2000);

    const top10Movies = await page.evaluate(() => {
        const top10Heading = Array.from(document.querySelectorAll('section h2')).find((h) => {
            const cleanText = h.textContent.replace(/\s+/g, ' ').trim();
            return cleanText.includes('Top 10 des films');
        });

        const topSection = top10Heading?.closest('section[data-testid="charts-container"]');
        if (!topSection) return [];

        const movieItems = topSection.querySelectorAll('ul li');
        const moviesData = [];

        movieItems.forEach((item, index) => {
            const article = item.querySelector('article');
            if (!article) return;

            const title = article.getAttribute('data-card-title') || '';
            const posterImage = article.querySelector('.BVySw9 img');
            const poster = posterImage ? posterImage.src : '';
            const detailLink = article.querySelector('a[href*="/-/fr/detail/"]');
            const detailsPageUrl = detailLink ? detailLink.href : '';

            moviesData.push({
                id: index + 1,
                title,
                poster,
                detailsPageUrl,
            });
        });

        return moviesData;
    });

    console.log(top10Movies);

    for (let i = 0; i < top10Movies.length; i++) {
        const movie = top10Movies[i];
        console.log(`[${i + 1}/${top10Movies.length}] Métadonnées Amazon de : ${movie.title}...`);

        if (!movie.detailsPageUrl) continue;

        await page.goto(movie.detailsPageUrl, { waitUntil: 'domcontentloaded' });
        const meta = await page.evaluate(() => {
            const year =
                document.querySelector('[data-automation-id="release-year-badge"]')?.textContent?.trim() ||
                null;

            let duration =
                document.querySelector('[data-automation-id="runtime-badge"]')?.textContent?.trim() ||
                null;
            duration = duration.replace(/\s/g, '');
            duration = duration.replace('h', 'h ');

            const genre =
                document
                    .querySelector('[data-testid="dv-node-dp-genres"] [data-testid="genre-texts"] a')
                    ?.textContent?.trim() || null;
            const description =
                document.querySelector('[data-testid="dp-atf-synopsis"]')?.textContent?.trim() || null;

            return { year, genre, duration, description };
        });

        movie.year = meta.year;
        movie.genre = meta.genre;
        movie.duration = meta.duration;
        movie.description = meta.description;
    }

    await enrichListFromAllocine(page, top10Movies, {
        type: 'movie',
        searchMode: 'matchYear',
        ficheMode: 'movie-meta',
        errorDefaults: {
            description: '',
            stars: [],
            imgVertical: '',
            trailerUrl: '',
        },
    });

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

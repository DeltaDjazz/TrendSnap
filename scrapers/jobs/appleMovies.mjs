import { saveSnapshot } from '../utils/saveSnapshot.mjs';
import { enrichListFromAllocine } from '../utils/allocine.mjs';
import { launchBrowser } from '../utils/puppeteer.mjs';

let browser;
try {
    browser = await launchBrowser();
    const page = await browser.newPage();
    await page.goto('https://tv.apple.com/fr');
    await page.waitForSelector('h1');
    const title = await page.$eval('h1', (el) => el.textContent);
    console.log(title);

    const top10Movies = await page.evaluate(() => {
        const headings = Array.from(document.querySelectorAll('h2'));
        const top10Heading = headings.find((h) => h.textContent.trim() === 'Top 10 : films');

        if (!top10Heading) return [];

        const shelfSection = top10Heading.closest('div.section') || top10Heading.parentElement;
        const items = shelfSection.querySelectorAll('.shelf-grid__list-item');

        return Array.from(items)
            .slice(0, 10)
            .map((item, index) => {
                const posterSrcset = item
                    .querySelector('[data-testid="artwork"] source[type="image/webp"]')
                    ?.getAttribute('srcset');
                const poster = posterSrcset ? posterSrcset.split(' ')[0] : null;

                const logoSrcset = item
                    .querySelector('[data-testid="logo"] source[type="image/webp"]')
                    ?.getAttribute('srcset');
                const logo = logoSrcset ? logoSrcset.split(' ')[0] : null;

                const rawTitle = item.querySelector('[data-testid="logo"] img')?.getAttribute('alt') || null;
                const title = rawTitle ? rawTitle.split(':')[0].trim() : null;
                const genre = item.querySelector('[data-testid="caption"]')?.textContent || null;
                const detailsPageUrl = item.querySelector('a')?.getAttribute('href') || null;

                return { id: index + 1, title, poster, logo, genre, detailsPageUrl };
            });
    });

    console.log(top10Movies);

    for (let i = 0; i < top10Movies.length; i++) {
        const movie = top10Movies[i];
        console.log(`[${i + 1}/${top10Movies.length}] Recherche de l'année de sortie de : ${movie.title}...`);

        if (!movie.detailsPageUrl) continue;

        await page.goto(movie.detailsPageUrl, { waitUntil: 'domcontentloaded' });
        const year = await page.evaluate(() => {
            return (
                document
                    .querySelector('.details [data-testid="metadata-list"] span:first-child')
                    ?.textContent?.trim() || null
            );
        });
        movie.year = year;
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
    saveSnapshot('apple-movies.json', top10Movies);
} catch (error) {
    console.error('Erreur lors du scraping :', error);
} finally {
    if (browser) {
        await browser.close();
        console.log('Navigateur fermé.');
    }
}

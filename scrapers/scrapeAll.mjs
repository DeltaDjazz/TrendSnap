const scrapeNetflixMovies = require("./jobs/netflixMovies.mjs");
const scrapeNetflixSeries = require("./jobs/netflixSeries.mjs");

const scrapeAmazonMovies = require("./jobs/amazonMovies.mjs");
const scrapeAmazonSeries = require("./jobs/amazonSeries.mjs");

const scrapeAppleMovies = require("./jobs/appleMovies.mjs");
const scrapeAppleSeries = require("./jobs/appleSeries.mjs");


async function runScrapers() {

    console.log("🚀 Début du scraping TrendSmart\n");

    const scrapers = [
        {
            name: "Netflix Films",
            run: scrapeNetflixMovies
        },
        {
            name: "Netflix Séries",
            run: scrapeNetflixSeries
        },
        {
            name: "Amazon Films",
            run: scrapeAmazonMovies
        },
        {
            name: "Amazon Séries",
            run: scrapeAmazonSeries
        },
        {
            name: "Apple Films",
            run: scrapeAppleMovies
        },
        {
            name: "Apple Séries",
            run: scrapeAppleSeries
        }
    ];


    const results = {};

    for (const scraper of scrapers) {

        try {
            console.log(`\n▶ ${scraper.name}`);

            results[scraper.name] = await scraper.run();

            console.log(
                `✅ ${scraper.name}: ${results[scraper.name].length} éléments`
            );

        } catch(error) {

            console.error(
                `❌ Erreur ${scraper.name}:`,
                error.message
            );

            results[scraper.name] = [];
        }
    }


    console.log("\n🎉 Scraping terminé");

    return results;
}


runScrapers();
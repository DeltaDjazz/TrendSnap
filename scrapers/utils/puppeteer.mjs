import puppeteer from 'puppeteer';

const BROWSER_ARGS = [
    '--no-sandbox',
    '--disable-setuid-sandbox',
    '--disable-blink-features=AutomationControlled',
];

export function sleep(ms) {
    return new Promise((resolve) => setTimeout(resolve, ms));
}

export async function launchBrowser() {
    return puppeteer.launch({
        headless: true,
        args: BROWSER_ARGS,
    });
}

export async function preparePage(browser, { userAgent = false } = {}) {
    const page = await browser.newPage();
    await page.setViewport({ width: 1366, height: 768 });
    await page.evaluateOnNewDocument(() => {
        Object.defineProperty(navigator, 'webdriver', {
            get: () => undefined,
        });
    });

    if (userAgent) {
        await page.setUserAgent(
            'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
        );
    }

    return page;
}

export async function scrollPageToBottom(page) {
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
}

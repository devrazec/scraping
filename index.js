import puppeteer from 'puppeteer-extra';
import pluginStealth from 'puppeteer-extra-plugin-stealth';
import pluginAdblocker from 'puppeteer-extra-plugin-adblocker';
import pluginAnonymize from 'puppeteer-extra-plugin-anonymize-ua';
import pluginPreferences from 'puppeteer-extra-plugin-user-preferences';
import fs from 'fs';
import { setTimeout as delay } from 'node:timers/promises';

(async () => {

    console.log('01 - Starting Robot!');

    puppeteer.use(pluginAdblocker({ blockTrackers: true }));
    puppeteer.use(pluginStealth());
    puppeteer.use(pluginAnonymize());
    puppeteer.use(pluginPreferences({
        userPrefs: {
            webkit: { webprefs: { default_font_size: 16 } }
        }
    }));

    console.log('02 - Enable Puppeteer Plugins!');

    const browser = await puppeteer.launch({
        headless: false,
        args: [
            '--start-maximized',
            '--no-sandbox',
            '--window-size=600,700'
        ]
    });

    console.log('03 - Setup Chrome Browser!');

    const page = await browser.newPage();
    const websiteUrl = 'https://www.leyaonline.com/pt/livros/';

    await page.goto(websiteUrl, { waitUntil: 'networkidle2' });
    await page.waitForSelector('.book-card');

    console.log('04 - Open Website Url!');

    // ---------- LOAD MORE LOGIC ----------
    async function clickLoadMore() {
        const buttonSelector = '.load-more-btn a.vermaisajax';
        const spinnerSelector = '.load-more-btn img.loading';

        const exists = await page.$(buttonSelector);
        if (!exists) return false;

        const previousCount = await page.$$eval('.book-card', els => els.length);

        // Scroll button into view
        await page.evaluate(selector => {
            document.querySelector(selector)?.scrollIntoView({
                behavior: 'auto',
                block: 'center'
            });
        }, buttonSelector);

        await delay(500);

        // Click via DOM (required by site)
        await page.evaluate(selector => {
            const btn = document.querySelector(selector);
            if (!btn) return;
            btn.click();
        }, buttonSelector);

        try {
            // 1️⃣ Wait for spinner to appear (means AJAX started)
            await page.waitForFunction(
                sel => {
                    const el = document.querySelector(sel);
                    return el && getComputedStyle(el).display !== 'none';
                },
                { timeout: 5000 },
                spinnerSelector
            );

            // 2️⃣ Wait for spinner to disappear (means AJAX finished)
            await page.waitForFunction(
                sel => {
                    const el = document.querySelector(sel);
                    return el && getComputedStyle(el).display === 'none';
                },
                { timeout: 15000 },
                spinnerSelector
            );

            // 3️⃣ Wait until new books are actually added
            await page.waitForFunction(
                prev => document.querySelectorAll('.book-card').length > prev,
                { timeout: 10000 },
                previousCount
            );

            return true;
        } catch {
            return false;
        }
    }

    const MAX_BOOKS = 1000;

    while (true) {
        const count = await page.$$eval('.book-card', els => els.length);

        if (count >= MAX_BOOKS) {
            console.log(`Reached limit of ${MAX_BOOKS} books`);
            break;
        }

        const loaded = await clickLoadMore();
        if (!loaded) {
            console.log('No more books to load');
            break;
        }

        console.log(`Loaded more books (${count})`);
        await delay(500);
    }


    console.log('All books loaded');

    // ---------- SCRAPE ----------
    const bookList = await page.evaluate(() => {
        return Array.from(document.querySelectorAll('.book-card')).map((card, index) => {
            const priceNode = card.querySelector('.single-book-price h6');
            const cleanPrice = priceNode
                ? priceNode.cloneNode(true).childNodes[0]?.textContent.trim()
                : null;

            const domId = card.getAttribute('id');
            const productId = domId?.replace('bookcard_', '') ?? null;

            return {
                id: index + 1,
                domId,           // "bookcard_130678"
                productId,       // "130678"
                title: card.querySelector('.book-title')?.innerText.trim() ?? null,
                author: card.querySelector('.book-author')?.innerText.trim() ?? null,
                price: cleanPrice,
                originalPrice: card.querySelector('.cut-price')?.innerText.trim() ?? null,
                discount: card.querySelector('.tag-discount')?.innerText.trim() ?? null,
                image: card.querySelector('img')?.src ?? null,
                url: card.querySelector('a.second')?.href ?? null
            };
        });
    });

    console.log(`05 - Scraped ${bookList.length} books`);

    const limitedBookList = bookList.slice(0, MAX_BOOKS);

    fs.writeFileSync(
        'book_list.json',
        JSON.stringify(limitedBookList, null, 2)
    );
    console.log('06 - Save List of Books in json File!');

    await browser.close();
    console.log('07 - Close Chrome Browser!');

})();

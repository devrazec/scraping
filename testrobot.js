import puppeteer from 'puppeteer-extra';
import pluginStealth from 'puppeteer-extra-plugin-stealth';
import pluginAdblocker from 'puppeteer-extra-plugin-adblocker';
import pluginAnonymize from 'puppeteer-extra-plugin-anonymize-ua';
import pluginPreferences from 'puppeteer-extra-plugin-user-preferences';
import fs from 'fs';
import { setTimeout } from "node:timers/promises";

const url = 'https://bot.sannysoft.com/';

(async () => {

    puppeteer.use(pluginAdblocker({
        blockTrackers: true
    }));

    puppeteer.use(pluginStealth());

    puppeteer.use(pluginAnonymize());

    puppeteer.use(pluginPreferences({
        userPrefs: {
            webkit: {
                webprefs: {
                    default_font_size: 16
                }
            }
        }
    }));

    const browser = await puppeteer.launch({
        headless: false,
        args: [
            '--start-maximized',
            '--no-sandbox',
            '--window-size=600,700'
        ]
    });

    // Create a new incognito browser context.
    //const context = await browser.createIncognitoBrowserContext();
    //const page = await context.newPage();
    
    // Create a new browser context
    const page = await browser.newPage();

    await page.goto(url, {
        waitUntil: [
            'load',
            'domcontentloaded',
            'networkidle0',
            'networkidle2'
        ]
    });

    //console.log(videoContent);

    //console.log(videoContent.length);

    //await browser.close()
})()
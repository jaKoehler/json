const puppeteer = require('puppeteer');
const port = 5174;
(async () => {
    const browser = await puppeteer.launch({args: ['--headless', '--use-gl=egl'], headless: false});

    const [page] = await browser.pages();

    await page.goto(`http://localhost:${port}/`);
    await page.content();

    const elements = await page.$$('#canvas');

    for (let i = 0; i < elements.length; i++) {
        try {
            await elements[i].screenshot({path: `./temp/${i}.png`});
        } catch (e) {
        }
    }

    await browser.close();
})();

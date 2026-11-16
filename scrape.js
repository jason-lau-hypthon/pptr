const puppeteer = require('puppeteer');

async function scrapeLanguage(target, language) {
  const browser = await puppeteer.launch({ headless: process.env.HEADLESS === 'true' });
  try {
    const page = await browser.newPage();
    await page.setViewport({ width: 1920, height: 1080 });
    await page.authenticate({ username: process.env.AIA_USER || 'AIA-HKIT', password: process.env.AIA_PASS || 'P@ssword!' });
    const response = await page.goto(`https://wwwuat2.aia.com.hk/${language}/products/further-product-information/${target.path}`, { waitUntil: 'domcontentloaded' });
    if (!response || !response.ok()) throw new Error(`Navigation failed: HTTP ${response?.status() ?? 'unknown'}`);
    for (const selector of ['#onetrust-accept-btn-handler', '.onetrust-close-btn-handler']) {
      const button = await page.$(selector);
      if (button && await button.isVisible()) { await button.click(); break; }
    }
    await page.waitForSelector('#flex-box-container select#select1 option');
    const products = await page.$$eval('#flex-box-container select#select1 option', options => options.map(option => option.textContent.trim()));
    const blocks = [];
    for (let i = 1; i < products.length; i++) {
      if (!products[i] || /^(select|please select|請選擇|请选择)/i.test(products[i])) continue;
      console.log(`[${language}] ${products[i]}`);
      await page.click('#flex-box-container .select-dropdown__button--0');
      const option = await page.waitForSelector(`#select-dropdown__list-0 li:nth-child(${i})`, { visible: true });
      await option.click();
      await page.click('#flex-box-container .cmp-x3__button');
      await page.waitForSelector('#cmp-modal-result-table-container .cmp-x3-modal .desktop-table', { visible: true });
      const extracted = await page.$eval('#cmp-modal-result-table-container .cmp-x3-modal', modal => {
        const tables = [...modal.querySelectorAll('.desktop-table')];
        const titles = [...modal.querySelectorAll('.cmp-title__text')];
        if (titles.length !== tables.length) throw new Error('Table and title counts differ');
        return tables.map((table, index) => ({
          title: titles[index].innerText,
          rows: [...table.querySelectorAll('tr')].map(row => [...row.children]
            .filter(cell => cell.matches('th, td'))
            .map(cell => ({ text: cell.innerText, header: cell.tagName === 'TH' || !!cell.closest('thead') }))),
        }));
      });
      if (!extracted.length) throw new Error(`No tables for ${products[i]}`);
      blocks.push(...extracted);
      await page.keyboard.press('Escape');
      await page.waitForSelector('#cmp-modal-result-table-container', { hidden: true });
    }
    if (!blocks.length) throw new Error('No products found');
    return blocks;
  } finally {
    await browser.close();
  }
}

module.exports = { scrapeLanguage };

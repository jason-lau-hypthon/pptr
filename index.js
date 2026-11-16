const puppeteer = require('puppeteer');

(async () => {
  const url =
    "https://wwwuat2.aia.com.hk/zh-cn/products/further-product-information/participating-products/total-cash-value-ratio";
  let resultTables = [];

  // Launch the browser and open a new blank page
  const browser = await puppeteer.launch({headless: false});
  const page = await browser.newPage();
  await page.setViewport({width: 1920, height: 1080});

  // Set credentials before navigation
  await page.authenticate({
    username: 'AIA-HKIT',
    password: 'P@ssword!'
  });

  // Navigate the page to a URL
  await page.goto(url, { waitUntil: 'domcontentloaded' });

  // Get all product
  await page.evaluate( () => {
    window.scrollTo(0, 500)
  });

  await new Promise(r => setTimeout(r, 10000));
  const products = await page.$$('#flex-box-container select#select1 option');

  // Get product table
  const dropdownSelectorElement = '#flex-box-container .select-dropdown__button--0';
  let dropdownSelector = await page.waitForSelector(dropdownSelectorElement);

  const buttonSelector = '#flex-box-container .cmp-x3__button';
  let showResultButton = await page.waitForSelector(buttonSelector);
  
 
  for(let i = 1; i <= products.length; i++) {
    await dropdownSelector.click();
    await new Promise(r => setTimeout(r, 500));

    let selectedOption = await page.waitForSelector(`::-p-xpath(//*[@id="select-dropdown__list-0"]/li[${i}])`);
    await selectedOption.click();
    await showResultButton.click();

    await new Promise(r => setTimeout(r, 500));
    await page.waitForSelector('#cmp-modal-result-table-container', {visible: true});
    let modalResultTableContainer = await page.$('#cmp-modal-result-table-container .cmp-x3-modal');

    let tables = await modalResultTableContainer.$$(".desktop-table");
    let titles = await modalResultTableContainer.$$(".cmp-title__text" );
    let index = 0;

    for(let table of tables) {
        let innerHtml = await table.evaluate(el => el.innerHTML);
        let innerTitleHtml = await titles[index].evaluate(el => el.innerHTML);
        resultTables.push(innerTitleHtml + innerHtml);
        index++;
    }
    
    await page.keyboard.press('Escape');
    await new Promise(r => setTimeout(r, 500));
  }
  
  
  console.log(resultTables.join("\n"));
  await browser.close();
})();
const ExcelJS = require('exceljs');

const sheets = { en: 'EN', 'zh-hk': 'TC', 'zh-cn': 'SC' };
const text = value => String(value ?? '').replace(/\u00a0/g, ' ').trim();

async function createWorkbook(blocksByLanguage) {
  const workbook = new ExcelJS.Workbook();
  for (const [language, name] of Object.entries(sheets)) {
    if (!blocksByLanguage[language]?.length) throw new Error(`No product blocks for ${language}`);
    const sheet = workbook.addWorksheet(name);
    for (const block of blocksByLanguage[language]) {
      sheet.addRow([text(block.title)]);
      for (const cells of block.rows) {
        const row = sheet.addRow(cells.map(cell => text(cell.text)));
        cells.forEach((cell, index) => {
          if (cell.header) row.getCell(index + 1).font = { bold: true };
        });
      }
    }
  }
  return Buffer.from(await workbook.xlsx.writeBuffer());
}

module.exports = { createWorkbook };

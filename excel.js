const ExcelJS = require('exceljs');

const sheets = { en: 'EN', 'zh-hk': 'TC', 'zh-cn': 'SC' };
const text = value => String(value ?? '').replace(/\u00a0/g, ' ').trim();
const border = Object.fromEntries(['top', 'left', 'bottom', 'right'].map(side => [side, {
  style: 'thin', color: { argb: 'FFD9DEE3' },
}]));

function layoutRows(rows) {
  const occupied = new Set();
  const cells = [];
  let width = 1;
  rows.forEach((row, rowIndex) => {
    let column = 1;
    for (const cell of row) {
      while (occupied.has(`${rowIndex}:${column}`)) column++;
      const rowSpan = cell.rowSpan || 1;
      const colSpan = cell.colSpan || 1;
      for (let r = rowIndex; r < rowIndex + rowSpan; r++) {
        for (let c = column; c < column + colSpan; c++) occupied.add(`${r}:${c}`);
      }
      cells.push({ ...cell, row: rowIndex + 1, column, rowSpan, colSpan });
      width = Math.max(width, column + colSpan - 1);
      column += colSpan;
    }
  });
  return { cells, width };
}

async function createWorkbook(blocksByLanguage) {
  const workbook = new ExcelJS.Workbook();
  for (const [language, name] of Object.entries(sheets)) {
    if (!blocksByLanguage[language]?.length) throw new Error(`No product blocks for ${language}`);
    const sheet = workbook.addWorksheet(name);
    sheet.views = [{ showGridLines: false }];
    for (const block of blocksByLanguage[language]) {
      const { cells, width } = layoutRows(block.rows);
      const titleRow = sheet.rowCount + 1;
      const title = sheet.getCell(titleRow, 1);
      title.value = text(block.title);
      title.font = { name: 'Arial', size: 14, bold: true, color: { argb: 'FF263746' } };
      title.alignment = { vertical: 'middle', wrapText: true };
      title.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFE8EEF3' } };
      sheet.getRow(titleRow).height = 36;
      if (width > 1) sheet.mergeCells(titleRow, 1, titleRow, width);
      for (const item of cells) {
        const row = titleRow + item.row;
        const cell = sheet.getCell(row, item.column);
        cell.value = text(item.text);
        cell.font = { name: 'Arial', size: 10, bold: !!item.header, color: { argb: 'FF263746' } };
        cell.alignment = { vertical: 'middle', wrapText: true };
        cell.border = border;
        if (item.header) cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFF1F4F6' } };
        if (item.rowSpan > 1 || item.colSpan > 1) {
          sheet.mergeCells(row, item.column, row + item.rowSpan - 1, item.column + item.colSpan - 1);
        }
      }
    }
    for (let column = 1; column <= sheet.columnCount; column++) {
      sheet.getColumn(column).width = column === 1 ? 30 : column === 2 ? 22 : column === 3 ? 16 : 22;
    }
  }
  return Buffer.from(await workbook.xlsx.writeBuffer());
}

module.exports = { createWorkbook };

const fs = require('node:fs/promises');
const path = require('node:path');
const readline = require('node:readline');
const { Writable } = require('node:stream');
const { parseArgs } = require('node:util');
const { languages, targets } = require('./targets');
const { createWorkbook } = require('./excel');
const { createZip } = require('./zip');
const { scrapeLanguage } = require('./scrape');

const outputRoot = path.join(__dirname, 'output');

function question(prompt, masked = false) {
  return new Promise((resolve, reject) => {
    if (!process.stdin.isTTY) return reject(new Error('Interactive input requires a terminal'));
    let mute = false;
    const output = new Writable({ write(chunk, encoding, callback) { process.stdout.write(mute ? '*'.repeat(chunk.toString().replace(/[\r\n]/g, '').length) : chunk); callback(); } });
    const rl = readline.createInterface({ input: process.stdin, output, terminal: true });
    rl.question(prompt, answer => { mute = false; rl.close(); if (masked) process.stdout.write('\n'); resolve(masked ? answer : answer.trim()); });
    mute = masked;
    rl.on('SIGINT', () => { rl.close(); reject(new Error('Interrupted')); });
  });
}

function validateYear(year) {
  if (!/^\d{4}$/.test(year || '')) throw new Error('Reporting year must be four digits');
  return year;
}

async function atomicWrite(destination, data) {
  await fs.mkdir(path.dirname(destination), { recursive: true });
  const temp = `${destination}.${process.pid}.${require('node:crypto').randomUUID()}.tmp`;
  try {
    await fs.writeFile(temp, data, { flag: 'wx' });
    await fs.rename(temp, destination);
  } finally {
    await fs.rm(temp, { force: true });
  }
}

async function runTarget(target, year) {
  const results = {};
  const failures = [];
  for (const language of languages) {
    try {
      results[language] = await scrapeLanguage(target, language);
      console.log(`${language}: succeeded`);
    } catch (error) {
      failures.push(language);
      console.error(`${language}: failed: ${error.message}`);
    }
  }
  if (failures.length) throw new Error(`Workbook not written. Failed languages: ${failures.join(', ')}`);
  const destination = path.join(outputRoot, year, `${year}-${target.slug}.xlsx`);
  await atomicWrite(destination, await createWorkbook(results));
  console.log(`Wrote ${destination}`);
}

async function runZip(year) {
  const directory = path.join(outputRoot, year);
  let names;
  try { names = await fs.readdir(directory); } catch (error) { if (error.code !== 'ENOENT') throw error; names = []; }
  const files = names.filter(name => name.toLowerCase().endsWith('.xlsx')).sort();
  const expected = Object.keys(targets).map(slug => `${year}-${slug}.xlsx`);
  for (const name of expected) console.log(`${files.includes(name) ? 'Found' : 'Missing'}: ${name}`);
  for (const name of files.filter(name => !expected.includes(name))) console.log(`Found: ${name}`);
  if (!files.length) throw new Error('No workbooks found; archive not written');
  if (expected.some(name => !files.includes(name))) {
    if (!/^(y|yes)$/i.test(await question('Some workbooks are missing. Continue? [y/N] '))) return;
  }
  let password = process.env.ZIP_PASSWORD;
  if (password === undefined) {
    const protect = await question('Protect archive with a password? [y/N] ');
    password = /^(y|yes)$/i.test(protect) ? await question('Password: ', true) : '';
  }
  const destination = path.join(directory, `${year}-fulfillment-ratio-excel-table.zip`);
  await atomicWrite(destination, await createZip(files.map(name => path.join(directory, name)), password));
  console.log(`Wrote ${destination}`);
}

async function main() {
  const { values } = parseArgs({ options: { target: { type: 'string' }, year: { type: 'string' }, zip: { type: 'boolean' } } });
  if (values.zip || values.target || values.year) {
    if (values.zip && values.target) throw new Error('Choose either --target or --zip');
    const year = validateYear(values.year);
    if (values.zip) return runZip(year);
    if (!targets[values.target]) throw new Error(`--target must be one of: ${Object.keys(targets).join(', ')}`);
    return runTarget(targets[values.target], year);
  }
  const choices = Object.values(targets);
  while (true) {
    console.log(`\n${choices.map((target, i) => `${i + 1}. ${target.slug}`).join('\n')}\n4. Zip only\n5. Exit`);
    const choice = await question('Choose an action: ');
    if (choice === '5') return;
    if (!['1', '2', '3', '4'].includes(choice)) { console.error('Invalid choice'); continue; }
    try {
      const year = validateYear(await question('Reporting year: '));
      if (choice === '4') await runZip(year);
      else await runTarget(choices[Number(choice) - 1], year);
    } catch (error) { console.error(error.message); }
  }
}

main().catch(error => { console.error(error.message); process.exitCode = 1; });

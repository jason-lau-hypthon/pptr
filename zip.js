const fs = require('node:fs/promises');
const path = require('node:path');
const { ZipWriter, Uint8ArrayWriter, Uint8ArrayReader } = require('@zip.js/zip.js');

async function createZip(files, password = '') {
  const writer = new ZipWriter(new Uint8ArrayWriter());
  for (const file of files) {
    await writer.add(path.basename(file), new Uint8ArrayReader(await fs.readFile(file)),
      password ? { password, encryptionStrength: 3 } : {});
  }
  return Buffer.from(await writer.close());
}

module.exports = { createZip };

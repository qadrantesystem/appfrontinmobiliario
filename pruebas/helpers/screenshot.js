/**
 * Helper de screenshots — captura con nombres consistentes
 */
const path = require('path');
const fs = require('fs');

const OUTPUT_DIR = path.resolve(__dirname, '..', 'output', 'screenshots');

/**
 * Captura screenshot con nombre estandarizado.
 * @param {import('@playwright/test').Page} page
 * @param {string} escenario - e.g. 'e1', 'e2'
 * @param {string} paso - e.g. '01-login', '02-nueva-propiedad'
 */
async function capture(page, escenario, paso) {
  fs.mkdirSync(OUTPUT_DIR, { recursive: true });

  const filename = `${escenario}_${paso}.png`;
  const filepath = path.join(OUTPUT_DIR, filename);

  await page.screenshot({ path: filepath, fullPage: false });
  console.log(`  Screenshot: ${filename}`);
  return filepath;
}

module.exports = { capture, OUTPUT_DIR };

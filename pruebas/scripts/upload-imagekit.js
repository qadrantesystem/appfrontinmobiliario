/**
 * Sube el PDF más reciente a ImageKit
 */
require('dotenv').config({ path: require('path').resolve(__dirname, '..', '.env') });
const fs = require('fs');
const path = require('path');
const ImageKit = require('imagekit');

const PDF_DIR = path.resolve(__dirname, '..', 'output', 'pdfs');

async function upload() {
  const { IMAGEKIT_PUBLIC_KEY, IMAGEKIT_PRIVATE_KEY, IMAGEKIT_URL_ENDPOINT } = process.env;

  if (!IMAGEKIT_PUBLIC_KEY || !IMAGEKIT_PRIVATE_KEY || !IMAGEKIT_URL_ENDPOINT) {
    console.error('Configura IMAGEKIT_PUBLIC_KEY, IMAGEKIT_PRIVATE_KEY y IMAGEKIT_URL_ENDPOINT en .env');
    process.exit(1);
  }

  const imagekit = new ImageKit({
    publicKey: IMAGEKIT_PUBLIC_KEY,
    privateKey: IMAGEKIT_PRIVATE_KEY,
    urlEndpoint: IMAGEKIT_URL_ENDPOINT,
  });

  // Buscar el PDF más reciente
  const pdfs = fs.readdirSync(PDF_DIR)
    .filter(f => f.endsWith('.pdf'))
    .sort()
    .reverse();

  if (pdfs.length === 0) {
    console.error('No hay PDFs en output/pdfs/. Ejecuta "npm run pdf" primero.');
    process.exit(1);
  }

  const pdfFile = pdfs[0];
  const pdfPath = path.join(PDF_DIR, pdfFile);

  console.log(`Subiendo: ${pdfFile}...`);

  const result = await imagekit.upload({
    file: fs.readFileSync(pdfPath),
    fileName: pdfFile,
    folder: '/qadrante/e2e-reports/',
  });

  console.log('Subido exitosamente!');
  console.log(`URL: ${result.url}`);
  console.log(`File ID: ${result.fileId}`);

  // Guardar URL para el script de share
  const urlFile = path.resolve(__dirname, '..', 'output', 'last-upload-url.txt');
  fs.writeFileSync(urlFile, result.url);

  return result.url;
}

upload().catch(err => {
  console.error('Error subiendo a ImageKit:', err.message);
  process.exit(1);
});

/**
 * Orquestador: test → pdf → upload → share
 */
const { execSync } = require('child_process');
const path = require('path');

const ROOT = path.resolve(__dirname, '..');

function run(label, cmd) {
  console.log(`\n${'='.repeat(60)}`);
  console.log(`  ${label}`);
  console.log('='.repeat(60));
  try {
    execSync(cmd, { cwd: ROOT, stdio: 'inherit', timeout: 600_000 });
    console.log(`  ${label} — OK`);
    return true;
  } catch (err) {
    console.error(`  ${label} — FALLO (code: ${err.status})`);
    return false;
  }
}

async function main() {
  console.log('Qadrante E2E — Pipeline Completo');
  console.log(`Inicio: ${new Date().toLocaleString('es-PE')}`);

  // 1. Tests
  const testsOk = run('1/4 Ejecutando tests E2E', 'npx playwright test');
  if (!testsOk) {
    console.log('\nLos tests fallaron. Generando PDF con los screenshots disponibles...');
  }

  // 2. PDF
  const pdfOk = run('2/4 Generando PDF', 'node scripts/generate-pdf.js');
  if (!pdfOk) {
    console.error('No se pudo generar el PDF. Abortando.');
    process.exit(1);
  }

  // 3. Upload
  const uploadOk = run('3/4 Subiendo a ImageKit', 'node scripts/upload-imagekit.js');
  if (!uploadOk) {
    console.error('No se pudo subir a ImageKit. Puedes compartir el PDF local.');
  }

  // 4. Share
  if (uploadOk) {
    run('4/4 Generando link WhatsApp', 'node scripts/share-whatsapp.js');
  }

  console.log(`\nFin: ${new Date().toLocaleString('es-PE')}`);
}

main();

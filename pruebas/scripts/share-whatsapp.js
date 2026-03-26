/**
 * Genera URL de WhatsApp con link al PDF del reporte E2E
 */
require('dotenv').config({ path: require('path').resolve(__dirname, '..', '.env') });
const fs = require('fs');
const path = require('path');

function share() {
  const phone = process.env.WHATSAPP_PHONE || '51999888777';

  // Leer la última URL subida
  const urlFile = path.resolve(__dirname, '..', 'output', 'last-upload-url.txt');
  let pdfUrl = '';

  if (fs.existsSync(urlFile)) {
    pdfUrl = fs.readFileSync(urlFile, 'utf-8').trim();
  }

  if (!pdfUrl) {
    console.error('No se encontro URL del PDF. Ejecuta "npm run upload" primero.');
    process.exit(1);
  }

  const mensaje = [
    'Reporte E2E - Qadrante System',
    '',
    'Se ejecutaron 5 escenarios de prueba:',
    '  E1: Registrar oficina individual',
    '  E2: Registrar edificio completo',
    '  E3: Editar oficina existente',
    '  E4: Editar edificio existente',
    '  E5: Busqueda y compartir',
    '',
    `PDF con screenshots: ${pdfUrl}`,
    '',
    `Fecha: ${new Date().toLocaleString('es-PE')}`,
  ].join('\n');

  const encoded = encodeURIComponent(mensaje);
  const waUrl = `https://wa.me/${phone}?text=${encoded}`;

  console.log('=== URL de WhatsApp ===');
  console.log(waUrl);
  console.log('');
  console.log('Abre esta URL en tu navegador para enviar el mensaje.');

  return waUrl;
}

share();

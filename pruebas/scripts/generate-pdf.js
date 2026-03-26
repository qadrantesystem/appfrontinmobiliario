/**
 * Genera un PDF con todos los screenshots de los 5 escenarios
 */
const fs = require('fs');
const path = require('path');
const PDFDocument = require('pdfkit');

const SCREENSHOTS_DIR = path.resolve(__dirname, '..', 'output', 'screenshots');
const PDF_DIR = path.resolve(__dirname, '..', 'output', 'pdfs');

function generatePDF() {
  fs.mkdirSync(PDF_DIR, { recursive: true });

  const files = fs.readdirSync(SCREENSHOTS_DIR)
    .filter(f => f.endsWith('.png'))
    .sort();

  if (files.length === 0) {
    console.error('No hay screenshots en output/screenshots/. Ejecuta los tests primero.');
    process.exit(1);
  }

  const timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, 19);
  const pdfPath = path.join(PDF_DIR, `qadrante-e2e-${timestamp}.pdf`);

  const doc = new PDFDocument({ size: 'A4', layout: 'landscape', margin: 30 });
  const stream = fs.createWriteStream(pdfPath);
  doc.pipe(stream);

  // Portada
  doc.fontSize(28).fillColor('#0F4761')
     .text('Qadrante System', { align: 'center' });
  doc.moveDown(0.5);
  doc.fontSize(18).fillColor('#333')
     .text('Pruebas E2E — Reporte de Screenshots', { align: 'center' });
  doc.moveDown(0.3);
  doc.fontSize(12).fillColor('#666')
     .text(`Generado: ${new Date().toLocaleString('es-PE')}`, { align: 'center' });
  doc.moveDown(0.3);
  doc.fontSize(12)
     .text(`Total screenshots: ${files.length}`, { align: 'center' });

  // Agrupar por escenario
  const escenarios = {};
  for (const file of files) {
    const match = file.match(/^(e\d+)_(.+)\.png$/);
    if (match) {
      const [, esc, paso] = match;
      if (!escenarios[esc]) escenarios[esc] = [];
      escenarios[esc].push({ file, paso });
    }
  }

  const titles = {
    e1: 'E1: Registrar Oficina Individual',
    e2: 'E2: Registrar Edificio Completo',
    e3: 'E3: Editar Oficina Existente',
    e4: 'E4: Editar Edificio Existente',
    e5: 'E5: Busqueda y Compartir',
  };

  for (const [esc, screenshots] of Object.entries(escenarios)) {
    for (const { file, paso } of screenshots) {
      doc.addPage();

      // Título del escenario + paso
      doc.fontSize(14).fillColor('#0F4761')
         .text(titles[esc] || esc, 30, 20);
      doc.fontSize(11).fillColor('#666')
         .text(`Paso: ${paso.replace(/-/g, ' ')}`, 30, 40);

      // Screenshot
      const imgPath = path.join(SCREENSHOTS_DIR, file);
      try {
        doc.image(imgPath, 30, 60, {
          fit: [doc.page.width - 60, doc.page.height - 90],
          align: 'center',
          valign: 'center',
        });
      } catch (e) {
        doc.fontSize(10).fillColor('red')
           .text(`Error cargando: ${file}`, 30, 60);
      }
    }
  }

  doc.end();

  stream.on('finish', () => {
    console.log(`PDF generado: ${pdfPath}`);
    console.log(`Tamano: ${(fs.statSync(pdfPath).size / 1024).toFixed(1)} KB`);
  });
}

generatePDF();

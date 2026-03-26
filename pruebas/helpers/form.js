/**
 * Helper de formulario multipaso — PropertyForm
 */
const path = require('path');

/**
 * Llena el Paso 1: Información del Propietario (persona natural)
 */
async function fillStep1Natural(page, propietario) {
  // Asegurar que estamos en persona natural
  const cardNatural = page.locator('[data-tipo-persona="natural"]');
  await cardNatural.click();
  await page.waitForTimeout(300);

  await page.fill('#propietario_dni', propietario.dni);

  // Esperar auto-fill por DNI (si el backend lo soporta, max 5s)
  try {
    await page.waitForFunction(
      () => document.getElementById('propietario_nombre')?.value?.length > 0,
      { timeout: 5000 }
    );
  } catch {
    // Si no hay auto-fill, llenar manualmente
    await page.fill('#propietario_nombre', propietario.nombre);
  }

  await page.fill('#propietario_telefono', propietario.telefono);

  if (propietario.email) {
    const emailField = page.locator('#propietario_email');
    if (await emailField.isVisible()) {
      await emailField.fill(propietario.email);
    }
  }
}

/**
 * Llena el Paso 2: Información Básica del Inmueble (sin edificio padre)
 */
async function fillStep2Simple(page, inmueble, distritoNombre) {
  // Seleccionar tipo de inmueble
  await page.selectOption('#tipo_inmueble_id', inmueble.tipo_inmueble_id);
  await page.waitForTimeout(500);

  // Seleccionar distrito (buscar por texto visible)
  const distritoSelect = page.locator('#distrito_id');
  if (await distritoSelect.isEnabled()) {
    await distritoSelect.selectOption({ label: distritoNombre });
  }

  // Nombre del inmueble
  await page.fill('#nombre_inmueble', inmueble.nombre);

  // Dirección
  // tipo_via options: value="Av." label="Avenida", value="Calle" label="Calle", etc.
  const tipoViaSelect = page.locator('#tipo_via');
  if (await tipoViaSelect.isVisible()) {
    await tipoViaSelect.selectOption(inmueble.tipo_via); // select by value
  }
  await page.fill('#nombre_via', inmueble.nombre_via);
  await page.fill('#numero_direccion', inmueble.numero_direccion);

  const urbanizacion = page.locator('#urbanizacion');
  if (await urbanizacion.isVisible() && inmueble.urbanizacion) {
    await urbanizacion.fill(inmueble.urbanizacion);
  }
}

/**
 * Click en "Siguiente" y esperar que el paso cambie.
 * Si hay un modal bloqueante (modal-pisos, swal2), lo cierra primero.
 */
async function clickNext(page) {
  // Cerrar modal-pisos si existe (paso 4 de edificio completo)
  const modalPisos = page.locator('#modal-pisos');
  if (await modalPisos.isVisible({ timeout: 500 }).catch(() => false)) {
    // Buscar botón de confirmar/cerrar en el modal
    const confirmBtn = modalPisos.locator('button').filter({ hasText: /confirmar|guardar|cerrar|aceptar/i }).first();
    if (await confirmBtn.isVisible({ timeout: 1000 }).catch(() => false)) {
      await confirmBtn.click();
      await page.waitForTimeout(1000);
    } else {
      // Cerrar con evaluate
      await page.evaluate(() => document.getElementById('modal-pisos')?.remove());
      await page.waitForTimeout(500);
    }
  }

  // Cerrar SweetAlert si existe
  const swal = page.locator('.swal2-popup');
  if (await swal.isVisible({ timeout: 500 }).catch(() => false)) {
    const swalConfirm = page.locator('.swal2-confirm');
    if (await swalConfirm.isVisible()) {
      await swalConfirm.click();
      await page.waitForTimeout(1000);
    }
  }

  // Click en Siguiente via evaluate (mas robusto que page.click)
  await page.evaluate(() => {
    document.getElementById('btnSiguiente')?.click();
  });
  // Esperar re-render del paso
  await page.waitForTimeout(2000);
}

/**
 * Click en "Anterior" y esperar que el paso cambie
 */
async function clickPrev(page) {
  const btn = page.locator('#btnAnterior');
  await btn.waitFor({ state: 'visible' });
  await btn.click();
  await page.waitForTimeout(1500);
}

/**
 * Obtener el paso actual del formulario
 */
async function getCurrentStep(page) {
  return page.evaluate(() => window.propertyForm?.currentStep ?? -1);
}

/**
 * Llena el Paso 5: Transacción y Precio (Venta)
 */
async function fillStep5Venta(page, moneda, precio, titulo, descripcion) {
  // Click en card de venta
  const ventaCard = page.locator('[data-transaction="venta"]');
  await ventaCard.click();
  await page.waitForTimeout(300);

  await page.selectOption('#moneda_venta', moneda);
  await page.fill('#precio_venta', precio);

  if (titulo) await page.fill('#titulo', titulo);
  if (descripcion) await page.fill('#descripcion', descripcion);
}

/**
 * Llena el Paso 5: Transacción y Precio (Alquiler)
 */
async function fillStep5Alquiler(page, moneda, precio, titulo, descripcion) {
  // Click en card de alquiler
  const alquilerCard = page.locator('[data-transaction="alquiler"]');
  await alquilerCard.click();
  await page.waitForTimeout(300);

  await page.selectOption('#moneda_alquiler', moneda);
  await page.fill('#precio_alquiler', precio);

  if (titulo) await page.fill('#titulo', titulo);
  if (descripcion) await page.fill('#descripcion', descripcion);
}

/**
 * Llena el Paso 6: Imagen principal desde archivo de test
 */
async function fillStep6Image(page) {
  const testImagePath = path.resolve(__dirname, '..', 'fixtures', 'test-image.png');
  const fileInput = page.locator('#imagenPrincipal');
  await fileInput.setInputFiles(testImagePath);
  await page.waitForTimeout(1000);
}

module.exports = {
  fillStep1Natural,
  fillStep2Simple,
  fillStep5Venta,
  fillStep5Alquiler,
  fillStep6Image,
  clickNext,
  clickPrev,
  getCurrentStep,
};

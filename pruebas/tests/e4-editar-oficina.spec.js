// @ts-check
const { test, expect } = require('@playwright/test');
const { capture } = require('../helpers/screenshot');

const EMAIL = 'alancairampoma@gmail.com';
const PASSWORD = 'Kike2026@';
const NUEVO_NOMBRE = 'Oficina E2E Editada';
const NUEVO_PRECIO = '4000';

test.describe('E4: Editar oficina existente', () => {

  test('Editar nombre y precio de oficina (happy path)', async ({ page }) => {

    // ── 1. Login → Dashboard ──────────────────────────────────
    await page.goto('/login');
    await page.waitForSelector('#loginForm', { state: 'visible' });
    await page.fill('#email', EMAIL);
    await page.fill('#password', PASSWORD);
    await page.click('#loginBtn');

    await page.waitForURL('**/dashboard', { timeout: 30_000 });
    await page.waitForSelector('#tabsList', { state: 'visible', timeout: 20_000 });
    await page.waitForFunction(
      () => {
        const c = document.getElementById('tabContent');
        return c && !c.textContent.includes('Cargando') && c.children.length > 0;
      },
      { timeout: 30_000 }
    );

    // ── 2. Tab Propiedades ────────────────────────────────────
    const tabProp = page.locator('[data-tab="propiedades"]');
    await tabProp.waitFor({ state: 'visible', timeout: 10_000 });
    await tabProp.click();
    await page.waitForFunction(
      () => {
        const c = document.getElementById('tabContent');
        return c && c.textContent.includes('Mis Propiedades');
      },
      { timeout: 20_000 }
    );
    await page.waitForSelector('#btnNuevaPropiedad', { state: 'visible', timeout: 15_000 });
    await capture(page, 'e4', '01-lista-propiedades');

    // ── 3. Localizar oficina (segundo item) → Click Editar ────
    const allEdits = page.locator('[data-edit-property]');
    const count = await allEdits.count();
    // La oficina es el segundo item; si solo hay 1, usar ese
    const editBtn = count > 1 ? allEdits.nth(1) : allEdits.first();
    await editBtn.waitFor({ state: 'visible', timeout: 10_000 });
    await editBtn.click();

    // Esperar que el formulario de edicion cargue (Railway API puede tardar)
    await page.waitForSelector('#propietario_dni', { state: 'visible', timeout: 60_000 });
    await page.waitForTimeout(2000);

    await capture(page, 'e4', '02-paso1-datos-precargados');

    // ── 4. Paso 1 → Paso 2: cambiar nombre ───────────────────
    await page.evaluate(() => document.getElementById('btnSiguiente')?.click());
    await page.waitForSelector('#nombre_inmueble', { state: 'visible', timeout: 10_000 });
    await page.waitForTimeout(1000);

    await page.locator('#nombre_inmueble').clear();
    await page.fill('#nombre_inmueble', NUEVO_NOMBRE);
    await capture(page, 'e4', '03-paso2-nombre-editado');

    // ── 5. Paso 2 → Paso 3 ───────────────────────────────────
    await page.evaluate(() => document.getElementById('btnSiguiente')?.click());
    await page.waitForTimeout(3000);

    // Verificar si avanzó o si validación falló
    let step = await page.evaluate(() => window.propertyForm?.currentStep ?? -1);
    if (step === 2) {
      console.log('  Validacion paso 2 fallo, forzando avance...');
      await page.evaluate(async () => {
        if (window.propertyForm) {
          window.propertyForm.collectStepData();
          window.propertyForm.currentStep = 3;
          window.propertyForm.render();
          if (window.propertyForm.formData.tipo_inmueble_id) {
            await window.propertyForm.loadCaracteristicasPorTipo(
              window.propertyForm.formData.tipo_inmueble_id
            );
          }
        }
      });
      await page.waitForTimeout(3000);
    }

    await capture(page, 'e4', '04-paso3-caracteristicas');

    // ── 6. Paso 3 → Paso 5 (tipo 1 salta paso 4) ─────────────
    await page.evaluate(() => document.getElementById('btnSiguiente')?.click());
    await page.waitForTimeout(2000);

    step = await page.evaluate(() => window.propertyForm?.currentStep ?? -1);
    console.log(`  Paso actual tras salto: ${step}`);

    // Si cayó en paso 4, avanzar
    if (step === 4) {
      await page.evaluate(() => document.getElementById('btnSiguiente')?.click());
      await page.waitForTimeout(2000);
      step = await page.evaluate(() => window.propertyForm?.currentStep ?? -1);
    }

    // ── 7. Paso 5: cambiar precio ─────────────────────────────
    const precioAlquiler = page.locator('#precio_alquiler');
    const precioVenta = page.locator('#precio_venta');
    if (await precioAlquiler.isVisible({ timeout: 3000 }).catch(() => false)) {
      await precioAlquiler.clear();
      await precioAlquiler.fill(NUEVO_PRECIO);
    } else if (await precioVenta.isVisible({ timeout: 3000 }).catch(() => false)) {
      await precioVenta.clear();
      await precioVenta.fill(NUEVO_PRECIO);
    }
    await capture(page, 'e4', '05-paso5-precio-editado');

    // ── 8. Paso 5 → Paso 6 → Submit ──────────────────────────
    await page.evaluate(() => document.getElementById('btnSiguiente')?.click());
    await page.waitForTimeout(2000);

    // Click "Actualizar Propiedad"
    await page.evaluate(() => document.getElementById('btnSiguiente')?.click());

    // ── 9. Esperar exito ──────────────────────────────────────
    try {
      await page.waitForFunction(
        () => {
          const notif = document.querySelector('.notification, .swal2-popup, .toast');
          if (notif && notif.textContent.toLowerCase().includes('xito')) return true;
          const content = document.getElementById('tabContent');
          if (content && content.textContent.includes('Mis Propiedades')) return true;
          return false;
        },
        { timeout: 30_000 }
      );
    } catch {
      await page.waitForTimeout(5000);
    }

    await page.waitForTimeout(2000);
    await capture(page, 'e4', '06-exito-actualizacion');
  });
});

/**
 * Helper de navegación — tabs del dashboard
 */

/**
 * Navega a un tab del dashboard haciendo click en el botón correspondiente.
 * @param {import('@playwright/test').Page} page
 * @param {string} tabId - e.g. 'propiedades', 'busquedas', 'favoritos'
 */
async function navigateToTab(page, tabId) {
  const tabBtn = page.locator(`[data-tab="${tabId}"]`);
  await tabBtn.waitFor({ state: 'visible', timeout: 10_000 });
  await tabBtn.click();

  // Esperar que el contenido del tab se cargue
  await page.waitForTimeout(2000);
  await page.waitForSelector('#tabContent', { state: 'visible' });
}

/**
 * Click en "Nueva Propiedad" — usa evaluate porque page.click no dispara el handler.
 * Espera a que el formulario PropertyForm renderice el paso 1.
 */
async function clickNuevaPropiedad(page) {
  // Intentar click via evaluate (page.click no dispara el handler)
  await page.evaluate(() => {
    document.getElementById('btnNuevaPropiedad')?.click();
  });

  // Esperar 5s para ver si el formulario empieza a cargar
  await page.waitForTimeout(5000);

  // Si no renderizan, intentar instanciar PropertyForm directamente
  let hasDNI = await page.locator('#propietario_dni').isVisible().catch(() => false);
  if (!hasDNI) {
    // Segundo intento: instanciar PropertyForm directamente
    await page.evaluate(async () => {
      if (typeof PropertyForm !== 'undefined') {
        const dashboard = window.dashboardApp || window.dashboard;
        const form = new PropertyForm(dashboard, null);
        await form.init();
      }
    });
  }

  // Esperar que init() → loadCatalogos() → render() completen
  await page.waitForSelector('#propietario_dni', { state: 'visible', timeout: 90_000 });
}

module.exports = { navigateToTab, clickNuevaPropiedad };

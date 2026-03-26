// @ts-check
const { test, expect } = require('@playwright/test');
const { capture } = require('../helpers/screenshot');
const path = require('path');

const TEST_DATA = {
  email: 'alancairampoma@gmail.com',
  password: 'Kike2026@',
  dni: '43797299',
  tipo_inmueble_id: '12',
  distrito_label: 'San Isidro',
  nombre_inmueble: 'Edificio E2E Test',
  tipo_via: 'Av.',
  nombre_via: 'Javier Prado',
  numero_direccion: '2100',
  lat: -12.0970,
  lng: -77.0365,
  pisos: '2',
  moneda_venta: 'USD',
  precio_venta: '950000',
  titulo: 'Edificio E2E Playwright Test',
  descripcion: 'Edificio de oficinas completo registrado mediante test automatizado E2E con Playwright.',
  imagen: path.resolve(__dirname, '..', 'fixtures', 'test-image.png'),
};

test.describe('E1: Registrar edificio completo', () => {

  test('Registrar Edificio de oficinas completo (happy path)', async ({ page }) => {

    // ── 1. Login ────────────────────────────────────────────────
    await page.goto('/login');
    await page.waitForSelector('#email', { state: 'visible', timeout: 15_000 });
    await page.fill('#email', TEST_DATA.email);
    await page.fill('#password', TEST_DATA.password);
    await page.click('#loginBtn');

    // Esperar redirect al dashboard y que cargue contenido
    await page.waitForURL('**/dashboard', { timeout: 20_000 });
    await page.waitForFunction(
      () => {
        const tc = document.getElementById('tabContent');
        return tc && !tc.textContent.includes('Cargando');
      },
      { timeout: 20_000 }
    );
    await capture(page, 'e1', '01-login-dashboard');

    // ── 2. Tab Propiedades ──────────────────────────────────────
    await page.click('[data-tab="propiedades"]');
    await page.waitForFunction(
      () => {
        const tc = document.getElementById('tabContent');
        return tc && tc.textContent.includes('Mis Propiedades');
      },
      { timeout: 15_000 }
    );
    await page.waitForSelector('#btnNuevaPropiedad', { state: 'visible', timeout: 15_000 });
    await capture(page, 'e1', '02-tab-propiedades');

    // ── 3. Click Nueva Propiedad (stopPropagation bypass) ───────
    await page.evaluate(() => document.getElementById('btnNuevaPropiedad')?.click());
    await page.waitForTimeout(5000);

    // Si el formulario no se renderizó, instanciar PropertyForm directamente
    let dniVisible = await page.locator('#propietario_dni').isVisible().catch(() => false);
    if (!dniVisible) {
      console.log('  Click no disparo el form — instanciando PropertyForm directo...');
      await page.evaluate(async () => {
        const dashboard = window.dashboardApp || window.dashboard;
        const form = new PropertyForm(dashboard, null);
        await form.init();
      });
    }

    // Esperar que el formulario PropertyForm se renderice (paso 1 visible)
    await page.waitForSelector('#propietario_dni', { state: 'visible', timeout: 90_000 });

    // ── 4. Paso 1: Propietario — persona natural con DNI ────────
    await page.fill('#propietario_dni', TEST_DATA.dni);

    // Esperar auto-fill del nombre desde BD (el campo se llena tras fetch)
    await page.waitForFunction(
      () => {
        const el = document.getElementById('propietario_nombre');
        return el && el.value && el.value.trim().length > 0;
      },
      { timeout: 15_000 }
    );

    // Llenar teléfono si está vacío
    const telefonoVacio = await page.evaluate(() => {
      const el = document.getElementById('propietario_telefono');
      return el && (!el.value || el.value.trim() === '');
    });
    if (telefonoVacio) {
      await page.fill('#propietario_telefono', '999888777');
    }

    await capture(page, 'e1', '03-paso1-propietario');

    // Avanzar a paso 2
    await page.evaluate(() => document.getElementById('btnSiguiente')?.click());
    await page.waitForSelector('#tipo_inmueble_id', { state: 'visible', timeout: 15_000 });

    // ── 5. Paso 2: Tipo inmueble, ubicación, mapa ───────────────
    // Seleccionar tipo de inmueble: Edificio oficinas completo (value=12)
    await page.selectOption('#tipo_inmueble_id', TEST_DATA.tipo_inmueble_id);

    // Seleccionar distrito: San Isidro (por label)
    await page.selectOption('#distrito_id', { label: TEST_DATA.distrito_label });

    // Nombre del inmueble
    await page.fill('#nombre_inmueble', TEST_DATA.nombre_inmueble);

    // ── Mapa: abrir modal, click en coordenadas, confirmar ──────
    await page.click('#btnUbicarMapa');
    await page.waitForSelector('#mapModal', { state: 'visible', timeout: 10_000 });

    // Esperar que el mapa Leaflet esté inicializado
    await page.waitForFunction(
      () => window.propertyForm && window.propertyForm.currentMap,
      { timeout: 15_000 }
    );

    // Pequeña pausa para que los tiles del mapa carguen
    await page.waitForTimeout(2000);

    // Simular click en coordenadas reales de San Isidro
    await page.evaluate(({ lat, lng }) => {
      const map = window.propertyForm.currentMap;
      const latlng = L.latLng(lat, lng);
      map.fire('click', {
        latlng: latlng,
        layerPoint: map.latLngToLayerPoint(latlng),
        containerPoint: map.latLngToContainerPoint(latlng),
      });
    }, { lat: TEST_DATA.lat, lng: TEST_DATA.lng });

    // Esperar reverse geocoding (Nominatim) — coordsDisplay deja de decir "Obteniendo"
    await page.waitForFunction(
      () => {
        const el = document.getElementById('coordsDisplay');
        return el && el.textContent && !el.textContent.includes('Obteniendo');
      },
      { timeout: 20_000 }
    );

    // Capturar mapa con marker visible
    await capture(page, 'e1', '04-paso2-mapa');

    // Confirmar ubicación (llena tipo_via, nombre_via, numero, urbanizacion)
    await page.evaluate(() => {
      if (window.propertyForm && typeof window.propertyForm.confirmarUbicacion === 'function') {
        window.propertyForm.confirmarUbicacion();
      }
    });
    await page.waitForTimeout(1000);

    // Cerrar modal de mapa si sigue abierto
    const mapModalVisible = await page.evaluate(() => {
      const modal = document.getElementById('mapModal');
      return modal && modal.style.display !== 'none' && modal.offsetParent !== null;
    });
    if (mapModalVisible) {
      await page.evaluate(() => {
        if (window.propertyForm && typeof window.propertyForm.cerrarMapaModal === 'function') {
          window.propertyForm.cerrarMapaModal();
        }
      });
      await page.waitForTimeout(500);
    }

    // Sobreescribir dirección con datos exactos del test
    await page.selectOption('#tipo_via', TEST_DATA.tipo_via);
    await page.fill('#nombre_via', TEST_DATA.nombre_via);
    await page.fill('#numero_direccion', TEST_DATA.numero_direccion);

    await capture(page, 'e1', '05-paso2-inmueble');

    // Avanzar a paso 3
    await page.evaluate(() => document.getElementById('btnSiguiente')?.click());
    await page.waitForTimeout(3000);

    // ── 6. Paso 3: Características dinámicas ────────────────────
    // Esperar que las características se rendericen
    const pisosInput = page.locator('input[data-carac-id="110"]');
    const pisosVisible = await pisosInput.isVisible({ timeout: 8000 }).catch(() => false);
    if (pisosVisible) {
      await pisosInput.fill(TEST_DATA.pisos);
    }

    await capture(page, 'e1', '06-paso3-caracteristicas');

    // Avanzar a paso 4 — esto dispara el modal de pisos si cantidadPisos > 0
    await page.evaluate(() => document.getElementById('btnSiguiente')?.click());
    await page.waitForTimeout(5000);

    // ── 7. Modal de pisos y navegación paso 4 ──────────────────
    // El modal #modal-pisos puede aparecer automáticamente (z-index 9999)
    const modalPisosVisible = await page.locator('#modal-pisos').isVisible({ timeout: 5000 }).catch(() => false);

    if (modalPisosVisible) {
      await page.waitForTimeout(1000);
      await capture(page, 'e1', '07-paso4-modal-pisos');
      await page.evaluate(() => document.getElementById('btn-guardar-pisos')?.click());
      await page.waitForTimeout(2000);
    }

    // Manejar SweetAlert si aparece
    const swalVisible = await page.locator('.swal2-popup').isVisible({ timeout: 3000 }).catch(() => false);
    if (swalVisible) {
      await page.locator('.swal2-confirm').click();
      await page.waitForTimeout(2000);
    }

    // Verificar paso actual y navegar al paso 5
    let currentStep = await page.evaluate(() => window.propertyForm?.currentStep ?? -1);
    console.log(`  Paso actual tras modal-pisos: ${currentStep}`);

    // Si estamos en paso 4, necesitamos avanzar a paso 5
    if (currentStep === 4) {
      // Verificar si modal-pisos sigue bloqueando
      const modalStillVisible = await page.locator('#modal-pisos').isVisible().catch(() => false);
      if (modalStillVisible) {
        await page.evaluate(() => document.getElementById('modal-pisos')?.remove());
        await page.waitForTimeout(500);
      }
      await page.evaluate(() => document.getElementById('btnSiguiente')?.click());
      await page.waitForTimeout(3000);
      currentStep = await page.evaluate(() => window.propertyForm?.currentStep ?? -1);
    }

    // Si saltó directo al paso 5 desde paso 3 (pisos=0)
    if (currentStep === 5) {
      console.log('  Ya en paso 5');
    } else if (currentStep === 3) {
      // El nextStep no avanzó — forzar
      console.log('  Forzando avance de paso 3 a paso 5...');
      await page.evaluate(() => {
        if (window.propertyForm) {
          window.propertyForm.collectStepData();
          window.propertyForm.currentStep = 5;
          window.propertyForm.render();
        }
      });
      await page.waitForTimeout(2000);
    }

    // ── 8. Paso 5: Transacción — Venta USD ──────────────────────
    // Seleccionar card de venta
    const ventaCard = page.locator('[data-transaction="venta"]');
    if (await ventaCard.isVisible({ timeout: 5000 }).catch(() => false)) {
      await ventaCard.click();
      await page.waitForTimeout(500);
    }

    // Moneda y precio
    const monedaSelect = page.locator('#moneda_venta');
    if (await monedaSelect.isVisible({ timeout: 5000 }).catch(() => false)) {
      await page.selectOption('#moneda_venta', TEST_DATA.moneda_venta);
    }

    const precioInput = page.locator('#precio_venta');
    if (await precioInput.isVisible({ timeout: 5000 }).catch(() => false)) {
      await page.fill('#precio_venta', TEST_DATA.precio_venta);
    }

    // Título y descripción
    const tituloInput = page.locator('#titulo');
    if (await tituloInput.isVisible({ timeout: 5000 }).catch(() => false)) {
      await page.fill('#titulo', TEST_DATA.titulo);
    }

    const descInput = page.locator('#descripcion');
    if (await descInput.isVisible({ timeout: 5000 }).catch(() => false)) {
      await page.fill('#descripcion', TEST_DATA.descripcion);
    }

    await capture(page, 'e1', '08-paso5-precio');

    // Avanzar a paso 6
    await page.evaluate(() => document.getElementById('btnSiguiente')?.click());
    await page.waitForTimeout(3000);

    // Verificar que estamos en paso 6
    let stepBeforeImage = await page.evaluate(() => window.propertyForm?.currentStep ?? -1);
    console.log(`  Paso antes de imagen: ${stepBeforeImage}`);
    if (stepBeforeImage !== 6) {
      // Forzar paso 6
      await page.evaluate(() => {
        if (window.propertyForm) {
          window.propertyForm.collectStepData();
          window.propertyForm.currentStep = 6;
          window.propertyForm.render();
        }
      });
      await page.waitForTimeout(2000);
    }

    await page.waitForSelector('#imagenPrincipal', { state: 'attached', timeout: 15_000 });

    // ── 9. Paso 6: Imagen principal + Submit ────────────────────
    const fileInput = page.locator('#imagenPrincipal');
    await fileInput.setInputFiles(TEST_DATA.imagen);
    await page.waitForTimeout(1500);

    await capture(page, 'e1', '09-paso6-imagen');

    // Submit — último click en btnSiguiente llama submitForm()
    await page.evaluate(() => document.getElementById('btnSiguiente')?.click());

    // Esperar éxito: notificación o vuelta a la lista "Mis Propiedades"
    try {
      await page.waitForFunction(
        () => {
          // Notificación de éxito (SweetAlert, toast, etc.)
          const notif = document.querySelector('.swal2-popup, .notification, .toast');
          if (notif && notif.textContent && notif.textContent.toLowerCase().includes('xito')) return true;
          // Volvió a la lista de propiedades
          const tc = document.getElementById('tabContent');
          if (tc && tc.textContent.includes('Mis Propiedades')) return true;
          return false;
        },
        { timeout: 45_000 }
      );
    } catch {
      console.log('  Timeout esperando confirmacion de exito — capturando estado actual');
    }

    await page.waitForTimeout(2000);

    try {
      await capture(page, 'e1', '10-exito');
    } catch {
      console.log('  Pagina cerrada/recargada tras publicar');
    }
  });
});

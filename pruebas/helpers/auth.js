/**
 * Helper de autenticación — login y verificación de sesión
 */

const { TEST_USER } = require('../fixtures/test-data');

/**
 * Login completo: navega a /login, llena credenciales, espera redirect a /dashboard
 */
async function login(page, email, password) {
  const user = email || TEST_USER.email;
  const pass = password || TEST_USER.password;

  await page.goto('/login');
  await page.waitForSelector('#loginForm', { state: 'visible' });

  await page.fill('#email', user);
  await page.fill('#password', pass);
  await page.click('#loginBtn');

  // Esperar redirect al dashboard
  await page.waitForURL('**/dashboard', { timeout: 30_000 });
  // Esperar que el tab list se renderice
  await page.waitForSelector('#tabsList', { state: 'visible', timeout: 20_000 });
  // Esperar que el contenido del dashboard cargue (no solo el spinner)
  await page.waitForFunction(
    () => {
      const content = document.getElementById('tabContent');
      return content && !content.textContent.includes('Cargando') && content.children.length > 0;
    },
    { timeout: 30_000 }
  );
}

/**
 * Verifica que el usuario está logueado (hay token en localStorage)
 */
async function isLoggedIn(page) {
  return page.evaluate(() => {
    return !!localStorage.getItem('auth_token') || !!localStorage.getItem('token');
  });
}

module.exports = { login, isLoggedIn };

/**
 * 🔧 Dashboard Patch - Manejo defensivo de errores
 * Aplica correcciones para endpoints no disponibles y datos faltantes
 *
 * Este script DEBE cargarse inmediatamente después de auth.service.js
 * para interceptar getMyProfile() antes de que dashboard.js lo use
 */

(function() {
  console.log('🔧 Aplicando patch del dashboard...');

  // authService ya está disponible porque se carga justo antes de este script
  if (!window.authService || !window.authService.getMyProfile) {
    console.error('❌ authService no está disponible - verificar orden de carga de scripts');
    return;
  }

  // Guardar referencia a la función original
  const originalGetMyProfile = window.authService.getMyProfile;

  // Interceptar authService.getMyProfile()
  window.authService.getMyProfile = async function() {
    try {
      const userData = await originalGetMyProfile.call(this);

      // El API devuelve perfil.perfil_id, extraerlo al nivel raíz
      if (userData.perfil && userData.perfil.perfil_id && !userData.perfil_id) {
        userData.perfil_id = userData.perfil.perfil_id;
      }

      // Si aún no tiene perfil_id, intentar del localStorage
      if (!userData.perfil_id) {
        const storedUser = JSON.parse(localStorage.getItem('current_user') || '{}');
        if (storedUser.perfil_id) {
          userData.perfil_id = storedUser.perfil_id;
        }
      }

      return userData;
    } catch (error) {
      console.error('❌ Error en getMyProfile patch:', error);
      throw error;
    }
  };

  console.log('✅ Patch aplicado correctamente - authService.getMyProfile() interceptado');
})();

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

      console.log('🔍 Datos recibidos del backend:', userData);

      // Si perfil_id es undefined, intentar obtenerlo del localStorage
      if (!userData.perfil_id) {
        console.warn('⚠️ perfil_id NO viene en la respuesta del backend');
        const storedUser = JSON.parse(localStorage.getItem('current_user') || '{}');

        if (storedUser.perfil_id) {
          userData.perfil_id = storedUser.perfil_id;
          console.log('✅ perfil_id recuperado del localStorage:', userData.perfil_id);
        } else {
          // Si tampoco está en localStorage, asignar perfil 1 por defecto
          userData.perfil_id = 1; // Demandante
          console.warn('⚠️ Asignando perfil_id por defecto: 1 (Demandante)');
        }

        // Actualizar localStorage con el perfil_id
        this.saveUserToStorage(userData);
      } else {
        console.log('✅ perfil_id recibido del backend:', userData.perfil_id);
      }

      return userData;
    } catch (error) {
      console.error('❌ Error en getMyProfile patch:', error);
      throw error;
    }
  };

  console.log('✅ Patch aplicado correctamente - authService.getMyProfile() interceptado');
})();

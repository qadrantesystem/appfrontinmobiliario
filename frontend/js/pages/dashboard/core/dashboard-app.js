/**
 * 🎯 Dashboard App - Orquestador Principal
 * Archivo: core/dashboard-app.js
 * Líneas: ~300
 * REEMPLAZA: dashboard.js (2,428 líneas)
 */

class DashboardApp {
  constructor() {
    // Usuario actual
    this.currentUser = null;

    // Router de tabs
    this.router = null;

    // Módulos existentes (NO se mueven, solo instanciamos)
    this.filters = null;
    this.pagination = null;
    this.carousel = null;
    this.searchSimpleModule = null;
    this.searchAdminModule = null;

    // Data compartida (para compatibilidad con módulos existentes)
    this.dashboardStats = null;
    this.propertyStats = null;
    this.allProperties = [];
    this.currentPage = 1;

    // Auto-inicializar
    this.init();
  }

  /**
   * Inicializar aplicación
   */
  async init() {
    // 1. Verificar autenticacion
    if (!this.checkAuth()) {
      return;
    }

    // 2. Cargar usuario desde storage INMEDIATAMENTE (sin network)
    this.loadCurrentUserFromStorage();

    // 3. Esperar header + cargar usuario fresco EN PARALELO
    const [headerOk] = await Promise.all([
      this.waitForHeader(),
      this.refreshCurrentUser()
    ]);

    if (!headerOk) {
      console.error('❌ Header no disponible');
    }

    // 4. Inicializar modulos y router EN PARALELO
    this.initializeModules();
    this.router = new DashboardRouter(this);
    await this.router.init();

    // 5. Modulos de busqueda (no bloquean el render del tab)
    this.initializeSearchModules();

    // 6. Iniciar gestor de inactividad
    this.startInactivityManager();
  }

  /**
   * Esperar a que header.js dispare el evento 'headerReady'
   */
  async waitForHeader() {
    // Si ya esta cargado, continuar inmediatamente
    if (this.isHeaderLoaded()) {
      return true;
    }

    // Esperar el Custom Event de header.js (timeout 2s)
    const eventFired = await new Promise((resolve) => {
      const handler = () => {
        document.removeEventListener('headerReady', handler);
        resolve(true);
      };
      document.addEventListener('headerReady', handler);
      setTimeout(() => {
        document.removeEventListener('headerReady', handler);
        resolve(false);
      }, 2000);
    });

    // Verificar que el header realmente cargo en el DOM
    if (!this.isHeaderLoaded()) {
      console.error('❌ Header no se cargo correctamente');
      return false;
    }

    return eventFired;
  }

  /**
   * Verificar si el header esta presente en el DOM
   */
  isHeaderLoaded() {
    return !!(document.querySelector('.dashboard-header') && document.getElementById('userName'));
  }

  /**
   * Verificar autenticación
   */
  checkAuth() {
    try {
      if (!authService.isAuthenticated()) {
        // Detener inactivity manager si existe
        if (window.inactivityManager && window.inactivityManager.isActive) {
          window.inactivityManager.stop();
        }

        // Limpiar cualquier token residual
        try {
          localStorage.clear();
          sessionStorage.clear();
        } catch (e) {
          // silenciar
        }

        window.location.replace(window.location.origin + '/login');
        return false;
      }
      return true;
    } catch (error) {
      console.error('❌ Error en checkAuth:', error);
      // En caso de error, asumir no autenticado con ruta dinámica
      const loginUrl = window.location.origin + '/login';
      window.location.replace(loginUrl);
      return false;
    }
  }

  /**
   * Cargar usuario desde storage (sincrono, sin network)
   */
  loadCurrentUserFromStorage() {
    const storedUser = authService.getCurrentUser();
    if (storedUser && storedUser.perfil_id) {
      this.currentUser = storedUser;
    }
  }

  /**
   * Obtener datos frescos del backend (no bloquea si falla)
   */
  async refreshCurrentUser() {
    try {
      const freshUser = await authService.getMyProfile();
      if (freshUser && freshUser.perfil_id) {
        this.currentUser = freshUser;
      }
    } catch (error) {
      console.error('❌ Error refrescando usuario:', error);
      if (!this.currentUser || !this.currentUser.perfil_id) {
        window.location.replace(window.location.origin + '/login');
      }
    }
  }

  /**
   * Inicializar módulos existentes (NO se mueven, solo instanciamos)
   */
  initializeModules() {
    if (window.DashboardFilters) {
      this.filters = new DashboardFilters(this);
    }
    if (window.DashboardPagination) {
      this.pagination = new DashboardPagination(this);
    }
    if (window.DashboardCarousel) {
      this.carousel = new DashboardCarousel(this);
    }
  }

  /**
   * Inicializar módulos de búsqueda
   */
  async initializeSearchModules() {
    if (window.SearchSimpleModule) {
      this.searchSimpleModule = new SearchSimpleModule(this);
      await this.searchSimpleModule.init();
      window.searchSimpleModule = this.searchSimpleModule;
    }

    if (this.currentUser && this.currentUser.perfil_id === 4 && window.SearchAdminModule) {
      this.searchAdminModule = new SearchAdminModule(this);
      await this.searchAdminModule.init();
      window.searchAdminModule = this.searchAdminModule;
    }
  }

  // ✅ UI del header (menú usuario, logout, hamburguesa) gestionada por header.js

  /**
   * Iniciar gestor de inactividad
   */
  startInactivityManager() {
    if (window.inactivityManager) {
      inactivityManager.start();
    }
  }

  /**
   * Método de compatibilidad: switchTab
   * (Para que módulos existentes puedan cambiar de tab)
   */
  switchTab(tabId) {
    if (this.router) {
      this.router.navigate(tabId);
    }
  }

  /**
   * Método de compatibilidad: loadUserFavorites
   * (Para que módulos existentes puedan cargar favoritos)
   */
  async loadUserFavorites() {
    try {
      const token = authService.getToken();
      const response = await fetch(`${API_CONFIG.BASE_URL}/favoritos/`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (response.ok) {
        const favoritos = await response.json();
        return favoritos;
      }
      return [];
    } catch (error) {
      console.error('Error cargando favoritos:', error);
      return [];
    }
  }

  /**
   * Método de compatibilidad: toggleFavorite
   * (Para que los cards de propiedades puedan agregar/quitar favoritos)
   */
  async toggleFavorite(propertyId, isFavorite, favoritoId) {
    try {
      const token = authService.getToken();

      if (isFavorite) {
        // Quitar de favoritos
        await fetch(`${API_CONFIG.BASE_URL}/favoritos/${favoritoId}`, {
          method: 'DELETE',
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });
        showNotification('Propiedad eliminada de favoritos', 'success');
      } else {
        // Agregar a favoritos
        await fetch(`${API_CONFIG.BASE_URL}/favoritos/`, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            registro_cab_id: propertyId
          })
        });
        showNotification('Propiedad agregada a favoritos', 'success');
      }

      return true;
    } catch (error) {
      console.error('Error toggle favorito:', error);
      showNotification('Error al actualizar favorito', 'error');
      return false;
    }
  }
}

// Inicializar cuando el DOM esté listo
document.addEventListener('DOMContentLoaded', () => {
  window.dashboardApp = new DashboardApp();
});

// Exponer globalmente para compatibilidad
window.DashboardApp = DashboardApp;

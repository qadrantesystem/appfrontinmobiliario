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
    console.log('🚀 Inicializando Dashboard App...');

    // 1. Verificar autenticación
    if (!this.checkAuth()) {
      return;
    }

    // 2. Esperar a que el header se cargue (header.js lo maneja async)
    await this.waitForHeader();

    // 3. Cargar usuario actual (solo datos, header.js muestra la UI)
    await this.loadCurrentUser();

    // 4. Inicializar módulos existentes
    this.initializeModules();

    // 5. Inicializar módulos de búsqueda
    await this.initializeSearchModules();

    // 6. Inicializar router (carga tabs)
    this.router = new DashboardRouter(this);
    await this.router.init();

    // 7. Iniciar gestor de inactividad
    this.startInactivityManager();

    console.log('✅ Dashboard App inicializado');
  }

  /**
   * Esperar a que header.js dispare el evento 'headerReady'
   */
  async waitForHeader() {
    // Si ya está cargado, continuar inmediatamente
    if (document.querySelector('.dashboard-header') && document.getElementById('userName')) {
      return true;
    }
    // Esperar el Custom Event de header.js (timeout 5s)
    return new Promise((resolve) => {
      const handler = () => {
        document.removeEventListener('headerReady', handler);
        resolve(true);
      };
      document.addEventListener('headerReady', handler);
      setTimeout(() => {
        document.removeEventListener('headerReady', handler);
        resolve(false);
      }, 5000);
    });
  }

  /**
   * Verificar autenticación
   */
  checkAuth() {
    try {
      if (!authService.isAuthenticated()) {
        console.log('❌ No autenticado, redirigiendo al login...');
        
        // Detener inactivity manager si existe
        if (window.inactivityManager && window.inactivityManager.isActive) {
          window.inactivityManager.stop();
        }
        
        // Limpiar cualquier token residual
        try {
          localStorage.clear();
          sessionStorage.clear();
        } catch (e) {
          console.error('Error limpiando storage:', e);
        }
        
        // Construir URL dinámica
        const loginUrl = window.location.origin + '/login';
        console.log('🔄 Redirigiendo a:', loginUrl);
        
        // Usar replace para evitar bucles con el botón atrás
        window.location.replace(loginUrl);
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
   * Cargar usuario actual
   */
  async loadCurrentUser() {
    try {
      // Obtener usuario del storage primero (rápido)
      const storedUser = authService.getCurrentUser();
      if (storedUser && storedUser.perfil_id) {
        this.currentUser = storedUser;
      }

      // Luego obtener datos frescos del backend
      const freshUser = await authService.getMyProfile();
      if (freshUser && freshUser.perfil_id) {
        this.currentUser = freshUser;
      }

    } catch (error) {
      console.error('❌ Error cargando usuario:', error);

      // Fallback a storage
      const storedUser = authService.getCurrentUser();
      if (storedUser && storedUser.perfil_id) {
        this.currentUser = storedUser;
      } else {
        console.error('❌ No hay usuario válido');
        setTimeout(() => {
          window.location.href = 'login.html';
        }, 2000);
      }
    }
  }

  /**
   * Refresh user info (actualiza header via headerComponent)
   */
  refreshUserInfo() {
    const currentUser = JSON.parse(localStorage.getItem('current_user') || '{}');
    if (currentUser && currentUser.usuario_id && window.headerComponent) {
      this.currentUser = currentUser;
      window.headerComponent.displayUserInfo(currentUser);
    }
  }

  /**
   * Inicializar módulos existentes (NO se mueven, solo instanciamos)
   */
  initializeModules() {
    console.log('🔧 Inicializando módulos existentes...');

    // DashboardFilters (existente)
    if (window.DashboardFilters) {
      this.filters = new DashboardFilters(this);
      console.log('✅ DashboardFilters inicializado');
    }

    // DashboardPagination (existente)
    if (window.DashboardPagination) {
      this.pagination = new DashboardPagination(this);
      console.log('✅ DashboardPagination inicializado');
    }

    // DashboardCarousel (existente)
    if (window.DashboardCarousel) {
      this.carousel = new DashboardCarousel(this);
      console.log('✅ DashboardCarousel inicializado');
    }
  }

  /**
   * Inicializar módulos de búsqueda
   */
  async initializeSearchModules() {
    // SearchSimpleModule (existente - para usuarios normales)
    if (window.SearchSimpleModule) {
      console.log('🔍 Inicializando SearchSimpleModule...');
      this.searchSimpleModule = new SearchSimpleModule(this);
      await this.searchSimpleModule.init();
      window.searchSimpleModule = this.searchSimpleModule;
      console.log('✅ SearchSimpleModule inicializado');
    }

    // SearchAdminModule (existente - solo para admin)
    if (this.currentUser.perfil_id === 4 && window.SearchAdminModule) {
      console.log('🔍 Inicializando SearchAdminModule (Admin)...');
      this.searchAdminModule = new SearchAdminModule(this);
      await this.searchAdminModule.init();
      window.searchAdminModule = this.searchAdminModule;
      console.log('✅ SearchAdminModule inicializado');
    }
  }

  // ✅ UI del header (menú usuario, logout, hamburguesa) gestionada por header.js

  /**
   * Iniciar gestor de inactividad
   */
  startInactivityManager() {
    if (window.inactivityManager) {
      inactivityManager.start();
      console.log('✅ Gestor de inactividad iniciado');
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

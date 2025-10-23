/**
 * 🎯 Dashboard App - Orquestador Principal
 * Archivo: core/dashboard-app.js
 * Líneas: ~300
 * REEMPLAZA: dashboard.js (2,428 líneas)
 */

class DashboardApp {
  constructor() {
    // Elementos del DOM
    this.userName = document.getElementById('userName');
    this.userRole = document.getElementById('userRole');
    this.userAvatar = document.getElementById('userAvatar');
    this.avatarInitials = document.getElementById('avatarInitials');
    this.userMenuBtn = document.getElementById('userMenuBtn');
    this.userMenu = document.querySelector('.user-menu');
    this.logoutBtn = document.getElementById('logoutBtn');

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

    // 2. Cargar usuario actual
    await this.loadCurrentUser();

    // 3. Inicializar módulos existentes
    this.initializeModules();

    // 4. Inicializar módulos de búsqueda
    await this.initializeSearchModules();

    // 5. Setup UI
    this.setupUI();

    // 6. Inicializar router (carga tabs)
    this.router = new DashboardRouter(this);
    await this.router.init();

    // 7. Iniciar gestor de inactividad
    this.startInactivityManager();

    console.log('✅ Dashboard App inicializado');
  }

  /**
   * Verificar autenticación
   */
  checkAuth() {
    if (!authService.isAuthenticated()) {
      console.log('❌ No autenticado, redirigiendo al login...');
      window.location.href = 'login.html';
      return false;
    }
    return true;
  }

  /**
   * Cargar usuario actual
   */
  async loadCurrentUser() {
    try {
      console.log('👤 Cargando usuario...');

      // Obtener usuario del storage primero (rápido)
      const storedUser = authService.getCurrentUser();
      console.log('👤 Usuario del storage:', storedUser);

      if (storedUser && storedUser.perfil_id) {
        this.currentUser = storedUser;
        this.displayUserInfo(storedUser);
      }

      // Luego obtener datos frescos del backend
      const freshUser = await authService.getMyProfile();
      console.log('👤 Usuario del backend:', freshUser);

      if (freshUser && freshUser.perfil_id) {
        this.currentUser = freshUser;
        this.displayUserInfo(freshUser);
      } else {
        console.warn('⚠️ Usuario del backend sin perfil_id, usando storage');
      }

    } catch (error) {
      console.error('❌ Error cargando usuario:', error);
      showNotification('Error al cargar datos del usuario', 'error');

      // Fallback a storage
      const storedUser = authService.getCurrentUser();
      if (storedUser && storedUser.perfil_id) {
        this.currentUser = storedUser;
        this.displayUserInfo(storedUser);
      } else {
        console.error('❌ No hay usuario válido');
        setTimeout(() => {
          window.location.href = 'login.html';
        }, 2000);
      }
    }
  }

  /**
   * Mostrar información del usuario
   */
  displayUserInfo(user) {
    // Nombre completo
    const fullName = `${user.nombre} ${user.apellido}`;
    this.userName.textContent = fullName;

    // Rol/Perfil
    const perfilId = parseInt(user.perfil_id);
    const perfilNames = {
      1: 'Demandante',
      2: 'Ofertante',
      3: 'Corredor',
      4: 'Administrador'
    };
    this.userRole.textContent = perfilNames[perfilId] || 'Usuario';

    // Avatar
    this.generateAvatar(user);

    // Ocultar "Mi Plan" para administradores
    const planLink = document.getElementById('planLink');
    if (planLink) {
      planLink.style.display = perfilId === 4 ? 'none' : 'flex';
    }
  }

  /**
   * Generar avatar
   */
  generateAvatar(user) {
    if (user.foto_perfil) {
      const img = document.createElement('img');
      img.src = user.foto_perfil;
      img.alt = user.nombre;
      this.userAvatar.innerHTML = '';
      this.userAvatar.appendChild(img);
    } else {
      // Generar iniciales
      const initials = `${user.nombre.charAt(0)}${user.apellido.charAt(0)}`.toUpperCase();
      this.avatarInitials.textContent = initials;
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

  /**
   * Setup de UI
   */
  setupUI() {
    this.setupUserMenu();
    this.setupLogout();
  }

  /**
   * Setup de menú de usuario
   */
  setupUserMenu() {
    if (!this.userMenuBtn || !this.userMenu) {
      console.error('❌ Elementos del menú de usuario no encontrados');
      return;
    }

    // Toggle del menú
    this.userMenuBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      const isActive = this.userMenu.classList.toggle('active');
      console.log(`${isActive ? '✅' : '❌'} Menú de usuario ${isActive ? 'abierto' : 'cerrado'}`);
    });

    // Cerrar menú al hacer click fuera
    document.addEventListener('click', (e) => {
      if (!this.userMenu.contains(e.target)) {
        this.userMenu.classList.remove('active');
      }
    });

    console.log('✅ setupUserMenu() completado');
  }

  /**
   * Setup de logout
   */
  setupLogout() {
    this.logoutBtn.addEventListener('click', (e) => {
      e.preventDefault();
      if (confirm('¿Estás seguro que deseas cerrar sesión?')) {
        authService.logout();
      }
    });
  }

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

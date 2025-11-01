/**
 * 🧭 Dashboard Router - Gestor de navegación entre tabs
 * Archivo: core/dashboard-router.js
 * Líneas: ~200
 */

class DashboardRouter {
  constructor(app) {
    this.app = app;
    this.currentTab = null;
    this.currentModule = null;
    this.tabsList = document.getElementById('tabsList');
    this.tabContent = document.getElementById('tabContent');
    this.modules = new Map(); // Cache de módulos cargados
  }

  /**
   * Inicializar router
   */
  async init() {
    console.log('🧭 Inicializando Router...');

    // Renderizar tabs según perfil
    this.renderTabs();

    // Cargar primer tab
    const firstTab = this.getFirstTab();
    await this.navigate(firstTab);

    console.log('✅ Router inicializado');
  }

  /**
   * Renderizar tabs en el DOM
   */
  renderTabs() {
    const profileId = this.app.currentUser.perfil_id;
    const tabs = TabsConfig.getForProfile(profileId);

    console.log(`📋 Renderizando ${tabs.length} tabs para perfil ${profileId}`);

    // Limpiar tabs anteriores
    this.tabsList.innerHTML = '';

    // Crear botones de tabs
    tabs.forEach((tab, index) => {
      const tabBtn = document.createElement('button');
      tabBtn.className = 'tab-btn';
      tabBtn.dataset.tab = tab.id;
      tabBtn.dataset.tooltip = tab.name;
      tabBtn.innerHTML = `${tab.icon} <span class="tab-btn-text">${tab.name}</span>`;

      // Primer tab activo
      if (index === 0) {
        tabBtn.classList.add('active');
      }

      // Click event
      tabBtn.addEventListener('click', () => {
        this.navigate(tab.id);
      });

      // Touch event para móvil (tooltip)
      let touchTimeout;
      tabBtn.addEventListener('touchstart', () => {
        if (window.innerWidth <= 768) {
          tabBtn.style.setProperty('--show-tooltip', '1');
          clearTimeout(touchTimeout);
          touchTimeout = setTimeout(() => {
            tabBtn.style.removeProperty('--show-tooltip');
          }, 1500);
        }
      });

      this.tabsList.appendChild(tabBtn);
    });
  }

  /**
   * Navegar a un tab
   */
  async navigate(tabId) {
    // Si es el mismo tab, no hacer nada
    if (this.currentTab === tabId) {
      console.log(`ℹ️ Ya estás en el tab: ${tabId}`);
      return;
    }

    console.log(`📍 Navegando a tab: ${tabId}`);

    // Mostrar loading
    this.showLoading();

    // Actualizar tab activo
    this.updateActiveTab(tabId);

    // Destruir módulo anterior si existe
    await this.destroyCurrentModule();

    try {
      // Cargar contenido del tab
      await this.loadTabContent(tabId);

      // Actualizar estado
      this.currentTab = tabId;

      console.log(`✅ Tab ${tabId} cargado`);

    } catch (error) {
      console.error(`❌ Error cargando tab ${tabId}:`, error);
      this.showError(error);
    }
  }

  /**
   * Cargar contenido de un tab
   */
  async loadTabContent(tabId) {
    let content = '';

    // Cargar según el tab
    switch (tabId) {
      case 'dashboard':
        content = await this.loadDashboardTab();
        break;
      case 'propiedades':
        content = await this.loadPropiedadesTab();
        break;
      case 'busquedas':
        content = await this.loadBusquedasTab();
        break;
      case 'favoritos':
        content = await this.loadFavoritosTab();
        break;
      case 'subscripciones':
        content = await this.loadSubscripcionesTab();
        break;
      case 'aprobaciones':
        content = await this.loadAprobacionesTab();
        break;
      case 'mantenimientos':
        content = await this.loadMantenimientosTab();
        break;
      case 'usuarios':
        content = await this.loadUsuariosTab();
        break;
      case 'reportes':
        content = await this.loadReportesTab();
        break;
      default:
        content = this.getPlaceholderContent(tabId);
    }

    // Renderizar contenido
    this.tabContent.innerHTML = content;

    // Setup de event listeners después de renderizar
    await this.setupTabEventListeners(tabId);
  }

  /**
   * Cargar tab Dashboard (delega al módulo)
   */
  async loadDashboardTab() {
    if (window.DashboardHomeTab) {
      const module = new DashboardHomeTab(this.app);
      this.currentModule = module;
      return await module.render();
    }
    return '<p>Módulo Dashboard no disponible</p>';
  }

  /**
   * Cargar tab Propiedades (delega al módulo)
   */
  async loadPropiedadesTab() {
    if (window.PropiedadesTab) {
      const module = new PropiedadesTab(this.app);
      this.currentModule = module;
      return await module.render();
    }
    return '<p>Módulo Propiedades no disponible</p>';
  }

  /**
   * Cargar tab Búsquedas (usa módulos existentes)
   */
  async loadBusquedasTab() {
    // Usar el nuevo BusquedasTab para todos los perfiles
    if (typeof BusquedasTab !== 'undefined') {
      const module = new BusquedasTab(this.app);
      this.currentModule = module;
      return await module.render();
    }

    return '<p>Módulo de búsquedas no disponible</p>';
  }

  /**
   * Cargar tab Favoritos (delega al módulo)
   */
  async loadFavoritosTab() {
    if (window.FavoritosTab) {
      const module = new FavoritosTab(this.app);
      this.currentModule = module;
      return await module.render();
    }
    return '<p>Módulo Favoritos no disponible</p>';
  }

  /**
   * Cargar tab Subscripciones (delega al módulo)
   */
  async loadSubscripcionesTab() {
    if (window.SubscripcionesTab) {
      const module = new SubscripcionesTab(this.app);
      this.currentModule = module;
      return await module.render();
    }
    return '<p>Módulo Subscripciones no disponible</p>';
  }

  /**
   * Cargar tab Aprobaciones (delega al módulo)
   */
  async loadAprobacionesTab() {
    if (window.AprobacionesTab) {
      const module = new AprobacionesTab(this.app);
      this.currentModule = module;
      return await module.render();
    }
    return '<p>Módulo Aprobaciones no disponible</p>';
  }

  /**
   * Cargar tab Mantenimientos (delega al módulo)
   */
  async loadMantenimientosTab() {
    if (window.MantenimientosTab) {
      const module = new MantenimientosTab(this.app);
      this.currentModule = module;
      return await module.render();
    }
    return '<p>Módulo Mantenimientos no disponible</p>';
  }

  /**
   * Cargar tab Usuarios (delega al módulo)
   */
  async loadUsuariosTab() {
    if (window.UsuariosTab) {
      const module = new UsuariosTab(this.app);
      this.currentModule = module;
      return await module.render();
    }
    return '<p>Módulo Usuarios no disponible</p>';
  }

  /**
   * Cargar tab Reportes (delega al módulo)
   */
  async loadReportesTab() {
    if (window.ReportesTab) {
      const module = new ReportesTab(this.app);
      this.currentModule = module;
      return await module.render();
    }
    return '<p>Módulo Reportes no disponible</p>';
  }

  /**
   * Setup de event listeners después de renderizar
   */
  async setupTabEventListeners(tabId) {
    if (this.currentModule && this.currentModule.afterRender) {
      await this.currentModule.afterRender();
    }
  }

  /**
   * Destruir módulo actual
   */
  async destroyCurrentModule() {
    if (this.currentModule && this.currentModule.destroy) {
      await this.currentModule.destroy();
      this.currentModule = null;
    }
  }

  /**
   * Actualizar tab activo visualmente
   */
  updateActiveTab(tabId) {
    document.querySelectorAll('.tab-btn').forEach(btn => {
      btn.classList.toggle('active', btn.dataset.tab === tabId);
    });
  }

  /**
   * Obtener primer tab
   */
  getFirstTab() {
    const tabs = TabsConfig.getForProfile(this.app.currentUser.perfil_id);
    return tabs[0]?.id || 'dashboard';
  }

  /**
   * Mostrar loading
   */
  showLoading() {
    this.tabContent.innerHTML = `
      <div class="loading-state">
        <div class="spinner-large"></div>
        <p>Cargando contenido...</p>
      </div>
    `;
  }

  /**
   * Mostrar error
   */
  showError(error) {
    this.tabContent.innerHTML = `
      <div class="empty-state">
        <h3>Error</h3>
        <p>${error.message || 'Error cargando contenido'}</p>
        <button onclick="location.reload()" class="btn-primary">Reintentar</button>
      </div>
    `;
  }

  /**
   * Contenido placeholder
   */
  getPlaceholderContent(tabId) {
    return `
      <div class="empty-state">
        <h3>Tab: ${tabId}</h3>
        <p>Este módulo aún no está implementado</p>
      </div>
    `;
  }
}

// Exponer globalmente
window.DashboardRouter = DashboardRouter;

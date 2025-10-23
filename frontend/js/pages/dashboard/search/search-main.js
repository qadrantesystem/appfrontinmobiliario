/**
 * 🔍 Search Main Controller
 * Controlador principal del módulo de búsquedas
 * Patrón: Similar a maintenance-main.js
 */

class SearchController {
  constructor(dashboard) {
    this.dashboard = dashboard;
    this.currentView = 'history'; // 'history' | 'new-search'

    // Sub-módulos
    this.modules = {
      'history': null,      // Historial de búsquedas
      'filters': null,      // Filtros de búsqueda
      'results': null,      // Resultados de búsqueda
      'map': null          // Mapa de resultados
    };

    // Estado de la búsqueda actual
    this.currentSearch = {
      filters: {},
      results: [],
      pagination: {
        page: 1,
        limit: 12,
        total: 0
      }
    };

    // Asignar a window para que funcionen los onclick
    window.searchController = this;
  }

  /**
   * Renderizar el contenido principal del tab de búsquedas
   */
  async render() {
    console.log('🎨 SearchController.render() called');

    try {
      // Inicializar módulos si no existen
      if (!this.modules.history) {
        this.modules.history = new SearchHistoryModule(this);
      }
      if (!this.modules.filters) {
        this.modules.filters = new SearchFiltersModule(this);
      }
      if (!this.modules.results) {
        this.modules.results = new SearchResultsModule(this);
      }
      if (!this.modules.map) {
        this.modules.map = new SearchMapModule(this);
      }

      // Renderizar vista inicial (historial)
      return await this.renderHistoryView();

    } catch (error) {
      console.error('❌ Error en SearchController.render():', error);
      return `<div class="empty-state"><h3>Error al cargar búsquedas</h3><p>${error.message}</p></div>`;
    }
  }

  /**
   * Renderizar vista de historial de búsquedas
   */
  async renderHistoryView() {
    this.currentView = 'history';

    const historyContent = await this.modules.history.render();

    return `
      <div class="search-container">
        <div class="search-header">
          <div class="search-title">
            <h2>Mis Búsquedas</h2>
            <p>Historial de búsquedas guardadas</p>
          </div>
          <button class="btn btn-primary" onclick="window.searchController.openNewSearch()">
            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <line x1="12" y1="5" x2="12" y2="19"></line>
              <line x1="5" y1="12" x2="19" y2="12"></line>
            </svg>
            Nueva Búsqueda
          </button>
        </div>

        <div class="search-content">
          ${historyContent}
        </div>
      </div>
    `;
  }

  /**
   * Renderizar vista de nueva búsqueda (3 secciones)
   */
  async renderNewSearchView() {
    this.currentView = 'new-search';

    const filtersContent = await this.modules.filters.render();
    const resultsContent = await this.modules.results.render();
    const mapContent = await this.modules.map.render();

    return `
      <div class="search-container search-new">
        <div class="search-header">
          <button class="btn btn-back" onclick="window.searchController.backToHistory()">
            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <line x1="19" y1="12" x2="5" y2="12"></line>
              <polyline points="12 19 5 12 12 5"></polyline>
            </svg>
            Volver al Historial
          </button>
          <div class="search-title">
            <h2>Nueva Búsqueda</h2>
            <p>Encuentra tu propiedad ideal</p>
          </div>
        </div>

        <!-- Layout de 3 secciones: Filtros | Resultados | Mapa -->
        <div class="search-layout">
          <!-- Sección 1: Filtros (Sidebar) -->
          <aside class="search-sidebar">
            ${filtersContent}
          </aside>

          <!-- Sección 2 y 3: Resultados + Mapa -->
          <main class="search-main">
            <!-- Resultados -->
            <section class="search-results-section">
              ${resultsContent}
            </section>

            <!-- Mapa -->
            <section class="search-map-section">
              ${mapContent}
            </section>

            <!-- Botón Guardar Búsqueda -->
            <div class="search-actions">
              <button class="btn btn-primary btn-lg" onclick="window.searchController.saveSearch()">
                <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z"></path>
                  <polyline points="17 21 17 13 7 13 7 21"></polyline>
                  <polyline points="7 3 7 8 15 8"></polyline>
                </svg>
                Guardar esta Búsqueda
              </button>
            </div>
          </main>
        </div>

        <!-- Drawer para móvil (Filtros) -->
        <div class="search-drawer" id="searchDrawer">
          <div class="drawer-header">
            <h3>Filtros</h3>
            <button class="drawer-close" onclick="window.searchController.closeDrawer()">
              <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <line x1="18" y1="6" x2="6" y2="18"></line>
                <line x1="6" y1="6" x2="18" y2="18"></line>
              </svg>
            </button>
          </div>
          <div class="drawer-content">
            ${filtersContent}
          </div>
        </div>
      </div>
    `;
  }

  /**
   * Abrir modal/vista de nueva búsqueda
   */
  async openNewSearch() {
    console.log('🔍 Abriendo nueva búsqueda...');
    console.log('🔍 window.searchController existe?', !!window.searchController);
    console.log('🔍 Módulos inicializados?', {
      history: !!this.modules.history,
      filters: !!this.modules.filters,
      results: !!this.modules.results,
      map: !!this.modules.map
    });

    try {
      // Limpiar búsqueda actual
      this.currentSearch = {
        filters: {},
        results: [],
        pagination: {
          page: 1,
          limit: 12,
          total: 0
        }
      };

      // Re-renderizar el tab completo con la vista de búsqueda
      console.log('🎨 Renderizando vista de nueva búsqueda...');
      const content = await this.renderNewSearchView();

      const tabContent = document.getElementById('tabContent');
      if (!tabContent) {
        console.error('❌ #tabContent no encontrado');
        showNotification('Error: contenedor de tab no encontrado', 'error');
        return;
      }

      console.log('✅ Insertando contenido HTML...');
      tabContent.innerHTML = content;

      // Setup event listeners de los módulos (con validaciones)
      console.log('🎛️ Configurando event listeners...');
      if (this.modules.filters && typeof this.modules.filters.setupEventListeners === 'function') {
        this.modules.filters.setupEventListeners();
      }
      if (this.modules.results && typeof this.modules.results.setupEventListeners === 'function') {
        this.modules.results.setupEventListeners();
      }
      if (this.modules.map && typeof this.modules.map.setupEventListeners === 'function') {
        this.modules.map.setupEventListeners();
      }

      console.log('✅ Nueva búsqueda abierta correctamente');

    } catch (error) {
      console.error('❌ Error al abrir nueva búsqueda:', error);
      showNotification('Error al abrir búsqueda: ' + error.message, 'error');
    }
  }

  /**
   * Volver a la vista de historial
   */
  async backToHistory() {
    console.log('📋 Volviendo al historial...');

    const content = await this.renderHistoryView();
    const tabContent = document.getElementById('tabContent');
    if (tabContent) {
      tabContent.innerHTML = content;

      // Setup event listeners con validación
      if (this.modules.history && typeof this.modules.history.setupEventListeners === 'function') {
        this.modules.history.setupEventListeners();
      }
    }
  }

  /**
   * Ejecutar búsqueda con filtros actuales
   */
  async executeSearch(filters = null) {
    console.log('🔍 Ejecutando búsqueda...', filters);

    try {
      if (filters) {
        this.currentSearch.filters = filters;
      }

      // Llamar al módulo de resultados para ejecutar la búsqueda
      await this.modules.results.searchProperties(this.currentSearch.filters, this.currentSearch.pagination);

      // Actualizar el mapa con los resultados
      if (this.modules.results.data.length > 0) {
        await this.modules.map.updateMarkers(this.modules.results.data);
      }

    } catch (error) {
      console.error('❌ Error al ejecutar búsqueda:', error);
      showNotification('Error al buscar propiedades: ' + error.message, 'error');
    }
  }

  /**
   * Guardar búsqueda actual
   */
  async saveSearch() {
    console.log('💾 Guardando búsqueda...', this.currentSearch.filters);

    try {
      // Validar que haya filtros
      if (Object.keys(this.currentSearch.filters).length === 0) {
        showNotification('Debes aplicar al menos un filtro antes de guardar', 'warning');
        return;
      }

      // Llamar al servicio para guardar
      const response = await searchService.saveSearch(this.currentSearch.filters);

      showNotification('Búsqueda guardada correctamente', 'success');

      // Opcionalmente, volver al historial
      // await this.backToHistory();

    } catch (error) {
      console.error('❌ Error al guardar búsqueda:', error);
      showNotification('Error al guardar búsqueda: ' + error.message, 'error');
    }
  }

  /**
   * Abrir drawer de filtros (móvil)
   */
  openDrawer() {
    const drawer = document.getElementById('searchDrawer');
    if (drawer) {
      drawer.classList.add('active');
    }
  }

  /**
   * Cerrar drawer de filtros (móvil)
   */
  closeDrawer() {
    const drawer = document.getElementById('searchDrawer');
    if (drawer) {
      drawer.classList.remove('active');
    }
  }

  /**
   * Setup event listeners después de renderizar
   */
  setupEventListeners() {
    console.log('🎛️ SearchController.setupEventListeners() called');

    if (this.currentView === 'history') {
      if (this.modules.history && typeof this.modules.history.setupEventListeners === 'function') {
        this.modules.history.setupEventListeners();
      }
    } else if (this.currentView === 'new-search') {
      if (this.modules.filters && typeof this.modules.filters.setupEventListeners === 'function') {
        this.modules.filters.setupEventListeners();
      }
      if (this.modules.results && typeof this.modules.results.setupEventListeners === 'function') {
        this.modules.results.setupEventListeners();
      }
      if (this.modules.map && typeof this.modules.map.setupEventListeners === 'function') {
        this.modules.map.setupEventListeners();
      }
    }
  }
}

// Exportar clase a window para que dashboard.js pueda encontrarla
window.SearchController = SearchController;

// Variable global para instancia
let searchController;

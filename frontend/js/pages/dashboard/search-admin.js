/**
 * 🔍 SEARCH ADMIN MODULE - Módulo de Búsquedas para Administrador
 * Perfil 4 - Ve TODAS las búsquedas de TODOS los usuarios
 * Paginación: 10 web / 5 móvil
 */

class SearchAdminModule {
  constructor(dashboard) {
    this.dashboard = dashboard;
    this.allSearches = [];
    this.filteredSearches = [];
    this.currentPage = 1;
    this.itemsPerPage = window.innerWidth <= 768 ? 5 : 10;
    
    // Filtros
    this.filters = {
      usuario_nombre: null,
      fecha_desde: null,
      fecha_hasta: null
    };
    
    // Catálogos
    this.usuarios = [];
    this.tiposInmuebles = [];
    this.distritos = [];
    
    this.init();
  }

  async init() {
    console.log('👨‍💼 Inicializando SearchAdminModule...');
    await this.loadCatalogos();
    console.log('✅ SearchAdminModule inicializado');
  }

  async loadCatalogos() {
    try {
      const token = authService.getToken();
      
      // Cargar usuarios, tipos de inmuebles y distritos
      const [tiposRes, distritosRes] = await Promise.all([
        fetch(`${API_CONFIG.BASE_URL}/tipos-inmueble`),
        fetch(`${API_CONFIG.BASE_URL}/distritos`)
      ]);
      
      if (tiposRes.ok) {
        const tiposData = await tiposRes.json();
        this.tiposInmuebles = tiposData.data || tiposData || [];
      }
      
      if (distritosRes.ok) {
        const distritosData = await distritosRes.json();
        this.distritos = distritosData.data || distritosData || [];
      }
      
      console.log('✅ Catálogos admin cargados');
    } catch (error) {
      console.error('❌ Error cargando catálogos admin:', error);
    }
  }

  async loadAllSearches() {
    try {
      const token = authService.getToken();
      
      // Construir query params
      const params = new URLSearchParams();
      if (this.filters.usuario_nombre) params.append('usuario_nombre', this.filters.usuario_nombre);
      if (this.filters.fecha_desde) params.append('fecha_desde', this.filters.fecha_desde);
      if (this.filters.fecha_hasta) params.append('fecha_hasta', this.filters.fecha_hasta);
      params.append('limit', '100'); // Traer hasta 100 búsquedas
      
      const url = `${API_CONFIG.BASE_URL}/busquedas/admin/todas?${params.toString()}`;
      
      const response = await fetch(url, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      
      if (!response.ok) {
        throw new Error(`Error HTTP: ${response.status}`);
      }
      
      const data = await response.json();
      this.allSearches = Array.isArray(data) ? data : (data.data || data.busquedas || []);
      this.filteredSearches = [...this.allSearches];
      this.currentPage = 1;
      
      console.log(`✅ ${this.allSearches.length} búsquedas cargadas (admin)`);
      
      return this.allSearches;
    } catch (error) {
      console.error('❌ Error cargando búsquedas admin:', error);
      this.allSearches = [];
      this.filteredSearches = [];
      throw error;
    }
  }

  applyFilters() {
    this.filteredSearches = this.allSearches;
    this.currentPage = 1;
  }

  renderFilters() {
    return `
      <div style="background: white; padding: var(--spacing-lg); border-radius: var(--radius-lg); box-shadow: var(--shadow-sm); margin-bottom: var(--spacing-lg);">
        <h3 style="color: var(--azul-corporativo); margin: 0 0 var(--spacing-md) 0; font-size: 1.1rem;">
          🔍 Filtros de Búsqueda
        </h3>
        <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: var(--spacing-md);">
          
          <!-- Nombre de Usuario -->
          <div>
            <label style="display: block; font-weight: 600; margin-bottom: var(--spacing-xs); color: var(--gris-oscuro); font-size: var(--font-size-small);">
              Nombre de Usuario
            </label>
            <input type="text" id="filter_usuario_nombre" placeholder="Ej: Alan Cairampoma" 
                   style="width: 100%; padding: var(--spacing-sm); border: 2px solid var(--borde); border-radius: var(--radius-md); font-size: var(--font-size-base);">
          </div>
          
          <!-- Fecha Desde -->
          <div>
            <label style="display: block; font-weight: 600; margin-bottom: var(--spacing-xs); color: var(--gris-oscuro); font-size: var(--font-size-small);">
              Desde
            </label>
            <input type="date" id="filter_fecha_desde" 
                   style="width: 100%; padding: var(--spacing-sm); border: 2px solid var(--borde); border-radius: var(--radius-md); font-size: var(--font-size-base);">
          </div>
          
          <!-- Fecha Hasta -->
          <div>
            <label style="display: block; font-weight: 600; margin-bottom: var(--spacing-xs); color: var(--gris-oscuro); font-size: var(--font-size-small);">
              Hasta
            </label>
            <input type="date" id="filter_fecha_hasta" 
                   style="width: 100%; padding: var(--spacing-sm); border: 2px solid var(--borde); border-radius: var(--radius-md); font-size: var(--font-size-base);">
          </div>
          
          <!-- Botones -->
          <div style="display: flex; gap: var(--spacing-sm); align-items: flex-end;">
            <button onclick="window.searchAdminModule.handleApplyFilters()" 
                    style="flex: 1; padding: var(--spacing-sm) var(--spacing-md); background: var(--azul-corporativo); color: white; border: none; border-radius: var(--radius-md); cursor: pointer; font-weight: 600; transition: var(--transition-fast);">
              Aplicar
            </button>
            <button onclick="window.searchAdminModule.handleClearFilters()" 
                    style="flex: 1; padding: var(--spacing-sm) var(--spacing-md); background: var(--gris-claro); color: var(--gris-oscuro); border: none; border-radius: var(--radius-md); cursor: pointer; font-weight: 600; transition: var(--transition-fast);">
              Limpiar
            </button>
          </div>
        </div>
      </div>
    `;
  }

  renderSearchCard(busqueda, index) {
    const criterios = busqueda.criterios_json || {};
    const fecha = new Date(busqueda.fecha_busqueda || busqueda.created_at);
    const fechaFormateada = fecha.toLocaleDateString('es-PE', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
    
    // Tipo de inmueble
    const tipoInmueble = criterios.tipo_inmueble_id ? 
      (this.tiposInmuebles.find(t => t.tipo_inmueble_id === criterios.tipo_inmueble_id)?.nombre || 'N/A') : 
      'Todos';
    
    // Distritos
    const distritos = Array.isArray(criterios.distrito_id) && criterios.distrito_id.length > 0 ?
      criterios.distrito_id.slice(0, 2).map(id => 
        this.distritos.find(d => d.distrito_id === id)?.nombre
      ).filter(Boolean).join(', ') + (criterios.distrito_id.length > 2 ? ` (+${criterios.distrito_id.length - 2})` : '') :
      'Todos';
    
    // Rango de precio
    let precio = 'Sin especificar';
    if (criterios.precio_min && criterios.precio_max) {
      precio = `S/ ${criterios.precio_min.toLocaleString()} - S/ ${criterios.precio_max.toLocaleString()}`;
    } else if (criterios.precio_max) {
      precio = `Hasta S/ ${criterios.precio_max.toLocaleString()}`;
    }
    
    return `
      <div style="background: white; border-radius: var(--radius-lg); padding: var(--spacing-lg); box-shadow: var(--shadow-sm); border-left: 4px solid var(--azul-corporativo); transition: var(--transition-normal); cursor: pointer;"
           onmouseenter="this.style.boxShadow='var(--shadow-md)'; this.style.transform='translateY(-2px)';"
           onmouseleave="this.style.boxShadow='var(--shadow-sm)'; this.style.transform='translateY(0)';">
        
        <!-- Header -->
        <div style="display: flex; justify-content: space-between; align-items: start; margin-bottom: var(--spacing-md);">
          <div>
            <h3 style="color: var(--azul-corporativo); margin: 0 0 var(--spacing-xs) 0; font-size: 1.1rem;">
              🔍 ${busqueda.busqueda_id || `Búsqueda #${index + 1}`}
            </h3>
            <p style="color: var(--gris-medio); margin: 0; font-size: var(--font-size-small);">
              📅 ${fechaFormateada}
            </p>
          </div>
          <div style="text-align: right;">
            <div style="display: flex; flex-direction: column; gap: var(--spacing-xs); align-items: flex-end;">
              <span style="display: inline-block; padding: var(--spacing-xs) var(--spacing-sm); background: rgba(0, 102, 204, 0.1); color: var(--azul-corporativo); border-radius: var(--radius-sm); font-size: var(--font-size-small); font-weight: 600;">
                👤 ${busqueda.usuario_nombre || `Usuario #${busqueda.usuario_id}`}
              </span>
              ${busqueda.usuario?.email ? `
                <span style="color: var(--gris-medio); font-size: 0.8rem;">
                  📧 ${busqueda.usuario.email}
                </span>
              ` : ''}
              ${busqueda.usuario?.telefono ? `
                <span style="color: var(--gris-medio); font-size: 0.8rem;">
                  📱 ${busqueda.usuario.telefono}
                </span>
              ` : ''}
            </div>
          </div>
        </div>
        
        <!-- Criterios -->
        <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: var(--spacing-sm); margin-bottom: var(--spacing-md);">
          <div>
            <span style="color: var(--gris-medio); font-size: var(--font-size-small);">Transacción:</span>
            <strong style="color: var(--gris-oscuro); display: block;">
              ${criterios.transaccion === 'alquiler' ? '🏠 Alquiler' : '🏠 Venta'}
            </strong>
          </div>
          <div>
            <span style="color: var(--gris-medio); font-size: var(--font-size-small);">Tipo:</span>
            <strong style="color: var(--gris-oscuro); display: block;">${tipoInmueble}</strong>
          </div>
          <div>
            <span style="color: var(--gris-medio); font-size: var(--font-size-small);">Ubicación:</span>
            <strong style="color: var(--gris-oscuro); display: block;">📍 ${distritos}</strong>
          </div>
        </div>
        
        <!-- Detalles adicionales -->
        <div style="display: flex; flex-wrap: wrap; gap: var(--spacing-sm); margin-bottom: var(--spacing-md);">
          ${criterios.area_min ? `
            <span style="padding: var(--spacing-xs) var(--spacing-sm); background: var(--gris-claro); color: var(--gris-oscuro); border-radius: var(--radius-sm); font-size: var(--font-size-small);">
              📐 ${criterios.area_min}m²+
            </span>
          ` : ''}
          ${criterios.habitaciones_min ? `
            <span style="padding: var(--spacing-xs) var(--spacing-sm); background: var(--gris-claro); color: var(--gris-oscuro); border-radius: var(--radius-sm); font-size: var(--font-size-small);">
              🛏️ ${criterios.habitaciones_min}+ hab
            </span>
          ` : ''}
          ${criterios.banos_min ? `
            <span style="padding: var(--spacing-xs) var(--spacing-sm); background: var(--gris-claro); color: var(--gris-oscuro); border-radius: var(--radius-sm); font-size: var(--font-size-small);">
              🛁 ${criterios.banos_min}+ baños
            </span>
          ` : ''}
          ${criterios.precio_max ? `
            <span style="padding: var(--spacing-xs) var(--spacing-sm); background: var(--gris-claro); color: var(--gris-oscuro); border-radius: var(--radius-sm); font-size: var(--font-size-small);">
              💰 ${precio}
            </span>
          ` : ''}
        </div>
        
        <!-- Footer -->
        <div style="display: flex; justify-content: space-between; align-items: center; padding-top: var(--spacing-md); border-top: 1px solid var(--borde);">
          <span style="color: var(--success); font-weight: 600; font-size: var(--font-size-small);">
            ✅ ${busqueda.cantidad_resultados || 0} resultados
          </span>
          <span style="color: var(--gris-medio); font-size: var(--font-size-small);">
            ${busqueda.sesion_id || 'Sin sesión'}
          </span>
        </div>
      </div>
    `;
  }

  renderPagination() {
    const totalPages = Math.ceil(this.filteredSearches.length / this.itemsPerPage);
    
    if (totalPages <= 1) return '';
    
    return `
      <div style="display: flex; justify-content: center; align-items: center; gap: var(--spacing-sm); margin-top: var(--spacing-xl);">
        <button onclick="window.searchAdminModule.goToPage(${this.currentPage - 1})" 
                ${this.currentPage === 1 ? 'disabled' : ''}
                style="padding: var(--spacing-sm) var(--spacing-md); background: var(--azul-corporativo); color: white; border: none; border-radius: var(--radius-md); cursor: pointer; font-weight: 600; transition: var(--transition-fast);">
          ‹ Anterior
        </button>
        
        <span style="color: var(--gris-oscuro); font-weight: 600;">
          Página ${this.currentPage} de ${totalPages}
        </span>
        
        <button onclick="window.searchAdminModule.goToPage(${this.currentPage + 1})" 
                ${this.currentPage === totalPages ? 'disabled' : ''}
                style="padding: var(--spacing-sm) var(--spacing-md); background: var(--azul-corporativo); color: white; border: none; border-radius: var(--radius-md); cursor: pointer; font-weight: 600; transition: var(--transition-fast);">
          Siguiente ›
        </button>
      </div>
    `;
  }

  /**
   * Alias para compatibilidad con DashboardRouter
   */
  async render() {
    return await this.renderContent();
  }

  async renderContent() {
    try {
      await this.loadAllSearches();
      
      if (this.filteredSearches.length === 0) {
        return `
          ${this.renderFilters()}
          <div class="empty-state">
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="width: 60px; height: 60px; opacity: 0.2;">
              <circle cx="11" cy="11" r="8"></circle>
              <path d="m21 21-4.35-4.35"></path>
            </svg>
            <h3>No hay búsquedas registradas</h3>
            <p>No se encontraron búsquedas con los filtros aplicados.</p>
          </div>
        `;
      }
      
      // Paginación
      const startIndex = (this.currentPage - 1) * this.itemsPerPage;
      const endIndex = startIndex + this.itemsPerPage;
      const paginatedSearches = this.filteredSearches.slice(startIndex, endIndex);
      
      const searchesHtml = paginatedSearches.map((busqueda, index) => 
        this.renderSearchCard(busqueda, startIndex + index)
      ).join('');
      
      return `
        <!-- Header -->
        <div style="margin-bottom: var(--spacing-xl);">
          <div style="display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: var(--spacing-md);">
            <div>
              <h2 style="color: var(--azul-corporativo); margin: 0 0 var(--spacing-sm) 0;">
                👨‍💼 Gestión de Búsquedas (Admin)
              </h2>
              <p style="color: var(--gris-medio); margin: 0; font-size: var(--font-size-base);">
                <strong style="color: var(--azul-corporativo);">${this.filteredSearches.length}</strong> búsquedas en total • 
                Mostrando ${startIndex + 1}-${Math.min(endIndex, this.filteredSearches.length)}
              </p>
            </div>
            <button onclick="if(window.searchModule){window.searchModule.renderSearchModal()}else{alert('Módulo de búsqueda no disponible')}" 
                    class="search-header-btn"
                    style="padding: var(--spacing-md) var(--spacing-xl); border-radius: var(--radius-md); font-weight: 600; background: var(--azul-corporativo); color: white; border: none; cursor: pointer; font-size: var(--font-size-base); transition: var(--transition-fast); box-shadow: var(--shadow-sm);"
                    onmouseover="this.style.background='var(--azul-medio)'; this.style.boxShadow='var(--shadow-md)'"
                    onmouseout="this.style.background='var(--azul-corporativo)'; this.style.boxShadow='var(--shadow-sm)'">
              🔍 Nueva Búsqueda
            </button>
          </div>
        </div>
        
        <!-- Filtros -->
        ${this.renderFilters()}
        
        <!-- Lista de búsquedas -->
        <div style="display: grid; gap: var(--spacing-md);">
          ${searchesHtml}
        </div>
        
        <!-- Paginación -->
        ${this.renderPagination()}
      `;
    } catch (error) {
      console.error('❌ Error renderizando búsquedas admin:', error);
      return `
        ${this.renderFilters()}
        <div class="empty-state">
          <h3>Error al cargar búsquedas</h3>
          <p>${error.message}</p>
        </div>
      `;
    }
  }

  goToPage(page) {
    const totalPages = Math.ceil(this.filteredSearches.length / this.itemsPerPage);
    if (page < 1 || page > totalPages) return;
    
    this.currentPage = page;
    this.refreshContent();
  }

  async handleApplyFilters() {
    this.filters.usuario_nombre = document.getElementById('filter_usuario_nombre')?.value || null;
    this.filters.fecha_desde = document.getElementById('filter_fecha_desde')?.value || null;
    this.filters.fecha_hasta = document.getElementById('filter_fecha_hasta')?.value || null;
    
    await this.refreshContent();
  }

  async handleClearFilters() {
    this.filters = {
      usuario_nombre: null,
      fecha_desde: null,
      fecha_hasta: null
    };
    
    document.getElementById('filter_usuario_nombre').value = '';
    document.getElementById('filter_fecha_desde').value = '';
    document.getElementById('filter_fecha_hasta').value = '';
    
    await this.refreshContent();
  }

  async refreshContent() {
    const contentArea = document.getElementById('tabContent');
    if (!contentArea) return;

    contentArea.innerHTML = '<div style="text-align: center; padding: var(--spacing-xxl);"><p>Cargando...</p></div>';

    const content = await this.renderContent();
    contentArea.innerHTML = content;

    // Reconectar listeners después de refrescar
    this.setupEventListeners();
  }

  /**
   * Setup event listeners (compatible con DashboardRouter)
   */
  async afterRender() {
    this.setupEventListeners();
  }

  setupEventListeners() {
    // Botón aplicar filtros
    const applyBtn = document.getElementById('applyFiltersBtn');
    if (applyBtn) {
      applyBtn.addEventListener('click', () => this.handleApplyFilters());
    }

    // Botón limpiar filtros
    const clearBtn = document.getElementById('clearFiltersBtn');
    if (clearBtn) {
      clearBtn.addEventListener('click', () => this.handleClearFilters());
    }

    // Botones de paginación
    const prevBtn = document.getElementById('prevPageBtn');
    if (prevBtn) {
      prevBtn.addEventListener('click', () => this.goToPage(this.currentPage - 1));
    }

    const nextBtn = document.getElementById('nextPageBtn');
    if (nextBtn) {
      nextBtn.addEventListener('click', () => this.goToPage(this.currentPage + 1));
    }

    console.log('✅ SearchAdminModule listeners configurados');
  }

  /**
   * Cleanup (compatible con DashboardRouter)
   */
  async destroy() {
    console.log('🗑️ Destruyendo SearchAdminModule...');
  }
}

// Exponer globalmente
window.SearchAdminModule = SearchAdminModule;

/**
 * 📋 Search History Module
 * Historial de búsquedas guardadas del usuario
 */

class SearchHistoryModule {
  constructor(searchController) {
    this.searchController = searchController;
    this.data = [];
    this.tiposInmuebles = [];
    this.distritos = [];

    window.searchHistoryModule = this;
  }

  /**
   * Renderizar módulo de historial
   */
  async render() {
    console.log('🎨 SearchHistoryModule.render() called');

    try {
      // Cargar datos
      await this.loadData();

      if (this.data.length === 0) {
        return this.renderEmptyState();
      }

      return this.renderHistoryList();

    } catch (error) {
      console.error('❌ Error en SearchHistoryModule.render():', error);
      return `<div class="empty-state"><h3>Error al cargar búsquedas</h3><p>${error.message}</p></div>`;
    }
  }

  /**
   * Renderizar estado vacío
   */
  renderEmptyState() {
    return `
      <div class="empty-state">
        <svg xmlns="http://www.w3.org/2000/svg" width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <circle cx="11" cy="11" r="8"></circle>
          <path d="m21 21-4.35-4.35"></path>
        </svg>
        <h3>No has realizado búsquedas aún</h3>
        <p>Haz clic en "Nueva Búsqueda" para comenzar a buscar propiedades</p>
      </div>
    `;
  }

  /**
   * Renderizar lista de historial
   */
  renderHistoryList() {
    return `
      <div class="history-grid">
        ${this.data.map((busqueda, index) => this.renderHistoryCard(busqueda, index)).join('')}
      </div>
    `;
  }

  /**
   * Renderizar tarjeta de búsqueda
   */
  renderHistoryCard(busqueda, index) {
    const criterios = busqueda.criterios_json || {};
    const fecha = new Date(busqueda.fecha_busqueda || busqueda.created_at).toLocaleDateString('es-PE', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });

    // Tipo de inmueble
    const tipoInmueble = criterios.tipo_inmueble_id
      ? (this.tiposInmuebles.find(t => t.tipo_inmueble_id === criterios.tipo_inmueble_id)?.nombre || 'N/A')
      : 'Todos los tipos';

    // Distritos
    let distritos = 'Todos los distritos';
    if (Array.isArray(criterios.distrito_id) && criterios.distrito_id.length > 0) {
      const nombres = criterios.distrito_id
        .slice(0, 2)
        .map(id => this.distritos.find(d => d.distrito_id === id)?.nombre)
        .filter(Boolean);
      distritos = nombres.join(', ');
      if (criterios.distrito_id.length > 2) {
        distritos += ` (+${criterios.distrito_id.length - 2})`;
      }
    } else if (Array.isArray(criterios.distritos_ids) && criterios.distritos_ids.length > 0) {
      const nombres = criterios.distritos_ids
        .slice(0, 2)
        .map(id => this.distritos.find(d => d.distrito_id === id)?.nombre)
        .filter(Boolean);
      distritos = nombres.join(', ');
      if (criterios.distritos_ids.length > 2) {
        distritos += ` (+${criterios.distritos_ids.length - 2})`;
      }
    }

    // Transacción
    const transaccion = criterios.transaccion === 'alquiler' ? 'Alquiler' : 'Compra/Venta';

    // Precio
    let precio = null;
    if (criterios.precio_min || criterios.precio_max) {
      const min = criterios.precio_min ? `S/ ${parseFloat(criterios.precio_min).toLocaleString('es-PE')}` : 'Min';
      const max = criterios.precio_max ? `S/ ${parseFloat(criterios.precio_max).toLocaleString('es-PE')}` : 'Max';
      precio = `${min} - ${max}`;
    }

    // Área
    let area = null;
    if (criterios.area_min || criterios.area_max) {
      const min = criterios.area_min || 'Min';
      const max = criterios.area_max || 'Max';
      area = `${min} - ${max} m²`;
    }

    return `
      <div class="history-card">
        <!-- Header -->
        <div class="history-card-header">
          <div class="history-info">
            <h3 class="history-title">
              <i class="fa-solid fa-magnifying-glass"></i>
              Búsqueda #${index + 1}
            </h3>
            <p class="history-date">
              <i class="fa-solid fa-calendar"></i>
              ${fecha}
            </p>
          </div>
          <div class="history-actions">
            <button class="btn btn-icon" onclick="window.searchHistoryModule.repeatSearch(${JSON.stringify(criterios).replace(/"/g, '&quot;')})" title="Repetir búsqueda">
              <i class="fa-solid fa-rotate-right"></i>
            </button>
            <button class="btn btn-icon btn-icon-danger" onclick="window.searchHistoryModule.deleteSearch(${busqueda.busqueda_id})" title="Eliminar búsqueda">
              <i class="fa-solid fa-trash"></i>
            </button>
          </div>
        </div>

        <!-- Criterios -->
        <div class="history-criteria">
          <div class="criteria-item">
            <span class="criteria-label">Transacción</span>
            <strong class="criteria-value">${transaccion}</strong>
          </div>

          <div class="criteria-item">
            <span class="criteria-label">Tipo</span>
            <strong class="criteria-value">${tipoInmueble}</strong>
          </div>

          <div class="criteria-item">
            <span class="criteria-label">Ubicación</span>
            <strong class="criteria-value">
              <i class="fa-solid fa-location-dot"></i>
              ${distritos}
            </strong>
          </div>

          ${precio ? `
            <div class="criteria-item">
              <span class="criteria-label">Precio</span>
              <strong class="criteria-value">${precio}</strong>
            </div>
          ` : ''}

          ${area ? `
            <div class="criteria-item">
              <span class="criteria-label">Área</span>
              <strong class="criteria-value">${area}</strong>
            </div>
          ` : ''}

          ${criterios.habitaciones ? `
            <div class="criteria-item">
              <span class="criteria-label">Habitaciones</span>
              <strong class="criteria-value">${criterios.habitaciones}</strong>
            </div>
          ` : ''}

          ${criterios.banos ? `
            <div class="criteria-item">
              <span class="criteria-label">Baños</span>
              <strong class="criteria-value">${criterios.banos}</strong>
            </div>
          ` : ''}
        </div>

        <!-- Footer -->
        <div class="history-card-footer">
          <span class="history-results">
            <i class="fa-solid fa-check-circle"></i>
            ${busqueda.cantidad_resultados || 0} resultados
          </span>
          <button class="btn btn-primary btn-sm" onclick="window.searchHistoryModule.repeatSearch(${JSON.stringify(criterios).replace(/"/g, '&quot;')})">
            <i class="fa-solid fa-rotate-right"></i>
            Repetir Búsqueda
          </button>
        </div>
      </div>
    `;
  }

  /**
   * Cargar datos de historial
   */
  async loadData() {
    console.log('📡 Cargando historial de búsquedas...');

    try {
      const token = authService.getToken();
      if (!token) {
        console.warn('⚠️ Usuario no autenticado');
        this.data = [];
        return;
      }

      // Cargar catálogos en paralelo
      const [tiposResp, distritosResp] = await Promise.all([
        fetch(`${API_URL}/tipos-inmuebles`).then(r => r.json()),
        fetch(`${API_URL}/distritos`).then(r => r.json())
      ]);

      this.tiposInmuebles = tiposResp || [];
      this.distritos = distritosResp || [];

      // Intentar cargar historial
      let response = await fetch(`${API_URL}/busquedas/mis-busquedas?limit=50`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });

      if (!response.ok && response.status === 404) {
        // Si falla, intentar con historial
        response = await fetch(`${API_URL}/busquedas/historial?limit=50`, {
          headers: { 'Authorization': `Bearer ${token}` }
        });
      }

      if (response.ok) {
        const data = await response.json();
        this.data = Array.isArray(data) ? data : (data.data || data.busquedas || []);
        console.log('✅ Historial cargado:', this.data.length, 'búsquedas');
      } else {
        console.warn('⚠️ No se pudo cargar el historial');
        this.data = [];
      }

    } catch (error) {
      console.error('❌ Error al cargar historial:', error);
      this.data = [];
    }
  }

  /**
   * Repetir búsqueda
   */
  async repeatSearch(criterios) {
    console.log('🔄 Repitiendo búsqueda:', criterios);

    try {
      // Abrir vista de nueva búsqueda
      await this.searchController.openNewSearch();

      // Esperar a que se rendericen los filtros
      setTimeout(() => {
        // Pre-llenar filtros con los criterios
        this.searchController.modules.filters.prefillFilters(criterios);

        // Ejecutar búsqueda
        this.searchController.executeSearch(criterios);

        showNotification('Búsqueda repetida exitosamente', 'success');
      }, 300);

    } catch (error) {
      console.error('❌ Error al repetir búsqueda:', error);
      showNotification('Error al repetir búsqueda: ' + error.message, 'error');
    }
  }

  /**
   * Eliminar búsqueda del historial
   */
  async deleteSearch(busquedaId) {
    console.log('🗑️ Eliminando búsqueda:', busquedaId);

    try {
      const confirmDelete = confirm('¿Estás seguro de que deseas eliminar esta búsqueda del historial?');
      if (!confirmDelete) return;

      const token = authService.getToken();
      if (!token) {
        showNotification('Debes iniciar sesión para eliminar búsquedas', 'warning');
        return;
      }

      const response = await fetch(`${API_URL}/busquedas/${busquedaId}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      });

      if (!response.ok) {
        throw new Error('No se pudo eliminar la búsqueda');
      }

      showNotification('Búsqueda eliminada correctamente', 'success');

      // Recargar historial
      await this.refreshHistory();

    } catch (error) {
      console.error('❌ Error al eliminar búsqueda:', error);
      showNotification('Error al eliminar búsqueda: ' + error.message, 'error');
    }
  }

  /**
   * Refrescar historial
   */
  async refreshHistory() {
    console.log('🔄 Refrescando historial...');

    await this.loadData();

    // Re-renderizar
    const content = await this.render();
    const tabContent = document.getElementById('tabContent');
    if (tabContent) {
      tabContent.innerHTML = `
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
            ${content}
          </div>
        </div>
      `;
    }
  }

  /**
   * Setup event listeners
   */
  setupEventListeners() {
    console.log('🎛️ SearchHistoryModule.setupEventListeners() called');

    // Los event listeners están en los onclick de las tarjetas
  }
}

// Exportar clase a window
window.SearchHistoryModule = SearchHistoryModule;

let searchHistoryModule;

/**
 * 📋 Búsquedas Lista - Lista de Búsquedas Guardadas
 * Maneja la visualización y gestión de búsquedas guardadas
 * ~400 líneas - Separado para mantener arquitectura limpia
 */

class BusquedasLista {
  constructor(busquedasTab) {
    this.tab = busquedasTab;
    this.allSearches = [];
    this.filteredSearches = [];
    this.currentPage = 1;
    this.itemsPerPage = 5;
  }

  /**
   * Cargar búsquedas guardadas del API
   */
  async load() {
    const container = this.tab.container.querySelector('#savedSearchesList');
    if (!container) return;

    container.innerHTML = `
      <div class="loading-state">
        <div class="spinner-large"></div>
        <p>Cargando búsquedas guardadas...</p>
      </div>
    `;

    try {
      // Admin (perfil_id 4) ve todas las búsquedas, otros solo las suyas
      const user = authService.getCurrentUser();
      const isAdmin = user?.perfil_id === 4;
      const endpoint = isAdmin
        ? `${API_CONFIG.BASE_URL}/busquedas/admin/todas?limit=100`
        : `${API_CONFIG.BASE_URL}/busquedas/mis-busquedas`;

      const response = await fetch(endpoint, {
        headers: { 'Authorization': `Bearer ${authService.getToken()}` }
      });

      if (!response.ok) {
        console.warn('⚠️ Endpoint de búsquedas guardadas no disponible (404). Mostrando estado vacío.');
        this.allSearches = [];
        this.filteredSearches = [];
        this.render();
        return;
      }

      const data = await response.json();
      // Admin recibe array directo, otros usuarios reciben {data: {busquedas: []}}
      this.allSearches = Array.isArray(data) ? data : (data.data?.busquedas || data.data || []);
      this.filteredSearches = [...this.allSearches];

      console.log(`✅ Búsquedas cargadas: ${this.allSearches.length}`);

      this.render();

    } catch (error) {
      console.error('Error cargando búsquedas:', error);
      // En caso de error, mostrar estado vacío en lugar de error
      console.warn('⚠️ Error al cargar búsquedas guardadas. Mostrando estado vacío.');
      this.allSearches = [];
      this.filteredSearches = [];
      this.render();
    }
  }

  /**
   * Renderizar lista de búsquedas
   */
  render() {
    const container = this.tab.container.querySelector('#savedSearchesList');
    if (!container) return;

    if (this.filteredSearches.length === 0) {
      container.innerHTML = `
        <div class="empty-state">
          <i class="fas fa-search"></i>
          <h3>No tienes búsquedas guardadas</h3>
          <p>Haz clic en "Nueva Búsqueda" para comenzar.</p>
        </div>
      `;
      return;
    }

    // Paginación
    const totalPages = Math.ceil(this.filteredSearches.length / this.itemsPerPage);
    const start = (this.currentPage - 1) * this.itemsPerPage;
    const end = start + this.itemsPerPage;
    const pageSearches = this.filteredSearches.slice(start, end);

    // Renderizar tarjetas
    container.innerHTML = pageSearches.map((busqueda, index) =>
      this.renderCard(busqueda, start + index + 1)
    ).join('');

    // Renderizar paginación
    this.renderPagination(totalPages);

    // Setup listeners
    this.setupListeners();
  }

  /**
   * Renderizar tarjeta de búsqueda guardada
   */
  renderCard(busqueda, index) {
    const criterios = busqueda.criterios_json || {};
    const fecha = new Date(busqueda.fecha_busqueda).toLocaleDateString('es-PE', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });

    // Extraer datos de estructura anidada (compatible con formato nuevo y legacy)
    const filtrosGenericos = criterios.filtros_genericos || {};
    const filtrosBasicos = criterios.filtros_basicos || {};
    const filtrosAvanzados = criterios.filtros_avanzados || [];
    const meta = criterios._meta || {};

    // Transacción (buscar en estructura anidada o legacy)
    const transaccion = filtrosGenericos.transaccion || criterios.transaccion || 'venta';
    const transaccionTexto = transaccion === 'alquiler' ? 'Alquiler' : 'Venta';

    // Tipo de inmueble
    const tipoInmuebleId = filtrosGenericos.tipo_inmueble_id || criterios.tipo_inmueble_id;
    const tipoNombre = meta.tipo_inmueble_nombre || this.getTipoNombre(tipoInmuebleId);

    // Distritos
    const distritoIds = filtrosGenericos.distrito_ids || criterios.distritos_ids || [];

    // Área/Metraje
    const area = filtrosBasicos.area || meta.metraje_original || criterios.metraje || criterios.area_min;

    // Presupuesto
    const presupuesto = filtrosBasicos.precio || meta.presupuesto_original || criterios.presupuesto;

    // Tipo de búsqueda (badge)
    let tipoBusquedaBadge = '';
    if (filtrosAvanzados.length > 0) {
      tipoBusquedaBadge = `<span style="background: #8B5CF6; color: white; padding: 2px 8px; border-radius: 4px; font-size: 0.7rem; font-weight: 600;">🔬 AVANZADA</span>`;
    } else if (Object.keys(filtrosBasicos).some(k => filtrosBasicos[k])) {
      tipoBusquedaBadge = `<span style="background: #0066CC; color: white; padding: 2px 8px; border-radius: 4px; font-size: 0.7rem; font-weight: 600;">📋 BÁSICA</span>`;
    } else {
      tipoBusquedaBadge = `<span style="background: #6b7280; color: white; padding: 2px 8px; border-radius: 4px; font-size: 0.7rem; font-weight: 600;">🔍 GENÉRICA</span>`;
    }

    return `
      <div class="saved-search-card" data-search-id="${busqueda.busqueda_id}">
        <!-- Header con usuario y fecha -->
        <div class="saved-search-header">
          <div>
            <div style="display: flex; align-items: center; gap: 8px; margin-bottom: 4px;">
              <h3 class="saved-search-title" style="margin: 0;">
                ${busqueda.nombre_busqueda || busqueda.descripcion_legible || `Búsqueda #${busqueda.codigo_busqueda}`}
              </h3>
              ${tipoBusquedaBadge}
            </div>
            <p style="margin: 4px 0 0 0; color: #6b7280; font-size: 0.875rem;">
              👤 ${busqueda.usuario_nombre || busqueda.usuario?.nombre + ' ' + busqueda.usuario?.apellido || 'Usuario'}
            </p>
            ${busqueda.usuario?.email ? `
              <p style="margin: 2px 0 0 0; color: #6b7280; font-size: 0.875rem;">
                📧 ${busqueda.usuario.email}
              </p>
            ` : ''}
            ${busqueda.usuario?.telefono ? `
              <p style="margin: 2px 0 0 0; color: #6b7280; font-size: 0.875rem;">
                📱 ${busqueda.usuario.telefono}
              </p>
            ` : ''}
          </div>
          <span class="saved-search-date">📅 ${fecha}</span>
        </div>

        <!-- Detalles de la búsqueda -->
        <div class="saved-search-details">
          <div class="saved-search-detail">
            <i class="fas fa-handshake"></i>
            <span><strong>Transacción:</strong> ${transaccionTexto}</span>
          </div>

          ${tipoInmuebleId ? `
            <div class="saved-search-detail">
              <i class="fas fa-building"></i>
              <span><strong>Tipo:</strong> ${tipoNombre}</span>
            </div>
          ` : ''}

          ${distritoIds.length > 0 ? `
            <div class="saved-search-detail">
              <i class="fas fa-map-marker-alt"></i>
              <span><strong>Ubicación:</strong> ${distritoIds.length} distrito(s)</span>
            </div>
          ` : ''}

          ${area ? `
            <div class="saved-search-detail">
              <i class="fas fa-ruler-combined"></i>
              <span><strong>Área:</strong> ~${area} m²</span>
            </div>
          ` : ''}

          ${presupuesto ? `
            <div class="saved-search-detail">
              <i class="fas fa-dollar-sign"></i>
              <span><strong>Presupuesto:</strong> ~USD ${this.formatNumber(presupuesto)}</span>
            </div>
          ` : ''}

          <div class="saved-search-detail">
            <i class="fas fa-list"></i>
            <span><strong>Resultados:</strong> ${busqueda.cantidad_resultados || 0}</span>
          </div>

          ${busqueda.es_guardada ? `
            <div class="saved-search-detail" style="color: #10b981;">
              <i class="fas fa-bookmark"></i>
              <span><strong>Búsqueda guardada</strong></span>
            </div>
          ` : ''}
        </div>

        <!-- Acciones -->
        <div class="saved-search-actions" style="justify-content: flex-end;">
          <button class="btn btn-primary" data-action="ejecutar" data-search-id="${busqueda.busqueda_id}" style="width: auto; padding: 8px 20px;">
            <i class="fas fa-search"></i> Ejecutar Búsqueda
          </button>
        </div>
      </div>
    `;
  }

  /**
   * Renderizar paginación
   */
  renderPagination(totalPages) {
    const paginationContainer = this.tab.container.querySelector('#savedSearchesPagination');
    if (!paginationContainer) return;

    if (totalPages <= 1) {
      paginationContainer.innerHTML = '';
      return;
    }

    let html = '<div class="pagination">';

    // Botón anterior
    html += `
      <button ${this.currentPage === 1 ? 'disabled' : ''} data-page="${this.currentPage - 1}">
        <i class="fas fa-chevron-left"></i>
      </button>
    `;

    // Números de página
    for (let i = 1; i <= totalPages; i++) {
      if (
        i === 1 ||
        i === totalPages ||
        (i >= this.currentPage - 1 && i <= this.currentPage + 1)
      ) {
        html += `
          <button class="${i === this.currentPage ? 'active' : ''}" data-page="${i}">
            ${i}
          </button>
        `;
      } else if (i === this.currentPage - 2 || i === this.currentPage + 2) {
        html += '<span class="pagination-info">...</span>';
      }
    }

    // Botón siguiente
    html += `
      <button ${this.currentPage === totalPages ? 'disabled' : ''} data-page="${this.currentPage + 1}">
        <i class="fas fa-chevron-right"></i>
      </button>
    `;

    html += '</div>';

    paginationContainer.innerHTML = html;

    // Listeners de paginación
    paginationContainer.querySelectorAll('button[data-page]').forEach(btn => {
      btn.addEventListener('click', () => {
        this.currentPage = parseInt(btn.dataset.page);
        this.render();
      });
    });
  }

  /**
   * Setup listeners de la lista
   */
  setupListeners() {
    // Ejecutar búsqueda
    this.tab.container.querySelectorAll('button[data-action="ejecutar"]').forEach(btn => {
      btn.addEventListener('click', () => {
        const searchId = btn.dataset.searchId;
        this.ejecutar(searchId);
      });
    });

    // Eliminar búsqueda
    this.tab.container.querySelectorAll('button[data-action="eliminar"]').forEach(btn => {
      btn.addEventListener('click', () => {
        const searchId = btn.dataset.searchId;
        this.eliminar(searchId);
      });
    });
  }

  /**
   * Ejecutar búsqueda guardada
   */
  async ejecutar(busquedaId) {
    try {
      const busqueda = this.allSearches.find(b => b.busqueda_id == busquedaId);
      if (!busqueda) {
        alert('Búsqueda no encontrada');
        return;
      }

      // Ejecutar búsqueda con los criterios guardados
      await this.tab.executeSearch(busqueda.criterios_json);

    } catch (error) {
      console.error('Error ejecutando búsqueda:', error);
      alert('❌ Error al ejecutar la búsqueda');
    }
  }

  /**
   * Eliminar búsqueda guardada
   */
  async eliminar(busquedaId) {
    if (!confirm('¿Estás seguro de eliminar esta búsqueda?')) return;

    try {
      const response = await fetch(`${API_CONFIG.BASE_URL}/busquedas/${busquedaId}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${authService.getToken()}` }
      });

      if (!response.ok) throw new Error('Error eliminando búsqueda');

      alert('✅ Búsqueda eliminada exitosamente');

      // Recargar lista
      await this.load();

    } catch (error) {
      console.error('Error eliminando búsqueda:', error);
      alert('❌ Error al eliminar la búsqueda');
    }
  }

  /**
   * Aplicar filtros de búsqueda
   */
  aplicarFiltros() {
    const nombreInput = this.tab.container.querySelector('#filtroNombreUsuario');
    const desdeInput = this.tab.container.querySelector('#filtroFechaDesde');
    const hastaInput = this.tab.container.querySelector('#filtroFechaHasta');

    const nombre = nombreInput?.value.toLowerCase() || '';
    const desde = desdeInput?.value ? new Date(desdeInput.value) : null;
    const hasta = hastaInput?.value ? new Date(hastaInput.value) : null;

    this.filteredSearches = this.allSearches.filter(busqueda => {
      // Filtro por nombre
      if (nombre && !busqueda.nombre.toLowerCase().includes(nombre)) {
        return false;
      }

      // Filtro por fecha
      const fechaBusqueda = new Date(busqueda.fecha_creacion);
      if (desde && fechaBusqueda < desde) return false;
      if (hasta && fechaBusqueda > hasta) return false;

      return true;
    });

    this.currentPage = 1;
    this.render();
  }

  /**
   * Limpiar filtros
   */
  limpiarFiltros() {
    const nombreInput = this.tab.container.querySelector('#filtroNombreUsuario');
    const desdeInput = this.tab.container.querySelector('#filtroFechaDesde');
    const hastaInput = this.tab.container.querySelector('#filtroFechaHasta');

    if (nombreInput) nombreInput.value = '';
    if (desdeInput) desdeInput.value = '';
    if (hastaInput) hastaInput.value = '';

    this.filteredSearches = [...this.allSearches];
    this.currentPage = 1;
    this.render();
  }

  /**
   * Obtener nombre del tipo de inmueble
   */
  getTipoNombre(tipoId) {
    // Aquí deberías tener un mapa de tipos, por ahora retorno el ID
    return `Tipo ${tipoId}`;
  }

  /**
   * Formatear número con comas
   */
  formatNumber(num) {
    return new Intl.NumberFormat('en-US').format(num);
  }
}

// Exportar para uso en busquedas.js
if (typeof window !== 'undefined') {
  window.BusquedasLista = BusquedasLista;
}

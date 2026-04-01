/**
 * 🔍 Búsquedas Tab - Orquestador Principal
 * Archivo limpio que solo orquesta los componentes separados
 * ~400 líneas - Siguiendo el patrón exitoso de PropiedadesTab
 *
 * Componentes:
 * - BusquedasForm (busquedas-form.js) - Modal de nueva búsqueda
 * - BusquedasCards (busquedas-cards.js) - Renderizado de tarjetas
 * - BusquedasMap (busquedas-map.js) - Manejo del mapa
 * - BusquedasActions (busquedas-actions.js) - Guardar/Compartir
 * - BusquedasLista (busquedas-lista.js) - Lista de búsquedas guardadas
 */

class BusquedasTab {
  constructor(dashboardApp) {
    this.app = dashboardApp;
    this.container = null;

    // Estado
    this.currentResults = [];
    this.currentFilters = {};
    this.currentPage = 1;
    this.itemsPerPage = 5;

    // Componentes (se inicializan en afterRender)
    this.formHandler = null;
    this.cardsHandler = null;
    this.mapHandler = null;
    this.actionsHandler = null;
    this.listaHandler = null;
  }

  /**
   * Renderizar tab
   */
  async render() {
    console.log('🔍 Renderizando tab de Búsquedas...');

    return `
      <div class="busquedas-tab">
        <!-- Header -->
        <div class="busquedas-header" style="margin-bottom: var(--spacing-xl);">
          <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: var(--spacing-lg); flex-wrap: wrap; gap: var(--spacing-md);">
            <div>
              <h2 style="color: var(--azul-corporativo); margin: 0;">Búsqueda de Propiedades</h2>
              <p id="resultsCounter" style="margin: 0; color: var(--gris-medio); font-size: 0.9rem;">
                Inicia una búsqueda para ver resultados
              </p>
            </div>
            <div style="display: flex; gap: var(--spacing-sm); flex-wrap: wrap;">
              <button class="btn btn-golden" data-nueva-busqueda>
                <i class="fas fa-plus"></i> Nueva Búsqueda
              </button>
              <!-- Botones de acciones (ocultos inicialmente) -->
              <button id="btnGuardarBusqueda" class="btn btn-primary" style="display: none;">
                <i class="fas fa-save"></i> Guardar
              </button>
              <button id="btnCompartirBusqueda" class="btn btn-primary" style="display: none;">
                <i class="fas fa-share-alt"></i> Compartir
              </button>
              <button id="btnVolverLista" class="btn btn-outline" style="display: none;">
                <i class="fas fa-arrow-left"></i> Volver a Lista
              </button>
            </div>
          </div>
        </div>

        <!-- Filtros de Búsqueda -->
        <div class="filtros-busqueda-container">
          <h3 style="margin: 0 0 var(--spacing-md) 0; color: var(--azul-corporativo); font-size: 1rem;">
            Filtros de Búsqueda
          </h3>
          <div class="filtros-grid">
            <div class="filtro-item">
              <label>Nombre de Usuario</label>
              <input type="text" id="filtroNombreUsuario" placeholder="Ej: Alan Cairampoma">
            </div>
            <div class="filtro-item">
              <label>Desde</label>
              <input type="date" id="filtroFechaDesde">
            </div>
            <div class="filtro-item">
              <label>Hasta</label>
              <input type="date" id="filtroFechaHasta">
            </div>
            <div class="filtros-botones">
              <button id="btnAplicarFiltros" class="btn btn-primary">Aplicar</button>
              <button id="btnLimpiarFiltros" class="btn btn-secondary">Limpiar</button>
            </div>
          </div>
        </div>

        <!-- Lista de Búsquedas Guardadas -->
        <div id="savedSearchesList" class="saved-searches-section">
          <div class="loading-state">
            <div class="spinner-large"></div>
            <p>Cargando búsquedas guardadas...</p>
          </div>
        </div>

        <!-- Paginación de Búsquedas Guardadas -->
        <div id="savedSearchesPagination" style="margin-top: var(--spacing-lg);"></div>

        <!-- Grid: Filtros + Resultados + Mapa (inicialmente oculto) -->
        <div class="busquedas-grid" style="display: none;">
          <!-- Columna Izquierda: Filtros Acordeón -->
          <aside class="filters-column">
            <div class="filters-inner">
              <!-- Filtros Genéricos -->
              <div class="accordion-item">
                <button class="accordion-header" type="button" data-accordion="genericos" aria-expanded="true">
                  <i class="fa-solid fa-filter"></i>
                  <span>Filtros Genéricos</span>
                  <i class="fa-solid fa-chevron-down accordion-arrow"></i>
                </button>
                <div class="accordion-content open" data-accordion="genericos">
                  <div id="resumenGenericos" class="resumen-genericos"></div>
                </div>
              </div>

              <!-- Filtro Básico -->
              <div class="accordion-item">
                <button class="accordion-header" type="button" data-accordion="basico" aria-expanded="false">
                  <i class="fa-solid fa-sliders"></i>
                  <span>Filtro Básico</span>
                  <i class="fa-solid fa-chevron-down accordion-arrow"></i>
                </button>
                <div class="accordion-content" data-accordion="basico">
                  <div id="contenedorBasico" class="contenedor-basico"></div>
                </div>
              </div>

              <!-- Filtros Avanzados -->
              <div class="accordion-item">
                <button class="accordion-header" type="button" data-accordion="avanzado" aria-expanded="false">
                  <i class="fa-solid fa-gear"></i>
                  <span>Filtros Avanzados</span>
                  <i class="fa-solid fa-chevron-down accordion-arrow"></i>
                </button>
                <div class="accordion-content" data-accordion="avanzado">
                  <div id="contenedorAvanzado" class="contenedor-avanzado"></div>
                </div>
              </div>
            </div>

            <!-- Acciones -->
            <div class="filters-actions">
              <button id="btnAplicarFiltrosCol" class="btn btn-primary btn-sm">
                <i class="fa-solid fa-check"></i> Aplicar
              </button>
              <button id="btnLimpiarFiltrosCol" class="btn btn-outline btn-sm">
                <i class="fa-solid fa-eraser"></i> Limpiar
              </button>
            </div>
          </aside>

          <!-- Columna Centro: Resultados -->
          <div class="results-column">
            <div id="searchResults"></div>
            <div id="searchPagination"></div>
          </div>

          <!-- Columna Derecha: Mapa -->
          <div class="map-column">
            <div id="busquedasMap" class="busquedas-map"></div>
          </div>
        </div>

        <!-- Modal de Nueva Búsqueda -->
        <div class="modal-overlay" id="modalNuevaBusqueda" style="display: none;">
          <div class="modal-busqueda-custom">
            <button class="modal-close-custom" id="btnCerrarModalBusqueda">✕</button>

            <div class="modal-header-custom">
              <h2>Búsqueda Genérica</h2>
            </div>

            <div class="modal-body-custom">
              <!-- Tipo de Inmueble -->
              <div class="form-group-custom full-width">
                <label>Tipo de Inmueble</label>
                <select id="modalTipoInmueble" class="form-control-custom">
                  <option value="">Selecciona tipo...</option>
                </select>
              </div>

              <!-- País + Departamento + Provincia -->
              <div class="form-row-custom three-cols">
                <div class="form-group-custom">
                  <label>País</label>
                  <select id="modalPais" class="form-control-custom">
                    <option value="PERU">Perú</option>
                  </select>
                </div>
                <div class="form-group-custom">
                  <label>Departamento</label>
                  <select id="modalDepartamento" class="form-control-custom">
                    <option value="LIMA" selected>Lima</option>
                  </select>
                </div>
                <div class="form-group-custom">
                  <label>Provincia</label>
                  <select id="modalProvincia" class="form-control-custom">
                    <option value="LIMA" selected>Lima</option>
                  </select>
                </div>
              </div>

              <!-- Distritos Multi-select -->
              <div class="form-group-custom full-width">
                <label>Distritos</label>
                <div id="modalDistritoMulti" class="multi-select-custom">
                  <button type="button" class="multi-select-custom__button" id="modalDistritoToggle">
                    <span class="multi-select-custom__placeholder" id="modalDistritoPlaceholder">Selecciona distritos...</span>
                    <span class="multi-select-custom__tags" id="modalDistritoTags"></span>
                    <span class="multi-select-custom__arrow">▾</span>
                  </button>
                  <div class="multi-select-custom__panel" id="modalDistritoPanel" hidden>
                    <div class="multi-select-custom__search">
                      <input type="text" id="modalDistritoSearch" placeholder="Buscar distrito...">
                    </div>
                    <div class="multi-select-custom__options" id="modalDistritoOptions"></div>
                    <div class="multi-select-custom__actions">
                      <button type="button" id="modalDistritoSelectAll">Seleccionar todos</button>
                      <button type="button" id="modalDistritoClear">Limpiar</button>
                    </div>
                  </div>
                </div>
                <small class="help-text">Busca y selecciona múltiples distritos.</small>
              </div>

              <!-- Tipo de Transacción + Metraje + Presupuesto -->
              <div class="form-row-custom three-cols">
                <div class="form-group-custom">
                  <label>Tipo de Transacción</label>
                  <select id="modalTransaccion" class="form-control-custom">
                    <option value="venta" selected>Venta</option>
                    <option value="alquiler">Alquiler</option>
                  </select>
                </div>
                <div class="form-group-custom">
                  <label>Metraje (m²)</label>
                  <input type="number" id="modalMetraje" class="form-control-custom" placeholder="Ej: 460">
                  <small class="help-text">El sistema busca ±15%</small>
                </div>
                <div class="form-group-custom">
                  <label id="modalLabelPresupuesto">Presupuesto Venta (USD)</label>
                  <input type="number" id="modalPresupuesto" class="form-control-custom" placeholder="750,000">
                  <small class="help-text" id="modalHelperPresupuesto">Tolerancia ±15%</small>
                </div>
              </div>

              <!-- Botón Buscar -->
              <button id="btnEjecutarBusqueda" class="btn-buscar-custom">BUSCAR PROPIEDADES</button>
            </div>
          </div>
        </div>
      </div>
    `;
  }

  /**
   * After render - Inicializar componentes
   */
  async afterRender() {
    console.log('🎨 BusquedasTab afterRender');

    // Guardar referencia al container
    this.container = document.querySelector('.busquedas-tab');
    if (!this.container) {
      console.error('❌ No se encontró .busquedas-tab');
      return;
    }

    // ❤️ Inicializar handler de favoritos
    if (window.favoritesHandler && !window.favoritesHandler.initialized) {
      await window.favoritesHandler.init();
    }

    // Inicializar componentes
    this.formHandler = new BusquedasForm(this);
    this.cardsHandler = new BusquedasCards(this);
    this.mapHandler = new BusquedasMap(this);
    this.actionsHandler = new BusquedasActions(this);
    this.listaHandler = new BusquedasLista(this);

    // Setup listeners
    this.setupListeners();

    // Cargar lista de búsquedas guardadas
    await this.listaHandler.load();

    console.log('✅ BusquedasTab inicializado');
  }

  /**
   * Setup listeners principales
   */
  setupListeners() {
    // Botón nueva búsqueda
    const btnNueva = this.container.querySelector('[data-nueva-busqueda]');
    console.log('🔍 Botón Nueva Búsqueda:', btnNueva);
    console.log('🔍 FormHandler:', this.formHandler);

    if (btnNueva) {
      btnNueva.addEventListener('click', async () => {
        console.log('🔍 Click en Nueva Búsqueda');
        console.log('🔍 FormHandler al hacer click:', this.formHandler);
        console.log('🔍 Tipo de formHandler.open:', typeof this.formHandler.open);

        if (this.formHandler) {
          console.log('🔍 Llamando a formHandler.open()...');
          try {
            await this.formHandler.open();
            console.log('✅ formHandler.open() completado');
          } catch (error) {
            console.error('❌ Error en formHandler.open():', error);
          }
        } else {
          console.error('❌ formHandler es null');
        }
      });
    } else {
      console.error('❌ No se encontró botón [data-nueva-busqueda]');
    }

    // Botón guardar
    const btnGuardar = this.container.querySelector('#btnGuardarBusqueda');
    if (btnGuardar) {
      btnGuardar.addEventListener('click', () => this.actionsHandler.guardar());
    }

    // Botón compartir
    const btnCompartir = this.container.querySelector('#btnCompartirBusqueda');
    if (btnCompartir) {
      btnCompartir.addEventListener('click', () => this.actionsHandler.compartir());
    }

    // Botón volver
    const btnVolver = this.container.querySelector('#btnVolverLista');
    if (btnVolver) {
      btnVolver.addEventListener('click', () => this.volverALista());
    }

    // Filtros de lista
    const btnAplicarFiltros = this.container.querySelector('#btnAplicarFiltros');
    if (btnAplicarFiltros) {
      btnAplicarFiltros.addEventListener('click', () => this.listaHandler.aplicarFiltros());
    }

    const btnLimpiarFiltros = this.container.querySelector('#btnLimpiarFiltros');
    if (btnLimpiarFiltros) {
      btnLimpiarFiltros.addEventListener('click', () => this.listaHandler.limpiarFiltros());
    }
  }

  /**
   * Ejecutar búsqueda
   */
  async executeSearch(filters) {
    console.log('🔍 Ejecutando búsqueda con filtros:', filters);

    this.currentFilters = filters;

    try {
      // Cargar datos dinámicos PRIMERO
      await this.cargarDatosDinamicos(filters.tipo_inmueble);

      // Renderizar Filtros Genéricos
      this.renderFiltrosGenericos(filters);

      // Pre-llenar Filtros Básicos
      this.renderFiltrosBasicos(filters);

      // Cargar Filtros Avanzados dinámicos
      await this.cargarFiltrosAvanzados(filters.tipo_inmueble);

      // Configurar listeners de acordeones principales (Genéricos, Básico, Avanzados)
      this.setupAccordion();

      // Adjuntar listeners a sub-acordeones de categorías
      this.attachAvanzadoInlineListeners();

      // Configurar estado inicial: solo Genéricos abierto
      this.abrirAcordeones();

      // Mostrar loading después de setear filtros
      this.showLoading();

      // Llamar al API de búsqueda
      const response = await fetch(`${API_CONFIG.BASE_URL}/propiedades/buscar-avanzada`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${authService.getToken()}`
        },
        body: JSON.stringify(filters)
      });

      if (!response.ok) throw new Error('Error en búsqueda');

      const data = await response.json();
      this.currentResults = data.data || [];

      console.log(`✅ Búsqueda completada: ${this.currentResults.length} resultados`);

      // Ocultar lista, mostrar resultados
      this.showResults();

    } catch (error) {
      console.error('❌ Error en búsqueda:', error);
      alert('Error al realizar la búsqueda');
      this.showEmptyState();
    }
  }

  /**
   * Mostrar loading
   */
  showLoading() {
    const resultsDiv = this.container.querySelector('#searchResults');
    if (resultsDiv) {
      resultsDiv.innerHTML = `
        <div class="loading-state">
          <div class="spinner-large"></div>
          <p>Buscando propiedades...</p>
        </div>
      `;
    }
  }

  /**
   * Mostrar resultados
   */
  showResults() {
    // Ocultar lista de búsquedas guardadas
    const listaSection = this.container.querySelector('#savedSearchesList');
    const paginationSection = this.container.querySelector('#savedSearchesPagination');
    const filtrosContainer = this.container.querySelector('.filtros-busqueda-container');

    if (listaSection) listaSection.style.display = 'none';
    if (paginationSection) paginationSection.style.display = 'none';
    if (filtrosContainer) filtrosContainer.style.display = 'none';

    // Mostrar grid de resultados
    const grid = this.container.querySelector('.busquedas-grid');
    console.log('🎯 Grid encontrado:', !!grid);
    if (grid) {
      grid.style.display = 'grid';
      console.log('✅ Grid mostrado - display:', grid.style.display);
    } else {
      console.error('❌ Grid .busquedas-grid NO encontrado');
    }

    // Mostrar/ocultar botones
    const btnNueva = this.container.querySelector('[data-nueva-busqueda]');
    const btnGuardar = this.container.querySelector('#btnGuardarBusqueda');
    const btnCompartir = this.container.querySelector('#btnCompartirBusqueda');
    const btnVolver = this.container.querySelector('#btnVolverLista');

    if (btnNueva) btnNueva.style.display = 'none';
    if (btnGuardar) btnGuardar.style.display = 'inline-flex';
    if (btnCompartir) btnCompartir.style.display = 'inline-flex';
    if (btnVolver) btnVolver.style.display = 'inline-flex';

    // Renderizar resultados
    this.renderResults();

    // Inicializar mapa si no existe
    if (!this.mapHandler.map) {
      this.mapHandler.init();
    }

    // Actualizar mapa
    this.mapHandler.updateMarkers(this.getCurrentPageResults(), this.getStartNumber());
  }

  /**
   * Renderizar resultados paginados
   */
  renderResults() {
    const resultsDiv = this.container.querySelector('#searchResults');
    if (!resultsDiv) return;

    const pageResults = this.getCurrentPageResults();
    console.log('🎨 Renderizando resultados:', pageResults.length, 'propiedades');

    if (pageResults.length === 0) {
      resultsDiv.innerHTML = `
        <div class="empty-state">
          <i class="fas fa-search"></i>
          <h3>No se encontraron resultados</h3>
          <p>Intenta ajustar los filtros de búsqueda.</p>
        </div>
      `;
      return;
    }

    const startNumber = this.getStartNumber();
    console.log('📊 Número inicial:', startNumber);

    // Renderizar cada tarjeta
    const cardsHTML = pageResults.map((prop, index) => {
      const cardNumber = startNumber + index;
      console.log(`🏠 Renderizando card #${cardNumber}:`, prop.titulo || 'Sin título');
      return this.cardsHandler.render(prop, cardNumber);
    }).join('');

    console.log('📝 HTML generado, longitud:', cardsHTML.length);
    resultsDiv.innerHTML = cardsHTML;

    // Setup listeners de cards
    this.cardsHandler.setupCardListeners();

    // Registrar vistas
    this.registrarVistas(pageResults);

    // Renderizar paginación
    this.renderPagination();

    // Actualizar contador
    this.updateResultsCounter();
  }

  registrarVistas(propiedades) {
    const token = authService.getToken();
    if (!token) return;
    const headers = { 'Authorization': `Bearer ${token}` };

    propiedades.forEach(prop => {
      if (prop.tipo === 'combinacion') return;
      const propId = prop.registro_cab_id || prop.id;
      if (!propId) return;

      const key = `vista_${propId}`;
      if (sessionStorage.getItem(key)) return;
      sessionStorage.setItem(key, '1');

      fetch(`${API_CONFIG.BASE_URL}/propiedades/${propId}/vista`, {
        method: 'POST',
        headers
      }).catch(() => {});
    });
  }

  /**
   * Obtener resultados de la página actual
   */
  getCurrentPageResults() {
    const start = (this.currentPage - 1) * this.itemsPerPage;
    const end = start + this.itemsPerPage;
    return this.currentResults.slice(start, end);
  }

  /**
   * Obtener número de inicio para numeración
   */
  getStartNumber() {
    return (this.currentPage - 1) * this.itemsPerPage + 1;
  }

  /**
   * Renderizar paginación
   */
  renderPagination() {
    const paginationDiv = this.container.querySelector('#searchPagination');
    if (!paginationDiv) return;

    const totalPages = Math.ceil(this.currentResults.length / this.itemsPerPage);

    if (totalPages <= 1) {
      paginationDiv.innerHTML = '';
      return;
    }

    let html = '<div class="pagination">';

    html += `<button ${this.currentPage === 1 ? 'disabled' : ''} data-page="${this.currentPage - 1}">
      <i class="fas fa-chevron-left"></i>
    </button>`;

    for (let i = 1; i <= totalPages; i++) {
      html += `<button class="${i === this.currentPage ? 'active' : ''}" data-page="${i}">${i}</button>`;
    }

    html += `<button ${this.currentPage === totalPages ? 'disabled' : ''} data-page="${this.currentPage + 1}">
      <i class="fas fa-chevron-right"></i>
    </button>`;

    html += '</div>';

    paginationDiv.innerHTML = html;

    // Listeners
    paginationDiv.querySelectorAll('button[data-page]').forEach(btn => {
      btn.addEventListener('click', () => {
        this.currentPage = parseInt(btn.dataset.page);
        this.renderResults();
        this.mapHandler.updateMarkers(this.getCurrentPageResults(), this.getStartNumber());
      });
    });
  }

  /**
   * Actualizar contador de resultados
   */
  updateResultsCounter() {
    const counter = this.container.querySelector('#resultsCounter');
    if (counter) {
      counter.textContent = `Se encontraron ${this.currentResults.length} propiedades`;
    }
  }

  /**
   * Mostrar estado vacío
   */
  showEmptyState() {
    const resultsDiv = this.container.querySelector('#searchResults');
    if (resultsDiv) {
      resultsDiv.innerHTML = `
        <div class="empty-state">
          <i class="fas fa-exclamation-circle"></i>
          <h3>Error en la búsqueda</h3>
          <p>Por favor, intenta nuevamente.</p>
        </div>
      `;
    }
  }

  /**
   * Volver a lista de búsquedas
   */
  volverALista() {
    // Mostrar lista de búsquedas guardadas
    const listaSection = this.container.querySelector('#savedSearchesList');
    const paginationSection = this.container.querySelector('#savedSearchesPagination');
    const filtrosContainer = this.container.querySelector('.filtros-busqueda-container');

    if (listaSection) listaSection.style.display = 'block';
    if (paginationSection) paginationSection.style.display = 'block';
    if (filtrosContainer) filtrosContainer.style.display = 'block';

    // Ocultar grid de resultados
    const grid = this.container.querySelector('.busquedas-grid');
    if (grid) grid.style.display = 'none';

    // Mostrar/ocultar botones
    const btnNueva = this.container.querySelector('[data-nueva-busqueda]');
    const btnGuardar = this.container.querySelector('#btnGuardarBusqueda');
    const btnCompartir = this.container.querySelector('#btnCompartirBusqueda');
    const btnVolver = this.container.querySelector('#btnVolverLista');

    if (btnNueva) btnNueva.style.display = 'inline-flex';
    if (btnGuardar) btnGuardar.style.display = 'none';
    if (btnCompartir) btnCompartir.style.display = 'none';
    if (btnVolver) btnVolver.style.display = 'none';

    // Limpiar estado
    this.currentResults = [];
    this.currentFilters = {};
    this.currentPage = 1;
  }

  // ========================================
  // FILTROS DINÁMICOS
  // ========================================

  renderFiltrosGenericos(filters) {
    const container = this.container.querySelector('#resumenGenericos');
    if (!container) return;

    const distritos = filters.distritos && filters.distritos.length > 0
      ? filters.distritos.map(id => this.allDistritos?.find(d => d.distrito_id == id)?.nombre || id).join(', ')
      : '—';

    const tipoInmueble = filters.tipo_inmueble
      ? (this.allTipos?.find(t => t.tipo_inmueble_id == filters.tipo_inmueble)?.nombre || '—')
      : '—';

    const transaccion = filters.tipo_transaccion === 'alquiler' ? 'Alquiler' : 'Venta';
    const presupuesto = filters.presupuesto
      ? `${Number(filters.presupuesto).toLocaleString()} USD${filters.tipo_transaccion === 'alquiler' ? '/mes' : ''}`
      : '—';

    container.innerHTML = `
      <div class="item"><span>Distrito(s)</span><strong>${distritos}</strong></div>
      <div class="item"><span>Tipo Inmueble</span><strong>${tipoInmueble}</strong></div>
      <div class="item"><span>Área</span><strong>${filters.metraje || '—'} m²</strong></div>
      <div class="item"><span>Transacción</span><strong>${transaccion}</strong></div>
      <div class="item"><span>Presupuesto</span><strong>${presupuesto}</strong></div>
    `;
  }

  async cargarDatosDinamicos(tipoInmuebleId) {
    try {
      const [tiposRes, distritosRes, caracRes] = await Promise.all([
        fetch(`${API_CONFIG.BASE_URL}/tipos-inmueble`, {
          headers: { 'Authorization': `Bearer ${authService.getToken()}` }
        }),
        fetch(`${API_CONFIG.BASE_URL}/distritos?limit=100`, {
          headers: { 'Authorization': `Bearer ${authService.getToken()}` }
        }),
        fetch(`${API_CONFIG.BASE_URL}/caracteristicas`, {
          headers: { 'Authorization': `Bearer ${authService.getToken()}` }
        })
      ]);

      const tipos = await tiposRes.json();
      const distritos = await distritosRes.json();
      const carac = await caracRes.json();

      this.allTipos = Array.isArray(tipos) ? tipos : tipos.data || [];
      this.allDistritos = Array.isArray(distritos) ? distritos : distritos.data || [];
      this.allDistritos.sort((a, b) => (a.nombre || '').localeCompare(b.nombre || '', 'es'));
      this.allCaracteristicas = Array.isArray(carac) ? carac : carac.data || [];

    } catch (error) {
      console.error('Error cargando datos dinámicos:', error);
    }
  }

  renderFiltrosBasicos(filters) {
    console.log('📋 Renderizando Filtros Básicos...');
    const container = this.container.querySelector('#contenedorBasico');
    if (!container) {
      console.error('❌ No se encontró #contenedorBasico');
      return;
    }

    console.log('✅ Contenedor básico encontrado');
    const transaccionActual = filters.tipo_transaccion || 'venta';
    const esAlquiler = transaccionActual === 'alquiler';

    // Definir filtros básicos dinámicos (igual que resultados.js)
    const filtrosBasicos = [
      {
        id: 'transaccion',
        nombre: 'Transacción',
        tipo_input: 'pills',
        opciones: [
          { value: 'venta', label: 'Venta' },
          { value: 'alquiler', label: 'Alquiler' }
        ]
      },
      {
        id: 'precio_venta',
        nombre: 'Precio Venta (USD)',
        tipo_input: 'number',
        placeholder: 'Ej: 500000',
        visible_cuando: 'transaccion=venta'
      },
      {
        id: 'precio_alquiler',
        nombre: 'Precio Alquiler (USD/mes)',
        tipo_input: 'number',
        placeholder: 'Ej: 5000',
        visible_cuando: 'transaccion=alquiler'
      },
      {
        id: 'area',
        nombre: 'Área Requerida (m²)',
        tipo_input: 'number',
        placeholder: 'Ej: 300'
      },
      {
        id: 'parqueos',
        nombre: 'Parqueos Requeridos',
        tipo_input: 'number',
        placeholder: 'Ej: 5'
      },
      {
        id: 'antiguedad',
        nombre: 'Antigüedad (No mayor a años)',
        tipo_input: 'number',
        placeholder: 'Ej: 15'
      },
      {
        id: 'implementacion',
        nombre: 'Nivel de Implementación',
        tipo_input: 'select',
        opciones: [
          { value: '', label: 'Todas' },
          { value: 'Amoblado FULL', label: 'Amoblado FULL' },
          { value: 'Implementada', label: 'Implementada' },
          { value: 'Semi Implementada', label: 'Semi Implementada' },
          { value: 'Por Implementar', label: 'Por Implementar' }
        ]
      }
    ];

    // Inicializar valores
    const valores = {
      transaccion: transaccionActual,
      precio_venta: filters.presupuesto && !esAlquiler ? filters.presupuesto : '',
      precio_alquiler: filters.presupuesto && esAlquiler ? filters.presupuesto : '',
      area: filters.metraje || '',
      parqueos: '',
      antiguedad: '',
      implementacion: ''
    };

    // Renderizar cada filtro
    container.innerHTML = `
      <div class="filtro-section">
        ${filtrosBasicos.map(filtro => this.renderFiltroBasicoItem(filtro, valores)).join('')}
      </div>
    `;
    console.log('✅ Filtros Básicos renderizados');
  }

  /**
   * Renderizar un item de filtro básico (igual que resultados.js)
   */
  renderFiltroBasicoItem(filtro, valores) {
    const value = valores[filtro.id] || '';
    const transaccionActual = valores.transaccion || 'venta';

    // Verificar visibilidad condicional
    if (filtro.visible_cuando) {
      const [campo, valorRequerido] = filtro.visible_cuando.split('=');
      if (valores[campo] !== valorRequerido) {
        return ''; // No mostrar este campo
      }
    }

    if (filtro.tipo_input === 'pills') {
      return `
        <div class="form-group">
          <label>${filtro.nombre}</label>
          <div class="pills-row" role="group" aria-label="${filtro.nombre}">
            ${filtro.opciones.map(opt => `
              <button
                type="button"
                class="pill pill-transaccion ${value === opt.value ? 'active' : ''}"
                data-filtro-id="${filtro.id}"
                data-value="${opt.value}"
                aria-pressed="${value === opt.value ? 'true' : 'false'}"
              >
                ${opt.label}
              </button>
            `).join('')}
          </div>
        </div>
      `;
    }

    if (filtro.tipo_input === 'number') {
      return `
        <div class="form-group" data-filtro-group="${filtro.id}">
          <label for="${filtro.id}_basico">${filtro.nombre}</label>
          <input
            type="number"
            id="${filtro.id}_basico"
            class="form-control"
            placeholder="${filtro.placeholder || ''}"
            value="${value}"
            data-filtro-id="${filtro.id}"
          >
        </div>
      `;
    }

    if (filtro.tipo_input === 'select') {
      return `
        <div class="form-group">
          <label for="${filtro.id}_basico">${filtro.nombre}</label>
          <select
            id="${filtro.id}_basico"
            class="form-control"
            data-filtro-id="${filtro.id}"
          >
            ${filtro.opciones.map(opt => `
              <option value="${opt.value}" ${value === opt.value ? 'selected' : ''}>
                ${opt.label}
              </option>
            `).join('')}
          </select>
        </div>
      `;
    }

    return '';
  }

  async cargarFiltrosAvanzados(tipoInmuebleId) {
    console.log('⚙️ Cargando Filtros Avanzados para tipo:', tipoInmuebleId);
    if (!tipoInmuebleId) {
      console.warn('⚠️ No hay tipo_inmueble_id');
      return;
    }

    try {
      const url = `${API_CONFIG.BASE_URL}/caracteristicas-x-inmueble/tipo-inmueble/${tipoInmuebleId}/agrupadas`;
      console.log('📡 URL:', url);

      const response = await fetch(url, {
        headers: { 'Authorization': `Bearer ${authService.getToken()}` }
      });

      console.log('📥 Response status:', response.status);
      const data = await response.json();
      console.log('📦 Datos recibidos:', data);

      this.renderFiltrosAvanzadosHTML(data);

    } catch (error) {
      console.error('❌ Error cargando filtros avanzados:', error);
    }
  }

  renderFiltrosAvanzadosHTML(data) {
    console.log('⚙️ Renderizando HTML de Filtros Avanzados...');
    const container = this.container.querySelector('#contenedorAvanzado');
    if (!container) {
      console.error('❌ No se encontró #contenedorAvanzado');
      return;
    }

    console.log('✅ Contenedor avanzado encontrado');

    const categorias = data.categorias || [];
    console.log(`📦 ${categorias.length} categorías a renderizar`);

    // Mapa de iconos WebP por categoría
    const iconMap = {
      'Generales del Edificio': 'building.webp',
      'Soporte del Edificio': 'shield-check.webp',
      'Áreas Comunes del Edificio': 'building-community.webp',
      'Ascensores': 'elevator.webp',
      'De la Oficina': 'file-description.webp',
      'Equipamiento de Oficina': 'armchair.webp',
      'Vista de la Oficina': 'eye.webp',
      'Información de Áreas': 'ruler-2.webp',
      'Valorización Edificio': 'currency-dollar.webp',
      'Soporte Urbano': 'train.webp',
      'Condición Comercial': 'cash.webp',
      'CARACTERISTICAS_CASA': 'home.webp',
      'CARACTERISTICAS_DEPTO': 'building.webp',
      'CARACTERISTICAS_TERRENO': 'road.webp',
      'CARACTERISTICAS_LOCAL': 'building-store.webp',
      'SERVICIOS': 'bolt.webp',
      'SEGURIDAD': 'shield-check.webp',
      'TECNOLOGIA_CONECTIVIDAD': 'wifi.webp',
      'SOSTENIBILIDAD': 'trees.webp',
      'ESPACIOS_PERSONALES': 'home.webp',
      'COMPLEMENTARIOS': 'box.webp',
      'OTROS': 'file-description.webp'
    };
    const catIcon = (file) => `<img src="assets/icons/amenidades/${file}" width="18" height="18" alt="" style="vertical-align: middle;">`;

    container.innerHTML = categorias.map(cat => {
      console.log(`📂 Categoría: ${cat.nombre}, ${cat.caracteristicas?.length || 0} características`);

      const iconFile = iconMap[cat.nombre] || 'file-description.webp';
      const pillsHTML = cat.caracteristicas.map(c => this.renderCaracteristicaPill(c, cat.nombre)).join('');

      return `
        <div class="accordion-item-avanzado">
          <button class="accordion-header-avanzado" type="button" data-categoria="${cat.nombre}" aria-expanded="false">
            ${catIcon(iconFile)}
            <span>${cat.nombre}</span>
            <i class="fa-solid fa-chevron-down accordion-arrow"></i>
          </button>
          <div class="accordion-content-avanzado" data-categoria="${cat.nombre}" style="background: #f5f5f5;">
            <div class="pills-row" style="display: flex; flex-wrap: wrap; gap: 8px; padding: 10px;">
              ${pillsHTML}
            </div>
          </div>
        </div>
      `;
    }).join('');

    console.log('✅ Filtros Avanzados renderizados');
  }

  /**
   * Renderizar pill de característica con iconos (igual que resultados.js)
   */
  renderCaracteristicaPill(item, categoria) {
    // Función para obtener archivo WebP basado en el nombre
    const getIconFile = (nombre) => {
      const n = nombre.toLowerCase();
      if (n.includes('wifi') || n.includes('internet') || n.includes('fibra')) return 'wifi.webp';
      if (n.includes('aire acondicionado') || n.includes('a/c') || n.includes('aac') || n.includes('chiller')) return 'air-conditioning.webp';
      if (n.includes('ascensor') || n.includes('montacarga')) return 'elevator.webp';
      if (n.includes('escalera')) return 'stairs-up.webp';
      if (n.includes('parqueo') || n.includes('estacionamiento') || n.includes('cochera')) return 'parking.webp';
      if (n.includes('bicicleta')) return 'bike.webp';
      if (n.includes('piscina')) return 'building-community.webp';
      if (n.includes('gym') || n.includes('gimnasio')) return 'barbell.webp';
      if (n.includes('parque') || n.includes('jardín')) return 'trees.webp';
      if (n.includes('seguridad') || n.includes('vigilancia') || n.includes('recepción')) return 'shield-check.webp';
      if (n.includes('cámara') || n.includes('video') || n.includes('cctv')) return 'video.webp';
      if (n.includes('generador') || n.includes('electrógeno')) return 'bolt.webp';
      if (n.includes('sprinkler') || n.includes('rociador') || n.includes('agua')) return 'droplet.webp';
      if (n.includes('cocina') || n.includes('comedor')) return 'tools-kitchen-2.webp';
      if (n.includes('baño')) return 'bath.webp';
      if (n.includes('sala de reunion') || n.includes('sum')) return 'users-group.webp';
      if (n.includes('deposito')) return 'box.webp';
      if (n.includes('vista')) return 'eye.webp';
      if (n.includes('terraza') || n.includes('rooftop')) return 'building-skyscraper.webp';
      if (n.includes('piso')) return 'square-half.webp';
      if (n.includes('luminaria')) return 'bulb.webp';
      if (n.includes('mobiliario')) return 'armchair.webp';
      if (n.includes('roller') || n.includes('ventana')) return 'window.webp';
      if (n.includes('tabique') || n.includes('mampara')) return 'layout-distribute-vertical.webp';
      if (n.includes('cable') || n.includes('cableado')) return 'plug-connected.webp';
      if (n.includes('dormitorio') || n.includes('habitación')) return 'home.webp';
      if (n.includes('lobby')) return 'home.webp';
      if (n.includes('helipuerto')) return 'drone.webp';
      return 'circle-check.webp';
    };
    const pillImg = (nombre) => `<img src="assets/icons/amenidades/${getIconFile(nombre)}" width="16" height="16" alt="" style="vertical-align: middle;">`;

    if (item.tipo_input === 'checkbox') {
      return `
        <button
          type="button"
          class="pill-icon"
          data-cat="${categoria}"
          data-carac-id="${item.caracteristica_id}"
          data-tipo="checkbox"
          data-tooltip="${item.nombre}"
          aria-pressed="false"
          title="${item.nombre}"
        >
          ${pillImg(item.nombre)}
        </button>
      `;
    }

    if (item.tipo_input === 'number') {
      return `
        <div class="number-filter-compact" data-tooltip="${item.nombre} ${item.unidad ? `(${item.unidad})` : ''}">
          ${pillImg(item.nombre)}
          <input
            type="number"
            class="form-control-compact"
            value=""
            data-cat="${categoria}"
            data-carac-id="${item.caracteristica_id}"
            placeholder="0"
            title="${item.nombre}"
          >
          ${item.unidad ? `<span class="unit-label">${item.unidad}</span>` : ''}
        </div>
      `;
    }

    return '';
  }

  /**
   * Configurar acordeones principales (Genéricos, Básico, Avanzados)
   * Igual que resultados.js - setupAccordion()
   */
  setupAccordion() {
    console.log('🎯 Configurando acordeones principales...');

    // Buscar todos los headers de acordeón dentro del container
    const headers = this.container.querySelectorAll('.accordion-header');
    console.log(`📦 ${headers.length} acordeones principales encontrados`);

    headers.forEach(header => {
      // Remover listener anterior si existe
      if (header._accordionListener) {
        header.removeEventListener('click', header._accordionListener);
      }

      // Crear nuevo listener
      const newListener = (e) => {
        const acordeonId = e.currentTarget.getAttribute('data-accordion');
        console.log(`🖱️ Click en acordeón principal: ${acordeonId}`);

        const content = this.container.querySelector(`.accordion-content[data-accordion="${acordeonId}"]`);

        if (!content) {
          console.error('❌ No se encontró contenido para:', acordeonId);
          return;
        }

        const wasExpanded = e.currentTarget.getAttribute('aria-expanded') === 'true';

        // Cerrar todos los paneles del contenedor
        const container = e.currentTarget.closest('.filters-inner');
        if (container) {
          container.querySelectorAll('.accordion-header').forEach(h => {
            h.setAttribute('aria-expanded', 'false');
          });
          container.querySelectorAll('.accordion-content').forEach(c => {
            c.classList.remove('open');
          });
        }

        // Alternar el panel actual (abrir si estaba cerrado)
        if (!wasExpanded) {
          e.currentTarget.setAttribute('aria-expanded', 'true');
          content.classList.add('open');
          console.log(`✅ Acordeón ${acordeonId} abierto`);
        } else {
          console.log(`📁 Acordeón ${acordeonId} cerrado`);
        }
      };

      // Guardar referencia y agregar listener
      header._accordionListener = newListener;
      header.addEventListener('click', newListener);
    });

    console.log('✅ Listeners de acordeones principales configurados');
  }

  /**
   * Adjuntar listeners a sub-acordeones de Filtros Avanzados (categorías)
   * Igual que resultados.js - attachAvanzadoInlineListeners()
   */
  attachAvanzadoInlineListeners() {
    console.log('🔧 Adjuntando listeners a acordeones avanzados...');

    const headers = this.container.querySelectorAll('.accordion-header-avanzado');
    console.log(`📦 ${headers.length} headers de categorías encontrados`);

    headers.forEach((header) => {
      // Remover listener anterior si existe para evitar duplicados
      if (header._avanzadoListener) {
        header.removeEventListener('click', header._avanzadoListener);
      }

      // Crear el nuevo listener
      const clickHandler = (e) => {
        e.preventDefault();
        e.stopPropagation();

        const categoria = e.currentTarget.getAttribute('data-categoria');
        console.log(`🖱️ Click en categoría: ${categoria}`);

        // Buscar contenido en el mismo contenedor que el header
        const parentContainer = e.currentTarget.closest('.accordion-item-avanzado');
        const content = parentContainer?.querySelector(`.accordion-content-avanzado[data-categoria="${categoria}"]`);

        if (!content) {
          console.error('❌ No se encontró contenido para categoría:', categoria);
          return;
        }

        const wasExpanded = e.currentTarget.getAttribute('aria-expanded') === 'true';

        // Toggle current panel
        if (wasExpanded) {
          e.currentTarget.setAttribute('aria-expanded', 'false');
          e.currentTarget.classList.remove('active');
          content.classList.remove('open');
          console.log(`📁 Categoría cerrada: ${categoria}`);
        } else {
          e.currentTarget.setAttribute('aria-expanded', 'true');
          e.currentTarget.classList.add('active');
          content.classList.add('open');
          console.log(`📂 Categoría abierta: ${categoria}`);
        }
      };

      // Guardar referencia al listener y agregarlo
      header._avanzadoListener = clickHandler;
      header.addEventListener('click', clickHandler);
    });

    console.log('✅ Listeners de acordeones avanzados adjuntados');
  }

  /**
   * Configurar acordeones: solo Genéricos abierto, demás cerrados
   */
  abrirAcordeones() {
    console.log('📂 Configurando acordeones de filtros...');

    // Filtros Genéricos: siempre abierto
    const genericosBtn = this.container.querySelector('[data-accordion="genericos"]');
    const genericosContent = genericosBtn?.nextElementSibling;
    if (genericosBtn && genericosContent) {
      genericosBtn.setAttribute('aria-expanded', 'true');
      genericosContent.classList.add('open');
      console.log('✅ Acordeón Genéricos abierto');
    }

    // Filtro Básico: cerrado por defecto
    const basicoBtn = this.container.querySelector('[data-accordion="basico"]');
    const basicoContent = basicoBtn?.nextElementSibling;
    if (basicoBtn && basicoContent) {
      basicoBtn.setAttribute('aria-expanded', 'false');
      basicoContent.classList.remove('open');
      console.log('📁 Acordeón Básico cerrado');
    }

    // Filtros Avanzados: cerrado por defecto
    const avanzadoBtn = this.container.querySelector('[data-accordion="avanzado"]');
    const avanzadoContent = avanzadoBtn?.nextElementSibling;
    if (avanzadoBtn && avanzadoContent) {
      avanzadoBtn.setAttribute('aria-expanded', 'false');
      avanzadoContent.classList.remove('open');
      console.log('📁 Acordeón Avanzado cerrado');
    }

    console.log('✅ Configuración de acordeones completada');
  }
}

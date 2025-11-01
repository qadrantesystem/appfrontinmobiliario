/**
 * 🔍 Tab de Búsquedas
 * Archivo: tabs/busquedas/busquedas.js
 *
 * Sistema completo de búsqueda dentro del dashboard:
 * - Modal de búsqueda con filtros
 * - Acordeón de filtros (Genérico/Básico/Avanzado)
 * - Cards con carrusel + favoritos
 * - Mapa de resultados
 * - Botones: Guardar y Compartir (correo + WhatsApp)
 * - Generación de fichas PDF
 */

class BusquedasTab {
  constructor(dashboardApp) {
    this.app = dashboardApp;
    this.container = null;

    // Estado
    this.currentResults = [];
    this.selectedProperties = new Set();
    this.currentFilters = {};
    this.currentPage = 1;
    this.itemsPerPage = 5; // 5 registros por página
    this.totalPages = 1;

    // Componentes
    this.map = null;
    this.currentSearchId = null; // ID de la búsqueda guardada actual

    // Búsquedas guardadas
    this.allSearches = []; // Todas las búsquedas del API
    this.filteredSearches = []; // Búsquedas después de aplicar filtros
    this.currentSearchesPage = 1; // Página actual de búsquedas guardadas
    this.searchesPerPage = 5; // Búsquedas guardadas por página
  }

  /**
   * Renderizar tab
   */
  async render() {
    console.log('🔍 Renderizando tab de Búsquedas...');

    return `
      <div class="busquedas-tab">
        <!-- Header -->
        <div class="busquedas-header">
          <div>
            <h2>Búsqueda de Propiedades</h2>
            <p id="resultsCounter" class="results-counter">
              Inicia una búsqueda para ver resultados
            </p>
          </div>
          <div class="header-actions" style="display: flex; gap: 12px; align-items: center;">
            <button class="btn btn-secondary" data-nueva-busqueda style="display: inline-flex; align-items: center; gap: 6px;">
              <i class="fas fa-plus"></i> Nueva Búsqueda
            </button>
            <!-- Toolbar de Acciones de Resultados (misma fila) -->
            <button id="btnGuardarBusqueda" class="btn btn-primary" style="display: none; align-items: center; gap: 6px;">
              <i class="fas fa-save"></i> Guardar
            </button>
            <button id="btnCompartirBusqueda" class="btn btn-primary" style="display: none; align-items: center; gap: 6px;">
              <i class="fas fa-share-alt"></i> Compartir
            </button>
            <button id="btnVolverLista" class="btn btn-outline" style="display: none; align-items: center; gap: 6px;">
              <i class="fas fa-arrow-left"></i> Volver a Lista
            </button>
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
              <button id="btnAplicarFiltros" class="btn btn-primary">
                Aplicar
              </button>
              <button id="btnLimpiarFiltros" class="btn btn-secondary">
                Limpiar
              </button>
            </div>
          </div>
        </div>

        <style>
          .filtros-busqueda-container {
            background: white;
            padding: var(--spacing-lg);
            border-radius: var(--radius-lg);
            box-shadow: var(--shadow-sm);
            margin-bottom: var(--spacing-lg);
          }

          .filtros-grid {
            display: grid;
            grid-template-columns: 1fr 1fr 1fr auto;
            gap: var(--spacing-md);
            align-items: end;
          }

          .filtro-item {
            display: flex;
            flex-direction: column;
            gap: var(--spacing-xs);
          }

          .filtro-item label {
            color: var(--gris-medio);
            font-size: 0.9rem;
            font-weight: 500;
          }

          .filtro-item input {
            width: 100%;
            padding: var(--spacing-sm);
            border: 1px solid var(--borde);
            border-radius: var(--radius-md);
            font-size: 0.9rem;
          }

          .filtros-botones {
            display: flex;
            gap: var(--spacing-sm);
          }

          .filtros-botones button {
            padding: var(--spacing-sm) var(--spacing-lg);
            white-space: nowrap;
          }

          /* Responsivo para tablets */
          @media (max-width: 1024px) {
            .filtros-grid {
              grid-template-columns: 1fr 1fr;
            }

            .filtros-botones {
              grid-column: 1 / -1;
              justify-content: flex-start;
            }
          }

          /* Responsivo para móviles */
          @media (max-width: 768px) {
            .filtros-busqueda-container {
              padding: var(--spacing-md);
            }

            .filtros-grid {
              grid-template-columns: 1fr;
              gap: var(--spacing-sm);
            }

            .filtros-botones {
              flex-direction: column;
              width: 100%;
            }

            .filtros-botones button {
              width: 100%;
              padding: var(--spacing-md);
            }
          }
        </style>

        <!-- Lista de Búsquedas Guardadas -->
        <div id="savedSearchesList" class="saved-searches-section">
          <div class="loading-state">
            <div class="spinner-large"></div>
            <p>Cargando búsquedas guardadas...</p>
          </div>
        </div>

        <!-- Paginación de Búsquedas Guardadas -->
        <div id="savedSearchesPagination" style="margin-top: var(--spacing-lg);"></div>

        <!-- Acordeón de Filtros (inicialmente oculto) -->
        <div id="filtersSection" style="display: none;">
          <div id="searchFiltersAccordion"></div>
        </div>


        <!-- Grid: Filtros + Resultados + Mapa (inicialmente oculto) -->
        <div class="busquedas-grid" style="display: none;">
          <!-- Columna Izquierda: Filtros Acordeón -->
          <aside class="filters-column">
            <div class="filters-inner">
              <!-- Filtros Genéricos (Resumen) -->
              <div class="accordion-item">
                <button class="accordion-header" type="button" data-accordion="genericos" aria-expanded="true">
                  <i class="fa-solid fa-filter"></i>
                  <span>Filtros Genéricos</span>
                  <i class="fa-solid fa-chevron-down accordion-arrow"></i>
                </button>
                <div class="accordion-content open" data-accordion="genericos">
                  <div id="resumenGenericos" class="resumen-genericos">
                    <!-- Se carga dinámicamente -->
                  </div>
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
                  <div id="contenedorBasico" class="contenedor-basico">
                    <!-- Se carga dinámicamente -->
                  </div>
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
                  <div id="contenedorAvanzado" class="contenedor-avanzado">
                    <!-- Se carga dinámicamente -->
                  </div>
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
            <div id="searchResults">
              <!-- Se llena dinámicamente -->
            </div>

            <!-- Paginación -->
            <div id="searchPagination"></div>
          </div>

          <!-- Columna Derecha: Mapa -->
          <div class="map-column">
            <div id="busquedasMap" class="busquedas-map"></div>
          </div>
        </div>

        <!-- Modal de Nueva Búsqueda (Oculto inicialmente) -->
        <div class="modal-overlay" id="modalNuevaBusqueda" style="display: none;">
          <div class="modal-busqueda-custom">
            <button class="modal-close-custom" id="btnCerrarModalBusqueda">
              ✕
            </button>

            <!-- Título con línea -->
            <div class="modal-header-custom">
              <h2>Búsqueda Generica</h2>
            </div>

            <!-- Contenido del formulario -->
            <div class="modal-body-custom">
              <!-- Tipo de Inmueble -->
              <div class="form-group-custom full-width">
                <label>Tipo de Inmueble</label>
                <select id="modalTipoInmueble" class="form-control-custom">
                  <option value="">Selecciona tipo...</option>
                  <!-- Se carga dinámicamente -->
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
                    <div class="multi-select-custom__options" id="modalDistritoOptions">
                      <!-- Opciones renderizadas por JS -->
                    </div>
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
                    <option value="compra" selected>Compra</option>
                    <option value="alquiler">Alquiler</option>
                  </select>
                </div>

                <div class="form-group-custom">
                  <label>Metraje (m²)</label>
                  <input type="number" id="modalMetraje" class="form-control-custom" placeholder="Ej: 460">
                  <small class="help-text">El sistema busca ±15%</small>
                </div>

                <div class="form-group-custom">
                  <label id="modalLabelPresupuesto">Presupuesto Compra (USD)</label>
                  <input type="number" id="modalPresupuesto" class="form-control-custom" placeholder="750,000">
                  <small class="help-text" id="modalHelperPresupuesto">Tolerancia ±15%</small>
                </div>
              </div>

              <!-- Botón Buscar -->
              <button id="btnEjecutarBusqueda" class="btn-buscar-custom">
                BUSCAR PROPIEDADES
              </button>
            </div>
          </div>

          <style>
            /* Modal Overlay */
            .modal-overlay {
              position: fixed;
              top: 0;
              left: 0;
              width: 100%;
              height: 100%;
              background: rgba(0, 0, 0, 0.6);
              display: flex;
              justify-content: center;
              align-items: center;
              z-index: 9999;
              padding: 20px;
            }

            /* Modal Container */
            .modal-busqueda-custom {
              background: white;
              border-radius: 16px;
              max-width: 1000px;
              width: 100%;
              max-height: 90vh;
              overflow-y: auto;
              position: relative;
              box-shadow: 0 20px 60px rgba(0, 0, 0, 0.3);
            }

            /* Botón Cerrar */
            .modal-close-custom {
              position: absolute;
              top: 20px;
              right: 20px;
              background: none;
              border: none;
              font-size: 28px;
              color: #2C5282;
              cursor: pointer;
              width: 40px;
              height: 40px;
              display: flex;
              align-items: center;
              justify-content: center;
              border-radius: 50%;
              transition: all 0.2s;
              z-index: 10;
            }

            .modal-close-custom:hover {
              background: #f0f0f0;
              transform: rotate(90deg);
            }

            /* Header con título */
            .modal-header-custom {
              padding: 24px 32px 16px;
              border-bottom: 3px solid #E8A317;
            }

            .modal-header-custom h2 {
              margin: 0;
              color: #2C5282;
              font-size: 22px;
              font-weight: 600;
            }

            /* Body del modal */
            .modal-body-custom {
              padding: 24px 32px 32px;
            }

            /* Form Groups */
            .form-group-custom {
              margin-bottom: 16px;
            }

            .form-group-custom.full-width {
              width: 100%;
            }

            .form-group-custom label {
              display: block;
              margin-bottom: 6px;
              color: #2C5282;
              font-weight: 600;
              font-size: 13px;
            }

            /* Form Controls */
            .form-control-custom {
              width: 100%;
              padding: 10px 14px;
              border: 1px solid #d1d5db;
              border-radius: 8px;
              font-size: 14px;
              color: #374151;
              background: white;
              transition: all 0.2s;
            }

            .form-control-custom:focus {
              outline: none;
              border-color: #2C5282;
              box-shadow: 0 0 0 3px rgba(44, 82, 130, 0.1);
            }

            .form-control-custom::placeholder {
              color: #9ca3af;
            }

            /* Form Rows */
            .form-row-custom {
              display: grid;
              gap: 12px;
              margin-bottom: 16px;
            }

            .form-row-custom.three-cols {
              grid-template-columns: repeat(3, 1fr);
            }

            /* Help Text */
            .help-text {
              display: block;
              margin-top: 6px;
              font-size: 12px;
              color: #6b7280;
            }

            /* Multi-select Custom */
            .multi-select-custom {
              position: relative;
              width: 100%;
            }

            .multi-select-custom__button {
              width: 100%;
              padding: 10px 14px;
              border: 1px solid #d1d5db;
              border-radius: 8px;
              background: white;
              text-align: left;
              cursor: pointer;
              display: flex;
              align-items: center;
              justify-content: space-between;
              transition: all 0.2s;
              min-height: 42px;
            }

            .multi-select-custom__button:hover,
            .multi-select-custom__button:focus {
              border-color: #2C5282;
              outline: none;
            }

            .multi-select-custom__placeholder {
              color: #9ca3af;
              font-size: 14px;
            }

            .multi-select-custom__tags {
              display: flex;
              flex-wrap: wrap;
              gap: 6px;
            }

            .multi-select-custom__tag {
              display: inline-flex;
              align-items: center;
              gap: 6px;
              padding: 4px 10px;
              background: #E8A317;
              color: white;
              border-radius: 6px;
              font-size: 13px;
            }

            .multi-select-custom__tag-remove {
              background: none;
              border: none;
              color: white;
              font-size: 16px;
              cursor: pointer;
              padding: 0;
              line-height: 1;
            }

            .multi-select-custom__arrow {
              color: #6b7280;
              font-size: 16px;
            }

            .multi-select-custom__panel {
              position: absolute;
              top: 100%;
              left: 0;
              right: 0;
              margin-top: 4px;
              background: white;
              border: 1px solid #d1d5db;
              border-radius: 8px;
              box-shadow: 0 10px 25px rgba(0, 0, 0, 0.15);
              z-index: 1000;
              max-height: 300px;
              overflow: hidden;
              display: flex;
              flex-direction: column;
            }

            /* Respetar el atributo hidden - IMPORTANTE para que inicie cerrado */
            .multi-select-custom__panel[hidden] {
              display: none !important;
            }

            .multi-select-custom__search {
              padding: 12px;
              border-bottom: 1px solid #e5e7eb;
            }

            .multi-select-custom__search input {
              width: 100%;
              padding: 8px 12px;
              border: 1px solid #d1d5db;
              border-radius: 6px;
              font-size: 14px;
            }

            .multi-select-custom__options {
              overflow-y: auto;
              max-height: 200px;
            }

            .multi-select-custom__option {
              padding: 10px 12px;
              cursor: pointer;
              display: flex;
              align-items: center;
              gap: 10px;
              transition: background 0.15s;
            }

            .multi-select-custom__option:hover {
              background: #f3f4f6;
            }

            .multi-select-custom__option input[type="checkbox"] {
              cursor: pointer;
            }

            .multi-select-custom__option label {
              cursor: pointer;
              margin: 0;
              font-weight: normal;
              color: #374151;
            }

            .multi-select-custom__actions {
              padding: 12px;
              border-top: 1px solid #e5e7eb;
              display: flex;
              gap: 10px;
            }

            .multi-select-custom__actions button {
              flex: 1;
              padding: 8px 12px;
              border: 1px solid #d1d5db;
              border-radius: 6px;
              background: white;
              color: #374151;
              font-size: 13px;
              cursor: pointer;
              transition: all 0.2s;
            }

            .multi-select-custom__actions button:hover {
              background: #f9fafb;
              border-color: #2C5282;
            }

            /* Botón Buscar */
            .btn-buscar-custom {
              width: auto;
              min-width: 280px;
              padding: 12px 32px;
              background: #E8A317;
              color: white;
              border: none;
              border-radius: 8px;
              font-size: 14px;
              font-weight: 700;
              cursor: pointer;
              transition: all 0.2s;
              margin-top: 8px;
              margin-left: auto;
              display: block;
              text-transform: uppercase;
              letter-spacing: 0.5px;
            }

            .btn-buscar-custom:hover {
              background: #d89310;
              transform: translateY(-2px);
              box-shadow: 0 8px 20px rgba(232, 163, 23, 0.3);
            }

            .btn-buscar-custom:active {
              transform: translateY(0);
            }

            /* Responsive */
            @media (max-width: 768px) {
              .modal-busqueda-custom {
                max-height: 95vh;
                border-radius: 12px;
              }

              .modal-header-custom {
                padding: 20px 20px 15px;
              }

              .modal-header-custom h2 {
                font-size: 20px;
              }

              .modal-body-custom {
                padding: 20px;
              }

              .modal-close-custom {
                top: 15px;
                right: 15px;
              }

              .form-row-custom.three-cols {
                grid-template-columns: 1fr;
              }

              .multi-select-custom__panel {
                max-height: 250px;
              }

              .btn-buscar-custom {
                width: 100%;
                margin-left: 0;
                min-width: unset;
              }
            }


            /* Grid 3 Columnas: Filtros | Resultados | Mapa */
            .busquedas-grid {
              display: grid;
              grid-template-columns: 300px 1fr 400px;
              gap: 20px;
              padding: 20px;
              min-height: calc(100vh - 200px);
            }

            /* Columna de Filtros */
            .filters-column {
              background: white;
              border-radius: 8px;
              padding: 20px;
              box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
              height: fit-content;
              position: sticky;
              top: 20px;
            }

            .filters-inner {
              margin-bottom: 16px;
            }

            /* Acordeón */
            .accordion-item {
              border-bottom: 1px solid #e5e7eb;
              margin-bottom: 8px;
            }

            .accordion-item:last-child {
              border-bottom: none;
            }

            .accordion-header {
              width: 100%;
              padding: 14px 12px;
              background: white;
              border: none;
              display: flex;
              align-items: center;
              gap: 10px;
              cursor: pointer;
              font-size: 14px;
              font-weight: 600;
              color: #2C5282;
              transition: all 0.2s;
              border-radius: 6px;
            }

            .accordion-header:hover {
              background: #f3f4f6;
            }

            .accordion-header[aria-expanded="true"] {
              background: #f0f7ff;
              color: #2C5282;
            }

            .accordion-header i:first-child {
              font-size: 16px;
            }

            .accordion-header span {
              flex: 1;
              text-align: left;
            }

            .accordion-arrow {
              font-size: 12px;
              transition: transform 0.2s;
            }

            .accordion-header[aria-expanded="true"] .accordion-arrow {
              transform: rotate(180deg);
            }

            .accordion-content {
              max-height: 0;
              overflow: hidden;
              transition: max-height 0.3s ease;
              padding: 0 12px;
            }

            .accordion-content.open {
              max-height: 2000px;
              padding: 12px;
            }

            .resumen-genericos {
              display: grid;
              gap: 8px;
              font-size: 13px;
            }

            .resumen-genericos .item {
              display: flex;
              justify-content: space-between;
              padding: 6px 0;
              border-bottom: 1px solid #f3f4f6;
            }

            .resumen-genericos .item span {
              color: #6b7280;
            }

            .resumen-genericos .item strong {
              color: #2C5282;
              font-weight: 600;
            }

            .filters-actions {
              display: flex;
              gap: 8px;
              padding-top: 12px;
              border-top: 1px solid #e5e7eb;
            }

            .filters-actions .btn {
              flex: 1;
              padding: 10px;
              font-size: 13px;
              border-radius: 6px;
              display: flex;
              align-items: center;
              justify-content: center;
              gap: 6px;
            }

            .btn-primary {
              background: #2C5282;
              color: white;
              border: none;
            }

            .btn-primary:hover {
              background: #1e3a5f;
            }

            .btn-outline {
              background: white;
              color: #6b7280;
              border: 1px solid #d1d5db;
            }

            .btn-outline:hover {
              background: #f3f4f6;
            }

            /* Columna de Resultados */
            .results-column {
              background: white;
              border-radius: 8px;
              padding: 20px;
              box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
            }

            /* Columna de Mapa */
            .map-column {
              height: calc(100vh - 240px);
              position: sticky;
              top: 20px;
            }

            .busquedas-map {
              width: 100%;
              height: 100%;
              border-radius: 8px;
              box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
            }

            /* Responsive */
            @media (max-width: 1200px) {
              .busquedas-grid {
                grid-template-columns: 1fr 1fr;
                gap: 16px;
              }

              .filters-column {
                grid-column: 1 / -1;
                position: static;
              }

              .map-column {
                position: static;
                height: 500px;
              }
            }

            @media (max-width: 768px) {
              .busquedas-grid {
                grid-template-columns: 1fr;
                padding: 12px;
                gap: 12px;
              }

              .filters-column {
                padding: 16px;
              }

              .results-column {
                padding: 16px;
              }

              .map-column {
                height: 400px;
              }
            }

            /* Property Cards */
            .property-card {
              position: relative;
              background: white;
              border-radius: 8px;
              overflow: hidden;
              box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
              transition: all 0.3s;
              cursor: pointer;
              margin-bottom: 20px;
            }

            .property-card:hover {
              box-shadow: 0 4px 16px rgba(0, 0, 0, 0.15);
              transform: translateY(-2px);
            }

            .property-card.selected {
              border: 3px solid #2C5282;
              box-shadow: 0 4px 20px rgba(44, 82, 130, 0.3);
            }

            .property-number {
              position: absolute;
              top: 10px;
              left: 10px;
              background: #2C5282;
              color: white;
              width: 32px;
              height: 32px;
              border-radius: 50%;
              display: flex;
              align-items: center;
              justify-content: center;
              font-weight: 700;
              font-size: 14px;
              box-shadow: 0 2px 6px rgba(0, 0, 0, 0.3);
              z-index: 20;
            }

            /* Image Carousel */
            .property-image-carousel {
              position: relative;
              width: 100%;
              height: 250px;
              overflow: hidden;
              background: #f3f4f6;
            }

            .carousel-images {
              position: relative;
              width: 100%;
              height: 100%;
            }

            .carousel-image {
              position: absolute;
              top: 0;
              left: 0;
              width: 100%;
              height: 100%;
              object-fit: cover;
              opacity: 0;
              transition: opacity 0.3s ease;
            }

            .carousel-image.active {
              opacity: 1;
            }

            .carousel-prev,
            .carousel-next {
              position: absolute;
              top: 50%;
              transform: translateY(-50%);
              background: rgba(255, 255, 255, 0.9);
              border: none;
              width: 40px;
              height: 40px;
              border-radius: 50%;
              font-size: 24px;
              cursor: pointer;
              z-index: 15;
              display: flex;
              align-items: center;
              justify-content: center;
              transition: all 0.2s;
              box-shadow: 0 2px 8px rgba(0, 0, 0, 0.2);
            }

            .carousel-prev {
              left: 10px;
            }

            .carousel-next {
              right: 10px;
            }

            .carousel-prev:hover,
            .carousel-next:hover {
              background: white;
              transform: translateY(-50%) scale(1.1);
            }

            .carousel-indicators {
              position: absolute;
              bottom: 10px;
              left: 50%;
              transform: translateX(-50%);
              display: flex;
              gap: 6px;
              z-index: 15;
            }

            .carousel-indicators .indicator {
              width: 8px;
              height: 8px;
              border-radius: 50%;
              background: rgba(255, 255, 255, 0.6);
              cursor: pointer;
              transition: all 0.2s;
            }

            .carousel-indicators .indicator.active {
              background: white;
              width: 24px;
              border-radius: 4px;
            }

            /* Property Info */
            .property-info {
              padding: 16px;
            }

            .property-header-info {
              display: flex;
              justify-content: space-between;
              align-items: flex-start;
              margin-bottom: 8px;
            }

            .property-title {
              font-size: 18px;
              font-weight: 700;
              color: #2C5282;
              margin: 0;
              flex: 1;
            }

            .property-code {
              font-size: 12px;
              color: #6b7280;
              background: #f3f4f6;
              padding: 4px 8px;
              border-radius: 4px;
              font-weight: 600;
              white-space: nowrap;
              margin-left: 8px;
            }

            .property-type {
              display: flex;
              align-items: center;
              gap: 6px;
              font-size: 13px;
              color: #2C5282;
              background: #e8f0f8;
              padding: 6px 10px;
              border-radius: 6px;
              margin-bottom: 8px;
              font-weight: 600;
            }

            .property-type i {
              color: #2C5282;
            }

            .property-location {
              display: flex;
              align-items: center;
              gap: 6px;
              font-size: 14px;
              color: #6b7280;
              margin-bottom: 12px;
            }

            .property-location i {
              color: #E8A317;
            }

            .property-price {
              font-size: 20px;
              font-weight: 700;
              color: #E8A317;
              margin-bottom: 12px;
            }

            .price-tag {
              display: inline-block;
              font-size: 16px;
              font-weight: 600;
              color: #E8A317;
            }

            .property-features {
              display: flex;
              flex-wrap: wrap;
              gap: 8px;
              margin-bottom: 12px;
            }

            .property-features .feature {
              display: inline-flex;
              align-items: center;
              gap: 4px;
              padding: 6px 12px;
              background: #f3f4f6;
              border-radius: 6px;
              font-size: 13px;
              color: #1f2937;
              font-weight: 600;
            }

            .property-features .feature i {
              color: #2C5282;
              font-size: 13px;
            }

            .property-description {
              font-size: 14px;
              color: #374151;
              line-height: 1.6;
              margin: 0 0 16px 0;
              display: -webkit-box;
              -webkit-line-clamp: 3;
              -webkit-box-orient: vertical;
              overflow: hidden;
            }

            /* Property Contact */
            .property-contact {
              margin-top: 16px;
              padding-top: 16px;
              border-top: 1px solid #e5e7eb;
            }

            .contact-title {
              display: flex;
              align-items: center;
              gap: 8px;
              font-size: 14px;
              font-weight: 700;
              color: #2C5282;
              margin-bottom: 10px;
            }

            .contact-title i {
              color: #E8A317;
            }

            .contact-items {
              display: flex;
              flex-direction: column;
              gap: 8px;
            }

            .contact-item {
              display: flex;
              align-items: center;
              gap: 8px;
              font-size: 13px;
              color: #1f2937;
              font-weight: 500;
            }

            .contact-item i {
              color: #2C5282;
              width: 16px;
              font-size: 14px;
            }

            .contact-locked {
              display: flex;
              align-items: center;
              justify-content: center;
              gap: 8px;
              padding: 16px;
              margin-top: 16px;
              background: #fef3c7;
              border: 1px solid #fbbf24;
              border-radius: 8px;
              font-size: 14px;
              color: #92400e;
              font-weight: 600;
            }

            .contact-locked i {
              color: #f59e0b;
            }

            /* Filtros Avanzados Accordion */
            .filtros-avanzados-accordion {
              display: flex;
              flex-direction: column;
              gap: 8px;
            }

            .filtro-avanzado-item {
              border: 1px solid #e5e7eb;
              border-radius: 8px;
              overflow: hidden;
            }

            .filtro-avanzado-header {
              width: 100%;
              display: flex;
              align-items: center;
              gap: 10px;
              padding: 12px 14px;
              background: #f9fafb;
              border: none;
              cursor: pointer;
              font-size: 14px;
              font-weight: 600;
              color: #1f2937;
              text-align: left;
              transition: all 0.2s;
            }

            .filtro-avanzado-header:hover {
              background: #f3f4f6;
            }

            .filtro-avanzado-header i:last-child {
              transition: transform 0.3s;
            }

            .filtro-avanzado-content {
              padding: 12px 14px;
              background: white;
              display: none;
              flex-direction: column;
              gap: 10px;
            }

            .filtro-avanzado-option {
              display: flex;
              align-items: center;
              gap: 8px;
              padding: 8px;
              border-radius: 6px;
              cursor: pointer;
              transition: background 0.2s;
              font-size: 13px;
              color: #374151;
            }

            .filtro-avanzado-option:hover {
              background: #f9fafb;
            }

            .filtro-avanzado-option input[type="checkbox"] {
              cursor: pointer;
              width: 16px;
              height: 16px;
            }

            .loading-mini {
              padding: 20px;
              text-align: center;
              color: #6b7280;
              font-size: 13px;
            }

            /* Filter Forms */
            .form-group {
              margin-bottom: 14px;
            }

            .form-group label {
              display: block;
              font-size: 13px;
              font-weight: 600;
              color: #374151;
              margin-bottom: 6px;
            }

            .form-control {
              width: 100%;
              padding: 10px 12px;
              font-size: 13px;
              border: 1px solid #d1d5db;
              border-radius: 6px;
              background: white;
              transition: all 0.2s;
            }

            .form-control:focus {
              outline: none;
              border-color: #2C5282;
              box-shadow: 0 0 0 3px rgba(44, 82, 130, 0.1);
            }

            .form-control::placeholder {
              color: #9ca3af;
            }

            .contenedor-basico,
            .contenedor-avanzado {
              padding: 8px 0;
            }
          </style>
        </div>
      </div>
    `;
  }

  /**
   * After render - Se ejecuta después de que el HTML esté en el DOM
   */
  async afterRender() {
    console.log('🎨 BusquedasTab afterRender');

    // Obtener el contenedor del DOM
    this.container = document.querySelector('.busquedas-tab');

    if (!this.container) {
      console.error('❌ No se encontró el contenedor de búsquedas');
      return;
    }

    // Inicializar componentes
    await this.init();
  }

  /**
   * Inicializar componentes
   */
  async init() {
    console.log('🚀 Inicializando componentes de Búsquedas...');

    // Inicializar mapa
    this.initMap();

    // Setup listeners
    this.setupListeners();

    // Setup acordeón de filtros
    this.setupAccordion();

    // Cargar búsquedas guardadas (si las hay)
    this.loadSavedSearches();

    console.log('✅ Tab de Búsquedas inicializado');
  }

  /**
   * Inicializar mapa
   */
  initMap() {
    const mapContainer = this.container.querySelector('#busquedasMap');
    if (!mapContainer || typeof L === 'undefined') {
      console.warn('⚠️ Mapa no disponible');
      return;
    }

    // Centro de Lima
    const defaultCenter = [-12.0464, -77.0428];
    const defaultZoom = 12;

    this.map = L.map('busquedasMap').setView(defaultCenter, defaultZoom);

    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '© OpenStreetMap',
      maxZoom: 19
    }).addTo(this.map);

    this.mapMarkers = [];

    console.log('✅ Mapa inicializado');
  }

  /**
   * Setup Acordeón de filtros
   */
  setupAccordion() {
    console.log('🎨 Configurando acordeón de filtros...');

    // Seleccionar todos los headers de acordeón
    const headers = this.container.querySelectorAll('.accordion-header');

    headers.forEach(header => {
      // Remover listener anterior si existe para evitar duplicados
      const oldListener = header._accordionListener;
      if (oldListener) {
        header.removeEventListener('click', oldListener);
      }

      // Crear nuevo listener
      const newListener = (e) => {
        const acordeonId = e.currentTarget.getAttribute('data-accordion');
        const content = this.container.querySelector(`.accordion-content[data-accordion="${acordeonId}"]`);

        if (!content) return;

        const wasExpanded = e.currentTarget.getAttribute('aria-expanded') === 'true';

        // Cerrar todos los paneles del mismo contenedor
        const container = e.currentTarget.closest('.filters-inner');
        if (container) {
          container.querySelectorAll('.accordion-header').forEach(h => {
            h.setAttribute('aria-expanded', 'false');
          });
          container.querySelectorAll('.accordion-content').forEach(c => {
            c.classList.remove('open');
          });
        }

        // Alternar el panel actual
        if (!wasExpanded) {
          e.currentTarget.setAttribute('aria-expanded', 'true');
          content.classList.add('open');
        }
      };

      // Guardar referencia y agregar listener
      header._accordionListener = newListener;
      header.addEventListener('click', newListener);
    });

    // Abrir "Filtros Genéricos" por defecto
    const genericosHeader = this.container.querySelector('.accordion-header[data-accordion="genericos"]');
    if (genericosHeader) {
      genericosHeader.setAttribute('aria-expanded', 'true');
      const genericosContent = this.container.querySelector('.accordion-content[data-accordion="genericos"]');
      if (genericosContent) {
        genericosContent.classList.add('open');
      }
    }

    console.log('✅ Acordeón configurado');
  }

  /**
   * Setup listeners
   */
  setupListeners() {
    // Botón Nueva Búsqueda
    this.container.addEventListener('click', (e) => {
      if (e.target.closest('[data-nueva-busqueda]')) {
        e.preventDefault();
        this.openSearchModal();
      }
    });

    // Botón Guardar
    this.container.addEventListener('click', (e) => {
      if (e.target.closest('[data-guardar-busqueda]')) {
        e.preventDefault();
        this.guardarBusqueda();
      }
    });

    // Toggle Compartir
    this.container.addEventListener('click', (e) => {
      if (e.target.closest('[data-compartir-toggle]')) {
        e.preventDefault();
        const dropdown = document.getElementById('compartirDropdown');
        dropdown.classList.toggle('active');
      }
    });

    // Compartir por correo
    this.container.addEventListener('click', (e) => {
      if (e.target.closest('[data-compartir-correo]')) {
        e.preventDefault();
        this.compartirPorCorreo();
      }
    });

    // Compartir por WhatsApp
    this.container.addEventListener('click', (e) => {
      if (e.target.closest('[data-compartir-whatsapp]')) {
        e.preventDefault();
        this.compartirPorWhatsApp();
      }
    });

    // Ejecutar búsqueda guardada
    this.container.addEventListener('click', (e) => {
      if (e.target.closest('[data-ejecutar-busqueda]')) {
        e.preventDefault();
        const busquedaId = parseInt(e.target.closest('[data-ejecutar-busqueda]').dataset.ejecutarBusqueda);
        this.ejecutarBusquedaGuardada(busquedaId);
      }
    });

    // Paginación
    this.container.addEventListener('click', (e) => {
      // Botones numerados
      if (e.target.matches('[data-page]')) {
        e.preventDefault();
        const page = parseInt(e.target.dataset.page);
        this.goToPage(page);
      }

      // Botones prev/next
      if (e.target.matches('[data-page-action]')) {
        e.preventDefault();
        const action = e.target.dataset.pageAction;
        if (action === 'prev' && this.currentPage > 1) {
          this.goToPage(this.currentPage - 1);
        } else if (action === 'next' && this.currentPage < this.totalPages) {
          this.goToPage(this.currentPage + 1);
        }
      }
    });

    // Doble click en imagen para visor
    this.container.addEventListener('dblclick', (e) => {
      if (e.target.matches('.carousel-image')) {
        e.preventDefault();
        const carousel = e.target.closest('.property-image-carousel');
        const images = Array.from(carousel.querySelectorAll('.carousel-image')).map(img => img.src);
        const currentIndex = parseInt(carousel.querySelector('.carousel-images').dataset.current);

        // Si existe el visor de imágenes global, usarlo
        if (window.imageViewer) {
          window.imageViewer.open(images, currentIndex);
        }
      }
    });

    // Cerrar dropdown al click fuera
    document.addEventListener('click', (e) => {
      const dropdown = document.getElementById('compartirDropdown');
      if (dropdown && !e.target.closest('.dropdown-wrapper')) {
        dropdown.classList.remove('active');
      }
    });

    // Botón Aplicar Filtros
    this.container.addEventListener('click', (e) => {
      if (e.target.matches('#btnAplicarFiltros')) {
        e.preventDefault();
        this.aplicarFiltros();
      }
    });

    // Botón Limpiar Filtros
    this.container.addEventListener('click', (e) => {
      if (e.target.matches('#btnLimpiarFiltros')) {
        e.preventDefault();
        this.limpiarFiltros();
      }
    });

    // Botón Cerrar Modal
    this.container.addEventListener('click', (e) => {
      if (e.target.matches('#btnCerrarModalBusqueda')) {
        e.preventDefault();
        this.closeSearchModal();
      }
    });

    // Botón Ejecutar Búsqueda del Modal
    this.container.addEventListener('click', (e) => {
      if (e.target.matches('#btnEjecutarBusqueda')) {
        e.preventDefault();
        const filters = this.collectModalFilters();
        if (filters) {
          this.closeSearchModal();
          this.executeSearch(filters);
        }
      }
    });

    // Cambiar label de presupuesto según transacción
    this.container.addEventListener('change', (e) => {
      if (e.target.matches('#modalTransaccion')) {
        const label = this.container.querySelector('#modalLabelPresupuesto');
        const helper = this.container.querySelector('#modalHelperPresupuesto');
        if (e.target.value === 'alquiler') {
          label.textContent = 'Presupuesto Alquiler (USD/mes)';
          helper.textContent = 'Tolerancia ±15%';
        } else {
          label.textContent = 'Presupuesto Compra (USD)';
          helper.textContent = 'Tolerancia ±15%';
        }
      }
    });

    // Cerrar modal al hacer click en el overlay
    this.container.addEventListener('click', (e) => {
      if (e.target.matches('.modal-overlay')) {
        this.closeSearchModal();
      }
    });

    // Paginación de búsquedas guardadas
    this.container.addEventListener('click', (e) => {
      // Botones numerados
      if (e.target.matches('[data-searches-page]')) {
        e.preventDefault();
        const page = parseInt(e.target.dataset.searchesPage);
        this.goToSearchesPage(page);
      }

      // Botones prev/next
      if (e.target.matches('[data-searches-page-action]')) {
        e.preventDefault();
        const action = e.target.dataset.searchesPageAction;
        const totalPages = Math.ceil(this.filteredSearches.length / this.searchesPerPage);
        if (action === 'prev' && this.currentSearchesPage > 1) {
          this.goToSearchesPage(this.currentSearchesPage - 1);
        } else if (action === 'next' && this.currentSearchesPage < totalPages) {
          this.goToSearchesPage(this.currentSearchesPage + 1);
        }
      }
    });

    // Botones del toolbar de resultados
    this.container.addEventListener('click', (e) => {
      // Volver a lista
      if (e.target.matches('#btnVolverLista') || e.target.closest('#btnVolverLista')) {
        e.preventDefault();
        this.volverALista();
      }

      // Guardar búsqueda
      if (e.target.matches('#btnGuardarBusqueda') || e.target.closest('#btnGuardarBusqueda')) {
        e.preventDefault();
        this.guardarBusqueda();
      }

      // Compartir búsqueda
      if (e.target.matches('#btnCompartirBusqueda') || e.target.closest('#btnCompartirBusqueda')) {
        e.preventDefault();
        this.compartirBusqueda();
      }
    });

    console.log('✅ Event listeners configurados');
  }

  /**
   * Ir a página específica de búsquedas guardadas
   */
  goToSearchesPage(page) {
    const totalPages = Math.ceil(this.filteredSearches.length / this.searchesPerPage);
    if (page < 1 || page > totalPages) return;

    this.currentSearchesPage = page;
    this.renderizarBusquedas();

    // Scroll suave al inicio de búsquedas
    const container = this.container.querySelector('#savedSearchesList');
    if (container) {
      container.scrollIntoView({
        behavior: 'smooth',
        block: 'start'
      });
    }
  }

  /**
   * Abrir modal de búsqueda
   */
  async openSearchModal() {
    console.log('📂 Abriendo modal de nueva búsqueda...');

    const modal = this.container.querySelector('#modalNuevaBusqueda');
    if (!modal) {
      console.error('❌ Modal no encontrado');
      return;
    }

    // Cargar tipos de inmueble y distritos
    await this.loadModalData();

    // Mostrar modal
    modal.style.display = 'flex';

    // Inicializar multi-select de distritos
    this.initDistritoMultiSelect();

    console.log('✅ Modal abierto');
  }

  /**
   * Cargar datos del modal
   */
  async loadModalData() {
    console.log('📂 Cargando datos del modal...');

    try {
      // Cargar tipos de inmueble
      const tipos = await this.loadTiposPropiedad();
      const selectTipo = this.container.querySelector('#modalTipoInmueble');
      selectTipo.innerHTML = '<option value="">Selecciona un tipo...</option>' +
        tipos.map(t => `<option value="${t.tipo_inmueble_id}">${t.nombre}</option>`).join('');

      // Cargar distritos
      this.distritosData = await this.loadDistritos();

      console.log('✅ Datos del modal cargados');
    } catch (error) {
      console.error('❌ Error cargando datos del modal:', error);
    }
  }

  /**
   * Inicializar multi-select de distritos
   */
  initDistritoMultiSelect() {
    const toggle = this.container.querySelector('#modalDistritoToggle');
    const panel = this.container.querySelector('#modalDistritoPanel');
    const options = this.container.querySelector('#modalDistritoOptions');
    const search = this.container.querySelector('#modalDistritoSearch');
    const placeholder = this.container.querySelector('#modalDistritoPlaceholder');
    const tagsContainer = this.container.querySelector('#modalDistritoTags');
    const selectAllBtn = this.container.querySelector('#modalDistritoSelectAll');
    const clearBtn = this.container.querySelector('#modalDistritoClear');

    // Asegurar que el panel inicie cerrado
    if (panel) {
      panel.setAttribute('hidden', '');
    }

    // Estado
    this.selectedDistritos = new Set();

    // Renderizar opciones
    const renderOptions = (filtro = '') => {
      const distritosFiltered = this.distritosData.filter(d =>
        d.nombre.toLowerCase().includes(filtro.toLowerCase())
      );

      options.innerHTML = distritosFiltered.map(d => `
        <div class="multi-select-custom__option" data-value="${d.distrito_id}">
          <input type="checkbox" id="distrito-${d.distrito_id}" ${this.selectedDistritos.has(d.distrito_id) ? 'checked' : ''}>
          <label for="distrito-${d.distrito_id}">${d.nombre}</label>
        </div>
      `).join('');
    };

    // Actualizar tags
    const updateTags = () => {
      if (this.selectedDistritos.size === 0) {
        placeholder.style.display = 'inline';
        tagsContainer.innerHTML = '';
      } else {
        placeholder.style.display = 'none';
        const selectedNames = this.distritosData
          .filter(d => this.selectedDistritos.has(d.distrito_id))
          .map(d => d.nombre);

        tagsContainer.innerHTML = selectedNames.map(nombre => `
          <span class="multi-select-custom__tag">
            ${nombre}
            <button type="button" class="multi-select-custom__tag-remove" data-remove="${this.distritosData.find(d => d.nombre === nombre).distrito_id}">×</button>
          </span>
        `).join('');
      }
    };

    // Toggle panel
    toggle.addEventListener('click', (e) => {
      e.preventDefault();
      const isHidden = panel.hasAttribute('hidden');
      if (isHidden) {
        panel.removeAttribute('hidden');
      } else {
        panel.setAttribute('hidden', '');
      }
    });

    // Selección de opciones
    options.addEventListener('click', (e) => {
      const option = e.target.closest('.multi-select-custom__option');
      if (!option) return;

      const value = parseInt(option.dataset.value);
      const checkbox = option.querySelector('input[type="checkbox"]');

      if (this.selectedDistritos.has(value)) {
        this.selectedDistritos.delete(value);
        checkbox.checked = false;
      } else {
        this.selectedDistritos.add(value);
        checkbox.checked = true;
      }

      updateTags();
    });

    // Búsqueda
    search.addEventListener('input', (e) => {
      renderOptions(e.target.value);
    });

    // Seleccionar todos
    selectAllBtn.addEventListener('click', (e) => {
      e.preventDefault();
      this.distritosData.forEach(d => this.selectedDistritos.add(d.distrito_id));
      renderOptions(search.value);
      updateTags();
    });

    // Limpiar
    clearBtn.addEventListener('click', (e) => {
      e.preventDefault();
      this.selectedDistritos.clear();
      renderOptions(search.value);
      updateTags();
    });

    // Remover tag
    tagsContainer.addEventListener('click', (e) => {
      if (e.target.matches('.multi-select-custom__tag-remove')) {
        e.preventDefault();
        const id = parseInt(e.target.dataset.remove);
        this.selectedDistritos.delete(id);
        renderOptions(search.value);
        updateTags();
      }
    });

    // Cerrar al click fuera (usar evento único para evitar duplicados)
    const closePanel = (e) => {
      const multiSelect = this.container.querySelector('#modalDistritoMulti');
      if (multiSelect && !multiSelect.contains(e.target)) {
        panel.setAttribute('hidden', '');
      }
    };

    // Limpiar listener anterior si existe
    if (this.distritoPanelCloseHandler) {
      document.removeEventListener('click', this.distritoPanelCloseHandler);
    }

    // Guardar referencia y agregar nuevo listener
    this.distritoPanelCloseHandler = closePanel;

    // Usar timeout para evitar cerrar inmediatamente al abrir
    setTimeout(() => {
      document.addEventListener('click', this.distritoPanelCloseHandler);
    }, 100);

    // Renderizar inicial
    renderOptions();
    updateTags();
  }

  /**
   * Cerrar modal
   */
  closeSearchModal() {
    const modal = this.container.querySelector('#modalNuevaBusqueda');
    if (modal) {
      modal.style.display = 'none';

      // Limpiar formulario
      const tipoInput = this.container.querySelector('#modalTipoInmueble');
      const transaccionInput = this.container.querySelector('#modalTransaccion');
      const metrajeInput = this.container.querySelector('#modalMetraje');
      const presupuestoInput = this.container.querySelector('#modalPresupuesto');
      const distritosPanel = this.container.querySelector('#modalDistritoPanel');

      if (tipoInput) tipoInput.value = '';
      if (transaccionInput) transaccionInput.value = 'compra';
      if (metrajeInput) metrajeInput.value = '';
      if (presupuestoInput) presupuestoInput.value = '';
      if (distritosPanel) distritosPanel.setAttribute('hidden', '');

      // Limpiar distritos seleccionados
      if (this.selectedDistritos) {
        this.selectedDistritos.clear();
        const placeholder = this.container.querySelector('#modalDistritoPlaceholder');
        const tagsContainer = this.container.querySelector('#modalDistritoTags');
        if (placeholder) placeholder.style.display = 'inline';
        if (tagsContainer) tagsContainer.innerHTML = '';
      }

      // Limpiar listener del panel de distritos
      if (this.distritoPanelCloseHandler) {
        document.removeEventListener('click', this.distritoPanelCloseHandler);
        this.distritoPanelCloseHandler = null;
      }
    }
  }

  /**
   * Recopilar filtros del modal
   */
  collectModalFilters() {
    const tipo = this.container.querySelector('#modalTipoInmueble').value;
    if (!tipo) {
      showNotification('⚠️ Selecciona un tipo de inmueble', 'warning');
      return null;
    }

    const transaccion = this.container.querySelector('#modalTransaccion').value;
    const metraje = this.container.querySelector('#modalMetraje').value;
    const presupuesto = this.container.querySelector('#modalPresupuesto').value;

    // Calcular rangos con tolerancia del 15%
    let metraje_min = null;
    let metraje_max = null;
    if (metraje) {
      const metNum = parseFloat(metraje);
      metraje_min = Math.round(metNum * 0.85);
      metraje_max = Math.round(metNum * 1.15);
    }

    let precio_min = null;
    let precio_max = null;
    if (presupuesto) {
      const precioNum = parseFloat(presupuesto);
      precio_min = Math.round(precioNum * 0.85);
      precio_max = Math.round(precioNum * 1.15);
    }

    return {
      tipo_inmueble_id: parseInt(tipo),
      distritos: this.selectedDistritos.size > 0 ? Array.from(this.selectedDistritos) : null,
      transaccion: transaccion,
      area_min: metraje_min,
      area_max: metraje_max,
      precio_min: precio_min,
      precio_max: precio_max
    };
  }

  /**
   * Ejecutar búsqueda
   */
  async executeSearch(filters) {
    console.log('🔍 Ejecutando búsqueda:', filters);

    this.currentFilters = filters;

    // Ocultar lista de búsquedas guardadas, filtros y paginación
    const savedList = this.container.querySelector('#savedSearchesList');
    const filtrosContainer = this.container.querySelector('.filtros-busqueda-container');
    const savedPagination = this.container.querySelector('#savedSearchesPagination');
    if (savedList) savedList.style.display = 'none';
    if (filtrosContainer) filtrosContainer.style.display = 'none';
    if (savedPagination) savedPagination.style.display = 'none';

    // Mostrar loading
    this.showLoading();

    // Mostrar grid de resultados y mapa
    const grid = this.container.querySelector('.busquedas-grid');
    if (grid) {
      grid.style.display = 'grid';
    }

    // Ocultar botón "Nueva Búsqueda" y mostrar botones de resultados
    const btnNueva = this.container.querySelector('[data-nueva-busqueda]');
    const btnGuardar = this.container.querySelector('#btnGuardarBusqueda');
    const btnCompartir = this.container.querySelector('#btnCompartirBusqueda');
    const btnVolver = this.container.querySelector('#btnVolverLista');

    if (btnNueva) btnNueva.style.display = 'none';
    if (btnGuardar) btnGuardar.style.display = 'inline-flex';
    if (btnCompartir) btnCompartir.style.display = 'inline-flex';
    if (btnVolver) btnVolver.style.display = 'inline-flex';

    try {
      // Llamar API (endpoint real)
      const response = await fetch(`${API_CONFIG.BASE_URL}/propiedades/buscar-avanzada`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${authService.getToken()}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(filters)
      });

      if (!response.ok) throw new Error('Error en búsqueda');

      const data = await response.json();
      this.currentResults = Array.isArray(data) ? data : (data.data || []);

      console.log(`✅ ${this.currentResults.length} propiedades encontradas`);

      this.currentPage = 1;
      this.totalPages = Math.ceil(this.currentResults.length / this.itemsPerPage);

      this.renderResults();
      this.updateMapMarkers();

      // Poblar contenido de filtros acordeón
      this.renderResumenGenericos();
      this.renderFiltroBasico();
      this.renderFiltroAvanzado();

      // Refrescar mapa
      if (this.map) {
        setTimeout(() => {
          this.map.invalidateSize();
        }, 100);
      }

      showNotification(`✅ Se encontraron ${this.currentResults.length} propiedades`, 'success');

    } catch (error) {
      console.error('❌ Error en búsqueda:', error);
      showNotification('❌ Error al realizar la búsqueda', 'error');
      this.showEmptyState();
    }
  }

  /**
   * Volver a la lista de búsquedas guardadas
   */
  volverALista() {
    console.log('⬅️ Volviendo a lista de búsquedas...');

    // Ocultar grid de resultados
    const grid = this.container.querySelector('.busquedas-grid');
    if (grid) grid.style.display = 'none';

    // Mostrar botón "Nueva Búsqueda" y ocultar botones de resultados
    const btnNueva = this.container.querySelector('[data-nueva-busqueda]');
    const btnGuardar = this.container.querySelector('#btnGuardarBusqueda');
    const btnCompartir = this.container.querySelector('#btnCompartirBusqueda');
    const btnVolver = this.container.querySelector('#btnVolverLista');

    if (btnNueva) btnNueva.style.display = 'inline-flex';
    if (btnGuardar) btnGuardar.style.display = 'none';
    if (btnCompartir) btnCompartir.style.display = 'none';
    if (btnVolver) btnVolver.style.display = 'none';

    // Mostrar lista de búsquedas, filtros y paginación
    const savedList = this.container.querySelector('#savedSearchesList');
    const filtrosContainer = this.container.querySelector('.filtros-busqueda-container');
    const savedPagination = this.container.querySelector('#savedSearchesPagination');
    if (savedList) savedList.style.display = 'block';
    if (filtrosContainer) filtrosContainer.style.display = 'block';
    if (savedPagination) savedPagination.style.display = 'block';

    // Scroll suave al inicio
    if (savedList) {
      savedList.scrollIntoView({
        behavior: 'smooth',
        block: 'start'
      });
    }
  }

  /**
   * Renderizar resumen de Filtros Genéricos
   */
  renderResumenGenericos() {
    const container = this.container.querySelector('#resumenGenericos');
    if (!container || !this.currentFilters) return;

    const filters = this.currentFilters;
    const tipoInmueble = filters.tipo_inmueble_nombre || filters.tipo_inmueble_id || 'Todos';
    const distrito = filters.distrito_nombre || filters.distrito_ids?.join(', ') || 'Todos';
    const transaccion = filters.transaccion === 'compra' ? 'Compra' : filters.transaccion === 'alquiler' ? 'Alquiler' : 'Todas';
    const area = filters.area ? `${filters.area} m²` : 'Sin especificar';

    let presupuesto = 'Sin especificar';
    if (filters.transaccion === 'compra' && filters.presupuesto_compra) {
      presupuesto = `USD ${this.formatNumber(filters.presupuesto_compra)}`;
    } else if (filters.transaccion === 'alquiler' && filters.presupuesto_alquiler) {
      presupuesto = `USD ${this.formatNumber(filters.presupuesto_alquiler)}/mes`;
    }

    container.innerHTML = `
      <div class="item"><span>Tipo de Inmueble</span><strong>${tipoInmueble}</strong></div>
      <div class="item"><span>Distrito</span><strong>${distrito}</strong></div>
      <div class="item"><span>Transacción</span><strong>${transaccion}</strong></div>
      <div class="item"><span>Área</span><strong>${area}</strong></div>
      <div class="item"><span>Presupuesto</span><strong>${presupuesto}</strong></div>
    `;
  }

  /**
   * Renderizar contenido de Filtro Básico
   */
  renderFiltroBasico() {
    const container = this.container.querySelector('#contenedorBasico');
    if (!container) return;

    container.innerHTML = `
      <div class="form-group">
        <label for="filtro_precio">Precio Máximo (USD)</label>
        <input type="number" id="filtro_precio" class="form-control" placeholder="Ej: 500000">
      </div>
      <div class="form-group">
        <label for="filtro_area">Área Mínima (m²)</label>
        <input type="number" id="filtro_area" class="form-control" placeholder="Ej: 300">
      </div>
      <div class="form-group">
        <label for="filtro_parqueos">Parqueos Mínimos</label>
        <input type="number" id="filtro_parqueos" class="form-control" placeholder="Ej: 5">
      </div>
      <p style="font-size: 12px; color: #6b7280; margin-top: 12px;">
        💡 Los filtros se aplicarán sobre los resultados actuales
      </p>
    `;
  }

  /**
   * Renderizar contenido de Filtros Avanzados
   */
  async renderFiltroAvanzado() {
    const container = this.container.querySelector('#contenedorAvanzado');
    if (!container) return;

    container.innerHTML = '<div class="loading-mini">Cargando filtros...</div>';

    try {
      // Cargar filtros avanzados del API
      const response = await fetch(`${API_CONFIG.BASE_URL}/filtros-avanzados`, {
        headers: {
          'Authorization': `Bearer ${authService.getToken()}`
        }
      });

      if (!response.ok) throw new Error('Error cargando filtros');

      const filtros = await response.json();

      // Renderizar acordeón de filtros
      let html = '<div class="filtros-avanzados-accordion">';

      // Áreas Comunes del Edificio
      if (filtros.areas_comunes && filtros.areas_comunes.length > 0) {
        html += this.renderFiltroSeccion('areas_comunes', 'Áreas Comunes del Edificio', 'fa-building', filtros.areas_comunes);
      }

      // Ascensores
      if (filtros.ascensores && filtros.ascensores.length > 0) {
        html += this.renderFiltroSeccion('ascensores', 'Ascensores', 'fa-elevator', filtros.ascensores);
      }

      // Implementación Detalle
      if (filtros.implementacion_detalle && filtros.implementacion_detalle.length > 0) {
        html += this.renderFiltroSeccion('implementacion_detalle', 'Implementación Detalle', 'fa-tools', filtros.implementacion_detalle);
      }

      // Soporte del Edificio
      if (filtros.soporte_edificio && filtros.soporte_edificio.length > 0) {
        html += this.renderFiltroSeccion('soporte_edificio', 'Soporte del Edificio', 'fa-hands-helping', filtros.soporte_edificio);
      }

      // Cercanía Estratégica
      if (filtros.cercania_estrategica && filtros.cercania_estrategica.length > 0) {
        html += this.renderFiltroSeccion('cercania_estrategica', 'Cercanía Estratégica', 'fa-map-marked-alt', filtros.cercania_estrategica);
      }

      // Vista de la Oficina
      if (filtros.vista_oficina && filtros.vista_oficina.length > 0) {
        html += this.renderFiltroSeccion('vista_oficina', 'Vista de la Oficina', 'fa-window-maximize', filtros.vista_oficina);
      }

      html += '</div>';
      container.innerHTML = html;

      // Setup acordeón para filtros avanzados
      this.setupFiltrosAvanzadosAccordion();

    } catch (error) {
      console.error('Error cargando filtros avanzados:', error);
      container.innerHTML = `
        <div style="padding: 16px; text-align: center; color: #6b7280;">
          <i class="fas fa-exclamation-circle"></i>
          <p style="margin: 8px 0 0 0; font-size: 13px;">No se pudieron cargar los filtros avanzados</p>
        </div>
      `;
    }
  }

  /**
   * Renderizar sección de filtro avanzado
   */
  renderFiltroSeccion(id, titulo, icon, opciones) {
    return `
      <div class="filtro-avanzado-item">
        <button class="filtro-avanzado-header" type="button" data-filtro="${id}">
          <i class="fas ${icon}" style="color: #E8A317;"></i>
          <span>${titulo}</span>
          <i class="fa-solid fa-chevron-down" style="margin-left: auto; font-size: 12px;"></i>
        </button>
        <div class="filtro-avanzado-content" data-filtro="${id}" style="display: none;">
          ${opciones.map(opt => `
            <label class="filtro-avanzado-option">
              <input type="checkbox" name="${id}" value="${opt.value || opt.id}" data-filtro-avanzado>
              <span>${opt.nombre || opt.label}</span>
            </label>
          `).join('')}
        </div>
      </div>
    `;
  }

  /**
   * Setup acordeón para filtros avanzados
   */
  setupFiltrosAvanzadosAccordion() {
    const headers = this.container.querySelectorAll('.filtro-avanzado-header');
    headers.forEach(header => {
      header.addEventListener('click', (e) => {
        const filtroId = e.currentTarget.getAttribute('data-filtro');
        const content = this.container.querySelector(`.filtro-avanzado-content[data-filtro="${filtroId}"]`);

        if (content) {
          const isVisible = content.style.display === 'block';
          content.style.display = isVisible ? 'none' : 'block';

          // Rotar icono
          const icon = e.currentTarget.querySelector('.fa-chevron-down');
          if (icon) {
            icon.style.transform = isVisible ? 'rotate(0deg)' : 'rotate(180deg)';
          }
        }
      });
    });
  }

  /**
   * Guardar búsqueda actual
   */
  async guardarBusqueda() {
    console.log('💾 Guardando búsqueda...');

    if (!this.currentFilters) {
      showNotification('❌ No hay búsqueda activa para guardar', 'error');
      return;
    }

    try {
      const response = await fetch(`${API_CONFIG.BASE_URL}/busquedas/registrar`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${authService.getToken()}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(this.currentFilters)
      });

      if (!response.ok) throw new Error('Error al guardar búsqueda');

      const data = await response.json();
      showNotification('✅ Búsqueda guardada exitosamente', 'success');

      // Recargar lista de búsquedas guardadas
      await this.loadSavedSearches();

    } catch (error) {
      console.error('❌ Error guardando búsqueda:', error);
      showNotification('❌ Error al guardar la búsqueda', 'error');
    }
  }

  /**
   * Compartir búsqueda actual
   */
  compartirBusqueda() {
    console.log('📤 Compartiendo búsqueda...');

    if (!this.currentFilters) {
      showNotification('❌ No hay búsqueda activa para compartir', 'error');
      return;
    }

    // Crear URL con parámetros de búsqueda
    const params = new URLSearchParams();
    Object.keys(this.currentFilters).forEach(key => {
      if (this.currentFilters[key] !== null && this.currentFilters[key] !== undefined) {
        params.append(key, this.currentFilters[key]);
      }
    });

    const shareUrl = `${window.location.origin}/resultados?${params.toString()}`;

    // Copiar al portapapeles
    navigator.clipboard.writeText(shareUrl).then(() => {
      showNotification('✅ Enlace copiado al portapapeles', 'success');
    }).catch(err => {
      console.error('❌ Error al copiar:', err);
      showNotification('❌ Error al copiar el enlace', 'error');
    });
  }

  /**
   * Renderizar resultados
   */
  renderResults() {
    const container = this.container.querySelector('#searchResults');
    const start = (this.currentPage - 1) * this.itemsPerPage;
    const end = start + this.itemsPerPage;
    const pageResults = this.currentResults.slice(start, end);

    container.innerHTML = pageResults.map((prop, index) => this.renderPropertyCard(prop, start + index + 1)).join('');

    // Actualizar contador
    this.updateResultsCounter();

    // Renderizar paginación
    this.renderPagination();

    // Setup listeners de las tarjetas
    this.setupCardListeners();

    // ✅ Refrescar favoritos en los nuevos cards
    if (window.favoritesHandler) {
      window.favoritesHandler.refreshAllButtons();
    }
  }

  /**
   * Renderizar card de propiedad
   */
  renderPropertyCard(prop, number) {
    const propId = prop.registro_cab_id || prop.id;
    const isFavorite = window.favoritesHandler?.isFavorite(propId);

    // Procesar imágenes - convertir a array si es necesario
    let imagenes = [];
    if (Array.isArray(prop.imagenes)) {
      imagenes = prop.imagenes.map(img => {
        if (typeof img === 'string') return img;
        if (img.url) return img.url;
        return null;
      }).filter(Boolean);
    }

    // Imagen por defecto si no hay imágenes
    if (imagenes.length === 0) {
      imagenes = ['assets/images/no-image.jpg'];
    }

    return `
      <div class="property-card" data-property-id="${propId}" data-property-number="${number}">
        <div class="property-number">${number}</div>

        <!-- ❤️ Botón de Favorito -->
        <button class="favorite-btn-float ${isFavorite ? 'is-favorite' : ''}"
                data-favorite-property="${propId}"
                title="${isFavorite ? 'Quitar de favoritos' : 'Agregar a favoritos'}"
                style="position: absolute; top: 10px; right: 10px; background: white; border: 2px solid #333; width: 36px; height: 36px; border-radius: 50%; cursor: pointer; z-index: 30; display: flex; align-items: center; justify-content: center; font-size: 1.5rem; transition: all 0.3s; box-shadow: 0 2px 8px rgba(0,0,0,0.2);">
          ${isFavorite ? '♥' : '♡'}
        </button>

        <div class="property-image-carousel">
          <div class="carousel-images" data-current="0">
            ${imagenes.map((img, i) => `
              <img src="${img}" alt="${prop.titulo || 'Propiedad'} - imagen ${i + 1}" class="carousel-image ${i === 0 ? 'active' : ''}" data-index="${i}">
            `).join('')}
          </div>
          ${imagenes.length > 1 ? `
            <button class="carousel-prev" data-property-id="${propId}">‹</button>
            <button class="carousel-next" data-property-id="${propId}">›</button>
            <div class="carousel-indicators">
              ${imagenes.map((_, i) => `
                <span class="indicator ${i === 0 ? 'active' : ''}" data-index="${i}"></span>
              `).join('')}
            </div>
          ` : ''}
        </div>

        <div class="property-info">
          <div class="property-header-info">
            <h3 class="property-title">${prop.titulo || 'Sin título'}</h3>
            ${prop.codigo ? `<span class="property-code">Código: ${prop.codigo}</span>` : ''}
          </div>

          ${prop.tipo_inmueble || prop.tipo_inmueble_nombre ? `
            <div class="property-type">
              <i class="fas fa-building"></i> ${prop.tipo_inmueble_nombre || prop.tipo_inmueble}
            </div>
          ` : ''}

          <div class="property-location">
            <i class="fas fa-map-marker-alt"></i> ${prop.direccion || prop.distrito || 'Ubicación no especificada'}
          </div>

          <div class="property-price">${this.renderPrecio(prop)}</div>

          <div class="property-features">
            ${prop.area ? `<span class="feature"><i class="fas fa-ruler-combined"></i> ${prop.area} m²</span>` : ''}
            ${prop.dormitorios ? `<span class="feature"><i class="fas fa-bed"></i> ${prop.dormitorios} dorm.</span>` : ''}
            ${prop.banos ? `<span class="feature"><i class="fas fa-bath"></i> ${prop.banos} baños</span>` : ''}
            ${prop.parqueos ? `<span class="feature"><i class="fas fa-car"></i> ${prop.parqueos} parqueos</span>` : ''}
            ${prop.antiguedad ? `<span class="feature"><i class="fas fa-clock"></i> ${prop.antiguedad} años</span>` : ''}
            ${prop.pisos ? `<span class="feature"><i class="fas fa-layer-group"></i> ${prop.pisos} pisos</span>` : ''}
            ${prop.implementacion ? `<span class="feature"><i class="fas fa-tools"></i> ${prop.implementacion}</span>` : ''}
          </div>

          ${prop.descripcion ? `
            <p class="property-description">${prop.descripcion}</p>
          ` : ''}

          <!-- Información de Contacto -->
          ${this.app.currentUser ? `
            <div class="property-contact">
              <div class="contact-title">
                <i class="fas fa-address-card"></i> Información de Contacto
              </div>
              <div class="contact-items">
                ${prop.telefono || prop.celular ? `
                  <div class="contact-item">
                    <i class="fas fa-phone"></i> ${prop.telefono || prop.celular}
                  </div>
                ` : ''}
                ${prop.email ? `
                  <div class="contact-item">
                    <i class="fas fa-envelope"></i> ${prop.email}
                  </div>
                ` : ''}
                ${!prop.telefono && !prop.celular && !prop.email ? `
                  <div class="contact-item">
                    <i class="fas fa-phone"></i> +51 999 457 538
                  </div>
                  <div class="contact-item">
                    <i class="fas fa-envelope"></i> info@quadrante.pe
                  </div>
                ` : ''}
              </div>
            </div>
          ` : `
            <div class="contact-locked">
              <i class="fas fa-lock"></i>
              <span>Inicia sesión para ver información de contacto</span>
            </div>
          `}
        </div>
      </div>
    `;
  }

  /**
   * Renderizar precio
   */
  renderPrecio(prop) {
    let html = '';
    if (prop.precio_venta && prop.precio_venta > 0) {
      html += `<span class="price-tag">💰 Venta: USD ${this.formatNumber(prop.precio_venta)}</span>`;
    }
    if (prop.precio_alquiler && prop.precio_alquiler > 0) {
      if (html) html += ' ';
      html += `<span class="price-tag">💰 Alquiler: USD ${this.formatNumber(prop.precio_alquiler)}/mes</span>`;
    }
    // Fallback por si los campos tienen otros nombres
    if (!html && prop.precio_compra && prop.precio_compra > 0) {
      html = `<span class="price-tag">💰 Venta: USD ${this.formatNumber(prop.precio_compra)}</span>`;
    }
    if (!html && prop.precio) {
      html = `<span class="price-tag">USD ${this.formatNumber(prop.precio)}</span>`;
    }
    return html || 'Precio no disponible';
  }

  /**
   * Setup listeners para las tarjetas
   */
  setupCardListeners() {
    // Hover y Click en tarjeta para resaltar en mapa
    this.container.querySelectorAll('.property-card').forEach(card => {
      // Hover para resaltar
      card.addEventListener('mouseenter', (e) => {
        const propertyNumber = card.dataset.propertyNumber;
        this.highlightMarker(parseInt(propertyNumber), true);
      });

      // Click en tarjeta
      card.addEventListener('click', (e) => {
        // Evitar si se hizo click en botón de favorito o carrusel
        if (e.target.closest('.favorite-btn-float') || e.target.closest('.carousel-prev') || e.target.closest('.carousel-next')) {
          return;
        }

        const propertyId = card.dataset.propertyId;
        const propertyNumber = card.dataset.propertyNumber;

        // Resaltar tarjeta
        this.container.querySelectorAll('.property-card').forEach(c => c.classList.remove('selected'));
        card.classList.add('selected');

        // Resaltar marcador en mapa en amarillo (permanente)
        this.highlightMarker(parseInt(propertyNumber), false);
      });
    });

    // Navegación de carrusel
    this.container.querySelectorAll('.carousel-prev, .carousel-next').forEach(btn => {
      btn.addEventListener('click', (e) => {
        e.stopPropagation();
        const direction = btn.classList.contains('carousel-prev') ? 'prev' : 'next';
        const carousel = btn.closest('.property-image-carousel');
        this.navigateCarouselNew(carousel, direction);
      });
    });

    // Indicadores de carrusel
    this.container.querySelectorAll('.carousel-indicators .indicator').forEach(indicator => {
      indicator.addEventListener('click', (e) => {
        e.stopPropagation();
        const index = parseInt(indicator.dataset.index);
        const carousel = indicator.closest('.property-image-carousel');
        this.goToSlide(carousel, index);
      });
    });
  }

  /**
   * Navegar carrusel (nuevo estilo)
   */
  navigateCarouselNew(carousel, direction) {
    const images = carousel.querySelectorAll('.carousel-image');
    const indicators = carousel.querySelectorAll('.indicator');
    const currentIndex = parseInt(carousel.querySelector('.carousel-images').dataset.current);

    let nextIndex;
    if (direction === 'next') {
      nextIndex = (currentIndex + 1) % images.length;
    } else {
      nextIndex = (currentIndex - 1 + images.length) % images.length;
    }

    // Actualizar imágenes
    images.forEach((img, i) => {
      img.classList.toggle('active', i === nextIndex);
    });

    // Actualizar indicadores
    indicators.forEach((ind, i) => {
      ind.classList.toggle('active', i === nextIndex);
    });

    // Guardar índice actual
    carousel.querySelector('.carousel-images').dataset.current = nextIndex;
  }

  /**
   * Ir a slide específico
   */
  goToSlide(carousel, index) {
    const images = carousel.querySelectorAll('.carousel-image');
    const indicators = carousel.querySelectorAll('.indicator');

    images.forEach((img, i) => {
      img.classList.toggle('active', i === index);
    });

    indicators.forEach((ind, i) => {
      ind.classList.toggle('active', i === index);
    });

    carousel.querySelector('.carousel-images').dataset.current = index;
  }

  /**
   * Resaltar marcador en mapa
   */
  highlightMarker(number, isHover = false) {
    // Remover resaltado de todos los marcadores
    this.container.querySelectorAll('.custom-number-marker > div').forEach(markerDiv => {
      markerDiv.style.transform = 'scale(1)';
      markerDiv.style.zIndex = '1000';
      markerDiv.style.background = '#2C5282'; // Azul por defecto
    });

    // Resaltar el marcador correspondiente
    const markers = this.container.querySelectorAll('.custom-number-marker > div');
    markers.forEach(markerDiv => {
      const markerText = markerDiv.textContent.trim();
      if (parseInt(markerText) === number) {
        if (isHover) {
          // Hover: solo hacer más grande
          markerDiv.style.transform = 'scale(1.3)';
          markerDiv.style.zIndex = '2000';
        } else {
          // Click: pintar de amarillo y hacer más grande
          markerDiv.style.transform = 'scale(1.4)';
          markerDiv.style.zIndex = '3000';
          markerDiv.style.background = '#E8A317'; // Amarillo
          markerDiv.style.boxShadow = '0 4px 12px rgba(232, 163, 23, 0.6)';
        }
      }
    });
  }

  /**
   * Actualizar contador
   */
  updateResultsCounter() {
    const counter = this.container.querySelector('#resultsCounter');
    const start = (this.currentPage - 1) * this.itemsPerPage + 1;
    const end = Math.min(start + this.itemsPerPage - 1, this.currentResults.length);

    counter.textContent = `Mostrando ${start}-${end} de ${this.currentResults.length} resultados`;
  }

  /**
   * Renderizar paginación
   */
  renderPagination() {
    const container = this.container.querySelector('#searchPagination');

    if (this.totalPages <= 1) {
      container.innerHTML = '';
      return;
    }

    let html = '<div class="pagination">';

    // Botón Anterior
    html += `
      <button class="pagination-btn" ${this.currentPage === 1 ? 'disabled' : ''} data-page-action="prev">
        ← Anterior
      </button>
    `;

    // Páginas
    const maxVisible = 5;
    let startPage = Math.max(1, this.currentPage - Math.floor(maxVisible / 2));
    let endPage = Math.min(this.totalPages, startPage + maxVisible - 1);

    if (endPage - startPage < maxVisible - 1) {
      startPage = Math.max(1, endPage - maxVisible + 1);
    }

    if (startPage > 1) {
      html += `<button class="pagination-number" data-page="1">1</button>`;
      if (startPage > 2) html += `<span class="pagination-ellipsis">...</span>`;
    }

    for (let i = startPage; i <= endPage; i++) {
      html += `
        <button class="pagination-number ${i === this.currentPage ? 'active' : ''}" data-page="${i}">
          ${i}
        </button>
      `;
    }

    if (endPage < this.totalPages) {
      if (endPage < this.totalPages - 1) html += `<span class="pagination-ellipsis">...</span>`;
      html += `<button class="pagination-number" data-page="${this.totalPages}">${this.totalPages}</button>`;
    }

    // Botón Siguiente
    html += `
      <button class="pagination-btn" ${this.currentPage === this.totalPages ? 'disabled' : ''} data-page-action="next">
        Siguiente →
      </button>
    `;

    html += '</div>';
    container.innerHTML = html;
  }

  /**
   * Actualizar marcadores del mapa
   */
  updateMapMarkers() {
    if (!this.map) return;

    // Limpiar marcadores
    this.mapMarkers.forEach(m => m.remove());
    this.mapMarkers = [];

    // Agregar nuevos marcadores con números
    const start = (this.currentPage - 1) * this.itemsPerPage;
    this.currentResults.slice(start, start + this.itemsPerPage).forEach((prop, index) => {
      if (prop.latitud && prop.longitud) {
        const number = start + index + 1;

        // Agregar offset aleatorio para evitar solapamiento de marcadores
        let lat = parseFloat(prop.latitud);
        let lng = parseFloat(prop.longitud);
        lat += (Math.random() - 0.5) * 0.002; // ±0.001 grados
        lng += (Math.random() - 0.5) * 0.002; // ±0.001 grados

        // Crear icono de marcador numerado
        const numberIcon = L.divIcon({
          className: 'custom-number-marker',
          html: `
            <div style="
              background: #2C5282;
              color: white;
              width: 36px;
              height: 36px;
              border-radius: 50%;
              display: flex;
              align-items: center;
              justify-content: center;
              font-weight: 700;
              font-size: 16px;
              border: 3px solid white;
              box-shadow: 0 2px 8px rgba(0, 0, 0, 0.4);
            ">
              ${number}
            </div>
          `,
          iconSize: [36, 36],
          iconAnchor: [18, 18],
          popupAnchor: [0, -18]
        });

        const marker = L.marker([lat, lng], { icon: numberIcon }).addTo(this.map);

        // Preparar precio para popup
        let precioPopup = 'N/A';
        if (prop.precio_venta) {
          precioPopup = `USD ${this.formatNumber(prop.precio_venta)}`;
        } else if (prop.precio_alquiler) {
          precioPopup = `USD ${this.formatNumber(prop.precio_alquiler)}/mes`;
        } else if (prop.precio) {
          precioPopup = `USD ${this.formatNumber(prop.precio)}`;
        }

        marker.bindPopup(`
          <div style="min-width: 200px;">
            <strong style="color: #2C5282;">#${number} - ${prop.codigo || 'N/A'}</strong><br>
            <div style="margin-top: 8px;">${prop.titulo || 'Sin título'}</div>
            <div style="margin-top: 4px; color: #6b7280; font-size: 13px;">📍 ${prop.direccion || prop.distrito || 'N/A'}</div>
            <div style="margin-top: 4px; font-weight: 600; color: #E8A317;">${precioPopup}</div>
            ${prop.area ? `<div style="margin-top: 4px; font-size: 13px;">📐 ${prop.area} m²</div>` : ''}
          </div>
        `);

        this.mapMarkers.push(marker);
      }
    });

    // Ajustar vista
    if (this.mapMarkers.length > 0) {
      const group = L.featureGroup(this.mapMarkers);
      this.map.fitBounds(group.getBounds(), { padding: [50, 50], maxZoom: 15 });
    }
  }

  /**
   * Guardar búsqueda
   */
  async guardarBusqueda() {
    const { value: nombre } = await Swal.fire({
      title: 'Guardar Búsqueda',
      input: 'text',
      inputPlaceholder: 'Nombre de la búsqueda',
      showCancelButton: true,
      confirmButtonText: 'Guardar',
      confirmButtonColor: '#2C5282'
    });

    if (!nombre) return;

    try {
      const response = await fetch(`${API_CONFIG.BASE_URL}/api/v1/busquedas/guardadas`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${authService.getToken()}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          nombre,
          criterios: this.currentFilters, // El endpoint usa 'criterios' no 'filtros'
          activa: true
        })
      });

      if (!response.ok) throw new Error('Error al guardar');

      const saved = await response.json();
      this.currentSearchId = saved.id;

      showNotification('✅ Búsqueda guardada correctamente', 'success');
    } catch (error) {
      console.error('❌ Error guardando búsqueda:', error);
      showNotification('❌ Error al guardar búsqueda', 'error');
    }
  }

  /**
   * Compartir por correo
   */
  async compartirPorCorreo() {
    // Cerrar dropdown
    document.getElementById('compartirDropdown').classList.remove('active');

    if (this.selectedProperties.size === 0) {
      showNotification('⚠️ Selecciona al menos una propiedad', 'warning');
      return;
    }

    // Limitar a máximo 4 propiedades
    if (this.selectedProperties.size > 4) {
      showNotification('⚠️ Máximo 4 propiedades por correo', 'warning');
      return;
    }

    // Formulario de correo con SweetAlert2
    const { value: formData } = await Swal.fire({
      title: '📧 Enviar por Correo',
      html: `
        <div style="text-align: left;">
          <div style="margin-bottom: 15px;">
            <label style="display: block; margin-bottom: 5px; font-weight: 600;">Correo destinatario *</label>
            <input type="email" id="emailTo" class="swal2-input" placeholder="correo@ejemplo.com" style="margin: 0; width: 100%;">
          </div>
          <div style="margin-bottom: 15px;">
            <label style="display: block; margin-bottom: 5px; font-weight: 600;">Asunto</label>
            <input type="text" id="emailSubject" class="swal2-input" value="Propiedades Quadrante" style="margin: 0; width: 100%;">
          </div>
          <div style="margin-bottom: 15px;">
            <label style="display: block; margin-bottom: 5px; font-weight: 600;">Mensaje</label>
            <textarea id="emailMessage" class="swal2-textarea" rows="4" placeholder="Mensaje personalizado..." style="width: 100%;"></textarea>
          </div>
          <div>
            <label style="display: flex; align-items: center; gap: 8px; cursor: pointer;">
              <input type="checkbox" id="emailCopy">
              <span>Enviarme una copia</span>
            </label>
          </div>
        </div>
      `,
      width: '600px',
      showCancelButton: true,
      confirmButtonText: 'Enviar',
      cancelButtonText: 'Cancelar',
      confirmButtonColor: '#2C5282',
      preConfirm: () => {
        const email = document.getElementById('emailTo').value;
        if (!email) {
          Swal.showValidationMessage('Ingresa un correo electrónico');
          return false;
        }
        if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
          Swal.showValidationMessage('Correo electrónico inválido');
          return false;
        }
        return {
          to: email,
          subject: document.getElementById('emailSubject').value || 'Propiedades Quadrante',
          message: document.getElementById('emailMessage').value || '',
          sendCopy: document.getElementById('emailCopy').checked
        };
      }
    });

    if (!formData) return;

    // Mostrar loading
    Swal.fire({
      title: 'Enviando...',
      html: 'Generando fichas PDF y enviando correo',
      allowOutsideClick: false,
      didOpen: () => {
        Swal.showLoading();
      }
    });

    try {
      // Enviar IDs al backend - el backend genera los PDFs
      const response = await fetch(`${API_CONFIG.BASE_URL}/api/v1/emails/enviar-fichas`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${authService.getToken()}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          to_email: formData.to,
          subject: formData.subject,
          message: formData.message,
          propiedad_ids: Array.from(this.selectedProperties),
          send_copy: formData.sendCopy
        })
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.detail || 'Error al enviar correo');
      }

      const result = await response.json();

      Swal.fire({
        icon: 'success',
        title: '✅ Correo enviado',
        text: `${result.propiedades_enviadas} fichas enviadas a ${result.destinatario}`,
        confirmButtonColor: '#2C5282'
      });

    } catch (error) {
      console.error('❌ Error enviando correo:', error);
      Swal.fire({
        icon: 'error',
        title: 'Error',
        text: error.message || 'No se pudo enviar el correo. Intenta nuevamente.',
        confirmButtonColor: '#2C5282'
      });
    }
  }

  /**
   * Compartir por WhatsApp
   */
  async compartirPorWhatsApp() {
    // Cerrar dropdown
    document.getElementById('compartirDropdown').classList.remove('active');

    if (this.selectedProperties.size === 0) {
      showNotification('⚠️ Selecciona al menos una propiedad', 'warning');
      return;
    }

    // Construir mensaje
    const selectedProps = this.currentResults.filter(p => this.selectedProperties.has(p.id));
    let mensaje = `🏢 *Propiedades Quadrante*\n\n`;
    selectedProps.forEach(p => {
      mensaje += `📍 *${p.codigo}* - ${p.titulo}\n`;
      mensaje += `   💰 $${this.formatNumber(p.precio)}\n`;
      mensaje += `   📐 ${p.area}m² - ${p.distrito}\n\n`;
    });

    // Abrir WhatsApp
    const url = `https://wa.me/?text=${encodeURIComponent(mensaje)}`;
    window.open(url, '_blank');
  }

  /**
   * Ir a página específica
   */
  goToPage(page) {
    if (page < 1 || page > this.totalPages) return;
    this.currentPage = page;
    this.renderResults();

    // Scroll suave al inicio de resultados
    this.container.querySelector('#searchResults').scrollIntoView({
      behavior: 'smooth',
      block: 'start'
    });
  }

  /**
   * Generar PDFs para adjuntar en correo
   */
  async generatePDFsForEmail(properties) {
    const pdfs = [];

    for (const prop of properties) {
      try {
        // Crear ficha HTML
        const fichaHTML = await this.createFichaHTML(prop);

        // Convertir a PDF usando jsPDF y html2canvas
        const tempDiv = document.createElement('div');
        tempDiv.innerHTML = fichaHTML;
        tempDiv.style.position = 'absolute';
        tempDiv.style.left = '-9999px';
        document.body.appendChild(tempDiv);

        const canvas = await html2canvas(tempDiv.firstChild, {
          scale: 2,
          useCORS: true,
          allowTaint: true
        });

        document.body.removeChild(tempDiv);

        // Crear PDF
        const { jsPDF } = window.jspdf;
        const pdf = new jsPDF('p', 'mm', 'a4');
        const imgData = canvas.toDataURL('image/jpeg', 0.95);

        const pdfWidth = pdf.internal.pageSize.getWidth();
        const pdfHeight = pdf.internal.pageSize.getHeight();

        pdf.addImage(imgData, 'JPEG', 0, 0, pdfWidth, pdfHeight);

        // Convertir a Base64
        const pdfBase64 = pdf.output('datauristring').split(',')[1];

        pdfs.push({
          filename: `Propiedad_${prop.codigo || prop.id}.pdf`,
          content: pdfBase64,
          encoding: 'base64'
        });

      } catch (error) {
        console.error(`Error generando PDF para ${prop.codigo}:`, error);
      }
    }

    return pdfs;
  }

  /**
   * Crear HTML de ficha profesional
   */
  async createFichaHTML(prop) {
    const imagenes = (prop.imagenes || []).slice(0, 4);
    const logoUrl = 'assets/images/logos/logo.jpg';

    return `
      <div class="pdf-ficha" style="
        width: 210mm;
        min-height: 297mm;
        padding: 20mm;
        background: white;
        font-family: Arial, sans-serif;
        color: #1F2937;
      ">
        <!-- Header con Logo -->
        <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 20px; padding-bottom: 15px; border-bottom: 3px solid #2C5282;">
          <img src="${logoUrl}" alt="Quadrante" style="height: 50px;">
          <div style="text-align: right;">
            <div style="font-size: 24px; font-weight: bold; color: #2C5282;">${prop.codigo || 'N/A'}</div>
            <div style="font-size: 12px; color: #6B7280;">${new Date().toLocaleDateString('es-PE')}</div>
          </div>
        </div>

        <!-- Título y Ubicación -->
        <div style="margin-bottom: 20px;">
          <h1 style="margin: 0 0 10px 0; font-size: 28px; color: #2C5282;">${prop.titulo || 'Sin título'}</h1>
          <div style="font-size: 16px; color: #6B7280;">
            📍 ${prop.direccion || ''}, ${prop.distrito || ''}
          </div>
        </div>

        <!-- Grid de 4 Imágenes -->
        <div style="
          display: grid;
          grid-template-columns: repeat(2, 1fr);
          gap: 10px;
          margin-bottom: 25px;
        ">
          ${imagenes.map(img => `
            <img src="${img.url}" alt="" style="
              width: 100%;
              height: 150px;
              object-fit: cover;
              border-radius: 8px;
            ">
          `).join('')}
          ${Array(4 - imagenes.length).fill('').map(() => `
            <div style="
              width: 100%;
              height: 150px;
              background: #F3F4F6;
              border-radius: 8px;
              display: flex;
              align-items: center;
              justify-content: center;
              color: #9CA3AF;
            ">Sin imagen</div>
          `).join('')}
        </div>

        <!-- Descripción -->
        ${prop.descripcion ? `
          <div style="
            background: #F9FAFB;
            padding: 15px;
            border-radius: 8px;
            margin-bottom: 20px;
            border-left: 4px solid #2C5282;
          ">
            <div style="font-weight: 600; margin-bottom: 8px; color: #2C5282;">Descripción</div>
            <div style="font-size: 14px; line-height: 1.6;">${prop.descripcion}</div>
          </div>
        ` : ''}

        <!-- Grilla de Características -->
        <div style="margin-bottom: 20px;">
          <h3 style="margin: 0 0 15px 0; font-size: 18px; color: #2C5282;">Características Principales</h3>
          <table style="
            width: 100%;
            border-collapse: collapse;
            font-size: 14px;
          ">
            <tr style="background: #F9FAFB;">
              <td style="padding: 12px; border: 1px solid #E5E7EB; font-weight: 600;">Área Total</td>
              <td style="padding: 12px; border: 1px solid #E5E7EB;">${prop.area || 'N/A'} m²</td>
              <td style="padding: 12px; border: 1px solid #E5E7EB; font-weight: 600;">Precio</td>
              <td style="padding: 12px; border: 1px solid #E5E7EB;">$ ${this.formatNumber(prop.precio || 0)}</td>
            </tr>
            <tr>
              <td style="padding: 12px; border: 1px solid #E5E7EB; font-weight: 600;">Dormitorios</td>
              <td style="padding: 12px; border: 1px solid #E5E7EB;">${prop.dormitorios || 'N/A'}</td>
              <td style="padding: 12px; border: 1px solid #E5E7EB; font-weight: 600;">Baños</td>
              <td style="padding: 12px; border: 1px solid #E5E7EB;">${prop.banos || 'N/A'}</td>
            </tr>
            <tr style="background: #F9FAFB;">
              <td style="padding: 12px; border: 1px solid #E5E7EB; font-weight: 600;">Parqueos</td>
              <td style="padding: 12px; border: 1px solid #E5E7EB;">${prop.parqueos || '0'}</td>
              <td style="padding: 12px; border: 1px solid #E5E7EB; font-weight: 600;">Estado</td>
              <td style="padding: 12px; border: 1px solid #E5E7EB;">${prop.estado_nombre || 'N/A'}</td>
            </tr>
            <tr>
              <td style="padding: 12px; border: 1px solid #E5E7EB; font-weight: 600;">Antigüedad</td>
              <td style="padding: 12px; border: 1px solid #E5E7EB;">${prop.antiguedad || 'N/A'} años</td>
              <td style="padding: 12px; border: 1px solid #E5E7EB; font-weight: 600;">Altura</td>
              <td style="padding: 12px; border: 1px solid #E5E7EB;">${prop.altura || 'N/A'}</td>
            </tr>
          </table>
        </div>

        <!-- Servicios y Equipamiento -->
        ${(prop.servicios && prop.servicios.length > 0) ? `
          <div style="margin-bottom: 20px;">
            <h3 style="margin: 0 0 15px 0; font-size: 18px; color: #2C5282;">Servicios y Equipamiento</h3>
            <div style="
              display: grid;
              grid-template-columns: repeat(3, 1fr);
              gap: 10px;
              font-size: 13px;
            ">
              ${prop.servicios.map(s => `
                <div style="padding: 8px; background: #F9FAFB; border-radius: 6px;">
                  ✓ ${s}
                </div>
              `).join('')}
            </div>
          </div>
        ` : ''}

        <!-- Footer -->
        <div style="
          position: absolute;
          bottom: 15mm;
          left: 20mm;
          right: 20mm;
          padding-top: 15px;
          border-top: 2px solid #E5E7EB;
          font-size: 12px;
          color: #6B7280;
          text-align: center;
        ">
          <strong>Quadrante</strong> - Sistema Inmobiliario Profesional<br>
          www.quadrante.com | contacto@quadrante.com
        </div>
      </div>
    `;
  }

  /**
   * Helpers
   */
  formatNumber(num) {
    return new Intl.NumberFormat('en-US').format(num);
  }

  showLoading() {
    const container = this.container.querySelector('#searchResults');
    container.innerHTML = `
      <div class="loading-state">
        <div class="spinner-large"></div>
        <p>Buscando propiedades...</p>
      </div>
    `;
  }

  showEmptyState() {
    const container = this.container.querySelector('#searchResults');
    container.innerHTML = `
      <div class="empty-state">
        <p>No se encontraron propiedades con los criterios seleccionados</p>
      </div>
    `;
  }


  async loadTiposPropiedad() {
    try {
      const response = await fetch(`${API_CONFIG.BASE_URL}/tipos-inmueble`);
      if (!response.ok) throw new Error('Error cargando tipos');
      const data = await response.json();
      return Array.isArray(data) ? data : [];
    } catch (error) {
      console.error('❌ Error cargando tipos de inmueble:', error);
      return [];
    }
  }

  async loadDistritos() {
    try {
      const response = await fetch(`${API_CONFIG.BASE_URL}/distritos`);
      if (!response.ok) throw new Error('Error cargando distritos');
      const data = await response.json();
      // Ordenar alfabéticamente por nombre
      const distritos = Array.isArray(data) ? data : [];
      return distritos.sort((a, b) => a.nombre.localeCompare(b.nombre));
    } catch (error) {
      console.error('❌ Error cargando distritos:', error);
      return [];
    }
  }

  async loadSavedSearches() {
    console.log('📂 Cargando búsquedas guardadas...');

    const container = this.container.querySelector('#savedSearchesList');

    try {
      const isAdmin = this.app.currentUser?.perfil_id === 4;
      let endpoint;

      // Admin ve todas las búsquedas, usuarios normales solo las suyas
      if (isAdmin) {
        endpoint = `${API_CONFIG.BASE_URL}/busquedas/admin/todas?limit=50`;
      } else {
        endpoint = `${API_CONFIG.BASE_URL}/busquedas/guardadas`;
      }

      const response = await fetch(endpoint, {
        headers: {
          'Authorization': `Bearer ${authService.getToken()}`,
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) throw new Error('Error cargando búsquedas');

      const busquedas = await response.json();

      // Guardar búsquedas
      this.allSearches = busquedas;
      this.filteredSearches = [...busquedas];

      console.log(`✅ ${busquedas.length} búsquedas encontradas`);
      console.log('📊 Búsquedas recibidas:', busquedas);

      // Renderizar
      this.renderizarBusquedas();

    } catch (error) {
      console.error('❌ Error cargando búsquedas guardadas:', error);
      const container = this.container.querySelector('#savedSearchesList');
      container.innerHTML = `
        <div class="error-state">
          <p>Error al cargar búsquedas guardadas</p>
        </div>
      `;
    }
  }

  renderizarBusquedas() {
    const container = this.container.querySelector('#savedSearchesList');

    if (this.filteredSearches.length === 0) {
      container.innerHTML = `
        <div class="empty-state">
          <p>No hay búsquedas que coincidan con los filtros</p>
        </div>
      `;
      // Limpiar paginación
      const paginationContainer = this.container.querySelector('#savedSearchesPagination');
      if (paginationContainer) paginationContainer.innerHTML = '';
      return;
    }

    // Calcular paginación
    const totalPages = Math.ceil(this.filteredSearches.length / this.searchesPerPage);
    const start = (this.currentSearchesPage - 1) * this.searchesPerPage;
    const end = start + this.searchesPerPage;
    const pageSearches = this.filteredSearches.slice(start, end);

    container.innerHTML = `
      <h3 style="margin-bottom: 15px;">Búsquedas (${this.filteredSearches.length})</h3>
      <div class="saved-searches-grid">
        ${pageSearches.map((b, index) => this.renderSavedSearchCard(b, start + index)).join('')}
      </div>
    `;

    // Renderizar paginación
    this.renderSearchesPagination(totalPages);
  }

  renderSearchesPagination(totalPages) {
    const container = this.container.querySelector('#savedSearchesPagination');

    if (!container || totalPages <= 1) {
      if (container) container.innerHTML = '';
      return;
    }

    let html = '<div class="pagination">';

    // Botón Anterior
    html += `
      <button class="pagination-btn" ${this.currentSearchesPage === 1 ? 'disabled' : ''} data-searches-page-action="prev">
        ← Anterior
      </button>
    `;

    // Páginas
    const maxVisible = 5;
    let startPage = Math.max(1, this.currentSearchesPage - Math.floor(maxVisible / 2));
    let endPage = Math.min(totalPages, startPage + maxVisible - 1);

    if (endPage - startPage < maxVisible - 1) {
      startPage = Math.max(1, endPage - maxVisible + 1);
    }

    if (startPage > 1) {
      html += `<button class="pagination-number" data-searches-page="1">1</button>`;
      if (startPage > 2) html += `<span class="pagination-ellipsis">...</span>`;
    }

    for (let i = startPage; i <= endPage; i++) {
      html += `
        <button class="pagination-number ${i === this.currentSearchesPage ? 'active' : ''}" data-searches-page="${i}">
          ${i}
        </button>
      `;
    }

    if (endPage < totalPages) {
      if (endPage < totalPages - 1) html += `<span class="pagination-ellipsis">...</span>`;
      html += `<button class="pagination-number" data-searches-page="${totalPages}">${totalPages}</button>`;
    }

    // Botón Siguiente
    html += `
      <button class="pagination-btn" ${this.currentSearchesPage === totalPages ? 'disabled' : ''} data-searches-page-action="next">
        Siguiente →
      </button>
    `;

    html += '</div>';
    container.innerHTML = html;
  }

  aplicarFiltros() {
    const nombreInput = this.container.querySelector('#filtroNombreUsuario');
    const fechaDesdeInput = this.container.querySelector('#filtroFechaDesde');
    const fechaHastaInput = this.container.querySelector('#filtroFechaHasta');

    const nombre = nombreInput?.value.trim().toLowerCase() || '';
    const fechaDesde = fechaDesdeInput?.value || '';
    const fechaHasta = fechaHastaInput?.value || '';

    console.log('🔍 Aplicando filtros:', { nombre, fechaDesde, fechaHasta });

    this.filteredSearches = this.allSearches.filter(busqueda => {
      // Filtro por nombre de usuario
      if (nombre) {
        const nombreUsuario = `${busqueda.usuario?.nombre || ''} ${busqueda.usuario?.apellido || ''}`.toLowerCase();
        if (!nombreUsuario.includes(nombre)) {
          return false;
        }
      }

      // Filtro por fecha desde
      if (fechaDesde) {
        const fechaBusqueda = new Date(busqueda.fecha_busqueda || busqueda.created_at);
        const fechaDesdeObj = new Date(fechaDesde);
        if (fechaBusqueda < fechaDesdeObj) {
          return false;
        }
      }

      // Filtro por fecha hasta
      if (fechaHasta) {
        const fechaBusqueda = new Date(busqueda.fecha_busqueda || busqueda.created_at);
        const fechaHastaObj = new Date(fechaHasta);
        fechaHastaObj.setHours(23, 59, 59, 999); // Incluir todo el día
        if (fechaBusqueda > fechaHastaObj) {
          return false;
        }
      }

      return true;
    });

    // Reiniciar paginación a página 1
    this.currentSearchesPage = 1;

    console.log(`✅ ${this.filteredSearches.length} búsquedas después de filtros`);
    this.renderizarBusquedas();
  }

  limpiarFiltros() {
    // Limpiar inputs
    const nombreInput = this.container.querySelector('#filtroNombreUsuario');
    const fechaDesdeInput = this.container.querySelector('#filtroFechaDesde');
    const fechaHastaInput = this.container.querySelector('#filtroFechaHasta');

    if (nombreInput) nombreInput.value = '';
    if (fechaDesdeInput) fechaDesdeInput.value = '';
    if (fechaHastaInput) fechaHastaInput.value = '';

    // Restaurar todas las búsquedas
    this.filteredSearches = [...this.allSearches];

    // Reiniciar paginación a página 1
    this.currentSearchesPage = 1;

    console.log('🧹 Filtros limpiados');
    this.renderizarBusquedas();
  }

  renderSavedSearchCard(busqueda, index) {
    const criterios = busqueda.criterios_busqueda || busqueda.criterios_json || {};
    const fecha = new Date(busqueda.fecha_busqueda || busqueda.created_at);
    const fechaFormateada = fecha.toLocaleDateString('es-PE', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });

    // Tipo de inmueble
    const tipoInmueble = criterios.tipo_inmueble_nombre || 'Todos';

    // Distritos
    let distritos = 'Todos';
    let distritosNarrativos = 'cualquier distrito';
    if (criterios.distritos_nombres && Array.isArray(criterios.distritos_nombres) && criterios.distritos_nombres.length > 0) {
      const primeros = criterios.distritos_nombres.slice(0, 2).join(', ');
      const extras = criterios.distritos_nombres.length > 2 ? ` (+${criterios.distritos_nombres.length - 2})` : '';
      distritos = primeros + extras;
      distritosNarrativos = criterios.distritos_nombres.join(', ');
    }

    // Rango de precio
    let precio = 'Sin especificar';
    if (criterios.precio_min && criterios.precio_max) {
      precio = `S/ ${criterios.precio_min.toLocaleString()} - S/ ${criterios.precio_max.toLocaleString()}`;
    } else if (criterios.precio_max) {
      precio = `Hasta S/ ${criterios.precio_max.toLocaleString()}`;
    }

    const usuario = busqueda.usuario || {};

    // Crear descripción narrativa
    let narrativa = `Búsqueda de ${criterios.transaccion === 'alquiler' ? 'alquiler' : 'compra'} de ${tipoInmueble.toLowerCase()} en ${distritosNarrativos}`;

    // Agregar detalles adicionales
    let detalles = [];
    if (criterios.area_min) detalles.push(`mínimo ${criterios.area_min}m²`);
    if (criterios.habitaciones_min) detalles.push(`${criterios.habitaciones_min}+ habitaciones`);
    if (criterios.banos_min) detalles.push(`${criterios.banos_min}+ baños`);
    if (criterios.parqueos_min) detalles.push(`${criterios.parqueos_min}+ parqueos`);

    if (detalles.length > 0) {
      narrativa += ` con las siguientes características: ${detalles.join(', ')}`;
    }

    if (criterios.precio_max) {
      narrativa += `. Presupuesto: ${precio}`;
    }

    return `
      <div style="background: white; border-radius: var(--radius-lg); padding: var(--spacing-lg); box-shadow: var(--shadow-sm); border-left: 4px solid var(--azul-corporativo); transition: var(--transition-normal); cursor: pointer;"
           onmouseenter="this.style.boxShadow='var(--shadow-md)'; this.style.transform='translateY(-2px)';"
           onmouseleave="this.style.boxShadow='var(--shadow-sm)'; this.style.transform='translateY(0)';"
           data-busqueda-id="${busqueda.busqueda_id}">

        <!-- Header -->
        <div style="display: flex; justify-content: space-between; align-items: start; margin-bottom: var(--spacing-md);">
          <div>
            <h3 style="color: var(--azul-corporativo); margin: 0 0 var(--spacing-xs) 0; font-size: 1.1rem;">
              ${busqueda.busqueda_id || index + 1}
            </h3>
            <p style="color: var(--gris-medio); margin: 0; font-size: var(--font-size-small);">
              📅 ${fechaFormateada}
            </p>
          </div>
          <div style="text-align: right;">
            <div style="display: flex; flex-direction: column; gap: var(--spacing-xs); align-items: flex-end;">
              <span style="display: inline-block; padding: var(--spacing-xs) var(--spacing-sm); background: rgba(0, 102, 204, 0.1); color: var(--azul-corporativo); border-radius: var(--radius-sm); font-size: var(--font-size-small); font-weight: 600;">
                👤 ${usuario.nombre || 'N/A'} ${usuario.apellido || ''}
              </span>
              ${usuario.email ? `
                <span style="color: var(--gris-medio); font-size: 0.8rem;">
                  📧 ${usuario.email}
                </span>
              ` : ''}
              ${usuario.telefono ? `
                <span style="color: var(--gris-medio); font-size: 0.8rem;">
                  📱 ${usuario.telefono}
                </span>
              ` : ''}
            </div>
          </div>
        </div>

        <!-- Descripción Narrativa -->
        <div style="background: rgba(0, 102, 204, 0.05); padding: var(--spacing-md); border-radius: var(--radius-md); margin-bottom: var(--spacing-md); border-left: 3px solid var(--azul-corporativo);">
          <p style="margin: 0; color: var(--gris-oscuro); font-size: 0.9rem; line-height: 1.6; font-style: italic;">
            ${narrativa}
          </p>
        </div>

        <!-- Criterios -->
        <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: var(--spacing-sm); margin-bottom: var(--spacing-md);">
          <div>
            <span style="color: var(--gris-medio); font-size: var(--font-size-small);">Transacción:</span>
            <strong style="color: var(--gris-oscuro); display: block;">
              ${criterios.transaccion === 'alquiler' ? '🏠 Alquiler' : '💰 Compra'}
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
            ${busqueda.sesion_id || busqueda.alerta_activa ? '🔔 Alerta activa' : 'Sin sesión'}
          </span>
        </div>
      </div>
    `;
  }

  async ejecutarBusquedaGuardada(busquedaId) {
    console.log(`🔍 Ejecutando búsqueda guardada: ${busquedaId}`);

    try {
      // Obtener datos de la búsqueda guardada
      const isAdmin = this.app.currentUser?.perfil_id === 4;
      let endpoint;

      if (isAdmin) {
        endpoint = `${API_CONFIG.BASE_URL}/busquedas/admin/todas?limit=50`;
      } else {
        endpoint = `${API_CONFIG.BASE_URL}/busquedas/guardadas`;
      }

      const response = await fetch(endpoint, {
        headers: {
          'Authorization': `Bearer ${authService.getToken()}`,
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) throw new Error('Error obteniendo búsqueda');

      const busquedas = await response.json();
      const busqueda = busquedas.find(b => b.busqueda_id === busquedaId);

      if (!busqueda) {
        showNotification('❌ Búsqueda no encontrada', 'error');
        return;
      }

      // Ejecutar búsqueda con los criterios guardados
      await this.executeSearch(busqueda.criterios_json);

    } catch (error) {
      console.error('❌ Error ejecutando búsqueda guardada:', error);
      showNotification('❌ Error al ejecutar búsqueda', 'error');
    }
  }
}

// Exponer globalmente
window.BusquedasTab = BusquedasTab;

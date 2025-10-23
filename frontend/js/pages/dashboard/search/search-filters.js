/**
 * 🔍 Search Filters Module
 * Filtros de búsqueda: Genéricos, Básico, Avanzado
 * Diseño: Replicado de resultados.html
 */

class SearchFiltersModule {
  constructor(searchController) {
    this.searchController = searchController;

    // Datos para filtros
    this.tiposInmuebles = [];
    this.distritos = [];
    this.caracteristicas = [];
    this.configFiltros = null;

    // Filtros actuales
    this.filtros = {
      genericos: {
        tipo_inmueble_id: null,
        distrito_id: null,
        distritos_ids: [],
        transaccion: null
      },
      basico: {
        precio_min: null,
        precio_max: null,
        area_min: null,
        area_max: null,
        habitaciones: null,
        banos: null,
        parqueos: null
      },
      avanzado: {
        caracteristicas: []
      }
    };

    window.searchFiltersModule = this;
  }

  /**
   * Renderizar módulo de filtros
   */
  async render() {
    console.log('🎨 SearchFiltersModule.render() called');

    try {
      // Cargar datos necesarios
      await this.loadFilterData();

      return `
        <div class="filters-inner">
          <!-- Filtros Genéricos -->
          <div class="accordion-item">
            <button class="accordion-header" type="button" data-accordion="genericos" aria-expanded="true">
              <i class="fa-solid fa-filter"></i>
              <span>Filtros Genéricos</span>
              <i class="fa-solid fa-chevron-down accordion-arrow"></i>
            </button>
            <div class="accordion-content open" data-accordion="genericos">
              ${this.renderFiltrosGenericos()}
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
              ${this.renderFiltroBasico()}
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
              ${this.renderFiltrosAvanzados()}
            </div>
          </div>
        </div>

        <!-- Acciones -->
        <div class="filters-actions">
          <button id="btnAplicarFiltros" class="btn btn-primary btn-sm">
            <i class="fa-solid fa-check"></i> Aplicar
          </button>
          <button id="btnLimpiarFiltros" class="btn btn-outline btn-sm">
            <i class="fa-solid fa-eraser"></i> Limpiar
          </button>
        </div>
      `;

    } catch (error) {
      console.error('❌ Error en SearchFiltersModule.render():', error);
      return `<div class="empty-state"><p>Error al cargar filtros</p></div>`;
    }
  }

  /**
   * Renderizar filtros genéricos
   */
  renderFiltrosGenericos() {
    return `
      <div class="resumen-genericos">
        <!-- Tipo de Inmueble -->
        <div class="filter-group">
          <label for="tipoInmuebleFilter">Tipo de Inmueble</label>
          <select id="tipoInmuebleFilter" class="form-control">
            <option value="">Todos</option>
            ${this.tiposInmuebles.map(tipo => `
              <option value="${tipo.tipo_inmueble_id}">${tipo.nombre}</option>
            `).join('')}
          </select>
        </div>

        <!-- Distritos (Multi-select) -->
        <div class="filter-group">
          <label for="distritosFilter">Distritos</label>
          <div class="multi-select-container">
            <button type="button" class="multi-select-trigger" id="distritosFilterTrigger">
              <span id="distritosFilterSelected">Todos los distritos</span>
              <i class="fa-solid fa-chevron-down"></i>
            </button>
            <div class="multi-select-dropdown" id="distritosFilterDropdown" style="display: none;">
              <div class="multi-select-search">
                <input type="text" id="distritosFilterSearch" placeholder="Buscar distrito..." class="form-control form-control-sm">
              </div>
              <div class="multi-select-options">
                ${this.distritos.map(distrito => `
                  <label class="multi-select-option">
                    <input type="checkbox" value="${distrito.distrito_id}" data-nombre="${distrito.nombre}">
                    <span>${distrito.nombre}</span>
                  </label>
                `).join('')}
              </div>
              <div class="multi-select-actions">
                <button type="button" class="btn btn-sm btn-outline" onclick="window.searchFiltersModule.clearDistritosSelection()">Limpiar</button>
                <button type="button" class="btn btn-sm btn-primary" onclick="window.searchFiltersModule.closeDistritosDropdown()">Cerrar</button>
              </div>
            </div>
          </div>
        </div>

        <!-- Transacción -->
        <div class="filter-group">
          <label for="transaccionFilter">Transacción</label>
          <select id="transaccionFilter" class="form-control">
            <option value="">Todas</option>
            <option value="compra">Compra</option>
            <option value="alquiler">Alquiler</option>
          </select>
        </div>
      </div>
    `;
  }

  /**
   * Renderizar filtro básico
   */
  renderFiltroBasico() {
    return `
      <div class="contenedor-basico">
        <!-- Precio -->
        <div class="filter-group">
          <label>Precio (USD)</label>
          <div class="filter-row">
            <input type="number" id="precioMinFilter" class="form-control" placeholder="Mín" min="0">
            <span class="filter-separator">-</span>
            <input type="number" id="precioMaxFilter" class="form-control" placeholder="Máx" min="0">
          </div>
        </div>

        <!-- Área -->
        <div class="filter-group">
          <label>Área (m²)</label>
          <div class="filter-row">
            <input type="number" id="areaMinFilter" class="form-control" placeholder="Mín" min="0">
            <span class="filter-separator">-</span>
            <input type="number" id="areaMaxFilter" class="form-control" placeholder="Máx" min="0">
          </div>
        </div>

        <!-- Habitaciones -->
        <div class="filter-group">
          <label for="habitacionesFilter">Habitaciones</label>
          <select id="habitacionesFilter" class="form-control">
            <option value="">Todas</option>
            <option value="1">1</option>
            <option value="2">2</option>
            <option value="3">3</option>
            <option value="4">4</option>
            <option value="5">5+</option>
          </select>
        </div>

        <!-- Baños -->
        <div class="filter-group">
          <label for="banosFilter">Baños</label>
          <select id="banosFilter" class="form-control">
            <option value="">Todos</option>
            <option value="1">1</option>
            <option value="2">2</option>
            <option value="3">3</option>
            <option value="4">4+</option>
          </select>
        </div>

        <!-- Parqueos -->
        <div class="filter-group">
          <label for="parqueosFilter">Parqueos</label>
          <select id="parqueosFilter" class="form-control">
            <option value="">Todos</option>
            <option value="1">1</option>
            <option value="2">2</option>
            <option value="3">3</option>
            <option value="4">4+</option>
          </select>
        </div>
      </div>
    `;
  }

  /**
   * Renderizar filtros avanzados
   */
  renderFiltrosAvanzados() {
    if (!this.configFiltros || !this.configFiltros.caracteristicas) {
      return `<div class="contenedor-avanzado"><p class="text-muted">No hay características disponibles</p></div>`;
    }

    // Agrupar características por tipo
    const caracteristicasAgrupadas = {};
    this.caracteristicas.forEach(car => {
      if (!caracteristicasAgrupadas[car.tipo]) {
        caracteristicasAgrupadas[car.tipo] = [];
      }
      caracteristicasAgrupadas[car.tipo].push(car);
    });

    return `
      <div class="contenedor-avanzado">
        ${Object.keys(caracteristicasAgrupadas).map(tipo => `
          <div class="caracteristicas-grupo">
            <h4 class="caracteristicas-titulo">${tipo}</h4>
            <div class="caracteristicas-grid">
              ${caracteristicasAgrupadas[tipo].map(car => `
                <label class="caracteristica-item">
                  <input type="checkbox" value="${car.caracteristica_id}" data-nombre="${car.nombre}">
                  <span>${car.nombre}</span>
                </label>
              `).join('')}
            </div>
          </div>
        `).join('')}
      </div>
    `;
  }

  /**
   * Cargar datos para filtros
   */
  async loadFilterData() {
    console.log('📡 Cargando datos de filtros...');

    try {
      // Cargar en paralelo
      const [tiposResp, distritosResp, caracteristicasResp, configResp] = await Promise.all([
        fetch(`${API_URL}/tipos-inmuebles`).then(r => r.json()),
        fetch(`${API_URL}/distritos`).then(r => r.json()),
        fetch(`${API_URL}/caracteristicas`).then(r => r.json()),
        fetch(`${API_URL}/config-filtros`).then(r => r.json())
      ]);

      this.tiposInmuebles = tiposResp || [];
      this.distritos = distritosResp || [];
      this.caracteristicas = caracteristicasResp || [];
      this.configFiltros = configResp || null;

      console.log('✅ Datos de filtros cargados:', {
        tipos: this.tiposInmuebles.length,
        distritos: this.distritos.length,
        caracteristicas: this.caracteristicas.length
      });

    } catch (error) {
      console.error('❌ Error al cargar datos de filtros:', error);
      this.tiposInmuebles = [];
      this.distritos = [];
      this.caracteristicas = [];
      this.configFiltros = null;
    }
  }

  /**
   * Setup event listeners
   */
  setupEventListeners() {
    console.log('🎛️ SearchFiltersModule.setupEventListeners() called');

    // Acordeón
    this.setupAccordion();

    // Multi-select de distritos
    this.setupDistritosMultiSelect();

    // Botones de acción
    const btnAplicar = document.getElementById('btnAplicarFiltros');
    const btnLimpiar = document.getElementById('btnLimpiarFiltros');

    if (btnAplicar) {
      btnAplicar.addEventListener('click', () => this.aplicarFiltros());
    }

    if (btnLimpiar) {
      btnLimpiar.addEventListener('click', () => this.limpiarFiltros());
    }
  }

  /**
   * Setup acordeón
   */
  setupAccordion() {
    const headers = document.querySelectorAll('.accordion-header');

    headers.forEach(header => {
      header.addEventListener('click', () => {
        const accordionKey = header.getAttribute('data-accordion');
        const content = document.querySelector(`.accordion-content[data-accordion="${accordionKey}"]`);
        const isOpen = content.classList.contains('open');

        // Toggle
        if (isOpen) {
          content.classList.remove('open');
          header.setAttribute('aria-expanded', 'false');
        } else {
          content.classList.add('open');
          header.setAttribute('aria-expanded', 'true');
        }
      });
    });
  }

  /**
   * Setup multi-select de distritos
   */
  setupDistritosMultiSelect() {
    const trigger = document.getElementById('distritosFilterTrigger');
    const dropdown = document.getElementById('distritosFilterDropdown');
    const search = document.getElementById('distritosFilterSearch');
    const checkboxes = dropdown?.querySelectorAll('input[type="checkbox"]');

    // Abrir/cerrar dropdown
    if (trigger) {
      trigger.addEventListener('click', (e) => {
        e.stopPropagation();
        if (dropdown) {
          dropdown.style.display = dropdown.style.display === 'none' ? 'block' : 'none';
        }
      });
    }

    // Cerrar al hacer click fuera
    document.addEventListener('click', (e) => {
      if (dropdown && !e.target.closest('.multi-select-container')) {
        dropdown.style.display = 'none';
      }
    });

    // Búsqueda
    if (search) {
      search.addEventListener('input', (e) => {
        const query = e.target.value.toLowerCase();
        checkboxes?.forEach(checkbox => {
          const label = checkbox.closest('.multi-select-option');
          const nombre = checkbox.getAttribute('data-nombre').toLowerCase();
          if (nombre.includes(query)) {
            label.style.display = 'flex';
          } else {
            label.style.display = 'none';
          }
        });
      });
    }

    // Actualizar texto al seleccionar
    checkboxes?.forEach(checkbox => {
      checkbox.addEventListener('change', () => {
        this.updateDistritosSelection();
      });
    });
  }

  /**
   * Actualizar texto de distritos seleccionados
   */
  updateDistritosSelection() {
    const checkboxes = document.querySelectorAll('#distritosFilterDropdown input[type="checkbox"]:checked');
    const selectedText = document.getElementById('distritosFilterSelected');

    if (checkboxes.length === 0) {
      selectedText.textContent = 'Todos los distritos';
    } else if (checkboxes.length === 1) {
      selectedText.textContent = checkboxes[0].getAttribute('data-nombre');
    } else {
      selectedText.textContent = `${checkboxes.length} distritos seleccionados`;
    }
  }

  /**
   * Limpiar selección de distritos
   */
  clearDistritosSelection() {
    const checkboxes = document.querySelectorAll('#distritosFilterDropdown input[type="checkbox"]');
    checkboxes.forEach(checkbox => checkbox.checked = false);
    this.updateDistritosSelection();
  }

  /**
   * Cerrar dropdown de distritos
   */
  closeDistritosDropdown() {
    const dropdown = document.getElementById('distritosFilterDropdown');
    if (dropdown) {
      dropdown.style.display = 'none';
    }
  }

  /**
   * Aplicar filtros
   */
  async aplicarFiltros() {
    console.log('✅ Aplicando filtros...');

    try {
      // Recopilar filtros genéricos
      const tipoInmuebleId = document.getElementById('tipoInmuebleFilter')?.value || null;
      const distritosCheckboxes = document.querySelectorAll('#distritosFilterDropdown input[type="checkbox"]:checked');
      const distritosIds = Array.from(distritosCheckboxes).map(cb => parseInt(cb.value));
      const transaccion = document.getElementById('transaccionFilter')?.value || null;

      this.filtros.genericos = {
        tipo_inmueble_id: tipoInmuebleId ? parseInt(tipoInmuebleId) : null,
        distritos_ids: distritosIds,
        transaccion: transaccion
      };

      // Recopilar filtros básicos
      const precioMin = document.getElementById('precioMinFilter')?.value || null;
      const precioMax = document.getElementById('precioMaxFilter')?.value || null;
      const areaMin = document.getElementById('areaMinFilter')?.value || null;
      const areaMax = document.getElementById('areaMaxFilter')?.value || null;
      const habitaciones = document.getElementById('habitacionesFilter')?.value || null;
      const banos = document.getElementById('banosFilter')?.value || null;
      const parqueos = document.getElementById('parqueosFilter')?.value || null;

      this.filtros.basico = {
        precio_min: precioMin ? parseFloat(precioMin) : null,
        precio_max: precioMax ? parseFloat(precioMax) : null,
        area_min: areaMin ? parseFloat(areaMin) : null,
        area_max: areaMax ? parseFloat(areaMax) : null,
        habitaciones: habitaciones ? parseInt(habitaciones) : null,
        banos: banos ? parseInt(banos) : null,
        parqueos: parqueos ? parseInt(parqueos) : null
      };

      // Recopilar filtros avanzados (características)
      const caracteristicasCheckboxes = document.querySelectorAll('.contenedor-avanzado input[type="checkbox"]:checked');
      const caracteristicasIds = Array.from(caracteristicasCheckboxes).map(cb => parseInt(cb.value));

      this.filtros.avanzado = {
        caracteristicas: caracteristicasIds
      };

      // Combinar todos los filtros
      const filtrosCombinados = {
        ...this.filtros.genericos,
        ...this.filtros.basico,
        caracteristicas_ids: this.filtros.avanzado.caracteristicas
      };

      console.log('🔍 Filtros recopilados:', filtrosCombinados);

      // Ejecutar búsqueda en el controlador principal
      await this.searchController.executeSearch(filtrosCombinados);

    } catch (error) {
      console.error('❌ Error al aplicar filtros:', error);
      showNotification('Error al aplicar filtros: ' + error.message, 'error');
    }
  }

  /**
   * Limpiar filtros
   */
  limpiarFiltros() {
    console.log('🧹 Limpiando filtros...');

    // Limpiar genéricos
    const tipoInmueble = document.getElementById('tipoInmuebleFilter');
    const transaccion = document.getElementById('transaccionFilter');
    if (tipoInmueble) tipoInmueble.value = '';
    if (transaccion) transaccion.value = '';
    this.clearDistritosSelection();

    // Limpiar básicos
    const precioMin = document.getElementById('precioMinFilter');
    const precioMax = document.getElementById('precioMaxFilter');
    const areaMin = document.getElementById('areaMinFilter');
    const areaMax = document.getElementById('areaMaxFilter');
    const habitaciones = document.getElementById('habitacionesFilter');
    const banos = document.getElementById('banosFilter');
    const parqueos = document.getElementById('parqueosFilter');

    if (precioMin) precioMin.value = '';
    if (precioMax) precioMax.value = '';
    if (areaMin) areaMin.value = '';
    if (areaMax) areaMax.value = '';
    if (habitaciones) habitaciones.value = '';
    if (banos) banos.value = '';
    if (parqueos) parqueos.value = '';

    // Limpiar avanzados
    const caracteristicasCheckboxes = document.querySelectorAll('.contenedor-avanzado input[type="checkbox"]');
    caracteristicasCheckboxes.forEach(cb => cb.checked = false);

    // Resetear objeto de filtros
    this.filtros = {
      genericos: {
        tipo_inmueble_id: null,
        distrito_id: null,
        distritos_ids: [],
        transaccion: null
      },
      basico: {
        precio_min: null,
        precio_max: null,
        area_min: null,
        area_max: null,
        habitaciones: null,
        banos: null,
        parqueos: null
      },
      avanzado: {
        caracteristicas: []
      }
    };

    showNotification('Filtros limpiados', 'success');
  }

  /**
   * Pre-llenar filtros con criterios dados (para repetir búsqueda)
   */
  prefillFilters(criterios) {
    console.log('📝 Pre-llenando filtros con criterios:', criterios);

    try {
      // Pre-llenar filtros genéricos
      const tipoInmueble = document.getElementById('tipoInmuebleFilter');
      const transaccion = document.getElementById('transaccionFilter');

      if (tipoInmueble && criterios.tipo_inmueble_id) {
        tipoInmueble.value = criterios.tipo_inmueble_id;
      }

      if (transaccion && criterios.transaccion) {
        transaccion.value = criterios.transaccion;
      }

      // Pre-seleccionar distritos
      if (criterios.distritos_ids && Array.isArray(criterios.distritos_ids)) {
        const checkboxes = document.querySelectorAll('#distritosFilterDropdown input[type="checkbox"]');
        checkboxes.forEach(checkbox => {
          if (criterios.distritos_ids.includes(parseInt(checkbox.value))) {
            checkbox.checked = true;
          }
        });
        this.updateDistritosSelection();
      } else if (criterios.distrito_id && Array.isArray(criterios.distrito_id)) {
        // Si viene como distrito_id (array)
        const checkboxes = document.querySelectorAll('#distritosFilterDropdown input[type="checkbox"]');
        checkboxes.forEach(checkbox => {
          if (criterios.distrito_id.includes(parseInt(checkbox.value))) {
            checkbox.checked = true;
          }
        });
        this.updateDistritosSelection();
      }

      // Pre-llenar filtros básicos
      const precioMin = document.getElementById('precioMinFilter');
      const precioMax = document.getElementById('precioMaxFilter');
      const areaMin = document.getElementById('areaMinFilter');
      const areaMax = document.getElementById('areaMaxFilter');
      const habitaciones = document.getElementById('habitacionesFilter');
      const banos = document.getElementById('banosFilter');
      const parqueos = document.getElementById('parqueosFilter');

      if (precioMin && criterios.precio_min) precioMin.value = criterios.precio_min;
      if (precioMax && criterios.precio_max) precioMax.value = criterios.precio_max;
      if (areaMin && criterios.area_min) areaMin.value = criterios.area_min;
      if (areaMax && criterios.area_max) areaMax.value = criterios.area_max;
      if (habitaciones && criterios.habitaciones) habitaciones.value = criterios.habitaciones;
      if (banos && criterios.banos) banos.value = criterios.banos;
      if (parqueos && criterios.parqueos) parqueos.value = criterios.parqueos;

      // Pre-seleccionar características avanzadas
      if (criterios.caracteristicas_ids && Array.isArray(criterios.caracteristicas_ids)) {
        const caracteristicasCheckboxes = document.querySelectorAll('.contenedor-avanzado input[type="checkbox"]');
        caracteristicasCheckboxes.forEach(checkbox => {
          if (criterios.caracteristicas_ids.includes(parseInt(checkbox.value))) {
            checkbox.checked = true;
          }
        });
      }

      console.log('✅ Filtros pre-llenados correctamente');

    } catch (error) {
      console.error('❌ Error al pre-llenar filtros:', error);
    }
  }
}

// Exportar clase a window
window.SearchFiltersModule = SearchFiltersModule;

let searchFiltersModule;

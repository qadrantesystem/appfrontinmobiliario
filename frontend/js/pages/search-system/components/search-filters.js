/**
 * 🎛️ Filtros de Búsqueda con Acordeón
 * Archivo: search-system/components/search-filters.js
 *
 * Acordeón con 3 secciones:
 * - Filtro Genérico
 * - Filtro Básico
 * - Filtro Avanzado
 */

class SearchFilters {
  constructor(mainApp) {
    this.mainApp = mainApp;
    this.container = null;
    this.activeSection = 'generico'; // 'generico', 'basico', 'avanzado'
  }

  /**
   * Inicializar filtros
   */
  async init() {
    console.log('🎛️ Inicializando SearchFilters...');

    try {
      this.container = document.getElementById('searchFiltersAccordion');
      if (!this.container) {
        console.warn('⚠️ Contenedor de filtros no encontrado');
        return;
      }

      this.render();
      this.setupListeners();

      console.log('✅ SearchFilters inicializado');
    } catch (error) {
      console.error('❌ Error inicializando SearchFilters:', error);
    }
  }

  /**
   * Render acordeón
   */
  render() {
    this.container.innerHTML = `
      <div class="filters-accordion">
        <div class="accordion-header">
          <h3>Filtros de Búsqueda</h3>
          <button class="btn-reset-filters" data-reset-filters>
            Limpiar Filtros
          </button>
        </div>

        <!-- Filtro Genérico -->
        <div class="accordion-section ${this.activeSection === 'generico' ? 'active' : ''}">
          <button
            class="accordion-toggle"
            data-accordion="generico"
          >
            <span>📌 Filtro Genérico</span>
            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <polyline points="6 9 12 15 18 9"></polyline>
            </svg>
          </button>
          <div class="accordion-content">
            ${this.renderGenericoFilters()}
          </div>
        </div>

        <!-- Filtro Básico -->
        <div class="accordion-section ${this.activeSection === 'basico' ? 'active' : ''}">
          <button
            class="accordion-toggle"
            data-accordion="basico"
          >
            <span>🔧 Filtro Básico</span>
            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <polyline points="6 9 12 15 18 9"></polyline>
            </svg>
          </button>
          <div class="accordion-content">
            ${this.renderBasicoFilters()}
          </div>
        </div>

        <!-- Filtro Avanzado -->
        <div class="accordion-section ${this.activeSection === 'avanzado' ? 'active' : ''}">
          <button
            class="accordion-toggle"
            data-accordion="avanzado"
          >
            <span>⚙️ Filtro Avanzado</span>
            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <polyline points="6 9 12 15 18 9"></polyline>
            </svg>
          </button>
          <div class="accordion-content">
            ${this.renderAvanzadoFilters()}
          </div>
        </div>
      </div>
    `;
  }

  /**
   * Render filtros genéricos
   */
  renderGenericoFilters() {
    return `
      <div class="filters-grid">
        <div class="filter-item">
          <label>Tipo de Inmueble</label>
          <select id="filterTipo" class="form-control">
            <option value="">Todos</option>
            <option value="1">Oficina</option>
            <option value="2">Local Comercial</option>
            <option value="3">Terreno</option>
            <option value="4">Edificio</option>
          </select>
        </div>

        <div class="filter-item">
          <label>Distrito</label>
          <select id="filterDistrito" class="form-control">
            <option value="">Todos</option>
            <option value="1">San Isidro</option>
            <option value="2">Miraflores</option>
            <option value="3">Surco</option>
            <option value="4">La Molina</option>
          </select>
        </div>

        <div class="filter-item">
          <label>Estado</label>
          <select id="filterEstado" class="form-control">
            <option value="">Todos</option>
            <option value="1">Disponible</option>
            <option value="2">Alquilado</option>
            <option value="3">Vendido</option>
            <option value="4">En Proceso</option>
          </select>
        </div>

        <div class="filter-item">
          <label>Operación</label>
          <select id="filterOperacion" class="form-control">
            <option value="">Todas</option>
            <option value="compra">Compra</option>
            <option value="alquiler">Alquiler</option>
          </select>
        </div>
      </div>

      <div class="filter-actions">
        <button class="btn btn-primary" data-apply-filters>
          Aplicar Filtros
        </button>
      </div>
    `;
  }

  /**
   * Render filtros básicos
   */
  renderBasicoFilters() {
    return `
      <div class="filters-grid">
        <div class="filter-item">
          <label>Área (m²)</label>
          <div class="input-range">
            <input type="number" id="filterAreaMin" placeholder="Mín" class="form-control">
            <span>-</span>
            <input type="number" id="filterAreaMax" placeholder="Máx" class="form-control">
          </div>
        </div>

        <div class="filter-item">
          <label>Precio (USD)</label>
          <div class="input-range">
            <input type="number" id="filterPrecioMin" placeholder="Mín" class="form-control">
            <span>-</span>
            <input type="number" id="filterPrecioMax" placeholder="Máx" class="form-control">
          </div>
        </div>

        <div class="filter-item">
          <label>Antigüedad (años)</label>
          <div class="input-range">
            <input type="number" id="filterAntiguedadMin" placeholder="Mín" class="form-control">
            <span>-</span>
            <input type="number" id="filterAntiguedadMax" placeholder="Máx" class="form-control">
          </div>
        </div>

        <div class="filter-item">
          <label>Parqueos</label>
          <div class="input-range">
            <input type="number" id="filterParqueosMin" placeholder="Mín" class="form-control">
            <span>-</span>
            <input type="number" id="filterParqueosMax" placeholder="Máx" class="form-control">
          </div>
        </div>

        <div class="filter-item">
          <label>Altura (pisos)</label>
          <div class="input-range">
            <input type="number" id="filterAlturaMin" placeholder="Mín" class="form-control">
            <span>-</span>
            <input type="number" id="filterAlturaMax" placeholder="Máx" class="form-control">
          </div>
        </div>

        <div class="filter-item">
          <label>Disponibilidad</label>
          <select id="filterDisponibilidad" class="form-control">
            <option value="">Todas</option>
            <option value="inmediata">Inmediata</option>
            <option value="1mes">1 mes</option>
            <option value="2meses">2 meses</option>
            <option value="3meses">3 meses o más</option>
          </select>
        </div>
      </div>

      <div class="filter-actions">
        <button class="btn btn-primary" data-apply-filters>
          Aplicar Filtros
        </button>
      </div>
    `;
  }

  /**
   * Render filtros avanzados
   */
  renderAvanzadoFilters() {
    return `
      <div class="filters-grid">
        <div class="filter-item">
          <label>Implementación</label>
          <select id="filterImplementacion" class="form-control">
            <option value="">Todas</option>
            <option value="full">Full</option>
            <option value="semi">Semi</option>
            <option value="casco">Casco</option>
          </select>
        </div>

        <div class="filter-item">
          <label>CAFET (Tipo de Venta)</label>
          <select id="filterCafet" class="form-control">
            <option value="">Todos</option>
            <option value="si">Sí</option>
            <option value="no">No</option>
          </select>
        </div>

        <div class="filter-item">
          <label>Ascensores</label>
          <input type="number" id="filterAscensores" placeholder="Cantidad" class="form-control">
        </div>

        <div class="filter-item">
          <label>Grupo Electrógeno</label>
          <select id="filterGrupoElec" class="form-control">
            <option value="">Todos</option>
            <option value="si">Sí</option>
            <option value="no">No</option>
          </select>
        </div>

        <div class="filter-item">
          <label>Fibra Óptica</label>
          <select id="filterFibra" class="form-control">
            <option value="">Todos</option>
            <option value="si">Sí</option>
            <option value="no">No</option>
          </select>
        </div>

        <div class="filter-item">
          <label>Seguridad 24h</label>
          <select id="filterSeguridad" class="form-control">
            <option value="">Todos</option>
            <option value="si">Sí</option>
            <option value="no">No</option>
          </select>
        </div>

        <div class="filter-item">
          <label>Código SIS</label>
          <input type="text" id="filterCodigoSIS" placeholder="Ej: SIS2211" class="form-control">
        </div>

        <div class="filter-item">
          <label>Ordenar por</label>
          <select id="filterOrden" class="form-control">
            <option value="precio_asc">Precio: Menor a Mayor</option>
            <option value="precio_desc">Precio: Mayor a Menor</option>
            <option value="area_asc">Área: Menor a Mayor</option>
            <option value="area_desc">Área: Mayor a Menor</option>
            <option value="fecha_desc">Más Recientes</option>
            <option value="fecha_asc">Más Antiguos</option>
          </select>
        </div>
      </div>

      <div class="filter-actions">
        <button class="btn btn-primary" data-apply-filters>
          Aplicar Filtros
        </button>
      </div>
    `;
  }

  /**
   * Setup listeners
   */
  setupListeners() {
    // Toggle acordeón
    this.container.addEventListener('click', (e) => {
      const toggle = e.target.closest('[data-accordion]');
      if (!toggle) return;

      const section = toggle.dataset.accordion;
      this.toggleSection(section);
    });

    // Aplicar filtros
    this.container.addEventListener('click', (e) => {
      if (e.target.closest('[data-apply-filters]')) {
        e.preventDefault();
        this.applyFilters();
      }
    });

    // Resetear filtros
    this.container.addEventListener('click', (e) => {
      if (e.target.closest('[data-reset-filters]')) {
        e.preventDefault();
        this.resetFilters();
      }
    });
  }

  /**
   * Toggle sección del acordeón
   */
  toggleSection(section) {
    const sections = this.container.querySelectorAll('.accordion-section');

    sections.forEach(sec => {
      const toggle = sec.querySelector('[data-accordion]');
      if (toggle && toggle.dataset.accordion === section) {
        sec.classList.toggle('active');
      }
    });

    this.activeSection = section;
  }

  /**
   * Aplicar filtros
   */
  applyFilters() {
    const filters = this.collectFilters();
    console.log('🎛️ Aplicando filtros:', filters);

    // Filtrar resultados
    this.mainApp.applyFilters(filters);
  }

  /**
   * Recopilar valores de filtros
   */
  collectFilters() {
    return {
      // Genéricos
      tipo: this.getSelectValue('filterTipo'),
      distrito: this.getSelectValue('filterDistrito'),
      estado: this.getSelectValue('filterEstado'),
      operacion: this.getSelectValue('filterOperacion'),

      // Básicos
      area_min: this.getInputValue('filterAreaMin'),
      area_max: this.getInputValue('filterAreaMax'),
      precio_min: this.getInputValue('filterPrecioMin'),
      precio_max: this.getInputValue('filterPrecioMax'),
      antiguedad_min: this.getInputValue('filterAntiguedadMin'),
      antiguedad_max: this.getInputValue('filterAntiguedadMax'),
      parqueos_min: this.getInputValue('filterParqueosMin'),
      parqueos_max: this.getInputValue('filterParqueosMax'),
      altura_min: this.getInputValue('filterAlturaMin'),
      altura_max: this.getInputValue('filterAlturaMax'),
      disponibilidad: this.getSelectValue('filterDisponibilidad'),

      // Avanzados
      implementacion: this.getSelectValue('filterImplementacion'),
      cafet: this.getSelectValue('filterCafet'),
      ascensores: this.getInputValue('filterAscensores'),
      grupo_elec: this.getSelectValue('filterGrupoElec'),
      fibra: this.getSelectValue('filterFibra'),
      seguridad: this.getSelectValue('filterSeguridad'),
      codigo_sis: this.getInputValue('filterCodigoSIS'),
      orden: this.getSelectValue('filterOrden')
    };
  }

  /**
   * Obtener valor de select
   */
  getSelectValue(id) {
    const el = document.getElementById(id);
    return el ? el.value : null;
  }

  /**
   * Obtener valor de input
   */
  getInputValue(id) {
    const el = document.getElementById(id);
    return el && el.value ? el.value : null;
  }

  /**
   * Resetear filtros
   */
  resetFilters() {
    // Resetear selects
    const selects = this.container.querySelectorAll('select');
    selects.forEach(select => select.value = '');

    // Resetear inputs
    const inputs = this.container.querySelectorAll('input[type="number"], input[type="text"]');
    inputs.forEach(input => input.value = '');

    // Aplicar filtros vacíos
    this.applyFilters();

    showNotification('✅ Filtros reseteados', 'success');
  }
}

// Exponer globalmente
window.SearchFilters = SearchFilters;

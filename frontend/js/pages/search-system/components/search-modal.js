/**
 * 🔍 Modal de Búsqueda
 * Archivo: search-system/components/search-modal.js
 *
 * Popup inicial con filtros:
 * - Tipo de inmueble (select simple)
 * - Distrito (multiselect)
 * - Compra/Venta + Metraje + Precio
 */

class SearchModal {
  constructor(mainApp) {
    this.mainApp = mainApp;
    this.modal = null;
    this.isOpen = false;

    // Opciones de filtros
    this.tiposInmueble = [];
    this.distritos = [];

    // Valores actuales
    this.currentFilters = {
      tipo_inmueble_id: null,
      distritos: [],
      operacion: 'compra', // 'compra' o 'alquiler'
      metraje_min: null,
      metraje_max: null,
      precio_min: null,
      precio_max: null
    };
  }

  /**
   * Inicializar modal
   */
  async init() {
    console.log('🔍 Inicializando SearchModal...');

    try {
      // Cargar opciones de filtros
      await this.loadFilterOptions();

      // Crear modal en el DOM
      this.createModal();

      // Setup listeners
      this.setupListeners();

      console.log('✅ SearchModal inicializado');
    } catch (error) {
      console.error('❌ Error inicializando SearchModal:', error);
    }
  }

  /**
   * Cargar opciones de filtros desde API
   */
  async loadFilterOptions() {
    try {
      console.log('📥 Cargando opciones de filtros...');

      // Obtener tipos de inmueble
      const tiposResponse = await fetch(`${API_CONFIG.BASE_URL}/tipos-propiedad/`);
      if (tiposResponse.ok) {
        this.tiposInmueble = await tiposResponse.json();
      }

      // Obtener distritos
      const distritosResponse = await fetch(`${API_CONFIG.BASE_URL}/distritos/`);
      if (distritosResponse.ok) {
        this.distritos = await distritosResponse.json();
      }

      console.log(`✅ Opciones cargadas: ${this.tiposInmueble.length} tipos, ${this.distritos.length} distritos`);
    } catch (error) {
      console.error('❌ Error cargando opciones:', error);
    }
  }

  /**
   * Crear modal en el DOM
   */
  createModal() {
    const modalHTML = `
      <div id="searchModal" class="search-modal">
        <div class="search-modal-overlay"></div>
        <div class="search-modal-content">
          <div class="search-modal-header">
            <h2>🔍 Búsqueda de Propiedades</h2>
            <button class="search-modal-close" data-close-modal>
              <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <line x1="18" y1="6" x2="6" y2="18"></line>
                <line x1="6" y1="6" x2="18" y2="18"></line>
              </svg>
            </button>
          </div>

          <div class="search-modal-body">
            <form id="searchForm" class="search-form">
              <!-- Tipo de Inmueble -->
              <div class="form-group">
                <label for="tipoInmueble">Tipo de Inmueble</label>
                <select id="tipoInmueble" class="form-control" required>
                  <option value="">Seleccione...</option>
                  ${this.tiposInmueble.map(tipo => `
                    <option value="${tipo.tipo_id}">${tipo.nombre}</option>
                  `).join('')}
                </select>
              </div>

              <!-- Distrito (Multiselect) -->
              <div class="form-group">
                <label for="distritos">Distritos</label>
                <div class="multiselect-wrapper">
                  <button
                    type="button"
                    class="multiselect-toggle"
                    id="distritosToggle"
                  >
                    <span id="distritosLabel">Seleccione distritos...</span>
                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                      <polyline points="6 9 12 15 18 9"></polyline>
                    </svg>
                  </button>
                  <div class="multiselect-dropdown" id="distritosDropdown">
                    <div class="multiselect-search">
                      <input
                        type="text"
                        placeholder="Buscar distrito..."
                        id="distritosSearch"
                      >
                    </div>
                    <div class="multiselect-options" id="distritosOptions">
                      ${this.distritos.map(distrito => `
                        <label class="multiselect-option">
                          <input
                            type="checkbox"
                            value="${distrito.distrito_id}"
                            data-distrito-checkbox
                          >
                          <span>${distrito.nombre}</span>
                        </label>
                      `).join('')}
                    </div>
                  </div>
                </div>
              </div>

              <!-- Operación + Metraje + Precio (en una línea) -->
              <div class="form-row">
                <!-- Operación -->
                <div class="form-group">
                  <label>Operación</label>
                  <div class="radio-group">
                    <label class="radio-label">
                      <input type="radio" name="operacion" value="compra" checked>
                      <span>Compra</span>
                    </label>
                    <label class="radio-label">
                      <input type="radio" name="operacion" value="alquiler">
                      <span>Alquiler</span>
                    </label>
                  </div>
                </div>

                <!-- Metraje -->
                <div class="form-group">
                  <label>Metraje (m²)</label>
                  <div class="input-range">
                    <input
                      type="number"
                      placeholder="Mín"
                      id="metrajeMin"
                      min="0"
                      step="1"
                    >
                    <span class="range-separator">-</span>
                    <input
                      type="number"
                      placeholder="Máx"
                      id="metrajeMax"
                      min="0"
                      step="1"
                    >
                  </div>
                </div>

                <!-- Precio (cambia label según operación) -->
                <div class="form-group">
                  <label id="precioLabel">Precio Compra (USD)</label>
                  <div class="input-range">
                    <input
                      type="number"
                      placeholder="Mín"
                      id="precioMin"
                      min="0"
                      step="1000"
                    >
                    <span class="range-separator">-</span>
                    <input
                      type="number"
                      placeholder="Máx"
                      id="precioMax"
                      min="0"
                      step="1000"
                    >
                  </div>
                </div>
              </div>

              <!-- Botones -->
              <div class="search-modal-actions">
                <button
                  type="button"
                  class="btn btn-secondary"
                  data-close-modal
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  class="btn btn-primary"
                >
                  🔍 Buscar
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
    `;

    // Agregar al DOM
    document.body.insertAdjacentHTML('beforeend', modalHTML);
    this.modal = document.getElementById('searchModal');
  }

  /**
   * Setup listeners
   */
  setupListeners() {
    // Cerrar modal
    this.modal.addEventListener('click', (e) => {
      if (e.target.matches('[data-close-modal]') || e.target.matches('.search-modal-overlay')) {
        this.close();
      }
    });

    // ESC para cerrar
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape' && this.isOpen) {
        this.close();
      }
    });

    // Submit form
    const form = document.getElementById('searchForm');
    form.addEventListener('submit', (e) => {
      e.preventDefault();
      this.handleSearch();
    });

    // Toggle multiselect
    const toggle = document.getElementById('distritosToggle');
    const dropdown = document.getElementById('distritosDropdown');

    toggle.addEventListener('click', (e) => {
      e.stopPropagation();
      dropdown.classList.toggle('active');
    });

    // Cerrar dropdown al hacer click fuera
    document.addEventListener('click', () => {
      dropdown.classList.remove('active');
    });

    dropdown.addEventListener('click', (e) => {
      e.stopPropagation();
    });

    // Búsqueda en multiselect
    const searchInput = document.getElementById('distritosSearch');
    searchInput.addEventListener('input', (e) => {
      this.filterDistritos(e.target.value);
    });

    // Checkbox de distritos
    this.modal.addEventListener('change', (e) => {
      if (e.target.matches('[data-distrito-checkbox]')) {
        this.updateDistritosLabel();
      }
    });

    // Cambio de operación (compra/alquiler)
    this.modal.addEventListener('change', (e) => {
      if (e.target.name === 'operacion') {
        this.updatePrecioLabel(e.target.value);
      }
    });
  }

  /**
   * Filtrar distritos en el multiselect
   */
  filterDistritos(query) {
    const options = this.modal.querySelectorAll('.multiselect-option');
    const lowerQuery = query.toLowerCase();

    options.forEach(option => {
      const text = option.textContent.toLowerCase();
      option.style.display = text.includes(lowerQuery) ? 'flex' : 'none';
    });
  }

  /**
   * Actualizar label de distritos seleccionados
   */
  updateDistritosLabel() {
    const checkboxes = this.modal.querySelectorAll('[data-distrito-checkbox]:checked');
    const label = document.getElementById('distritosLabel');

    if (checkboxes.length === 0) {
      label.textContent = 'Seleccione distritos...';
    } else if (checkboxes.length === 1) {
      label.textContent = checkboxes[0].nextElementSibling.textContent;
    } else {
      label.textContent = `${checkboxes.length} distritos seleccionados`;
    }
  }

  /**
   * Actualizar label de precio según operación
   */
  updatePrecioLabel(operacion) {
    const label = document.getElementById('precioLabel');
    label.textContent = operacion === 'compra' ? 'Precio Compra (USD)' : 'Precio Alquiler (USD/mes)';
  }

  /**
   * Manejar búsqueda
   */
  handleSearch() {
    // Recopilar valores
    const tipoInmueble = document.getElementById('tipoInmueble').value;
    const operacion = this.modal.querySelector('input[name="operacion"]:checked').value;
    const metrajeMin = document.getElementById('metrajeMin').value;
    const metrajeMax = document.getElementById('metrajeMax').value;
    const precioMin = document.getElementById('precioMin').value;
    const precioMax = document.getElementById('precioMax').value;

    // Distritos seleccionados
    const distritosCheckboxes = this.modal.querySelectorAll('[data-distrito-checkbox]:checked');
    const distritos = Array.from(distritosCheckboxes).map(cb => parseInt(cb.value));

    // Validar
    if (!tipoInmueble) {
      showNotification('⚠️ Selecciona un tipo de inmueble', 'warning');
      return;
    }

    // Construir filtros
    const filters = {
      tipo_inmueble_id: parseInt(tipoInmueble),
      distritos: distritos,
      operacion: operacion,
      metraje_min: metrajeMin ? parseInt(metrajeMin) : null,
      metraje_max: metrajeMax ? parseInt(metrajeMax) : null,
      precio_min: precioMin ? parseFloat(precioMin) : null,
      precio_max: precioMax ? parseFloat(precioMax) : null
    };

    console.log('🔍 Filtros de búsqueda:', filters);

    // Ejecutar búsqueda en el main app
    this.mainApp.executeSearch(filters);
  }

  /**
   * Abrir modal
   */
  open() {
    this.isOpen = true;
    this.modal.classList.add('active');
    document.body.style.overflow = 'hidden';

    // Focus en primer input
    setTimeout(() => {
      document.getElementById('tipoInmueble')?.focus();
    }, 100);
  }

  /**
   * Cerrar modal
   */
  close() {
    this.isOpen = false;
    this.modal.classList.remove('active');
    document.body.style.overflow = '';
  }

  /**
   * Resetear formulario
   */
  reset() {
    document.getElementById('searchForm').reset();
    this.modal.querySelectorAll('[data-distrito-checkbox]').forEach(cb => {
      cb.checked = false;
    });
    this.updateDistritosLabel();
  }
}

// Exponer globalmente
window.SearchModal = SearchModal;

/**
 * 🔗 Characteristics By Type Module
 * Configuración dinámica de características por tipo de inmueble
 */

class CharacteristicsByTypeModule {
  constructor(maintenanceController) {
    this.maintenanceController = maintenanceController;
    this.tiposInmueble = [];
    this.todasCaracteristicas = [];
    this.caracteristicasSeleccionadas = [];
    this.tipoSeleccionado = null;

    // Asignar a window para que funcionen los onclick
    window.characteristicsByTypeModule = this;
  }

  async render() {
    try {
      // Cargar datos iniciales
      await this.loadInitialData();

      return `
        <div class="maintenance-module">
          <div class="module-header">
            <button class="btn btn-back" onclick="window.maintenanceController.closeModule()">
              <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <line x1="19" y1="12" x2="5" y2="12"></line>
                <polyline points="12 19 5 12 12 5"></polyline>
              </svg>
              Volver
            </button>
            <div class="module-title">
              <h2>Características por Tipo</h2>
              <p>Configurar características dinámicas por tipo de inmueble</p>
            </div>
          </div>

          <div class="module-content">
            <!-- Selector de Tipo de Inmueble -->
            <div class="config-section">
              <div class="form-group">
                <label for="tipoInmuebleSelect">
                  Seleccionar Tipo de Inmueble <span class="required">*</span>
                </label>
                <select
                  id="tipoInmuebleSelect"
                  class="form-control form-control-lg"
                  onchange="window.characteristicsByTypeModule.selectTipo(this.value)"
                >
                  <option value="">Selecciona un tipo de inmueble</option>
                  ${this.tiposInmueble.map(tipo => `
                    <option value="${tipo.tipo_inmueble_id}">
                      ${tipo.nombre}
                    </option>
                  `).join('')}
                </select>
              </div>
            </div>

            <!-- Configuración de Características -->
            <div id="caracteristicasConfig" style="display: none;">
              <div class="config-section">
                <div class="section-header">
                  <h3>Configurar Características</h3>
                  <p>Selecciona las características disponibles para este tipo de inmueble</p>
                </div>

                <!-- Filtro por categoría -->
                <div class="form-group">
                  <input
                    type="text"
                    id="searchCaracteristicas"
                    class="form-control"
                    placeholder="🔍 Buscar características..."
                    oninput="window.characteristicsByTypeModule.filterCaracteristicas(this.value)"
                  >
                </div>

                <!-- Lista de características agrupadas por categoría -->
                <div id="caracteristicasList" class="characteristics-grid">
                  <!-- Se renderiza dinámicamente -->
                </div>

                <!-- Botón guardar -->
                <div class="config-actions">
                  <button
                    class="btn btn-primary btn-lg"
                    onclick="window.characteristicsByTypeModule.saveConfiguration()"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                      <polyline points="20 6 9 17 4 12"></polyline>
                    </svg>
                    Guardar Configuración
                  </button>
                </div>
              </div>
            </div>

            <!-- Empty state -->
            <div id="emptyState" class="empty-state">
              <svg xmlns="http://www.w3.org/2000/svg" width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <circle cx="12" cy="12" r="10"></circle>
                <line x1="12" y1="8" x2="12" y2="16"></line>
                <line x1="8" y1="12" x2="16" y2="12"></line>
              </svg>
              <h3>Selecciona un Tipo de Inmueble</h3>
              <p>Elige un tipo de inmueble para configurar sus características</p>
            </div>
          </div>
        </div>
      `;

    } catch (error) {
      console.error('❌ Error renderizando módulo:', error);
      return `
        <div class="empty-state">
          <h3>Error al cargar datos</h3>
          <p>${error.message}</p>
          <button class="btn btn-outline" onclick="window.maintenanceController.closeModule()">Volver</button>
        </div>
      `;
    }
  }

  setupEventListeners() {
    // Event listeners ya están inline en el HTML
  }

  async loadInitialData() {
    try {
      // Cargar tipos de inmueble
      this.tiposInmueble = await maintenanceService.getTiposInmueble();

      // Cargar todas las características
      this.todasCaracteristicas = await maintenanceService.getCaracteristicas();

      console.log('✅ Datos iniciales cargados');
    } catch (error) {
      console.error('❌ Error cargando datos iniciales:', error);
      showNotification('Error al cargar datos', 'error');
    }
  }

  async selectTipo(tipoId) {
    console.log('🔍 selectTipo called with:', tipoId);

    if (!tipoId) {
      document.getElementById('caracteristicasConfig').style.display = 'none';
      document.getElementById('emptyState').style.display = 'flex';
      return;
    }

    this.tipoSeleccionado = parseInt(tipoId);
    console.log('✅ Tipo seleccionado:', this.tipoSeleccionado);

    // Mostrar loading
    const configSection = document.getElementById('caracteristicasConfig');
    const emptyState = document.getElementById('emptyState');

    console.log('🔍 DOM elements:', {
      configSection: !!configSection,
      emptyState: !!emptyState
    });

    if (emptyState) emptyState.style.display = 'none';
    if (configSection) configSection.style.display = 'block';

    try {
      // NOTA: El backend NO tiene endpoint GET para obtener características asignadas
      // Solo tiene POST para asignar. Por lo tanto, empezamos con array vacío
      console.log('📡 Iniciando configuración para tipo:', this.tipoSeleccionado);
      console.log('⚠️ Backend no tiene GET endpoint, empezando con selección vacía');

      // Empezar con array vacío (usuario selecciona manualmente)
      this.caracteristicasSeleccionadas = [];
      console.log('✅ Array de selección inicializado vacío');

      // Renderizar lista
      console.log('🎨 Renderizando lista de características...');
      this.renderCaracteristicasList();
      console.log('✅ Lista renderizada exitosamente');

    } catch (error) {
      console.error('❌ Error cargando configuración:', error);
      console.error('❌ Error stack:', error.stack);
      showNotification('Error al cargar configuración: ' + error.message, 'error');
    }
  }

  renderCaracteristicasList(filtro = '') {
    console.log('🎨 renderCaracteristicasList called with filtro:', filtro);
    const container = document.getElementById('caracteristicasList');

    if (!container) {
      console.error('❌ Container "caracteristicasList" no encontrado');
      return;
    }

    console.log('📊 Total características disponibles:', this.todasCaracteristicas.length);

    // Agrupar por categoría
    const porCategoria = {};

    this.todasCaracteristicas
      .filter(c => {
        if (!filtro) return true;
        return c.nombre.toLowerCase().includes(filtro.toLowerCase()) ||
               c.categoria.toLowerCase().includes(filtro.toLowerCase());
      })
      .forEach(caracteristica => {
        if (!porCategoria[caracteristica.categoria]) {
          porCategoria[caracteristica.categoria] = [];
        }
        porCategoria[caracteristica.categoria].push(caracteristica);
      });

    console.log('📂 Categorías agrupadas:', Object.keys(porCategoria));
    console.log('📦 Características seleccionadas:', this.caracteristicasSeleccionadas);

    // Renderizar
    const html = Object.keys(porCategoria).map(categoria => `
      <div class="characteristic-category">
        <h4 class="category-title">${categoria}</h4>
        <div class="characteristic-items">
          ${porCategoria[categoria].map(c => {
            const isSelected = this.caracteristicasSeleccionadas.includes(c.caracteristica_id);
            return `
              <label class="characteristic-item ${isSelected ? 'selected' : ''}">
                <input
                  type="checkbox"
                  value="${c.caracteristica_id}"
                  ${isSelected ? 'checked' : ''}
                  onchange="window.characteristicsByTypeModule.toggleCaracteristica(${c.caracteristica_id}, this.checked)"
                >
                <div class="characteristic-info">
                  <span class="characteristic-name">${c.nombre}</span>
                  <span class="characteristic-type">${c.tipo_valor}</span>
                </div>
              </label>
            `;
          }).join('')}
        </div>
      </div>
    `).join('');

    container.innerHTML = html || '<p class="text-muted">No hay características disponibles</p>';
  }

  toggleCaracteristica(id, checked) {
    if (checked) {
      if (!this.caracteristicasSeleccionadas.includes(id)) {
        this.caracteristicasSeleccionadas.push(id);
      }
    } else {
      this.caracteristicasSeleccionadas = this.caracteristicasSeleccionadas.filter(cid => cid !== id);
    }

    console.log('✅ Características seleccionadas:', this.caracteristicasSeleccionadas);
  }

  filterCaracteristicas(value) {
    this.renderCaracteristicasList(value);
  }

  async saveConfiguration() {
    if (!this.tipoSeleccionado) {
      showNotification('Selecciona un tipo de inmueble', 'error');
      return;
    }

    if (this.caracteristicasSeleccionadas.length === 0) {
      if (!confirm('¿Estás seguro de guardar sin características seleccionadas?')) {
        return;
      }
    }

    try {
      await maintenanceService.asignarCaracteristicasATipo(
        this.tipoSeleccionado,
        this.caracteristicasSeleccionadas
      );

      showNotification('Configuración guardada correctamente', 'success');

    } catch (error) {
      console.error('❌ Error guardando configuración:', error);
      showNotification(error.message || 'Error al guardar configuración', 'error');
    }
  }
}

let characteristicsByTypeModule;

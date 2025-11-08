/**
 * 🏢 SELECTOR EDIFICIO COMPONENT
 * Componente para seleccionar edificio padre y mostrar sus características
 *
 * Uso:
 * const selector = new SelectorEdificio('#edificio-select', '#caracteristicas-container');
 * selector.init();
 */

class SelectorEdificio {
  constructor(selectSelector, caracteristicasContainerSelector) {
    this.selectElement = document.querySelector(selectSelector);
    this.caracteristicasContainer = document.querySelector(caracteristicasContainerSelector);

    this.edificios = [];
    this.edificioSeleccionado = null;
    this.caracteristicas = null;
  }

  /**
   * 🎬 Inicializar componente
   */
  async init() {
    if (!this.selectElement) {
      console.error('❌ Select de edificio no encontrado');
      return;
    }

    // Cargar edificios disponibles
    await this.cargarEdificios();

    // Evento onChange para cargar características
    this.selectElement.addEventListener('change', () => this.handleEdificioChange());

    console.log('✅ SelectorEdificio inicializado');
  }

  /**
   * 📋 Cargar edificios disponibles desde API
   */
  async cargarEdificios() {
    try {
      this.showLoading();

      // Llamar al servicio
      this.edificios = await edificioService.listarDisponibles();

      console.log('📋 Edificios disponibles:', this.edificios);

      // Renderizar opciones en el select
      this.renderSelect();

    } catch (error) {
      console.error('❌ Error al cargar edificios:', error);
      this.showError('Error al cargar edificios disponibles');
    } finally {
      this.hideLoading();
    }
  }

  /**
   * 🎨 Renderizar opciones en el select
   */
  renderSelect() {
    if (!this.selectElement) return;

    // Limpiar select
    this.selectElement.innerHTML = '<option value="">Seleccionar edificio...</option>';

    // Agregar opciones
    this.edificios.forEach(edificio => {
      const option = document.createElement('option');
      option.value = edificio.registro_cab_id;
      option.textContent = `${edificio.nombre_inmueble} - ${edificio.direccion}`;

      // Agregar data attributes
      option.dataset.nombre = edificio.nombre_inmueble;
      option.dataset.direccion = edificio.direccion;
      option.dataset.pisos = edificio.cantidad_pisos || 'N/A';

      this.selectElement.appendChild(option);
    });

    console.log(`✅ ${this.edificios.length} edificios cargados en select`);
  }

  /**
   * 🔄 Manejar cambio de edificio seleccionado
   */
  async handleEdificioChange() {
    const edificioId = parseInt(this.selectElement.value);

    if (!edificioId) {
      // No hay edificio seleccionado - ocultar características
      this.edificioSeleccionado = null;
      this.caracteristicas = null;
      this.hideCaracteristicas();
      return;
    }

    // Encontrar edificio seleccionado
    this.edificioSeleccionado = this.edificios.find(e => e.registro_cab_id === edificioId);

    console.log('🏢 Edificio seleccionado:', this.edificioSeleccionado);

    // Cargar y mostrar características
    await this.cargarCaracteristicas(edificioId);
  }

  /**
   * 📊 Cargar características del edificio
   */
  async cargarCaracteristicas(edificioId) {
    try {
      this.showLoadingCaracteristicas();

      // Llamar al servicio
      this.caracteristicas = await edificioService.obtenerCaracteristicas(edificioId);

      console.log('📊 Características del edificio:', this.caracteristicas);

      // Renderizar características
      this.renderCaracteristicas();

    } catch (error) {
      console.error('❌ Error al cargar características:', error);
      this.showError('Error al cargar características del edificio');
    }
  }

  /**
   * 🎨 Renderizar características agrupadas por categoría
   */
  renderCaracteristicas() {
    if (!this.caracteristicasContainer) return;

    // Limpiar container
    this.caracteristicasContainer.innerHTML = '';

    if (!this.caracteristicas || Object.keys(this.caracteristicas).length === 0) {
      this.caracteristicasContainer.innerHTML = `
        <div class="alert alert-info">
          <i class="fas fa-info-circle me-2"></i>
          Este edificio no tiene características registradas.
        </div>
      `;
      return;
    }

    // Crear card con características
    const card = document.createElement('div');
    card.className = 'card border-primary mb-3';
    card.innerHTML = `
      <div class="card-header bg-primary text-white">
        <i class="fas fa-building me-2"></i>
        Características del Edificio: ${this.edificioSeleccionado.nombre_inmueble}
      </div>
      <div class="card-body">
        <div id="caracteristicas-accordion" class="accordion">
          ${this.renderAccordion()}
        </div>
      </div>
    `;

    this.caracteristicasContainer.appendChild(card);

    console.log('✅ Características renderizadas');
  }

  /**
   * 🎨 Renderizar accordion con categorías
   */
  renderAccordion() {
    let html = '';
    let index = 0;

    for (const [categoria, caracteristicas] of Object.entries(this.caracteristicas)) {
      const collapseId = `collapse-cat-${index}`;
      const headingId = `heading-cat-${index}`;

      html += `
        <div class="accordion-item">
          <h2 class="accordion-header" id="${headingId}">
            <button class="accordion-button ${index > 0 ? 'collapsed' : ''}"
                    type="button"
                    data-bs-toggle="collapse"
                    data-bs-target="#${collapseId}">
              <strong>${categoria}</strong>
              <span class="badge bg-secondary ms-2">${caracteristicas.length}</span>
            </button>
          </h2>
          <div id="${collapseId}"
               class="accordion-collapse collapse ${index === 0 ? 'show' : ''}"
               data-bs-parent="#caracteristicas-accordion">
            <div class="accordion-body">
              <div class="row g-2">
                ${this.renderCaracteristicasItems(caracteristicas)}
              </div>
            </div>
          </div>
        </div>
      `;

      index++;
    }

    return html;
  }

  /**
   * 🎨 Renderizar items de características
   */
  renderCaracteristicasItems(caracteristicas) {
    return caracteristicas.map(c => `
      <div class="col-md-6">
        <div class="d-flex justify-content-between align-items-center p-2 bg-light rounded">
          <span class="text-muted">${c.nombre}:</span>
          <strong>${c.valor}</strong>
        </div>
      </div>
    `).join('');
  }

  /**
   * 🙈 Ocultar características
   */
  hideCaracteristicas() {
    if (this.caracteristicasContainer) {
      this.caracteristicasContainer.innerHTML = '';
    }
  }

  /**
   * ⏳ Mostrar loading en select
   */
  showLoading() {
    if (this.selectElement) {
      this.selectElement.disabled = true;
      this.selectElement.innerHTML = '<option>Cargando edificios...</option>';
    }
  }

  /**
   * ✅ Ocultar loading en select
   */
  hideLoading() {
    if (this.selectElement) {
      this.selectElement.disabled = false;
    }
  }

  /**
   * ⏳ Mostrar loading en características
   */
  showLoadingCaracteristicas() {
    if (this.caracteristicasContainer) {
      this.caracteristicasContainer.innerHTML = `
        <div class="text-center p-3">
          <div class="spinner-border text-primary" role="status">
            <span class="visually-hidden">Cargando...</span>
          </div>
          <p class="mt-2">Cargando características...</p>
        </div>
      `;
    }
  }

  /**
   * ❌ Mostrar error
   */
  showError(message) {
    if (typeof Swal !== 'undefined') {
      Swal.fire({
        icon: 'error',
        title: 'Error',
        text: message,
        toast: true,
        position: 'top-end',
        showConfirmButton: false,
        timer: 3000
      });
    } else {
      console.error(message);
    }
  }

  /**
   * 📊 Obtener edificio seleccionado
   * @returns {Object|null}
   */
  getEdificioSeleccionado() {
    return this.edificioSeleccionado;
  }

  /**
   * 📊 Obtener ID del edificio seleccionado
   * @returns {number|null}
   */
  getEdificioId() {
    return this.edificioSeleccionado?.registro_cab_id || null;
  }

  /**
   * ✅ Validar si hay edificio seleccionado
   * @returns {boolean}
   */
  isValid() {
    return !!this.edificioSeleccionado;
  }

  /**
   * 🔄 Recargar edificios
   */
  async reload() {
    await this.cargarEdificios();
  }
}

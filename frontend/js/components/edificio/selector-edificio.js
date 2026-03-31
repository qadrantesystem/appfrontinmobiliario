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

    // 🆕 Callback para notificar al formulario padre cuando cambia el edificio
    this.onEdificioChange = null;
  }

  /**
   * 🆕 Configurar callback para cuando cambie el edificio
   * @param {Function} callback - Función que recibe el edificio seleccionado
   */
  setOnChangeCallback(callback) {
    this.onEdificioChange = callback;
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

      // Limpiar tooltip
      this.actualizarTooltipEdificio();

      // 🆕 Notificar al callback que se deseleccionó
      if (this.onEdificioChange) {
        this.onEdificioChange(null);
      }
      return;
    }

    // Encontrar edificio seleccionado
    this.edificioSeleccionado = this.edificios.find(e => e.registro_cab_id === edificioId);

    console.log('🏢 Edificio seleccionado:', this.edificioSeleccionado);

    // 🆕 Notificar al callback con los datos del edificio para herencia
    if (this.onEdificioChange && this.edificioSeleccionado) {
      console.log('📤 Notificando cambio de edificio al formulario padre...');
      this.onEdificioChange({
        registro_cab_id: this.edificioSeleccionado.registro_cab_id,
        nombre_inmueble: this.edificioSeleccionado.nombre_inmueble,
        distrito_id: this.edificioSeleccionado.distrito_id,
        distrito_nombre: this.edificioSeleccionado.distrito_nombre || this.edificioSeleccionado.distrito,
        direccion: this.edificioSeleccionado.direccion,
        latitud: this.edificioSeleccionado.latitud,
        longitud: this.edificioSeleccionado.longitud,
        cantidad_pisos: this.edificioSeleccionado.cantidad_pisos
      });
    }

    // Mostrar tooltip con info del edificio en el combo
    this.actualizarTooltipEdificio();

    // Limpiar el container de características (ya no se muestra cuadro verde)
    if (this.caracteristicasContainer) {
      this.caracteristicasContainer.innerHTML = '';
    }
  }

  /**
   * 💬 Actualizar tooltip del combo con info del edificio seleccionado
   */
  actualizarTooltipEdificio() {
    if (!this.selectElement) return;

    // Remover tooltip anterior si existe
    const tooltipAnterior = this.selectElement.parentElement.querySelector('.edificio-tooltip');
    if (tooltipAnterior) tooltipAnterior.remove();

    if (!this.edificioSeleccionado) {
      this.selectElement.title = '';
      return;
    }

    const ed = this.edificioSeleccionado;
    const distrito = ed.distrito_nombre || ed.distrito || 'N/A';
    const direccion = ed.direccion || 'N/A';
    const coordenadas = ed.latitud ? `${parseFloat(ed.latitud).toFixed(4)}, ${parseFloat(ed.longitud).toFixed(4)}` : '';

    // Title nativo como fallback
    this.selectElement.title = `${ed.nombre_inmueble}\nDistrito: ${distrito}\nDirección: ${direccion}`;

    // Crear tooltip visual personalizado
    const tooltipEl = document.createElement('div');
    tooltipEl.className = 'edificio-tooltip';
    tooltipEl.innerHTML = `
      <div class="edificio-tooltip__header">
        <span class="edificio-tooltip__icon">🏢</span>
        <span class="edificio-tooltip__nombre">${ed.nombre_inmueble}</span>
      </div>
      <div class="edificio-tooltip__body">
        <div class="edificio-tooltip__row">
          <span class="edificio-tooltip__label">Distrito:</span>
          <span class="edificio-tooltip__value">${distrito}</span>
        </div>
        <div class="edificio-tooltip__row">
          <span class="edificio-tooltip__label">Dirección:</span>
          <span class="edificio-tooltip__value">${direccion}</span>
        </div>
        ${coordenadas ? `
        <div class="edificio-tooltip__row">
          <span class="edificio-tooltip__label">Coordenadas:</span>
          <span class="edificio-tooltip__value">${coordenadas}</span>
        </div>` : ''}
      </div>
    `;

    // Insertar tooltip en el wrapper del select
    const wrapper = this.selectElement.parentElement;
    wrapper.style.position = 'relative';
    wrapper.appendChild(tooltipEl);

    // Mostrar/ocultar con hover
    const showTooltip = () => { tooltipEl.classList.add('visible'); };
    const hideTooltip = () => { tooltipEl.classList.remove('visible'); };

    // Remover listeners anteriores
    if (this._tooltipShowHandler) {
      this.selectElement.removeEventListener('mouseenter', this._tooltipShowHandler);
      this.selectElement.removeEventListener('mouseleave', this._tooltipHideHandler);
    }

    this._tooltipShowHandler = showTooltip;
    this._tooltipHideHandler = hideTooltip;

    this.selectElement.addEventListener('mouseenter', showTooltip);
    this.selectElement.addEventListener('mouseleave', hideTooltip);

    // También ocultar cuando se abre el combo
    this.selectElement.addEventListener('focus', hideTooltip);
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

    // ✅ Usar mismo HTML que el formulario de propiedades (Paso 3)
    const html = `
      <div class="caracteristicas-edificio-readonly mt-3">
        <h6 class="text-muted mb-3">
          <i class="fas fa-building me-2"></i>
          Características del Edificio: ${this.edificioSeleccionado.nombre_inmueble}
        </h6>
        
        <div class="accordion" id="accordion-caracteristicas-edificio">
          ${this.renderAccordion()}
        </div>
      </div>
    `;

    this.caracteristicasContainer.innerHTML = html;

    console.log('✅ Características renderizadas en formato acordeón');
  }

  /**
   * 🎨 Renderizar accordion con categorías (estilo visual mejorado)
   */
  renderAccordion() {
    let html = '';
    let index = 0;

    // Mapa de iconos por categoría
    const iconos = {
      'Generales del Edificio': '🏢',
      'Soporte del Edificio': '🛡️',
      'Áreas Comunes del Edificio': '🏊',
      'Ascensores': '🛗',
      'De la Oficina': '📋',
      'Equipamiento de Oficina': '⚙️',
      'Vista de la Oficina': '👁️',
      'Información de Áreas': '📐',
      'Valorización Edificio': '💰',
      'Soporte Urbano': '📍'
    };

    for (const [categoria, caracteristicas] of Object.entries(this.caracteristicas)) {
      const collapseId = `collapse-edificio-cat-${index}`;
      const icono = iconos[categoria] || '📌';

      html += `
        <div class="categoria-item" style="background: #f8f9fa; border: 1px solid #dee2e6; border-radius: 8px; margin-bottom: 10px; overflow: hidden;">
          <button class="categoria-header" 
                  type="button"
                  data-bs-toggle="collapse"
                  data-bs-target="#${collapseId}"
                  style="width: 100%; padding: 12px 16px; background: white; border: none; display: flex; align-items: center; justify-content: space-between; cursor: pointer; text-align: left;">
            <span style="display: flex; align-items: center; gap: 10px; font-weight: 500;">
              <span style="font-size: 1.2em;">${icono}</span>
              <span>${categoria}</span>
            </span>
            <span style="display: flex; align-items: center; gap: 10px;">
              <span style="font-size: 0.85em; color: #6c757d;">${caracteristicas.length} características</span>
              <span class="dropdown-arrow" style="transition: transform 0.2s;">▼</span>
            </span>
          </button>
          <div id="${collapseId}" class="collapse ${index === 0 ? 'show' : ''}" data-bs-parent="#accordion-caracteristicas-edificio">
            <div style="padding: 16px; background: white;">
              <div class="row g-3">
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

  /**
   * 🎯 Pre-seleccionar un edificio por ID
   * @param {number} edificioId - ID del edificio a seleccionar
   */
  async setEdificio(edificioId) {
    if (!edificioId) {
      console.warn('⚠️ setEdificio: No se proporcionó edificioId');
      return;
    }

    console.log('🎯 Pre-seleccionando edificio:', edificioId);
    console.log('📋 Edificios disponibles en memoria:', this.edificios.map(e => e.registro_cab_id));

    // Verificar que el edificio existe en la lista
    const edificioExiste = this.edificios.find(e => e.registro_cab_id == edificioId);
    if (!edificioExiste) {
      console.error(`❌ EDIFICIO ${edificioId} NO ESTÁ EN LA LISTA DE DISPONIBLES`);
      console.error('🔍 IDs disponibles:', this.edificios.map(e => `${e.registro_cab_id} (${e.nombre_inmueble})`));
      return;
    }

    // Asignar valor al select (convertir a string por si acaso)
    if (this.selectElement) {
      this.selectElement.value = String(edificioId);
      
      // Disparar evento change para cargar características
      const event = new Event('change', { bubbles: true });
      this.selectElement.dispatchEvent(event);
      
      console.log('✅ Edificio pre-seleccionado:', edificioId, '- Valor del select:', this.selectElement.value);
      
      // ✅ Llamar directamente al handler para asegurar que se ejecute
      await this.handleEdificioChange();
    } else {
      console.error('❌ Select element no encontrado');
    }
  }
}

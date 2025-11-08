/**
 * 🏢 MODAL GENERACIÓN MASIVA COMPONENT
 * Modal para configurar y generar oficinas masivamente
 *
 * Uso:
 * const modal = new ModalGeneracionMasiva('#modal-masivo', edificioId, propietarioId, distritoId);
 * modal.show();
 */

class ModalGeneracionMasiva {
  constructor(modalSelector, edificioId, edificioNombre, propietarioId, distritoId) {
    this.modalElement = document.querySelector(modalSelector);
    this.edificioId = edificioId;
    this.edificioNombre = edificioNombre;
    this.propietarioId = propietarioId;
    this.distritoId = distritoId;

    this.plantillaOficinas = [];
    this.isSubmitting = false;
  }

  /**
   * 🎬 Mostrar modal
   */
  show() {
    if (!this.modalElement) {
      this.createModal();
    }

    this.render();
    this.attachEventListeners();

    // Mostrar modal con Bootstrap
    const bsModal = new bootstrap.Modal(this.modalElement);
    bsModal.show();
  }

  /**
   * 🏗️ Crear estructura del modal
   */
  createModal() {
    const modalHtml = `
      <div class="modal fade" id="modal-generacion-masiva" tabindex="-1">
        <div class="modal-dialog modal-xl">
          <div class="modal-content">
            <!-- Header -->
            <div class="modal-header bg-primary text-white">
              <h5 class="modal-title">
                <i class="fas fa-building me-2"></i>
                Generación Masiva de Oficinas
              </h5>
              <button type="button" class="btn-close btn-close-white" data-bs-dismiss="modal"></button>
            </div>

            <!-- Body -->
            <div class="modal-body" id="modal-masivo-body">
              <!-- El contenido se renderiza dinámicamente -->
            </div>

            <!-- Footer -->
            <div class="modal-footer">
              <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">
                <i class="fas fa-times me-1"></i> Cancelar
              </button>
              <button type="button" class="btn btn-primary" id="btn-generar-masivo">
                <i class="fas fa-magic me-1"></i> Generar Oficinas
              </button>
            </div>
          </div>
        </div>
      </div>
    `;

    document.body.insertAdjacentHTML('beforeend', modalHtml);
    this.modalElement = document.querySelector('#modal-generacion-masiva');
  }

  /**
   * 🎨 Renderizar contenido del modal
   */
  render() {
    const bodyContainer = document.querySelector('#modal-masivo-body');
    if (!bodyContainer) return;

    bodyContainer.innerHTML = `
      <!-- Información del Edificio -->
      <div class="alert alert-info mb-4">
        <h6 class="alert-heading">
          <i class="fas fa-building me-2"></i>
          Edificio: ${this.edificioNombre}
        </h6>
        <p class="mb-0 small">
          Se crearán oficinas en estado <strong>borrador</strong> para edición posterior individual.
        </p>
      </div>

      <!-- Configuración de Pisos -->
      <div class="row mb-4">
        <div class="col-md-6">
          <label class="form-label">
            <i class="fas fa-arrow-down me-1"></i> Piso Desde
          </label>
          <input type="number" class="form-control" id="piso-desde"
                 min="1" max="100" value="1" required>
        </div>
        <div class="col-md-6">
          <label class="form-label">
            <i class="fas fa-arrow-up me-1"></i> Piso Hasta
          </label>
          <input type="number" class="form-control" id="piso-hasta"
                 min="1" max="100" value="1" required>
        </div>
      </div>

      <!-- Configuración de Precios -->
      <div class="card mb-4">
        <div class="card-header">
          <i class="fas fa-dollar-sign me-2"></i> Configuración de Precios Base
        </div>
        <div class="card-body">
          <div class="row mb-3">
            <div class="col-md-4">
              <label class="form-label">Tipo de Transacción</label>
              <select class="form-select" id="transaccion">
                <option value="alquiler">Solo Alquiler</option>
                <option value="venta">Solo Venta</option>
                <option value="ambos">Alquiler y Venta</option>
              </select>
            </div>
            <div class="col-md-4">
              <label class="form-label">Moneda</label>
              <select class="form-select" id="moneda">
                <option value="PEN">PEN (S/)</option>
                <option value="USD">USD ($)</option>
              </select>
            </div>
          </div>

          <div class="row" id="precios-container">
            <div class="col-md-6" id="precio-alquiler-container">
              <label class="form-label">Precio Alquiler Base</label>
              <input type="number" class="form-control" id="precio-alquiler-base"
                     min="0" step="0.01" placeholder="Ej: 1500.00">
            </div>
            <div class="col-md-6 d-none" id="precio-venta-container">
              <label class="form-label">Precio Venta Base</label>
              <input type="number" class="form-control" id="precio-venta-base"
                     min="0" step="0.01" placeholder="Ej: 150000.00">
            </div>
          </div>
        </div>
      </div>

      <!-- Plantilla de Oficinas -->
      <div class="card mb-4">
        <div class="card-header d-flex justify-content-between align-items-center">
          <span>
            <i class="fas fa-th-list me-2"></i> Plantilla de Oficinas por Piso
          </span>
          <button type="button" class="btn btn-sm btn-success" id="btn-agregar-plantilla">
            <i class="fas fa-plus me-1"></i> Agregar Oficina
          </button>
        </div>
        <div class="card-body">
          <div id="plantillas-container">
            <!-- Las plantillas se agregan dinámicamente -->
          </div>
        </div>
      </div>

      <!-- Preview -->
      <div class="alert alert-secondary" id="preview-total">
        <i class="fas fa-info-circle me-2"></i>
        <strong>Total:</strong> Se generarán <span id="total-oficinas">0</span> oficinas
      </div>
    `;

    // Agregar primera plantilla por defecto
    this.agregarPlantilla();

    // Calcular total inicial
    this.calcularTotal();
  }

  /**
   * 🔗 Adjuntar event listeners
   */
  attachEventListeners() {
    // Botón agregar plantilla
    document.querySelector('#btn-agregar-plantilla')?.addEventListener('click', () => {
      this.agregarPlantilla();
    });

    // Botón generar
    document.querySelector('#btn-generar-masivo')?.addEventListener('click', () => {
      this.handleGenerar();
    });

    // Cambio en transacción
    document.querySelector('#transaccion')?.addEventListener('change', (e) => {
      this.handleTransaccionChange(e.target.value);
    });

    // Recalcular total al cambiar pisos
    document.querySelector('#piso-desde')?.addEventListener('input', () => this.calcularTotal());
    document.querySelector('#piso-hasta')?.addEventListener('input', () => this.calcularTotal());
  }

  /**
   * ➕ Agregar plantilla de oficina
   */
  agregarPlantilla() {
    const container = document.querySelector('#plantillas-container');
    if (!container) return;

    const index = this.plantillaOficinas.length;

    const plantillaHtml = `
      <div class="card mb-3 plantilla-item" data-index="${index}">
        <div class="card-body">
          <div class="d-flex justify-content-between align-items-center mb-2">
            <h6 class="mb-0">Oficina ${index + 1}</h6>
            ${index > 0 ? `
              <button type="button" class="btn btn-sm btn-danger btn-eliminar-plantilla" data-index="${index}">
                <i class="fas fa-trash"></i>
              </button>
            ` : ''}
          </div>

          <div class="row">
            <div class="col-md-4">
              <label class="form-label">Sufijo <small class="text-muted">(01, 02, A, B...)</small></label>
              <input type="text" class="form-control plantilla-sufijo"
                     data-index="${index}" maxlength="3"
                     placeholder="Ej: 01" value="${String(index + 1).padStart(2, '0')}" required>
            </div>
            <div class="col-md-4">
              <label class="form-label">Área (m²)</label>
              <input type="number" class="form-control plantilla-area"
                     data-index="${index}" min="1" step="0.01"
                     placeholder="Ej: 120.5" required>
            </div>
            <div class="col-md-4">
              <label class="form-label">Parqueos <small class="text-muted">(opcional)</small></label>
              <input type="number" class="form-control plantilla-parqueos"
                     data-index="${index}" min="0" value="0">
            </div>
          </div>
        </div>
      </div>
    `;

    container.insertAdjacentHTML('beforeend', plantillaHtml);

    // Agregar a array
    this.plantillaOficinas.push({
      sufijo: String(index + 1).padStart(2, '0'),
      area: null,
      caracteristicas: []
    });

    // Event listener para eliminar
    const btnEliminar = container.querySelector(`[data-index="${index}"].btn-eliminar-plantilla`);
    btnEliminar?.addEventListener('click', () => this.eliminarPlantilla(index));

    // Event listeners para actualizar datos
    container.querySelector(`.plantilla-sufijo[data-index="${index}"]`)?.addEventListener('input', (e) => {
      this.plantillaOficinas[index].sufijo = e.target.value;
      this.calcularTotal();
    });

    container.querySelector(`.plantilla-area[data-index="${index}"]`)?.addEventListener('input', (e) => {
      this.plantillaOficinas[index].area = parseFloat(e.target.value) || null;
    });

    container.querySelector(`.plantilla-parqueos[data-index="${index}"]`)?.addEventListener('input', (e) => {
      const parqueos = parseInt(e.target.value) || 0;
      // TODO: Agregar a características (necesitamos el ID de la característica "Parqueos")
    });

    this.calcularTotal();
  }

  /**
   * ❌ Eliminar plantilla
   */
  eliminarPlantilla(index) {
    const plantilla = document.querySelector(`.plantilla-item[data-index="${index}"]`);
    if (plantilla) {
      plantilla.remove();
      this.plantillaOficinas.splice(index, 1);
      this.calcularTotal();
    }
  }

  /**
   * 🔄 Manejar cambio de tipo de transacción
   */
  handleTransaccionChange(transaccion) {
    const alquilerContainer = document.querySelector('#precio-alquiler-container');
    const ventaContainer = document.querySelector('#precio-venta-container');

    if (transaccion === 'alquiler') {
      alquilerContainer?.classList.remove('d-none');
      ventaContainer?.classList.add('d-none');
    } else if (transaccion === 'venta') {
      alquilerContainer?.classList.add('d-none');
      ventaContainer?.classList.remove('d-none');
    } else if (transaccion === 'ambos') {
      alquilerContainer?.classList.remove('d-none');
      ventaContainer?.classList.remove('d-none');
    }
  }

  /**
   * 📊 Calcular total de oficinas a generar
   */
  calcularTotal() {
    const pisoDesde = parseInt(document.querySelector('#piso-desde')?.value) || 0;
    const pisoHasta = parseInt(document.querySelector('#piso-hasta')?.value) || 0;
    const oficinasPorPiso = this.plantillaOficinas.length;

    const total = oficinaService.calcularTotal(pisoDesde, pisoHasta, oficinasPorPiso);

    const totalElement = document.querySelector('#total-oficinas');
    if (totalElement) {
      totalElement.textContent = total;
    }
  }

  /**
   * 🚀 Manejar generación masiva
   */
  async handleGenerar() {
    if (this.isSubmitting) return;

    try {
      // Recopilar datos del formulario
      const config = this.getFormData();

      // Validar configuración
      const validation = oficinaService.validarConfiguracion(config);

      if (!validation.valid) {
        this.showErrors(validation.errors);
        return;
      }

      // Confirmar con el usuario
      const confirmacion = await this.confirmarGeneracion(config);
      if (!confirmacion) return;

      this.isSubmitting = true;
      this.showLoading();

      // Llamar al servicio
      const resultado = await oficinaService.generarMasivo(config);

      // Mostrar resultado exitoso
      await this.showSuccess(resultado);

      // Cerrar modal
      this.close();

      // Recargar propiedades en el dashboard
      if (window.dashboardPropiedades && typeof window.dashboardPropiedades.loadPropiedades === 'function') {
        window.dashboardPropiedades.loadPropiedades();
      }

    } catch (error) {
      console.error('❌ Error al generar oficinas:', error);
      this.showError(error.message || 'Error al generar oficinas');
    } finally {
      this.isSubmitting = false;
      this.hideLoading();
    }
  }

  /**
   * 📋 Obtener datos del formulario
   */
  getFormData() {
    return {
      edificio_id: this.edificioId,
      piso_desde: parseInt(document.querySelector('#piso-desde')?.value) || 1,
      piso_hasta: parseInt(document.querySelector('#piso-hasta')?.value) || 1,
      plantilla_oficinas: this.plantillaOficinas.filter(p => p.area && p.sufijo),
      propietario_id: this.propietarioId,
      distrito_id: this.distritoId,
      precio_alquiler_base: parseFloat(document.querySelector('#precio-alquiler-base')?.value) || null,
      precio_venta_base: parseFloat(document.querySelector('#precio-venta-base')?.value) || null,
      moneda: document.querySelector('#moneda')?.value || 'PEN',
      transaccion: document.querySelector('#transaccion')?.value || 'alquiler'
    };
  }

  /**
   * ❓ Confirmar generación con el usuario
   */
  async confirmarGeneracion(config) {
    const total = oficinaService.calcularTotal(config.piso_desde, config.piso_hasta, config.plantilla_oficinas.length);

    return Swal.fire({
      title: '¿Generar oficinas?',
      html: `
        <p>Se generarán <strong>${total} oficinas</strong> en el edificio:</p>
        <p class="text-primary"><strong>${this.edificioNombre}</strong></p>
        <p class="small text-muted">Pisos del ${config.piso_desde} al ${config.piso_hasta}</p>
        <p class="small">Todas las oficinas se crearán en estado <strong>borrador</strong>.</p>
      `,
      icon: 'question',
      showCancelButton: true,
      confirmButtonText: '<i class="fas fa-check me-1"></i> Sí, generar',
      cancelButtonText: '<i class="fas fa-times me-1"></i> Cancelar',
      confirmButtonColor: '#0d6efd',
      cancelButtonColor: '#6c757d'
    }).then((result) => result.isConfirmed);
  }

  /**
   * ✅ Mostrar resultado exitoso
   */
  async showSuccess(resultado) {
    return Swal.fire({
      icon: 'success',
      title: '¡Oficinas generadas!',
      html: `
        <p>Se generaron exitosamente <strong>${resultado.oficinas_creadas} oficinas</strong></p>
        <p class="text-muted small">Edificio: ${resultado.edificio_padre}</p>
        <p class="small">Ahora puedes editarlas individualmente desde <strong>Mis Propiedades</strong>.</p>
      `,
      confirmButtonText: 'Entendido'
    });
  }

  /**
   * ❌ Mostrar errores de validación
   */
  showErrors(errors) {
    Swal.fire({
      icon: 'error',
      title: 'Errores en el formulario',
      html: `<ul class="text-start">${errors.map(e => `<li>${e}</li>`).join('')}</ul>`,
      confirmButtonText: 'Corregir'
    });
  }

  /**
   * ❌ Mostrar error general
   */
  showError(message) {
    Swal.fire({
      icon: 'error',
      title: 'Error',
      text: message,
      confirmButtonText: 'Entendido'
    });
  }

  /**
   * ⏳ Mostrar loading
   */
  showLoading() {
    const btnGenerar = document.querySelector('#btn-generar-masivo');
    if (btnGenerar) {
      btnGenerar.disabled = true;
      btnGenerar.innerHTML = '<i class="fas fa-spinner fa-spin me-1"></i> Generando...';
    }
  }

  /**
   * ✅ Ocultar loading
   */
  hideLoading() {
    const btnGenerar = document.querySelector('#btn-generar-masivo');
    if (btnGenerar) {
      btnGenerar.disabled = false;
      btnGenerar.innerHTML = '<i class="fas fa-magic me-1"></i> Generar Oficinas';
    }
  }

  /**
   * 🚪 Cerrar modal
   */
  close() {
    const bsModal = bootstrap.Modal.getInstance(this.modalElement);
    bsModal?.hide();
  }
}

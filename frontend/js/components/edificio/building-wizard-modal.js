/**
 * 🏢 BUILDING WIZARD MODAL - VERSIÓN ÉPICA
 * Modal revolucionario para registro masivo de edificios
 *
 * Características:
 * - Diseño multipaso con indicador visual profesional
 * - Visualización 3D de torre con colores de edificio real
 * - Metraje flexible (mismo para todas o individual)
 * - Sistema de sótanos con parqueos
 * - Animaciones fluidas y UX excepcional
 */

class BuildingWizardModal {
  constructor() {
    this.isOpen = false;
    this.buildingData = null;
    this.step = 1; // 1: Confirmar, 2: Metraje, 3: Sótanos
    this.oficinas = [];
    this.sotanos = [];
    this.onConfirm = null;
    this.onCancel = null;
  }

  /**
   * 🎬 Abrir modal
   */
  open(buildingData, onConfirm, onCancel) {
    this.buildingData = buildingData;
    this.onConfirm = onConfirm;
    this.onCancel = onCancel;
    this.step = 1;
    this.render();
    this.isOpen = true;
  }

  /**
   * 🎨 Renderizar modal
   */
  render() {
    let modal = document.getElementById('building-wizard-modal');

    if (!modal) {
      modal = document.createElement('div');
      modal.id = 'building-wizard-modal';
      modal.className = 'modal fade';
      modal.setAttribute('data-bs-backdrop', 'static');
      modal.setAttribute('data-bs-keyboard', 'false');
      modal.setAttribute('tabindex', '-1');
      document.body.appendChild(modal);
    }

    modal.innerHTML = this.getModalHTML();

    // Mostrar modal
    if (typeof window.bootstrap !== 'undefined') {
      const bsModal = new window.bootstrap.Modal(modal);
      bsModal.show();
    } else {
      modal.classList.add('show');
      modal.style.display = 'block';
      document.body.classList.add('modal-open');

      const backdrop = document.createElement('div');
      backdrop.className = 'modal-backdrop fade show';
      backdrop.id = 'building-wizard-backdrop';
      document.body.appendChild(backdrop);
    }

    this.attachEventListeners();
  }

  /**
   * 📝 HTML principal del modal
   */
  getModalHTML() {
    return `
      ${this.getStyles()}
      <div class="modal-dialog modal-xl modal-dialog-centered modal-dialog-scrollable">
        <div class="modal-content building-wizard-content">
          ${this.getHeader()}
          <div class="modal-body p-0">
            ${this.getStepIndicator()}
            <div class="step-content p-4">
              ${this.getStepContent()}
            </div>
          </div>
          ${this.getFooter()}
        </div>
      </div>
    `;
  }

  /**
   * 🎨 Estilos CSS épicos
   */
  getStyles() {
    return `
      <style>
        .building-wizard-content {
          border: none;
          border-radius: 20px;
          overflow: hidden;
          box-shadow: 0 10px 40px rgba(0,0,0,0.2);
        }

        .building-wizard-header {
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          color: white;
          padding: 25px 30px;
          border: none;
        }

        .building-wizard-header h5 {
          font-size: 24px;
          font-weight: 700;
          margin: 0;
        }

        .step-indicator {
          background: #f8f9fa;
          padding: 20px 30px;
          border-bottom: 2px solid #e9ecef;
        }

        .step-pills {
          display: flex;
          justify-content: center;
          gap: 15px;
          margin: 0;
          padding: 0;
          list-style: none;
        }

        .step-pill {
          display: flex;
          align-items: center;
          gap: 10px;
          padding: 12px 25px;
          background: white;
          border: 2px solid #dee2e6;
          border-radius: 50px;
          transition: all 0.3s ease;
          font-weight: 600;
          color: #6c757d;
        }

        .step-pill.active {
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          border-color: #667eea;
          color: white;
          transform: scale(1.05);
          box-shadow: 0 5px 15px rgba(102, 126, 234, 0.3);
        }

        .step-pill.completed {
          background: #28a745;
          border-color: #28a745;
          color: white;
        }

        .step-pill i {
          font-size: 18px;
        }

        .step-content {
          min-height: 400px;
          animation: fadeInUp 0.4s ease;
        }

        @keyframes fadeInUp {
          from {
            opacity: 0;
            transform: translateY(20px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }

        /* Torre Visualization */
        .tower-container {
          background: linear-gradient(180deg, #e3f2fd 0%, #f5f5f5 100%);
          border-radius: 15px;
          padding: 20px;
          max-height: 500px;
          overflow-y: auto;
        }

        .piso-row {
          display: flex;
          align-items: center;
          gap: 15px;
          margin-bottom: 12px;
          animation: slideInRight 0.3s ease;
        }

        @keyframes slideInRight {
          from {
            opacity: 0;
            transform: translateX(-20px);
          }
          to {
            opacity: 1;
            transform: translateX(0);
          }
        }

        .piso-label {
          min-width: 70px;
          text-align: right;
          font-weight: 700;
          font-size: 14px;
          color: #495057;
        }

        .oficinas-container {
          display: flex;
          gap: 8px;
          flex-wrap: wrap;
        }

        .oficina-box {
          width: 55px;
          height: 45px;
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          border: 3px solid white;
          border-radius: 8px;
          display: flex;
          align-items: center;
          justify-content: center;
          color: white;
          font-size: 12px;
          font-weight: 700;
          box-shadow: 0 4px 8px rgba(102, 126, 234, 0.3);
          transition: all 0.2s ease;
          cursor: pointer;
        }

        .oficina-box:hover {
          transform: translateY(-3px);
          box-shadow: 0 6px 12px rgba(102, 126, 234, 0.4);
        }

        .sotano-row {
          display: flex;
          align-items: center;
          gap: 15px;
          margin-bottom: 10px;
        }

        .sotano-label {
          min-width: 70px;
          text-align: right;
          font-weight: 700;
          font-size: 13px;
          color: #6c757d;
        }

        .parking-container {
          flex: 1;
        }

        .parking-box {
          background: linear-gradient(135deg, #95a5a6 0%, #7f8c8d 100%);
          border: 3px solid white;
          border-radius: 8px;
          padding: 12px 20px;
          color: white;
          font-size: 13px;
          font-weight: 600;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 8px;
          box-shadow: 0 3px 6px rgba(0,0,0,0.2);
        }

        /* Cards mejoradas */
        .info-card {
          background: white;
          border-radius: 15px;
          padding: 20px;
          box-shadow: 0 3px 10px rgba(0,0,0,0.1);
          margin-bottom: 20px;
        }

        .info-card-header {
          background: linear-gradient(135deg, #f093fb 0%, #f5576c 100%);
          color: white;
          padding: 15px 20px;
          border-radius: 10px 10px 0 0;
          font-weight: 700;
          margin: -20px -20px 15px -20px;
        }

        .stat-row {
          display: flex;
          justify-content: space-between;
          padding: 12px 0;
          border-bottom: 1px solid #f0f0f0;
        }

        .stat-row:last-child {
          border-bottom: none;
        }

        .stat-label {
          color: #6c757d;
          font-weight: 600;
        }

        .stat-value {
          color: #212529;
          font-weight: 700;
        }

        .stat-value.primary {
          color: #667eea;
          font-size: 18px;
        }

        /* Alert mejorado */
        .wizard-alert {
          background: linear-gradient(135deg, #667eea15 0%, #764ba215 100%);
          border: 2px solid #667eea;
          border-radius: 12px;
          padding: 20px;
          margin-bottom: 25px;
        }

        .wizard-alert h5 {
          color: #667eea;
          font-weight: 700;
          margin-bottom: 15px;
        }

        /* Toggle mejorado */
        .form-check-input:checked {
          background-color: #667eea;
          border-color: #667eea;
        }

        /* Inputs mejorados */
        .wizard-input {
          border: 2px solid #e9ecef;
          border-radius: 10px;
          padding: 12px 15px;
          transition: all 0.3s ease;
        }

        .wizard-input:focus {
          border-color: #667eea;
          box-shadow: 0 0 0 0.2rem rgba(102, 126, 234, 0.25);
        }

        /* Tabla mejorada */
        .wizard-table {
          border-radius: 10px;
          overflow: hidden;
        }

        .wizard-table thead {
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          color: white;
        }

        .wizard-table tbody tr:hover {
          background: #f8f9fa;
        }

        /* Footer */
        .building-wizard-footer {
          background: #f8f9fa;
          padding: 20px 30px;
          border-top: 2px solid #e9ecef;
          display: flex;
          justify-content: space-between;
          gap: 15px;
        }

        .wizard-btn {
          padding: 12px 30px;
          border-radius: 50px;
          font-weight: 600;
          transition: all 0.3s ease;
          border: none;
        }

        .wizard-btn-primary {
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          color: white;
        }

        .wizard-btn-primary:hover {
          transform: translateY(-2px);
          box-shadow: 0 5px 15px rgba(102, 126, 234, 0.3);
        }

        .wizard-btn-secondary {
          background: #6c757d;
          color: white;
        }

        .wizard-btn-success {
          background: linear-gradient(135deg, #28a745 0%, #20c997 100%);
          color: white;
        }

        .wizard-btn-success:hover {
          transform: translateY(-2px);
          box-shadow: 0 5px 15px rgba(40, 167, 69, 0.3);
        }
      </style>
    `;
  }

  /**
   * 📋 Header del modal
   */
  getHeader() {
    return `
      <div class="modal-header building-wizard-header">
        <h5 class="modal-title">
          <i class="fas fa-building me-2"></i>
          Registro Masivo de Edificio Completo
        </h5>
        <button type="button" class="btn-close btn-close-white" data-bs-dismiss="modal" onclick="window.buildingWizardModal.close()"></button>
      </div>
    `;
  }

  /**
   * 📊 Indicador de pasos
   */
  getStepIndicator() {
    return `
      <div class="step-indicator">
        <ul class="step-pills">
          <li class="step-pill ${this.step === 1 ? 'active' : ''} ${this.step > 1 ? 'completed' : ''}">
            <i class="fas ${this.step > 1 ? 'fa-check-circle' : 'fa-info-circle'}"></i>
            <span class="d-none d-md-inline">Confirmar</span>
          </li>
          <li class="step-pill ${this.step === 2 ? 'active' : ''} ${this.step > 2 ? 'completed' : ''}">
            <i class="fas ${this.step > 2 ? 'fa-check-circle' : 'fa-ruler-combined'}"></i>
            <span class="d-none d-md-inline">Metraje</span>
          </li>
          <li class="step-pill ${this.step === 3 ? 'active' : ''}">
            <i class="fas fa-parking"></i>
            <span class="d-none d-md-inline">Sótanos</span>
          </li>
        </ul>
      </div>
    `;
  }

  /**
   * 📄 Contenido según paso
   */
  getStepContent() {
    switch (this.step) {
      case 1: return this.getStep1HTML();
      case 2: return this.getStep2HTML();
      case 3: return this.getStep3HTML();
      default: return '';
    }
  }

  /**
   * 📋 STEP 1: Confirmación
   */
  getStep1HTML() {
    const { cantidad_pisos, cantidad_oficinas_por_piso, cantidad_sotanos } = this.buildingData.caracteristicas;
    const totalOficinas = parseInt(cantidad_pisos) * parseInt(cantidad_oficinas_por_piso);

    return `
      <div class="row">
        <div class="col-md-6">
          <div class="wizard-alert">
            <h5><i class="fas fa-question-circle me-2"></i>¿Crear oficinas automáticamente?</h5>
            <p class="mb-2">
              Has configurado <strong>${cantidad_pisos} pisos</strong> con
              <strong>${cantidad_oficinas_por_piso} oficinas por piso</strong>.
            </p>
            <p class="mb-0">
              Se crearán <strong class="text-primary" style="font-size: 20px">${totalOficinas} oficinas</strong> automáticamente.
            </p>
            ${cantidad_sotanos > 0 ? `
              <p class="mb-0 mt-3">
                <i class="fas fa-arrow-down me-2"></i>
                También se configurarán <strong>${cantidad_sotanos} sótanos</strong> para parqueos.
              </p>
            ` : ''}
          </div>

          <div class="info-card">
            <div class="info-card-header">
              <i class="fas fa-building me-2"></i>Resumen del Edificio
            </div>
            <div class="stat-row">
              <span class="stat-label"><i class="fas fa-tag me-2"></i>Nombre</span>
              <span class="stat-value">${this.buildingData.nombre_inmueble}</span>
            </div>
            <div class="stat-row">
              <span class="stat-label"><i class="fas fa-map-marker-alt me-2"></i>Dirección</span>
              <span class="stat-value">${this.buildingData.direccion}</span>
            </div>
            <div class="stat-row">
              <span class="stat-label"><i class="fas fa-layer-group me-2"></i>Pisos</span>
              <span class="stat-value">${cantidad_pisos}</span>
            </div>
            <div class="stat-row">
              <span class="stat-label"><i class="fas fa-door-open me-2"></i>Oficinas/Piso</span>
              <span class="stat-value">${cantidad_oficinas_por_piso}</span>
            </div>
            <div class="stat-row">
              <span class="stat-label"><i class="fas fa-hashtag me-2"></i>Total Oficinas</span>
              <span class="stat-value primary">${totalOficinas}</span>
            </div>
            ${cantidad_sotanos > 0 ? `
              <div class="stat-row">
                <span class="stat-label"><i class="fas fa-arrow-down me-2"></i>Sótanos</span>
                <span class="stat-value">${cantidad_sotanos}</span>
              </div>
            ` : ''}
          </div>
        </div>

        <div class="col-md-6">
          <div class="info-card">
            <div class="info-card-header">
              <i class="fas fa-building me-2"></i>Visualización de Torre
            </div>
            <div class="tower-container">
              ${this.renderTowerVisualization(cantidad_pisos, cantidad_oficinas_por_piso, cantidad_sotanos)}
            </div>
          </div>
        </div>
      </div>
    `;
  }

  /**
   * 🏗️ Visualización de torre ÉPICA
   */
  renderTowerVisualization(pisos, oficinasPorPiso, sotanos) {
    let html = '';

    // Pisos (de arriba hacia abajo)
    for (let piso = parseInt(pisos); piso >= 1; piso--) {
      html += `
        <div class="piso-row" style="animation-delay: ${(parseInt(pisos) - piso) * 0.05}s">
          <div class="piso-label">Piso ${piso}</div>
          <div class="oficinas-container">
      `;

      for (let ofi = 1; ofi <= parseInt(oficinasPorPiso); ofi++) {
        const oficinaNum = ((piso - 1) * parseInt(oficinasPorPiso)) + ofi;
        html += `<div class="oficina-box" title="Oficina ${oficinaNum}">${oficinaNum}</div>`;
      }

      html += `</div></div>`;
    }

    // Sótanos
    if (sotanos > 0) {
      html += '<div class="my-3" style="border-top: 3px dashed #dee2e6;"></div>';

      for (let sotano = 1; sotano <= parseInt(sotanos); sotano++) {
        html += `
          <div class="sotano-row">
            <div class="sotano-label">Sótano ${sotano}</div>
            <div class="parking-container">
              <div class="parking-box">
                <i class="fas fa-car"></i>
                Parqueos
              </div>
            </div>
          </div>
        `;
      }
    }

    return html;
  }

  /**
   * 📏 STEP 2: Metraje
   */
  getStep2HTML() {
    const { cantidad_pisos, cantidad_oficinas_por_piso } = this.buildingData.caracteristicas;
    const totalOficinas = parseInt(cantidad_pisos) * parseInt(cantidad_oficinas_por_piso);

    return `
      <div class="wizard-alert">
        <h5><i class="fas fa-ruler-combined me-2"></i>Configuración de Metraje</h5>
        <p class="mb-0">
          Elige cómo asignar el área a las ${totalOficinas} oficinas.
        </p>
      </div>

      <div class="mb-4">
        <div class="form-check form-switch" style="font-size: 16px;">
          <input class="form-check-input" type="checkbox" id="mismo-metraje-check" checked style="width: 50px; height: 25px;">
          <label class="form-check-label fw-bold" for="mismo-metraje-check">
            Usar el mismo metraje para todas las oficinas
          </label>
        </div>
      </div>

      <!-- Metraje único -->
      <div id="metraje-unico-container">
        <div class="row">
          <div class="col-md-4">
            <label class="form-label fw-bold">
              <i class="fas fa-expand-arrows-alt me-2"></i>Metraje (m²)
            </label>
            <input type="number" class="form-control wizard-input" id="metraje-unico"
                   placeholder="Ej: 45.50" step="0.01" min="10" value="">
          </div>
        </div>
        <small class="text-muted mt-2 d-block">
          Este metraje se aplicará a las <strong>${totalOficinas} oficinas</strong>
        </small>
      </div>

      <!-- Metraje individual -->
      <div id="metraje-individual-container" style="display: none;">
        <div class="table-responsive wizard-table">
          <table class="table table-hover">
            <thead>
              <tr>
                <th style="width: 80px;">Piso</th>
                <th style="width: 100px;">Oficina</th>
                <th>Metraje (m²)</th>
              </tr>
            </thead>
            <tbody id="metraje-individual-tbody">
              ${this.renderMetrajeIndividualRows(cantidad_pisos, cantidad_oficinas_por_piso)}
            </tbody>
          </table>
        </div>
      </div>
    `;
  }

  /**
   * 📋 Filas de metraje individual
   */
  renderMetrajeIndividualRows(pisos, oficinasPorPiso) {
    let html = '';
    let oficinaGlobal = 1;

    for (let piso = 1; piso <= parseInt(pisos); piso++) {
      for (let ofi = 1; ofi <= parseInt(oficinasPorPiso); ofi++) {
        html += `
          <tr>
            <td class="text-center fw-bold">${piso}</td>
            <td>Oficina ${ofi}</td>
            <td>
              <input type="number" class="form-control wizard-input metraje-individual-input"
                     data-piso="${piso}" data-oficina="${ofi}" data-global="${oficinaGlobal}"
                     placeholder="Ej: 45.50" step="0.01" min="10">
            </td>
          </tr>
        `;
        oficinaGlobal++;
      }
    }

    return html;
  }

  /**
   * 🅿️ STEP 3: Sótanos
   */
  getStep3HTML() {
    const { cantidad_sotanos } = this.buildingData.caracteristicas;

    if (!cantidad_sotanos || cantidad_sotanos == 0) {
      return `
        <div class="wizard-alert text-center" style="background: #f093fb15; border-color: #f093fb;">
          <h5 style="color: #f093fb;"><i class="fas fa-info-circle me-2"></i>Sin Sótanos</h5>
          <p class="mb-0">Este edificio no tiene sótanos configurados.</p>
        </div>
      `;
    }

    return `
      <div class="wizard-alert">
        <h5><i class="fas fa-parking me-2"></i>Configuración de Sótanos</h5>
        <p class="mb-0">
          Define la cantidad de parqueos disponibles en cada sótano.
        </p>
      </div>

      <div class="table-responsive wizard-table">
        <table class="table table-hover">
          <thead>
            <tr>
              <th style="width: 150px;">Sótano</th>
              <th>Cantidad de Parqueos</th>
            </tr>
          </thead>
          <tbody>
            ${this.renderSotanosRows(cantidad_sotanos)}
          </tbody>
        </table>
      </div>
    `;
  }

  /**
   * 📋 Filas de sótanos
   */
  renderSotanosRows(cantidadSotanos) {
    let html = '';

    for (let sotano = 1; sotano <= parseInt(cantidadSotanos); sotano++) {
      html += `
        <tr>
          <td class="fw-bold">
            <i class="fas fa-arrow-down me-2" style="color: #6c757d;"></i>
            Sótano ${sotano}
          </td>
          <td>
            <input type="number" class="form-control wizard-input parqueos-input"
                   data-sotano="${sotano}"
                   placeholder="Ej: 20" min="0" step="1" value="0">
          </td>
        </tr>
      `;
    }

    return html;
  }

  /**
   * 🔘 Footer con botones
   */
  getFooter() {
    let buttons = '';

    if (this.step === 1) {
      buttons = `
        <button type="button" class="wizard-btn wizard-btn-secondary" onclick="window.buildingWizardModal.close()">
          <i class="fas fa-times me-2"></i>No, solo edificio
        </button>
        <button type="button" class="wizard-btn wizard-btn-primary" id="btn-next-step">
          Sí, crear oficinas<i class="fas fa-arrow-right ms-2"></i>
        </button>
      `;
    } else if (this.step === 2) {
      const hasSotanos = this.buildingData.caracteristicas.cantidad_sotanos > 0;
      buttons = `
        <button type="button" class="wizard-btn wizard-btn-secondary" id="btn-prev-step">
          <i class="fas fa-arrow-left me-2"></i>Anterior
        </button>
        <button type="button" class="wizard-btn wizard-btn-primary" id="btn-next-step">
          ${hasSotanos ? 'Siguiente: Sótanos' : 'Finalizar'}
          <i class="fas fa-arrow-right ms-2"></i>
        </button>
      `;
    } else if (this.step === 3) {
      buttons = `
        <button type="button" class="wizard-btn wizard-btn-secondary" id="btn-prev-step">
          <i class="fas fa-arrow-left me-2"></i>Anterior
        </button>
        <button type="button" class="wizard-btn wizard-btn-success" id="btn-finish">
          <i class="fas fa-check me-2"></i>Crear Edificio Completo
        </button>
      `;
    }

    return `<div class="building-wizard-footer">${buttons}</div>`;
  }

  /**
   * 🔗 Event listeners
   */
  attachEventListeners() {
    const btnNext = document.getElementById('btn-next-step');
    const btnPrev = document.getElementById('btn-prev-step');
    const btnFinish = document.getElementById('btn-finish');
    const mismoMetrajeCheck = document.getElementById('mismo-metraje-check');

    if (btnNext) btnNext.addEventListener('click', () => this.nextStep());
    if (btnPrev) btnPrev.addEventListener('click', () => this.prevStep());
    if (btnFinish) btnFinish.addEventListener('click', () => this.finish());

    if (mismoMetrajeCheck) {
      mismoMetrajeCheck.addEventListener('change', (e) => {
        const unicoContainer = document.getElementById('metraje-unico-container');
        const individualContainer = document.getElementById('metraje-individual-container');

        if (e.target.checked) {
          unicoContainer.style.display = 'block';
          individualContainer.style.display = 'none';
        } else {
          unicoContainer.style.display = 'none';
          individualContainer.style.display = 'block';
        }
      });
    }
  }

  /**
   * ➡️ Siguiente paso
   */
  nextStep() {
    if (this.step === 1) {
      this.step = 2;
      this.render();
    } else if (this.step === 2) {
      if (!this.validateMetraje()) return;

      if (this.buildingData.caracteristicas.cantidad_sotanos > 0) {
        this.step = 3;
        this.render();
      } else {
        this.finish();
      }
    }
  }

  /**
   * ⬅️ Paso anterior
   */
  prevStep() {
    if (this.step > 1) {
      this.step--;
      this.render();
    }
  }

  /**
   * ✅ Validar metraje
   */
  validateMetraje() {
    const mismoMetraje = document.getElementById('mismo-metraje-check').checked;

    if (mismoMetraje) {
      const metrajeUnico = document.getElementById('metraje-unico').value;
      if (!metrajeUnico || parseFloat(metrajeUnico) < 10) {
        Swal.fire({
          icon: 'warning',
          title: 'Metraje requerido',
          text: 'Debes ingresar el metraje (mínimo 10 m²)'
        });
        return false;
      }
    } else {
      const inputs = document.querySelectorAll('.metraje-individual-input');
      let valid = true;

      inputs.forEach(input => {
        if (!input.value || parseFloat(input.value) < 10) {
          input.classList.add('is-invalid');
          valid = false;
        } else {
          input.classList.remove('is-invalid');
        }
      });

      if (!valid) {
        Swal.fire({
          icon: 'warning',
          title: 'Metraje incompleto',
          text: 'Debes completar el metraje de todas las oficinas (mínimo 10 m²)'
        });
        return false;
      }
    }

    return true;
  }

  /**
   * ✅ Finalizar
   */
  finish() {
    this.oficinas = this.collectOficinasData();

    if (this.buildingData.caracteristicas.cantidad_sotanos > 0) {
      this.sotanos = this.collectSotanosData();
    }

    const finalData = {
      edificio: this.buildingData,
      oficinas: this.oficinas,
      sotanos: this.sotanos
    };

    console.log('🏢 Datos finales:', finalData);

    if (this.onConfirm) {
      this.onConfirm(finalData);
    }

    this.close();
  }

  /**
   * 📊 Recopilar datos de oficinas
   */
  collectOficinasData() {
    const { cantidad_pisos, cantidad_oficinas_por_piso } = this.buildingData.caracteristicas;
    const mismoMetraje = document.getElementById('mismo-metraje-check')?.checked;
    const oficinas = [];

    if (mismoMetraje) {
      const metrajeUnico = parseFloat(document.getElementById('metraje-unico').value);
      let oficinaGlobal = 1;

      for (let piso = 1; piso <= parseInt(cantidad_pisos); piso++) {
        for (let ofi = 1; ofi <= parseInt(cantidad_oficinas_por_piso); ofi++) {
          oficinas.push({
            piso: piso,
            numero_oficina: ofi,
            nombre: `Oficina ${oficinaGlobal} - Piso ${piso}`,
            area: metrajeUnico
          });
          oficinaGlobal++;
        }
      }
    } else {
      const inputs = document.querySelectorAll('.metraje-individual-input');
      inputs.forEach(input => {
        const piso = parseInt(input.dataset.piso);
        const oficina = parseInt(input.dataset.oficina);
        const global = parseInt(input.dataset.global);
        const area = parseFloat(input.value);

        oficinas.push({
          piso: piso,
          numero_oficina: oficina,
          nombre: `Oficina ${global} - Piso ${piso}`,
          area: area
        });
      });
    }

    return oficinas;
  }

  /**
   * 🅿️ Recopilar datos de sótanos
   */
  collectSotanosData() {
    const sotanos = [];
    const inputs = document.querySelectorAll('.parqueos-input');

    inputs.forEach(input => {
      const sotano = parseInt(input.dataset.sotano);
      const parqueos = parseInt(input.value) || 0;

      sotanos.push({
        nivel: sotano,
        parqueos: parqueos
      });
    });

    return sotanos;
  }

  /**
   * ❌ Cerrar modal
   */
  close() {
    const modal = document.getElementById('building-wizard-modal');
    if (modal) {
      if (typeof window.bootstrap !== 'undefined') {
        const bsModal = window.bootstrap.Modal.getInstance(modal);
        if (bsModal) {
          bsModal.hide();
        }
      } else {
        modal.classList.remove('show');
        modal.style.display = 'none';
        document.body.classList.remove('modal-open');

        const backdrop = document.getElementById('building-wizard-backdrop');
        if (backdrop) {
          backdrop.remove();
        }
      }
    }
    this.isOpen = false;
  }
}

// Exportar instancia global
window.buildingWizardModal = new BuildingWizardModal();

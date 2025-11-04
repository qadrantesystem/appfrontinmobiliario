/**
 * 💳 Suscripciones Tab - Gestión de planes y pagos
 * Archivo: tabs/subscripciones/subscripciones.js
 * Multipaso: Selección → Pago → Confirmación
 */

class SubscripcionesTab {
  constructor(app) {
    this.app = app;
    this.currentStep = 1;
    this.totalSteps = 3;
    this.selectedPlan = null;
    this.planes = [];
    this.currentSuscripcion = null;
  }

  /**
   * Renderizar tab de Suscripciones
   */
  async render() {
    console.log('💳 Renderizando tab SUSCRIPCIONES...');

    // Cargar planes y suscripción actual
    await this.loadPlanes();
    await this.loadCurrentSuscripcion();

    return `
      <div class="suscripciones-container">
        <!-- Header -->
        <div class="suscripciones-header">
          <h2 class="suscripciones-title">💳 Planes y Suscripciones</h2>
          <p class="suscripciones-subtitle">Elige el plan que mejor se adapte a tus necesidades</p>
        </div>

        <!-- Suscripción Actual -->
        ${this.renderCurrentSuscripcion()}

        <!-- Stepper Multipaso -->
        <div class="stepper-container" style="display: ${this.currentSuscripcion ? 'none' : 'block'};">
          ${this.renderStepper()}
        </div>

        <!-- Contenido según el paso -->
        <div class="step-content" id="stepContent">
          ${this.renderStepContent()}
        </div>
      </div>
    `;
  }

  /**
   * Renderizar suscripción actual
   */
  renderCurrentSuscripcion() {
    if (!this.currentSuscripcion) {
      return '';
    }

    const { plan_nombre, estado, fecha_fin } = this.currentSuscripcion;
    const fechaFin = new Date(fecha_fin).toLocaleDateString('es-PE');
    const diasRestantes = Math.ceil((new Date(fecha_fin) - new Date()) / (1000 * 60 * 60 * 24));

    const estadoClass = estado === 'activa' ? 'success' : estado === 'cancelada' ? 'error' : 'warning';
    const estadoEmoji = estado === 'activa' ? '✅' : estado === 'cancelada' ? '❌' : '⏳';

    return `
      <div class="current-suscripcion-card">
        <div class="current-susc-header">
          <h3>📋 Tu Suscripción Actual</h3>
          <span class="badge badge-${estadoClass}">${estadoEmoji} ${estado.toUpperCase()}</span>
        </div>
        <div class="current-susc-body">
          <div class="susc-info">
            <div class="susc-info-item">
              <span class="susc-label">Plan:</span>
              <span class="susc-value">${plan_nombre}</span>
            </div>
            <div class="susc-info-item">
              <span class="susc-label">Vence:</span>
              <span class="susc-value">${fechaFin} (${diasRestantes} días)</span>
            </div>
          </div>
          <div class="susc-actions">
            <button class="btn-secondary" onclick="window.currentSubscripcionesTab.showRenovar()">
              🔄 Renovar Plan
            </button>
            <button class="btn-outline" onclick="window.currentSubscripcionesTab.showCambiarPlan()">
              🔀 Cambiar Plan
            </button>
          </div>
        </div>
      </div>
    `;
  }

  /**
   * Renderizar stepper multipaso
   */
  renderStepper() {
    const steps = [
      { num: 1, label: 'Seleccionar Plan', icon: '📋' },
      { num: 2, label: 'Método de Pago', icon: '💳' },
      { num: 3, label: 'Confirmación', icon: '✅' }
    ];

    return `
      <div class="stepper">
        ${steps.map(step => {
          const isActive = this.currentStep === step.num;
          const isCompleted = this.currentStep > step.num;
          const stepClass = isActive ? 'active' : isCompleted ? 'completed' : '';

          return `
            <div class="step ${stepClass}">
              <div class="step-circle">
                ${isCompleted ? '✓' : step.icon}
              </div>
              <span class="step-label">${step.label}</span>
            </div>
            ${step.num < steps.length ? '<div class="step-line"></div>' : ''}
          `;
        }).join('')}
      </div>
    `;
  }

  /**
   * Renderizar contenido según paso actual
   */
  renderStepContent() {
    switch(this.currentStep) {
      case 1:
        return this.renderStep1_Planes();
      case 2:
        return this.renderStep2_Pago();
      case 3:
        return this.renderStep3_Confirmacion();
      default:
        return '<p>Paso no disponible</p>';
    }
  }

  /**
   * PASO 1: Selección de Planes
   */
  renderStep1_Planes() {
    return `
      <div class="planes-grid">
        ${this.planes.map(plan => this.renderPlanCard(plan)).join('')}
      </div>
    `;
  }

  /**
   * Renderizar tarjeta de plan
   */
  renderPlanCard(plan) {
    const caracteristicas = typeof plan.caracteristicas === 'string'
      ? JSON.parse(plan.caracteristicas)
      : plan.caracteristicas;

    const precio = parseFloat(plan.precio_mensual);
    const isGratuito = precio === 0;
    const isPopular = plan.nombre.toLowerCase() === 'profesional';
    const isPremium = plan.nombre.toLowerCase() === 'empresarial';

    const gradientClass = isGratuito ? 'gradient-blue' :
                         isPopular ? 'gradient-green' :
                         isPremium ? 'gradient-purple' : 'gradient-blue';

    return `
      <div class="plan-card ${isPopular ? 'plan-popular' : ''} ${isPremium ? 'plan-premium' : ''}">
        ${isPopular ? '<div class="plan-badge">⭐ MÁS POPULAR</div>' : ''}
        ${isPremium ? '<div class="plan-badge plan-badge-premium">👑 PREMIUM</div>' : ''}

        <div class="plan-header ${gradientClass}">
          <h3 class="plan-name">${plan.nombre}</h3>
          <div class="plan-price">
            ${isGratuito ?
              '<span class="price-amount">GRATIS</span>' :
              `<span class="price-currency">S/</span>
               <span class="price-amount">${precio.toFixed(2)}</span>
               <span class="price-period">/mes</span>`
            }
          </div>
          <p class="plan-description">${plan.descripcion}</p>
        </div>

        <div class="plan-body">
          <ul class="plan-features">
            <li class="feature-item">
              <span class="feature-icon">🏠</span>
              <span>${plan.max_propiedades === -1 ? 'Propiedades ilimitadas' : `Hasta ${plan.max_propiedades} propiedades`}</span>
            </li>
            <li class="feature-item">
              <span class="feature-icon">📸</span>
              <span>${plan.max_imagenes_por_propiedad === -1 ? 'Imágenes ilimitadas' : `${plan.max_imagenes_por_propiedad} imágenes por propiedad`}</span>
            </li>
            ${plan.destacar_propiedades ? `
              <li class="feature-item">
                <span class="feature-icon">⭐</span>
                <span>Destacar propiedades</span>
              </li>
            ` : ''}
            ${caracteristicas && caracteristicas.length > 0 ?
              caracteristicas.map(car => `
                <li class="feature-item">
                  <span class="feature-icon">✓</span>
                  <span>${car}</span>
                </li>
              `).join('')
              : ''
            }
          </ul>

          <button
            class="btn-plan ${isPopular ? 'btn-primary' : 'btn-outline'}"
            onclick="window.currentSubscripcionesTab.selectPlan(${plan.plan_id})"
            ${isGratuito ? 'disabled' : ''}
          >
            ${isGratuito ? 'Plan Actual' : isPopular ? '🚀 Elegir Plan' : 'Seleccionar'}
          </button>
        </div>
      </div>
    `;
  }

  /**
   * PASO 2: Método de Pago
   */
  renderStep2_Pago() {
    if (!this.selectedPlan) {
      return '<p>Error: No se ha seleccionado un plan</p>';
    }

    const precio = parseFloat(this.selectedPlan.precio_mensual);

    return `
      <div class="payment-container">
        <div class="payment-summary">
          <h3>📋 Resumen del Pedido</h3>
          <div class="summary-row">
            <span>Plan:</span>
            <span class="summary-value">${this.selectedPlan.nombre}</span>
          </div>
          <div class="summary-row">
            <span>Período:</span>
            <span class="summary-value">1 mes</span>
          </div>
          <div class="summary-row summary-total">
            <span>Total:</span>
            <span class="summary-value">S/ ${precio.toFixed(2)}</span>
          </div>
        </div>

        <div class="payment-methods">
          <h3>💳 Método de Pago</h3>

          <div class="payment-method-card" onclick="window.currentSubscripcionesTab.selectPaymentMethod('culqi')">
            <div class="payment-method-icon">
              <svg xmlns="http://www.w3.org/2000/svg" width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <rect x="1" y="4" width="22" height="16" rx="2" ry="2"></rect>
                <line x1="1" y1="10" x2="23" y2="10"></line>
              </svg>
            </div>
            <div class="payment-method-info">
              <h4>Tarjeta de Crédito/Débito</h4>
              <p>Pago seguro con Culqi</p>
            </div>
            <div class="payment-method-badge">
              <span class="badge badge-success">Recomendado</span>
            </div>
          </div>

          <div class="payment-method-card disabled">
            <div class="payment-method-icon">
              <svg xmlns="http://www.w3.org/2000/svg" width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M12 2v20M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"></path>
              </svg>
            </div>
            <div class="payment-method-info">
              <h4>Yape / Plin</h4>
              <p>Próximamente disponible</p>
            </div>
          </div>
        </div>

        <div class="payment-actions">
          <button class="btn-secondary" onclick="window.currentSubscripcionesTab.prevStep()">
            ← Atrás
          </button>
          <button class="btn-primary" onclick="window.currentSubscripcionesTab.nextStep()">
            Continuar →
          </button>
        </div>
      </div>
    `;
  }

  /**
   * PASO 3: Confirmación
   */
  renderStep3_Confirmacion() {
    return `
      <div class="confirmation-container">
        <div class="confirmation-icon">
          <svg xmlns="http://www.w3.org/2000/svg" width="80" height="80" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path>
            <polyline points="22 4 12 14.01 9 11.01"></polyline>
          </svg>
        </div>
        <h2 class="confirmation-title">¡Suscripción Exitosa!</h2>
        <p class="confirmation-message">
          Tu plan <strong>${this.selectedPlan?.nombre}</strong> ha sido activado correctamente.
        </p>
        <div class="confirmation-actions">
          <button class="btn-primary" onclick="window.location.reload()">
            ✓ Finalizar
          </button>
        </div>
      </div>
    `;
  }

  /**
   * Cargar planes desde el backend
   */
  async loadPlanes() {
    try {
      const token = this.app.authService?.getToken() || localStorage.getItem('token');
      const response = await fetch(`${API_CONFIG.BASE_URL}/planes/`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });

      if (response.ok) {
        this.planes = await response.json();
        console.log('✅ Planes cargados:', this.planes);
      }
    } catch (error) {
      console.error('❌ Error cargando planes:', error);
      showNotification('Error al cargar planes', 'error');
    }
  }

  /**
   * Cargar suscripción actual del usuario
   */
  async loadCurrentSuscripcion() {
    try {
      const token = this.app.authService?.getToken() || localStorage.getItem('token');
      const response = await fetch(`${API_CONFIG.BASE_URL}/suscripciones/me`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });

      if (response.ok) {
        const suscripciones = await response.json();
        // Obtener la suscripción activa
        this.currentSuscripcion = suscripciones.find(s => s.estado === 'activa');
        console.log('✅ Suscripción actual:', this.currentSuscripcion);
      }
    } catch (error) {
      console.error('❌ Error cargando suscripción:', error);
    }
  }

  /**
   * Seleccionar un plan
   */
  selectPlan(planId) {
    this.selectedPlan = this.planes.find(p => p.plan_id === planId);
    console.log('✅ Plan seleccionado:', this.selectedPlan);
    this.nextStep();
  }

  /**
   * Seleccionar método de pago
   */
  selectPaymentMethod(method) {
    console.log('💳 Método de pago:', method);
    if (method === 'culqi') {
      this.processCulqiPayment();
    }
  }

  /**
   * Procesar pago con Culqi
   */
  async processCulqiPayment() {
    try {
      showNotification('Procesando pago con Culqi...', 'info');

      // Aquí iría la integración con Culqi
      // Por ahora simulamos el pago
      await new Promise(resolve => setTimeout(resolve, 2000));

      // Crear suscripción en el backend
      await this.createSuscripcion();

      // Ir al paso de confirmación
      this.nextStep();

    } catch (error) {
      console.error('❌ Error procesando pago:', error);
      showNotification('Error al procesar el pago', 'error');
    }
  }

  /**
   * Crear suscripción en el backend
   */
  async createSuscripcion() {
    try {
      const token = this.app.authService?.getToken() || localStorage.getItem('token');
      const fechaInicio = new Date();
      const fechaFin = new Date();
      fechaFin.setMonth(fechaFin.getMonth() + 1);

      const response = await fetch(`${API_CONFIG.BASE_URL}/suscripciones/`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          plan_id: this.selectedPlan.plan_id,
          fecha_inicio: fechaInicio.toISOString(),
          fecha_fin: fechaFin.toISOString(),
          monto_pagado: this.selectedPlan.precio_mensual,
          metodo_pago: 'culqi',
          transaccion_id: `TXN_${Date.now()}`,
          auto_renovar: true
        })
      });

      if (response.ok) {
        console.log('✅ Suscripción creada');
        showNotification('¡Suscripción activada exitosamente!', 'success');
      } else {
        throw new Error('Error al crear suscripción');
      }
    } catch (error) {
      console.error('❌ Error creando suscripción:', error);
      throw error;
    }
  }

  /**
   * Siguiente paso
   */
  nextStep() {
    if (this.currentStep < this.totalSteps) {
      this.currentStep++;
      this.updateContent();
    }
  }

  /**
   * Paso anterior
   */
  prevStep() {
    if (this.currentStep > 1) {
      this.currentStep--;
      this.updateContent();
    }
  }

  /**
   * Actualizar contenido del paso
   */
  updateContent() {
    const stepContent = document.getElementById('stepContent');
    const stepper = document.querySelector('.stepper');

    if (stepContent) {
      stepContent.innerHTML = this.renderStepContent();
    }

    if (stepper) {
      stepper.innerHTML = this.renderStepper();
    }
  }

  /**
   * Mostrar opción renovar
   */
  showRenovar() {
    this.currentSuscripcion = null;
    this.currentStep = 1;
    this.app.router.navigate('subscripciones');
  }

  /**
   * Mostrar cambiar plan
   */
  showCambiarPlan() {
    this.currentSuscripcion = null;
    this.currentStep = 1;
    this.app.router.navigate('subscripciones');
  }

  /**
   * Setup después del render
   */
  async afterRender() {
    console.log('✅ SubscripcionesTab renderizado');
    window.currentSubscripcionesTab = this;
  }

  /**
   * Cleanup al salir del tab
   */
  async destroy() {
    console.log('🧹 Limpiando SubscripcionesTab...');
    window.currentSubscripcionesTab = null;
  }
}

// Exponer globalmente
window.SubscripcionesTab = SubscripcionesTab;

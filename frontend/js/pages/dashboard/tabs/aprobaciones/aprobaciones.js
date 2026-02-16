/**
 * Aprobaciones Tab - Workflow de aprobación de corredores (Admin)
 * Archivo: tabs/aprobaciones/aprobaciones.js
 *
 * Muestra dos secciones:
 *   1. Corredores Pendientes (tarjetas con acciones aprobar/rechazar)
 *   2. Corredores Aprobados (tabla con datos de comisión y vigencia)
 */

class AprobacionesTab {
  constructor(app) {
    this.app = app;
    this.stats = { pendientes: 0, aprobados: 0, rechazados: 0, total: 0 };
    this.corredoresPendientes = [];
    this.corredoresAprobados = [];
  }

  /**
   * Cargar datos desde API (stats, pendientes y aprobados en paralelo)
   */
  async cargarDatos() {
    try {
      const headers = { 'Authorization': `Bearer ${authService.getToken()}` };

      const [statsRes, pendientesRes, aprobadosRes] = await Promise.all([
        fetch(`${API_CONFIG.BASE_URL}/corredores/stats`, { headers }),
        fetch(`${API_CONFIG.BASE_URL}/corredores/pendientes`, { headers }),
        fetch(`${API_CONFIG.BASE_URL}/corredores/aprobados`, { headers })
      ]);

      const statsData = await statsRes.json();
      const pendientesData = await pendientesRes.json();
      const aprobadosData = await aprobadosRes.json();

      if (statsData.success) this.stats = statsData.data;
      if (pendientesData.success) this.corredoresPendientes = pendientesData.data;
      if (aprobadosData.success) this.corredoresAprobados = aprobadosData.data;

    } catch (error) {
      console.error('Error cargando datos de corredores:', error);
    }
  }

  /**
   * Renderizar tab de Aprobaciones
   */
  async render() {
    await this.cargarDatos();

    const statsHTML = this.renderStats();
    const listaPendientesHTML = this.renderListaPendientes();
    const tablaAprobadosHTML = this.renderTablaAprobados();

    return `
      <div class="tab-header">
        <h2>Aprobaciones de Corredores</h2>
        <p class="tab-subtitle">Revisa, aprueba o rechaza corredores para que puedan operar en Qadrante</p>
      </div>

      <div class="approvals-section">
        <div class="approvals-stats">
          ${statsHTML}
        </div>

        <div id="corredores-pendientes-container">
          ${listaPendientesHTML}
        </div>

        <div id="corredores-aprobados-container">
          ${tablaAprobadosHTML}
        </div>
      </div>
    `;
  }

  /**
   * Renderizar tarjetas de estadísticas
   */
  renderStats() {
    return `
      <div class="stat-card stat-card--warning">
        <div class="stat-icon">${this.getIcon('clock')}</div>
        <div class="stat-info">
          <span class="stat-value">${this.stats.pendientes}</span>
          <span class="stat-label">Pendientes</span>
        </div>
      </div>
      <div class="stat-card stat-card--success">
        <div class="stat-icon">${this.getIcon('check-circle')}</div>
        <div class="stat-info">
          <span class="stat-value">${this.stats.aprobados}</span>
          <span class="stat-label">Aprobados</span>
        </div>
      </div>
      <div class="stat-card stat-card--danger">
        <div class="stat-icon">${this.getIcon('x-circle')}</div>
        <div class="stat-info">
          <span class="stat-value">${this.stats.rechazados}</span>
          <span class="stat-label">Rechazados</span>
        </div>
      </div>
    `;
  }

  /**
   * Renderizar lista de corredores pendientes (tarjetas)
   */
  renderListaPendientes() {
    if (this.corredoresPendientes.length === 0) {
      return `
        <div class="empty-state-inline">
          ${this.getIcon('check-circle')}
          <span>No hay corredores pendientes — todos procesados</span>
        </div>
      `;
    }

    const cards = this.corredoresPendientes.map(corredor => this.renderCorredorCard(corredor)).join('');

    return `
      <h3 class="section-title">Corredores pendientes de aprobación</h3>
      <div class="corredores-grid">
        ${cards}
      </div>
    `;
  }

  /**
   * Renderizar tarjeta individual de corredor pendiente
   */
  renderCorredorCard(corredor) {
    const iniciales = `${(corredor.nombre || '')[0] || ''}${(corredor.apellido || '')[0] || ''}`.toUpperCase();
    const fechaRegistro = corredor.fecha_registro
      ? new Date(corredor.fecha_registro).toLocaleDateString('es-PE', { day: '2-digit', month: 'short', year: 'numeric' })
      : 'Sin fecha';

    return `
      <div class="corredor-card" data-id="${corredor.usuario_id}">
        <div class="corredor-card__header">
          <div class="corredor-card__avatar">${iniciales}</div>
          <div class="corredor-card__nombre">
            <strong>${corredor.nombre} ${corredor.apellido}</strong>
            <span class="corredor-card__badge">Pendiente</span>
          </div>
        </div>
        <div class="corredor-card__body">
          <div class="corredor-card__detalle">
            ${this.getIcon('mail')}
            <span>${corredor.email}</span>
          </div>
          <div class="corredor-card__detalle">
            ${this.getIcon('id-card')}
            <span>DNI: ${corredor.dni || 'No registrado'}</span>
          </div>
          <div class="corredor-card__detalle">
            ${this.getIcon('phone')}
            <span>${corredor.telefono || 'No registrado'}</span>
          </div>
          <div class="corredor-card__detalle">
            ${this.getIcon('calendar')}
            <span>Registrado: ${fechaRegistro}</span>
          </div>
        </div>
        <div class="corredor-card__actions">
          <button class="btn-aprobar" data-id="${corredor.usuario_id}" data-nombre="${corredor.nombre} ${corredor.apellido}">
            ${this.getIcon('check-circle')} Aprobar
          </button>
          <button class="btn-rechazar" data-id="${corredor.usuario_id}" data-nombre="${corredor.nombre} ${corredor.apellido}">
            ${this.getIcon('x-circle')} Rechazar
          </button>
        </div>
      </div>
    `;
  }

  /**
   * Renderizar tabla de corredores aprobados
   */
  renderTablaAprobados() {
    if (this.corredoresAprobados.length === 0) {
      return `
        <div class="empty-state empty-state--aprobados">
          ${this.getIcon('check-circle')}
          <h3>Sin corredores aprobados</h3>
          <p>Los corredores aprobados aparecerán aquí</p>
        </div>
      `;
    }

    const filas = this.corredoresAprobados.map(corredor => {
      const nombreCompleto = `${corredor.nombre || ''} ${corredor.apellido || ''}`.trim();
      const email = corredor.email || '-';
      const comision = corredor.comision_porcentaje != null
        ? `${corredor.comision_porcentaje}%`
        : '-';
      const vigencia = corredor.fecha_vigencia_corredor
        ? this.formatearFecha(corredor.fecha_vigencia_corredor)
        : '-';
      const fechaAprobacion = corredor.aprobado_at
        ? this.formatearFecha(corredor.aprobado_at)
        : '-';

      return `
        <tr class="corredor-aprobado-row">
          <td data-label="Nombre">${nombreCompleto}</td>
          <td data-label="Email">${email}</td>
          <td data-label="Comisión">${comision}</td>
          <td data-label="Vigencia">${vigencia}</td>
          <td data-label="Aprobado el">${fechaAprobacion}</td>
        </tr>
      `;
    }).join('');

    return `
      <h3 class="section-title">Corredores aprobados</h3>
      <div class="tabla-aprobados-wrapper">
        <table class="corredores-aprobados-table">
          <thead>
            <tr>
              <th>Nombre Completo</th>
              <th>Email</th>
              <th>Comisión %</th>
              <th>Vigencia</th>
              <th>Aprobado el</th>
            </tr>
          </thead>
          <tbody>
            ${filas}
          </tbody>
        </table>
      </div>
    `;
  }

  /**
   * Formatear fecha a dd/MMM/yyyy en español (es-PE)
   */
  formatearFecha(fechaStr) {
    try {
      const fecha = new Date(fechaStr);
      return fecha.toLocaleDateString('es-PE', {
        day: '2-digit',
        month: 'short',
        year: 'numeric'
      });
    } catch {
      return '-';
    }
  }

  /**
   * Setup event listeners después del render
   */
  async afterRender() {
    document.querySelectorAll('.btn-aprobar').forEach(btn => {
      btn.addEventListener('click', () => {
        const id = btn.dataset.id;
        const nombre = btn.dataset.nombre;
        this.mostrarModalAprobar(id, nombre);
      });
    });

    document.querySelectorAll('.btn-rechazar').forEach(btn => {
      btn.addEventListener('click', () => {
        const id = btn.dataset.id;
        const nombre = btn.dataset.nombre;
        this.mostrarModalRechazar(id, nombre);
      });
    });
  }

  /**
   * Modal SweetAlert2 para aprobar corredor
   */
  async mostrarModalAprobar(corredorId, nombreCorredor) {
    const { value: formValues } = await Swal.fire({
      title: `Aprobar a ${nombreCorredor}`,
      html: `
        <div style="text-align:left; margin-bottom:8px;">
          <label style="font-weight:600; display:block; margin-bottom:4px;">Comisión Qadrante (%)</label>
          <input id="swal-comision" type="number" step="0.01" min="0.01" max="100" placeholder="Ej: 3.50"
                 class="swal2-input" style="margin:0; width:100%;">
        </div>
        <div style="text-align:left; margin-top:12px;">
          <label style="font-weight:600; display:block; margin-bottom:4px;">Vigencia hasta</label>
          <input id="swal-vigencia" type="date" class="swal2-input" style="margin:0; width:100%;"
                 min="${new Date().toISOString().split('T')[0]}">
        </div>
      `,
      focusConfirm: false,
      showCancelButton: true,
      confirmButtonText: 'Aprobar',
      cancelButtonText: 'Cancelar',
      confirmButtonColor: '#28a745',
      preConfirm: () => {
        const comision = parseFloat(document.getElementById('swal-comision').value);
        const vigencia = document.getElementById('swal-vigencia').value;

        if (!comision || comision <= 0 || comision > 100) {
          Swal.showValidationMessage('Ingresa un porcentaje válido (0.01 - 100)');
          return false;
        }
        if (!vigencia) {
          Swal.showValidationMessage('Selecciona una fecha de vigencia');
          return false;
        }

        return { comision_porcentaje: comision, fecha_vigencia_corredor: `${vigencia}T23:59:59` };
      }
    });

    if (formValues) {
      await this.ejecutarAprobacion(corredorId, formValues);
    }
  }

  /**
   * Modal SweetAlert2 para rechazar corredor
   */
  async mostrarModalRechazar(corredorId, nombreCorredor) {
    const { value: motivo } = await Swal.fire({
      title: `Rechazar a ${nombreCorredor}`,
      input: 'textarea',
      inputLabel: 'Motivo del rechazo',
      inputPlaceholder: 'Describe el motivo del rechazo (mínimo 10 caracteres)...',
      inputAttributes: { 'aria-label': 'Motivo del rechazo' },
      showCancelButton: true,
      confirmButtonText: 'Rechazar',
      cancelButtonText: 'Cancelar',
      confirmButtonColor: '#dc3545',
      inputValidator: (value) => {
        if (!value || value.trim().length < 10) {
          return 'El motivo debe tener al menos 10 caracteres';
        }
      }
    });

    if (motivo) {
      await this.ejecutarRechazo(corredorId, motivo.trim());
    }
  }

  /**
   * Llamar API para aprobar corredor
   */
  async ejecutarAprobacion(corredorId, datos) {
    try {
      const response = await fetch(`${API_CONFIG.BASE_URL}/corredores/${corredorId}/aprobar`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${authService.getToken()}`
        },
        body: JSON.stringify(datos)
      });

      const result = await response.json();

      if (result.success) {
        await Swal.fire({
          icon: 'success',
          title: 'Corredor aprobado',
          text: result.message,
          timer: 2000,
          showConfirmButton: false
        });
        await this.recargarTab();
      } else {
        Swal.fire('Error', result.detail || result.message || 'No se pudo aprobar', 'error');
      }
    } catch (error) {
      console.error('Error aprobando corredor:', error);
      Swal.fire('Error', 'Error de conexión al aprobar corredor', 'error');
    }
  }

  /**
   * Llamar API para rechazar corredor
   */
  async ejecutarRechazo(corredorId, motivo) {
    try {
      const response = await fetch(`${API_CONFIG.BASE_URL}/corredores/${corredorId}/rechazar`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${authService.getToken()}`
        },
        body: JSON.stringify({ motivo_rechazo: motivo })
      });

      const result = await response.json();

      if (result.success) {
        await Swal.fire({
          icon: 'info',
          title: 'Corredor rechazado',
          text: result.message,
          timer: 2000,
          showConfirmButton: false
        });
        await this.recargarTab();
      } else {
        Swal.fire('Error', result.detail || result.message || 'No se pudo rechazar', 'error');
      }
    } catch (error) {
      console.error('Error rechazando corredor:', error);
      Swal.fire('Error', 'Error de conexión al rechazar corredor', 'error');
    }
  }

  /**
   * Recargar el tab completo después de una acción
   */
  async recargarTab() {
    const container = document.querySelector('.tab-content') || document.querySelector('#tab-content');
    if (container) {
      container.innerHTML = await this.render();
      await this.afterRender();
    }
  }

  /**
   * Cleanup al salir del tab
   */
  async destroy() {
    this.corredoresPendientes = [];
    this.corredoresAprobados = [];
    this.stats = { pendientes: 0, aprobados: 0, rechazados: 0, total: 0 };
  }

  /**
   * Obtener iconos SVG
   */
  getIcon(type) {
    const icons = {
      'clock': '<svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"></circle><polyline points="12 6 12 12 16 14"></polyline></svg>',
      'check-circle': '<svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path><polyline points="22 4 12 14.01 9 11.01"></polyline></svg>',
      'x-circle': '<svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"></circle><line x1="15" y1="9" x2="9" y2="15"></line><line x1="9" y1="9" x2="15" y2="15"></line></svg>',
      'mail': '<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"></path><polyline points="22,6 12,13 2,6"></polyline></svg>',
      'id-card': '<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="2" y="5" width="20" height="14" rx="2"></rect><line x1="2" y1="10" x2="22" y2="10"></line></svg>',
      'phone': '<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"></path></svg>',
      'calendar': '<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect><line x1="16" y1="2" x2="16" y2="6"></line><line x1="8" y1="2" x2="8" y2="6"></line><line x1="3" y1="10" x2="21" y2="10"></line></svg>'
    };
    return icons[type] || '';
  }
}

// Exponer globalmente
window.AprobacionesTab = AprobacionesTab;

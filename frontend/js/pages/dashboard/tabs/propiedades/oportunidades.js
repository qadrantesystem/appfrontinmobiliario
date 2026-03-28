/**
 * Oportunidades - Bandeja de leads/contactos entrantes
 * Solo visible para Corredor (perfil 3) y Admin (perfil 4)
 * Simple: Nuevo (sin leer) o Atendido (leido)
 */
class OportunidadesTab {
  constructor(app) {
    this.app = app;
    this.contactos = [];
    this.filtroEstado = null;
    this.page = 1;
    this.limit = 20;
    this.totales = {};
  }

  async render() {
    await this.loadContactos();
    return this.renderHTML();
  }

  async loadContactos() {
    try {
      const token = authService.getToken();
      const params = new URLSearchParams({ page: this.page, limit: this.limit });
      if (this.filtroEstado) params.append('estado', this.filtroEstado);

      const response = await fetch(`${API_CONFIG.BASE_URL}/contactos/mis-oportunidades?${params}`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });

      if (!response.ok) throw new Error('Error cargando oportunidades');
      const data = await response.json();
      this.contactos = data.data || [];
      this.totales = data.totales || {};
      this.pagination = data.pagination || {};
    } catch (error) {
      console.error('Error cargando oportunidades:', error);
      this.contactos = [];
    }
  }

  renderHTML() {
    const totalNuevos = this.totales.nuevo || 0;
    const totalAtendidos = (this.totales.atendido || 0) + (this.totales.en_negociacion || 0) + (this.totales.cerrado || 0);
    const total = this.totales.total || 0;

    return `
      <div class="oportunidades-container">
        <!-- Filtros simples -->
        <div style="display: flex; gap: 8px; margin-bottom: 16px; flex-wrap: wrap;">
          ${this.renderBadge('todos', 'Todos', total, null)}
          ${this.renderBadge('nuevo', 'Sin leer', totalNuevos, '#ef4444')}
          ${this.renderBadge('atendido', 'Leidos', totalAtendidos, '#10b981')}
        </div>

        <!-- Lista -->
        ${total === 0 ? this.renderEmpty() : ''}
        <div class="oportunidades-list" style="display: flex; flex-direction: column; gap: 10px;">
          ${this.contactos.map(c => this.renderCard(c)).join('')}
        </div>
      </div>
    `;
  }

  renderBadge(estado, label, count, color) {
    const isActive = this.filtroEstado === estado || (!this.filtroEstado && estado === 'todos');
    const bgColor = isActive ? (color || 'var(--azul-corporativo)') : '#f1f5f9';
    const textColor = isActive ? 'white' : '#64748b';

    return `
      <button class="oportunidad-filtro" data-filtro-estado="${estado}"
              style="padding: 6px 14px; border-radius: 20px; border: none; cursor: pointer;
                     background: ${bgColor}; color: ${textColor}; font-size: 0.75rem;
                     font-weight: 600; display: flex; align-items: center; gap: 4px;
                     transition: all 0.2s;">
        ${label} <span style="background: ${isActive ? 'rgba(255,255,255,0.3)' : '#e2e8f0'};
                              padding: 1px 6px; border-radius: 10px; font-size: 0.7rem;">${count}</span>
      </button>
    `;
  }

  renderCard(c) {
    const esNuevo = c.estado === 'nuevo';
    const tiempoAtras = this.tiempoRelativo(c.created_at);

    return `
      <div class="oportunidad-card" data-contacto-id="${c.contacto_id}"
           style="background: ${esNuevo ? '#fffbeb' : 'white'}; border: 1px solid ${esNuevo ? '#fbbf24' : '#e2e8f0'};
                  border-radius: 10px; border-left: 4px solid ${esNuevo ? '#ef4444' : '#10b981'};
                  padding: 12px; transition: all 0.2s;">

        <!-- Header -->
        <div style="display: flex; justify-content: space-between; align-items: flex-start; gap: 8px; margin-bottom: 8px; flex-wrap: wrap;">
          <div style="flex: 1; min-width: 0;">
            <div style="display: flex; align-items: center; gap: 6px;">
              <span style="font-size: 1rem;">${esNuevo ? '🔴' : '✅'}</span>
              <span style="font-weight: 700; color: var(--azul-corporativo); font-size: 0.9rem;">${c.nombre}</span>
            </div>
            <div style="font-size: 0.72rem; color: #9ca3af; margin-top: 2px;">${tiempoAtras}</div>
          </div>
          ${esNuevo ? `
            <button class="btn-atender-lead" data-contacto-id="${c.contacto_id}"
                    style="padding: 5px 12px; background: var(--azul-corporativo); color: white;
                           border: none; border-radius: 6px; font-size: 0.72rem; font-weight: 600;
                           cursor: pointer; flex-shrink: 0;">
              Marcar leido
            </button>
          ` : `
            <span style="padding: 3px 8px; background: #ecfdf5; color: #10b981; border-radius: 4px;
                         font-size: 0.65rem; font-weight: 600; flex-shrink: 0;">Leido</span>
          `}
        </div>

        <!-- Propiedad -->
        <div style="display: flex; align-items: center; gap: 6px; margin-bottom: 8px; padding: 6px 8px;
                    background: #f8fafc; border-radius: 6px; font-size: 0.78rem;">
          ${c.propiedad_imagen ? `<img src="${c.propiedad_imagen}" style="width: 32px; height: 32px; border-radius: 4px; object-fit: cover; flex-shrink: 0;">` : ''}
          <div style="min-width: 0; flex: 1;">
            <div style="font-weight: 600; color: #374151; white-space: nowrap; overflow: hidden; text-overflow: ellipsis;">${c.propiedad_titulo}</div>
          </div>
        </div>

        <!-- Mensaje -->
        ${c.mensaje ? `
          <div style="font-size: 0.78rem; color: #4b5563; line-height: 1.4; margin-bottom: 8px;
                      padding: 6px 8px; background: white; border-radius: 6px; border: 1px solid #e2e8f0;">
            "${c.mensaje.substring(0, 150)}${c.mensaje.length > 150 ? '...' : ''}"
          </div>
        ` : ''}

        <!-- Contacto -->
        <div style="display: flex; gap: 6px; flex-wrap: wrap;">
          ${c.telefono ? `
            <a href="tel:${c.telefono}" style="display: inline-flex; align-items: center; gap: 4px; padding: 4px 10px;
                  background: #ecfdf5; color: #059669; border-radius: 4px; font-size: 0.72rem; font-weight: 600;
                  text-decoration: none; border: 1px solid #a7f3d0;">
              📞 ${c.telefono}
            </a>
          ` : ''}
          ${c.email ? `
            <a href="mailto:${c.email}" style="display: inline-flex; align-items: center; gap: 4px; padding: 4px 10px;
                  background: #eff6ff; color: #2563eb; border-radius: 4px; font-size: 0.72rem; font-weight: 600;
                  text-decoration: none; border: 1px solid #bfdbfe; max-width: 100%; overflow: hidden; text-overflow: ellipsis;">
              📧 ${c.email}
            </a>
          ` : ''}
        </div>
      </div>
    `;
  }

  renderEmpty() {
    return `
      <div style="text-align: center; padding: 40px 20px; color: #9ca3af;">
        <div style="font-size: 3rem; margin-bottom: 12px;">📭</div>
        <h3 style="margin: 0 0 8px; color: #6b7280;">Sin oportunidades</h3>
        <p style="margin: 0; font-size: 0.85rem;">Cuando alguien contacte tus propiedades, apareceran aqui.</p>
      </div>
    `;
  }

  setupListeners() {
    // Filtros
    document.querySelectorAll('.oportunidad-filtro').forEach(btn => {
      btn.addEventListener('click', async () => {
        const estado = btn.dataset.filtroEstado;
        this.filtroEstado = estado === 'todos' ? null : estado;
        this.page = 1;
        await this.refresh();
      });
    });

    // Boton marcar leido
    document.querySelectorAll('.btn-atender-lead').forEach(btn => {
      btn.addEventListener('click', async (e) => {
        e.stopPropagation();
        await this.marcarLeido(parseInt(btn.dataset.contactoId));
      });
    });
  }

  async marcarLeido(contactoId) {
    try {
      const token = authService.getToken();
      const response = await fetch(`${API_CONFIG.BASE_URL}/contactos/${contactoId}/estado?estado=atendido`, {
        method: 'PATCH',
        headers: { 'Authorization': `Bearer ${token}` }
      });

      if (response.ok) {
        await this.refresh();
        // Actualizar badge
        const badge = document.getElementById('badgeOportunidades');
        if (badge) {
          const nuevos = Math.max(0, (this.totales.nuevo || 0));
          if (nuevos > 0) {
            badge.textContent = nuevos;
          } else {
            badge.style.display = 'none';
          }
        }
      }
    } catch (error) {
      console.error('Error marcando leido:', error);
    }
  }

  async refresh() {
    await this.loadContactos();
    const container = document.querySelector('.oportunidades-container');
    if (container) {
      container.outerHTML = this.renderHTML();
      this.setupListeners();
    }
  }

  tiempoRelativo(fecha) {
    if (!fecha) return '';
    const now = new Date();
    const date = new Date(fecha);
    const diff = Math.floor((now - date) / 1000);

    if (diff < 60) return 'Hace un momento';
    if (diff < 3600) return `Hace ${Math.floor(diff / 60)} min`;
    if (diff < 86400) return `Hace ${Math.floor(diff / 3600)} horas`;
    if (diff < 604800) return `Hace ${Math.floor(diff / 86400)} dias`;
    return date.toLocaleDateString('es-PE', { day: '2-digit', month: 'short' });
  }
}

if (typeof window !== 'undefined') {
  window.OportunidadesTab = OportunidadesTab;
}

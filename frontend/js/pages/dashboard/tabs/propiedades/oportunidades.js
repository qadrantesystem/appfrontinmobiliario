/**
 * Oportunidades - Sub-tab de leads/contactos entrantes
 * Solo visible para Corredor (perfil 3) y Admin (perfil 4)
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
    const total = this.totales.total || 0;

    return `
      <div class="oportunidades-container">
        <!-- Contadores por estado -->
        <div style="display: flex; gap: 8px; margin-bottom: 16px; flex-wrap: wrap;">
          ${this.renderBadge('todos', 'Todos', total, null)}
          ${this.renderBadge('nuevo', 'Nuevos', this.totales.nuevo || 0, '#ef4444')}
          ${this.renderBadge('atendido', 'Atendidos', this.totales.atendido || 0, '#f59e0b')}
          ${this.renderBadge('en_negociacion', 'Negociando', this.totales.en_negociacion || 0, '#3b82f6')}
          ${this.renderBadge('cerrado', 'Cerrados', this.totales.cerrado || 0, '#10b981')}
        </div>

        <!-- Lista de leads -->
        ${total === 0 ? this.renderEmpty() : ''}
        <div class="oportunidades-list" style="display: flex; flex-direction: column; gap: 12px;">
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
                     transition: all 0.2s; min-width: fit-content;">
        ${label} <span style="background: ${isActive ? 'rgba(255,255,255,0.3)' : '#e2e8f0'};
                              padding: 1px 6px; border-radius: 10px; font-size: 0.7rem;">${count}</span>
      </button>
    `;
  }

  renderCard(c) {
    const estadoConfig = {
      'nuevo': { color: '#ef4444', bg: '#fef2f2', icon: '🔴', label: 'Nuevo' },
      'atendido': { color: '#f59e0b', bg: '#fffbeb', icon: '🟡', label: 'Atendido' },
      'en_negociacion': { color: '#3b82f6', bg: '#eff6ff', icon: '🔵', label: 'Negociando' },
      'cerrado': { color: '#10b981', bg: '#ecfdf5', icon: '🟢', label: 'Cerrado' }
    }[c.estado] || { color: '#6b7280', bg: '#f9fafb', icon: '⚪', label: c.estado };

    const tiempoAtras = this.tiempoRelativo(c.created_at);

    return `
      <div class="oportunidad-card" data-contacto-id="${c.contacto_id}"
           style="background: white; border: 1px solid #e2e8f0; border-radius: 10px;
                  border-left: 4px solid ${estadoConfig.color}; padding: 12px;
                  transition: all 0.2s; cursor: pointer;"
           onmouseover="this.style.boxShadow='0 4px 12px rgba(0,0,0,0.1)'; this.style.transform='translateY(-1px)'"
           onmouseout="this.style.boxShadow='none'; this.style.transform='none'">

        <!-- Header: nombre + estado + tiempo -->
        <div style="display: flex; justify-content: space-between; align-items: flex-start; gap: 8px; margin-bottom: 8px; flex-wrap: wrap;">
          <div style="flex: 1; min-width: 0;">
            <div style="font-weight: 700; color: var(--azul-corporativo); font-size: 0.9rem; white-space: nowrap; overflow: hidden; text-overflow: ellipsis;">
              ${c.nombre}
            </div>
            <div style="font-size: 0.75rem; color: #9ca3af;">${tiempoAtras}</div>
          </div>
          <span style="background: ${estadoConfig.bg}; color: ${estadoConfig.color}; padding: 2px 8px;
                       border-radius: 4px; font-size: 0.65rem; font-weight: 600; flex-shrink: 0;">
            ${estadoConfig.icon} ${estadoConfig.label}
          </span>
        </div>

        <!-- Propiedad -->
        <div style="display: flex; align-items: center; gap: 6px; margin-bottom: 8px; padding: 6px 8px;
                    background: #f8fafc; border-radius: 6px; font-size: 0.78rem;">
          ${c.propiedad_imagen ? `<img src="${c.propiedad_imagen}" style="width: 36px; height: 36px; border-radius: 4px; object-fit: cover; flex-shrink: 0;">` : ''}
          <div style="min-width: 0; flex: 1;">
            <div style="font-weight: 600; color: #374151; white-space: nowrap; overflow: hidden; text-overflow: ellipsis;">${c.propiedad_titulo}</div>
            ${c.propiedad_direccion ? `<div style="font-size: 0.7rem; color: #9ca3af; white-space: nowrap; overflow: hidden; text-overflow: ellipsis;">${c.propiedad_direccion}</div>` : ''}
          </div>
        </div>

        <!-- Mensaje -->
        ${c.mensaje ? `
          <div style="font-size: 0.78rem; color: #4b5563; line-height: 1.4; margin-bottom: 8px;
                      padding: 6px 8px; background: #fefce8; border-radius: 6px; border-left: 3px solid #fbbf24;">
            "${c.mensaje.substring(0, 120)}${c.mensaje.length > 120 ? '...' : ''}"
          </div>
        ` : ''}

        <!-- Acciones -->
        <div style="display: flex; gap: 6px; flex-wrap: wrap;">
          ${c.telefono ? `
            <a href="tel:${c.telefono}" style="display: inline-flex; align-items: center; gap: 4px; padding: 4px 10px;
                  background: #ecfdf5; color: #059669; border-radius: 4px; font-size: 0.7rem; font-weight: 600;
                  text-decoration: none; border: 1px solid #a7f3d0;">
              📞 ${c.telefono}
            </a>
          ` : ''}
          ${c.email ? `
            <a href="mailto:${c.email}" style="display: inline-flex; align-items: center; gap: 4px; padding: 4px 10px;
                  background: #eff6ff; color: #2563eb; border-radius: 4px; font-size: 0.7rem; font-weight: 600;
                  text-decoration: none; border: 1px solid #bfdbfe;">
              📧 Email
            </a>
          ` : ''}
          ${c.estado === 'nuevo' ? `
            <button class="btn-atender-lead" data-contacto-id="${c.contacto_id}"
                    style="display: inline-flex; align-items: center; gap: 4px; padding: 4px 10px;
                           background: var(--azul-corporativo); color: white; border: none; border-radius: 4px;
                           font-size: 0.7rem; font-weight: 600; cursor: pointer;">
              ✅ Marcar Atendido
            </button>
          ` : ''}
          <select class="select-estado-lead" data-contacto-id="${c.contacto_id}"
                  style="padding: 4px 8px; border: 1px solid #e2e8f0; border-radius: 4px;
                         font-size: 0.7rem; color: #374151; cursor: pointer; background: white;">
            <option value="nuevo" ${c.estado === 'nuevo' ? 'selected' : ''}>Nuevo</option>
            <option value="atendido" ${c.estado === 'atendido' ? 'selected' : ''}>Atendido</option>
            <option value="en_negociacion" ${c.estado === 'en_negociacion' ? 'selected' : ''}>Negociando</option>
            <option value="cerrado" ${c.estado === 'cerrado' ? 'selected' : ''}>Cerrado</option>
          </select>
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
    // Filtros por estado
    document.querySelectorAll('.oportunidad-filtro').forEach(btn => {
      btn.addEventListener('click', async () => {
        const estado = btn.dataset.filtroEstado;
        this.filtroEstado = estado === 'todos' ? null : estado;
        this.page = 1;
        await this.refresh();
      });
    });

    // Boton atender
    document.querySelectorAll('.btn-atender-lead').forEach(btn => {
      btn.addEventListener('click', async (e) => {
        e.stopPropagation();
        await this.cambiarEstado(parseInt(btn.dataset.contactoId), 'atendido');
      });
    });

    // Select cambiar estado
    document.querySelectorAll('.select-estado-lead').forEach(select => {
      select.addEventListener('change', async (e) => {
        e.stopPropagation();
        await this.cambiarEstado(parseInt(select.dataset.contactoId), select.value);
      });
    });
  }

  async cambiarEstado(contactoId, estado) {
    try {
      const token = authService.getToken();
      const response = await fetch(`${API_CONFIG.BASE_URL}/contactos/${contactoId}/estado?estado=${estado}`, {
        method: 'PATCH',
        headers: { 'Authorization': `Bearer ${token}` }
      });

      if (response.ok) {
        showNotification(`Lead actualizado a "${estado}"`, 'success');
        await this.refresh();
      }
    } catch (error) {
      console.error('Error cambiando estado:', error);
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

/**
 * 👥 Users Module - CRUD Completo de Usuarios
 * Gestión de usuarios con búsqueda, filtros y estadísticas mensuales
 */
class UsersModule {
  constructor(maintenanceController) {
    this.maintenanceController = maintenanceController;
    this.usuarios = [];
    this.perfiles = [];
    this.estados = ['activo', 'inactivo', 'suspendido', 'pendiente'];
    this.stats = {}; // Estadísticas por perfil
    this.filters = {
      search: '',
      perfil_id: null,
      estado: null,
      mes: null
    };
    this.pagination = {
      page: 1,
      limit: 10,
      total: 0,
      total_pages: 0
    };
    window.usersModule = this;
    console.log('👥 UsersModule constructor');
  }

  async render() {
    try {
      console.log('📋 UsersModule render() iniciado');

      // Cargar perfiles para filtros
      await this.loadPerfiles();

      const html = `
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
              <h2>Gestión de Usuarios</h2>
              <p>Administra usuarios del sistema</p>
            </div>
          </div>

          <div class="module-content">
            <!-- Estadísticas por perfil -->
            <div class="stats-grid">
              ${this.renderStats()}
            </div>

            <!-- Filtros -->
            <div class="filters-bar">
              <div class="filter-group">
                <label>
                  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <circle cx="11" cy="11" r="8"></circle>
                    <path d="m21 21-4.35-4.35"></path>
                  </svg>
                  <input
                    type="text"
                    id="searchInput"
                    placeholder="Buscar por nombre, apellido o email..."
                    value="${this.filters.search}"
                    onkeyup="window.usersModule.handleSearch(this.value)"
                  />
                </label>
              </div>

              <div class="filter-group">
                <select id="perfilFilter" onchange="window.usersModule.handleFilterChange('perfil_id', this.value)">
                  <option value="">Todos los perfiles</option>
                  ${this.perfiles.map(p => `<option value="${p.perfil_id}" ${this.filters.perfil_id == p.perfil_id ? 'selected' : ''}>${p.nombre}</option>`).join('')}
                </select>
              </div>

              <div class="filter-group">
                <select id="estadoFilter" onchange="window.usersModule.handleFilterChange('estado', this.value)">
                  <option value="">Todos los estados</option>
                  ${this.estados.map(e => `<option value="${e}" ${this.filters.estado === e ? 'selected' : ''}>${this.capitalizeFirst(e)}</option>`).join('')}
                </select>
              </div>

              <div class="filter-group">
                <select id="mesFilter" onchange="window.usersModule.handleFilterChange('mes', this.value)">
                  <option value="">Todos los meses</option>
                  ${this.generateMonthOptions()}
                </select>
              </div>

              <button class="btn btn-outline" onclick="window.usersModule.clearFilters()">
                Limpiar filtros
              </button>
            </div>

            <!-- Tabla de usuarios -->
            <div class="table-container" id="usersTableContainer">
              ${this.renderLoadingState()}
            </div>
          </div>
        </div>
      `;

      // Cargar usuarios después de renderizar
      setTimeout(() => this.loadUsuarios(), 100);

      return html;
    } catch(e) {
      console.error('❌ Error en render():', e);
      return `<div class="error-message">Error: ${e.message}</div>`;
    }
  }

  renderStats() {
    const colors = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444'];
    
    return this.perfiles.map((perfil, index) => {
      const count = this.stats[perfil.perfil_id] || 0;
      const color = colors[index % colors.length];
      
      return `
        <div class="stat-card" style="border-left-color: ${color}">
          <div class="stat-icon" style="background: ${color}20; color: ${color}">
            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path>
              <circle cx="9" cy="7" r="4"></circle>
              <path d="M23 21v-2a4 4 0 0 0-3-3.87"></path>
              <path d="M16 3.13a4 4 0 0 1 0 7.75"></path>
            </svg>
          </div>
          <div class="stat-info">
            <h4>${perfil.nombre}</h4>
            <p class="stat-number">${count}</p>
            <p class="stat-label">usuarios</p>
          </div>
        </div>
      `;
    }).join('');
  }

  renderLoadingState() {
    return `
      <div class="loading-state">
        <div class="spinner"></div>
        <p>Cargando usuarios...</p>
      </div>
    `;
  }

  renderTable() {
    if (this.usuarios.length === 0) {
      return `
        <div class="empty-state">
          <svg xmlns="http://www.w3.org/2000/svg" width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
            <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path>
            <circle cx="9" cy="7" r="4"></circle>
            <path d="M23 21v-2a4 4 0 0 0-3-3.87"></path>
            <path d="M16 3.13a4 4 0 0 1 0 7.75"></path>
          </svg>
          <p>No se encontraron usuarios</p>
        </div>
      `;
    }

    return `
      <table class="data-table">
        <thead>
          <tr>
            <th>ID</th>
            <th>Email</th>
            <th>Nombre Completo</th>
            <th>Teléfono</th>
            <th>Perfil</th>
            <th>Estado</th>
            <th>Plan</th>
            <th>Fecha Registro</th>
            <th>Acciones</th>
          </tr>
        </thead>
        <tbody>
          ${this.usuarios.map(u => this.renderUserRow(u)).join('')}
        </tbody>
      </table>

      <!-- Paginación -->
      <div class="pagination">
        <button
          class="btn btn-outline btn-sm"
          ${this.pagination.page === 1 ? 'disabled' : ''}
          onclick="window.usersModule.goToPage(${this.pagination.page - 1})"
        >
          Anterior
        </button>

        <span class="pagination-info">
          Página ${this.pagination.page} de ${this.pagination.total_pages}
          (${this.pagination.total} usuarios)
        </span>

        <button
          class="btn btn-outline btn-sm"
          ${this.pagination.page === this.pagination.total_pages ? 'disabled' : ''}
          onclick="window.usersModule.goToPage(${this.pagination.page + 1})"
        >
          Siguiente
        </button>
      </div>
    `;
  }

  renderUserRow(usuario) {
    const estadoClass = this.getEstadoClass(usuario.estado);
    const fechaRegistro = new Date(usuario.fecha_registro).toLocaleDateString('es-PE', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });

    return `
      <tr>
        <td>${usuario.usuario_id}</td>
        <td>${usuario.email}</td>
        <td>${usuario.nombre} ${usuario.apellido}</td>
        <td>${usuario.telefono || '-'}</td>
        <td>
          <span class="badge badge-info">${usuario.perfil_nombre}</span>
        </td>
        <td>
          <span class="badge ${estadoClass}">${this.capitalizeFirst(usuario.estado)}</span>
        </td>
        <td>${usuario.plan_actual || '-'}</td>
        <td>${fechaRegistro}</td>
        <td>
          <div class="action-buttons">
            <button
              class="btn-icon"
              title="Cambiar perfil"
              onclick="window.usersModule.showChangeProfileModal(${usuario.usuario_id}, ${usuario.perfil_id}, '${usuario.nombre} ${usuario.apellido}')"
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path>
                <circle cx="9" cy="7" r="4"></circle>
                <path d="M23 21v-2a4 4 0 0 0-3-3.87"></path>
                <path d="M16 3.13a4 4 0 0 1 0 7.75"></path>
              </svg>
            </button>
            <button
              class="btn-icon ${usuario.estado === 'activo' ? 'btn-warning' : 'btn-success'}"
              title="${usuario.estado === 'activo' ? 'Suspender' : 'Activar'}"
              onclick="window.usersModule.toggleUserStatus(${usuario.usuario_id}, '${usuario.estado}')"
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                ${usuario.estado === 'activo'
                  ? '<path d="M18.36 6.64a9 9 0 1 1-12.73 0"></path><line x1="12" y1="2" x2="12" y2="12"></line>'
                  : '<polyline points="20 6 9 17 4 12"></polyline>'
                }
              </svg>
            </button>
          </div>
        </td>
      </tr>
    `;
  }

  getEstadoClass(estado) {
    const classes = {
      'activo': 'badge-success',
      'inactivo': 'badge-secondary',
      'suspendido': 'badge-danger',
      'pendiente': 'badge-warning'
    };
    return classes[estado] || 'badge-secondary';
  }

  capitalizeFirst(str) {
    return str.charAt(0).toUpperCase() + str.slice(1);
  }

  generateMonthOptions() {
    const meses = [
      'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
      'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'
    ];
    const currentYear = new Date().getFullYear();
    let options = '';

    for (let year = currentYear; year >= currentYear - 2; year--) {
      meses.forEach((mes, index) => {
        const value = `${year}-${String(index + 1).padStart(2, '0')}`;
        const selected = this.filters.mes === value ? 'selected' : '';
        options += `<option value="${value}" ${selected}>${mes} ${year}</option>`;
      });
    }

    return options;
  }

  async loadPerfiles() {
    try {
      console.log('🔄 Cargando perfiles...');
      const response = await maintenanceService.request('/perfiles-mae', 'GET');
      this.perfiles = response.data || response || [];
      console.log('✅ Perfiles cargados:', this.perfiles.length);
    } catch(e) {
      console.error('❌ Error cargando perfiles:', e);
      this.perfiles = [];
    }
  }

  async loadUsuarios() {
    try {
      console.log('🔄 Cargando usuarios...');

      // Construir query params
      const params = new URLSearchParams({
        page: this.pagination.page,
        limit: this.pagination.limit
      });

      if (this.filters.search) params.append('search', this.filters.search);
      if (this.filters.perfil_id) params.append('perfil_id', this.filters.perfil_id);
      if (this.filters.estado) params.append('estado', this.filters.estado);

      const response = await maintenanceService.request(`/usuarios?${params}`, 'GET');

      this.usuarios = response.data || [];
      this.pagination = response.pagination || {
        page: 1,
        limit: 10,
        total: 0,
        total_pages: 0
      };
      
      // Calcular estadísticas por perfil
      this.stats = {};
      this.usuarios.forEach(u => {
        if (!this.stats[u.perfil_id]) {
          this.stats[u.perfil_id] = 0;
        }
        this.stats[u.perfil_id]++;
      });

      console.log('✅ Usuarios cargados:', this.usuarios.length);

      this.refreshTable();
    } catch(e) {
      console.error('❌ Error cargando usuarios:', e);
      this.usuarios = [];
      this.refreshTable();
    }
  }

  refreshTable() {
    // Actualizar tabla
    const container = document.getElementById('usersTableContainer');
    if (container) {
      container.innerHTML = this.renderTable();
    }
    
    // Actualizar stats
    const statsContainer = document.querySelector('.stats-grid');
    if (statsContainer) {
      statsContainer.innerHTML = this.renderStats();
    }
  }

  handleSearch(value) {
    clearTimeout(this.searchTimeout);
    this.searchTimeout = setTimeout(() => {
      this.filters.search = value;
      this.pagination.page = 1;
      this.loadUsuarios();
    }, 500);
  }

  handleFilterChange(filterName, value) {
    this.filters[filterName] = value || null;
    this.pagination.page = 1;
    this.loadUsuarios();
  }

  clearFilters() {
    this.filters = {
      search: '',
      perfil_id: null,
      estado: null,
      mes: null
    };

    // Limpiar inputs
    const searchInput = document.getElementById('searchInput');
    const perfilFilter = document.getElementById('perfilFilter');
    const estadoFilter = document.getElementById('estadoFilter');
    const mesFilter = document.getElementById('mesFilter');

    if (searchInput) searchInput.value = '';
    if (perfilFilter) perfilFilter.selectedIndex = 0;
    if (estadoFilter) estadoFilter.selectedIndex = 0;
    if (mesFilter) mesFilter.selectedIndex = 0;

    this.pagination.page = 1;
    this.loadUsuarios();
  }

  goToPage(page) {
    if (page < 1 || page > this.pagination.total_pages) return;
    this.pagination.page = page;
    this.loadUsuarios();
  }

  async showChangeProfileModal(usuarioId, perfilActual, nombreCompleto) {
    const perfilesOptions = this.perfiles.map(p =>
      `<option value="${p.perfil_id}" ${p.perfil_id === perfilActual ? 'selected' : ''}>${p.nombre}</option>`
    ).join('');

    const result = await Swal.fire({
      title: 'Cambiar Perfil',
      html: `
        <p style="margin-bottom: 1rem;">Usuario: <strong>${nombreCompleto}</strong></p>
        <select id="swalPerfilSelect" class="swal2-input" style="width: 80%; display: block; margin: 0 auto;">
          ${perfilesOptions}
        </select>
      `,
      showCancelButton: true,
      confirmButtonText: 'Cambiar',
      cancelButtonText: 'Cancelar',
      preConfirm: () => {
        const perfilId = document.getElementById('swalPerfilSelect').value;
        if (!perfilId) {
          Swal.showValidationMessage('Debes seleccionar un perfil');
          return false;
        }
        return perfilId;
      }
    });

    if (result.isConfirmed) {
      await this.changeUserProfile(usuarioId, result.value);
    }
  }

  async changeUserProfile(usuarioId, perfilId) {
    try {
      const response = await maintenanceService.request(
        `/usuarios/${usuarioId}/perfil`,
        'POST',
        { perfil_id: parseInt(perfilId) },
        true
      );

      Swal.fire({
        icon: 'success',
        title: 'Perfil actualizado',
        text: 'El perfil del usuario ha sido actualizado exitosamente',
        timer: 2000,
        showConfirmButton: false
      });

      this.loadUsuarios();
    } catch(e) {
      console.error('❌ Error cambiando perfil:', e);
      Swal.fire({
        icon: 'error',
        title: 'Error',
        text: e.message || 'No se pudo cambiar el perfil'
      });
    }
  }

  async toggleUserStatus(usuarioId, estadoActual) {
    const nuevoEstado = estadoActual === 'activo' ? 'suspendido' : 'activo';
    const accion = nuevoEstado === 'activo' ? 'activar' : 'suspender';

    const result = await Swal.fire({
      title: `¿${this.capitalizeFirst(accion)} usuario?`,
      text: `¿Estás seguro de que deseas ${accion} este usuario?`,
      icon: 'warning',
      showCancelButton: true,
      confirmButtonText: `Sí, ${accion}`,
      cancelButtonText: 'Cancelar',
      confirmButtonColor: nuevoEstado === 'activo' ? '#28a745' : '#dc3545'
    });

    if (result.isConfirmed) {
      try {
        await maintenanceService.request(
          `/usuarios/${usuarioId}/estado?estado=${nuevoEstado}`,
          'PATCH',
          null,
          true
        );

        Swal.fire({
          icon: 'success',
          title: 'Estado actualizado',
          text: `El usuario ha sido ${accion}do exitosamente`,
          timer: 2000,
          showConfirmButton: false
        });

        this.loadUsuarios();
      } catch(e) {
        console.error('❌ Error actualizando estado:', e);
        Swal.fire({
          icon: 'error',
          title: 'Error',
          text: e.message || 'No se pudo actualizar el estado'
        });
      }
    }
  }
}

/**
 * 👥 Profiles Module
 * CRUD completo para Perfiles de Usuario
 */

class ProfilesModule {
  constructor(maintenanceController) {
    this.maintenanceController = maintenanceController;
    this.data = [];
    this.isEditing = false;
    this.editingId = null;

    // Asignar a window para que funcionen los onclick
    window.profilesModule = this;
  }

  async render() {
    console.log('🎨 ProfilesModule.render() called');
    try {
      console.log('📡 Cargando datos de perfiles...');
      await this.loadData();
      console.log('✅ Datos cargados, total perfiles:', this.data.length);

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
              <h2>Perfiles de Usuario</h2>
              <p>Gestionar perfiles y permisos</p>
            </div>
            <button class="btn btn-primary" onclick="window.profilesModule.openModal()">
              <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <line x1="12" y1="5" x2="12" y2="19"></line>
                <line x1="5" y1="12" x2="19" y2="12"></line>
              </svg>
              Nuevo Perfil
            </button>
          </div>

          <div class="module-content">
            <div class="table-responsive">
              <table class="data-table">
                <thead>
                  <tr>
                    <th>ID</th>
                    <th>Nombre</th>
                    <th>Descripción</th>
                    <th>Estado</th>
                    <th class="text-center">Acciones</th>
                  </tr>
                </thead>
                <tbody id="profilesTableBody">
                  ${this.renderTableRows()}
                </tbody>
              </table>
            </div>

            ${this.data.length === 0 ? `
              <div class="empty-state">
                <svg xmlns="http://www.w3.org/2000/svg" width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path>
                  <circle cx="9" cy="7" r="4"></circle>
                </svg>
                <h3>No hay perfiles</h3>
                <p>Comienza agregando tu primer perfil</p>
              </div>
            ` : ''}
          </div>

          <!-- Modal -->
          <div id="profileModal" class="modal">
            <div class="modal-content">
              <div class="modal-header">
                <h3 id="modalTitle">Nuevo Perfil</h3>
                <button class="modal-close" onclick="window.profilesModule.closeModal()">
                  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <line x1="18" y1="6" x2="6" y2="18"></line>
                    <line x1="6" y1="6" x2="18" y2="18"></line>
                  </svg>
                </button>
              </div>
              <form id="profileForm" class="modal-body">
                <div class="form-group">
                  <label for="nombre">Nombre <span class="required">*</span></label>
                  <input type="text" id="nombre" name="nombre" class="form-control" required>
                </div>

                <div class="form-group">
                  <label for="descripcion">Descripción</label>
                  <textarea id="descripcion" name="descripcion" class="form-control" rows="3"></textarea>
                </div>

                <div class="form-group">
                  <label class="checkbox-label">
                    <input type="checkbox" id="activo" name="activo" checked>
                    <span>Activo</span>
                  </label>
                </div>

                <div class="modal-footer">
                  <button type="button" class="btn btn-outline" onclick="window.profilesModule.closeModal()">Cancelar</button>
                  <button type="submit" class="btn btn-primary">
                    <span id="btnSubmitText">Crear Perfil</span>
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      `;

    } catch (error) {
      console.error('❌ Error en ProfilesModule.render():', error);
      console.error('❌ Error stack:', error.stack);
      return `<div class="empty-state"><h3>Error al cargar datos</h3><p>${error.message}</p></div>`;
    }
  }

  renderTableRows() {
    return this.data.map(item => `
      <tr>
        <td data-label="ID">${item.perfil_id}</td>
        <td data-label="Nombre"><strong>${item.nombre}</strong></td>
        <td data-label="Descripción">${item.descripcion || '-'}</td>
        <td data-label="Estado">
          <span class="badge ${item.activo ? 'badge-success' : 'badge-secondary'}">
            ${item.activo ? 'Activo' : 'Inactivo'}
          </span>
        </td>
        <td data-label="Acciones" class="text-center">
          <div class="action-buttons">
            <button class="btn-icon" onclick="window.profilesModule.edit(${item.perfil_id})">
              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path>
                <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path>
              </svg>
            </button>
            <button class="btn-icon btn-icon-danger" onclick="window.profilesModule.delete(${item.perfil_id})">
              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <polyline points="3 6 5 6 21 6"></polyline>
                <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
              </svg>
            </button>
          </div>
        </td>
      </tr>
    `).join('');
  }

  setupEventListeners() {
    const form = document.getElementById('profileForm');
    if (form) form.addEventListener('submit', (e) => this.handleSubmit(e));
  }

  async loadData() {
    console.log('📡 ProfilesModule.loadData() called');
    try {
      console.log('🌐 Calling maintenanceService.getPerfiles()...');
      this.data = await maintenanceService.getPerfiles();
      console.log('✅ Perfiles cargados:', this.data);
    } catch (error) {
      console.error('❌ Error en ProfilesModule.loadData():', error);
      console.error('❌ Error stack:', error.stack);

      // Si es 404, el backend no tiene implementado este endpoint
      if (error.message.includes('404')) {
        console.warn('⚠️ Backend no tiene endpoint /perfiles implementado. Usando datos de ejemplo.');
        this.data = [];
        showNotification('El backend no tiene el endpoint de perfiles implementado', 'warning');
      } else {
        this.data = [];
        showNotification('Error al cargar perfiles: ' + error.message, 'error');
      }
    }
  }

  async refreshTable() {
    await this.loadData();
    const tbody = document.getElementById('profilesTableBody');
    if (tbody) tbody.innerHTML = this.renderTableRows();
  }

  openModal(id = null) {
    const modal = document.getElementById('profileModal');
    const form = document.getElementById('profileForm');

    if (id) {
      this.isEditing = true;
      this.editingId = id;
      const item = this.data.find(d => d.perfil_id === id);
      if (item) {
        document.getElementById('nombre').value = item.nombre;
        document.getElementById('descripcion').value = item.descripcion || '';
        document.getElementById('activo').checked = item.activo;
        document.getElementById('modalTitle').textContent = 'Editar Perfil';
        document.getElementById('btnSubmitText').textContent = 'Guardar Cambios';
      }
    } else {
      this.isEditing = false;
      this.editingId = null;
      form.reset();
      document.getElementById('modalTitle').textContent = 'Nuevo Perfil';
      document.getElementById('btnSubmitText').textContent = 'Crear Perfil';
    }

    modal.classList.add('active');
  }

  closeModal() {
    document.getElementById('profileModal').classList.remove('active');
    document.getElementById('profileForm').reset();
  }

  async handleSubmit(e) {
    e.preventDefault();

    const formData = {
      nombre: document.getElementById('nombre').value.trim(),
      descripcion: document.getElementById('descripcion').value.trim() || null,
      activo: document.getElementById('activo').checked,
      permisos: [] // Se puede extender después
    };

    try {
      if (this.isEditing) {
        await maintenanceService.updatePerfil(this.editingId, formData);
        showNotification('Perfil actualizado correctamente', 'success');
      } else {
        await maintenanceService.createPerfil(formData);
        showNotification('Perfil creado correctamente', 'success');
      }

      this.closeModal();
      await this.refreshTable();

    } catch (error) {
      showNotification(error.message || 'Error al guardar perfil', 'error');
    }
  }

  edit(id) {
    this.openModal(id);
  }

  async delete(id) {
    const item = this.data.find(d => d.perfil_id === id);
    if (!item) return;

    if (!confirm(`¿Eliminar el perfil "${item.nombre}"?`)) return;

    try {
      await maintenanceService.deletePerfil(id);
      showNotification('Perfil eliminado correctamente', 'success');
      await this.refreshTable();
    } catch (error) {
      showNotification(error.message || 'Error al eliminar perfil', 'error');
    }
  }
}

let profilesModule;

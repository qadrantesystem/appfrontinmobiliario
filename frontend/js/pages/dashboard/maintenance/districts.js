/**
 * 📍 Districts Module
 * CRUD completo para Distritos
 */

class DistrictsModule {
  constructor(maintenanceController) {
    this.maintenanceController = maintenanceController;
    this.data = [];
    this.isEditing = false;
    this.editingId = null;

    // Asignar a window para que funcionen los onclick
    window.districtsModule = this;
  }

  async render() {
    try {
      await this.loadData();

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
              <h2>Distritos</h2>
              <p>Gestionar ubicaciones y zonas</p>
            </div>
            <button class="btn btn-primary" onclick="window.districtsModule.openModal()">
              <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <line x1="12" y1="5" x2="12" y2="19"></line>
                <line x1="5" y1="12" x2="19" y2="12"></line>
              </svg>
              Nuevo Distrito
            </button>
          </div>

          <div class="module-content">
            <div class="table-responsive">
              <table class="data-table">
                <thead>
                  <tr>
                    <th>ID</th>
                    <th>Distrito</th>
                    <th>Provincia</th>
                    <th>Departamento</th>
                    <th>Ubigeo</th>
                    <th>Estado</th>
                    <th class="text-center">Acciones</th>
                  </tr>
                </thead>
                <tbody id="districtsTableBody">
                  ${this.renderTableRows()}
                </tbody>
              </table>
            </div>

            ${this.data.length === 0 ? `
              <div class="empty-state">
                <svg xmlns="http://www.w3.org/2000/svg" width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"></path>
                  <circle cx="12" cy="10" r="3"></circle>
                </svg>
                <h3>No hay distritos</h3>
                <p>Comienza agregando tu primer distrito</p>
                <button class="btn btn-primary" onclick="window.districtsModule.openModal()">
                  Crear Distrito
                </button>
              </div>
            ` : ''}
          </div>

          <!-- Modal -->
          <div id="districtModal" class="modal">
            <div class="modal-content">
              <div class="modal-header">
                <h3 id="modalTitle">Nuevo Distrito</h3>
                <button class="modal-close" onclick="window.districtsModule.closeModal()">
                  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <line x1="18" y1="6" x2="6" y2="18"></line>
                    <line x1="6" y1="6" x2="18" y2="18"></line>
                  </svg>
                </button>
              </div>
              <form id="districtForm" class="modal-body">
                <div class="form-row">
                  <div class="form-group">
                    <label for="nombre">
                      Distrito <span class="required">*</span>
                    </label>
                    <input
                      type="text"
                      id="nombre"
                      name="nombre"
                      class="form-control"
                      placeholder="Ej: Miraflores, San Isidro"
                      required
                    >
                  </div>

                  <div class="form-group">
                    <label for="provincia">
                      Provincia <span class="required">*</span>
                    </label>
                    <input
                      type="text"
                      id="provincia"
                      name="provincia"
                      class="form-control"
                      placeholder="Ej: Lima"
                      required
                    >
                  </div>
                </div>

                <div class="form-row">
                  <div class="form-group">
                    <label for="departamento">
                      Departamento <span class="required">*</span>
                    </label>
                    <input
                      type="text"
                      id="departamento"
                      name="departamento"
                      class="form-control"
                      placeholder="Ej: Lima"
                      required
                    >
                  </div>

                  <div class="form-group">
                    <label for="ubigeo">Ubigeo</label>
                    <input
                      type="text"
                      id="ubigeo"
                      name="ubigeo"
                      class="form-control"
                      placeholder="Ej: 150122"
                      maxlength="6"
                    >
                    <small class="form-text">Código de 6 dígitos (opcional)</small>
                  </div>
                </div>

                <div class="form-group">
                  <label class="checkbox-label">
                    <input type="checkbox" id="activo" name="activo" checked>
                    <span>Activo</span>
                  </label>
                </div>

                <div class="modal-footer">
                  <button type="button" class="btn btn-outline" onclick="window.districtsModule.closeModal()">
                    Cancelar
                  </button>
                  <button type="submit" class="btn btn-primary">
                    <span id="btnSubmitText">Crear Distrito</span>
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      `;

    } catch (error) {
      console.error('❌ Error renderizando módulo:', error);
      return `
        <div class="empty-state">
          <h3>Error al cargar datos</h3>
          <p>${error.message}</p>
          <button class="btn btn-outline" onclick="window.maintenanceController.closeModule()">Volver</button>
        </div>
      `;
    }
  }

  renderTableRows() {
    if (this.data.length === 0) return '';

    return this.data.map(item => `
      <tr>
        <td data-label="ID">${item.distrito_id}</td>
        <td data-label="Distrito"><strong>${item.nombre}</strong></td>
        <td data-label="Provincia">${item.provincia}</td>
        <td data-label="Departamento">${item.departamento}</td>
        <td data-label="Ubigeo"><code>${item.ubigeo || '-'}</code></td>
        <td data-label="Estado">
          <span class="badge ${item.activo ? 'badge-success' : 'badge-secondary'}">
            ${item.activo ? 'Activo' : 'Inactivo'}
          </span>
        </td>
        <td data-label="Acciones" class="text-center">
          <div class="action-buttons">
            <button class="btn-icon" onclick="window.districtsModule.edit(${item.distrito_id})" title="Editar">
              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path>
                <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path>
              </svg>
            </button>
            <button class="btn-icon btn-icon-danger" onclick="window.districtsModule.delete(${item.distrito_id})" title="Eliminar">
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
    const form = document.getElementById('districtForm');
    if (form) {
      form.addEventListener('submit', (e) => this.handleSubmit(e));
    }

    const modal = document.getElementById('districtModal');
    if (modal) {
      modal.addEventListener('click', (e) => {
        if (e.target === modal) this.closeModal();
      });
    }
  }

  async loadData() {
    try {
      this.data = await maintenanceService.getDistritos();
      console.log('✅ Distritos cargados:', this.data);
    } catch (error) {
      console.error('❌ Error cargando datos:', error);
      showNotification('Error al cargar distritos', 'error');
      this.data = [];
    }
  }

  async refreshTable() {
    await this.loadData();
    const tbody = document.getElementById('districtsTableBody');
    if (tbody) {
      tbody.innerHTML = this.renderTableRows();
    }
  }

  openModal(id = null) {
    const modal = document.getElementById('districtModal');
    const form = document.getElementById('districtForm');
    const modalTitle = document.getElementById('modalTitle');
    const btnSubmitText = document.getElementById('btnSubmitText');

    if (id) {
      this.isEditing = true;
      this.editingId = id;
      const item = this.data.find(d => d.distrito_id === id);

      if (item) {
        modalTitle.textContent = 'Editar Distrito';
        btnSubmitText.textContent = 'Guardar Cambios';

        document.getElementById('nombre').value = item.nombre;
        document.getElementById('provincia').value = item.provincia;
        document.getElementById('departamento').value = item.departamento;
        document.getElementById('ubigeo').value = item.ubigeo || '';
        document.getElementById('activo').checked = item.activo;
      }
    } else {
      this.isEditing = false;
      this.editingId = null;
      modalTitle.textContent = 'Nuevo Distrito';
      btnSubmitText.textContent = 'Crear Distrito';
      form.reset();
    }

    modal.classList.add('active');
  }

  closeModal() {
    const modal = document.getElementById('districtModal');
    const form = document.getElementById('districtForm');

    modal.classList.remove('active');
    form.reset();
    this.isEditing = false;
    this.editingId = null;
  }

  async handleSubmit(e) {
    e.preventDefault();

    const formData = {
      nombre: document.getElementById('nombre').value.trim(),
      provincia: document.getElementById('provincia').value.trim(),
      departamento: document.getElementById('departamento').value.trim(),
      ubigeo: document.getElementById('ubigeo').value.trim() || null,
      activo: document.getElementById('activo').checked
    };

    if (!formData.nombre || !formData.provincia || !formData.departamento) {
      showNotification('Todos los campos obligatorios deben completarse', 'error');
      return;
    }

    try {
      if (this.isEditing) {
        await maintenanceService.updateDistrito(this.editingId, formData);
        showNotification('Distrito actualizado correctamente', 'success');
      } else {
        await maintenanceService.createDistrito(formData);
        showNotification('Distrito creado correctamente', 'success');
      }

      this.closeModal();
      await this.refreshTable();

    } catch (error) {
      console.error('❌ Error guardando:', error);
      showNotification(error.message || 'Error al guardar distrito', 'error');
    }
  }

  edit(id) {
    this.openModal(id);
  }

  async delete(id) {
    const item = this.data.find(d => d.distrito_id === id);
    if (!item) return;

    if (!confirm(`¿Estás seguro de eliminar el distrito "${item.nombre}"?\n\nEsta acción no se puede deshacer.`)) {
      return;
    }

    try {
      await maintenanceService.deleteDistrito(id);
      showNotification('Distrito eliminado correctamente', 'success');
      await this.refreshTable();

    } catch (error) {
      console.error('❌ Error eliminando:', error);
      showNotification(error.message || 'Error al eliminar distrito', 'error');
    }
  }
}

let districtsModule;

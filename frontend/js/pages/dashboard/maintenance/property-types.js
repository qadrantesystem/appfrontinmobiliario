/**
 * 🏢 Property Types Module
 * CRUD completo para Tipos de Inmueble
 */

class PropertyTypesModule {
  constructor(maintenanceController) {
    this.maintenanceController = maintenanceController;
    this.data = [];
    this.isEditing = false;
    this.editingId = null;

    // Asignar a window para que funcionen los onclick
    window.propertyTypesModule = this;
  }

  /**
   * Renderizar módulo
   */
  async render() {
    try {
      // Cargar datos
      await this.loadData();

      return `
        <div class="maintenance-module">
          <!-- Header con botón volver -->
          <div class="module-header">
            <button class="btn btn-back" onclick="window.maintenanceController.closeModule()">
              <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <line x1="19" y1="12" x2="5" y2="12"></line>
                <polyline points="12 19 5 12 12 5"></polyline>
              </svg>
              Volver
            </button>
            <div class="module-title">
              <h2>Tipos de Inmuebles</h2>
              <p>Gestionar catálogo de tipos de propiedades</p>
            </div>
            <button class="btn btn-primary" onclick="window.propertyTypesModule.openModal()">
              <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <line x1="12" y1="5" x2="12" y2="19"></line>
                <line x1="5" y1="12" x2="19" y2="12"></line>
              </svg>
              Nuevo Tipo
            </button>
          </div>

          <!-- Tabla de datos -->
          <div class="module-content">
            <div class="table-responsive">
              <table class="data-table">
                <thead>
                  <tr>
                    <th>ID</th>
                    <th>Icono</th>
                    <th>Nombre</th>
                    <th>Descripción</th>
                    <th>Estado</th>
                    <th class="text-center">Acciones</th>
                  </tr>
                </thead>
                <tbody id="propertyTypesTableBody">
                  ${this.renderTableRows()}
                </tbody>
              </table>
            </div>

            ${this.data.length === 0 ? `
              <div class="empty-state">
                <svg xmlns="http://www.w3.org/2000/svg" width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"></path>
                </svg>
                <h3>No hay tipos de inmuebles</h3>
                <p>Comienza agregando tu primer tipo de inmueble</p>
                <button class="btn btn-primary" onclick="window.propertyTypesModule.openModal()">
                  Crear Tipo de Inmueble
                </button>
              </div>
            ` : ''}
          </div>

          <!-- Modal para crear/editar -->
          <div id="propertyTypeModal" class="modal">
            <div class="modal-content">
              <div class="modal-header">
                <h3 id="modalTitle">Nuevo Tipo de Inmueble</h3>
                <button class="modal-close" onclick="window.propertyTypesModule.closeModal()">
                  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <line x1="18" y1="6" x2="6" y2="18"></line>
                    <line x1="6" y1="6" x2="18" y2="18"></line>
                  </svg>
                </button>
              </div>
              <form id="propertyTypeForm" class="modal-body">
                <div class="form-group">
                  <label for="nombre">
                    Nombre <span class="required">*</span>
                  </label>
                  <input
                    type="text"
                    id="nombre"
                    name="nombre"
                    class="form-control"
                    placeholder="Ej: Departamento, Casa, Oficina"
                    required
                  >
                </div>

                <div class="form-group">
                  <label for="descripcion">Descripción</label>
                  <textarea
                    id="descripcion"
                    name="descripcion"
                    class="form-control"
                    rows="3"
                    placeholder="Descripción del tipo de inmueble (opcional)"
                  ></textarea>
                </div>

                <div class="form-group">
                  <label for="icono">Icono (Emoji)</label>
                  <input
                    type="text"
                    id="icono"
                    name="icono"
                    class="form-control"
                    placeholder="🏢"
                    maxlength="4"
                  >
                  <small class="form-text">Puedes usar emojis como 🏢 🏠 🏬 🏭</small>
                </div>

                <div class="form-group">
                  <label class="checkbox-label">
                    <input type="checkbox" id="activo" name="activo" checked>
                    <span>Activo</span>
                  </label>
                </div>

                <div class="modal-footer">
                  <button type="button" class="btn btn-outline" onclick="window.propertyTypesModule.closeModal()">
                    Cancelar
                  </button>
                  <button type="submit" class="btn btn-primary">
                    <span id="btnSubmitText">Crear Tipo de Inmueble</span>
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

  /**
   * Renderizar filas de la tabla
   */
  renderTableRows() {
    if (this.data.length === 0) return '';

    return this.data.map(item => `
      <tr>
        <td data-label="ID">${item.tipo_inmueble_id}</td>
        <td data-label="Icono">
          <span class="icon-emoji">${item.icono || '📄'}</span>
        </td>
        <td data-label="Nombre">
          <strong>${item.nombre}</strong>
        </td>
        <td data-label="Descripción">
          <span class="text-muted">${item.descripcion || '-'}</span>
        </td>
        <td data-label="Estado">
          <span class="badge ${item.activo ? 'badge-success' : 'badge-secondary'}">
            ${item.activo ? 'Activo' : 'Inactivo'}
          </span>
        </td>
        <td data-label="Acciones" class="text-center">
          <div class="action-buttons">
            <button
              class="btn-icon"
              onclick="window.propertyTypesModule.edit(${item.tipo_inmueble_id})"
              title="Editar"
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path>
                <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path>
              </svg>
            </button>
            <button
              class="btn-icon btn-icon-danger"
              onclick="window.propertyTypesModule.delete(${item.tipo_inmueble_id})"
              title="Eliminar"
            >
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

  /**
   * Setup event listeners
   */
  setupEventListeners() {
    const form = document.getElementById('propertyTypeForm');
    if (form) {
      form.addEventListener('submit', (e) => this.handleSubmit(e));
    }

    // Cerrar modal al hacer click fuera
    const modal = document.getElementById('propertyTypeModal');
    if (modal) {
      modal.addEventListener('click', (e) => {
        if (e.target === modal) {
          this.closeModal();
        }
      });
    }
  }

  /**
   * Cargar datos desde API
   */
  async loadData() {
    try {
      console.log('📊 Cargando tipos de inmueble...');
      this.data = await maintenanceService.getTiposInmueble();
      console.log('✅ Tipos de inmueble cargados:', this.data);
    } catch (error) {
      console.error('❌ Error cargando datos:', error);
      showNotification('Error al cargar tipos de inmueble', 'error');
      this.data = [];
    }
  }

  /**
   * Refrescar tabla
   */
  async refreshTable() {
    await this.loadData();
    const tbody = document.getElementById('propertyTypesTableBody');
    if (tbody) {
      tbody.innerHTML = this.renderTableRows();
    }
  }

  /**
   * Abrir modal para crear/editar
   */
  openModal(id = null) {
    const modal = document.getElementById('propertyTypeModal');
    const form = document.getElementById('propertyTypeForm');
    const modalTitle = document.getElementById('modalTitle');
    const btnSubmitText = document.getElementById('btnSubmitText');

    if (id) {
      // Modo edición
      this.isEditing = true;
      this.editingId = id;
      const item = this.data.find(d => d.tipo_inmueble_id === id);

      if (item) {
        modalTitle.textContent = 'Editar Tipo de Inmueble';
        btnSubmitText.textContent = 'Guardar Cambios';

        document.getElementById('nombre').value = item.nombre;
        document.getElementById('descripcion').value = item.descripcion || '';
        document.getElementById('icono').value = item.icono || '';
        document.getElementById('activo').checked = item.activo;
      }
    } else {
      // Modo creación
      this.isEditing = false;
      this.editingId = null;
      modalTitle.textContent = 'Nuevo Tipo de Inmueble';
      btnSubmitText.textContent = 'Crear Tipo de Inmueble';
      form.reset();
    }

    modal.classList.add('active');
  }

  /**
   * Cerrar modal
   */
  closeModal() {
    const modal = document.getElementById('propertyTypeModal');
    const form = document.getElementById('propertyTypeForm');

    modal.classList.remove('active');
    form.reset();
    this.isEditing = false;
    this.editingId = null;
  }

  /**
   * Manejar envío del formulario
   */
  async handleSubmit(e) {
    e.preventDefault();

    const formData = {
      nombre: document.getElementById('nombre').value.trim(),
      descripcion: document.getElementById('descripcion').value.trim() || null,
      icono: document.getElementById('icono').value.trim() || null,
      activo: document.getElementById('activo').checked
    };

    // Validaciones
    if (!formData.nombre) {
      showNotification('El nombre es obligatorio', 'error');
      return;
    }

    try {
      if (this.isEditing) {
        // Actualizar
        await maintenanceService.updateTipoInmueble(this.editingId, formData);
        showNotification('Tipo de inmueble actualizado correctamente', 'success');
      } else {
        // Crear
        await maintenanceService.createTipoInmueble(formData);
        showNotification('Tipo de inmueble creado correctamente', 'success');
      }

      this.closeModal();
      await this.refreshTable();

    } catch (error) {
      console.error('❌ Error guardando:', error);
      showNotification(error.message || 'Error al guardar tipo de inmueble', 'error');
    }
  }

  /**
   * Editar registro
   */
  edit(id) {
    this.openModal(id);
  }

  /**
   * Eliminar registro
   */
  async delete(id) {
    const item = this.data.find(d => d.tipo_inmueble_id === id);

    if (!item) return;

    if (!confirm(`¿Estás seguro de eliminar el tipo "${item.nombre}"?\n\nEsta acción no se puede deshacer.`)) {
      return;
    }

    try {
      await maintenanceService.deleteTipoInmueble(id);
      showNotification('Tipo de inmueble eliminado correctamente', 'success');
      await this.refreshTable();

    } catch (error) {
      console.error('❌ Error eliminando:', error);
      showNotification(error.message || 'Error al eliminar tipo de inmueble', 'error');
    }
  }
}

// Instancia global
let propertyTypesModule;

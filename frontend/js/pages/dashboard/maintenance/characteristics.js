/**
 * ⚙️ Characteristics Module
 * CRUD completo para Características
 */

class CharacteristicsModule {
  constructor(maintenanceController) {
    this.maintenanceController = maintenanceController;
    this.data = [];
    this.isEditing = false;
    this.editingId = null;

    // Asignar a window para que funcionen los onclick
    window.characteristicsModule = this;
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
              <h2>Características</h2>
              <p>Administrar características de propiedades</p>
            </div>
            <button class="btn btn-primary" onclick="window.characteristicsModule.openModal()">
              <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <line x1="12" y1="5" x2="12" y2="19"></line>
                <line x1="5" y1="12" x2="19" y2="12"></line>
              </svg>
              Nueva Característica
            </button>
          </div>

          <div class="module-content">
            <div class="table-responsive">
              <table class="data-table">
                <thead>
                  <tr>
                    <th>ID</th>
                    <th>Nombre</th>
                    <th>Categoría</th>
                    <th>Tipo de Valor</th>
                    <th>Estado</th>
                    <th class="text-center">Acciones</th>
                  </tr>
                </thead>
                <tbody id="characteristicsTableBody">
                  ${this.renderTableRows()}
                </tbody>
              </table>
            </div>

            ${this.data.length === 0 ? `
              <div class="empty-state">
                <svg xmlns="http://www.w3.org/2000/svg" width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <polyline points="20 6 9 17 4 12"></polyline>
                </svg>
                <h3>No hay características</h3>
                <p>Comienza agregando tu primera característica</p>
                <button class="btn btn-primary" onclick="window.characteristicsModule.openModal()">
                  Crear Característica
                </button>
              </div>
            ` : ''}
          </div>

          <!-- Modal -->
          <div id="characteristicModal" class="modal">
            <div class="modal-content modal-lg">
              <div class="modal-header">
                <h3 id="modalTitle">Nueva Característica</h3>
                <button class="modal-close" onclick="window.characteristicsModule.closeModal()">
                  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <line x1="18" y1="6" x2="6" y2="18"></line>
                    <line x1="6" y1="6" x2="18" y2="18"></line>
                  </svg>
                </button>
              </div>
              <form id="characteristicForm" class="modal-body">
                <div class="form-row">
                  <div class="form-group">
                    <label for="nombre">
                      Nombre <span class="required">*</span>
                    </label>
                    <input
                      type="text"
                      id="nombre"
                      name="nombre"
                      class="form-control"
                      placeholder="Ej: Ascensor, Piscina"
                      required
                    >
                  </div>

                  <div class="form-group">
                    <label for="categoria">
                      Categoría <span class="required">*</span>
                    </label>
                    <select id="categoria" name="categoria" class="form-control" required>
                      <option value="">Seleccionar categoría</option>
                      <option value="Áreas Comunes del Edificio">Áreas Comunes del Edificio</option>
                      <option value="Características del Inmueble">Características del Inmueble</option>
                      <option value="Servicios y Amenidades">Servicios y Amenidades</option>
                      <option value="Seguridad">Seguridad</option>
                      <option value="Estacionamiento">Estacionamiento</option>
                      <option value="Ubicación">Ubicación</option>
                      <option value="Otros">Otros</option>
                    </select>
                  </div>
                </div>

                <div class="form-group">
                  <label for="tipo_valor">
                    Tipo de Valor <span class="required">*</span>
                  </label>
                  <select id="tipo_valor" name="tipo_valor" class="form-control" required>
                    <option value="boolean">Sí/No (boolean)</option>
                    <option value="number">Número (number)</option>
                    <option value="text">Texto (text)</option>
                    <option value="select">Selección (select)</option>
                  </select>
                  <small class="form-text">Tipo de dato para esta característica</small>
                </div>

                <div class="form-group">
                  <label class="checkbox-label">
                    <input type="checkbox" id="activo" name="activo" checked>
                    <span>Activo</span>
                  </label>
                </div>

                <div class="modal-footer">
                  <button type="button" class="btn btn-outline" onclick="window.characteristicsModule.closeModal()">
                    Cancelar
                  </button>
                  <button type="submit" class="btn btn-primary">
                    <span id="btnSubmitText">Crear Característica</span>
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
        <td data-label="ID">${item.caracteristica_id}</td>
        <td data-label="Nombre"><strong>${item.nombre}</strong></td>
        <td data-label="Categoría">
          <span class="badge badge-info">${item.categoria}</span>
        </td>
        <td data-label="Tipo de Valor"><code>${item.tipo_valor}</code></td>
        <td data-label="Estado">
          <span class="badge ${item.activo ? 'badge-success' : 'badge-secondary'}">
            ${item.activo ? 'Activo' : 'Inactivo'}
          </span>
        </td>
        <td data-label="Acciones" class="text-center">
          <div class="action-buttons">
            <button class="btn-icon" onclick="window.characteristicsModule.edit(${item.caracteristica_id})" title="Editar">
              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path>
                <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path>
              </svg>
            </button>
            <button class="btn-icon btn-icon-danger" onclick="window.characteristicsModule.delete(${item.caracteristica_id})" title="Eliminar">
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
    const form = document.getElementById('characteristicForm');
    if (form) {
      form.addEventListener('submit', (e) => this.handleSubmit(e));
    }

    const modal = document.getElementById('characteristicModal');
    if (modal) {
      modal.addEventListener('click', (e) => {
        if (e.target === modal) this.closeModal();
      });
    }
  }

  async loadData() {
    try {
      this.data = await maintenanceService.getCaracteristicas();
      console.log('✅ Características cargadas:', this.data);
    } catch (error) {
      console.error('❌ Error cargando datos:', error);
      showNotification('Error al cargar características', 'error');
      this.data = [];
    }
  }

  async refreshTable() {
    await this.loadData();
    const tbody = document.getElementById('characteristicsTableBody');
    if (tbody) {
      tbody.innerHTML = this.renderTableRows();
    }
  }

  openModal(id = null) {
    const modal = document.getElementById('characteristicModal');
    const form = document.getElementById('characteristicForm');
    const modalTitle = document.getElementById('modalTitle');
    const btnSubmitText = document.getElementById('btnSubmitText');

    if (id) {
      this.isEditing = true;
      this.editingId = id;
      const item = this.data.find(d => d.caracteristica_id === id);

      if (item) {
        modalTitle.textContent = 'Editar Característica';
        btnSubmitText.textContent = 'Guardar Cambios';

        document.getElementById('nombre').value = item.nombre;
        document.getElementById('categoria').value = item.categoria;
        document.getElementById('tipo_valor').value = item.tipo_valor;
        document.getElementById('activo').checked = item.activo;
      }
    } else {
      this.isEditing = false;
      this.editingId = null;
      modalTitle.textContent = 'Nueva Característica';
      btnSubmitText.textContent = 'Crear Característica';
      form.reset();
    }

    modal.classList.add('active');
  }

  closeModal() {
    const modal = document.getElementById('characteristicModal');
    const form = document.getElementById('characteristicForm');

    modal.classList.remove('active');
    form.reset();
    this.isEditing = false;
    this.editingId = null;
  }

  async handleSubmit(e) {
    e.preventDefault();

    const formData = {
      nombre: document.getElementById('nombre').value.trim(),
      categoria: document.getElementById('categoria').value.trim(),
      tipo_valor: document.getElementById('tipo_valor').value.trim(),
      activo: document.getElementById('activo').checked
    };

    if (!formData.nombre || !formData.categoria || !formData.tipo_valor) {
      showNotification('Todos los campos obligatorios deben completarse', 'error');
      return;
    }

    try {
      if (this.isEditing) {
        await maintenanceService.updateCaracteristica(this.editingId, formData);
        showNotification('Característica actualizada correctamente', 'success');
      } else {
        await maintenanceService.createCaracteristica(formData);
        showNotification('Característica creada correctamente', 'success');
      }

      this.closeModal();
      await this.refreshTable();

    } catch (error) {
      console.error('❌ Error guardando:', error);
      showNotification(error.message || 'Error al guardar característica', 'error');
    }
  }

  edit(id) {
    this.openModal(id);
  }

  async delete(id) {
    const item = this.data.find(d => d.caracteristica_id === id);
    if (!item) return;

    if (!confirm(`¿Estás seguro de eliminar la característica "${item.nombre}"?\n\nEsta acción no se puede deshacer.`)) {
      return;
    }

    try {
      await maintenanceService.deleteCaracteristica(id);
      showNotification('Característica eliminada correctamente', 'success');
      await this.refreshTable();

    } catch (error) {
      console.error('❌ Error eliminando:', error);
      showNotification(error.message || 'Error al eliminar característica', 'error');
    }
  }
}

let characteristicsModule;

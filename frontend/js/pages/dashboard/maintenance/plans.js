/**
 * 💳 Plans Module
 * CRUD completo para Planes de Suscripción
 */

class PlansModule {
  constructor(maintenanceController) {
    this.maintenanceController = maintenanceController;
    this.data = [];
    this.isEditing = false;
    this.editingId = null;

    // Asignar a window para que funcionen los onclick
    window.plansModule = this;
  }

  async render() {
    console.log('🎨 PlansModule.render() called');
    try {
      console.log('📡 Cargando datos de planes...');
      await this.loadData();
      console.log('✅ Datos cargados, total planes:', this.data.length);

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
              <h2>Planes de Suscripción</h2>
              <p>Administrar planes y precios</p>
            </div>
            <button class="btn btn-primary" onclick="window.plansModule.openModal()">
              <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <line x1="12" y1="5" x2="12" y2="19"></line>
                <line x1="5" y1="12" x2="19" y2="12"></line>
              </svg>
              Nuevo Plan
            </button>
          </div>

          <div class="module-content">
            <div class="table-responsive">
              <table class="data-table">
                <thead>
                  <tr>
                    <th>ID</th>
                    <th>Nombre</th>
                    <th>Precio</th>
                    <th>Duración</th>
                    <th>Max. Propiedades</th>
                    <th>Estado</th>
                    <th class="text-center">Acciones</th>
                  </tr>
                </thead>
                <tbody id="plansTableBody">
                  ${this.renderTableRows()}
                </tbody>
              </table>
            </div>

            ${this.data.length === 0 ? `
              <div class="empty-state">
                <svg xmlns="http://www.w3.org/2000/svg" width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect>
                  <path d="M7 11V7a5 5 0 0 1 10 0v4"></path>
                </svg>
                <h3>No hay planes</h3>
                <p>Comienza agregando tu primer plan</p>
              </div>
            ` : ''}
          </div>

          <!-- Modal -->
          <div id="planModal" class="modal">
            <div class="modal-content modal-lg">
              <div class="modal-header">
                <h3 id="modalTitle">Nuevo Plan</h3>
                <button class="modal-close" onclick="window.plansModule.closeModal()">
                  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <line x1="18" y1="6" x2="6" y2="18"></line>
                    <line x1="6" y1="6" x2="18" y2="18"></line>
                  </svg>
                </button>
              </div>
              <form id="planForm" class="modal-body">
                <div class="form-row">
                  <div class="form-group">
                    <label for="nombre">Nombre <span class="required">*</span></label>
                    <input type="text" id="nombre" class="form-control" placeholder="Ej: Básico, Premium" required>
                  </div>

                  <div class="form-group">
                    <label for="precio">Precio <span class="required">*</span></label>
                    <input type="number" id="precio" class="form-control" step="0.01" placeholder="29.90" required>
                  </div>
                </div>

                <div class="form-row">
                  <div class="form-group">
                    <label for="moneda">Moneda <span class="required">*</span></label>
                    <select id="moneda" class="form-control" required>
                      <option value="PEN">PEN - Soles</option>
                      <option value="USD">USD - Dólares</option>
                    </select>
                  </div>

                  <div class="form-group">
                    <label for="duracion_dias">Duración (días) <span class="required">*</span></label>
                    <input type="number" id="duracion_dias" class="form-control" placeholder="30" required>
                  </div>
                </div>

                <div class="form-group">
                  <label for="max_propiedades">Máximo de Propiedades <span class="required">*</span></label>
                  <input type="number" id="max_propiedades" class="form-control" placeholder="5" required>
                </div>

                <div class="form-group">
                  <label for="descripcion">Descripción</label>
                  <textarea id="descripcion" class="form-control" rows="3" placeholder="Descripción del plan"></textarea>
                </div>

                <div class="form-group">
                  <label class="checkbox-label">
                    <input type="checkbox" id="activo" checked>
                    <span>Activo</span>
                  </label>
                </div>

                <div class="modal-footer">
                  <button type="button" class="btn btn-outline" onclick="window.plansModule.closeModal()">Cancelar</button>
                  <button type="submit" class="btn btn-primary">
                    <span id="btnSubmitText">Crear Plan</span>
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      `;

    } catch (error) {
      console.error('❌ Error en PlansModule.render():', error);
      console.error('❌ Error stack:', error.stack);
      return `<div class="empty-state"><h3>Error al cargar datos</h3><p>${error.message}</p></div>`;
    }
  }

  renderTableRows() {
    if (this.data.length === 0) return '';

    return this.data.map(item => {
      // Validar datos antes de renderizar
      const planId = item.plan_id || 0;
      const nombre = item.nombre || 'Sin nombre';
      const moneda = item.moneda || 'PEN';
      const precio = item.precio !== undefined && item.precio !== null ? parseFloat(item.precio).toFixed(2) : '0.00';
      const duracionDias = item.duracion_dias || 0;
      const maxPropiedades = item.max_propiedades || 0;
      const activo = item.activo !== undefined ? item.activo : true;

      return `
        <tr>
          <td data-label="ID">${planId}</td>
          <td data-label="Nombre"><strong>${nombre}</strong></td>
          <td data-label="Precio">
            <strong>${moneda} ${precio}</strong>
          </td>
          <td data-label="Duración">${duracionDias} días</td>
          <td data-label="Max. Propiedades">
            <span class="badge badge-info">${maxPropiedades}</span>
          </td>
          <td data-label="Estado">
            <span class="badge ${activo ? 'badge-success' : 'badge-secondary'}">
              ${activo ? 'Activo' : 'Inactivo'}
            </span>
          </td>
          <td data-label="Acciones" class="text-center">
            <div class="action-buttons">
              <button class="btn-icon" onclick="window.plansModule.edit(${planId})">
                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path>
                  <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path>
                </svg>
              </button>
              <button class="btn-icon btn-icon-danger" onclick="window.plansModule.delete(${planId})">
                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <polyline points="3 6 5 6 21 6"></polyline>
                  <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
                </svg>
              </button>
            </div>
          </td>
        </tr>
      `;
    }).join('');
  }

  setupEventListeners() {
    const form = document.getElementById('planForm');
    if (form) form.addEventListener('submit', (e) => this.handleSubmit(e));
  }

  async loadData() {
    console.log('📡 PlansModule.loadData() called');
    try {
      console.log('🌐 Calling maintenanceService.getPlanes()...');
      this.data = await maintenanceService.getPlanes();
      console.log('✅ Planes cargados:', this.data);
    } catch (error) {
      console.error('❌ Error en PlansModule.loadData():', error);
      console.error('❌ Error stack:', error.stack);
      this.data = [];
      showNotification('Error al cargar planes: ' + error.message, 'error');
    }
  }

  async refreshTable() {
    await this.loadData();
    const tbody = document.getElementById('plansTableBody');
    if (tbody) tbody.innerHTML = this.renderTableRows();
  }

  openModal(id = null) {
    const modal = document.getElementById('planModal');
    const form = document.getElementById('planForm');

    if (id) {
      this.isEditing = true;
      this.editingId = id;
      const item = this.data.find(d => d.plan_id === id);
      if (item) {
        document.getElementById('nombre').value = item.nombre;
        document.getElementById('descripcion').value = item.descripcion || '';
        document.getElementById('precio').value = item.precio;
        document.getElementById('moneda').value = item.moneda;
        document.getElementById('duracion_dias').value = item.duracion_dias;
        document.getElementById('max_propiedades').value = item.max_propiedades;
        document.getElementById('activo').checked = item.activo;
        document.getElementById('modalTitle').textContent = 'Editar Plan';
        document.getElementById('btnSubmitText').textContent = 'Guardar Cambios';
      }
    } else {
      this.isEditing = false;
      this.editingId = null;
      form.reset();
      document.getElementById('modalTitle').textContent = 'Nuevo Plan';
      document.getElementById('btnSubmitText').textContent = 'Crear Plan';
    }

    modal.classList.add('active');
  }

  closeModal() {
    document.getElementById('planModal').classList.remove('active');
    document.getElementById('planForm').reset();
  }

  async handleSubmit(e) {
    e.preventDefault();

    const formData = {
      nombre: document.getElementById('nombre').value.trim(),
      descripcion: document.getElementById('descripcion').value.trim() || null,
      precio: parseFloat(document.getElementById('precio').value),
      moneda: document.getElementById('moneda').value,
      duracion_dias: parseInt(document.getElementById('duracion_dias').value),
      max_propiedades: parseInt(document.getElementById('max_propiedades').value),
      activo: document.getElementById('activo').checked,
      caracteristicas: [] // Se puede extender después
    };

    try {
      if (this.isEditing) {
        await maintenanceService.updatePlan(this.editingId, formData);
        showNotification('Plan actualizado correctamente', 'success');
      } else {
        await maintenanceService.createPlan(formData);
        showNotification('Plan creado correctamente', 'success');
      }

      this.closeModal();
      await this.refreshTable();

    } catch (error) {
      showNotification(error.message || 'Error al guardar plan', 'error');
    }
  }

  edit(id) {
    this.openModal(id);
  }

  async delete(id) {
    const item = this.data.find(d => d.plan_id === id);
    if (!item) return;

    if (!confirm(`¿Eliminar el plan "${item.nombre}"?`)) return;

    try {
      await maintenanceService.deletePlan(id);
      showNotification('Plan eliminado correctamente', 'success');
      await this.refreshTable();
    } catch (error) {
      showNotification(error.message || 'Error al eliminar plan', 'error');
    }
  }
}

let plansModule;

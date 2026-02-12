/**
 * 📁 Categories Module
 * CRUD completo para Categorías de Características con búsqueda y paginación
 */

class CategoriesModule {
  constructor(maintenanceController) {
    this.maintenanceController = maintenanceController;
    this.data = [];
    this.pagination = {
      currentPage: 1,
      pageSize: 5,
      totalPages: 1,
      total: 0
    };
    this.searchTerm = '';
    this.isEditing = false;
    this.editingId = null;

    // Asignar a window para que funcionen los onclick
    window.categoriesModule = this;
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
              <h2>Categorías</h2>
              <p>Gestionar categorías de características</p>
            </div>
            <button class="btn btn-primary" onclick="window.categoriesModule.openModal()">
              <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <line x1="12" y1="5" x2="12" y2="19"></line>
                <line x1="5" y1="12" x2="19" y2="12"></line>
              </svg>
              Nueva Categoría
            </button>
          </div>

          <!-- Barra de búsqueda -->
          <div class="search-bar">
            <div class="search-input-wrapper">
              <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <circle cx="11" cy="11" r="8"></circle>
                <path d="m21 21-4.35-4.35"></path>
              </svg>
              <input
                type="text"
                id="searchInput"
                class="search-input"
                placeholder="Buscar por nombre..."
                value="${this.searchTerm}"
              >
              ${this.searchTerm ? '<button class="clear-search" id="clearSearch"><svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg></button>' : ''}
            </div>
          </div>

          <div class="module-content">
            <div class="table-responsive">
              <table class="data-table">
                <thead>
                  <tr>
                    <th>ID</th>
                    <th>Nombre</th>
                    <th>Descripción</th>
                    <th>Orden</th>
                    <th>Estado</th>
                    <th class="text-center">Acciones</th>
                  </tr>
                </thead>
                <tbody id="categoriesTableBody">
                  ${this.renderTableRows()}
                </tbody>
              </table>
            </div>

            ${this.data.length === 0 ? `
              <div class="empty-state">
                <svg xmlns="http://www.w3.org/2000/svg" width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z"></path>
                </svg>
                <h3>No hay categorías</h3>
                <p>${this.searchTerm ? 'No se encontraron resultados' : 'Comienza agregando tu primera categoría'}</p>
                ${!this.searchTerm ? `
                  <button class="btn btn-primary" onclick="window.categoriesModule.openModal()">
                    Crear Categoría
                  </button>
                ` : ''}
              </div>
            ` : ''}

            <!-- Paginación -->
            ${this.pagination.totalPages > 1 ? `
              <div class="pagination">
                <button
                  class="btn btn-outline btn-sm"
                  onclick="window.categoriesModule.goToPage(${this.pagination.currentPage - 1})"
                  ${this.pagination.currentPage === 1 ? 'disabled' : ''}
                >
                  Anterior
                </button>

                <span class="pagination-info">
                  Página ${this.pagination.currentPage} de ${this.pagination.totalPages}
                  (${this.pagination.total} registros)
                </span>

                <button
                  class="btn btn-outline btn-sm"
                  onclick="window.categoriesModule.goToPage(${this.pagination.currentPage + 1})"
                  ${this.pagination.currentPage === this.pagination.totalPages ? 'disabled' : ''}
                >
                  Siguiente
                </button>
              </div>
            ` : ''}
          </div>

          <!-- Modal -->
          <div id="categoryModal" class="modal">
            <div class="modal-content">
              <div class="modal-header">
                <h3 id="modalTitle">Nueva Categoría</h3>
                <button class="modal-close" onclick="window.categoriesModule.closeModal()">
                  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <line x1="18" y1="6" x2="6" y2="18"></line>
                    <line x1="6" y1="6" x2="18" y2="18"></line>
                  </svg>
                </button>
              </div>
              <form id="categoryForm" class="modal-body">
                <div class="form-group">
                  <label for="nombre">
                    Nombre <span class="required">*</span>
                  </label>
                  <input
                    type="text"
                    id="nombre"
                    name="nombre"
                    class="form-control"
                    placeholder="Ej: Áreas Comunes, Ascensores"
                    required
                    minlength="3"
                    maxlength="100"
                  >
                  <small class="form-text">Nombre único de la categoría (3-100 caracteres)</small>
                </div>

                <div class="form-group">
                  <label for="descripcion">Descripción</label>
                  <textarea
                    id="descripcion"
                    name="descripcion"
                    class="form-control"
                    placeholder="Descripción opcional de la categoría"
                    rows="3"
                  ></textarea>
                  <small class="form-text">Descripción detallada (opcional)</small>
                </div>

                <div class="form-row">
                  <div class="form-group">
                    <label for="orden">
                      Orden <span class="required">*</span>
                    </label>
                    <input
                      type="number"
                      id="orden"
                      name="orden"
                      class="form-control"
                      placeholder="0"
                      value="0"
                      min="0"
                      required
                    >
                    <small class="form-text">Orden de presentación en UI</small>
                  </div>

                  <div class="form-group">
                    <label class="checkbox-label">
                      <input type="checkbox" id="activo" name="activo" checked>
                      <span>Activo</span>
                    </label>
                  </div>
                </div>

                <div class="modal-footer">
                  <button type="button" class="btn btn-outline" onclick="window.categoriesModule.closeModal()">
                    Cancelar
                  </button>
                  <button type="submit" class="btn btn-primary">
                    <span id="btnSubmitText">Crear Categoría</span>
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      `;

    } catch (error) {
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
        <td data-label="ID">${item.categoria_id}</td>
        <td data-label="Nombre"><strong>${item.nombre}</strong></td>
        <td data-label="Descripción">${item.descripcion || '-'}</td>
        <td data-label="Orden"><span class="badge badge-secondary">${item.orden}</span></td>
        <td data-label="Estado">
          <span class="badge ${item.activo ? 'badge-success' : 'badge-secondary'}">
            ${item.activo ? 'Activo' : 'Inactivo'}
          </span>
        </td>
        <td data-label="Acciones" class="text-center">
          <div class="action-buttons">
            <button class="btn-icon" onclick="window.categoriesModule.edit(${item.categoria_id})" title="Editar">
              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path>
                <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path>
              </svg>
            </button>
            <button class="btn-icon btn-icon-danger" onclick="window.categoriesModule.delete(${item.categoria_id})" title="Eliminar">
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
    const form = document.getElementById('categoryForm');
    if (form) {
      form.addEventListener('submit', (e) => this.handleSubmit(e));
    }

    const modal = document.getElementById('categoryModal');
    if (modal) {
      modal.addEventListener('click', (e) => {
        if (e.target === modal) this.closeModal();
      });
    }

    // Search input listener
    const searchInput = document.getElementById('searchInput');
    if (searchInput) {
      let searchTimeout;
      searchInput.addEventListener('input', (e) => {
        clearTimeout(searchTimeout);
        searchTimeout = setTimeout(() => {
          this.searchTerm = e.target.value;
          this.pagination.currentPage = 1;
          this.refreshTable();
        }, 300);
      });
    }
    
    // Clear search button listener
    const clearSearch = document.getElementById('clearSearch');
    if (clearSearch) {
      clearSearch.addEventListener('click', () => {
        this.searchTerm = '';
        this.pagination.currentPage = 1;
        this.refreshTable();
      });
    }
  }

  async loadData() {
    try {
      const response = await maintenanceService.getCategoriasPaginado(
        this.pagination.currentPage,
        this.pagination.pageSize,
        this.searchTerm
      );

      this.data = response.data;
      this.pagination = {
        currentPage: response.page,
        pageSize: response.page_size,
        totalPages: response.total_pages,
        total: response.total
      };

    } catch (error) {
      showNotification('Error al cargar categorías', 'error');
      this.data = [];
    }
  }

  async refreshTable() {
    await this.loadData();
    const tbody = document.getElementById('categoriesTableBody');
    if (tbody) {
      tbody.innerHTML = this.renderTableRows();
    }

    // Actualizar paginación
    const moduleContent = document.querySelector('.module-content');
    if (moduleContent) {
      const paginationHTML = this.pagination.totalPages > 1 ? `
        <div class="pagination">
          <button
            class="btn btn-outline btn-sm"
            onclick="window.categoriesModule.goToPage(${this.pagination.currentPage - 1})"
            ${this.pagination.currentPage === 1 ? 'disabled' : ''}
          >
            Anterior
          </button>

          <span class="pagination-info">
            Página ${this.pagination.currentPage} de ${this.pagination.totalPages}
            (${this.pagination.total} registros)
          </span>

          <button
            class="btn btn-outline btn-sm"
            onclick="window.categoriesModule.goToPage(${this.pagination.currentPage + 1})"
            ${this.pagination.currentPage === this.pagination.totalPages ? 'disabled' : ''}
          >
            Siguiente
          </button>
        </div>
      ` : '';

      const existingPagination = moduleContent.querySelector('.pagination');
      if (existingPagination) {
        existingPagination.outerHTML = paginationHTML;
      }
    }

    // Actualizar empty state si no hay datos
    const emptyState = document.querySelector('.empty-state');
    if (this.data.length === 0 && !emptyState) {
      const tableResponsive = document.querySelector('.table-responsive');
      if (tableResponsive) {
        tableResponsive.insertAdjacentHTML('afterend', `
          <div class="empty-state">
            <svg xmlns="http://www.w3.org/2000/svg" width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z"></path>
            </svg>
            <h3>No hay categorías</h3>
            <p>${this.searchTerm ? 'No se encontraron resultados' : 'Comienza agregando tu primera categoría'}</p>
          </div>
        `);
      }
    } else if (this.data.length > 0 && emptyState) {
      emptyState.remove();
    }
  }

  async goToPage(page) {
    if (page < 1 || page > this.pagination.totalPages) return;
    this.pagination.currentPage = page;
    await this.refreshTable();
  }

  openModal(id = null) {
    const modal = document.getElementById('categoryModal');
    const form = document.getElementById('categoryForm');
    const modalTitle = document.getElementById('modalTitle');
    const btnSubmitText = document.getElementById('btnSubmitText');

    if (id) {
      this.isEditing = true;
      this.editingId = id;
      const item = this.data.find(c => c.categoria_id === id);

      if (item) {
        modalTitle.textContent = 'Editar Categoría';
        btnSubmitText.textContent = 'Guardar Cambios';

        document.getElementById('nombre').value = item.nombre;
        document.getElementById('descripcion').value = item.descripcion || '';
        document.getElementById('orden').value = item.orden;
        document.getElementById('activo').checked = item.activo;
      }
    } else {
      this.isEditing = false;
      this.editingId = null;
      modalTitle.textContent = 'Nueva Categoría';
      btnSubmitText.textContent = 'Crear Categoría';
      form.reset();
      document.getElementById('orden').value = '0';
      document.getElementById('activo').checked = true;
    }

    modal.classList.add('active');
  }

  closeModal() {
    const modal = document.getElementById('categoryModal');
    const form = document.getElementById('categoryForm');

    modal.classList.remove('active');
    form.reset();
    this.isEditing = false;
    this.editingId = null;
  }

  async handleSubmit(e) {
    e.preventDefault();

    const formData = {
      nombre: document.getElementById('nombre').value.trim(),
      descripcion: document.getElementById('descripcion').value.trim() || null,
      orden: parseInt(document.getElementById('orden').value),
      activo: document.getElementById('activo').checked
    };

    if (!formData.nombre || formData.nombre.length < 3) {
      showNotification('El nombre debe tener al menos 3 caracteres', 'error');
      return;
    }

    try {
      if (this.isEditing) {
        await maintenanceService.updateCategoria(this.editingId, formData);
        showNotification('Categoría actualizada correctamente', 'success');
      } else {
        await maintenanceService.createCategoria(formData);
        showNotification('Categoría creada correctamente', 'success');
      }

      this.closeModal();
      await this.refreshTable();

    } catch (error) {
      showNotification(error.message || 'Error al guardar categoría', 'error');
    }
  }

  edit(id) {
    this.openModal(id);
  }

  async delete(id) {
    const item = this.data.find(c => c.categoria_id === id);
    if (!item) return;

    if (!confirm(`¿Estás seguro de eliminar la categoría "${item.nombre}"?\n\nEsta acción marcará la categoría como inactiva.`)) {
      return;
    }

    try {
      await maintenanceService.deleteCategoria(id);
      showNotification('Categoría eliminada correctamente', 'success');
      await this.refreshTable();

    } catch (error) {
      showNotification(error.message || 'Error al eliminar categoría', 'error');
    }
  }
}

let categoriesModule;

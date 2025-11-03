/**
 * ⚙️ Characteristics Module
 * CRUD completo con búsqueda y paginación
 */

class CharacteristicsModule {
  constructor(maintenanceController) {
    this.maintenanceController = maintenanceController;
    this.data = [];
    this.categories = [];
    this.pagination = {
      currentPage: 1,
      pageSize: 5,
      totalPages: 1,
      total: 0
    };
    this.searchTerm = '';
    this.isEditing = false;
    this.editingId = null;
    window.characteristicsModule = this;
  }

  async render() {
    try {
      await this.loadCategories();
      await this.loadData();
      return `<div class="maintenance-module"><div class="module-header"><button class="btn btn-back" onclick="window.maintenanceController.closeModule()"><svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="19" y1="12" x2="5" y2="12"></line><polyline points="12 19 5 12 12 5"></polyline></svg> Volver</button><div class="module-title"><h2>Características</h2><p>Administrar características (${this.pagination.total} total)</p></div><button class="btn btn-primary" onclick="window.characteristicsModule.openModal()"><svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="12" y1="5" x2="12" y2="19"></line><line x1="5" y1="12" x2="19" y2="12"></line></svg> Nueva Característica</button></div><div class="search-bar"><div class="search-input-wrapper"><svg class="search-icon" xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="11" cy="11" r="8"></circle><path d="m21 21-4.35-4.35"></path></svg><input type="text" id="searchInput" class="search-input" placeholder="Buscar..." value="${this.searchTerm}" />${this.searchTerm ? '<button class="clear-search" id="clearSearch"><svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg></button>' : ''}</div></div><div class="module-content"><div class="table-responsive" id="characteristicsTable">${this.renderTable()}</div>${this.renderPagination()}</div>${this.renderModal()}</div>`;
    } catch (error) {
      return `<div class="error-message">Error: ${error.message}</div>`;
    }
  }

  renderTable() {
    if (!this.data.length) return '<div class="empty-state"><p>No hay características</p></div>';
    return `<table class="data-table"><thead><tr><th>ID</th><th>Nombre</th><th>Categoría</th><th>Icono</th><th>Activo</th><th>Acciones</th></tr></thead><tbody>${this.data.map(i => `<tr><td>${i.caracteristica_id}</td><td>${i.nombre}</td><td>${i.categoria?.nombre||'-'}</td><td>${i.icono||'-'}</td><td><span class="badge ${i.activo?'badge-success':'badge-danger'}">${i.activo?'Activo':'Inactivo'}</span></td><td><div class="table-actions"><button class="btn-icon" onclick="window.characteristicsModule.editItem(${i.caracteristica_id})"><svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path></svg></button><button class="btn-icon btn-delete" onclick="window.characteristicsModule.deleteItem(${i.caracteristica_id})"><svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="3 6 5 6 21 6"></polyline><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path></svg></button></div></td></tr>`).join('')}</tbody></table>`;
  }

  renderPagination() {
    // Paginador siempre visible
    return `<div class="pagination"><button class="btn btn-outline" onclick="window.characteristicsModule.previousPage()" ${this.pagination.currentPage===1?'disabled':''}>Anterior</button><span>Página ${this.pagination.currentPage} de ${this.pagination.totalPages}</span><button class="btn btn-outline" onclick="window.characteristicsModule.nextPage()" ${this.pagination.currentPage===this.pagination.totalPages?'disabled':''}>Siguiente</button></div>`;
  }

  renderModal() {
    return `<div class="modal" id="characteristicModal" style="display:none;"><div class="modal-content"><div class="modal-header"><h3>${this.isEditing?'Editar':'Nueva'} Característica</h3><button class="modal-close" onclick="window.characteristicsModule.closeModal()">×</button></div><form id="characteristicForm" onsubmit="window.characteristicsModule.saveItem(event)"><div class="form-group"><label>Nombre *</label><input type="text" id="nombre" required class="form-control"></div><div class="form-group"><label>Categoría *</label><select id="categoria_id" required class="form-control"><option value="">Seleccionar</option>${(this.categories||[]).map(c=>`<option value="${c.categoria_id}">${c.nombre}</option>`).join('')}</select></div><div class="form-group"><label>Icono</label><input type="text" id="icono" class="form-control"></div><div class="form-group"><label><input type="checkbox" id="activo" checked> Activo</label></div><div class="modal-actions"><button type="button" class="btn btn-outline" onclick="window.characteristicsModule.closeModal()">Cancelar</button><button type="submit" class="btn btn-primary">${this.isEditing?'Actualizar':'Crear'}</button></div></form></div></div>`;
  }

  setupEventListeners() {
    const s = document.getElementById('searchInput');
    const c = document.getElementById('clearSearch');
    let t;
    if (s) s.addEventListener('input', e => { clearTimeout(t); t = setTimeout(() => { this.searchTerm = e.target.value; this.pagination.currentPage = 1; this.refreshTable(); }, 300); });
    if (c) c.addEventListener('click', () => { this.searchTerm = ''; this.pagination.currentPage = 1; this.refreshTable(); });
  }

  async loadData() {
    const r = await maintenanceService.getCaracteristicasPaginado(this.pagination.currentPage, this.pagination.pageSize, this.searchTerm);
    this.data = r.data;
    this.pagination = { currentPage: r.page, pageSize: r.page_size, totalPages: r.total_pages, total: r.total };
  }

  async loadCategories() {
    try { const r = await maintenanceService.getCategorias(); this.categories = r.data; } catch(e) { this.categories = []; }
  }

  async refreshTable() {
    await this.loadData();
    const t = document.getElementById('characteristicsTable');
    if (t) t.innerHTML = this.renderTable();
    const p = document.querySelector('.pagination');
    if (p) p.outerHTML = this.renderPagination();
    const h = document.querySelector('.module-title p');
    if (h) h.textContent = `Administrar características (${this.pagination.total} total)`;
    const sb = document.querySelector('.search-bar');
    if (sb) { sb.innerHTML = `<div class="search-input-wrapper"><svg class="search-icon" xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="11" cy="11" r="8"></circle><path d="m21 21-4.35-4.35"></path></svg><input type="text" id="searchInput" class="search-input" placeholder="Buscar..." value="${this.searchTerm}"/>${this.searchTerm?'<button class="clear-search" id="clearSearch">×</button>':''}</div>`; this.setupEventListeners(); }
  }

  async previousPage() { if (this.pagination.currentPage > 1) { this.pagination.currentPage--; await this.refreshTable(); } }
  async nextPage() { if (this.pagination.currentPage < this.pagination.totalPages) { this.pagination.currentPage++; await this.refreshTable(); } }

  openModal() {
    this.isEditing = false;
    this.editingId = null;
    const m = document.getElementById('characteristicModal');
    const f = document.getElementById('characteristicForm');
    if (f) { f.reset(); document.getElementById('activo').checked = true; }
    if (m) m.style.display = 'flex';
  }

  closeModal() {
    const m = document.getElementById('characteristicModal');
    if (m) m.style.display = 'none';
    this.isEditing = false;
    this.editingId = null;
  }

  async editItem(id) {
    this.isEditing = true;
    this.editingId = id;
    const i = this.data.find(x => x.caracteristica_id === id);
    if (!i) return;
    document.getElementById('nombre').value = i.nombre;
    document.getElementById('categoria_id').value = i.categoria_id||'';
    document.getElementById('icono').value = i.icono||'';
    document.getElementById('activo').checked = i.activo;
    document.getElementById('characteristicModal').style.display = 'flex';
  }

  async saveItem(e) {
    e.preventDefault();
    const d = { nombre: document.getElementById('nombre').value, categoria_id: parseInt(document.getElementById('categoria_id').value), icono: document.getElementById('icono').value||null, activo: document.getElementById('activo').checked };
    try {
      if (this.isEditing) await maintenanceService.updateCaracteristica(this.editingId, d); else await maintenanceService.createCaracteristica(d);
      Swal.fire({ icon: 'success', title: this.isEditing?'Actualizado':'Creado', timer: 2000, showConfirmButton: false });
      this.closeModal();
      await this.refreshTable();
    } catch(err) { Swal.fire({ icon: 'error', title: 'Error', text: err.message }); }
  }

  async deleteItem(id) {
    const i = this.data.find(x => x.caracteristica_id === id);
    if (!i) return;
    const r = await Swal.fire({ title: '¿Eliminar?', text: `Se eliminará "${i.nombre}"`, icon: 'warning', showCancelButton: true, confirmButtonText: 'Sí', cancelButtonText: 'No' });
    if (r.isConfirmed) {
      try { await maintenanceService.deleteCaracteristica(id); Swal.fire({ icon: 'success', title: 'Eliminado', timer: 2000, showConfirmButton: false }); await this.refreshTable(); } catch(err) { Swal.fire({ icon: 'error', title: 'Error', text: err.message }); }
    }
  }
}

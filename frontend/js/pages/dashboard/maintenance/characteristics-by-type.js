/**
 * 🔗 Characteristics By Type Module - Tree View v13 - Save Button Mode
 */
class CharacteristicsByTypeModule {
  constructor(maintenanceController) {
    this.maintenanceController = maintenanceController;
    this.tiposInmueble = [];
    this.categoriasPorTipo = {};
    this.expandedTypes = new Set();
    this.expandedCategories = new Set();
    this.selectedTipo = null;
    this.pendingChanges = new Set(); // Format: "1_add_5" or "1_del_5"
    this.originalState = {}; // Format: "1_5": true/false
    this.isSaving = false;
    window.characteristicsByTypeModule = this;
    console.log('🔧 CharacteristicsByTypeModule v13 constructor - Save Button Mode');
  }

  async render() {
    try {
      console.log('📋 CharacteristicsByTypeModule render() iniciado');
      await this.loadTipos();
      const html = '<div class="maintenance-module"><div class="module-header"><button class="btn btn-back" onclick="window.maintenanceController.closeModule()"><svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="19" y1="12" x2="5" y2="12"></line><polyline points="12 19 5 12 12 5"></polyline></svg> Volver</button><div class="module-title"><h2>Características por Tipo</h2><p>Asignar características a tipos de inmueble</p></div><div id="saveButtonContainer">'+this.renderSaveButton()+'</div></div><div class="module-content"><div class="tree-view-container" id="treeViewContainer">'+this.renderTreeView()+'</div></div></div>';
      console.log('✅ HTML generado, length:', html.length);
      return html;
    } catch(e) {
      console.error('❌ Error en render():', e);
      return '<div class="error-message">Error: '+e.message+'</div>';
    }
  }

  renderSaveButton() {
    if(this.pendingChanges.size === 0) return '';
    return '<button class="btn btn-primary" onclick="window.characteristicsByTypeModule.saveChanges()" '+(this.isSaving?'disabled':'')+'>'+
      '<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">'+
      '<path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z"></path>'+
      '<polyline points="17 21 17 13 7 13 7 21"></polyline><polyline points="7 3 7 8 15 8"></polyline></svg> '+
      (this.isSaving ? 'Guardando...' : 'Guardar Cambios ('+this.pendingChanges.size+')')+'</button>';
  }

  renderTreeView() {
    console.log('🌳 renderTreeView(), tipos:', this.tiposInmueble.length);
    if(!this.tiposInmueble || this.tiposInmueble.length === 0) {
      return '<div class="empty-state"><p>No hay tipos de inmueble disponibles</p></div>';
    }
    return '<div class="tree-view">'+(this.tiposInmueble||[]).map(t=>this.renderTipoNode(t)).join('')+'</div>';
  }

  renderTipoNode(t) {
    const exp=this.expandedTypes.has(t.tipo_inmueble_id);
    const categorias=this.categoriasPorTipo[t.tipo_inmueble_id]||[];
    const total=categorias.reduce((sum,c)=>(c.caracteristicas||[]).filter(car=>this.isChecked(t.tipo_inmueble_id, car.caracteristica_id)).length+sum,0);
    return '<div class="tree-node tipo-node"><div class="tree-node-header" onclick="window.characteristicsByTypeModule.toggleTipo('+t.tipo_inmueble_id+')"><span class="tree-toggle">'+(exp?'▼':'▶')+'</span><span class="tree-icon">🏢</span><span class="tree-label">'+t.nombre+'</span><span class="tree-badge">'+total+' asignadas</span></div>'+(exp?'<div class="tree-children">'+(categorias.length?categorias.map(c=>this.renderCategoriaNode(t.tipo_inmueble_id,c)).join(''):'<p class="loading">Cargando...</p>')+'</div>':'')+'</div>';
  }

  renderCategoriaNode(tid,cat) {
    const catKey = tid+'_'+cat.categoria_id;
    const exp=this.expandedCategories.has(catKey);
    const all=(cat.caracteristicas||[]);
    const sel=all.filter(c=>this.isChecked(tid, c.caracteristica_id)).length;
    return '<div class="tree-node categoria-node"><div class="tree-node-header" onclick="window.characteristicsByTypeModule.toggleCategoria('+tid+','+cat.categoria_id+')"><span class="tree-toggle">'+(exp?'▼':'▶')+'</span><span class="tree-icon">📁</span><span class="tree-label">'+cat.nombre+'</span><span class="tree-badge-small">'+sel+'/'+all.length+'</span></div>'+(exp?'<div class="tree-children">'+all.map(c=>this.renderCaracteristicaNode(tid,c)).join('')+'</div>':'')+'</div>';
  }

  renderCaracteristicaNode(tid,carac) {
    const checked = this.isChecked(tid, carac.caracteristica_id);
    return '<div class="tree-node caracteristica-node"><label class="tree-checkbox"><input type="checkbox" '+(checked?'checked':'')+' onchange="window.characteristicsByTypeModule.markChange('+tid+','+carac.caracteristica_id+',this.checked)"/><span class="tree-label">'+carac.nombre+'</span>'+(carac.icono?'<span class="tree-icon-small">'+carac.icono+'</span>':'')+''+'</label></div>';
  }

  isChecked(tid, caracId) {
    const stateKey = tid+'_'+caracId;
    const addKey = tid+'_add_'+caracId;
    const delKey = tid+'_del_'+caracId;

    // Check pending changes first
    if(this.pendingChanges.has(addKey)) return true;
    if(this.pendingChanges.has(delKey)) return false;

    // Fall back to original state
    return this.originalState[stateKey] || false;
  }

  markChange(tid, caracId, checked) {
    console.log('📝 markChange:', tid, caracId, checked);
    this.selectedTipo = tid;
    const stateKey = tid+'_'+caracId;
    const original = this.originalState[stateKey] || false;
    const addKey = tid+'_add_'+caracId;
    const delKey = tid+'_del_'+caracId;

    // Clear previous changes for this characteristic
    this.pendingChanges.delete(addKey);
    this.pendingChanges.delete(delKey);

    // Mark change only if different from original
    if(checked !== original) {
      if(checked) {
        this.pendingChanges.add(addKey);
      } else {
        this.pendingChanges.add(delKey);
      }
    }

    this.refreshView();
  }

  async saveChanges() {
    if(this.isSaving || this.pendingChanges.size === 0) return;

    this.isSaving = true;
    this.refreshView();

    try {
      console.log('💾 Guardando cambios:', this.pendingChanges.size);

      for(const change of this.pendingChanges) {
        const parts = change.split('_');
        const tid = parseInt(parts[0]);
        const action = parts[1];
        const caracId = parseInt(parts[2]);

        if(action === 'add') {
          console.log('➕ Agregando:', tid, caracId);
          await maintenanceService.request('/caracteristicas-x-inmueble', 'POST', {
            tipo_inmueble_id: tid,
            caracteristica_id: caracId,
            requerido: false,
            visible_en_filtro: true,
            orden: 0
          }, true);
          this.originalState[tid+'_'+caracId] = true;
        } else if(action === 'del') {
          console.log('➖ Eliminando:', tid, caracId);
          // First fetch all relations for this tipo
          const relaciones = await maintenanceService.request('/caracteristicas-x-inmueble/tipo-inmueble/'+tid, 'GET', null, false);
          console.log('📦 Relaciones obtenidas:', relaciones);

          // Find the specific relation
          const relacion = relaciones.find(r => r.caracteristica_id === caracId);
          if(relacion) {
            await maintenanceService.request('/caracteristicas-x-inmueble/'+relacion.id, 'DELETE', null, true);
            this.originalState[tid+'_'+caracId] = false;
          }
        }
      }

      // Clear pending changes
      this.pendingChanges.clear();

      Swal.fire({
        icon: 'success',
        title: 'Cambios guardados',
        timer: 2000,
        showConfirmButton: false
      });

      // Reload data to sync
      if(this.selectedTipo) {
        await this.loadCategoriasParaTipo(this.selectedTipo);
      }

    } catch(e) {
      console.error('❌ Error guardando cambios:', e);
      Swal.fire({
        icon: 'error',
        title: 'Error',
        text: e.message || 'Error al guardar cambios'
      });
    } finally {
      this.isSaving = false;
      this.refreshView();
    }
  }

  async loadTipos() {
    console.log('🔄 Cargando tipos de inmueble...');
    const t=await maintenanceService.getTiposInmueble();
    console.log('📦 Respuesta tipos inmueble:', t);
    this.tiposInmueble=(t.data||t||[]);
    console.log('✅ Tipos cargados:', this.tiposInmueble.length);
  }

  async loadCategoriasParaTipo(tipoId) {
    try {
      console.log('🔄 Cargando categorías para tipo:', tipoId);
      const r=await maintenanceService.getCaracteristicasPorTipoAgrupadas(tipoId);
      console.log('📦 Respuesta categorías:', r);
      this.categoriasPorTipo[tipoId]=(r.categorias||[]);

      // Store original state
      (r.categorias||[]).forEach(cat => {
        (cat.caracteristicas||[]).forEach(carac => {
          const stateKey = tipoId+'_'+carac.caracteristica_id;
          this.originalState[stateKey] = carac.asignado;
        });
      });

      console.log('✅ Categorías cargadas:', this.categoriasPorTipo[tipoId].length);
    } catch(e) {
      console.error('❌ Error cargando categorías:',e);
      this.categoriasPorTipo[tipoId]=[];
    }
  }

  async toggleTipo(tipoId) {
    console.log('🔀 Toggle tipo:', tipoId);
    if(this.expandedTypes.has(tipoId)) {
      this.expandedTypes.delete(tipoId);
    } else {
      this.expandedTypes.add(tipoId);
      if(!this.categoriasPorTipo[tipoId]) {
        this.refreshView();
        await this.loadCategoriasParaTipo(tipoId);
      }
    }
    this.refreshView();
  }

  toggleCategoria(tid,catId) {
    console.log('🔀 Toggle categoria:', tid, catId);
    const catKey = tid+'_'+catId;
    if(this.expandedCategories.has(catKey)) {
      this.expandedCategories.delete(catKey);
    } else {
      this.expandedCategories.add(catKey);
    }
    this.refreshView();
  }

  refreshView() {
    console.log('🔄 Refresh view');
    const c=document.getElementById('treeViewContainer');
    if(c) c.innerHTML=this.renderTreeView();
    const s=document.getElementById('saveButtonContainer');
    if(s) s.innerHTML=this.renderSaveButton();
  }
}

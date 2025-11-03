/**
 * 🔗 Characteristics By Type Module - Tree View v12
 */
class CharacteristicsByTypeModule {
  constructor(maintenanceController) {
    this.maintenanceController = maintenanceController;
    this.tiposInmueble = [];
    this.categoriasPorTipo = {};
    this.expandedTypes = new Set();
    this.expandedCategories = new Set(); // Nuevo: controlar categorías
    window.characteristicsByTypeModule = this;
    console.log('🔧 CharacteristicsByTypeModule v12 constructor');
  }

  async render() {
    try {
      console.log('📋 CharacteristicsByTypeModule render() iniciado');
      await this.loadTipos();
      const html = '<div class="maintenance-module"><div class="module-header"><button class="btn btn-back" onclick="window.maintenanceController.closeModule()"><svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="19" y1="12" x2="5" y2="12"></line><polyline points="12 19 5 12 12 5"></polyline></svg> Volver</button><div class="module-title"><h2>Características por Tipo</h2><p>Asignar características a tipos de inmueble</p></div></div><div class="module-content"><div class="tree-view-container" id="treeViewContainer">'+this.renderTreeView()+'</div></div></div>';
      console.log('✅ HTML generado, length:', html.length);
      return html;
    } catch(e) { 
      console.error('❌ Error en render():', e);
      return '<div class="error-message">Error: '+e.message+'</div>'; 
    }
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
    const total=categorias.reduce((sum,c)=>(c.caracteristicas||[]).filter(car=>car.asignado).length+sum,0);
    return '<div class="tree-node tipo-node"><div class="tree-node-header" onclick="window.characteristicsByTypeModule.toggleTipo('+t.tipo_inmueble_id+')"><span class="tree-toggle">'+(exp?'▼':'▶')+'</span><span class="tree-icon">🏢</span><span class="tree-label">'+t.nombre+'</span><span class="tree-badge">'+total+' asignadas</span></div>'+(exp?'<div class="tree-children">'+(categorias.length?categorias.map(c=>this.renderCategoriaNode(t.tipo_inmueble_id,c)).join(''):'<p class="loading">Cargando...</p>')+'</div>':'')+'</div>';
  }

  renderCategoriaNode(tid,cat) {
    const catKey = tid+'_'+cat.categoria_id;
    const exp=this.expandedCategories.has(catKey);
    const all=(cat.caracteristicas||[]);
    const sel=all.filter(c=>c.asignado).length;
    return '<div class="tree-node categoria-node"><div class="tree-node-header" onclick="window.characteristicsByTypeModule.toggleCategoria('+tid+','+cat.categoria_id+')"><span class="tree-toggle">'+(exp?'▼':'▶')+'</span><span class="tree-icon">📁</span><span class="tree-label">'+cat.nombre+'</span><span class="tree-badge-small">'+sel+'/'+all.length+'</span></div>'+(exp?'<div class="tree-children">'+all.map(c=>this.renderCaracteristicaNode(tid,c)).join('')+'</div>':'')+'</div>';
  }

  renderCaracteristicaNode(tid,carac) {
    return '<div class="tree-node caracteristica-node"><label class="tree-checkbox"><input type="checkbox" '+(carac.asignado?'checked':'')+' onchange="window.characteristicsByTypeModule.toggleCaracteristica('+tid+','+carac.caracteristica_id+',this.checked)"/><span class="tree-label">'+carac.nombre+'</span>'+(carac.icono?'<span class="tree-icon-small">'+carac.icono+'</span>':'')+''+'</label></div>';
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

  async toggleCaracteristica(tid,caracId,checked) {
    try {
      console.log('🔀 Toggle característica:', caracId, 'checked:', checked, 'tipo:', tid);
      
      if(checked) {
        // Crear relación
        await maintenanceService.request('/caracteristicas-x-inmueble', 'POST', {
          tipo_inmueble_id: tid,
          caracteristica_id: caracId,
          requerido: false,
          visible_en_filtro: true,
          orden: 0
        }, true);
        console.log('✅ Característica asignada');
      } else {
        // Buscar y eliminar relación
        // Primero obtener todas las relaciones del tipo
        const relaciones = await maintenanceService.request(`/caracteristicas-x-inmueble/tipo-inmueble/${tid}`, 'GET', null, false);
        console.log('📦 Relaciones obtenidas:', relaciones);
        
        // Buscar la relación específica
        const relacion = relaciones.find(r => r.caracteristica_id === caracId);
        if(relacion) {
          await maintenanceService.request(`/caracteristicas-x-inmueble/${relacion.id}`, 'DELETE', null, true);
          console.log('✅ Característica desasignada');
        }
      }
      
      // Recargar datos
      await this.loadCategoriasParaTipo(tid);
      this.refreshView();
      
    } catch(e) {
      console.error('❌ Error toggle característica:', e);
      Swal.fire({icon:'error',title:'Error',text:e.message||'Error al actualizar característica'});
      // Recargar para revertir cambio visual
      await this.loadCategoriasParaTipo(tid);
      this.refreshView();
    }
  }

  refreshView() {
    console.log('🔄 Refresh view');
    const c=document.getElementById('treeViewContainer');
    if(c) c.innerHTML=this.renderTreeView();
  }
}

/**
 * 🔗 Characteristics By Type Module - Tree View
 */
class CharacteristicsByTypeModule {
  constructor(maintenanceController) {
    this.maintenanceController = maintenanceController;
    this.tiposInmueble = [];
    this.categorias = [];
    this.caracteristicasPorTipo = {};
    this.expandedTypes = new Set();
    window.characteristicsByTypeModule = this;
  }

  async render() {
    try {
      await this.loadData();
      return '<div class="maintenance-module"><div class="module-header"><button class="btn btn-back" onclick="window.maintenanceController.closeModule()"><svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="19" y1="12" x2="5" y2="12"></line><polyline points="12 19 5 12 12 5"></polyline></svg> Volver</button><div class="module-title"><h2>Características por Tipo</h2><p>Asignar características a tipos de inmueble</p></div></div><div class="module-content"><div class="tree-view-container" id="treeViewContainer">'+this.renderTreeView()+'</div></div></div>';
    } catch(e) { return '<div class="error-message">Error: '+e.message+'</div>'; }
  }

  renderTreeView() {
    return '<div class="tree-view">'+(this.tiposInmueble||[]).map(t=>this.renderTipoNode(t)).join('')+'</div>';
  }

  renderTipoNode(t) {
    const exp=this.expandedTypes.has(t.tipo_inmueble_id);
    const caracs=this.caracteristicasPorTipo[t.tipo_inmueble_id]||{};
    const total=Object.values(caracs).flat().length;
    return '<div class="tree-node tipo-node"><div class="tree-node-header" onclick="window.characteristicsByTypeModule.toggleTipo('+t.tipo_inmueble_id+')"><span class="tree-toggle">'+(exp?'▼':'▶')+'</span><span class="tree-icon">🏢</span><span class="tree-label">'+t.nombre+'</span><span class="tree-badge">'+total+' características</span></div>'+(exp?'<div class="tree-children">'+(this.categorias||[]).map(c=>this.renderCategoriaNode(t.tipo_inmueble_id,c)).join('')+'</div>':'')+'</div>';
  }

  renderCategoriaNode(tid,cat) {
    const sel=(this.caracteristicasPorTipo[tid]||{})[cat.categoria_id]||[];
    const all=cat.caracteristicas||[];
    return '<div class="tree-node categoria-node"><div class="tree-node-header"><span class="tree-icon">📁</span><span class="tree-label">'+cat.nombre+'</span><span class="tree-badge-small">'+sel.length+'/'+all.length+'</span></div><div class="tree-children">'+(all||[]).map(c=>this.renderCaracteristicaNode(tid,cat.categoria_id,c)).join('')+'</div></div>';
  }

  renderCaracteristicaNode(tid,cid,carac) {
    const checked=((this.caracteristicasPorTipo[tid]||{})[cid]||[]).includes(carac.caracteristica_id);
    return '<div class="tree-node caracteristica-node"><label class="tree-checkbox"><input type="checkbox" '+(checked?'checked':'')+' onchange="window.characteristicsByTypeModule.toggleCaracteristica('+tid+','+cid+','+carac.caracteristica_id+',this.checked)"/><span class="tree-label">'+carac.nombre+'</span>'+(carac.icono?'<span class="tree-icon-small">'+carac.icono+'</span>':'')+'</label></div>';
  }

  async loadData() {
    const t=await maintenanceService.getTiposInmueble();
    this.tiposInmueble=t.data;
    const c=await maintenanceService.getCategoriasAgrupadas();
    this.categorias=c.data;
    await this.loadAsignaciones();
  }

  async loadAsignaciones() {
    try {
      const r=await maintenanceService.getCaracteristicasPorTipo();
      this.caracteristicasPorTipo={};
      r.data.forEach(a=>{
        const tid=a.tipo_inmueble_id;
        const cid=a.caracteristica.categoria_id;
        const caracId=a.caracteristica_id;
        if(!this.caracteristicasPorTipo[tid]) this.caracteristicasPorTipo[tid]={};
        if(!this.caracteristicasPorTipo[tid][cid]) this.caracteristicasPorTipo[tid][cid]=[];
        this.caracteristicasPorTipo[tid][cid].push(caracId);
      });
    } catch(e) { this.caracteristicasPorTipo={}; }
  }

  toggleTipo(tid) {
    if(this.expandedTypes.has(tid)) this.expandedTypes.delete(tid); else this.expandedTypes.add(tid);
    this.refreshView();
  }

  async toggleCaracteristica(tid,cid,caracId,checked) {
    try {
      if(!this.caracteristicasPorTipo[tid]) this.caracteristicasPorTipo[tid]={};
      if(!this.caracteristicasPorTipo[tid][cid]) this.caracteristicasPorTipo[tid][cid]=[];
      if(checked) {
        if(!this.caracteristicasPorTipo[tid][cid].includes(caracId)) {
          this.caracteristicasPorTipo[tid][cid].push(caracId);
          await maintenanceService.createCaracteristicaPorTipo({tipo_inmueble_id:tid,caracteristica_id:caracId});
        }
      } else {
        this.caracteristicasPorTipo[tid][cid]=this.caracteristicasPorTipo[tid][cid].filter(id=>id!==caracId);
        await maintenanceService.deleteCaracteristicaPorTipo(tid,caracId);
      }
      this.refreshView();
    } catch(e) {
      Swal.fire({icon:'error',title:'Error',text:e.message});
      await this.loadAsignaciones();
      this.refreshView();
    }
  }

  refreshView() {
    const c=document.getElementById('treeViewContainer');
    if(c) c.innerHTML=this.renderTreeView();
  }
}

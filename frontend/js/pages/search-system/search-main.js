/**
 * 🔍 SearchSystemMain - Orquestador de la pantalla de búsqueda
 * Archivo: search-system/search-main.js
 *
 * Contrato congelado:
 * - constructor(opts) con opts.mount (selector, def '#qsApp') y opts.mode ('guest'|'auth').
 * - this.state = { filters, results:[], selected:Set, view:'list', page, perPage, mode }.
 * - Bus de eventos: on(evt, cb) / emit(evt, payload).
 * - Eventos: results:updated, selection:changed, view:changed, filters:changed,
 *   filters:applied, map:focus.
 * - Componentes por nombre de clase global: SearchShell, SearchResults,
 *   SearchFilters, ResultsMap (constructor(app), init(), render()).
 */

class SearchSystemMain {
  constructor(opts = {}) {
    this.mount = opts.mount || '#qsApp';
    this.state = {
      filters: {},
      results: [],
      selected: new Set(),
      view: 'list',
      page: 1,
      perPage: 10,
      mode: opts.mode || 'guest'
    };

    this._listeners = {};

    // Componentes
    this.shell = null;
    this.resultsView = null;
    this.filtersComponent = null;
    this.resultsMap = null;
  }

  async init() {
    console.log('🚀 SearchSystemMain init', this.state.mode);

    // Filtros venidos del index
    this.loadFiltersFromStorage();

    // El shell primero: pinta el marco donde viven los demás
    this.shell = this._instantiate('SearchShell');
    if (this.shell) await this._safeInit(this.shell, 'SearchShell');

    // Componentes de contenido
    this.resultsView = this._instantiate('SearchResults');
    if (this.resultsView) await this._safeInit(this.resultsView, 'SearchResults');

    this.filtersComponent = this._instantiate('SearchFilters');
    if (this.filtersComponent) await this._safeInit(this.filtersComponent, 'SearchFilters');

    this.resultsMap = this._instantiate('ResultsMap');
    if (this.resultsMap) await this._safeInit(this.resultsMap, 'ResultsMap');

    // Búsqueda inicial: URL (auto) > filtros guardados > vacío (muestra DEMO)
    const urlFilters = this._filtersFromURL();
    await this.executeSearch(urlFilters || this.state.filters || {});

    console.log('✅ SearchSystemMain listo');
    return this;
  }

  /* ---------- Bus de eventos ---------- */

  on(evt, cb) {
    (this._listeners[evt] = this._listeners[evt] || []).push(cb);
    return this;
  }

  emit(evt, payload) {
    (this._listeners[evt] || []).forEach(cb => {
      try { cb(payload); } catch (e) { console.error(`Error en listener ${evt}`, e); }
    });
    return this;
  }

  /* ---------- Búsqueda ---------- */

  async executeSearch(filters = {}) {
    this.state.filters = filters || {};
    this.state.page = 1;
    this.emit('filters:changed', this.state.filters);

    let results = [];
    try {
      if (window.searchService && typeof window.searchService.buscarPropiedades === 'function') {
        const resp = await window.searchService.buscarPropiedades(this.state.filters);
        if (Array.isArray(resp) && resp.length > 0) results = resp;
      }
    } catch (error) {
      console.warn('⚠️ Búsqueda remota falló, usando datos DEMO:', error);
    }

    // Fallback: arreglo DEMO para que el mock se vea siempre
    if (!results.length) results = this._demoProperties();

    this.state.results = results;
    // Los componentes (SearchResults, ResultsMap) se auto-actualizan al escuchar este evento.
    this.emit('results:updated', { results: this.state.results, filters: this.state.filters });
    this.emit('filters:applied', this.state.filters);
    return this.state.results;
  }

  applyFilters(f = {}) {
    this.state.filters = { ...this.state.filters, ...(f || {}) };
    this.emit('filters:changed', this.state.filters);
    return this.executeSearch(this.state.filters);
  }

  clearFilters() {
    this.state.filters = {};
    this.emit('filters:changed', this.state.filters);
    return this.executeSearch({});
  }

  /* ---------- Vista ---------- */

  toggleView(view) {
    const v = view || (this.state.view === 'list' ? 'grid' : 'list');
    this.state.view = v;
    // Se emite como string; los componentes toleran string u objeto.
    this.emit('view:changed', v);
    return v;
  }

  /* ---------- Selección ---------- */

  selectProperty(id, on = true) {
    const key = Number(id);
    if (on) this.state.selected.add(key);
    else this.state.selected.delete(key);
    this.emit('selection:changed', this.getSelected());
    return this.getSelected();
  }

  getSelected() {
    return Array.from(this.state.selected);
  }

  /* ---------- Modal de filtros ---------- */

  openFilters() {
    if (this.filtersComponent && typeof this.filtersComponent.open === 'function') {
      this.filtersComponent.open();
      if (typeof this.filtersComponent.render === 'function') this.filtersComponent.render();
      return;
    }
    const modal = document.getElementById('qsFiltersModal');
    if (modal) modal.classList.add('is-open');
    this.emit('filters:open', {});
  }

  closeFilters() {
    if (this.filtersComponent && typeof this.filtersComponent.close === 'function') {
      this.filtersComponent.close();
      return;
    }
    const modal = document.getElementById('qsFiltersModal');
    if (modal) modal.classList.remove('is-open');
    this.emit('filters:close', {});
  }

  /* ---------- Filtros desde storage ---------- */

  loadFiltersFromStorage() {
    try {
      const raw = localStorage.getItem('filtros_simplificados');
      if (!raw) return;
      const parsed = JSON.parse(raw);
      if (parsed && typeof parsed === 'object') {
        this.state.filters = parsed;
        console.log('📋 Filtros cargados desde localStorage:', parsed);
        this.emit('filters:changed', parsed);
      }
    } catch (error) {
      console.error('❌ Error cargando filtros:', error);
    }
  }

  _filtersFromURL() {
    const p = new URLSearchParams(window.location.search);
    if (!p.has('auto') && !p.has('tipo') && !p.has('operacion')) return null;
    return {
      tipo_inmueble_id: p.get('tipo') ? Number(p.get('tipo')) : undefined,
      distritos_ids: p.get('distritos') ? p.get('distritos').split(',').map(Number) : [],
      transaccion: p.get('operacion') || 'venta'
    };
  }

  /* ---------- Helpers internos ---------- */

  _instantiate(className) {
    const Ctor = window[className];
    if (typeof Ctor !== 'function') {
      console.warn(`⚠️ Componente ${className} no disponible`);
      return null;
    }
    try {
      return new Ctor(this);
    } catch (e) {
      console.error(`❌ Error instanciando ${className}:`, e);
      return null;
    }
  }

  async _safeInit(component, name) {
    try {
      if (typeof component.init === 'function') await component.init();
    } catch (e) {
      console.error(`❌ Error inicializando ${name}:`, e);
    }
  }

  /* ---------- Datos DEMO (5 inmuebles realistas) ---------- */

  _demoProperties() {
    const img = (id) => `https://images.unsplash.com/${id}?w=900&h=600&fit=crop`;
    return [
      {
        id: 101, codigo: 'QD-2401',
        titulo: 'Oficina corporativa en torre A',
        torre: 'Torre A', direccion: 'Av. Canaval y Moreyra 480, San Isidro',
        distrito: 'San Isidro', area: 290, precio: 320000, moneda: 'USD', transaccion: 'venta',
        habitaciones: 0, banos: 2, estacionamientos: 3,
        lat: -12.0984, lng: -77.0352, latitud: -12.0984, longitud: -77.0352,
        imagenes: [{ url: img('photo-1497366216548-37526070297c') }]
      },
      {
        id: 102, codigo: 'QD-2402',
        titulo: 'Departamento premium con vista al parque',
        torre: 'Torre B', direccion: 'Calle Los Álamos 210, Miraflores',
        distrito: 'Miraflores', area: 145, precio: 268000, moneda: 'USD', transaccion: 'venta',
        habitaciones: 3, banos: 2, estacionamientos: 2,
        lat: -12.1219, lng: -77.0297, latitud: -12.1219, longitud: -77.0297,
        imagenes: [{ url: img('photo-1512917774080-9991f1c4c750') }]
      },
      {
        id: 103, codigo: 'QD-2403',
        titulo: 'Oficina amoblada lista para operar',
        torre: 'Torre C', direccion: 'Av. Javier Prado Este 1066, San Isidro',
        distrito: 'San Isidro', area: 118, precio: 2450, moneda: 'USD', transaccion: 'alquiler',
        habitaciones: 0, banos: 1, estacionamientos: 1,
        lat: -12.0895, lng: -77.0232, latitud: -12.0895, longitud: -77.0232,
        imagenes: [{ url: img('photo-1524758631624-e2822e304c36') }]
      },
      {
        id: 104, codigo: 'QD-2404',
        titulo: 'Flat moderno en edificio boutique',
        torre: 'Torre Única', direccion: 'Calle Schell 315, Miraflores',
        distrito: 'Miraflores', area: 96, precio: 165000, moneda: 'USD', transaccion: 'venta',
        habitaciones: 2, banos: 2, estacionamientos: 1,
        lat: -12.1188, lng: -77.0310, latitud: -12.1188, longitud: -77.0310,
        imagenes: [{ url: img('photo-1600585154340-be6161a56a0c') }]
      },
      {
        id: 105, codigo: 'QD-2405',
        titulo: 'Local comercial en primer piso',
        torre: 'Torre Comercial', direccion: 'Av. Arequipa 2650, Lince',
        distrito: 'Lince', area: 210, precio: 3800, moneda: 'USD', transaccion: 'alquiler',
        habitaciones: 0, banos: 2, estacionamientos: 2,
        lat: -12.0852, lng: -77.0357, latitud: -12.0852, longitud: -77.0357,
        imagenes: [{ url: img('photo-1441986300917-64674bd600d8') }]
      }
    ];
  }
}

window.SearchSystemMain = SearchSystemMain;

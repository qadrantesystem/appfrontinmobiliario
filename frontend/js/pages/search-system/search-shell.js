/**
 * 🧱 Search Shell
 * Archivo: search-system/search-shell.js
 *
 * Construye SOLO el marco de la pantalla de búsqueda:
 * app bar, tabs, header pills, barra de filtros, contador, toggle de vista
 * y bottom nav. El contenido (cards/mapa/filtros) lo hacen otros componentes.
 *
 * Contrato: class SearchShell { constructor(app){this.app=app} async init(){} render(){} }
 */

class SearchShell {
  constructor(app) {
    this.app = app;
    this.el = {};
  }

  async init() {
    this.el.app     = document.querySelector(this.app.mount || '#qsApp');
    this.el.appBar  = document.getElementById('qsAppBar');
    this.el.tabs    = document.getElementById('qsTabs');
    this.el.pills   = document.getElementById('qsHeaderPills');
    this.el.filters = document.getElementById('qsFiltersBar');
    this.el.count   = document.getElementById('qsCount');
    this.el.toggle  = document.getElementById('qsViewToggle');
    this.el.bottom  = document.getElementById('qsBottomNav');

    this.render();
    this.bind();
    this.subscribe();
    this.refresh();
  }

  /* ---------- Render ---------- */

  render() {
    this.renderAppBar();
    this.renderTabs();
    this.renderPills();
    this.renderFiltersBar();
    this.renderViewToggle();
    this.renderBottomNav();
  }

  renderAppBar() {
    if (!this.el.appBar) return;
    const isGuest = this.app.state.mode === 'guest';
    this.el.appBar.innerHTML = `
      <a class="qs-logo-link" href="index.html" aria-label="Inicio Qadrante">
        <img class="qs-logo" src="assets/images/home/logo-qadrante.png" alt="Qadrante">
      </a>
      <div class="qs-appbar-actions">
        <button class="qs-iconbtn" data-qs-bell aria-label="Notificaciones">
          <i class="fa-regular fa-bell"></i>
        </button>
        <button class="qs-avatar" data-qs-avatar aria-label="Perfil">
          <i class="fa-regular fa-user"></i>
        </button>
        <button class="qs-iconbtn" data-qs-menu aria-label="Menú">
          <i class="fa-solid fa-bars"></i>
        </button>
      </div>`;

    this.el.appBar.querySelector('[data-qs-avatar]')?.addEventListener('click', () => {
      window.location.href = isGuest ? 'login.html' : 'dashboard.html';
    });
    this.el.appBar.querySelector('[data-qs-bell]')?.addEventListener('click', () => {
      if (isGuest) window.location.href = 'login.html';
    });
  }

  renderTabs() {
    if (!this.el.tabs) return;
    const tabs = [
      { id: 'busqueda',  label: 'Búsqueda',      icon: 'fa-magnifying-glass', active: true },
      { id: 'guardados', label: 'Guardados',     icon: 'fa-bookmark' },
      { id: 'recientes', label: 'Recientes',     icon: 'fa-clock-rotate-left' },
      { id: 'stats',     label: 'Estadísticas',  icon: 'fa-chart-simple' }
    ];
    this.el.tabs.innerHTML = tabs.map(t => `
      <button class="qs-tab ${t.active ? 'is-active' : ''}" data-qs-tab="${t.id}">
        <i class="fa-solid ${t.icon}"></i> ${t.label}
      </button>`).join('');

    this.el.tabs.querySelectorAll('[data-qs-tab]').forEach(btn => {
      btn.addEventListener('click', () => {
        this.el.tabs.querySelectorAll('.qs-tab').forEach(b => b.classList.remove('is-active'));
        btn.classList.add('is-active');
        this.app.emit('tab:changed', btn.dataset.qsTab);
      });
    });
  }

  renderPills() {
    if (!this.el.pills) return;
    const pills = [
      { id: 'ubicacion', label: 'Ubicación', icon: 'fa-location-dot' },
      { id: 'tipo',      label: 'Tipo Inmueble', icon: 'fa-building' },
      { id: 'area',      label: 'Área', icon: 'fa-vector-square' }
    ];
    this.el.pills.innerHTML = pills.map(p => `
      <button class="qs-pill" data-qs-pill="${p.id}">
        <span class="qs-pill-label"><i class="fa-solid ${p.icon}"></i> ${p.label}</span>
        <span class="qs-pill-value" data-qs-pill-value="${p.id}"></span>
      </button>`).join('');

    this.el.pills.querySelectorAll('[data-qs-pill]').forEach(btn => {
      btn.addEventListener('click', () => this.app.openFilters());
    });
  }

  renderFiltersBar() {
    if (!this.el.filters) return;
    this.el.filters.innerHTML = `
      <button class="qs-filter-btn" data-qs-filters>
        <i class="fa-solid fa-sliders"></i>
        <span>Filtros</span>
        <span class="qs-filter-badge" data-qs-filter-count hidden>0</span>
      </button>
      <div class="qs-sort">
        <select data-qs-sort aria-label="Ordenar por">
          <option value="relevancia">Relevancia</option>
          <option value="precio-asc">Precio ↑</option>
          <option value="precio-desc">Precio ↓</option>
          <option value="area">Área</option>
          <option value="recientes">Más recientes</option>
        </select>
      </div>`;

    this.el.filters.querySelector('[data-qs-filters]')?.addEventListener('click', () => this.app.openFilters());
    this.el.filters.querySelector('[data-qs-sort]')?.addEventListener('change', (e) => {
      this.app.emit('sort:changed', e.target.value);
    });
  }

  renderViewToggle() {
    if (!this.el.toggle) return;
    const views = [
      { id: 'list', icon: 'fa-list' },
      { id: 'grid', icon: 'fa-table-cells-large' },
      { id: 'map',  icon: 'fa-map-location-dot' }
    ];
    const current = this.app.state.view;
    this.el.toggle.innerHTML = views.map(v => `
      <button class="qs-viewbtn ${v.id === current ? 'is-active' : ''}" data-qs-view="${v.id}" aria-label="Vista ${v.id}">
        <i class="fa-solid ${v.icon}"></i>
      </button>`).join('');

    this.el.toggle.querySelectorAll('[data-qs-view]').forEach(btn => {
      btn.addEventListener('click', () => this.app.toggleView(btn.dataset.qsView));
    });
  }

  renderBottomNav() {
    if (!this.el.bottom) return;
    const isGuest = this.app.state.mode === 'guest';
    const perfilHref = isGuest ? 'login.html' : 'dashboard.html';
    const items = [
      { label: 'Inicio',    icon: 'fa-house',            href: 'index.html' },
      { label: 'Buscar',    icon: 'fa-magnifying-glass', active: true },
      { label: 'Guardados', icon: 'fa-bookmark',         href: isGuest ? perfilHref : 'dashboard.html' },
      { label: 'Perfil',    icon: 'fa-user',             href: perfilHref }
    ];
    this.el.bottom.innerHTML = items.map(it => `
      <button class="qs-navitem ${it.active ? 'is-active' : ''}" ${it.href ? `data-qs-href="${it.href}"` : ''}>
        <i class="fa-solid ${it.icon}"></i>
        <span>${it.label}</span>
      </button>`).join('');

    this.el.bottom.querySelectorAll('[data-qs-href]').forEach(btn => {
      btn.addEventListener('click', () => { window.location.href = btn.dataset.qsHref; });
    });
  }

  /* ---------- Eventos ---------- */

  bind() {
    // nada extra: los handlers se enlazan por render
  }

  subscribe() {
    if (typeof this.app.on !== 'function') return;
    this.app.on('results:updated', () => this.refresh());
    this.app.on('filters:changed', () => { this.updatePills(); this.updateFiltersBadge(); });
    this.app.on('filters:applied', () => { this.updatePills(); this.updateFiltersBadge(); });
    this.app.on('view:changed', (view) => this.updateView(view));
  }

  /* ---------- Actualizaciones ---------- */

  refresh() {
    this.updateCount();
    this.updatePills();
    this.updateFiltersBadge();
    this.updateView(this.app.state.view);
    this.syncViewButtons();
  }

  updateCount() {
    if (!this.el.count) return;
    const n = this.app.state.results.length;
    this.el.count.innerHTML = n > 0
      ? `<b>${n}</b> ${n === 1 ? 'propiedad encontrada' : 'propiedades encontradas'}`
      : 'Sin propiedades encontradas';
  }

  updatePills() {
    const f = this.app.state.filters || {};
    const tipos = { 1: 'Casa', 2: 'Departamento', 3: 'Oficina', 4: 'Local', 5: 'Terreno' };

    // Ubicación
    const ubEl = this.el.pills?.querySelector('[data-qs-pill-value="ubicacion"]');
    if (ubEl) {
      let txt = 'Distrito(s)';
      if (f.distritos && f.distritos.length) txt = f.distritos.join(', ');
      else if (f.distrito) txt = f.distrito;
      else if (f.distritos_ids && f.distritos_ids.length) txt = `${f.distritos_ids.length} distrito(s)`;
      ubEl.textContent = txt;
    }

    // Tipo
    const tipoEl = this.el.pills?.querySelector('[data-qs-pill-value="tipo"]');
    if (tipoEl) {
      tipoEl.textContent = f.tipo_inmueble_id
        ? (tipos[f.tipo_inmueble_id] || 'Tipo Inmueble')
        : 'Tipo Inmueble';
    }

    // Área
    const areaEl = this.el.pills?.querySelector('[data-qs-pill-value="area"]');
    if (areaEl) {
      areaEl.textContent = f.area ? `${f.area} m²` : 'Área';
    }
  }

  updateFiltersBadge() {
    const badge = this.el.filters?.querySelector('[data-qs-filter-count]');
    if (!badge) return;
    const n = this.activeFilterCount();
    badge.textContent = n;
    badge.hidden = n === 0;
  }

  activeFilterCount() {
    const f = this.app.state.filters || {};
    const keys = ['distritos_ids', 'distrito', 'distritos', 'tipo_inmueble_id', 'transaccion',
      'area', 'presupuesto_compra', 'presupuesto_alquiler', 'habitaciones', 'banos', 'estacionamientos'];
    return keys.reduce((acc, k) => {
      const v = f[k];
      return acc + (v !== undefined && v !== null && v !== '' && !(Array.isArray(v) && v.length === 0) ? 1 : 0);
    }, 0);
  }

  updateView(view) {
    const v = view || this.app.state.view;
    const results = document.getElementById('qsResults');
    const mapWrap = document.getElementById('qsMapWrap');
    const isMap = v === 'map';

    if (mapWrap) mapWrap.hidden = !isMap;
    if (results) {
      results.hidden = isMap;
      results.classList.toggle('qs-view-grid', v === 'grid');
      results.classList.toggle('qs-view-list', v !== 'grid');
    }
    this.syncViewButtons(v);
  }

  syncViewButtons(view) {
    const v = view || this.app.state.view;
    this.el.toggle?.querySelectorAll('[data-qs-view]').forEach(btn => {
      btn.classList.toggle('is-active', btn.dataset.qsView === v);
    });
  }
}

window.SearchShell = SearchShell;

/**
 * 🎛️ Filtros de Búsqueda - Bottom Sheet con pestañas
 * Archivo: search-system/components/search-filters.js
 *
 * Modal de filtros con 3 pestañas:
 * - Generales: distrito(s), tipo, transacción, área y precio.
 * - Básico: características, ubicación y otras características.
 * - Avanzados: especificaciones, metraje por oficina y servicios.
 *
 * Contrato: se monta en #qsFiltersModal y expone
 * render(), open(), close(), getFilters(), setFilters(f).
 * Al aplicar -> app.applyFilters(f) + app.emit('filters:applied', f).
 */

class SearchFilters {
  constructor(app) {
    this.app = app || {};
    // Alias por compatibilidad con integraciones antiguas
    this.mainApp = this.app;

    this.container = null;
    this.el = null;
    this.activeTab = 'generales';

    // Catálogos (se cargan desde API, con fallback estático)
    this.distritos = [];
    this.tipos = [];

    // Estado de selecciones múltiples
    this.selectedDistritos = new Set();      // Generales -> distritos_ids
    this.selectedDistritosCerca = new Set(); // Básico -> distritos_cerca
    this.transaccion = '';
    this._distSearch = '';

    // Contador mostrado en "Ver N propiedades"
    this.resultCount = null;

    // Listas estáticas de respaldo (Lima)
    this.FALLBACK_DISTRITOS = [
      'San Isidro', 'Miraflores', 'Santiago de Surco', 'La Molina', 'San Borja',
      'Surquillo', 'Lince', 'Jesús María', 'Magdalena del Mar', 'San Miguel',
      'Pueblo Libre', 'Barranco', 'Chorrillos', 'San Luis', 'La Victoria', 'Ate'
    ].map((nombre, i) => ({ id: i + 1, nombre }));

    this.FALLBACK_TIPOS = [
      { id: 1, nombre: 'Oficina en Edificio' },
      { id: 2, nombre: 'Oficina' },
      { id: 3, nombre: 'Local Comercial' },
      { id: 4, nombre: 'Edificio' },
      { id: 5, nombre: 'Depósito' },
      { id: 6, nombre: 'Terreno' }
    ];
  }

  /** Inicializa: monta la UI y carga catálogos. */
  async init() {
    try {
      this.container = document.getElementById('qsFiltersModal');
      if (!this.container) {
        // Fallback: si A1 aún no inyectó el contenedor, lo creamos.
        this.container = document.createElement('div');
        this.container.id = 'qsFiltersModal';
        document.body.appendChild(this.container);
      }
      this.container.classList.add('qs-f-root');

      await this.loadCatalogs();
      this.render();
      this.setupEventListeners();

      console.log('✅ SearchFilters (bottom-sheet) inicializado');
    } catch (error) {
      console.error('❌ Error inicializando SearchFilters:', error);
    }
  }

  /** Carga distritos y tipos de inmueble desde API o usa fallback. */
  async loadCatalogs() {
    const [distritos, tipos] = await Promise.all([
      this.fetchDistritos(),
      this.fetchTipos()
    ]);
    this.distritos = distritos.length ? distritos : this.FALLBACK_DISTRITOS;
    this.tipos = tipos.length ? tipos : this.FALLBACK_TIPOS;
  }

  async fetchDistritos() {
    try {
      if (window.apiRequest && window.API_CONFIG?.CATALOGS?.DISTRICTS) {
        const res = await apiRequest(API_CONFIG.CATALOGS.DISTRICTS, { auth: false });
        return this.normalizeList(res)
          .map(d => ({
            id: d.distrito_id ?? d.id,
            nombre: d.nombre ?? d.name ?? ''
          }))
          .filter(d => d.id != null && d.nombre);
      }
    } catch (e) {
      console.warn('⚠️ No se pudieron cargar distritos desde API, usando lista local');
    }
    return [];
  }

  async fetchTipos() {
    try {
      if (window.apiRequest && window.API_CONFIG?.CATALOGS?.PROPERTY_TYPES) {
        const res = await apiRequest(API_CONFIG.CATALOGS.PROPERTY_TYPES, { auth: false });
        return this.normalizeList(res)
          .map(t => ({
            id: t.tipo_inmueble_id ?? t.tipo_id ?? t.id,
            nombre: t.nombre ?? t.name ?? ''
          }))
          .filter(t => t.id != null && t.nombre);
      }
    } catch (e) {
      console.warn('⚠️ No se pudieron cargar tipos de inmueble desde API, usando lista local');
    }
    return [];
  }

  /** Acepta array plano o respuestas envueltas (data / data.items / results). */
  normalizeList(res) {
    if (!res) return [];
    if (Array.isArray(res)) return res;
    if (Array.isArray(res.data)) return res.data;
    if (Array.isArray(res.items)) return res.items;
    if (Array.isArray(res.results)) return res.results;
    if (res.data && Array.isArray(res.data.items)) return res.data.items;
    if (res.data && Array.isArray(res.data.results)) return res.data.results;
    return [];
  }

  /** Renderiza la hoja inferior completa dentro del contenedor. */
  render() {
    if (!this.container) return;

    this.container.innerHTML = `
      <div class="qs-f-backdrop" data-qs-close></div>
      <div class="qs-f-sheet" role="dialog" aria-modal="true" aria-label="Filtros de búsqueda">
        ${this.renderHeader()}
        ${this.renderTabs()}
        <div class="qs-f-body">
          <section class="qs-f-panel ${this.activeTab === 'generales' ? 'active' : ''}" data-qs-panel="generales">
            ${this.renderGenerales()}
          </section>
          <section class="qs-f-panel ${this.activeTab === 'basico' ? 'active' : ''}" data-qs-panel="basico">
            ${this.renderBasico()}
          </section>
          <section class="qs-f-panel ${this.activeTab === 'avanzados' ? 'active' : ''}" data-qs-panel="avanzados">
            ${this.renderAvanzados()}
          </section>
        </div>
        ${this.renderFooter()}
      </div>
    `;

    this.el = this.container.querySelector('.qs-f-sheet');
    this.renderDistritoChips();
    this.renderDistritoList();
    this.refreshTransaccion();
    this.updateApplyCount();
  }

  renderHeader() {
    return `
      <header class="qs-f-head">
        <div class="qs-f-head-icon"><i class="fa-solid fa-sliders"></i></div>
        <div class="qs-f-head-txt">
          <h2>Filtros de Búsqueda</h2>
          <p>Encuentra la propiedad ideal</p>
        </div>
        <button type="button" class="qs-f-close" data-qs-close aria-label="Cerrar">
          <i class="fa-solid fa-xmark"></i>
        </button>
      </header>
    `;
  }

  renderTabs() {
    const tabs = [
      { id: 'generales', label: 'Generales', icon: 'fa-house' },
      { id: 'basico', label: 'Básico', icon: 'fa-sliders' },
      { id: 'avanzados', label: 'Avanzados', icon: 'fa-building' }
    ];
    return `
      <nav class="qs-f-tabs" role="tablist">
        ${tabs.map(t => `
          <button type="button" role="tab"
            class="qs-f-tab ${this.activeTab === t.id ? 'active' : ''}"
            data-qs-tab="${t.id}">
            <i class="fa-solid ${t.icon}"></i> ${t.label}
          </button>
        `).join('')}
      </nav>
    `;
  }

  /* ============================ TAB GENERALES ============================ */

  renderGenerales() {
    return `
      <div class="qs-f-section">
        <div class="qs-f-field">
          <label>Distrito(s)</label>
          <div class="qs-f-chips" data-qs-dist-chips></div>
          <div class="qs-f-combo">
            <div class="qs-f-combo-input">
              <i class="fa-solid fa-magnifying-glass"></i>
              <input type="text" data-qs-dist-search placeholder="Buscar distrito..." autocomplete="off">
            </div>
            <div class="qs-f-combo-list" data-qs-dist-list></div>
          </div>
        </div>

        <div class="qs-f-field">
          <label>Tipo de Inmueble</label>
          <select class="qs-f-select" data-qs="tipo_inmueble_id">
            <option value="">Todos</option>
            ${this.tipos.map(t => `<option value="${t.id}">${t.nombre}</option>`).join('')}
          </select>
        </div>

        <div class="qs-f-field">
          <label>Transacción</label>
          <div class="qs-f-seg" data-qs-transaccion>
            <button type="button" data-transaccion="venta">Venta</button>
            <button type="button" data-transaccion="alquiler">Alquiler</button>
          </div>
        </div>
      </div>

      <div class="qs-f-section">
        <h3 class="qs-f-section-title"><i class="fa-solid fa-vector-square"></i> Área y Precio</h3>

        <div class="qs-f-field">
          <label>Área (m²)</label>
          <div class="qs-f-range">
            <input type="number" min="0" class="qs-f-input" data-qs="area_min" placeholder="Desde">
            <span class="qs-f-range-sep">–</span>
            <input type="number" min="0" class="qs-f-input" data-qs="area_max" placeholder="Hasta">
          </div>
        </div>

        <div class="qs-f-field">
          <label>Precio</label>
          <div class="qs-f-range">
            <div class="qs-f-money">
              <input type="number" min="0" class="qs-f-input" data-qs="precio_min" placeholder="Desde">
              <span class="qs-f-money-tag">USD</span>
            </div>
            <span class="qs-f-range-sep">–</span>
            <div class="qs-f-money">
              <input type="number" min="0" class="qs-f-input" data-qs="precio_max" placeholder="Hasta">
              <span class="qs-f-money-tag">USD</span>
            </div>
          </div>
        </div>
      </div>
    `;
  }

  /* ============================= TAB BÁSICO ============================== */

  renderBasico() {
    return `
      <div class="qs-f-section">
        <h3 class="qs-f-section-title"><i class="fa-solid fa-building-circle-check"></i> Características</h3>

        <div class="qs-f-field">
          <label>N° de oficinas</label>
          <select class="qs-f-select" data-qs="n_oficinas">
            ${this.selectOptions(['Cualquiera', '1', '2', '3', '4', '5', '6', '8', '10+'], '')}
          </select>
        </div>

        <div class="qs-f-field">
          <label>Piso</label>
          <select class="qs-f-select" data-qs="piso">
            ${this.selectOptions(['Cualquiera', 'Sótano', 'Piso 1', 'Piso 2', 'Piso 3', 'Piso 4', 'Piso 5', 'Piso 6', 'Piso 7', 'Piso 8', 'Piso 9', 'Piso 10', 'Piso 12', '12+'], '')}
          </select>
        </div>

        <div class="qs-f-field">
          <label>N° de estacionamientos</label>
          <select class="qs-f-select" data-qs="n_estacionamientos">
            ${this.selectOptions(['Cualquiera', '0', '1', '2', '3', '4', '5', '6+'], '')}
          </select>
        </div>

        <div class="qs-f-field">
          <label>Vista</label>
          <select class="qs-f-select" data-qs="vista">
            ${this.selectOptions(['Cualquiera', 'A la calle', 'Interior', 'Al mar', 'Panorámica', 'A la ciudad'], 'Cualquiera')}
          </select>
        </div>
      </div>

      <div class="qs-f-section">
        <h3 class="qs-f-section-title"><i class="fa-solid fa-location-dot"></i> Ubicación</h3>

        <div class="qs-f-field">
          <label>Zona / Avenida</label>
          <input type="text" class="qs-f-input" data-qs="zona_avenida" placeholder="Ej: Av. Javier Prado Este">
        </div>

        <div class="qs-f-field">
          <label>Cerca de</label>
          <input type="text" class="qs-f-input" data-qs="cerca_de" placeholder="Ej: Centro Comercial, Metro">
        </div>

        <div class="qs-f-field">
          <label>Distritos</label>
          <div class="qs-f-multilist" data-qs-dist-cerca>
            ${this.distritos.map(d => `
              <label class="qs-f-check">
                <input type="checkbox" data-qs-cerca="${d.id}">
                <span class="qs-f-box"><i class="fa-solid fa-check"></i></span>
                <span class="qs-f-check-label">${d.nombre}</span>
              </label>
            `).join('')}
          </div>
        </div>
      </div>

      <div class="qs-f-section">
        <h3 class="qs-f-section-title"><i class="fa-solid fa-star"></i> Otras características</h3>
        <div class="qs-f-check-grid">
          ${this.renderCheckboxes('caracteristicas', [
            ['amoblado', 'Amoblado'],
            ['aire_acondicionado', 'Aire acondicionado'],
            ['terraza', 'Terraza'],
            ['implementada', 'Implementada'],
            ['sala_reuniones', 'Sala de reuniones'],
            ['vista_mar', 'Vista al mar'],
            ['ascensor', 'Ascensor'],
            ['cafeteria', 'Cafetería'],
            ['seguridad_24_7', 'Seguridad 24/7']
          ])}
        </div>
      </div>
    `;
  }

  /* =========================== TAB AVANZADOS ============================ */

  renderAvanzados() {
    return `
      <div class="qs-f-section">
        <h3 class="qs-f-section-title"><i class="fa-solid fa-clipboard-list"></i> Especificaciones del inmueble</h3>

        <div class="qs-f-field">
          <label>Antigüedad</label>
          <select class="qs-f-select" data-qs="antiguedad">
            ${this.selectOptions(['Cualquiera', 'A estrenar', '1 - 5 años', '6 - 10 años', '11 - 20 años', '+20 años'], '')}
          </select>
        </div>

        <div class="qs-f-field">
          <label>Estado de conservación</label>
          <select class="qs-f-select" data-qs="estado_conservacion">
            ${this.selectOptions(['Cualquiera', 'Excelente', 'Muy bueno', 'Bueno', 'Regular', 'A remodelar'], '')}
          </select>
        </div>

        <div class="qs-f-field">
          <label>Clase de edificio</label>
          <select class="qs-f-select" data-qs="clase_edificio">
            ${this.selectOptions(['Cualquiera', 'A+', 'A', 'B', 'C'], '')}
          </select>
        </div>

        <div class="qs-f-field">
          <label>Zonificación</label>
          <select class="qs-f-select" data-qs="zonificacion">
            ${this.selectOptions(['Cualquiera', 'Comercial', 'Residencial', 'Mixta', 'Industrial', 'Oficinas'], '')}
          </select>
        </div>
      </div>

      <div class="qs-f-section">
        <h3 class="qs-f-section-title"><i class="fa-solid fa-ruler-combined"></i> Rango de metraje por oficina</h3>
        <div class="qs-f-field">
          <label>Área por oficina (m²)</label>
          <div class="qs-f-range">
            <input type="number" min="0" class="qs-f-input" data-qs="area_oficina_min" placeholder="Área mínima">
            <span class="qs-f-range-sep">–</span>
            <input type="number" min="0" class="qs-f-input" data-qs="area_oficina_max" placeholder="Área máxima">
          </div>
        </div>
      </div>

      <div class="qs-f-section">
        <h3 class="qs-f-section-title"><i class="fa-solid fa-bell-concierge"></i> Servicios y facilidades</h3>
        <div class="qs-f-check-grid">
          ${this.renderCheckboxes('servicios', [
            ['recepcion', 'Recepción'],
            ['grupo_electrogeno', 'Grupo electrógeno'],
            ['control_acceso', 'Control de acceso'],
            ['cisterna', 'Cisterna'],
            ['sala_directorio', 'Sala de directorio'],
            ['detectores_humo', 'Detectores de humo'],
            ['comedor', 'Comedor'],
            ['estacionamiento_visitas', 'Estacionamiento visitas']
          ])}
        </div>
      </div>
    `;
  }

  /* ============================== FOOTER ================================ */

  renderFooter() {
    return `
      <footer class="qs-f-foot">
        <button type="button" class="qs-f-btn qs-f-btn-ghost" data-qs-clear>
          <i class="fa-solid fa-eraser"></i> Limpiar filtros
        </button>
        <button type="button" class="qs-f-btn qs-f-btn-primary" data-qs-apply>
          <span class="qs-f-apply-label">Aplicar filtros</span>
          <span class="qs-f-apply-sub" data-qs-count>Ver propiedades</span>
        </button>
      </footer>
    `;
  }

  /* ============================== HELPERS =============================== */

  selectOptions(labels, defaultValue) {
    return labels.map(label => {
      const value = label === 'Cualquiera' ? '' : label;
      const selected = (label === defaultValue || String(value) === String(defaultValue))
        ? 'selected'
        : '';
      return `<option value="${value}" ${selected}>${label}</option>`;
    }).join('');
  }

  renderCheckboxes(group, items) {
    return items.map(([value, label]) => `
      <label class="qs-f-check">
        <input type="checkbox" data-qs-check="${group}" value="${value}">
        <span class="qs-f-box"><i class="fa-solid fa-check"></i></span>
        <span class="qs-f-check-label">${label}</span>
      </label>
    `).join('');
  }

  /* ============================ DISTRITOS =============================== */

  renderDistritoChips() {
    const box = this.container.querySelector('[data-qs-dist-chips]');
    if (!box) return;

    box.innerHTML = [...this.selectedDistritos].map(id => {
      const d = this.distritos.find(x => String(x.id) === String(id));
      if (!d) return '';
      return `
        <span class="qs-f-chip">
          ${d.nombre}
          <button type="button" data-qs-chip-remove="${d.id}" aria-label="Quitar">
            <i class="fa-solid fa-xmark"></i>
          </button>
        </span>
      `;
    }).join('');
  }

  renderDistritoList() {
    const list = this.container.querySelector('[data-qs-dist-list]');
    if (!list) return;

    const term = (this._distSearch || '').toLowerCase().trim();
    const items = this.distritos.filter(d =>
      !term || d.nombre.toLowerCase().includes(term)
    );

    if (!items.length) {
      list.innerHTML = `<div class="qs-f-combo-empty">Sin coincidencias</div>`;
      return;
    }

    list.innerHTML = items.map(d => {
      const selected = this.selectedDistritos.has(String(d.id));
      return `
        <button type="button" class="qs-f-combo-item ${selected ? 'selected' : ''}"
          data-qs-dist-item="${d.id}">
          <span>${d.nombre}</span>
          <i class="fa-solid fa-check qs-f-combo-check"></i>
        </button>
      `;
    }).join('');
  }

  toggleDistrito(id) {
    const key = String(id);
    if (this.selectedDistritos.has(key)) {
      this.selectedDistritos.delete(key);
    } else {
      this.selectedDistritos.add(key);
    }
    this.renderDistritoChips();
    this.renderDistritoList();
  }

  refreshTransaccion() {
    const seg = this.container.querySelector('[data-qs-transaccion]');
    if (!seg) return;
    seg.querySelectorAll('button').forEach(btn => {
      btn.classList.toggle('active', btn.dataset.transaccion === this.transaccion);
    });
  }

  updateApplyCount() {
    const sub = this.container.querySelector('[data-qs-count]');
    if (!sub) return;

    let n = this.resultCount;
    if (n == null) {
      const app = this.app || {};
      const candidates = [
        app.currentResults?.length,
        app.totalResults,
        app.resultCount,
        app.currentCount
      ];
      n = candidates.find(v => typeof v === 'number');
    }

    sub.textContent = typeof n === 'number'
      ? `Ver ${n.toLocaleString('es-PE')} propiedades`
      : 'Ver propiedades';
  }

  /** Permite a A1/A2 actualizar el total estimado del botón Aplicar. */
  setResultCount(n) {
    this.resultCount = (typeof n === 'number') ? n : null;
    this.updateApplyCount();
  }

  /* ============================== EVENTOS ============================== */

  setupEventListeners() {
    if (!this.container || this.container._qsBound) return;
    this.container._qsBound = true;

    this.container.addEventListener('click', (e) => {
      // Cerrar (backdrop o X)
      if (e.target.closest('[data-qs-close]')) {
        e.preventDefault();
        this.close();
        return;
      }

      // Tabs
      const tab = e.target.closest('[data-qs-tab]');
      if (tab) {
        e.preventDefault();
        this.switchTab(tab.dataset.qsTab);
        return;
      }

      // Transacción (segmented)
      const seg = e.target.closest('[data-transaccion]');
      if (seg) {
        e.preventDefault();
        this.transaccion = seg.dataset.transaccion;
        this.refreshTransaccion();
        return;
      }

      // Distrito: seleccionar / quitar chip
      const item = e.target.closest('[data-qs-dist-item]');
      if (item) {
        e.preventDefault();
        this.toggleDistrito(item.dataset.qsDistItem);
        return;
      }
      const chip = e.target.closest('[data-qs-chip-remove]');
      if (chip) {
        e.preventDefault();
        this.toggleDistrito(chip.dataset.qsChipRemove);
        return;
      }

      // Aplicar
      if (e.target.closest('[data-qs-apply]')) {
        e.preventDefault();
        this.apply();
        return;
      }

      // Limpiar
      if (e.target.closest('[data-qs-clear]')) {
        e.preventDefault();
        this.clear();
        return;
      }
    });

    // Buscador de distritos
    this.container.addEventListener('input', (e) => {
      if (e.target.matches('[data-qs-dist-search]')) {
        this._distSearch = e.target.value;
        this.renderDistritoList();
      }
    });

    // Multi-select de distritos (Básico)
    this.container.addEventListener('change', (e) => {
      const cerca = e.target.matches('[data-qs-cerca]');
      if (cerca) {
        const id = String(e.target.dataset.qsCerca);
        if (e.target.checked) this.selectedDistritosCerca.add(id);
        else this.selectedDistritosCerca.delete(id);
      }
    });

    // Cerrar con Escape
    this._onKeydown = (e) => {
      if (e.key === 'Escape' && this.container.classList.contains('qs-f-open')) {
        this.close();
      }
    };
    document.addEventListener('keydown', this._onKeydown);
  }

  switchTab(tabId) {
    this.activeTab = tabId;
    this.container.querySelectorAll('[data-qs-tab]').forEach(btn => {
      btn.classList.toggle('active', btn.dataset.qsTab === tabId);
    });
    this.container.querySelectorAll('[data-qs-panel]').forEach(panel => {
      panel.classList.toggle('active', panel.dataset.qsPanel === tabId);
    });
  }

  /* ============================== APLICAR ============================== */

  apply() {
    const f = this.getFilters();
    console.log('🎛️ Aplicando filtros:', f);

    const app = this.app || {};
    if (typeof app.applyFilters === 'function') {
      app.applyFilters(f);
    } else if (window.searchSystem && typeof window.searchSystem.applyFilters === 'function') {
      window.searchSystem.applyFilters(f);
    }
    if (typeof app.emit === 'function') {
      app.emit('filters:applied', f);
    }

    this.close();
  }

  clear() {
    // Limpiar selecciones múltiples
    this.selectedDistritos.clear();
    this.selectedDistritosCerca.clear();
    this.transaccion = '';
    this._distSearch = '';

    // Reset de inputs / selects / checkboxes del DOM actual
    if (this.container) {
      this.container.querySelectorAll('input[type="number"]').forEach(i => i.value = '');
      this.container.querySelectorAll('input[type="text"]').forEach(i => i.value = '');
      this.container.querySelectorAll('input[type="checkbox"]').forEach(i => i.checked = false);
      // Todos los selects usan "" como valor por defecto (opción "Cualquiera"/"Todos")
      this.container.querySelectorAll('select').forEach(s => { s.value = ''; });
    }

    this.renderDistritoChips();
    this.renderDistritoList();
    this.refreshTransaccion();

    const app = this.app || {};
    if (typeof app.clearFilters === 'function') {
      app.clearFilters();
    } else if (window.searchSystem && typeof window.searchSystem.clearFilters === 'function') {
      window.searchSystem.clearFilters();
    }

    this.updateApplyCount();
  }

  /**
   * Devuelve un objeto plano con los filtros seleccionados.
   * Núcleo congelado: distritos_ids, tipo_inmueble_id, transaccion,
   * area_min, area_max, precio_min, precio_max, caracteristicas, servicios.
   */
  getFilters() {
    const q = (sel) => {
      const el = this.container?.querySelector(sel);
      return el ? el.value : '';
    };
    const num = (sel) => {
      const v = q(sel);
      return v === '' ? null : Number(v);
    };
    const checked = (group) => [...(this.container?.querySelectorAll(`[data-qs-check="${group}"]:checked`) || [])]
      .map(el => el.value);

    return {
      // Generales
      distritos_ids: [...this.selectedDistritos].map(Number).filter(n => !isNaN(n)),
      tipo_inmueble_id: q('[data-qs="tipo_inmueble_id"]') || null,
      transaccion: this.transaccion || null,
      area_min: num('[data-qs="area_min"]'),
      area_max: num('[data-qs="area_max"]'),
      precio_min: num('[data-qs="precio_min"]'),
      precio_max: num('[data-qs="precio_max"]'),
      moneda: 'USD',

      // Básico - características
      n_oficinas: q('[data-qs="n_oficinas"]') || null,
      piso: q('[data-qs="piso"]') || null,
      n_estacionamientos: q('[data-qs="n_estacionamientos"]') || null,
      vista: q('[data-qs="vista"]') || null,

      // Básico - ubicación
      zona_avenida: q('[data-qs="zona_avenida"]') || null,
      cerca_de: q('[data-qs="cerca_de"]') || null,
      distritos_cerca: [...this.selectedDistritosCerca].map(Number).filter(n => !isNaN(n)),
      caracteristicas: checked('caracteristicas'),

      // Avanzados
      antiguedad: q('[data-qs="antiguedad"]') || null,
      estado_conservacion: q('[data-qs="estado_conservacion"]') || null,
      clase_edificio: q('[data-qs="clase_edificio"]') || null,
      zonificacion: q('[data-qs="zonificacion"]') || null,
      area_oficina_min: num('[data-qs="area_oficina_min"]'),
      area_oficina_max: num('[data-qs="area_oficina_max"]'),
      servicios: checked('servicios')
    };
  }

  /** Repone el formulario con un objeto de filtros plano. */
  setFilters(f = {}) {
    if (!this.container) return;

    const setVal = (sel, value) => {
      const el = this.container.querySelector(sel);
      if (el) el.value = value ?? '';
    };

    setVal('[data-qs="tipo_inmueble_id"]', f.tipo_inmueble_id);
    setVal('[data-qs="area_min"]', f.area_min);
    setVal('[data-qs="area_max"]', f.area_max);
    setVal('[data-qs="precio_min"]', f.precio_min);
    setVal('[data-qs="precio_max"]', f.precio_max);
    setVal('[data-qs="n_oficinas"]', f.n_oficinas);
    setVal('[data-qs="piso"]', f.piso);
    setVal('[data-qs="n_estacionamientos"]', f.n_estacionamientos);
    setVal('[data-qs="vista"]', f.vista);
    setVal('[data-qs="zona_avenida"]', f.zona_avenida);
    setVal('[data-qs="cerca_de"]', f.cerca_de);
    setVal('[data-qs="antiguedad"]', f.antiguedad);
    setVal('[data-qs="estado_conservacion"]', f.estado_conservacion);
    setVal('[data-qs="clase_edificio"]', f.clase_edificio);
    setVal('[data-qs="zonificacion"]', f.zonificacion);
    setVal('[data-qs="area_oficina_min"]', f.area_oficina_min);
    setVal('[data-qs="area_oficina_max"]', f.area_oficina_max);

    this.transaccion = f.transaccion || '';
    this.refreshTransaccion();

    this.selectedDistritos = new Set(
      (f.distritos_ids || []).map(String)
    );
    this.selectedDistritosCerca = new Set(
      (f.distritos_cerca || []).map(String)
    );
    this.renderDistritoChips();
    this.renderDistritoList();

    this.container.querySelectorAll('[data-qs-cerca]').forEach(cb => {
      cb.checked = this.selectedDistritosCerca.has(String(cb.dataset.qsCerca));
    });

    ['caracteristicas', 'servicios'].forEach(group => {
      const set = new Set(f[group] || []);
      this.container.querySelectorAll(`[data-qs-check="${group}"]`).forEach(cb => {
        cb.checked = set.has(cb.value);
      });
    });

    this.updateApplyCount();
  }

  /* ============================ ABRIR/CERRAR =========================== */

  open() {
    if (!this.container) return;
    if (!this.el) this.render();
    this.container.classList.add('qs-f-open');
    document.body.classList.add('qs-f-noscroll');
    this.updateApplyCount();
  }

  close() {
    if (!this.container) return;
    this.container.classList.remove('qs-f-open');
    document.body.classList.remove('qs-f-noscroll');
  }
}

// Exponer globalmente
window.SearchFilters = SearchFilters;

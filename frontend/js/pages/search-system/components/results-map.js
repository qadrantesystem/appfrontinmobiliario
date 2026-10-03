/**
 * 🗺️ Vista Mapa de Resultados (pantalla 3)
 * Archivo: search-system/components/results-map.js
 *
 * Mapa Leaflet con propiedades y marcadores numerados.
 *
 * Contrato congelado (A1):
 *  - Contenedor `#qsMap`, wrapper `#qsMapWrap`.
 *  - La app expone: app.state.results, app.on(evt,cb), app.emit(evt,payload), app.toggleView(v).
 *  - Al hacer click en un marcador se emite `map:focus` con la propiedad (la card la pinta A2).
 *  - Escucha `results:updated` para refrescar marcadores.
 *  - Leaflet 1.9.4 disponible en window.L.
 */

class ResultsMap {
  constructor(app) {
    this.app = app;

    this.map = null;
    this.markers = [];              // [{ marker, property, number }]
    this.byId = new Map();          // id -> { marker, property, number }
    this.properties = [];
    this.activeId = null;

    this.container = null;          // #qsMap
    this.wrapper = null;            // #qsMapWrap
    this.overlay = null;            // UI flotante
    this.countEl = null;

    this.initialized = false;
    this._unsub = null;             // unsubscribe de 'results:updated' (si la app lo devuelve)

    this._defaultCenter = [-12.0464, -77.0428]; // Lima
    this._defaultZoom = 12;
  }

  /* ============================================================
     CICLO DE VIDA
     ============================================================ */

  async init() {
    if (this.initialized) return;

    this._resolveDom();
    if (!this.container) {
      console.warn('⚠️ [ResultsMap] No se encontró el contenedor #qsMap');
      return;
    }

    // Leaflet debe estar cargado globalmente
    if (typeof window.L === 'undefined') {
      console.error('❌ [ResultsMap] Leaflet (window.L) no está disponible');
      this.container.innerHTML =
        '<div class="qs-map-fallback"><i class="fa-solid fa-triangle-exclamation"></i><span>No se pudo cargar el mapa</span></div>';
      return;
    }

    this._createMap();
    this._buildOverlay();
    this._bindAppEvents();
    this.initialized = true;

    // Primera carga desde el estado de la app
    this.setProperties(this.app?.state?.results || []);

    // El contenedor suele nacer oculto (cambio de vista): recalcular tamaño
    setTimeout(() => this.map && this.map.invalidateSize(), 80);
  }

  render() {
    this._resolveDom();
    this._buildOverlay();
    this._updateCount();
    this.map && this.map.invalidateSize();
    return this;
  }

  destroy() {
    this._clearMarkers();

    if (Array.isArray(this._offs)) {
      this._offs.forEach((off) => {
        if (typeof off === 'function') { try { off(); } catch (e) { /* noop */ } }
      });
      this._offs = [];
    }
    if (typeof this._unsub === 'function') {
      try { this._unsub(); } catch (e) { /* noop */ }
      this._unsub = null;
    }

    if (this.map) {
      this.map.remove();
      this.map = null;
    }

    if (this.overlay && this.overlay.parentNode) {
      this.overlay.parentNode.removeChild(this.overlay);
    }
    this.overlay = null;
    this.countEl = null;
    this.initialized = false;
    console.log('🗑️ [ResultsMap] destruido');
  }

  /* ============================================================
     API PÚBLICA
     ============================================================ */

  /** Reemplaza las propiedades y recrea los marcadores. */
  setProperties(properties) {
    this.properties = Array.isArray(properties) ? properties : [];

    if (!this.countEl) this._buildOverlay(); // por si llaman antes de init()

    this._clearMarkers();
    this.activeId = null;

    let index = 0;
    this.properties.forEach(property => {
      if (!this._getLatLng(property)) return; // ignora sin lat/lng
      index += 1;
      this._addMarker(property, index);
    });

    this._updateCount();

    if (this.markers.length > 0) {
      this.fitAll();
    }

    return this;
  }

  /** Alias de compatibilidad con el caller anterior. */
  updateMarkers(properties) {
    return this.setProperties(properties);
  }

  /** Resalta y centra un marcador. No emite evento (para evitar loops con A2). */
  focusProperty(property) {
    const id = this._propertyId(property);
    const entry = id != null ? this.byId.get(id) : null;
    if (!entry) return;

    this._setActive(id);

    const { lat, lng } = entry.marker.getLatLng();
    this.map.panTo([lat, lng], { animate: true });
    entry.marker.bringToFront();
    entry.marker.openPopup?.();
  }

  /** Ajusta la vista a todos los marcadores (o vuelve al centro por defecto). */
  fitAll() {
    if (!this.map) return;

    const points = this.markers.map(m => m.marker);
    if (points.length === 0) {
      this.map.setView(this._defaultCenter, this._defaultZoom, { animate: true });
      return;
    }

    const group = window.L.featureGroup(points);
    this.map.fitBounds(group.getBounds(), { padding: [48, 48], maxZoom: 15, animate: true });
  }

  /* ============================================================
     MAPA
     ============================================================ */

  _createMap() {
    this.map = window.L.map(this.container, {
      zoomControl: false,          // usamos controles propios
      attributionControl: true
    }).setView(this._defaultCenter, this._defaultZoom);

    window.L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '© OpenStreetMap contributors',
      maxZoom: 19
    }).addTo(this.map);
  }

  _addMarker(property, number) {
    const coords = this._getLatLng(property);
    if (!coords) return;

    const marker = window.L.marker(coords, {
      icon: this._icon(number),
      riseOnHover: true,
      keyboard: true,
      title: property.titulo || `Propiedad ${number}`,
      alt: `Marcador ${number}`
    }).addTo(this.map);

    const entry = { marker, property, number };
    this.markers.push(entry);
    const id = this._propertyId(property);
    if (id != null) this.byId.set(id, entry);

    // Click → resaltar + emitir 'map:focus' (A2 pinta la card)
    marker.on('click', () => {
      this.focusProperty(property);
      this.emit('map:focus', property);
    });
  }

  /** Pin numerado (divIcon). El tamaño activo/hover se maneja por CSS. */
  _icon(number) {
    return window.L.divIcon({
      className: 'qs-map-marker',
      html: `<div class="qs-map-pin"><span class="qs-map-pin-num">${number}</span></div>`,
      iconSize: [34, 44],
      iconAnchor: [17, 44],
      popupAnchor: [0, -46]
    });
  }

  _clearMarkers() {
    this.markers.forEach(({ marker }) => marker.remove());
    this.markers = [];
    this.byId.clear();
  }

  /* ============================================================
     UI FLOTANTE (se inyecta en #qsMapWrap)
     ============================================================ */

  _buildOverlay() {
    if (!this.wrapper) return;

    this.wrapper.classList.add('qs-map-wrap');
    if (this.overlay && this.overlay.parentNode) {
      this.overlay.parentNode.removeChild(this.overlay);
    }

    const ui = document.createElement('div');
    ui.className = 'qs-map-overlay';
    ui.innerHTML = `
      <div class="qs-map-topbar">
        <span class="qs-map-count" aria-live="polite">0 propiedades en este mapa</span>
        <button type="button" class="qs-map-viewlist" data-map-action="view-list">
          <i class="fa-solid fa-list"></i><span>Ver lista</span>
        </button>
      </div>

      <div class="qs-map-controls" role="group" aria-label="Controles de mapa">
        <button type="button" class="qs-map-ctrl" data-map-action="zoom-in" aria-label="Acercar" title="Acercar">
          <i class="fa-solid fa-plus"></i>
        </button>
        <button type="button" class="qs-map-ctrl" data-map-action="zoom-out" aria-label="Alejar" title="Alejar">
          <i class="fa-solid fa-minus"></i>
        </button>
        <button type="button" class="qs-map-ctrl" data-map-action="locate" aria-label="Ubicación / centrar" title="Ubicación / centrar">
          <i class="fa-solid fa-location-crosshairs"></i>
        </button>
      </div>
    `;

    ui.addEventListener('click', e => this._onOverlayClick(e));

    this.wrapper.appendChild(ui);
    this.overlay = ui;
    this.countEl = ui.querySelector('.qs-map-count');
  }

  _onOverlayClick(e) {
    const btn = e.target.closest('[data-map-action]');
    if (!btn) return;
    e.preventDefault();

    switch (btn.dataset.mapAction) {
      case 'zoom-in':
        this.map && this.map.zoomIn();
        break;
      case 'zoom-out':
        this.map && this.map.zoomOut();
        break;
      case 'locate':
        this._locateUser();
        break;
      case 'view-list':
        if (this.app && typeof this.app.toggleView === 'function') {
          this.app.toggleView('list');
        }
        break;
    }
  }

  _updateCount() {
    if (!this.countEl) return;
    const n = this.markers.length;
    this.countEl.textContent = `${n} ${n === 1 ? 'propiedad' : 'propiedades'} en este mapa`;
  }

  _locateUser() {
    if (!this.map) return;

    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        pos => this.map.setView([pos.coords.latitude, pos.coords.longitude], 15, { animate: true }),
        () => this.fitAll(), // sin permiso → centrar resultados
        { enableHighAccuracy: false, timeout: 6000, maximumAge: 60000 }
      );
    } else {
      this.fitAll();
    }
  }

  /* ============================================================
     EVENTOS DE LA APP
     ============================================================ */

  _bindAppEvents() {
    if (!this.app || typeof this.app.on !== 'function') return;

    this._offs = [];

    const offResults = this.app.on('results:updated', () => {
      this.setProperties(this.app?.state?.results || []);
    });
    if (typeof offResults === 'function') this._offs.push(offResults);

    // El mapa nace oculto (tamaño 0). Al entrar a la vista mapa hay que
    // recalcular el tamaño de Leaflet para que se pinten bien los tiles.
    const offView = this.app.on('view:changed', (view) => {
      const v = typeof view === 'string' ? view : this.app?.state?.view;
      if (v !== 'map') return;
      setTimeout(() => this.map && this.map.invalidateSize(), 60);
      setTimeout(() => this.map && this.map.invalidateSize(), 260);
      setTimeout(() => this.map && this.fitAll(), 340);
    });
    if (typeof offView === 'function') this._offs.push(offView);
  }

  emit(evt, payload) {
    if (this.app && typeof this.app.emit === 'function') {
      this.app.emit(evt, payload);
    }
  }

  /* ============================================================
     HELPERS
     ============================================================ */

  _resolveDom() {
    if (!this.container) this.container = document.getElementById('qsMap');
    this.wrapper =
      document.getElementById('qsMapWrap') ||
      (this.container && this.container.parentElement) ||
      this.container;
  }

  /** Devuelve [lat,lng] numérico válido o null. Soporta lat/lng y latitud/longitud. */
  _getLatLng(property) {
    const lat = parseFloat(property?.lat ?? property?.latitud ?? property?.latitude);
    const lng = parseFloat(property?.lng ?? property?.longitud ?? property?.longitude);
    if (Number.isFinite(lat) && Number.isFinite(lng)) return [lat, lng];
    return null;
  }

  _propertyId(property) {
    return property?.id ?? property?.propiedad_id ?? null;
  }

  _setActive(id) {
    this.byId.forEach((entry, key) => {
      const el = entry.marker.getElement();
      if (!el) return;
      el.classList.toggle('qs-map-marker--active', key === id);
    });
    this.activeId = id;
  }
}

// Exponer globalmente
window.ResultsMap = ResultsMap;

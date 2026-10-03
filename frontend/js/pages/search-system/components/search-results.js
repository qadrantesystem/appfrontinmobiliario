/**
 * SearchResults — Componente de RESULTADOS (cards) + barra de SELECCIÓN.
 *
 * Contrato congelado (A1):
 *   class SearchResults { constructor(app){ this.app = app } async init(){} render(){} }
 *   Monta en: #qsResults (lista de cards) y #qsSelectionBar (acciones).
 *   Estado:   this.app.state.results | page | perPage | selected(Set)
 *   API app:  this.app.emit(evt, data) | this.app.selectProperty(id, on) | this.app.state
 *   Eventos:  this.app.on('results:updated'|'view:changed'|'map:focus', cb)
 *
 * Card flotante del mapa: #qsMapCard (oculta por defecto, se muestra con 'map:focus').
 * Solo toca tokens CSS --qs-* (con fallback por si A1 aún no los define).
 */

const QS_PLACEHOLDER =
  "data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='400' height='300'><rect width='100%' height='100%' fill='%23e9eef3'/><text x='50%' y='52%' font-family='sans-serif' font-size='16' fill='%2398a2ad' text-anchor='middle'>Sin imagen</text></svg>";

class SearchResults {
  constructor(app) {
    this.app = app;

    this.resultsEl = null;      // #qsResults
    this.selectionEl = null;    // #qsSelectionBar
    this.mapCardEl = null;      // #qsMapCard
    this.view = 'list';         // list | map | grid
    this.favorites = new Set(); // favoritos (toggle visual local, sin backend)
    this._bound = false;
  }

  /* ============================ init ============================ */

  async init() {
    this.resultsEl = document.getElementById('qsResults');
    this.selectionEl = document.getElementById('qsSelectionBar');
    this.ensureMapCard();
    this.bindEvents();
    this.render();
    this.renderSelectionBar();
    console.log('🏠 SearchResults listo (contrato A1)');
  }

  /* ======================== getters estado ===================== */

  get st() {
    return (this.app && this.app.state) || {};
  }

  get results() {
    return Array.isArray(this.st.results) ? this.st.results : [];
  }

  get perPage() {
    const n = Number(this.st.perPage);
    return n > 0 ? n : 10;
  }

  get page() {
    const n = Number(this.st.page);
    return n > 0 ? n : 1;
  }

  get selected() {
    if (!(this.st.selected instanceof Set)) {
      // Defensivo: si A1 aún no creó el Set, no rompemos.
      this.st.selected = new Set();
    }
    return this.st.selected;
  }

  /* =========================== render ========================== */

  render() {
    if (!this.resultsEl) this.resultsEl = document.getElementById('qsResults');
    if (!this.resultsEl) return;

    const total = this.results.length;

    if (total === 0) {
      this.resultsEl.innerHTML = this.renderEmpty();
      return;
    }

    // Paginación cliente-side: solo si hay más items que perPage (contrato).
    const per = this.perPage;
    const paginate = total > per;
    const totalPages = paginate ? Math.ceil(total / per) : 1;
    const page = paginate ? Math.min(Math.max(1, this.page), totalPages) : 1;
    const start = (page - 1) * per;
    const items = paginate ? this.results.slice(start, start + per) : this.results;

    const cards = items.map((p) => (this.isCombination(p) ? this.renderCompact(p) : this.renderCard(p))).join('');

    this.resultsEl.innerHTML = `
      <div class="qs-list">${cards}</div>
      ${paginate ? this.renderPagination(page, totalPages) : ''}
    `;
  }

  /* --------------------------- card grande --------------------------- */

  renderCard(p) {
    const id = this.idOf(p);
    const sel = this.selected.has(id);
    const fav = this.favorites.has(id);
    const imgs = this.images(p);
    const torre = p.torre || p.nombre_inmobiliario || '';
    const direccion = p.direccion || '';
    const precio = this.formatPrice(p);
    const area = p.area != null && p.area !== '' ? `${this.esc(p.area)} m²` : '';

    return `
      <article class="qs-card" data-qs-id="${this.esc(id)}">
        <div class="qs-media">
          <div class="qs-carousel" data-qs-carousel data-index="0">
            ${imgs.map((u, i) => `<img class="qs-img${i === 0 ? ' qs-img-active' : ''}" src="${this.esc(u)}" alt="${this.esc(p.titulo || 'Propiedad')}" loading="lazy" onerror="this.onerror=null;this.src='${QS_PLACEHOLDER}'">`).join('')}
          </div>

          <label class="qs-check" title="Seleccionar">
            <input type="checkbox" data-qs-select="${this.esc(id)}" ${sel ? 'checked' : ''}>
            <span class="qs-check-box"><i class="fa-solid fa-check"></i></span>
          </label>

          <button class="qs-fav${fav ? ' is-fav' : ''}" type="button" data-qs-fav="${this.esc(id)}" title="Favorito">
            <i class="fa-${fav ? 'solid' : 'regular'} fa-heart"></i>
          </button>

          ${imgs.length > 1 ? `
            <button class="qs-nav qs-prev" type="button" data-qs-prev title="Anterior"><i class="fa-solid fa-chevron-left"></i></button>
            <button class="qs-nav qs-next" type="button" data-qs-next title="Siguiente"><i class="fa-solid fa-chevron-right"></i></button>
            <span class="qs-imgcount"><b data-qs-cur>1</b>/${imgs.length}</span>
          ` : ''}
        </div>

        <div class="qs-body">
          <h3 class="qs-title">${this.esc(p.titulo || 'Sin título')}</h3>
          ${torre ? `<div class="qs-line"><i class="fa-solid fa-building"></i><span>${this.esc(torre)}</span></div>` : ''}
          ${direccion ? `<div class="qs-line"><i class="fa-solid fa-location-dot"></i><span>${this.esc(direccion)}</span></div>` : ''}
          <div class="qs-price">${this.esc(precio)}</div>
          <div class="qs-meta">
            ${area ? `<span class="qs-meta-item"><i class="fa-solid fa-ruler-combined"></i>${area}</span>` : ''}
            ${p.habitaciones != null ? `<span class="qs-meta-item"><i class="fa-solid fa-eye"></i>${this.esc(p.habitaciones)}</span>` : ''}
            ${p.banos != null ? `<span class="qs-meta-item"><i class="fa-solid fa-bath"></i>${this.esc(p.banos)}</span>` : ''}
            <button class="qs-btn qs-btn-primary qs-detail" type="button" data-qs-detail="${this.esc(id)}">Detalle</button>
          </div>
        </div>
      </article>
    `;
  }

  /* ------------------------ card compacta ------------------------ */

  renderCompact(p) {
    const id = this.idOf(p);
    const sel = this.selected.has(id);
    const imgs = this.images(p);
    const n = p.cantidad_oficinas || (Array.isArray(p.oficinas) ? p.oficinas.length : 2);
    const tag = (p.transaccion || 'venta').toUpperCase();
    const distrito = p.distrito || p.direccion || '';
    const piso = p.piso != null && p.piso !== '' ? ` · Piso ${this.esc(p.piso)}` : '';
    const areaTotal = p.area_total != null ? p.area_total : p.area;
    const precio = this.formatPrice(p);

    return `
      <article class="qs-card qs-card-compact" data-qs-id="${this.esc(id)}">
        <label class="qs-check qs-check-inline" title="Seleccionar">
          <input type="checkbox" data-qs-select="${this.esc(id)}" ${sel ? 'checked' : ''}>
          <span class="qs-check-box"><i class="fa-solid fa-check"></i></span>
        </label>

        <div class="qs-compact-body">
          <div class="qs-badges">
            <span class="qs-badge"><i class="fa-solid fa-layer-group"></i> ${this.esc(n)} OFICINAS</span>
            <span class="qs-tag">${this.esc(tag)}</span>
          </div>

          <div class="qs-compact-row">
            <div class="qs-compact-media" data-qs-carousel data-index="0">
              ${imgs.map((u, i) => `<img class="qs-img${i === 0 ? ' qs-img-active' : ''}" src="${this.esc(u)}" alt="${this.esc(p.titulo || 'Propiedad')}" loading="lazy" onerror="this.onerror=null;this.src='${QS_PLACEHOLDER}'">`).join('')}
              ${imgs.length > 1 ? `<span class="qs-imgcount"><b data-qs-cur>1</b>/${imgs.length}</span>` : ''}
            </div>

            <div class="qs-compact-info">
              <h3 class="qs-title">${this.esc(p.titulo || p.glosa || 'Combinación de oficinas')}</h3>
              <div class="qs-line"><i class="fa-solid fa-location-dot"></i><span>${this.esc(distrito)}${piso}</span></div>

              <div class="qs-compact-grid">
                <div class="qs-compact-cell">
                  <span class="qs-cell-label">ÁREA TOTAL</span>
                  <span class="qs-cell-value">${areaTotal != null ? `${this.esc(areaTotal)} m²` : '—'}</span>
                </div>
                <div class="qs-compact-cell">
                  <span class="qs-cell-label">PRECIO TOTAL</span>
                  <span class="qs-cell-value qs-cell-price">${this.esc(precio)}</span>
                </div>
              </div>

              <div class="qs-compact-actions">
                ${imgs.length > 1 ? `<button class="qs-nav qs-nav-sm qs-prev" type="button" data-qs-prev title="Anterior"><i class="fa-solid fa-chevron-left"></i></button>` : ''}
                <button class="qs-btn qs-btn-primary qs-detail" type="button" data-qs-detail="${this.esc(id)}">Detalle</button>
                ${imgs.length > 1 ? `<button class="qs-nav qs-nav-sm qs-next" type="button" data-qs-next title="Siguiente"><i class="fa-solid fa-chevron-right"></i></button>` : ''}
              </div>
            </div>
          </div>
        </div>
      </article>
    `;
  }

  renderEmpty() {
    return `
      <div class="qs-empty">
        <i class="fa-solid fa-magnifying-glass"></i>
        <h3>Sin resultados</h3>
        <p>Ajusta los filtros para encontrar propiedades.</p>
      </div>
    `;
  }

  /* ------------------------- paginación ------------------------- */

  renderPagination(current, totalPages) {
    const btn = (n, label, opts = '') =>
      `<button class="qs-page-btn ${opts}" type="button" data-qs-page="${n}">${label}</button>`;

    const parts = [btn(Math.max(1, current - 1), '<i class="fa-solid fa-chevron-left"></i>', current === 1 ? 'is-disabled' : '')];

    for (let i = 1; i <= totalPages; i++) {
      if (i === 1 || i === totalPages || (i >= current - 1 && i <= current + 1)) {
        parts.push(btn(i, i, i === current ? 'is-active' : ''));
      } else if (i === current - 2 || i === current + 2) {
        parts.push('<span class="qs-page-ellipsis">…</span>');
      }
    }

    parts.push(btn(Math.min(totalPages, current + 1), '<i class="fa-solid fa-chevron-right"></i>', current === totalPages ? 'is-disabled' : ''));
    return `<nav class="qs-pagination">${parts.join('')}</nav>`;
  }

  goToPage(n) {
    const per = this.perPage;
    const totalPages = Math.max(1, Math.ceil(this.results.length / per));
    const target = Math.min(Math.max(1, n), totalPages);

    if (this.app && this.app.state) this.app.state.page = target;
    if (this.app) {
      if (typeof this.app.setPage === 'function') this.app.setPage(target);
      else if (typeof this.app.emit === 'function') this.app.emit('page:changed', { page: target });
    }

    this.render();
    if (this.resultsEl && this.resultsEl.scrollIntoView) {
      this.resultsEl.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  }

  /* ==================== barra de selección ====================== */

  renderSelectionBar() {
    if (!this.selectionEl) this.selectionEl = document.getElementById('qsSelectionBar');
    if (!this.selectionEl) return;

    const count = this.selected.size;

    if (count === 0) {
      this.selectionEl.innerHTML = '';
      this.selectionEl.classList.remove('qs-sel-visible');
      this.selectionEl.hidden = true;
      return;
    }

    this.selectionEl.hidden = false;
    this.selectionEl.classList.add('qs-sel-visible');
    this.selectionEl.innerHTML = `
      <div class="qs-sel-count"><i class="fa-solid fa-circle-check"></i> ${count} seleccionada${count > 1 ? 's' : ''}</div>
      <div class="qs-sel-actions">
        <button class="qs-sel-btn" type="button" data-qs-action="save"><i class="fa-regular fa-bookmark"></i><span>Guardar</span></button>
        <button class="qs-sel-btn" type="button" data-qs-action="share"><i class="fa-solid fa-share-nodes"></i><span>Compartir</span></button>
        <button class="qs-sel-btn" type="button" data-qs-action="compare"><i class="fa-solid fa-code-compare"></i><span>Comparar</span></button>
      </div>
    `;
  }

  toggleSelection(id, on) {
    // A1 normaliza los ids a Number en app.state.selected.
    const key = /^\d+$/.test(String(id)) ? Number(id) : id;

    if (typeof this.app.selectProperty === 'function') {
      // selectProperty ya actualiza el Set y emite 'selection:changed'.
      this.app.selectProperty(key, on);
    } else {
      if (!(this.st.selected instanceof Set)) this.st.selected = new Set();
      on ? this.st.selected.add(key) : this.st.selected.delete(key);
      if (typeof this.app.emit === 'function') {
        this.app.emit('selection:changed', { count: this.selected.size });
      }
    }
    this.renderSelectionBar();
  }

  emitAction(action) {
    const payload = { action, count: this.selected.size, ids: Array.from(this.selected) };
    if (typeof this.app.emit === 'function') this.app.emit(`selection:${action}`, payload);
    console.log(`📋 Acción de selección: ${action}`, payload);
  }

  /* ====================== card flotante mapa ==================== */

  ensureMapCard() {
    // El host #qsMapCard ya existe en el HTML de A1 (dentro de #qsMapWrap).
    // No le ponemos clase/posición propias para no pisar el layout de A1.
    let el = document.getElementById('qsMapCard');
    if (!el) {
      el = document.createElement('div');
      el.id = 'qsMapCard';
      document.body.appendChild(el);
    }
    el.hidden = true;
    this.mapCardEl = el;
  }

  renderMapCard(prop) {
    if (!this.mapCardEl) this.ensureMapCard();
    if (!prop || this.idOf(prop) == null) {
      this.hideMapCard();
      return;
    }

    const id = this.idOf(prop);
    const img = this.images(prop)[0];
    const torre = prop.torre || prop.nombre_inmobiliario || '';
    const precio = this.formatPrice(prop);

    this.mapCardEl.innerHTML = `
      <button class="qs-map-card-close" type="button" data-qs-mc-close title="Cerrar"><i class="fa-solid fa-xmark"></i></button>
      <div class="qs-mc-media">
        <img class="qs-img" src="${this.esc(img)}" alt="${this.esc(prop.titulo || 'Propiedad')}" onerror="this.onerror=null;this.src='${QS_PLACEHOLDER}'">
      </div>
      <div class="qs-mc-body">
        <h3 class="qs-mc-title">${this.esc(prop.titulo || 'Sin título')}</h3>
        ${torre ? `<div class="qs-line"><i class="fa-solid fa-building"></i><span>${this.esc(torre)}</span></div>` : ''}
        ${prop.direccion ? `<div class="qs-line"><i class="fa-solid fa-location-dot"></i><span>${this.esc(prop.direccion)}</span></div>` : ''}
        <div class="qs-mc-price">${this.esc(precio)}</div>
        <div class="qs-mc-actions">
          <button class="qs-btn qs-btn-primary" type="button" data-qs-detail="${this.esc(id)}">Ver detalle</button>
          <button class="qs-mc-chevron" type="button" data-qs-mc-toggle title="Contraer"><i class="fa-solid fa-chevron-down"></i></button>
        </div>
      </div>
    `;
    this.mapCardEl.hidden = false;
    this.mapCardEl.classList.remove('qs-hidden');
  }

  hideMapCard() {
    if (!this.mapCardEl) return;
    this.mapCardEl.hidden = true;
    this.mapCardEl.classList.add('qs-hidden');
  }

  /* ============================ eventos ========================= */

  bindEvents() {
    if (this._bound) return;
    this._bound = true;

    // Delegación de clicks en la lista de resultados.
    if (this.resultsEl) {
      this.resultsEl.addEventListener('click', (e) => this.onResultsClick(e));
      this.resultsEl.addEventListener('change', (e) => {
        const cb = e.target.closest('[data-qs-select]');
        if (!cb) return;
        this.toggleSelection(cb.dataset.qsSelect, cb.checked);
      });
    }

    // Acciones de la barra de selección.
    if (this.selectionEl) {
      this.selectionEl.addEventListener('click', (e) => {
        const btn = e.target.closest('[data-qs-action]');
        if (!btn) return;
        this.emitAction(btn.dataset.qsAction);
      });
    }

    // Card flotante del mapa (delegado en body).
    document.body.addEventListener('click', (e) => {
      if (!this.mapCardEl) return;
      if (e.target.closest('[data-qs-mc-toggle]')) {
        this.mapCardEl.classList.toggle('qs-collapsed');
        return;
      }
      if (e.target.closest('[data-qs-mc-close]')) {
        this.hideMapCard();
        return;
      }
      const det = e.target.closest('[data-qs-detail]');
      if (det && this.mapCardEl.contains(det)) {
        this.openDetail(this.findResult(det.dataset.qsDetail));
      }
    });

    // Suscripciones al orquestador (contrato).
    if (typeof this.app.on === 'function') {
      this.app.on('results:updated', () => { this.render(); this.renderSelectionBar(); });
      this.app.on('view:changed', (data) => this.onViewChanged(data));
      this.app.on('map:focus', (data) => this.renderMapCard(data && (data.property || data)));
      // Nos registramos DESPUÉS de SearchShell → nuestra barra es la definitiva.
      this.app.on('selection:changed', () => this.renderSelectionBar());
    }
  }

  onResultsClick(e) {
    const card = e.target.closest('.qs-card');
    if (!card) return;

    if (e.target.closest('[data-qs-prev]')) { e.stopPropagation(); this.moveCarousel(card, -1); return; }
    if (e.target.closest('[data-qs-next]')) { e.stopPropagation(); this.moveCarousel(card, 1); return; }
    if (e.target.closest('[data-qs-fav]')) { e.stopPropagation(); this.toggleFavorite(card.dataset.qsId); return; }
    if (e.target.closest('[data-qs-select]')) { e.stopPropagation(); return; }

    const pageBtn = e.target.closest('[data-qs-page]');
    if (pageBtn) {
      if (!pageBtn.classList.contains('is-disabled')) this.goToPage(Number(pageBtn.dataset.qsPage));
      return;
    }

    const detail = e.target.closest('[data-qs-detail]');
    if (detail) { e.stopPropagation(); this.openDetail(this.findResult(detail.dataset.qsDetail)); return; }

    // Click en cualquier parte de la card (salvo controles) abre detalle.
    if (!e.target.closest('button, input, label')) {
      this.openDetail(this.findResult(card.dataset.qsId));
    }
  }

  onViewChanged(data) {
    this.view = (data && (data.view || data.mode)) || this.st.view || 'list';
    if (this.resultsEl) {
      this.resultsEl.classList.remove('qs-view-list', 'qs-view-map', 'qs-view-grid');
      this.resultsEl.classList.add(`qs-view-${this.view}`);
    }
    this.render();
  }

  /* ========================= carrusel =========================== */

  moveCarousel(cardEl, dir) {
    const wrap = cardEl.querySelector('[data-qs-carousel]');
    if (!wrap) return;
    const imgs = wrap.querySelectorAll('.qs-img');
    if (imgs.length < 2) return;

    let idx = parseInt(wrap.dataset.index || '0', 10) || 0;
    idx = (idx + dir + imgs.length) % imgs.length;
    wrap.dataset.index = String(idx);
    imgs.forEach((im, i) => im.classList.toggle('qs-img-active', i === idx));
    const cur = cardEl.querySelector('[data-qs-cur]');
    if (cur) cur.textContent = String(idx + 1);
  }

  /* ======================== favoritos =========================== */

  toggleFavorite(id) {
    if (this.favorites.has(id)) this.favorites.delete(id);
    else this.favorites.add(id);

    const fav = this.favorites.has(id);
    // Actualiza sin re-render completo.
    if (this.resultsEl) {
      const btn = this.resultsEl.querySelector(`[data-qs-fav="${this.cssEscape(id)}"]`);
      if (btn) {
        btn.classList.toggle('is-fav', fav);
        const icon = btn.querySelector('i');
        if (icon) icon.className = `fa-${fav ? 'solid' : 'regular'} fa-heart`;
      }
    }
  }

  /* ========================= detalle ============================ */

  openDetail(prop) {
    if (!prop) return;
    const id = this.idOf(prop);

    // Modo invitado → login; con sesión → evento para que A1 abra el detalle.
    if (this.st.mode === 'guest') {
      window.location.href = 'login.html';
      return;
    }
    if (typeof this.app.openDetail === 'function') {
      this.app.openDetail(prop);
      return;
    }
    if (typeof this.app.emit === 'function') {
      this.app.emit('property:open', { id, property: prop });
    }
  }

  /* ========================== utils ============================= */

  isCombination(p) {
    return (
      p.tipo === 'combinacion' ||
      p.es_combinacion === true ||
      (Array.isArray(p.oficinas) && p.oficinas.length > 1) ||
      (p.cantidad_oficinas != null && Number(p.cantidad_oficinas) > 1)
    );
  }

  idOf(p) {
    return p.id != null ? p.id : (p.registro_cab_id != null ? p.registro_cab_id : p.propiedad_id);
  }

  findResult(id) {
    return this.results.find((p) => String(this.idOf(p)) === String(id));
  }

  images(p) {
    const arr = Array.isArray(p.imagenes)
      ? p.imagenes
      : (Array.isArray(p.imagenes_galeria) ? p.imagenes_galeria : []);
    const urls = arr.map((i) => (typeof i === 'string' ? i : i && i.url)).filter(Boolean);
    if (urls.length === 0) {
      const single = p.imagen_principal || p.imagen;
      if (single) urls.push(single);
    }
    return urls.length ? urls : [QS_PLACEHOLDER];
  }

  formatPrice(p) {
    const moneda = p.moneda || 'USD';
    const raw = p.precio != null ? p.precio
      : (p.precio_total != null ? p.precio_total
        : (p.precio_venta != null ? p.precio_venta : p.precio_alquiler));
    if (raw == null || raw === '') return 'Consultar';

    const num = Number(raw);
    const val = isNaN(num) ? String(raw) : num.toLocaleString('en-US');
    const perMonth = (p.transaccion === 'alquiler' || p.precio_alquiler != null) ? '/mes' : '';
    return `${moneda} ${val}${perMonth}`;
  }

  esc(v) {
    return String(v == null ? '' : v).replace(/[&<>"']/g, (c) => (
      { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]
    ));
  }

  cssEscape(v) {
    return String(v == null ? '' : v).replace(/["\\]/g, '\\$&');
  }
}

window.SearchResults = SearchResults;

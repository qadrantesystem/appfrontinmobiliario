// Dashboard Filters Module
(function(window) {
  'use strict';

  class DashboardFilters {
    constructor(dashboard) {
      this.dashboard = dashboard;
      this.activeTab = null;
      this.selectedTipos = [];
      this.selectedDistritos = [];
      this.selectedTransaccion = '';
      this.searchPropietario = '';
      this.areaTarget = null;
      this.areaMargen = 15;
    }

    setActiveTab(tab) {
      this.activeTab = tab;
    }

    render() {
      const isAdmin = this.dashboard.currentUser?.perfil_id === 4;
      const showTransaccion = [1, 2, 3].includes(this.dashboard.currentUser?.perfil_id);

      return `
        <div class="filters-container" style="padding: 8px 12px; border: 1px solid #e2e8f0; border-radius: 8px; background: #fafbfc;">
          <!-- Header: leyenda compacta + boton toggle a la derecha -->
          <div style="display: flex; align-items: center; justify-content: space-between; gap: 6px;">
            <div style="display: flex; align-items: center; gap: 6px; flex: 1; overflow: hidden;">
              <span id="filterBadgeTipo" style="font-size: 0.62rem; color: #6b7280; white-space: nowrap;" title="Tipo de inmueble">Todos</span>
              <span style="color: #d1d5db;">|</span>
              <span id="filterBadgeDistrito" style="font-size: 0.62rem; color: #6b7280; white-space: nowrap;" title="Distrito">Todos</span>
              <span style="color: #d1d5db;">|</span>
              <span id="filterBadgeArea" style="font-size: 0.62rem; color: #6b7280; white-space: nowrap;" title="Area m2">--m2</span>
            </div>
            <div style="display: flex; gap: 4px; flex-shrink: 0;">
              <button id="btnClearAllFilters" class="filters-btn-limpiar" title="Limpiar filtros"
                      style="padding: 3px 8px; font-size: 0.6rem; border-radius: 4px; border: 1px solid #fca5a5; background: #fef2f2; color: #ef4444; cursor: pointer;">
                <i class="fas fa-times"></i>
              </button>
              <button id="filtersToggleBtn" title="Mostrar/ocultar filtros"
                      style="padding: 4px 10px; font-size: 0.65rem; border-radius: 5px; border: 1.5px solid var(--azul-corporativo); background: white; color: var(--azul-corporativo); cursor: pointer; font-weight: 600;">
                <i class="fas fa-filter"></i> Filtros <span id="filtersToggleIcon">▼</span>
              </button>
            </div>
          </div>

          <!-- Filtros colapsables -->
          <div class="filters-row" id="filtersContent" style="margin-top: 8px;">
            <div class="filter-item">
              <div id="tipoMulti" class="multi-select">
                <button type="button" class="multi-select__button" id="tipoToggle">
                  <span class="multi-select__placeholder" id="tipoPlaceholder">Tipo</span>
                  <span class="multi-select__tags" id="tipoTags"></span>
                  <span class="multi-select__arrow">&#9662;</span>
                </button>
                <div class="multi-select__panel" id="tipoPanel" hidden>
                  <div class="multi-select__options" id="tipoOptions"></div>
                  <div class="multi-select__actions">
                    <button type="button" id="tipoClear" class="multi-select__action alt">Limpiar</button>
                  </div>
                </div>
              </div>
            </div>

            <div class="filter-item">
              <div id="distritoMulti" class="multi-select">
                <button type="button" class="multi-select__button" id="distritoToggle">
                  <span class="multi-select__placeholder" id="distritoPlaceholder">Distrito</span>
                  <span class="multi-select__tags" id="distritoTags"></span>
                  <span class="multi-select__arrow">&#9662;</span>
                </button>
                <div class="multi-select__panel" id="distritoPanel" hidden>
                  <div class="multi-select__search">
                    <input type="text" id="distritoSearch" placeholder="Buscar..." class="multi-select__search-input">
                  </div>
                  <div class="multi-select__options" id="distritoOptions"></div>
                  <div class="multi-select__actions">
                    <button type="button" id="distritoSelectAll" class="multi-select__action">Todos</button>
                    <button type="button" id="distritoClear" class="multi-select__action alt">Limpiar</button>
                  </div>
                </div>
              </div>
            </div>

            ${showTransaccion ? `
            <div class="filter-item">
              <select id="filterTransaccion" class="filter-select" title="Tipo transaccion">
                <option value="">V/A</option>
                <option value="venta">Venta</option>
                <option value="alquiler">Alquiler</option>
              </select>
            </div>
            ` : ''}

            <div class="filter-item filter-item--metraje">
              <input type="number" id="filterMetraje" class="filter-input-metraje" placeholder="m2" title="Area en m2 (+-15%)" min="1" step="1">
            </div>

            ${isAdmin ? `
            <div class="filter-item">
              <input type="text" id="filterPropietario" class="filter-select" placeholder="Propietario" title="Buscar por nombre de propietario">
            </div>
            ` : ''}
          </div>
        </div>
      `;
    }

    async setup() {
      await this.loadOptions();

      // Toggle filtros (acordeon)
      const toggleBtn = document.getElementById('filtersToggleBtn');
      const filtersContent = document.getElementById('filtersContent');
      const toggleIcon = document.getElementById('filtersToggleIcon');
      if (toggleBtn && filtersContent) {
        // En mobile empieza cerrado
        if (window.innerWidth <= 768) {
          filtersContent.style.display = 'none';
          if (toggleIcon) toggleIcon.textContent = '▶';
        }
        toggleBtn.addEventListener('click', (e) => {
          e.stopPropagation();
          const isOpen = filtersContent.style.display !== 'none';
          filtersContent.style.display = isOpen ? 'none' : 'flex';
          if (toggleIcon) toggleIcon.textContent = isOpen ? '▶' : '▼';
        });
      }

      // Filtro Transaccion
      const filterTransaccion = document.getElementById('filterTransaccion');
      if (filterTransaccion) {
        filterTransaccion.addEventListener('change', (e) => {
          this.selectedTransaccion = e.target.value;
          this.apply();
        });
      }

      // Filtro Metraje (un solo campo, busca +-15)
      const filterMetraje = document.getElementById('filterMetraje');
      if (filterMetraje) {
        filterMetraje.addEventListener('input', (e) => {
          this.areaTarget = e.target.value ? parseFloat(e.target.value) : null;
          this.apply();
        });
      }

      // Filtro Propietario (Solo Admin)
      const filterPropietario = document.getElementById('filterPropietario');
      if (filterPropietario) {
        filterPropietario.addEventListener('input', (e) => {
          this.searchPropietario = e.target.value.toLowerCase().trim();
          this.apply();
        });
      }

      // Limpiar todo
      const btnClear = document.getElementById('btnClearAllFilters');
      if (btnClear) {
        btnClear.addEventListener('click', () => this.clearAll());
      }
    }

    async loadOptions() {
      try {
        const token = this.dashboard.authService?.getToken() || authService.getToken();

        const tiposRes = await fetch(`${API_CONFIG.BASE_URL}/tipos-inmueble`);
        if (!tiposRes.ok) throw new Error(`Error ${tiposRes.status} al cargar tipos`);

        const tiposData = await tiposRes.json();
        let tiposArray = tiposData.data || tiposData || [];
        tiposArray.sort((a, b) => (a.orden || 999) - (b.orden || 999));
        const tipos = tiposArray.length > 0 ? tiposArray.map(t => t.nombre) : this.getTiposFallback();

        const distritosRes = await fetch(`${API_CONFIG.BASE_URL}/distritos`, {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        const distritosData = await distritosRes.json();
        const distritos = distritosData.data?.map(d => d.nombre) || this.getDistritosFallback();

        this.setupMultiSelect('tipo', tipos);
        this.setupMultiSelect('distrito', distritos);
      } catch (error) {
        console.error('Error cargando opciones:', error);
        this.setupMultiSelect('tipo', this.getTiposFallback());
        this.setupMultiSelect('distrito', this.getDistritosFallback());
      }
    }

    getTiposFallback() {
      return [
        'Edificio de oficinas completo', 'Oficina en Edificio', 'Oficina Independiente',
        'Edificio de departamentos completo', 'Departamento', 'Condominio',
        'Casa', 'Local Comercial', 'Consultorio', 'Terreno',
        'Almacén', 'Cochera', 'Depósito', 'Habitación'
      ];
    }

    getDistritosFallback() {
      return ['San Isidro', 'Miraflores', 'San Borja', 'Surco', 'La Molina', 'Barranco', 'Jesús María', 'Lince', 'Magdalena', 'Pueblo Libre'];
    }

    setupMultiSelect(type, options) {
      const toggle = document.getElementById(`${type}Toggle`);
      const panel = document.getElementById(`${type}Panel`);
      const optionsEl = document.getElementById(`${type}Options`);
      const tagsEl = document.getElementById(`${type}Tags`);
      const placeholderEl = document.getElementById(`${type}Placeholder`);
      const clearBtn = document.getElementById(`${type}Clear`);
      const selectAllBtn = document.getElementById(`${type}SelectAll`);

      if (!toggle || !panel || !optionsEl) return;

      optionsEl.innerHTML = options.map(opt => `
        <label class="multi-select__option">
          <input type="checkbox" value="${opt}" data-type="${type}">
          <span>${opt}</span>
        </label>
      `).join('');

      toggle.addEventListener('click', () => {
        const isHidden = panel.hasAttribute('hidden');
        document.querySelectorAll('.multi-select__panel').forEach(p => p.setAttribute('hidden', ''));
        if (isHidden) panel.removeAttribute('hidden');
      });

      optionsEl.querySelectorAll('input[type="checkbox"]').forEach(cb => {
        cb.addEventListener('change', () => {
          if (type === 'tipo') {
            this.selectedTipos = Array.from(optionsEl.querySelectorAll('input:checked')).map(c => c.value);
          } else if (type === 'distrito') {
            this.selectedDistritos = Array.from(optionsEl.querySelectorAll('input:checked')).map(c => c.value);
          }
          this.updateTags(type, tagsEl, placeholderEl);
          this.apply();
        });
      });

      if (clearBtn) {
        clearBtn.addEventListener('click', () => {
          optionsEl.querySelectorAll('input[type="checkbox"]').forEach(cb => cb.checked = false);
          if (type === 'tipo') this.selectedTipos = [];
          else if (type === 'distrito') this.selectedDistritos = [];
          this.updateTags(type, tagsEl, placeholderEl);
          this.apply();
        });
      }

      if (selectAllBtn) {
        selectAllBtn.addEventListener('click', () => {
          optionsEl.querySelectorAll('input[type="checkbox"]').forEach(cb => cb.checked = true);
          if (type === 'distrito') this.selectedDistritos = options;
          this.updateTags(type, tagsEl, placeholderEl);
          this.apply();
        });
      }

      const searchInput = document.getElementById(`${type}Search`);
      if (searchInput) {
        searchInput.addEventListener('input', (e) => {
          const query = e.target.value.toLowerCase();
          optionsEl.querySelectorAll('.multi-select__option').forEach(opt => {
            const text = opt.textContent.toLowerCase();
            opt.style.display = text.includes(query) ? 'flex' : 'none';
          });
        });
      }

      document.addEventListener('click', (e) => {
        if (!toggle.contains(e.target) && !panel.contains(e.target)) {
          panel.setAttribute('hidden', '');
        }
      });
    }

    updateTags(type, tagsEl, placeholderEl) {
      const selected = type === 'tipo' ? this.selectedTipos : this.selectedDistritos;

      if (selected.length === 0) {
        placeholderEl.style.display = 'inline';
        tagsEl.innerHTML = '';
      } else {
        placeholderEl.style.display = 'none';
        const maxTags = 2;
        const tags = selected.slice(0, maxTags).map(s => `<span class="multi-select__tag">${s}</span>`).join('');
        const extra = selected.length > maxTags ? `<span class="multi-select__tag">+${selected.length - maxTags}</span>` : '';
        tagsEl.innerHTML = tags + extra;
      }
    }

    apply() {
      if (this.activeTab && typeof this.activeTab.renderPropertiesPage === 'function') {
        this.dashboard.pagination.currentPage = 1;
        this.activeTab.renderPropertiesPage();
      }
    }

    clearAll() {
      this.selectedTipos = [];
      this.selectedDistritos = [];
      this.selectedTransaccion = '';
      this.searchPropietario = '';
      this.areaTarget = null;

      document.querySelectorAll('.multi-select__panel input[type="checkbox"]').forEach(cb => cb.checked = false);
      document.querySelectorAll('.multi-select__tags').forEach(el => el.innerHTML = '');
      document.querySelectorAll('.multi-select__placeholder').forEach(el => el.style.display = 'inline');

      const filterTransaccion = document.getElementById('filterTransaccion');
      if (filterTransaccion) filterTransaccion.value = '';

      const filterPropietario = document.getElementById('filterPropietario');
      if (filterPropietario) filterPropietario.value = '';

      const filterMetraje = document.getElementById('filterMetraje');
      if (filterMetraje) filterMetraje.value = '';

      this.apply();
    }

    getFiltered(properties) {
      let filtered = [...properties];

      if (this.selectedTipos.length > 0) {
        filtered = filtered.filter(p => this.selectedTipos.includes(p.tipo_inmueble));
      }

      if (this.selectedDistritos.length > 0) {
        filtered = filtered.filter(p => this.selectedDistritos.includes(p.distrito));
      }

      if (this.selectedTransaccion) {
        filtered = filtered.filter(p => p.transaccion === this.selectedTransaccion);
      }

      if (this.searchPropietario) {
        filtered = filtered.filter(p => {
          const propietario = (p.propietario_real_nombre || p.propietario_nombre || p.propietario || '').toLowerCase();
          return propietario.includes(this.searchPropietario);
        });
      }

      if (this.areaTarget) {
        const min = this.areaTarget - this.areaMargen;
        const max = this.areaTarget + this.areaMargen;
        filtered = filtered.filter(p => {
          const area = parseFloat(p.area);
          return area >= min && area <= max;
        });
      }

      return filtered;
    }
  }

  window.DashboardFilters = DashboardFilters;

})(window);

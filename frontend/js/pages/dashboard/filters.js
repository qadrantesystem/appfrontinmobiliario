// Dashboard Filters Module
(function(window) {
  'use strict';

  class DashboardFilters {
    constructor(dashboard) {
      this.dashboard = dashboard;
      this.selectedTipos = [];
      this.selectedDistritos = [];
      this.selectedEstado = '';
    }

    render() {
      return `
        <div style="background: white; padding: var(--spacing-md); border-radius: var(--radius-md); border: 1px solid var(--borde); margin-bottom: var(--spacing-md);">
          <div style="display: flex; align-items: center; gap: var(--spacing-md); flex-wrap: wrap;">
            <span style="color: var(--azul-corporativo); font-weight: 600; font-size: 0.9rem;">🔍 Filtros</span>
            
            <!-- Tipo Inmueble -->
            <div style="flex: 1; min-width: 200px;">
              <div id="tipoMulti" class="multi-select">
                <button type="button" class="multi-select__button" id="tipoToggle" style="padding: 8px 12px;">
                  <span class="multi-select__placeholder" id="tipoPlaceholder">Tipo de Inmueble</span>
                  <span class="multi-select__tags" id="tipoTags"></span>
                  <span class="multi-select__arrow">▾</span>
                </button>
                <div class="multi-select__panel" id="tipoPanel" hidden>
                  <div class="multi-select__options" id="tipoOptions"></div>
                  <div class="multi-select__actions">
                    <button type="button" id="tipoClear" class="multi-select__action alt">Limpiar</button>
                  </div>
                </div>
              </div>
            </div>

            <!-- Distrito -->
            <div style="flex: 1; min-width: 200px;">
              <div id="distritoMulti" class="multi-select">
                <button type="button" class="multi-select__button" id="distritoToggle" style="padding: 8px 12px;">
                  <span class="multi-select__placeholder" id="distritoPlaceholder">Distrito</span>
                  <span class="multi-select__tags" id="distritoTags"></span>
                  <span class="multi-select__arrow">▾</span>
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

            <button id="btnClearAllFilters" class="btn btn-secondary" style="padding: 8px 16px;">Limpiar</button>
          </div>
        </div>
      `;
    }

    async setup() {
      // Cargar desde API
      await this.loadOptions();
      
      // Limpiar todo
      const btnClear = document.getElementById('btnClearAllFilters');
      if (btnClear) {
        btnClear.addEventListener('click', () => this.clearAll());
      }
    }

    async loadOptions() {
      try {
        const token = this.dashboard.authService?.getToken() || authService.getToken();
        
        // Cargar tipos desde API
        const tiposRes = await fetch(`${API_CONFIG.BASE_URL}/tipos-inmueble`, {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        const tiposData = await tiposRes.json();
        const tipos = tiposData.data?.map(t => t.nombre) || this.getTiposFallback();
        
        // Cargar distritos desde API
        const distritosRes = await fetch(`${API_CONFIG.BASE_URL}/distritos`, {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        const distritosData = await distritosRes.json();
        const distritos = distritosData.data?.map(d => d.nombre) || this.getDistritosFallback();
        
        // Setup multi-selects
        this.setupMultiSelect('tipo', tipos);
        this.setupMultiSelect('distrito', distritos);
      } catch (error) {
        console.error('Error cargando opciones:', error);
        // Fallback con datos de BD
        this.setupMultiSelect('tipo', this.getTiposFallback());
        this.setupMultiSelect('distrito', this.getDistritosFallback());
      }
    }

    getTiposFallback() {
      return ['Oficina en Edificio', 'Casa', 'Departamento', 'Local Comercial', 'Terreno', 'Almacén', 'Cochera', 'Habitación', 'Oficina Independiente', 'Consultorio', 'Depósito', 'Edificio Completo'];
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

      // Renderizar opciones
      optionsEl.innerHTML = options.map(opt => `
        <label class="multi-select__option">
          <input type="checkbox" value="${opt}" data-type="${type}">
          <span>${opt}</span>
        </label>
      `).join('');

      // Toggle panel
      toggle.addEventListener('click', () => {
        const isHidden = panel.hasAttribute('hidden');
        document.querySelectorAll('.multi-select__panel').forEach(p => p.setAttribute('hidden', ''));
        if (isHidden) panel.removeAttribute('hidden');
      });

      // Checkboxes
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

      // Clear button
      if (clearBtn) {
        clearBtn.addEventListener('click', () => {
          optionsEl.querySelectorAll('input[type="checkbox"]').forEach(cb => cb.checked = false);
          if (type === 'tipo') this.selectedTipos = [];
          else if (type === 'distrito') this.selectedDistritos = [];
          this.updateTags(type, tagsEl, placeholderEl);
          this.apply();
        });
      }

      // Select all
      if (selectAllBtn) {
        selectAllBtn.addEventListener('click', () => {
          optionsEl.querySelectorAll('input[type="checkbox"]').forEach(cb => cb.checked = true);
          if (type === 'distrito') this.selectedDistritos = options;
          this.updateTags(type, tagsEl, placeholderEl);
          this.apply();
        });
      }

      // Search (solo distrito)
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

      // Cerrar al hacer click fuera
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
      this.dashboard.currentPage = 1;
      this.dashboard.renderPropertiesPage();
    }

    clearAll() {
      this.selectedTipos = [];
      this.selectedDistritos = [];
      
      document.querySelectorAll('.multi-select__panel input[type="checkbox"]').forEach(cb => cb.checked = false);
      document.querySelectorAll('.multi-select__tags').forEach(el => el.innerHTML = '');
      document.querySelectorAll('.multi-select__placeholder').forEach(el => el.style.display = 'inline');
      
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
      
      return filtered;
    }
  }

  window.DashboardFilters = DashboardFilters;

})(window);

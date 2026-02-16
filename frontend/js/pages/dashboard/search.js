/**
 * 🔍 SEARCH MODULE - Módulo de Búsquedas para Dashboard
 * Maneja el modal de búsqueda y los resultados dentro del tab
 */

class SearchModule {
  constructor(dashboard) {
    this.dashboard = dashboard;
    this.currentSearchId = null;
    this.searchResults = [];
    this.searchCount = 0;
    
    // Catálogos
    this.tiposInmuebles = [];
    this.distritos = [];
    
    // Criterios de búsqueda actual
    this.currentCriteria = {};
  }

  // Traer propiedades y filtrar según criterios actuales
  async searchProperties() {
    const resp = await fetch(`${API_CONFIG.BASE_URL}/propiedades?limit=100`);
    if (!resp.ok) throw new Error('Error obteniendo propiedades');
    const data = await resp.json();
    const props = Array.isArray(data) ? data : (data.data || []);

    const c = this.currentCriteria || {};
    const tipoId = c.tipo_inmueble_id ? parseInt(c.tipo_inmueble_id) : null;
    const distritosSel = Array.isArray(c.distrito_id) ? c.distrito_id : null;
    const trans = c.transaccion; // 'venta' | 'alquiler'
    const areaMin = c.area_min ? parseFloat(c.area_min) : null;
    const precioMax = c.precio_max ? parseFloat(c.precio_max) : null;

    this.searchResults = props.filter(p => {
      if (tipoId && parseInt(p.tipo_inmueble_id) !== tipoId) return false;
      if (distritosSel && distritosSel.length > 0 && !distritosSel.includes(p.distrito_id)) return false;
      if (trans === 'alquiler' && !p.precio_alquiler) return false;
      if (trans === 'venta' && !p.precio_venta) return false;
      if (areaMin && parseFloat(p.area || 0) < areaMin) return false;
      if (precioMax) {
        const precio = trans === 'alquiler' ? parseFloat(p.precio_alquiler || 0) : parseFloat(p.precio_venta || 0);
        if (!isNaN(precio) && precio > precioMax) return false;
      }
      return true;
    });
  }

  async init() {
    await this.loadCatalogos();
  }

  async loadCatalogos() {
    try {
      // APIs PÚBLICAS
      const [tiposRes, distritosRes] = await Promise.all([
        fetch(`${API_CONFIG.BASE_URL}/tipos-inmueble`),
        fetch(`${API_CONFIG.BASE_URL}/distritos`)
      ]);
      
      if (!tiposRes.ok || !distritosRes.ok) {
        throw new Error('Error cargando catálogos');
      }
      
      const tiposData = await tiposRes.json();
      const distritosData = await distritosRes.json();
      
      this.tiposInmuebles = tiposData.data || tiposData || [];
      this.distritos = distritosData.data || distritosData || [];
      
    } catch (error) {
      console.error('❌ Error cargando catálogos:', error);
      throw error;
    }
  }

  renderSearchModal() {
    const modalHtml = `
      <div class="modal-overlay" id="dashboardModalBusqueda" style="display:flex;">
        <div class="modal-busqueda" role="dialog" aria-modal="true">
          <button class="modal-close" id="btnCerrarModalDashboard" aria-label="Cerrar">
            <i class="fas fa-times"></i>
          </button>
          <div class="container">
            <div class="filtro-simplificado-card">
              <h2>Búsqueda Generica</h2>

              <!-- Tipo de Inmueble -->
              <div class="form-group">
                <label>Tipo de Inmueble</label>
                <select id="search_tipo_inmueble" class="form-control">
                  <option value="">Selecciona un tipo...</option>
                  ${this.tiposInmuebles.map(tipo => `<option value="${tipo.tipo_inmueble_id}">${tipo.nombre}</option>`).join('')}
                </select>
              </div>

              <!-- Distritos -->
              <div class="form-group">
                <label>Distritos</label>
                <div id="distritoMulti" class="multi-select">
                  <button type="button" class="multi-select__button" id="distritoToggle" aria-expanded="false" aria-haspopup="listbox">
                    <span class="multi-select__placeholder" id="distritoPlaceholder">Selecciona distritos...</span>
                    <span class="multi-select__tags" id="distritoTags"></span>
                    <span class="multi-select__arrow">▾</span>
                  </button>
                  <div class="multi-select__panel" id="distritoPanel" role="listbox" aria-multiselectable="true" hidden>
                    <div class="multi-select__search">
                      <input type="text" id="distritoSearch" placeholder="Buscar distrito..." class="multi-select__search-input">
                    </div>
                    <div class="multi-select__options" id="distritoOptions"></div>
                    <div class="multi-select__actions">
                      <button type="button" id="distritoSelectAll" class="multi-select__action">Seleccionar todos</button>
                      <button type="button" id="distritoClear" class="multi-select__action alt">Limpiar</button>
                    </div>
                  </div>
                </div>
                <small>Busca y selecciona múltiples distritos.</small>
              </div>

              <!-- Transacción, Metraje y Presupuesto en una sola fila -->
              <div class="ubicacion-row">
                <div class="form-group">
                  <label for="search_transaccion">Tipo de Transacción</label>
                  <select id="search_transaccion" class="form-control">
                    <option value="venta" selected>Compra</option>
                    <option value="alquiler">Alquiler</option>
                  </select>
                </div>
                <div class="form-group">
                  <label>Área Mínima (m²)</label>
                  <input type="number" id="search_area_min" class="form-control" placeholder="Ej: 100">
                </div>
                <div class="form-group">
                  <label id="labelPresupuestoDashboard">Presupuesto Compra (USD)</label>
                  <input type="number" id="search_precio_max" class="form-control" placeholder="Ej: 500000">
                </div>
              </div>

              <!-- Botón Buscar -->
              <div class="boton-match-container" style="justify-content: flex-end; gap: .75rem;">
                <button type="button" class="btn btn-secondary" id="btnCancelarModalDashboard">Cancelar</button>
                <button id="btnHacerMatchDashboard" class="btn btn-match">Buscar</button>
              </div>
            </div>
          </div>
        </div>
      </div>`;

    document.body.insertAdjacentHTML('beforeend', modalHtml);

    // Evitar cierre accidental: solo cerrar al hacer click en overlay, no dentro del diálogo
    const overlay = document.getElementById('dashboardModalBusqueda');
    const dialog = overlay.querySelector('.modal-busqueda');
    overlay.addEventListener('click', (e) => { if (e.target === overlay) overlay.remove(); });
    dialog.addEventListener('click', (e) => e.stopPropagation());
    document.getElementById('btnCerrarModalDashboard').addEventListener('click', () => overlay.remove());
    document.getElementById('btnCancelarModalDashboard').addEventListener('click', () => overlay.remove());

    // Configurar multi-select de distritos
    this.setupDistritoMultiSelect();

    // Botón buscar
    document.getElementById('btnHacerMatchDashboard').addEventListener('click', async (e) => {
      e.preventDefault();
      await this.handleSearch();
    });

    // Actualizar label de presupuesto según transacción
    const transSelect = document.getElementById('search_transaccion');
    const lbl = document.getElementById('labelPresupuestoDashboard');
    const updatePresLbl = () => {
      lbl.textContent = transSelect.value === 'alquiler' ? 'Presupuesto Alquiler (USD/mes)' : 'Presupuesto Compra (USD)';
    };
    transSelect.addEventListener('change', updatePresLbl);
    updatePresLbl();
  }

  setupDistritoMultiSelect() {
    const panel = document.getElementById('distritoPanel');
    const toggleBtn = document.getElementById('distritoToggle');
    const optionsContainer = document.getElementById('distritoOptions');
    const searchInput = document.getElementById('distritoSearch');
    const selectAllBtn = document.getElementById('distritoSelectAll');
    const clearBtn = document.getElementById('distritoClear');
    const tagsContainer = document.getElementById('distritoTags');
    const placeholder = document.getElementById('distritoPlaceholder');
    const multiContainer = document.getElementById('distritoMulti');

    let distritosSeleccionados = [];

    const renderOptions = (filterText = '') => {
      const term = filterText.toLowerCase();
      const selectedSet = new Set(distritosSeleccionados);
      const listaFiltrada = this.distritos
        .filter(d => d.nombre.toLowerCase().includes(term))
        .sort((a, b) => a.nombre.localeCompare(b.nombre, 'es'));
      
      optionsContainer.innerHTML = listaFiltrada.map(d => `
        <label class="multi-option" style="display: flex; align-items: center; padding: 0.5rem; cursor: pointer; border-radius: 6px; transition: background 0.2s;">
          <input type="checkbox" value="${d.distrito_id}" ${selectedSet.has(d.distrito_id) ? 'checked' : ''} style="margin-right: 0.5rem; width: 16px; height: 16px;">
          <span>${d.nombre}</span>
        </label>
      `).join('');

      // Checkbox listeners
      optionsContainer.querySelectorAll('input[type="checkbox"]').forEach(cb => {
        cb.addEventListener('change', () => {
          const id = parseInt(cb.value);
          if (cb.checked) {
            distritosSeleccionados.push(id);
          } else {
            distritosSeleccionados = distritosSeleccionados.filter(did => did !== id);
          }
          updateTags();
        });
      });
    };

    const updateTags = () => {
      if (distritosSeleccionados.length === 0) {
        tagsContainer.innerHTML = '';
        placeholder.style.display = '';
      } else {
        const nombres = distritosSeleccionados
          .map(id => this.distritos.find(d => d.distrito_id === id)?.nombre)
          .filter(Boolean);
        placeholder.style.display = 'none';
        
        const maxChips = 3;
        const chips = nombres.slice(0, maxChips).map(n => 
          `<span class="multi-select__tag" style="display: inline-flex; align-items: center; padding: 0.25rem 0.5rem; background: rgba(0, 102, 204, 0.1); color: var(--azul-corporativo); border-radius: 4px; font-size: 0.85rem; font-weight: 500;">${n}</span>`
        ).join('');
        const extra = nombres.length > maxChips ? 
          `<span class="multi-select__tag" style="display: inline-flex; align-items: center; padding: 0.25rem 0.5rem; background: rgba(0, 102, 204, 0.2); color: var(--azul-corporativo); border-radius: 4px; font-size: 0.85rem; font-weight: 600;">+${nombres.length - maxChips}</span>` : '';
        tagsContainer.innerHTML = chips + extra;
      }
    };

    // Inicial
    renderOptions();
    updateTags();

    // Abrir/cerrar panel
    const openPanel = () => {
      panel.hidden = false;
      toggleBtn.setAttribute('aria-expanded', 'true');
      multiContainer.classList.add('open');
      searchInput?.focus();
    };
    const closePanel = () => {
      panel.hidden = true;
      toggleBtn.setAttribute('aria-expanded', 'false');
      multiContainer.classList.remove('open');
    };

    toggleBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      if (panel.hidden) openPanel(); else closePanel();
    });

    // Cerrar con clic fuera
    document.addEventListener('mousedown', (e) => {
      if (panel.hidden) return;
      if (!multiContainer.contains(e.target)) closePanel();
    });

    // Buscar en vivo
    searchInput?.addEventListener('input', (e) => {
      renderOptions(e.target.value.trim());
    });

    // Seleccionar todos
    selectAllBtn?.addEventListener('click', () => {
      const term = searchInput?.value?.toLowerCase() || '';
      const idsFiltrados = this.distritos
        .filter(d => d.nombre.toLowerCase().includes(term))
        .map(d => d.distrito_id);
      distritosSeleccionados = Array.from(new Set([...distritosSeleccionados, ...idsFiltrados]));
      renderOptions(term);
      updateTags();
    });

    // Limpiar selección
    clearBtn?.addEventListener('click', () => {
      distritosSeleccionados = [];
      renderOptions(searchInput?.value || '');
      updateTags();
    });

    // Guardar referencia para poder acceder desde handleSearch
    this.distritosSeleccionados = distritosSeleccionados;
    this.getSelectedDistritos = () => distritosSeleccionados;
  }

  async handleSearch() {
    try {
      // Recopilar criterios usando el multi-select
      const distritosSeleccionados = this.getSelectedDistritos();

      this.currentCriteria = {
        tipo_inmueble_id: document.getElementById('search_tipo_inmueble').value || null,
        distrito_id: distritosSeleccionados.length > 0 ? distritosSeleccionados : null,
        transaccion: document.getElementById('search_transaccion').value,
        area_min: document.getElementById('search_area_min').value || null,
        precio_max: document.getElementById('search_precio_max').value || null
      };

      // 1️⃣ Buscar propiedades primero
      await this.searchProperties();

      // 2️⃣ Cerrar modal (no guardar automáticamente)
      document.getElementById('dashboardModalBusqueda')?.remove();

      // 3️⃣ Renderizar resultados
      this.renderResults();

    } catch (error) {
      console.error('❌ Error en búsqueda:', error);
      showNotification('❌ Error al buscar propiedades', 'error');
    }
  }

  renderResults() {
    const contentArea = document.getElementById('tabContent');
    if (!contentArea) return;

    // Vacío
    if (!this.searchResults || this.searchResults.length === 0) {
      contentArea.innerHTML = `
        <div style="margin-bottom: 2rem; text-align: center;">
          <h2 style="color: var(--azul-corporativo); margin: 0 0 1rem 0;">🔍 Resultados de Búsqueda</h2>
          <div style="display:flex; gap:.5rem; justify-content:center;">
            <button onclick="window.searchModule.renderSearchModal()" class="btn btn-primary" style="padding: 0.75rem 1.25rem; border-radius: 8px; background: var(--azul-corporativo);">Nueva Búsqueda</button>
            <button onclick="window.searchModule.showHistorial()" class="btn btn-secondary" style="padding: 0.75rem 1.25rem; border-radius: 8px;">Volver al historial</button>
          </div>
        </div>
        <div class="empty-state">
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="width: 60px; height: 60px; opacity: 0.2;">
            <circle cx="11" cy="11" r="8"></circle>
            <path d="m21 21-4.35-4.35"></path>
          </svg>
          <h3>No se encontraron propiedades</h3>
          <p>Intenta ajustar los criterios de búsqueda.</p>
        </div>`;
      return;
    }

    // Cards (mismo estilo que resultados)
    const resultsHtml = this.searchResults.map((prop, index) => {
      const propId = prop.registro_cab_id || prop.id || prop.propiedad_id;
      const imagenPrincipal = prop.imagen_principal || 'https://via.placeholder.com/400x300?text=Sin+Imagen';
      const imagenes = prop.imagenes_galeria && prop.imagenes_galeria.length > 0 ? [imagenPrincipal, ...prop.imagenes_galeria] : [imagenPrincipal];
      const precio = this.currentCriteria.transaccion === 'alquiler' && prop.precio_alquiler
        ? `S/ ${parseFloat(prop.precio_alquiler).toLocaleString('es-PE')}/mes`
        : (this.currentCriteria.transaccion === 'venta' && prop.precio_venta
          ? `S/ ${parseFloat(prop.precio_venta).toLocaleString('es-PE')}`
          : 'Precio no disponible');

      return `
        <div class="property-card" data-property-id="${propId}">
          <div class="property-number">${index + 1}</div>
          <button class="favorite-btn-beautiful ${prop.es_favorito ? 'is-favorite' : ''}" data-favorite-property="${propId}" ${prop.favorito_id ? `data-favorito-id='${prop.favorito_id}'` : ''} title="${prop.es_favorito ? 'Quitar de favoritos' : 'Agregar a favoritos'}" style="position: absolute; top: 10px; right: 10px; z-index: 30;">
            <svg class="heart-icon" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor"><path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z"/></svg>
          </button>
          <div class="property-image-carousel">
            <div class="carousel-images" data-current="0">
              ${imagenes.map((img, i) => `<img src='${img}' alt='${prop.titulo || ''}' class='carousel-image ${i === 0 ? 'active' : ''}' data-index='${i}' onerror="this.src='https://via.placeholder.com/400x300?text=Sin+Imagen'">`).join('')}
            </div>
            ${imagenes.length > 1 ? `<button class='carousel-prev' data-property-id='${propId}'>‹</button><button class='carousel-next' data-property-id='${propId}'>›</button><div class='carousel-indicators'>${imagenes.map((_, i) => `<span class='indicator ${i === 0 ? 'active' : ''}' data-index='${i}'></span>`).join('')}</div>` : ''}
          </div>
          <div class="property-info">
            <h3 class="property-title">${prop.titulo || ''}</h3>
            <div class="property-location">📍 ${prop.direccion || prop.ubicacion || ''}</div>
            <div class="property-price">${precio}</div>
            <div class="property-features">
              <span class="feature">📐 ${prop.area || 0} m²</span>
              ${(prop.tipo_inmueble_id !== 12 && prop.tipo_inmueble_id !== 13) ? `
                ${prop.habitaciones ? `<span class="feature">🛏️ ${prop.habitaciones} hab.</span>` : ''}
                ${prop.banos ? `<span class="feature">🛁 ${prop.banos} baños</span>` : ''}
                ${prop.estacionamientos ? `<span class="feature">🚗 ${prop.estacionamientos} estac.</span>` : ''}
              ` : ''}
              ${prop.antiguedad ? `<span class="feature">⏱️ ${prop.antiguedad} años</span>` : ''}
              ${prop.implementacion ? `<span class="feature">🔧 ${prop.implementacion}</span>` : ''}
            </div>
            <p class="property-description">${prop.descripcion || ''}</p>
          </div>
        </div>`;
    }).join('');

    contentArea.innerHTML = `
      <div style="margin-bottom: 1rem; display:flex; justify-content: space-between; align-items:center; gap:.75rem; flex-wrap:wrap;">
        <div>
          <h2 style="color: var(--azul-corporativo); margin: 0;">🔍 Resultados de Búsqueda</h2>
          <p style="margin:.25rem 0 0 0; color: var(--gris-medio);"><strong style="color: var(--azul-corporativo)">${this.searchResults.length}</strong> propiedades encontradas</p>
          <p style="margin:.25rem 0 0 0; color:#6b7280; font-size:.95rem;">¿Te satisfacen estos resultados? <button onclick="window.searchModule.saveCurrentSearch()" class="btn btn-link" style="color: var(--azul-corporativo); font-weight:600; text-decoration: underline; padding:0;">Guardar esta búsqueda</button></p>
        </div>
        <div style="display:flex; gap:.5rem;">
          <button onclick="window.searchModule.renderSearchModal()" class="btn btn-primary" style="padding: .6rem 1rem; border-radius: 8px;">Nueva Búsqueda</button>
          <button onclick="window.searchModule.showHistorial()" class="btn btn-secondary" style="padding: .6rem 1rem; border-radius: 8px;">Volver al historial</button>
        </div>
      </div>
      <div class="properties-grid">${resultsHtml}</div>`;

    // Reactivar listeners (favoritos, carrusel)
    this.dashboard?.setupPropertyListeners?.();
  }

  async saveSearch() {
    try {
      const token = authService.getToken();
      
      // Construir body según API
      const body = {
        criterios_json: this.currentCriteria,
        cantidad_resultados: this.searchResults.length,
        sesion_id: `session_${Date.now()}`
      };

      const response = await fetch(`${API_CONFIG.BASE_URL}/busquedas/registrar`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(body)
      });

      if (response.ok) {
        const data = await response.json();
        this.currentSearchId = data.data?.busqueda_id || data.busqueda_id;
        this.searchCount++;
        showNotification('✅ Búsqueda guardada', 'success');
      }
    } catch (error) {
      console.error('❌ Error guardando búsqueda:', error);
    }
  }

  async saveCurrentSearch() {
    try {
      const token = authService.getToken();
      if (!token) {
        showNotification('Debes iniciar sesión para guardar búsquedas', 'warning');
        return;
      }

      const body = {
        criterios_json: this.currentCriteria,
        nombre_busqueda: this.buildSearchName(this.currentCriteria),
        frecuencia_alerta: 'diaria',
        alerta_activa: true
      };

      const resp = await fetch(`${API_CONFIG.BASE_URL}/busquedas/guardadas`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(body)
      });

      if (!resp.ok) throw new Error('No se pudo guardar la búsqueda');
      showNotification('✅ Búsqueda guardada', 'success');
    } catch (e) {
      console.error('❌ Error guardando búsqueda:', e);
      showNotification('❌ Error guardando búsqueda', 'error');
    }
  }

  buildSearchName(c) {
    const tipo = this.tiposInmuebles.find(t => t.tipo_inmueble_id == c.tipo_inmueble_id)?.nombre || 'Propiedades';
    const distritos = Array.isArray(c.distrito_id) && c.distrito_id.length > 0 ? `${c.distrito_id.length} distritos` : 'Lima';
    const trans = c.transaccion === 'alquiler' ? 'Alquiler' : 'Venta';
    return `${tipo} ${trans} - ${distritos}`;
  }

  async showHistorial() {
    const contentArea = document.getElementById('tabContent');
    if (!contentArea) return;
    contentArea.innerHTML = '<div style="text-align:center; padding: 2rem;">Cargando historial...</div>';
    const content = await this.renderHistorialContent();
    contentArea.innerHTML = content;
  }

  async renderHistorialContent() {
    try {
      const token = authService.getToken();
      
      // Intentar endpoint mis-busquedas primero
      let response = await fetch(`${API_CONFIG.BASE_URL}/busquedas/mis-busquedas?limit=50`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });

      let historial = [];
      
      if (response.ok) {
        const data = await response.json();
        historial = Array.isArray(data) ? data : (data.data || data.busquedas || []);
      } else if (response.status === 404) {
        // Si falla, intentar con historial
        response = await fetch(`${API_CONFIG.BASE_URL}/busquedas/historial?limit=50`, {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        
        if (response.ok) {
          const data = await response.json();
          historial = Array.isArray(data) ? data : (data.data || data.busquedas || []);
        }
      }

      return `
        <div style="margin-bottom: var(--spacing-xl);">
          <div style="display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: var(--spacing-md);">
            <div>
              <h2 style="color: var(--azul-corporativo); margin: 0 0 var(--spacing-xs) 0; font-size: var(--font-size-h2);">
                🔍 Búsquedas de Propiedades
              </h2>
              <p style="color: var(--gris-medio); margin: 0; font-size: var(--font-size-base);">
                ${historial.length > 0 ? `Has realizado ${historial.length} búsquedas` : 'Comienza a buscar propiedades'}
              </p>
            </div>
            <button onclick="if(window.searchModule){window.searchModule.renderSearchModal()}else{alert('Cargando módulo...')}" 
                    class="btn btn-primary" 
                    style="padding: var(--spacing-md) var(--spacing-xl); border-radius: var(--radius-md); font-weight: 600; background: var(--azul-corporativo); color: white; border: none; cursor: pointer; font-size: var(--font-size-base); transition: var(--transition-fast); box-shadow: var(--shadow-sm);"
                    onmouseover="this.style.background='var(--azul-medio)'; this.style.boxShadow='var(--shadow-md)'"
                    onmouseout="this.style.background='var(--azul-corporativo)'; this.style.boxShadow='var(--shadow-sm)'">
              🔍 Nueva Búsqueda
            </button>
          </div>
        </div>

        ${historial.length > 0 ? `
          <div style="display: grid; gap: var(--spacing-md);">
            ${historial.slice(0, 10).map((busqueda, index) => {
              const criterios = busqueda.criterios_json || {};
              const fecha = new Date(busqueda.fecha_busqueda || busqueda.created_at).toLocaleDateString('es-PE', {
                day: '2-digit',
                month: 'short',
                year: 'numeric',
                hour: '2-digit',
                minute: '2-digit'
              });
              
              // Tipo de inmueble
              const tipoInmueble = criterios.tipo_inmueble_id ? 
                (this.tiposInmuebles.find(t => t.tipo_inmueble_id === criterios.tipo_inmueble_id)?.nombre || 'N/A') : 
                'Todos';
              
              // Distritos
              const distritos = Array.isArray(criterios.distrito_id) && criterios.distrito_id.length > 0 ?
                criterios.distrito_id.slice(0, 2).map(id => 
                  this.distritos.find(d => d.distrito_id === id)?.nombre
                ).filter(Boolean).join(', ') + (criterios.distrito_id.length > 2 ? ` (+${criterios.distrito_id.length - 2})` : '') :
                'Todos';
              
              return `
                <div style="background: white; border-radius: var(--radius-lg); padding: var(--spacing-lg); box-shadow: var(--shadow-sm); border-left: 4px solid var(--azul-corporativo); transition: var(--transition-normal); cursor: pointer;"
                     onmouseenter="this.style.boxShadow='var(--shadow-md)'; this.style.transform='translateY(-2px)';"
                     onmouseleave="this.style.boxShadow='var(--shadow-sm)'; this.style.transform='translateY(0)';">
                  
                  <!-- Header -->
                  <div style="display: flex; justify-content: space-between; align-items: start; margin-bottom: var(--spacing-md);">
                    <div>
                      <h3 style="color: var(--azul-corporativo); margin: 0 0 var(--spacing-xs) 0; font-size: 1.1rem;">
                        🔍 Búsqueda #${index + 1}
                      </h3>
                      <p style="color: var(--gris-medio); margin: 0; font-size: var(--font-size-small);">
                        📅 ${fecha}
                      </p>
                    </div>
                    <button onclick="window.searchModule.repeatSearch(${JSON.stringify(criterios).replace(/"/g, '&quot;')})" 
                            style="padding: var(--spacing-xs) var(--spacing-md); background: var(--azul-corporativo); color: white; border: none; border-radius: var(--radius-md); cursor: pointer; font-size: var(--font-size-small); font-weight: 600; transition: var(--transition-fast);">
                      🔄 Repetir
                    </button>
                  </div>
                  
                  <!-- Criterios -->
                  <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(150px, 1fr)); gap: var(--spacing-sm); margin-bottom: var(--spacing-md);">
                    <div>
                      <span style="color: var(--gris-medio); font-size: var(--font-size-small);">Transacción:</span>
                      <strong style="color: var(--gris-oscuro); display: block;">
                        ${criterios.transaccion === 'alquiler' ? '🏠 Alquiler' : '🏠 Venta'}
                      </strong>
                    </div>
                    <div>
                      <span style="color: var(--gris-medio); font-size: var(--font-size-small);">Tipo:</span>
                      <strong style="color: var(--gris-oscuro); display: block;">${tipoInmueble}</strong>
                    </div>
                    <div>
                      <span style="color: var(--gris-medio); font-size: var(--font-size-small);">Ubicación:</span>
                      <strong style="color: var(--gris-oscuro); display: block;">📍 ${distritos}</strong>
                    </div>
                  </div>
                  
                  <!-- Footer -->
                  <div style="display: flex; justify-content: space-between; align-items: center; padding-top: var(--spacing-md); border-top: 1px solid var(--borde);">
                    <span style="color: var(--success); font-weight: 600; font-size: var(--font-size-small);">
                      ✅ ${busqueda.cantidad_resultados || 0} resultados
                    </span>
                  </div>
                </div>
              `;
            }).join('')}
          </div>
        ` : `
          <div class="empty-state">
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="width: 60px; height: 60px; opacity: 0.2;">
              <circle cx="11" cy="11" r="8"></circle>
              <path d="m21 21-4.35-4.35"></path>
            </svg>
            <h3>No has realizado búsquedas aún</h3>
            <p>Haz clic en "Nueva Búsqueda" para comenzar a buscar propiedades.</p>
          </div>
        `}
      `;
    } catch (error) {
      console.error('❌ Error cargando historial:', error);
      return `
        <div style="margin-bottom: var(--spacing-xl);">
          <button onclick="window.searchModule.renderSearchModal()" 
                  class="btn btn-primary" 
                  style="padding: var(--spacing-md) var(--spacing-xl); border-radius: var(--radius-md); font-weight: 600; background: var(--azul-corporativo);">
            🔍 Nueva Búsqueda
          </button>
        </div>
        <div class="empty-state">
          <h3>Error al cargar búsquedas</h3>
          <p>${error.message}</p>
        </div>
      `;
    }
  }

  repeatSearch(criterios) {
    // TODO: Pre-llenar el modal con estos criterios y ejecutar búsqueda
    this.renderSearchModal();
    showNotification('🔄 Función "Repetir búsqueda" en desarrollo', 'info');
  }
}

// Exponer globalmente
window.SearchModule = SearchModule;

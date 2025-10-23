/**
 * 🔍 Search Simple Module
 * Módulo de búsquedas con 3 secciones: Filtros | Resultados | Mapa
 * Técnica limpia de mantenimiento - código simple y corto
 */

class SearchSimpleModule {
  constructor(dashboard) {
    this.dashboard = dashboard;
    this.tiposInmuebles = [];
    this.distritos = [];
    this.propiedades = [];
    this.filtros = {};
    this.map = null;
    this.markers = [];
    this.distritosSeleccionados = [];

    window.searchSimpleModule = this;
  }

  async init() {
    console.log('🔍 Inicializando SearchSimpleModule...');
    try {
      await this.loadCatalogos();
      console.log('✅ SearchSimpleModule inicializado');
    } catch (error) {
      console.error('❌ Error inicializando:', error);
    }
  }

  async loadCatalogos() {
    const token = authService.getToken();
    const [tiposRes, distritosRes] = await Promise.all([
      fetch(`${API_CONFIG.BASE_URL}/tipos-inmuebles`, {
        headers: { 'Authorization': `Bearer ${token}` }
      }),
      fetch(`${API_CONFIG.BASE_URL}/distritos`, {
        headers: { 'Authorization': `Bearer ${token}` }
      })
    ]);

    const tiposData = await tiposRes.json();
    const distritosData = await distritosRes.json();

    this.tiposInmuebles = tiposData.data || tiposData || [];
    this.distritos = distritosData.data || distritosData || [];
  }

  /**
   * Renderizar layout de 3 secciones
   */
  async render() {
    console.log('🎨 Renderizando layout de búsquedas...');

    return `
      <div class="search-layout">
        <!-- Sidebar: Filtros -->
        <aside class="search-sidebar">
          ${this.renderFiltros()}
        </aside>

        <!-- Main: Resultados + Mapa -->
        <main class="search-main">
          <!-- Resultados -->
          <section class="search-results">
            ${this.renderPlaceholder()}
          </section>

          <!-- Mapa -->
          <section class="search-map">
            ${this.renderMapPlaceholder()}
          </section>
        </main>

        <!-- Drawer móvil para filtros -->
        <div class="search-drawer" id="searchDrawer">
          <div class="drawer-header">
            <h3>Filtros</h3>
            <button class="drawer-close" onclick="window.searchSimpleModule.closeDrawer()">×</button>
          </div>
          <div class="drawer-content">
            ${this.renderFiltros()}
          </div>
          <div class="drawer-footer">
            <button class="btn btn-primary" onclick="window.searchSimpleModule.executeSearch()">
              Aplicar Filtros
            </button>
          </div>
        </div>

        <!-- Botón flotante móvil -->
        <button class="btn-mobile-filters" onclick="window.searchSimpleModule.openDrawer()">
          <i class="fa-solid fa-filter"></i>
          Filtros
        </button>
      </div>
    `;
  }

  /**
   * Renderizar filtros (acordeón)
   */
  renderFiltros() {
    return `
      <div class="filters-container">
        <h2>Filtros de Búsqueda</h2>

        <!-- Acordeón: Filtros Genéricos -->
        <div class="accordion-item">
          <button class="accordion-header active" onclick="window.searchSimpleModule.toggleAccordion(this)">
            <i class="fa-solid fa-filter"></i>
            <span>Filtros Genéricos</span>
            <i class="fa-solid fa-chevron-down"></i>
          </button>
          <div class="accordion-content open">
            <!-- Tipo de Inmueble -->
            <div class="form-group">
              <label>Tipo de Inmueble</label>
              <select id="filter_tipo" class="form-control">
                <option value="">Todos los tipos</option>
                ${this.tiposInmuebles.map(t => `<option value="${t.tipo_inmueble_id}">${t.nombre}</option>`).join('')}
              </select>
            </div>

            <!-- Distritos (Multi-select simplificado) -->
            <div class="form-group">
              <label>Distritos</label>
              <div class="multi-select-simple" id="multiDistrito">
                <button type="button" class="multi-select-btn" onclick="window.searchSimpleModule.toggleDistritos()">
                  <span id="distritoLabel">Selecciona distritos...</span>
                  <i class="fa-solid fa-chevron-down"></i>
                </button>
                <div class="multi-select-dropdown" id="distritoDropdown" style="display: none;">
                  <div class="multi-select-search">
                    <input type="text" id="distritoSearch" placeholder="Buscar..." onkeyup="window.searchSimpleModule.filterDistritos()">
                  </div>
                  <div class="multi-select-options" id="distritoOptions">
                    ${this.distritos.map(d => `
                      <label class="multi-option">
                        <input type="checkbox" value="${d.distrito_id}" onchange="window.searchSimpleModule.updateDistritoLabel()">
                        <span>${d.nombre}</span>
                      </label>
                    `).join('')}
                  </div>
                  <div class="multi-select-actions">
                    <button type="button" class="btn btn-sm" onclick="window.searchSimpleModule.selectAllDistritos()">Todos</button>
                    <button type="button" class="btn btn-sm" onclick="window.searchSimpleModule.clearDistritos()">Limpiar</button>
                  </div>
                </div>
              </div>
            </div>

            <!-- Transacción -->
            <div class="form-group">
              <label>Transacción</label>
              <select id="filter_transaccion" class="form-control">
                <option value="venta">Compra/Venta</option>
                <option value="alquiler">Alquiler</option>
              </select>
            </div>

            <!-- Botón Buscar -->
            <button class="btn btn-primary btn-block" onclick="window.searchSimpleModule.executeSearch()">
              <i class="fa-solid fa-search"></i>
              Buscar Propiedades
            </button>
          </div>
        </div>

        <!-- Acordeón: Filtros Básicos -->
        <div class="accordion-item">
          <button class="accordion-header" onclick="window.searchSimpleModule.toggleAccordion(this)">
            <i class="fa-solid fa-sliders"></i>
            <span>Filtros Básicos</span>
            <i class="fa-solid fa-chevron-down"></i>
          </button>
          <div class="accordion-content">
            <!-- Área -->
            <div class="form-group">
              <label>Área (m²)</label>
              <div class="form-row">
                <input type="number" id="filter_area_min" class="form-control" placeholder="Mín">
                <input type="number" id="filter_area_max" class="form-control" placeholder="Máx">
              </div>
            </div>

            <!-- Precio -->
            <div class="form-group">
              <label id="labelPrecio">Precio (S/)</label>
              <div class="form-row">
                <input type="number" id="filter_precio_min" class="form-control" placeholder="Mín">
                <input type="number" id="filter_precio_max" class="form-control" placeholder="Máx">
              </div>
            </div>

            <!-- Habitaciones -->
            <div class="form-group">
              <label>Habitaciones</label>
              <input type="number" id="filter_habitaciones" class="form-control" placeholder="Ej: 3">
            </div>

            <!-- Baños -->
            <div class="form-group">
              <label>Baños</label>
              <input type="number" id="filter_banos" class="form-control" placeholder="Ej: 2">
            </div>

            <!-- Parqueos -->
            <div class="form-group">
              <label>Estacionamientos</label>
              <input type="number" id="filter_parqueos" class="form-control" placeholder="Ej: 1">
            </div>
          </div>
        </div>

        <!-- Botón Limpiar -->
        <button class="btn btn-secondary btn-block" onclick="window.searchSimpleModule.clearFilters()">
          <i class="fa-solid fa-eraser"></i>
          Limpiar Filtros
        </button>
      </div>
    `;
  }

  /**
   * Renderizar placeholder de resultados
   */
  renderPlaceholder() {
    return `
      <div class="results-placeholder">
        <i class="fa-solid fa-search"></i>
        <h3>Busca tu propiedad ideal</h3>
        <p>Usa los filtros de la izquierda para buscar propiedades</p>
      </div>
    `;
  }

  /**
   * Renderizar placeholder del mapa
   */
  renderMapPlaceholder() {
    return `
      <div class="map-placeholder">
        <i class="fa-solid fa-map-location-dot"></i>
        <p>El mapa se mostrará al buscar propiedades</p>
      </div>
      <div id="mapCanvas" style="display: none; width: 100%; height: 100%;"></div>
    `;
  }

  /**
   * Toggle acordeón
   */
  toggleAccordion(button) {
    const content = button.nextElementSibling;
    const isOpen = content.classList.contains('open');

    // Toggle
    button.classList.toggle('active');
    content.classList.toggle('open');
  }

  /**
   * Toggle dropdown distritos
   */
  toggleDistritos() {
    const dropdown = document.getElementById('distritoDropdown');
    dropdown.style.display = dropdown.style.display === 'none' ? 'block' : 'none';
  }

  /**
   * Filtrar distritos en búsqueda
   */
  filterDistritos() {
    const search = document.getElementById('distritoSearch').value.toLowerCase();
    const options = document.querySelectorAll('#distritoOptions .multi-option');

    options.forEach(opt => {
      const text = opt.textContent.toLowerCase();
      opt.style.display = text.includes(search) ? 'flex' : 'none';
    });
  }

  /**
   * Actualizar label de distritos
   */
  updateDistritoLabel() {
    const checkboxes = document.querySelectorAll('#distritoOptions input[type="checkbox"]:checked');
    const label = document.getElementById('distritoLabel');

    if (checkboxes.length === 0) {
      label.textContent = 'Selecciona distritos...';
    } else if (checkboxes.length === 1) {
      label.textContent = checkboxes[0].parentElement.querySelector('span').textContent;
    } else {
      label.textContent = `${checkboxes.length} distritos seleccionados`;
    }
  }

  /**
   * Seleccionar todos los distritos
   */
  selectAllDistritos() {
    const checkboxes = document.querySelectorAll('#distritoOptions input[type="checkbox"]');
    checkboxes.forEach(cb => cb.checked = true);
    this.updateDistritoLabel();
  }

  /**
   * Limpiar distritos
   */
  clearDistritos() {
    const checkboxes = document.querySelectorAll('#distritoOptions input[type="checkbox"]');
    checkboxes.forEach(cb => cb.checked = false);
    this.updateDistritoLabel();
  }

  /**
   * Ejecutar búsqueda
   */
  async executeSearch() {
    try {
      console.log('🔍 Ejecutando búsqueda...');

      // Cerrar drawer si está abierto
      this.closeDrawer();

      // Recopilar filtros
      this.filtros = {
        tipo_inmueble_id: document.getElementById('filter_tipo')?.value || null,
        transaccion: document.getElementById('filter_transaccion')?.value || 'venta',
        area_min: document.getElementById('filter_area_min')?.value || null,
        area_max: document.getElementById('filter_area_max')?.value || null,
        precio_min: document.getElementById('filter_precio_min')?.value || null,
        precio_max: document.getElementById('filter_precio_max')?.value || null,
        habitaciones: document.getElementById('filter_habitaciones')?.value || null,
        banos: document.getElementById('filter_banos')?.value || null,
        parqueos: document.getElementById('filter_parqueos')?.value || null,
        distritos_ids: Array.from(document.querySelectorAll('#distritoOptions input:checked')).map(cb => parseInt(cb.value))
      };

      // Construir URL de API
      const params = new URLSearchParams();
      if (this.filtros.tipo_inmueble_id) params.append('tipo_inmueble_id', this.filtros.tipo_inmueble_id);
      if (this.filtros.distritos_ids.length > 0) params.append('distrito_id', this.filtros.distritos_ids.join(','));
      if (this.filtros.transaccion) params.append('transaccion', this.filtros.transaccion);
      if (this.filtros.area_min) params.append('area_min', this.filtros.area_min);
      if (this.filtros.area_max) params.append('area_max', this.filtros.area_max);
      if (this.filtros.precio_min) params.append('precio_min', this.filtros.precio_min);
      if (this.filtros.precio_max) params.append('precio_max', this.filtros.precio_max);
      if (this.filtros.habitaciones) params.append('habitaciones', this.filtros.habitaciones);
      if (this.filtros.banos) params.append('banos', this.filtros.banos);
      if (this.filtros.parqueos) params.append('parqueos', this.filtros.parqueos);

      // Llamar API
      const url = `${API_CONFIG.BASE_URL}/propiedades?${params.toString()}`;
      console.log('📡 API:', url);

      const token = authService.getToken();
      const response = await fetch(url, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await response.json();

      this.propiedades = Array.isArray(data) ? data : (data.data || data.items || []);

      console.log('✅ Resultados:', this.propiedades.length);

      // Renderizar resultados
      this.renderResults();

      // Actualizar mapa
      this.renderMap();

      // Guardar búsqueda
      await this.saveSearch();

    } catch (error) {
      console.error('❌ Error en búsqueda:', error);
      showNotification('Error al buscar propiedades', 'error');
    }
  }

  /**
   * Renderizar resultados
   */
  renderResults() {
    const container = document.querySelector('.search-results');
    if (!container) return;

    if (this.propiedades.length === 0) {
      container.innerHTML = `
        <div class="results-empty">
          <i class="fa-solid fa-inbox"></i>
          <h3>No se encontraron propiedades</h3>
          <p>Intenta ajustar los filtros de búsqueda</p>
        </div>
      `;
      return;
    }

    // Header
    const header = `
      <div class="results-header">
        <h2>${this.propiedades.length} ${this.propiedades.length === 1 ? 'propiedad encontrada' : 'propiedades encontradas'}</h2>
      </div>
    `;

    // Grid de tarjetas
    const cards = this.propiedades.map((prop, index) => this.renderPropertyCard(prop, index)).join('');

    container.innerHTML = `
      ${header}
      <div class="properties-grid">
        ${cards}
      </div>
    `;

    // Setup listeners
    this.setupCardListeners();
  }

  /**
   * Renderizar tarjeta de propiedad
   */
  renderPropertyCard(prop, index) {
    const propId = prop.registro_cab_id || prop.id || prop.propiedad_id;
    const imagenPrincipal = prop.imagen_principal || 'https://via.placeholder.com/400x300?text=Sin+Imagen';
    const imagenes = prop.imagenes_galeria && prop.imagenes_galeria.length > 0 ?
      [imagenPrincipal, ...prop.imagenes_galeria] : [imagenPrincipal];

    let precio = 'Precio no disponible';
    if (this.filtros.transaccion === 'alquiler' && prop.precio_alquiler) {
      precio = `S/ ${parseFloat(prop.precio_alquiler).toLocaleString('es-PE')}/mes`;
    } else if (prop.precio_venta || prop.precio_compra) {
      precio = `S/ ${parseFloat(prop.precio_venta || prop.precio_compra).toLocaleString('es-PE')}`;
    }

    return `
      <div class="property-card" data-property-id="${propId}">
        <div class="property-number">${index + 1}</div>

        <button class="favorite-btn ${prop.es_favorito ? 'is-favorite' : ''}"
                data-favorite-property="${propId}"
                title="${prop.es_favorito ? 'Quitar de favoritos' : 'Agregar a favoritos'}">
          <svg class="heart-icon" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor">
            <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z"/>
          </svg>
        </button>

        <div class="property-image-carousel">
          <div class="carousel-images" data-current="0">
            ${imagenes.map((img, i) => `
              <img src='${img}' alt='${prop.titulo || 'Propiedad'}'
                   class='carousel-image ${i === 0 ? 'active' : ''}' data-index='${i}'
                   onerror="this.src='https://via.placeholder.com/400x300?text=Sin+Imagen'">
            `).join('')}
          </div>
          ${imagenes.length > 1 ? `
            <button class='carousel-prev'><i class="fa-solid fa-chevron-left"></i></button>
            <button class='carousel-next'><i class="fa-solid fa-chevron-right"></i></button>
            <div class='carousel-indicators'>
              ${imagenes.map((_, i) => `<span class='indicator ${i === 0 ? 'active' : ''}' data-index='${i}'></span>`).join('')}
            </div>
          ` : ''}
        </div>

        <div class="property-info">
          <h3 class="property-title">${prop.titulo || 'Sin título'}</h3>
          <div class="property-location">
            <i class="fa-solid fa-location-dot"></i>
            ${prop.direccion || prop.ubicacion || prop.distrito_nombre || 'Ubicación no especificada'}
          </div>
          <div class="property-price">${precio}</div>
          <div class="property-features">
            ${prop.area ? `<span>📐 ${prop.area} m²</span>` : ''}
            ${prop.habitaciones ? `<span>🛏️ ${prop.habitaciones} hab.</span>` : ''}
            ${prop.banos ? `<span>🚿 ${prop.banos} baños</span>` : ''}
            ${prop.parqueos ? `<span>🚗 ${prop.parqueos} parqueos</span>` : ''}
          </div>
        </div>
      </div>
    `;
  }

  /**
   * Setup listeners de tarjetas
   */
  setupCardListeners() {
    // Carruseles
    document.querySelectorAll('.property-card').forEach(card => {
      const prevBtn = card.querySelector('.carousel-prev');
      const nextBtn = card.querySelector('.carousel-next');
      const images = card.querySelectorAll('.carousel-image');
      const indicators = card.querySelectorAll('.indicator');

      if (images.length <= 1) return;

      let currentIndex = 0;

      const showImage = (index) => {
        images.forEach(img => img.classList.remove('active'));
        indicators.forEach(ind => ind.classList.remove('active'));
        images[index].classList.add('active');
        indicators[index].classList.add('active');
      };

      prevBtn?.addEventListener('click', (e) => {
        e.stopPropagation();
        currentIndex = (currentIndex - 1 + images.length) % images.length;
        showImage(currentIndex);
      });

      nextBtn?.addEventListener('click', (e) => {
        e.stopPropagation();
        currentIndex = (currentIndex + 1) % images.length;
        showImage(currentIndex);
      });

      indicators.forEach((ind, i) => {
        ind.addEventListener('click', (e) => {
          e.stopPropagation();
          currentIndex = i;
          showImage(i);
        });
      });
    });

    // Favoritos
    document.querySelectorAll('.favorite-btn').forEach(btn => {
      btn.addEventListener('click', async (e) => {
        e.stopPropagation();
        await this.toggleFavorite(btn);
      });
    });
  }

  /**
   * Toggle favorito
   */
  async toggleFavorite(button) {
    try {
      const propertyId = button.getAttribute('data-favorite-property');
      const isFavorite = button.classList.contains('is-favorite');

      if (isFavorite) {
        await favoritesActionService.removeFavorite(propertyId);
        button.classList.remove('is-favorite');
        showNotification('Removido de favoritos', 'success');
      } else {
        await favoritesActionService.addFavorite(propertyId);
        button.classList.add('is-favorite');
        showNotification('Agregado a favoritos', 'success');
      }
    } catch (error) {
      console.error('❌ Error favorito:', error);
      showNotification('Error al actualizar favorito', 'error');
    }
  }

  /**
   * Renderizar mapa
   */
  renderMap() {
    const mapCanvas = document.getElementById('mapCanvas');
    const placeholder = document.querySelector('.map-placeholder');

    if (!mapCanvas) return;

    // Filtrar propiedades con coordenadas
    const propsWithCoords = this.propiedades.filter(p =>
      p.latitud && p.longitud && !isNaN(parseFloat(p.latitud)) && !isNaN(parseFloat(p.longitud))
    );

    if (propsWithCoords.length === 0) {
      if (placeholder) placeholder.innerHTML = '<p>Las propiedades no tienen coordenadas para mostrar en el mapa</p>';
      return;
    }

    // Mostrar mapa
    mapCanvas.style.display = 'block';
    if (placeholder) placeholder.style.display = 'none';

    // Inicializar mapa si no existe
    if (!this.map) {
      this.map = L.map('mapCanvas').setView([-12.0464, -77.0428], 12);
      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '© OpenStreetMap'
      }).addTo(this.map);
    }

    // Limpiar marcadores anteriores
    this.markers.forEach(m => this.map.removeLayer(m));
    this.markers = [];

    // Agregar marcadores
    const bounds = [];
    propsWithCoords.forEach((prop, index) => {
      const lat = parseFloat(prop.latitud);
      const lng = parseFloat(prop.longitud);
      bounds.push([lat, lng]);

      const marker = L.marker([lat, lng]).addTo(this.map);
      marker.bindPopup(`
        <div style="max-width: 200px;">
          <h4>${prop.titulo || 'Propiedad'}</h4>
          <p>${prop.direccion || ''}</p>
          <strong>${prop.area ? prop.area + ' m²' : ''}</strong>
        </div>
      `);

      this.markers.push(marker);
    });

    // Ajustar vista
    if (bounds.length > 0) {
      this.map.fitBounds(bounds, { padding: [50, 50], maxZoom: 15 });
    }

    // Invalidar tamaño
    setTimeout(() => this.map.invalidateSize(), 100);
  }

  /**
   * Guardar búsqueda en historial
   */
  async saveSearch() {
    try {
      const token = authService.getToken();
      if (!token) return;

      await fetch(`${API_CONFIG.BASE_URL}/busquedas/registrar`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          criterios_json: this.filtros,
          cantidad_resultados: this.propiedades.length,
          sesion_id: `session_${Date.now()}`
        })
      });
    } catch (error) {
      console.error('❌ Error guardando búsqueda:', error);
    }
  }

  /**
   * Limpiar filtros
   */
  clearFilters() {
    document.getElementById('filter_tipo').value = '';
    document.getElementById('filter_transaccion').value = 'venta';
    document.getElementById('filter_area_min').value = '';
    document.getElementById('filter_area_max').value = '';
    document.getElementById('filter_precio_min').value = '';
    document.getElementById('filter_precio_max').value = '';
    document.getElementById('filter_habitaciones').value = '';
    document.getElementById('filter_banos').value = '';
    document.getElementById('filter_parqueos').value = '';
    this.clearDistritos();
  }

  /**
   * Abrir/cerrar drawer móvil
   */
  openDrawer() {
    document.getElementById('searchDrawer')?.classList.add('active');
  }

  closeDrawer() {
    document.getElementById('searchDrawer')?.classList.remove('active');
  }

  setupEventListeners() {
    console.log('🎛️ SearchSimpleModule.setupEventListeners()');

    // Cerrar dropdowns al hacer click fuera
    document.addEventListener('click', (e) => {
      const multiSelect = document.getElementById('multiDistrito');
      const dropdown = document.getElementById('distritoDropdown');
      if (multiSelect && !multiSelect.contains(e.target)) {
        dropdown.style.display = 'none';
      }
    });
  }
}

// Exportar a window
window.SearchSimpleModule = SearchSimpleModule;

/**
 * 🏠 Search Results Module
 * Resultados de búsqueda con tarjetas de propiedades
 * Diseño: Replicado de resultados.html
 */

class SearchResultsModule {
  constructor(searchController) {
    this.searchController = searchController;
    this.data = [];
    this.pagination = {
      page: 1,
      limit: 12,
      total: 0,
      totalPages: 0
    };

    window.searchResultsModule = this;
  }

  /**
   * Renderizar módulo de resultados
   */
  async render() {
    console.log('🎨 SearchResultsModule.render() called');

    return `
      <!-- Placeholder Inicial -->
      <div id="placeholderResultados" class="placeholder-resultados">
        <div class="placeholder-image-container">
          <img src="https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?w=1920&h=1080&fit=crop"
               alt="Oficina moderna"
               class="placeholder-image">
          <div class="placeholder-overlay">
            <i class="fa-solid fa-building-circle-check"></i>
            <h3>Resultados de Búsqueda</h3>
            <p>Aplica filtros para ver propiedades disponibles</p>
          </div>
        </div>
      </div>

      <!-- Lista de Propiedades -->
      <div id="propertiesList" class="properties-list" style="display: none;">
        <!-- Se carga dinámicamente -->
      </div>
    `;
  }

  /**
   * Buscar propiedades con filtros
   */
  async searchProperties(filters, pagination = null) {
    console.log('🔍 Buscando propiedades...', filters);

    try {
      // Actualizar paginación si se proporciona
      if (pagination) {
        this.pagination = { ...this.pagination, ...pagination };
      }

      // Construir query params
      const params = new URLSearchParams();
      params.append('page', this.pagination.page);
      params.append('limit', this.pagination.limit);

      // Filtros genéricos
      if (filters.tipo_inmueble_id) {
        params.append('tipo_inmueble_id', filters.tipo_inmueble_id);
      }

      if (filters.distritos_ids && filters.distritos_ids.length > 0) {
        params.append('distrito_id', filters.distritos_ids.join(','));
      }

      if (filters.transaccion) {
        params.append('transaccion', filters.transaccion);
      }

      // Filtros básicos
      if (filters.precio_min) {
        params.append('precio_min', filters.precio_min);
      }

      if (filters.precio_max) {
        params.append('precio_max', filters.precio_max);
      }

      if (filters.area_min) {
        params.append('area_min', filters.area_min);
      }

      if (filters.area_max) {
        params.append('area_max', filters.area_max);
      }

      if (filters.habitaciones) {
        params.append('habitaciones', filters.habitaciones);
      }

      if (filters.banos) {
        params.append('banos', filters.banos);
      }

      if (filters.parqueos) {
        params.append('parqueos', filters.parqueos);
      }

      // Llamar a la API
      const url = `${API_URL}/propiedades?${params.toString()}`;
      console.log('📡 API URL:', url);

      const response = await fetch(url);

      if (!response.ok) {
        throw new Error(`Error ${response.status}: ${response.statusText}`);
      }

      const data = await response.json();

      // Extraer data según formato de respuesta
      this.data = Array.isArray(data) ? data : (data.data || data.items || []);
      this.pagination.total = data.total || this.data.length;
      this.pagination.totalPages = Math.ceil(this.pagination.total / this.pagination.limit);

      console.log('✅ Propiedades cargadas:', {
        cantidad: this.data.length,
        total: this.pagination.total,
        pagina: this.pagination.page
      });

      // Renderizar resultados
      this.renderResults();

      // Actualizar búsqueda del controlador
      this.searchController.currentSearch.results = this.data;
      this.searchController.currentSearch.pagination = this.pagination;

    } catch (error) {
      console.error('❌ Error al buscar propiedades:', error);
      this.data = [];
      this.renderResults();
      showNotification('Error al buscar propiedades: ' + error.message, 'error');
    }
  }

  /**
   * Renderizar resultados
   */
  renderResults() {
    console.log('🎨 Renderizando resultados...', this.data.length);

    const placeholder = document.getElementById('placeholderResultados');
    const listContainer = document.getElementById('propertiesList');

    if (!placeholder || !listContainer) {
      console.warn('⚠️ Contenedores no encontrados');
      return;
    }

    // Si no hay resultados
    if (this.data.length === 0) {
      placeholder.style.display = 'block';
      listContainer.style.display = 'none';
      listContainer.innerHTML = '';

      // Actualizar mensaje del placeholder
      const placeholderOverlay = placeholder.querySelector('.placeholder-overlay');
      if (placeholderOverlay) {
        placeholderOverlay.innerHTML = `
          <i class="fa-solid fa-search"></i>
          <h3>No se encontraron propiedades</h3>
          <p>Intenta ajustar los filtros de búsqueda</p>
        `;
      }

      return;
    }

    // Mostrar resultados
    placeholder.style.display = 'none';
    listContainer.style.display = 'grid';

    // Renderizar tarjetas
    const cardsHtml = this.data.map((prop, index) => this.renderPropertyCard(prop, index)).join('');

    listContainer.innerHTML = `
      <!-- Header de resultados -->
      <div class="results-header">
        <div class="results-info">
          <h3>${this.pagination.total} ${this.pagination.total === 1 ? 'propiedad encontrada' : 'propiedades encontradas'}</h3>
          <p>Página ${this.pagination.page} de ${this.pagination.totalPages}</p>
        </div>
      </div>

      <!-- Grid de propiedades -->
      <div class="properties-grid">
        ${cardsHtml}
      </div>

      <!-- Paginación -->
      ${this.renderPagination()}
    `;

    // Setup event listeners para las tarjetas
    this.setupCardListeners();
  }

  /**
   * Renderizar tarjeta de propiedad
   */
  renderPropertyCard(prop, index) {
    const propId = prop.registro_cab_id || prop.id || prop.propiedad_id;
    const imagenPrincipal = prop.imagen_principal || 'https://via.placeholder.com/400x300?text=Sin+Imagen';
    const imagenes = prop.imagenes_galeria && prop.imagenes_galeria.length > 0
      ? [imagenPrincipal, ...prop.imagenes_galeria]
      : [imagenPrincipal];

    // Precio según transacción
    let precio = 'Precio no disponible';
    if (prop.precio_compra || prop.precio_venta) {
      precio = `S/ ${parseFloat(prop.precio_compra || prop.precio_venta).toLocaleString('es-PE')}`;
    } else if (prop.precio_alquiler) {
      precio = `S/ ${parseFloat(prop.precio_alquiler).toLocaleString('es-PE')}/mes`;
    }

    // Características
    const caracteristicas = [];
    if (prop.area) caracteristicas.push(`📐 ${prop.area} m²`);
    if (prop.habitaciones) caracteristicas.push(`🛏️ ${prop.habitaciones} hab.`);
    if (prop.banos) caracteristicas.push(`🚿 ${prop.banos} baños`);
    if (prop.parqueos) caracteristicas.push(`🚗 ${prop.parqueos} parqueos`);

    return `
      <div class="property-card" data-property-id="${propId}">
        <!-- Número de propiedad -->
        <div class="property-number">${index + 1}</div>

        <!-- Botón de favorito -->
        <button class="favorite-btn ${prop.es_favorito ? 'is-favorite' : ''}"
                data-favorite-property="${propId}"
                ${prop.favorito_id ? `data-favorito-id='${prop.favorito_id}'` : ''}
                title="${prop.es_favorito ? 'Quitar de favoritos' : 'Agregar a favoritos'}">
          <svg class="heart-icon" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor">
            <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z"/>
          </svg>
        </button>

        <!-- Carrusel de imágenes -->
        <div class="property-image-carousel">
          <div class="carousel-images" data-current="0">
            ${imagenes.map((img, i) => `
              <img src='${img}'
                   alt='${prop.titulo || 'Propiedad'}'
                   class='carousel-image ${i === 0 ? 'active' : ''}'
                   data-index='${i}'
                   onerror="this.src='https://via.placeholder.com/400x300?text=Sin+Imagen'">
            `).join('')}
          </div>
          ${imagenes.length > 1 ? `
            <button class='carousel-prev' data-property-id='${propId}'>
              <i class="fa-solid fa-chevron-left"></i>
            </button>
            <button class='carousel-next' data-property-id='${propId}'>
              <i class="fa-solid fa-chevron-right"></i>
            </button>
            <div class='carousel-indicators'>
              ${imagenes.map((_, i) => `
                <span class='indicator ${i === 0 ? 'active' : ''}' data-index='${i}'></span>
              `).join('')}
            </div>
          ` : ''}
        </div>

        <!-- Información de la propiedad -->
        <div class="property-info">
          <h3 class="property-title">${prop.titulo || 'Sin título'}</h3>

          <div class="property-location">
            <i class="fa-solid fa-location-dot"></i>
            ${prop.direccion || prop.ubicacion || prop.distrito_nombre || 'Ubicación no especificada'}
          </div>

          <div class="property-price">${precio}</div>

          ${caracteristicas.length > 0 ? `
            <div class="property-features">
              ${caracteristicas.join(' | ')}
            </div>
          ` : ''}

          ${prop.descripcion ? `
            <p class="property-description">${prop.descripcion.substring(0, 150)}${prop.descripcion.length > 150 ? '...' : ''}</p>
          ` : ''}

          <button class="btn btn-primary btn-sm" onclick="window.open('/propiedad/${propId}', '_blank')">
            <i class="fa-solid fa-eye"></i>
            Ver Detalles
          </button>
        </div>
      </div>
    `;
  }

  /**
   * Renderizar paginación
   */
  renderPagination() {
    if (this.pagination.totalPages <= 1) {
      return '';
    }

    const pages = [];
    const currentPage = this.pagination.page;
    const totalPages = this.pagination.totalPages;

    // Botón anterior
    pages.push(`
      <button class="pagination-btn"
              ${currentPage === 1 ? 'disabled' : ''}
              onclick="window.searchResultsModule.goToPage(${currentPage - 1})">
        <i class="fa-solid fa-chevron-left"></i>
      </button>
    `);

    // Páginas
    for (let i = 1; i <= totalPages; i++) {
      if (i === 1 || i === totalPages || (i >= currentPage - 1 && i <= currentPage + 1)) {
        pages.push(`
          <button class="pagination-btn ${i === currentPage ? 'active' : ''}"
                  onclick="window.searchResultsModule.goToPage(${i})">
            ${i}
          </button>
        `);
      } else if (i === currentPage - 2 || i === currentPage + 2) {
        pages.push(`<span class="pagination-ellipsis">...</span>`);
      }
    }

    // Botón siguiente
    pages.push(`
      <button class="pagination-btn"
              ${currentPage === totalPages ? 'disabled' : ''}
              onclick="window.searchResultsModule.goToPage(${currentPage + 1})">
        <i class="fa-solid fa-chevron-right"></i>
      </button>
    `);

    return `
      <div class="pagination">
        ${pages.join('')}
      </div>
    `;
  }

  /**
   * Ir a una página específica
   */
  async goToPage(page) {
    if (page < 1 || page > this.pagination.totalPages || page === this.pagination.page) {
      return;
    }

    this.pagination.page = page;

    // Re-ejecutar búsqueda con nueva página
    await this.searchController.executeSearch();

    // Scroll al inicio de los resultados
    const resultsSection = document.querySelector('.search-results-section');
    if (resultsSection) {
      resultsSection.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  }

  /**
   * Setup event listeners para las tarjetas
   */
  setupCardListeners() {
    console.log('🎛️ SearchResultsModule.setupCardListeners() called');

    // Carruseles
    this.setupCarousels();

    // Favoritos
    this.setupFavorites();
  }

  /**
   * Setup carruseles de imágenes
   */
  setupCarousels() {
    const cards = document.querySelectorAll('.property-card');

    cards.forEach(card => {
      const prevBtn = card.querySelector('.carousel-prev');
      const nextBtn = card.querySelector('.carousel-next');
      const carouselImages = card.querySelector('.carousel-images');
      const images = card.querySelectorAll('.carousel-image');
      const indicators = card.querySelectorAll('.indicator');

      if (!carouselImages || images.length <= 1) return;

      let currentIndex = 0;

      const showImage = (index) => {
        // Ocultar todas las imágenes
        images.forEach(img => img.classList.remove('active'));
        indicators.forEach(ind => ind.classList.remove('active'));

        // Mostrar la imagen actual
        images[index].classList.add('active');
        indicators[index].classList.add('active');

        carouselImages.setAttribute('data-current', index);
      };

      if (prevBtn) {
        prevBtn.addEventListener('click', (e) => {
          e.stopPropagation();
          currentIndex = (currentIndex - 1 + images.length) % images.length;
          showImage(currentIndex);
        });
      }

      if (nextBtn) {
        nextBtn.addEventListener('click', (e) => {
          e.stopPropagation();
          currentIndex = (currentIndex + 1) % images.length;
          showImage(currentIndex);
        });
      }

      // Click en indicadores
      indicators.forEach((indicator, index) => {
        indicator.addEventListener('click', (e) => {
          e.stopPropagation();
          currentIndex = index;
          showImage(currentIndex);
        });
      });
    });
  }

  /**
   * Setup botones de favoritos
   */
  setupFavorites() {
    const favoriteButtons = document.querySelectorAll('.favorite-btn');

    favoriteButtons.forEach(button => {
      button.addEventListener('click', async (e) => {
        e.stopPropagation();
        await this.toggleFavorite(button);
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

      console.log(`${isFavorite ? '💔 Removiendo' : '❤️ Agregando'} favorito:`, propertyId);

      if (isFavorite) {
        // Remover de favoritos
        await favoritesActionService.removeFavorite(propertyId);
        button.classList.remove('is-favorite');
        button.setAttribute('title', 'Agregar a favoritos');
        showNotification('Removido de favoritos', 'success');
      } else {
        // Agregar a favoritos
        await favoritesActionService.addFavorite(propertyId);
        button.classList.add('is-favorite');
        button.setAttribute('title', 'Quitar de favoritos');
        showNotification('Agregado a favoritos', 'success');
      }

    } catch (error) {
      console.error('❌ Error al actualizar favorito:', error);
      showNotification('Error al actualizar favorito', 'error');
    }
  }

  setupEventListeners() {
    console.log('🎛️ SearchResultsModule.setupEventListeners() called (placeholder)');
  }
}

// Exportar clase a window
window.SearchResultsModule = SearchResultsModule;

let searchResultsModule;

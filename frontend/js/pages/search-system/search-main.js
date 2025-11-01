/**
 * 🔍 Sistema de Búsqueda Profesional - Orquestador Principal
 * Archivo: search-system/search-main.js
 *
 * Sistema completo de búsqueda con:
 * - Modal de búsqueda con filtros
 * - Página de resultados con acordeón
 * - Cards con carrusel e imágenes
 * - Mapa de propiedades
 * - Generación de fichas PDF A4
 * - Envío por correo
 */

class SearchSystemMain {
  constructor() {
    // Componentes
    this.searchModal = null;
    this.searchFilters = null;
    this.resultsMap = null;
    this.pdfGenerator = null;
    this.emailService = null;

    // Estado
    this.currentResults = [];
    this.selectedProperties = new Set(); // IDs de propiedades seleccionadas
    this.currentFilters = {};
    this.savedSearches = [];

    // Paginación
    this.currentPage = 1;
    this.itemsPerPage = 10;
    this.totalPages = 1;

    console.log('🔍 SearchSystemMain inicializado');
  }

  /**
   * Inicializar sistema
   */
  async init() {
    console.log('🚀 Inicializando Sistema de Búsqueda...');

    try {
      // Inicializar componentes
      await this.initializeComponents();

      // Setup UI
      this.setupEventListeners();

      console.log('✅ Sistema de Búsqueda listo');
    } catch (error) {
      console.error('❌ Error inicializando sistema:', error);
    }
  }

  /**
   * Inicializar componentes
   */
  async initializeComponents() {
    // Modal de búsqueda
    if (window.SearchModal) {
      this.searchModal = new SearchModal(this);
      await this.searchModal.init();
    }

    // Filtros de resultados (acordeón)
    if (window.SearchFilters) {
      this.searchFilters = new SearchFilters(this);
      await this.searchFilters.init();
    }

    // Mapa de resultados
    if (window.ResultsMap) {
      this.resultsMap = new ResultsMap(this);
      await this.resultsMap.init();
    }

    // Generador de PDF
    if (window.PDFGenerator) {
      this.pdfGenerator = new PDFGenerator(this);
    }

    // Servicio de Email
    if (window.EmailService) {
      this.emailService = new EmailService(this);
    }

    console.log('✅ Componentes inicializados');
  }

  /**
   * Setup event listeners
   */
  setupEventListeners() {
    // Botón de búsqueda principal (abre modal)
    document.addEventListener('click', (e) => {
      if (e.target.closest('[data-search-trigger]')) {
        e.preventDefault();
        this.openSearchModal();
      }
    });

    // Botón guardar búsqueda
    document.addEventListener('click', (e) => {
      if (e.target.closest('[data-save-search]')) {
        e.preventDefault();
        this.saveCurrentSearch();
      }
    });

    // Botón generar fichas
    document.addEventListener('click', (e) => {
      if (e.target.closest('[data-generate-pdf]')) {
        e.preventDefault();
        this.generatePDFSheets();
      }
    });

    // Botón enviar por correo
    document.addEventListener('click', (e) => {
      if (e.target.closest('[data-send-email]')) {
        e.preventDefault();
        this.sendEmailWithSheets();
      }
    });

    // Checkbox de selección
    document.addEventListener('change', (e) => {
      if (e.target.matches('[data-select-property]')) {
        this.handlePropertySelection(e.target);
      }
    });

    console.log('✅ Event listeners configurados');
  }

  /**
   * Abrir modal de búsqueda
   */
  openSearchModal() {
    console.log('🔍 Abriendo modal de búsqueda...');
    if (this.searchModal) {
      this.searchModal.open();
    }
  }

  /**
   * Ejecutar búsqueda
   */
  async executeSearch(filters) {
    console.log('🔍 Ejecutando búsqueda con filtros:', filters);

    try {
      this.currentFilters = filters;

      // Mostrar loading
      this.showLoading();

      // Llamar API
      const results = await searchService.buscarPropiedades(filters);

      console.log(`✅ ${results.length} propiedades encontradas`);

      this.currentResults = results;
      this.currentPage = 1;
      this.totalPages = Math.ceil(results.length / this.itemsPerPage);

      // Renderizar resultados
      this.renderResults();

      // Actualizar mapa
      if (this.resultsMap) {
        this.resultsMap.updateMarkers(results);
      }

      // Ocultar loading
      this.hideLoading();

      // Cerrar modal
      if (this.searchModal) {
        this.searchModal.close();
      }

    } catch (error) {
      console.error('❌ Error en búsqueda:', error);
      showNotification('Error al realizar la búsqueda', 'error');
      this.hideLoading();
    }
  }

  /**
   * Renderizar resultados
   */
  renderResults() {
    console.log(`📄 Renderizando página ${this.currentPage} de ${this.totalPages}`);

    const container = document.getElementById('searchResults');
    if (!container) {
      console.error('❌ Contenedor de resultados no encontrado');
      return;
    }

    // Calcular rango
    const start = (this.currentPage - 1) * this.itemsPerPage;
    const end = start + this.itemsPerPage;
    const pageResults = this.currentResults.slice(start, end);

    // Renderizar cards
    container.innerHTML = pageResults.map(property =>
      this.renderPropertyCard(property)
    ).join('');

    // Actualizar paginación
    this.renderPagination();

    // Actualizar contador
    this.updateResultsCounter();
  }

  /**
   * Renderizar card de propiedad
   */
  renderPropertyCard(property) {
    const isSelected = this.selectedProperties.has(property.id);

    return `
      <div class="property-card" data-property-id="${property.id}">
        <div class="property-card-header">
          <input
            type="checkbox"
            data-select-property="${property.id}"
            ${isSelected ? 'checked' : ''}
            class="property-checkbox"
          >
          <span class="property-code">${property.codigo || 'N/A'}</span>
        </div>

        <div class="property-carousel" data-carousel="${property.id}">
          ${this.renderCarousel(property.imagenes || [])}
        </div>

        <div class="property-info">
          <h3 class="property-title">${property.titulo || 'Sin título'}</h3>
          <p class="property-description">${property.descripcion || ''}</p>

          <div class="property-details">
            <div class="detail-item">
              <strong>Distrito:</strong> ${property.distrito || 'N/A'}
            </div>
            <div class="detail-item">
              <strong>Área:</strong> ${property.area || 'N/A'} m²
            </div>
            <div class="detail-item">
              <strong>Precio:</strong> $ ${formatNumber(property.precio || 0)}
            </div>
            <div class="detail-item">
              <strong>Estado:</strong>
              <span class="status-badge status-${property.estado_nombre?.toLowerCase()?.replace(/\s+/g, '-')}">
                ${property.estado_nombre || 'N/A'}
              </span>
            </div>
          </div>
        </div>

        <div class="property-actions">
          <button
            class="btn-view-details"
            data-view-details="${property.id}"
            title="Ver detalles"
          >
            Ver Detalles
          </button>
        </div>
      </div>
    `;
  }

  /**
   * Renderizar carrusel de imágenes
   */
  renderCarousel(imagenes) {
    if (!imagenes || imagenes.length === 0) {
      return `
        <div class="carousel-item active">
          <img src="assets/images/no-image.jpg" alt="Sin imagen">
        </div>
      `;
    }

    return `
      <div class="carousel-inner">
        ${imagenes.map((img, index) => `
          <div class="carousel-item ${index === 0 ? 'active' : ''}" data-image-index="${index}">
            <img
              src="${img.url}"
              alt="${img.descripcion || `Imagen ${index + 1}`}"
              loading="lazy"
            >
          </div>
        `).join('')}
      </div>
      ${imagenes.length > 1 ? `
        <button class="carousel-prev" data-carousel-prev>❮</button>
        <button class="carousel-next" data-carousel-next>❯</button>
        <div class="carousel-indicators">
          ${imagenes.map((_, index) => `
            <span class="indicator ${index === 0 ? 'active' : ''}" data-indicator="${index}"></span>
          `).join('')}
        </div>
      ` : ''}
    `;
  }

  /**
   * Renderizar paginación
   */
  renderPagination() {
    const container = document.getElementById('searchPagination');
    if (!container) return;

    const maxButtons = 5;
    const startPage = Math.max(1, this.currentPage - Math.floor(maxButtons / 2));
    const endPage = Math.min(this.totalPages, startPage + maxButtons - 1);

    let html = `
      <div class="pagination">
        <button
          class="pagination-btn"
          data-page="1"
          ${this.currentPage === 1 ? 'disabled' : ''}
        >
          ««
        </button>
        <button
          class="pagination-btn"
          data-page="${this.currentPage - 1}"
          ${this.currentPage === 1 ? 'disabled' : ''}
        >
          ‹
        </button>
    `;

    for (let i = startPage; i <= endPage; i++) {
      html += `
        <button
          class="pagination-btn ${i === this.currentPage ? 'active' : ''}"
          data-page="${i}"
        >
          ${i}
        </button>
      `;
    }

    html += `
        <button
          class="pagination-btn"
          data-page="${this.currentPage + 1}"
          ${this.currentPage === this.totalPages ? 'disabled' : ''}
        >
          ›
        </button>
        <button
          class="pagination-btn"
          data-page="${this.totalPages}"
          ${this.currentPage === this.totalPages ? 'disabled' : ''}
        >
          »»
        </button>
      </div>
    `;

    container.innerHTML = html;

    // Event listeners
    container.querySelectorAll('[data-page]').forEach(btn => {
      btn.addEventListener('click', () => {
        const page = parseInt(btn.dataset.page);
        if (page >= 1 && page <= this.totalPages) {
          this.goToPage(page);
        }
      });
    });
  }

  /**
   * Ir a página
   */
  goToPage(page) {
    this.currentPage = page;
    this.renderResults();

    // Scroll al inicio de resultados
    const container = document.getElementById('searchResults');
    if (container) {
      container.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  }

  /**
   * Actualizar contador de resultados
   */
  updateResultsCounter() {
    const counter = document.getElementById('resultsCounter');
    if (!counter) return;

    const start = (this.currentPage - 1) * this.itemsPerPage + 1;
    const end = Math.min(start + this.itemsPerPage - 1, this.currentResults.length);

    counter.textContent = `Mostrando ${start}-${end} de ${this.currentResults.length} resultados`;
  }

  /**
   * Manejar selección de propiedad
   */
  handlePropertySelection(checkbox) {
    const propertyId = parseInt(checkbox.dataset.selectProperty);

    if (checkbox.checked) {
      this.selectedProperties.add(propertyId);
    } else {
      this.selectedProperties.delete(propertyId);
    }

    console.log(`📋 Propiedades seleccionadas: ${this.selectedProperties.size}`);
    this.updateSelectionCounter();
  }

  /**
   * Actualizar contador de selección
   */
  updateSelectionCounter() {
    const counter = document.getElementById('selectionCounter');
    if (!counter) return;

    const count = this.selectedProperties.size;
    counter.textContent = count > 0 ? `${count} seleccionada(s)` : '';
    counter.style.display = count > 0 ? 'block' : 'none';
  }

  /**
   * Guardar búsqueda actual
   */
  async saveCurrentSearch() {
    console.log('💾 Guardando búsqueda...');

    const nombre = await this.promptSearchName();
    if (!nombre) return;

    const search = {
      id: Date.now(),
      nombre,
      filtros: this.currentFilters,
      fecha: new Date().toISOString(),
      resultados: this.currentResults.length
    };

    this.savedSearches.push(search);
    localStorage.setItem('savedSearches', JSON.stringify(this.savedSearches));

    showNotification(`✅ Búsqueda "${nombre}" guardada`, 'success');
  }

  /**
   * Prompt para nombre de búsqueda
   */
  async promptSearchName() {
    const { value } = await Swal.fire({
      title: 'Guardar Búsqueda',
      input: 'text',
      inputLabel: 'Nombre de la búsqueda',
      inputPlaceholder: 'Ej: Oficinas en Surco',
      showCancelButton: true,
      confirmButtonText: 'Guardar',
      cancelButtonText: 'Cancelar',
      confirmButtonColor: '#2C5282'
    });

    return value;
  }

  /**
   * Generar fichas PDF
   */
  async generatePDFSheets() {
    if (this.selectedProperties.size === 0) {
      showNotification('⚠️ Selecciona al menos una propiedad', 'warning');
      return;
    }

    console.log(`📄 Generando ${this.selectedProperties.size} fichas PDF...`);

    if (!this.pdfGenerator) {
      showNotification('❌ Generador de PDF no disponible', 'error');
      return;
    }

    try {
      const selectedData = this.currentResults.filter(p =>
        this.selectedProperties.has(p.id)
      );

      await this.pdfGenerator.generate(selectedData);
      showNotification('✅ Fichas generadas correctamente', 'success');
    } catch (error) {
      console.error('❌ Error generando PDFs:', error);
      showNotification('❌ Error al generar fichas', 'error');
    }
  }

  /**
   * Enviar por correo
   */
  async sendEmailWithSheets() {
    if (this.selectedProperties.size === 0) {
      showNotification('⚠️ Selecciona al menos una propiedad', 'warning');
      return;
    }

    console.log(`📧 Enviando ${this.selectedProperties.size} fichas por correo...`);

    if (!this.emailService) {
      showNotification('❌ Servicio de email no disponible', 'error');
      return;
    }

    try {
      const selectedData = this.currentResults.filter(p =>
        this.selectedProperties.has(p.id)
      );

      await this.emailService.sendWithAttachments(selectedData);
      showNotification('✅ Correo enviado correctamente', 'success');
    } catch (error) {
      console.error('❌ Error enviando correo:', error);
      showNotification('❌ Error al enviar correo', 'error');
    }
  }

  /**
   * Mostrar loading
   */
  showLoading() {
    const container = document.getElementById('searchResults');
    if (container) {
      container.innerHTML = `
        <div class="search-loading">
          <div class="spinner-large"></div>
          <p>Buscando propiedades...</p>
        </div>
      `;
    }
  }

  /**
   * Ocultar loading
   */
  hideLoading() {
    // Se hace automáticamente al renderizar resultados
  }
}

// Helpers
function formatNumber(num) {
  return new Intl.NumberFormat('en-US').format(num);
}

// Exponer globalmente
window.SearchSystemMain = SearchSystemMain;

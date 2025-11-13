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
      // Cargar filtros guardados desde index (modo invitado)
      this.loadFiltersFromStorage();
      
      // Inicializar componentes
      await this.initializeComponents();

      // Setup UI
      this.setupEventListeners();

      // Ejecutar búsqueda automáticamente si hay filtros
      if (Object.keys(this.currentFilters).length > 0) {
        await this.executeSearch(this.currentFilters);
      }

      console.log('✅ Sistema de Búsqueda listo');
    } catch (error) {
      console.error('❌ Error inicializando sistema:', error);
    }
  }

  /**
   * Cargar filtros desde localStorage (viene del index)
   */
  loadFiltersFromStorage() {
    try {
      const savedFilters = localStorage.getItem('filtros_simplificados');
      if (savedFilters) {
        this.currentFilters = JSON.parse(savedFilters);
        console.log('📋 Filtros cargados desde localStorage:', this.currentFilters);
        
        // Actualizar header con filtros activos
        this.updateHeaderWithFilters();
        
        // Limpiar localStorage después de cargar
        localStorage.removeItem('filtros_simplificados');
      }
    } catch (error) {
      console.error('❌ Error cargando filtros:', error);
    }
  }

  /**
   * Actualizar header con filtros activos
   */
  updateHeaderWithFilters() {
    const activeFiltersDiv = document.getElementById('activeFilters');
    if (!activeFiltersDiv) return;

    activeFiltersDiv.innerHTML = '';

    if (Object.keys(this.currentFilters).length === 0) {
      activeFiltersDiv.innerHTML = '<span style="color: #6c757d; font-size: 0.9rem;">Todos los inmuebles</span>';
      return;
    }

    // Mostrar filtros activos como tags
    const filterLabels = {
      'tipo_inmueble_id': 'Tipo',
      'transaccion': 'Operación',
      'area': 'Área',
      'presupuesto_compra': 'Presupuesto',
      'presupuesto_alquiler': 'Alquiler',
      'distritos_ids': 'Distritos'
    };

    Object.entries(this.currentFilters).forEach(([key, value]) => {
      if (!value) return;
      
      let label = filterLabels[key] || key;
      let displayValue = value;

      // Formatear valores especiales
      if (key === 'tipo_inmueble_id' && typeof value === 'number') {
        const tipos = {1: 'Casa', 2: 'Departamento', 3: 'Oficina', 4: 'Local', 5: 'Terreno'};
        displayValue = tipos[value] || value;
      }
      
      if (key === 'transaccion') {
        displayValue = value === 'compra' ? 'Compra' : 'Alquiler';
      }
      
      if (key === 'area' && typeof value === 'number') {
        displayValue = `${value}m²`;
      }
      
      if ((key === 'presupuesto_compra' || key === 'presupuesto_alquiler') && typeof value === 'number') {
        displayValue = `USD ${value.toLocaleString()}`;
      }

      const tag = document.createElement('div');
      tag.className = 'filter-tag';
      tag.innerHTML = `
        ${label}: ${displayValue}
        <span class="remove-filter" onclick="window.searchSystem.removeFilter('${key}')">×</span>
      `;
      activeFiltersDiv.appendChild(tag);
    });
  }

  /**
   * Inicializar componentes (solo esenciales para modo invitado)
   */
  async initializeComponents() {
    try {
      // Mapa de resultados (si está disponible)
      if (window.ResultsMap) {
        this.resultsMap = new ResultsMap(this);
        await this.resultsMap.init();
      } else {
        console.log('⚠️ Mapa no disponible - modo invitado');
      }

      console.log('✅ Componentes esenciales inicializados');
    } catch (error) {
      console.error('❌ Error inicializando componentes:', error);
    }
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
   * Renderizar card de propiedad (versión simple para invitados)
   */
  renderPropertyCard(property) {
    const precio = property.precio ? `$${Number(property.precio).toLocaleString()}` : 'Consultar';
    const imagen = property.imagenes && property.imagenes.length > 0 
      ? property.imagenes[0].url 
      : 'assets/images/no-image.jpg';

    return `
      <div class="property-card" style="
        background: white;
        border-radius: 12px;
        box-shadow: 0 2px 8px rgba(0,0,0,0.1);
        margin-bottom: 20px;
        overflow: hidden;
        transition: transform 0.3s ease;
      ">
        <div style="position: relative;">
          <img src="${imagen}" alt="${property.titulo || 'Propiedad'}" style="
            width: 100%;
            height: 200px;
            object-fit: cover;
          ">
          <div style="
            position: absolute;
            top: 10px;
            right: 10px;
            background: rgba(255,255,255,0.9);
            padding: 4px 8px;
            border-radius: 6px;
            font-size: 0.8rem;
            font-weight: 600;
          ">
            ${property.codigo || 'N/A'}
          </div>
        </div>

        <div style="padding: 20px;">
          <h3 style="
            margin: 0 0 10px 0;
            color: #1e3a8a;
            font-size: 1.2rem;
            font-weight: 600;
          ">
            ${property.titulo || 'Sin título'}
          </h3>

          <p style="
            margin: 0 0 15px 0;
            color: #6c757d;
            font-size: 0.9rem;
            line-height: 1.4;
          ">
            ${property.descripcion || 'Sin descripción disponible'}
          </p>

          <div style="
            display: grid;
            grid-template-columns: 1fr 1fr;
            gap: 10px;
            margin-bottom: 15px;
          ">
            <div>
              <strong style="color: #495057;">Distrito:</strong>
              <span style="color: #1e3a8a;"> ${property.distrito || 'N/A'}</span>
            </div>
            <div>
              <strong style="color: #495057;">Área:</strong>
              <span style="color: #1e3a8a;"> ${property.area || 'N/A'} m²</span>
            </div>
          </div>

          <div style="
            display: flex;
            justify-content: space-between;
            align-items: center;
            padding-top: 15px;
            border-top: 1px solid #e9ecef;
          ">
            <div style="
              font-size: 1.3rem;
              font-weight: 700;
              color: #28a745;
            ">
              ${precio}
            </div>
            <button onclick="window.location.href='login.html'" style="
              background: #1e3a8a;
              color: white;
              border: none;
              padding: 8px 16px;
              border-radius: 6px;
              font-size: 0.9rem;
              cursor: pointer;
              transition: background 0.3s ease;
            " onmouseover="this.style.background='#1e40af'" onmouseout="this.style.background='#1e3a8a'">
              Ver Detalles
            </button>
          </div>
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
    if (!container || this.totalPages <= 1) {
      if (container) container.innerHTML = '';
      return;
    }

    let html = `
      <div style="
        display: flex;
        justify-content: center;
        gap: 8px;
        margin-top: 20px;
      ">
    `;

    // Botón anterior
    html += `
      <button
        onclick="window.searchSystem.goToPage(${Math.max(1, this.currentPage - 1)})"
        style="
          padding: 8px 12px;
          border: 1px solid #dee2e6;
          background: ${this.currentPage === 1 ? '#f8f9fa' : 'white'};
          color: ${this.currentPage === 1 ? '#6c757d' : '#1e3a8a'};
          border-radius: 6px;
          cursor: ${this.currentPage === 1 ? 'not-allowed' : 'pointer'};
        "
        ${this.currentPage === 1 ? 'disabled' : ''}
      >
        ← Anterior
      </button>
    `;

    // Números de página
    for (let i = 1; i <= Math.min(this.totalPages, 5); i++) {
      html += `
        <button
          onclick="window.searchSystem.goToPage(${i})"
          style="
            padding: 8px 12px;
            border: 1px solid ${i === this.currentPage ? '#1e3a8a' : '#dee2e6'};
            background: ${i === this.currentPage ? '#1e3a8a' : 'white'};
            color: ${i === this.currentPage ? 'white' : '#1e3a8a'};
            border-radius: 6px;
            cursor: pointer;
            font-weight: ${i === this.currentPage ? '600' : 'normal'};
          "
        >
          ${i}
        </button>
      `;
    }

    // Botón siguiente
    html += `
      <button
        onclick="window.searchSystem.goToPage(${Math.min(this.totalPages, this.currentPage + 1)})"
        style="
          padding: 8px 12px;
          border: 1px solid #dee2e6;
          background: ${this.currentPage === this.totalPages ? '#f8f9fa' : 'white'};
          color: ${this.currentPage === this.totalPages ? '#6c757d' : '#1e3a8a'};
          border-radius: 6px;
          cursor: ${this.currentPage === this.totalPages ? 'not-allowed' : 'pointer'};
        "
        ${this.currentPage === this.totalPages ? 'disabled' : ''}
      >
        Siguiente →
      </button>
    `;

    html += '</div>';
    container.innerHTML = html;
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
    const headerCounter = document.getElementById('resultsCounter');
    
    if (!counter && !headerCounter) return;

    const total = this.currentResults.length;
    const start = (this.currentPage - 1) * this.itemsPerPage + 1;
    const end = Math.min(start + this.itemsPerPage - 1, total);

    const text = total > 0 
      ? `${total} propiedades encontradas`
      : 'No se encontraron propiedades';

    // Actualizar header principal
    if (headerCounter) {
      headerCounter.textContent = text;
    }

    // Actualizar contador secundario si existe
    if (counter) {
      counter.textContent = total > 0 
        ? `Mostrando ${start}-${end} de ${total} resultados`
        : 'No hay resultados';
    }
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
   * Remover filtro específico
   */
  async removeFilter(filterKey) {
    console.log('🗑️ Removiendo filtro:', filterKey);
    
    // Eliminar filtro
    delete this.currentFilters[filterKey];
    
    // Actualizar header
    this.updateHeaderWithFilters();
    
    // Ejecutar búsqueda con filtros actualizados
    if (Object.keys(this.currentFilters).length > 0) {
      await this.executeSearch(this.currentFilters);
    } else {
      // Si no hay filtros, mostrar todos
      await this.executeSearch({});
    }
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

/**
 * 🖼️ Visor de Imágenes (Lightbox)
 * Archivo: search-system/components/image-viewer.js
 *
 * Visor para mostrar imágenes más grandes
 * Activado por doble click en cards de carrusel
 */

class ImageViewer {
  constructor() {
    this.viewer = null;
    this.images = [];
    this.currentIndex = 0;
    this.isOpen = false;
  }

  /**
   * Inicializar visor
   */
  init() {
    console.log('🖼️ Inicializando ImageViewer...');

    this.createViewer();
    this.setupListeners();

    console.log('✅ ImageViewer inicializado');
  }

  /**
   * Crear visor en el DOM
   */
  createViewer() {
    const viewerHTML = `
      <div id="imageViewer" class="image-viewer">
        <div class="image-viewer-overlay"></div>

        <div class="image-viewer-container">
          <!-- Botón cerrar -->
          <button class="image-viewer-close" data-close-viewer>
            <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <line x1="18" y1="6" x2="6" y2="18"></line>
              <line x1="6" y1="6" x2="18" y2="18"></line>
            </svg>
          </button>

          <!-- Navegación -->
          <button class="image-viewer-prev" data-viewer-prev>
            <svg xmlns="http://www.w3.org/2000/svg" width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <polyline points="15 18 9 12 15 6"></polyline>
            </svg>
          </button>

          <button class="image-viewer-next" data-viewer-next>
            <svg xmlns="http://www.w3.org/2000/svg" width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <polyline points="9 18 15 12 9 6"></polyline>
            </svg>
          </button>

          <!-- Imagen -->
          <div class="image-viewer-content">
            <img id="viewerImage" src="" alt="">
            <div class="image-viewer-caption">
              <span id="viewerCaption"></span>
            </div>
          </div>

          <!-- Contador -->
          <div class="image-viewer-counter">
            <span id="viewerCounter">1 / 1</span>
          </div>

          <!-- Miniaturas -->
          <div class="image-viewer-thumbnails" id="viewerThumbnails">
            <!-- Se generan dinámicamente -->
          </div>
        </div>
      </div>
    `;

    document.body.insertAdjacentHTML('beforeend', viewerHTML);
    this.viewer = document.getElementById('imageViewer');
  }

  /**
   * Setup listeners
   */
  setupListeners() {
    // Cerrar viewer
    this.viewer.addEventListener('click', (e) => {
      if (e.target.matches('[data-close-viewer]') || e.target.matches('.image-viewer-overlay')) {
        this.close();
      }
    });

    // Navegación
    this.viewer.addEventListener('click', (e) => {
      if (e.target.closest('[data-viewer-prev]')) {
        this.prev();
      } else if (e.target.closest('[data-viewer-next]')) {
        this.next();
      }
    });

    // Teclado
    document.addEventListener('keydown', (e) => {
      if (!this.isOpen) return;

      switch (e.key) {
        case 'Escape':
          this.close();
          break;
        case 'ArrowLeft':
          this.prev();
          break;
        case 'ArrowRight':
          this.next();
          break;
      }
    });

    // Doble click en cards de propiedades
    document.addEventListener('dblclick', (e) => {
      const img = e.target.closest('.property-carousel img, .carousel-item img');
      if (!img) return;

      const card = img.closest('[data-property-id]');
      if (!card) return;

      const propertyId = card.dataset.propertyId;
      this.openFromProperty(propertyId, img);
    });
  }

  /**
   * Abrir desde una propiedad
   */
  openFromProperty(propertyId, clickedImg) {
    console.log(`🖼️ Abriendo visor para propiedad ${propertyId}`);

    // Buscar todas las imágenes de esta propiedad
    const card = document.querySelector(`[data-property-id="${propertyId}"]`);
    if (!card) return;

    const carousel = card.querySelector('.property-carousel, .carousel-inner');
    if (!carousel) return;

    const images = Array.from(carousel.querySelectorAll('img'));
    this.images = images.map(img => ({
      url: img.src,
      caption: img.alt || ''
    }));

    // Encontrar índice de la imagen clickeada
    this.currentIndex = images.indexOf(clickedImg);
    if (this.currentIndex === -1) this.currentIndex = 0;

    this.open();
  }

  /**
   * Abrir visor
   */
  open(images = null, startIndex = 0) {
    if (images) {
      this.images = images;
      this.currentIndex = startIndex;
    }

    if (this.images.length === 0) {
      console.warn('⚠️ No hay imágenes para mostrar');
      return;
    }

    this.isOpen = true;
    this.viewer.classList.add('active');
    document.body.style.overflow = 'hidden';

    this.render();
  }

  /**
   * Cerrar visor
   */
  close() {
    this.isOpen = false;
    this.viewer.classList.remove('active');
    document.body.style.overflow = '';
  }

  /**
   * Imagen anterior
   */
  prev() {
    this.currentIndex = (this.currentIndex - 1 + this.images.length) % this.images.length;
    this.render();
  }

  /**
   * Imagen siguiente
   */
  next() {
    this.currentIndex = (this.currentIndex + 1) % this.images.length;
    this.render();
  }

  /**
   * Renderizar visor
   */
  render() {
    const current = this.images[this.currentIndex];

    // Imagen principal
    const img = document.getElementById('viewerImage');
    img.src = current.url;
    img.alt = current.caption;

    // Caption
    const caption = document.getElementById('viewerCaption');
    caption.textContent = current.caption || `Imagen ${this.currentIndex + 1}`;

    // Contador
    const counter = document.getElementById('viewerCounter');
    counter.textContent = `${this.currentIndex + 1} / ${this.images.length}`;

    // Miniaturas
    this.renderThumbnails();

    // Mostrar/ocultar navegación
    const prevBtn = this.viewer.querySelector('[data-viewer-prev]');
    const nextBtn = this.viewer.querySelector('[data-viewer-next]');

    prevBtn.style.display = this.images.length > 1 ? 'flex' : 'none';
    nextBtn.style.display = this.images.length > 1 ? 'flex' : 'none';
  }

  /**
   * Renderizar miniaturas
   */
  renderThumbnails() {
    const container = document.getElementById('viewerThumbnails');

    if (this.images.length <= 1) {
      container.style.display = 'none';
      return;
    }

    container.style.display = 'flex';
    container.innerHTML = this.images.map((img, index) => `
      <div
        class="viewer-thumbnail ${index === this.currentIndex ? 'active' : ''}"
        data-thumbnail="${index}"
      >
        <img src="${img.url}" alt="${img.caption || ''}">
      </div>
    `).join('');

    // Click en miniaturas
    container.querySelectorAll('[data-thumbnail]').forEach(thumb => {
      thumb.addEventListener('click', () => {
        this.currentIndex = parseInt(thumb.dataset.thumbnail);
        this.render();
      });
    });
  }
}

// Crear instancia global
if (!window.imageViewer) {
  window.imageViewer = new ImageViewer();
  // Auto-inicializar
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
      window.imageViewer.init();
    });
  } else {
    window.imageViewer.init();
  }
}

// Exponer clase
window.ImageViewer = ImageViewer;

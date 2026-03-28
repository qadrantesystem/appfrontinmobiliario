/**
 * 🖼️ IMAGE VIEWER - Visor de imágenes profesional con PhotoSwipe 5
 * 
 * Uso:
 * const viewer = new ImageViewer();
 * viewer.open(images, startIndex);
 * 
 * O automático:
 * viewer.attachToImages('.property-image');
 */

class ImageViewer {
  constructor() {
    this.pswp = null;
    this.lightbox = null;
    this.initialized = false;
  }

  /**
   * Inicializar PhotoSwipe (carga lazy)
   */
  async init() {
    if (this.initialized) return;

    // Cargar PhotoSwipe dinámicamente si no está cargado
    if (!window.PhotoSwipeLightbox) {
      await this.loadPhotoSwipe();
    }

    this.initialized = true;
    console.log('✅ ImageViewer inicializado');
  }

  /**
   * Cargar PhotoSwipe desde CDN
   */
  async loadPhotoSwipe() {
    return new Promise((resolve, reject) => {
      // CSS
      const cssLink = document.createElement('link');
      cssLink.rel = 'stylesheet';
      cssLink.href = 'https://cdn.jsdelivr.net/npm/photoswipe@5.4.3/dist/photoswipe.css';
      document.head.appendChild(cssLink);

      // JS - PhotoSwipe Lightbox
      const script = document.createElement('script');
      script.src = 'https://cdn.jsdelivr.net/npm/photoswipe@5.4.3/dist/umd/photoswipe-lightbox.umd.min.js';
      script.onload = () => {
        // JS - PhotoSwipe Core
        const pswpScript = document.createElement('script');
        pswpScript.src = 'https://cdn.jsdelivr.net/npm/photoswipe@5.4.3/dist/umd/photoswipe.umd.min.js';
        pswpScript.onload = resolve;
        pswpScript.onerror = reject;
        document.head.appendChild(pswpScript);
      };
      script.onerror = reject;
      document.head.appendChild(script);
    });
  }

  /**
   * Abrir galería de imágenes
   * @param {Array} images - Array de URLs de imágenes
   * @param {number} startIndex - Índice de imagen inicial (0-based)
   */
  async open(images, startIndex = 0) {
    await this.init();

    // Preparar datos para PhotoSwipe
    const dataSource = images.map((url, index) => ({
      src: url,
      width: 1200,  // Ancho estimado
      height: 800,  // Alto estimado
      alt: `Imagen ${index + 1} de ${images.length}`
    }));

    // Crear instancia de lightbox
    const lightbox = new PhotoSwipeLightbox({
      dataSource: dataSource,
      pswpModule: PhotoSwipe,
      
      // Configuración
      bgOpacity: 0.95,
      spacing: 0.1,
      allowPanToNext: true,
      loop: true,
      
      // UI
      closeTitle: 'Cerrar (Esc)',
      zoomTitle: 'Zoom',
      arrowPrevTitle: 'Anterior',
      arrowNextTitle: 'Siguiente',
      
      // Zoom
      maxZoomLevel: 3,
      initialZoomLevel: 'fit',
      secondaryZoomLevel: 2,
      
      // Animaciones
      showAnimationDuration: 300,
      hideAnimationDuration: 300,
    });

    // Event listeners personalizados
    lightbox.on('uiRegister', () => {
      // Agregar contador personalizado
      lightbox.pswp.ui.registerElement({
        name: 'custom-counter',
        order: 9,
        isButton: false,
        appendTo: 'wrapper',
        html: '',
        onInit: (el, pswp) => {
          const updateCounter = () => {
            el.innerHTML = `
              <div style="
                position: absolute;
                top: 20px;
                left: 50%;
                transform: translateX(-50%);
                background: rgba(0, 0, 0, 0.7);
                color: white;
                padding: 8px 16px;
                border-radius: 20px;
                font-size: 14px;
                font-weight: 600;
                z-index: 10000;
                pointer-events: none;
              ">
                ${pswp.currIndex + 1} / ${pswp.getNumItems()}
              </div>
            `;
          };
          
          pswp.on('change', updateCounter);
          updateCounter();
        }
      });
    });

    // Inicializar y abrir
    lightbox.init();
    lightbox.loadAndOpen(startIndex);

    console.log(`🖼️ Abriendo galería: imagen ${startIndex + 1} de ${images.length}`);
  }

  /**
   * Abrir imagen única
   * @param {string} imageUrl - URL de la imagen
   */
  async openSingle(imageUrl) {
    await this.open([imageUrl], 0);
  }

  /**
   * Agregar event listeners a imágenes existentes
   * @param {string} selector - Selector CSS de imágenes
   */
  attachToImages(selector = '.property-image') {
    // Evitar duplicar listener global
    if (this._imageClickAttached) return;
    this._imageClickAttached = true;

    document.addEventListener('click', async (e) => {
      // No interceptar clicks en botones del carrusel ni controles
      if (e.target.closest('.carousel-prev, .carousel-next, .indicator, .carousel-indicators, .favorite-btn-beautiful, .favorite-btn-float, .btn-detalle-resultado, .btn-detalle-prop, .btn-detalle-fav, button')) return;

      const img = e.target.closest(selector);
      if (!img) return;

      e.preventDefault();
      e.stopPropagation();
      
      // Obtener todas las imágenes del mismo grupo
      const container = img.closest('.property-card, .property-detail, .properties-grid, .resultados-grid, .favoritos-grid');
      
      let allImages = [];
      let startIndex = 0;
      
      if (container) {
        // Si está en un contenedor, obtener todas las imágenes del contenedor
        const allImgs = Array.from(container.querySelectorAll(selector));
        allImages = allImgs.map(el => el.src || el.dataset.src || el.getAttribute('src'));
        startIndex = allImages.indexOf(img.src || img.dataset.src || img.getAttribute('src'));
      } else {
        // Si no, solo la imagen clickeada
        allImages = [img.src || img.dataset.src || img.getAttribute('src')];
        startIndex = 0;
      }
      
      // Filtrar imágenes válidas
      allImages = allImages.filter(url => url && url !== '' && !url.includes('placeholder'));
      
      if (allImages.length > 0) {
        await this.open(allImages, Math.max(0, startIndex));
      }
    });
    
    console.log(`✅ ImageViewer attached to: ${selector}`);
  }
}

// Instancia global
window.imageViewer = new ImageViewer();

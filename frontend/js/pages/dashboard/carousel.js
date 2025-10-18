// Dashboard Carousel Module
(function(window) {
  'use strict';

  class DashboardCarousel {
    constructor(dashboard) {
      this.dashboard = dashboard;
    }

    setup() {
      // Botones prev
      document.querySelectorAll('.carousel-prev').forEach(btn => {
        btn.addEventListener('click', (e) => {
          e.stopPropagation();
          const propId = e.currentTarget.dataset.propertyId;
          this.cambiarImagen(propId, -1);
        });
      });

      // Botones next
      document.querySelectorAll('.carousel-next').forEach(btn => {
        btn.addEventListener('click', (e) => {
          e.stopPropagation();
          const propId = e.currentTarget.dataset.propertyId;
          this.cambiarImagen(propId, 1);
        });
      });

      // Indicadores
      document.querySelectorAll('.indicator').forEach(indicator => {
        indicator.addEventListener('click', (e) => {
          e.stopPropagation();
          const newIndex = parseInt(e.currentTarget.dataset.index);
          const card = e.currentTarget.closest('.property-card');
          if (!card) return;

          const carousel = card.querySelector('.carousel-images');
          const imagenes = carousel.querySelectorAll('.carousel-image');
          const indicadores = card.querySelectorAll('.indicator');
          
          imagenes.forEach((img, i) => img.classList.toggle('active', i === newIndex));
          indicadores.forEach((ind, i) => ind.classList.toggle('active', i === newIndex));
          
          carousel.dataset.current = newIndex;
        });
      });
    }

    cambiarImagen(propId, direccion) {
      const card = document.querySelector(`.property-card[data-property-id="${propId}"]`);
      if (!card) return;
      
      const carousel = card.querySelector('.carousel-images');
      const imagenes = carousel.querySelectorAll('.carousel-image');
      const indicadores = card.querySelectorAll('.indicator');

      let currentIndex = parseInt(carousel.dataset.current);
      const totalImagenes = imagenes.length;

      currentIndex = (currentIndex + direccion + totalImagenes) % totalImagenes;

      imagenes.forEach((img, i) => img.classList.toggle('active', i === currentIndex));
      indicadores.forEach((ind, i) => ind.classList.toggle('active', i === currentIndex));

      carousel.dataset.current = currentIndex;
    }
  }

  window.DashboardCarousel = DashboardCarousel;

})(window);

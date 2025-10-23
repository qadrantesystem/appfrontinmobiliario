// Dashboard Pagination Module
(function(window) {
  'use strict';

  class DashboardPagination {
    constructor(dashboard) {
      this.dashboard = dashboard;
      this.activeTab = null; // ✅ Referencia al tab activo (PropiedadesTab)
      this.currentPage = 1;
      this.itemsPerPage = 10;
    }

    /**
     * ✅ NUEVO: Setear el tab activo que usará el paginador
     */
    setActiveTab(tab) {
      this.activeTab = tab;
      console.log('✅ Pagination - Tab activo configurado:', tab.constructor.name);
    }

    updateItemsPerPage() {
      this.itemsPerPage = window.innerWidth <= 768 ? 5 : 10;
    }

    render(filteredCount) {
      const totalPages = Math.ceil(filteredCount / this.itemsPerPage);
      
      if (totalPages <= 1) {
        return '';
      }

      const isMobile = window.innerWidth <= 768;

      let html = `
        <div id="paginador" class="pagination-container" style="display: flex; justify-content: center; align-items: center; gap: ${isMobile ? '6px' : 'var(--spacing-md)'}; margin-top: var(--spacing-xl); flex-wrap: nowrap;">
          <button class="btn btn-secondary pagination-btn pagination-prev" data-page="${this.currentPage - 1}" ${this.currentPage === 1 ? 'disabled' : ''}>
            ${isMobile ? '‹' : '‹ Anterior'}
          </button>
          <div style="display: flex; gap: ${isMobile ? '4px' : '8px'}; align-items: center;">
      `;

      // En móvil mostrar solo página actual y total
      if (isMobile) {
        html += `
          <button class="btn btn-primary pagination-btn" style="min-width: 32px; cursor: default;" disabled>
            ${this.currentPage}
          </button>
          <span style="color: var(--gris-medio); font-size: 0.85rem;">/</span>
          <span style="color: var(--gris-medio); font-size: 0.85rem;">${totalPages}</span>
        `;
      } else {
        // Desktop: mostrar números como antes
        for (let i = 1; i <= totalPages; i++) {
          if (i === 1 || i === totalPages || (i >= this.currentPage - 1 && i <= this.currentPage + 1)) {
            html += `
              <button class="btn ${i === this.currentPage ? 'btn-primary' : 'btn-secondary'} pagination-btn pagination-number" 
                      data-page="${i}" 
                      style="min-width: 40px;"
                      ${i === this.currentPage ? 'disabled' : ''}>
                ${i}
              </button>
            `;
          } else if (i === this.currentPage - 2 || i === this.currentPage + 2) {
            html += '<span style="padding: 8px; color: var(--gris-medio);">...</span>';
          }
        }
      }

      html += `
          </div>
          <button class="btn btn-secondary pagination-btn pagination-next" data-page="${this.currentPage + 1}" ${this.currentPage === totalPages ? 'disabled' : ''}>
            ${isMobile ? '›' : 'Siguiente ›'}
          </button>
        </div>
      `;

      return html;
    }

    setupListeners() {
      // Event delegation para botones de paginación
      const paginador = document.getElementById('paginador');
      if (!paginador) return;

      paginador.addEventListener('click', (e) => {
        const btn = e.target.closest('.pagination-btn');
        if (!btn || btn.disabled) return;

        const page = parseInt(btn.dataset.page);
        if (page && page > 0) {
          this.goToPage(page);
        }
      });
    }

    goToPage(page) {
      console.log(`📄 Paginador - Ir a página ${page}`);
      this.currentPage = page;

      // ✅ FIX: Usar activeTab (PropiedadesTab) en lugar de dashboard
      if (this.activeTab && typeof this.activeTab.renderPropertiesPage === 'function') {
        this.activeTab.renderPropertiesPage();
        console.log('✅ Página cambiada exitosamente');
      } else {
        console.warn('⚠️ No hay tab activo para cambiar de página');
      }

      window.scrollTo({ top: 0, behavior: 'smooth' });
    }

    getPageData(items) {
      const startIndex = (this.currentPage - 1) * this.itemsPerPage;
      const endIndex = startIndex + this.itemsPerPage;
      return {
        items: items.slice(startIndex, endIndex),
        startIndex,
        totalPages: Math.ceil(items.length / this.itemsPerPage)
      };
    }
  }

  window.DashboardPagination = DashboardPagination;

})(window);

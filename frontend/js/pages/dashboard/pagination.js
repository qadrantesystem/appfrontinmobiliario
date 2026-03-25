// Dashboard Pagination Module
(function(window) {
  'use strict';

  class DashboardPagination {
    constructor(dashboard) {
      this.dashboard = dashboard;
      this.activeTab = null;
      this.currentPage = 1;
      this.itemsPerPage = 5;
    }

    setActiveTab(tab) {
      this.activeTab = tab;
    }

    updateItemsPerPage() {
      this.itemsPerPage = 5;
    }

    _generarPaginas(actual, total) {
      const paginas = [];
      for (let i = 1; i <= total; i++) {
        const esExtremo = (i === 1 || i === total);
        const esVentana = (i >= actual - 1 && i <= actual + 1);
        if (esExtremo || esVentana) {
          const ultimo = paginas[paginas.length - 1];
          if (ultimo && typeof ultimo === 'number' && i - ultimo > 1) {
            paginas.push('...');
          }
          paginas.push(i);
        }
      }
      return paginas;
    }

    render(filteredCount) {
      const totalPages = Math.ceil(filteredCount / this.itemsPerPage);
      if (totalPages <= 1) return '';

      const paginas = this._generarPaginas(this.currentPage, totalPages);

      const numerosHTML = paginas.map(p => {
        if (p === '...') {
          return '<span class="pag-ellipsis">&hellip;</span>';
        }
        const activo = p === this.currentPage ? ' activo' : '';
        const disabled = p === this.currentPage ? ' disabled' : '';
        return `<button class="pag-btn pag-num${activo}" data-page="${p}"${disabled}>${p}</button>`;
      }).join('');

      return `
        <nav class="paginacion" id="paginador" aria-label="Paginacion">
          <button class="pag-btn pag-prev" data-page="${this.currentPage - 1}" ${this.currentPage === 1 ? 'disabled' : ''}>
            <svg width="14" height="14" viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M10 3L5 8l5 5"/></svg>
            <span class="pag-btn-texto">Anterior</span>
          </button>
          <div class="pag-numeros">${numerosHTML}</div>
          <div class="pag-indicador">Pagina <strong>${this.currentPage}</strong> de <strong>${totalPages}</strong></div>
          <button class="pag-btn pag-next" data-page="${this.currentPage + 1}" ${this.currentPage === totalPages ? 'disabled' : ''}>
            <span class="pag-btn-texto">Siguiente</span>
            <svg width="14" height="14" viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M6 3l5 5-5 5"/></svg>
          </button>
        </nav>
      `;
    }

    setupListeners() {
      const paginador = document.getElementById('paginador');
      if (!paginador) return;
      paginador.addEventListener('click', (e) => {
        const btn = e.target.closest('.pag-btn');
        if (!btn || btn.disabled) return;
        const page = parseInt(btn.dataset.page);
        if (page && page > 0) this.goToPage(page);
      });
    }

    goToPage(page) {
      this.currentPage = page;
      if (this.activeTab && typeof this.activeTab.renderPropertiesPage === 'function') {
        this.activeTab.renderPropertiesPage();
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

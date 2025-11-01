/**
 * 🛠️ Mantenimientos Tab - Gestión de mantenimientos del sistema
 * Archivo: tabs/mantenimientos-tab/mantenimientos.js
 * Wrapper para el MaintenanceController existente
 */

class MantenimientosTab {
  constructor(app) {
    this.app = app;
    this.controller = null;
  }

  /**
   * Renderizar tab
   */
  async render() {
    console.log('🛠️ Renderizando tab de Mantenimientos...');

    // Crear instancia del controller si no existe
    if (!this.controller) {
      this.controller = new MaintenanceController(this.app);
    }

    return this.controller.render();
  }

  /**
   * Lifecycle hook: Después de renderizar
   */
  async afterRender() {
    console.log('🎨 MantenimientosTab afterRender');

    // Event listeners para las tarjetas de módulos
    const cards = document.querySelectorAll('.maintenance-card');
    cards.forEach(card => {
      const moduleName = card.getAttribute('data-module');
      const btn = card.querySelector('.btn-maintenance');

      if (btn) {
        // Reemplazar onclick inline con event listener
        btn.removeAttribute('onclick');
        btn.addEventListener('click', () => {
          if (this.controller) {
            this.controller.openModule(moduleName);
          }
        });
      }
    });

    console.log('✅ Mantenimientos Tab inicializado');
  }
}

// Exportar para uso en dashboard-app.js
if (typeof window !== 'undefined') {
  window.MantenimientosTab = MantenimientosTab;
}

/**
 * 📬 Subscripciones Tab - Alertas y notificaciones
 * Archivo: tabs/subscripciones/subscripciones.js
 * Líneas: ~70
 * EXTRAE: dashboard.js (líneas 1514-1529)
 * NOTA: Placeholder - funcionalidad pendiente de implementar
 */

class SubscripcionesTab {
  constructor(app) {
    this.app = app;
  }

  /**
   * Renderizar tab de Subscripciones
   */
  async render() {
    console.log('📬 Renderizando tab SUBSCRIPCIONES...');

    return `
      <h2 style="color: var(--azul-corporativo); margin-bottom: var(--spacing-xl);">
        📬 Subscripciones
      </h2>
      <div class="empty-state">
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"></path>
          <path d="M13.73 21a2 2 0 0 1-3.46 0"></path>
        </svg>
        <h3>Subscripciones y Alertas</h3>
        <p>Configura alertas para recibir notificaciones de nuevas propiedades.</p>
        <p style="color: var(--gris); font-size: 0.9rem; margin-top: var(--spacing-sm);">Próximamente disponible</p>
      </div>
    `;
  }

  /**
   * Setup después del render
   */
  async afterRender() {
    console.log('✅ SubscripcionesTab renderizado (placeholder)');
  }

  /**
   * Cleanup al salir del tab
   */
  async destroy() {
    console.log('🧹 Limpiando SubscripcionesTab...');
  }
}

// Exponer globalmente
window.SubscripcionesTab = SubscripcionesTab;

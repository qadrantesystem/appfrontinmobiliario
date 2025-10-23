/**
 * 👥 Usuarios Tab - Gestión de usuarios (Admin)
 * Archivo: tabs/usuarios/usuarios.js
 * Líneas: ~70
 * EXTRAE: dashboard.js (líneas 1549-1566)
 * NOTA: Placeholder - funcionalidad pendiente de implementar
 */

class UsuariosTab {
  constructor(app) {
    this.app = app;
  }

  /**
   * Renderizar tab de Usuarios
   */
  async render() {
    console.log('👥 Renderizando tab USUARIOS...');

    return `
      <h2 style="color: var(--azul-corporativo); margin-bottom: var(--spacing-xl);">
        👥 Gestión de Usuarios
      </h2>
      <div class="empty-state">
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path>
          <circle cx="9" cy="7" r="4"></circle>
          <path d="M23 21v-2a4 4 0 0 0-3-3.87"></path>
          <path d="M16 3.13a4 4 0 0 1 0 7.75"></path>
        </svg>
        <h3>Administración de Usuarios</h3>
        <p>Gestiona usuarios, perfiles y permisos del sistema.</p>
        <p style="color: var(--gris); font-size: 0.9rem; margin-top: var(--spacing-sm);">Próximamente disponible</p>
      </div>
    `;
  }

  /**
   * Setup después del render
   */
  async afterRender() {
    console.log('✅ UsuariosTab renderizado (placeholder)');
  }

  /**
   * Cleanup al salir del tab
   */
  async destroy() {
    console.log('🧹 Limpiando UsuariosTab...');
  }
}

// Exponer globalmente
window.UsuariosTab = UsuariosTab;

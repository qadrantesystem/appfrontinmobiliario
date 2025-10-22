/**
 * 🛠️ Maintenance Main Controller
 * Controlador principal para el módulo de mantenimientos
 */

class MaintenanceController {
  constructor(dashboard) {
    this.dashboard = dashboard;
    this.currentModule = null;

    // Módulos disponibles
    this.modules = {
      'property-types': null,
      'districts': null,
      'characteristics': null,
      'characteristics-by-type': null,
      'profiles': null,
      'plans': null
    };

    // Asignar a window para que funcionen los onclick
    window.maintenanceController = this;
  }

  /**
   * Renderizar vista principal de mantenimientos
   */
  render() {
    return `
      <div class="maintenance-container">
        <div class="tab-header">
          <h2>Mantenimientos del Sistema</h2>
          <p class="tab-subtitle">Gestiona las configuraciones y catálogos del sistema</p>
        </div>

        <div class="maintenance-grid">
          <!-- Tipos de Inmueble -->
          <div class="maintenance-card" data-module="property-types">
            <div class="maintenance-card-icon">
              <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"></path>
                <polyline points="9 22 9 12 15 12 15 22"></polyline>
              </svg>
            </div>
            <h3>Tipos de Inmuebles</h3>
            <p>Gestionar catálogo de tipos de propiedades</p>
            <button class="btn btn-maintenance" onclick="window.maintenanceController.openModule('property-types')">
              Administrar
            </button>
          </div>

          <!-- Distritos -->
          <div class="maintenance-card" data-module="districts">
            <div class="maintenance-card-icon">
              <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"></path>
                <circle cx="12" cy="10" r="3"></circle>
              </svg>
            </div>
            <h3>Distritos</h3>
            <p>Gestionar ubicaciones y zonas</p>
            <button class="btn btn-maintenance" onclick="window.maintenanceController.openModule('districts')">
              Administrar
            </button>
          </div>

          <!-- Características -->
          <div class="maintenance-card" data-module="characteristics">
            <div class="maintenance-card-icon">
              <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <polyline points="20 6 9 17 4 12"></polyline>
              </svg>
            </div>
            <h3>Características</h3>
            <p>Administrar características de propiedades</p>
            <button class="btn btn-maintenance" onclick="window.maintenanceController.openModule('characteristics')">
              Administrar
            </button>
          </div>

          <!-- Características por Tipo -->
          <div class="maintenance-card" data-module="characteristics-by-type">
            <div class="maintenance-card-icon">
              <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <circle cx="12" cy="12" r="10"></circle>
                <line x1="12" y1="8" x2="12" y2="16"></line>
                <line x1="8" y1="12" x2="16" y2="12"></line>
              </svg>
            </div>
            <h3>Características por Tipo</h3>
            <p>Configurar características dinámicas por tipo de inmueble</p>
            <button class="btn btn-maintenance" onclick="window.maintenanceController.openModule('characteristics-by-type')">
              Administrar
            </button>
          </div>

          <!-- Perfiles -->
          <div class="maintenance-card" data-module="profiles">
            <div class="maintenance-card-icon">
              <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path>
                <circle cx="9" cy="7" r="4"></circle>
                <path d="M23 21v-2a4 4 0 0 0-3-3.87"></path>
                <path d="M16 3.13a4 4 0 0 1 0 7.75"></path>
              </svg>
            </div>
            <h3>Perfiles de Usuario</h3>
            <p>Gestionar perfiles y permisos</p>
            <button class="btn btn-maintenance" onclick="window.maintenanceController.openModule('profiles')">
              Administrar
            </button>
          </div>

          <!-- Planes -->
          <div class="maintenance-card" data-module="plans">
            <div class="maintenance-card-icon">
              <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect>
                <path d="M7 11V7a5 5 0 0 1 10 0v4"></path>
              </svg>
            </div>
            <h3>Planes de Suscripción</h3>
            <p>Administrar planes y precios</p>
            <button class="btn btn-maintenance" onclick="window.maintenanceController.openModule('plans')">
              Administrar
            </button>
          </div>
        </div>

        <!-- Contenedor para módulos -->
        <div id="maintenanceModuleContainer"></div>
      </div>
    `;
  }

  /**
   * Abrir módulo específico
   */
  async openModule(moduleName) {
    console.log(`📂 Abriendo módulo: ${moduleName}`);

    const container = document.getElementById('maintenanceModuleContainer');
    if (!container) {
      console.error('❌ Contenedor de módulos no encontrado');
      return;
    }

    // Ocultar tarjetas y mostrar módulo
    const grid = document.querySelector('.maintenance-grid');
    if (grid) {
      grid.style.display = 'none';
    }

    // Mostrar loading
    container.innerHTML = `
      <div class="loading-state">
        <div class="spinner-large"></div>
        <p>Cargando módulo...</p>
      </div>
    `;

    try {
      let moduleContent = '';

      switch (moduleName) {
        case 'property-types':
          if (!this.modules['property-types']) {
            this.modules['property-types'] = new PropertyTypesModule(this);
          }
          moduleContent = await this.modules['property-types'].render();
          break;

        case 'districts':
          if (!this.modules['districts']) {
            this.modules['districts'] = new DistrictsModule(this);
          }
          moduleContent = await this.modules['districts'].render();
          break;

        case 'characteristics':
          if (!this.modules['characteristics']) {
            this.modules['characteristics'] = new CharacteristicsModule(this);
          }
          moduleContent = await this.modules['characteristics'].render();
          break;

        case 'characteristics-by-type':
          if (!this.modules['characteristics-by-type']) {
            this.modules['characteristics-by-type'] = new CharacteristicsByTypeModule(this);
          }
          moduleContent = await this.modules['characteristics-by-type'].render();
          break;

        case 'profiles':
          if (!this.modules['profiles']) {
            this.modules['profiles'] = new ProfilesModule(this);
          }
          moduleContent = await this.modules['profiles'].render();
          break;

        case 'plans':
          if (!this.modules['plans']) {
            this.modules['plans'] = new PlansModule(this);
          }
          moduleContent = await this.modules['plans'].render();
          break;

        default:
          moduleContent = `
            <div class="empty-state">
              <h3>Módulo no encontrado</h3>
              <p>El módulo "${moduleName}" no está disponible.</p>
            </div>
          `;
      }

      container.innerHTML = moduleContent;
      this.currentModule = moduleName;

      // Setup event listeners del módulo
      if (this.modules[moduleName] && this.modules[moduleName].setupEventListeners) {
        this.modules[moduleName].setupEventListeners();
      }

    } catch (error) {
      console.error('❌ Error cargando módulo:', error);
      container.innerHTML = `
        <div class="empty-state">
          <h3>Error al cargar módulo</h3>
          <p>${error.message}</p>
          <button class="btn btn-outline" onclick="window.maintenanceController.closeModule()">Volver</button>
        </div>
      `;
    }
  }

  /**
   * Cerrar módulo y volver a la vista principal
   */
  closeModule() {
    const container = document.getElementById('maintenanceModuleContainer');
    if (container) {
      container.innerHTML = '';
    }

    const grid = document.querySelector('.maintenance-grid');
    if (grid) {
      grid.style.display = 'grid';
    }

    this.currentModule = null;
    console.log('✅ Módulo cerrado');
  }
}

// Instancia global
let maintenanceController;

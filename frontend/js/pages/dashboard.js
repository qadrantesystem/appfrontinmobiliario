/**
 * 🎯 Dashboard Universal - Match Property
 * Sistema de tabs dinámico con data real según perfil de usuario
 */

class Dashboard {
  constructor() {
    // Elementos del DOM
    this.userName = document.getElementById('userName');
    this.userRole = document.getElementById('userRole');
    this.userAvatar = document.getElementById('userAvatar');
    this.avatarInitials = document.getElementById('avatarInitials');
    this.tabsList = document.getElementById('tabsList');
    this.tabContent = document.getElementById('tabContent');
    this.userMenuBtn = document.getElementById('userMenuBtn');
    this.userMenu = document.querySelector('.user-menu');
    this.logoutBtn = document.getElementById('logoutBtn');
    this.registrarLink = document.getElementById('registrarLink');

    // Usuario actual
    this.currentUser = null;
    this.currentTab = null;

    // Data cacheada del nuevo endpoint unificado
    this.dashboardStats = null;

    // Data cacheada legacy (deprecar)
    this.searchStats = null;
    this.favoriteStats = null;
    this.propertyStats = null;

    // Configuración de tabs por perfil
    this.tabsConfig = {
      1: [ // Demandante
        { id: 'dashboard', name: 'Dashboard', icon: this.getIcon('dashboard') },
        { id: 'favoritos', name: 'Favoritos', icon: this.getIcon('heart') },
        { id: 'historial', name: 'Historial', icon: this.getIcon('clock') }
      ],
      2: [ // Ofertante
        { id: 'dashboard', name: 'Dashboard', icon: this.getIcon('dashboard') },
        { id: 'propiedades', name: 'Mis Propiedades', icon: this.getIcon('building') },
        { id: 'favoritos', name: 'Favoritos', icon: this.getIcon('heart') },
        { id: 'perfil', name: 'Mi Perfil', icon: this.getIcon('user') }
      ],
      3: [ // Corredor - Placeholder
        { id: 'pipeline', name: 'Pipeline CRM', icon: this.getIcon('briefcase') },
        { id: 'leads', name: 'Mis Leads', icon: this.getIcon('users') },
        { id: 'cola', name: 'Cola de Atención', icon: this.getIcon('inbox') },
        { id: 'metricas', name: 'Métricas', icon: this.getIcon('chart') },
        { id: 'calendario', name: 'Calendario', icon: this.getIcon('calendar') }
      ],
      4: [ // Admin - Placeholder
        { id: 'super-dashboard', name: 'Super Dashboard', icon: this.getIcon('dashboard') },
        { id: 'usuarios', name: 'Usuarios', icon: this.getIcon('users') },
        { id: 'cola', name: 'Cola de Atención', icon: this.getIcon('inbox') },
        { id: 'configuracion', name: 'Configuración', icon: this.getIcon('settings') },
        { id: 'reportes', name: 'Reportes', icon: this.getIcon('file') }
      ]
    };

    this.init();
  }

  async init() {
    // Verificar autenticación
    if (!authService.isAuthenticated()) {
      console.log('❌ No autenticado, redirigiendo al login...');
      window.location.href = 'login.html';
      return;
    }

    // Obtener usuario actual
    await this.loadCurrentUser();

    // Setup UI
    this.setupUserMenu();
    this.setupLogout();
  }

  async loadCurrentUser() {
    try {
      console.log('📥 Obteniendo datos del usuario...');

      // Obtener usuario del storage primero (para mostrar rápido)
      const storedUser = authService.getCurrentUser();
      if (storedUser) {
        this.displayUserInfo(storedUser);
        this.loadTabs(storedUser.perfil_id);
      }

      // Luego obtener datos frescos del backend
      const freshUser = await authService.getMyProfile();
      this.currentUser = freshUser;

      console.log('✅ Usuario cargado:', freshUser);

      // Actualizar UI con datos frescos
      this.displayUserInfo(freshUser);
      this.loadTabs(freshUser.perfil_id);

      // Mostrar/ocultar "Registrar Propiedad" según perfil
      if (freshUser.perfil_id === 2 || freshUser.perfil_id === 4) {
        this.registrarLink.style.display = 'block';
      }

    } catch (error) {
      console.error('❌ Error cargando usuario:', error);
      showNotification('Error al cargar datos del usuario', 'error');

      // Si falla, intentar con datos del storage
      const storedUser = authService.getCurrentUser();
      if (storedUser) {
        this.displayUserInfo(storedUser);
        this.loadTabs(storedUser.perfil_id);
      } else {
        // Si no hay nada, volver al login
        setTimeout(() => {
          window.location.href = 'login.html';
        }, 2000);
      }
    }
  }

  displayUserInfo(user) {
    // Nombre completo
    const fullName = `${user.nombre} ${user.apellido}`;
    this.userName.textContent = fullName;

    // Rol/Perfil
    const perfilNames = {
      1: 'Demandante',
      2: 'Ofertante',
      3: 'Corredor',
      4: 'Administrador'
    };
    this.userRole.textContent = perfilNames[user.perfil_id] || 'Usuario';

    // Avatar
    this.generateAvatar(user);
  }

  generateAvatar(user) {
    // Si tiene foto de perfil, usarla
    if (user.foto_perfil) {
      const img = document.createElement('img');
      img.src = user.foto_perfil;
      img.alt = user.nombre;
      this.userAvatar.innerHTML = '';
      this.userAvatar.appendChild(img);
    } else {
      // Generar iniciales
      const initials = `${user.nombre.charAt(0)}${user.apellido.charAt(0)}`.toUpperCase();
      this.avatarInitials.textContent = initials;
    }
  }

  loadTabs(perfilId) {
    const tabs = this.tabsConfig[perfilId];

    if (!tabs) {
      console.error('❌ No hay configuración de tabs para perfil:', perfilId);
      return;
    }

    // Limpiar tabs anteriores
    this.tabsList.innerHTML = '';

    // Crear tabs
    tabs.forEach((tab, index) => {
      const tabBtn = document.createElement('button');
      tabBtn.className = 'tab-btn';
      tabBtn.dataset.tab = tab.id;
      tabBtn.innerHTML = `${tab.icon} <span>${tab.name}</span>`;

      // Primer tab activo por defecto
      if (index === 0) {
        tabBtn.classList.add('active');
        this.currentTab = tab.id;
        this.loadTabContent(tab.id, perfilId);
      }

      // Event listener
      tabBtn.addEventListener('click', () => {
        this.switchTab(tab.id, perfilId);
      });

      this.tabsList.appendChild(tabBtn);
    });

    console.log(`✅ ${tabs.length} tabs cargados para perfil ${perfilId}`);
  }

  switchTab(tabId, perfilId) {
    // Actualizar botón activo
    document.querySelectorAll('.tab-btn').forEach(btn => {
      btn.classList.remove('active');
    });
    document.querySelector(`[data-tab="${tabId}"]`).classList.add('active');

    // Cargar contenido
    this.currentTab = tabId;
    this.loadTabContent(tabId, perfilId);
  }

  async loadTabContent(tabId, perfilId) {
    console.log(`📄 Cargando contenido del tab: ${tabId}`);

    // Mostrar loading
    this.tabContent.innerHTML = `
      <div class="loading-state">
        <div class="spinner-large"></div>
        <p>Cargando contenido...</p>
      </div>
    `;

    try {
      // Cargar data según el tab
      let content = '';

      if (tabId === 'dashboard') {
        content = await this.getDashboardContent(perfilId);
      } else if (tabId === 'favoritos') {
        content = await this.getFavoritosContent();
      } else if (tabId === 'historial') {
        content = await this.getHistorialContent();
      } else if (tabId === 'propiedades') {
        content = await this.getPropiedadesContent();
      } else if (tabId === 'perfil') {
        content = this.getPerfilContent();
      } else {
        // Tabs no implementados (Corredor, Admin)
        content = this.getPlaceholderContent(tabId);
      }

      this.tabContent.innerHTML = content;

      // Setup event listeners después de renderizar
      this.setupTabEventListeners(tabId);

    } catch (error) {
      console.error('❌ Error cargando tab:', error);
      this.tabContent.innerHTML = `
        <div class="empty-state">
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"></path>
            <line x1="12" y1="9" x2="12" y2="13"></line>
            <line x1="12" y1="17" x2="12.01" y2="17"></line>
          </svg>
          <h3>Error al cargar contenido</h3>
          <p>Por favor, intenta nuevamente.</p>
        </div>
      `;
    }
  }

  async getDashboardContent(perfilId) {
    if (perfilId === 1) {
      // Dashboard Demandante
      return await this.getDemandanteDashboard();
    } else if (perfilId === 2) {
      // Dashboard Ofertante
      return await this.getOfertanteDashboard();
    } else {
      // Corredor o Admin - placeholder
      return this.getPlaceholderDashboard(perfilId);
    }
  }

  /**
   * 📊 Obtener estadísticas del dashboard usando el nuevo endpoint unificado
   * @param {number} anio - Año para filtrar (opcional)
   * @param {number} mes - Mes para filtrar (opcional, 1-12)
   * @param {number} usuarioId - ID del usuario (solo admin)
   * @param {number} perfilId - ID del perfil (solo admin)
   * @returns {Promise<Object>} Estadísticas completas del dashboard
   */
  async getDashboardStats(anio = null, mes = null, usuarioId = null, perfilId = null) {
    try {
      const token = authService.getToken();
      if (!token) {
        throw new Error('No hay sesión activa');
      }

      // Construir query params
      const params = new URLSearchParams();
      if (anio) params.append('anio', anio);
      if (mes) params.append('mes', mes);
      if (usuarioId) params.append('usuario_id', usuarioId);
      if (perfilId) params.append('perfil_id', perfilId);

      const queryString = params.toString();
      const url = `${API_CONFIG.BASE_URL}/dashboard/estadisticas${queryString ? '?' + queryString : ''}`;

      console.log('📊 Obteniendo estadísticas del dashboard:', url);

      const response = await fetch(url, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        throw new Error(`Error ${response.status}: ${response.statusText}`);
      }

      const result = await response.json();

      if (!result.success) {
        throw new Error(result.message || 'Error al obtener estadísticas');
      }

      this.dashboardStats = result.data;
      console.log('✅ Estadísticas obtenidas:', result.data);

      return result.data;

    } catch (error) {
      console.error('❌ Error obteniendo estadísticas del dashboard:', error);
      throw error;
    }
  }

  async getDemandanteDashboard() {
    try {
      // 📊 Obtener estadísticas del nuevo endpoint unificado
      const currentYear = new Date().getFullYear();
      const stats = await this.getDashboardStats(currentYear);

      // 🔍 DEBUG: Ver datos
      console.log('📊 Dashboard Demandante Stats:', stats);
      console.log('📊 Búsquedas:', stats.busquedas);
      console.log('📊 Favoritos:', stats.favoritos);

      return `
        <h2 style="color: var(--azul-corporativo); margin-bottom: var(--spacing-xl);">
          Dashboard - ${this.currentUser?.nombre || 'Usuario'}
        </h2>

        <!-- KPIs Grid -->
        <div class="kpis-grid">
          <!-- Búsquedas Realizadas -->
          <div class="kpi-card">
            <div class="kpi-header">
              <div class="kpi-icon">${this.getIcon('search')}</div>
              <span class="kpi-title">Búsquedas Realizadas</span>
            </div>
            <div class="kpi-value">${stats.resumen.total_busquedas}</div>
            <div class="kpi-subtitle">Este año ${currentYear}</div>
          </div>

          <!-- Favoritos -->
          <div class="kpi-card">
            <div class="kpi-header">
              <div class="kpi-icon">${this.getIcon('heart')}</div>
              <span class="kpi-title">Favoritos</span>
            </div>
            <div class="kpi-value">${stats.resumen.total_favoritos}</div>
            <div class="kpi-subtitle">Propiedades guardadas</div>
          </div>

          <!-- Tipos de Inmuebles -->
          <div class="kpi-card">
            <div class="kpi-header">
              <div class="kpi-icon">${this.getIcon('building')}</div>
              <span class="kpi-title">Tipos de Interés</span>
            </div>
            <div class="kpi-value">${Object.keys(stats.busquedas.por_tipo_inmueble || {}).length}</div>
            <div class="kpi-subtitle">Tipos de inmueble buscados</div>
          </div>

          <!-- Distritos -->
          <div class="kpi-card">
            <div class="kpi-header">
              <div class="kpi-icon">${this.getIcon('map')}</div>
              <span class="kpi-title">Distritos</span>
            </div>
            <div class="kpi-value">${Object.keys(stats.busquedas.por_distrito || {}).length}</div>
            <div class="kpi-subtitle">Distritos explorados</div>
          </div>
        </div>

        <!-- Gráfico: Búsquedas por Tipo de Inmueble -->
        ${stats.resumen.total_busquedas > 0 && Object.keys(stats.busquedas.por_tipo_inmueble || {}).length > 0 ? `
          <div style="margin-top: var(--spacing-xxl);">
            <h3 style="color: var(--azul-corporativo); margin-bottom: var(--spacing-lg);">
              🔍 Búsquedas por Tipo de Inmueble
            </h3>
            <div style="background: var(--blanco); border: 1px solid var(--borde); border-radius: var(--radius-lg); padding: var(--spacing-xl);">
              ${Object.entries(stats.busquedas.por_tipo_inmueble)
                .sort(([,a], [,b]) => b - a)
                .map(([tipo, cantidad]) => {
                  const maxCount = Math.max(...Object.values(stats.busquedas.por_tipo_inmueble));
                  const percentage = (cantidad / maxCount) * 100;
                  const colors = ['#0066CC', '#10b981', '#f59e0b', '#8b5cf6', '#ef4444', '#06b6d4'];
                  const colorIndex = Object.keys(stats.busquedas.por_tipo_inmueble).indexOf(tipo);
                  const barColor = colors[colorIndex % colors.length];

                  return `
                    <div style="margin-bottom: var(--spacing-lg);">
                      <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: var(--spacing-xs);">
                        <span style="font-weight: 600; color: var(--texto-oscuro);">${tipo}</span>
                        <span style="font-weight: 700; color: ${barColor}; font-size: 1.1rem;">${cantidad}</span>
                      </div>
                      <div style="background: var(--gris-claro); height: 24px; border-radius: 12px; overflow: hidden; position: relative;">
                        <div style="background: linear-gradient(90deg, ${barColor} 0%, ${barColor}dd 100%); width: ${percentage}%; height: 100%; border-radius: 12px; transition: width 0.6s ease; box-shadow: 0 2px 4px rgba(0,0,0,0.1);"></div>
                      </div>
                    </div>
                  `;
                }).join('')}
            </div>
          </div>
        ` : ''}

        <!-- Gráfico: Favoritos por Tipo de Inmueble -->
        ${stats.resumen.total_favoritos > 0 && Object.keys(stats.favoritos.por_tipo_inmueble || {}).length > 0 ? `
          <div style="margin-top: var(--spacing-xxl);">
            <h3 style="color: var(--azul-corporativo); margin-bottom: var(--spacing-lg);">
              ❤️ Favoritos por Tipo de Inmueble
            </h3>
            <div style="background: var(--blanco); border: 1px solid var(--borde); border-radius: var(--radius-lg); padding: var(--spacing-xl);">
              ${Object.entries(stats.favoritos.por_tipo_inmueble)
                .sort(([,a], [,b]) => b - a)
                .map(([tipo, cantidad]) => {
                  const maxCount = Math.max(...Object.values(stats.favoritos.por_tipo_inmueble));
                  const percentage = (cantidad / maxCount) * 100;
                  const colors = ['#0066CC', '#10b981', '#f59e0b', '#8b5cf6', '#ef4444', '#06b6d4'];
                  const colorIndex = Object.keys(stats.favoritos.por_tipo_inmueble).indexOf(tipo);
                  const barColor = colors[colorIndex % colors.length];

                  return `
                    <div style="margin-bottom: var(--spacing-lg);">
                      <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: var(--spacing-xs);">
                        <span style="font-weight: 600; color: var(--texto-oscuro);">${tipo}</span>
                        <span style="font-weight: 700; color: ${barColor}; font-size: 1.1rem;">${cantidad}</span>
                      </div>
                      <div style="background: var(--gris-claro); height: 24px; border-radius: 12px; overflow: hidden; position: relative;">
                        <div style="background: linear-gradient(90deg, ${barColor} 0%, ${barColor}dd 100%); width: ${percentage}%; height: 100%; border-radius: 12px; transition: width 0.6s ease; box-shadow: 0 2px 4px rgba(0,0,0,0.1);"></div>
                      </div>
                    </div>
                  `;
                }).join('')}

              <div style="margin-top: var(--spacing-xl); padding-top: var(--spacing-lg); border-top: 1px solid var(--borde); display: grid; grid-template-columns: repeat(auto-fit, minmax(150px, 1fr)); gap: var(--spacing-md); text-align: center;">
                <div>
                  <div style="font-size: 1.5rem; font-weight: 700; color: var(--azul-corporativo);">${stats.resumen.total_favoritos}</div>
                  <div style="font-size: 0.85rem; color: var(--gris-medio);">Total Favoritos</div>
                </div>
                <div>
                  <div style="font-size: 1.5rem; font-weight: 700; color: #8b5cf6;">${Object.keys(stats.favoritos.por_tipo_inmueble).length}</div>
                  <div style="font-size: 0.85rem; color: var(--gris-medio);">Tipos Diferentes</div>
                </div>
              </div>
            </div>
          </div>
        ` : ''}

        <!-- Gráfico: Búsquedas por Distrito -->
        ${stats.resumen.total_busquedas > 0 && Object.keys(stats.busquedas.por_distrito || {}).length > 0 ? `
          <div style="margin-top: var(--spacing-xxl);">
            <h3 style="color: var(--azul-corporativo); margin-bottom: var(--spacing-lg);">
              📍 Búsquedas por Distrito
            </h3>
            <div style="background: var(--blanco); border: 1px solid var(--borde); border-radius: var(--radius-lg); padding: var(--spacing-xl);">
              ${Object.entries(stats.busquedas.por_distrito)
                .sort(([,a], [,b]) => b - a)
                .map(([distrito, cantidad]) => {
                  const maxCount = Math.max(...Object.values(stats.busquedas.por_distrito));
                  const percentage = (cantidad / maxCount) * 100;
                  const colors = ['#0066CC', '#10b981', '#f59e0b', '#8b5cf6', '#ef4444', '#06b6d4', '#ec4899', '#14b8a6'];
                  const colorIndex = Object.keys(stats.busquedas.por_distrito).indexOf(distrito);
                  const barColor = colors[colorIndex % colors.length];

                  return `
                    <div style="margin-bottom: var(--spacing-lg);">
                      <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: var(--spacing-xs);">
                        <span style="font-weight: 600; color: var(--texto-oscuro);">${distrito}</span>
                        <span style="font-weight: 700; color: ${barColor}; font-size: 1.1rem;">${cantidad}</span>
                      </div>
                      <div style="background: var(--gris-claro); height: 24px; border-radius: 12px; overflow: hidden; position: relative;">
                        <div style="background: linear-gradient(90deg, ${barColor} 0%, ${barColor}dd 100%); width: ${percentage}%; height: 100%; border-radius: 12px; transition: width 0.6s ease; box-shadow: 0 2px 4px rgba(0,0,0,0.1);"></div>
                      </div>
                    </div>
                  `;
                }).join('')}
            </div>
          </div>
        ` : ''}

        <!-- Gráfico: Favoritos por Distrito -->
        ${stats.resumen.total_favoritos > 0 && Object.keys(stats.favoritos.por_distrito || {}).length > 0 ? `
          <div style="margin-top: var(--spacing-xxl);">
            <h3 style="color: var(--azul-corporativo); margin-bottom: var(--spacing-lg);">
              📍 Favoritos por Distrito
            </h3>
            <div style="background: var(--blanco); border: 1px solid var(--borde); border-radius: var(--radius-lg); padding: var(--spacing-xl);">
              ${Object.entries(stats.favoritos.por_distrito)
                .sort(([,a], [,b]) => b - a)
                .map(([distrito, cantidad]) => {
                  const maxCount = Math.max(...Object.values(stats.favoritos.por_distrito));
                  const percentage = (cantidad / maxCount) * 100;
                  const colors = ['#0066CC', '#10b981', '#f59e0b', '#8b5cf6', '#ef4444', '#06b6d4', '#ec4899', '#14b8a6'];
                  const colorIndex = Object.keys(stats.favoritos.por_distrito).indexOf(distrito);
                  const barColor = colors[colorIndex % colors.length];

                  return `
                    <div style="margin-bottom: var(--spacing-lg);">
                      <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: var(--spacing-xs);">
                        <span style="font-weight: 600; color: var(--texto-oscuro);">${distrito}</span>
                        <span style="font-weight: 700; color: ${barColor}; font-size: 1.1rem;">${cantidad}</span>
                      </div>
                      <div style="background: var(--gris-claro); height: 24px; border-radius: 12px; overflow: hidden; position: relative;">
                        <div style="background: linear-gradient(90deg, ${barColor} 0%, ${barColor}dd 100%); width: ${percentage}%; height: 100%; border-radius: 12px; transition: width 0.6s ease; box-shadow: 0 2px 4px rgba(0,0,0,0.1);"></div>
                      </div>
                    </div>
                  `;
                }).join('')}
            </div>
          </div>
        ` : ''}

        <!-- CTA Section -->
        ${stats.resumen.total_busquedas === 0 && stats.resumen.total_favoritos === 0 ? `
          <div class="empty-state" style="margin-top: var(--spacing-xxl);">
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="width: 60px; height: 60px; opacity: 0.2;">
              <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"></path>
            </svg>
            <h3>Comienza a explorar</h3>
            <p>Busca propiedades y agrégalas a favoritos para ver estadísticas aquí.</p>
            <a href="busqueda.html" class="btn btn-primary" style="margin-top: var(--spacing-md);">
              Buscar Propiedades
            </a>
          </div>
        ` : ''}
      `;
    } catch (error) {
      console.error('❌ Error cargando dashboard demandante:', error);
      throw error;
    }
  }

  async getOfertanteDashboard() {
    try {
      // 📊 Obtener estadísticas del nuevo endpoint unificado
      const currentYear = new Date().getFullYear();
      const stats = await this.getDashboardStats(currentYear);

      // 🔍 DEBUG: Ver datos
      console.log('📊 Dashboard Ofertante Stats:', stats);
      console.log('📊 Propiedades:', stats.propiedades);
      console.log('📊 Estado CRM:', stats.propiedades?.por_estado_crm);

      return `
        <h2 style="color: var(--azul-corporativo); margin-bottom: var(--spacing-xl);">
          Dashboard - ${this.currentUser?.nombre || 'Usuario'}
        </h2>

        <!-- KPIs Grid -->
        <div class="kpis-grid">
          <!-- Total Propiedades -->
          <div class="kpi-card">
            <div class="kpi-header">
              <div class="kpi-icon">${this.getIcon('building')}</div>
              <span class="kpi-title">Total Propiedades</span>
            </div>
            <div class="kpi-value">${stats.resumen.total_propiedades}</div>
            <div class="kpi-subtitle">${stats.resumen.propiedades_publicadas} publicadas</div>
          </div>

          <!-- Total Vistas -->
          <div class="kpi-card">
            <div class="kpi-header">
              <div class="kpi-icon">${this.getIcon('chart')}</div>
              <span class="kpi-title">Total Vistas</span>
            </div>
            <div class="kpi-value">${stats.resumen.total_vistas}</div>
            <div class="kpi-subtitle">En todas tus propiedades</div>
          </div>

          <!-- Total Contactos -->
          <div class="kpi-card">
            <div class="kpi-header">
              <div class="kpi-icon">${this.getIcon('users')}</div>
              <span class="kpi-title">Total Contactos</span>
            </div>
            <div class="kpi-value">${stats.resumen.total_contactos}</div>
            <div class="kpi-subtitle">Interesados en tus propiedades</div>
          </div>

          <!-- Conversión CRM -->
          <div class="kpi-card">
            <div class="kpi-header">
              <div class="kpi-icon">${this.getIcon('briefcase')}</div>
              <span class="kpi-title">Cerrados Ganados</span>
            </div>
            <div class="kpi-value">${stats.resumen.propiedades_cerrado_ganado || 0}</div>
            <div class="kpi-subtitle">De ${stats.resumen.total_propiedades} propiedades</div>
          </div>
        </div>

        <!-- Pipeline CRM -->
        ${stats.resumen.total_propiedades > 0 ? `
          <div style="margin-top: var(--spacing-xxl);">
            <h3 style="color: var(--azul-corporativo); margin-bottom: var(--spacing-lg);">
              📊 Pipeline CRM
            </h3>
            <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(180px, 1fr)); gap: var(--spacing-md);">
              <div style="background: linear-gradient(135deg, #0066CC 0%, #0052a3 100%); color: white; padding: var(--spacing-lg); border-radius: var(--radius-lg); text-align: center;">
                <div style="font-size: 2rem; font-weight: 700;">${stats.propiedades.por_estado_crm?.lead || 0}</div>
                <div style="opacity: 0.9; font-size: 0.9rem;">Lead</div>
              </div>
              <div style="background: linear-gradient(135deg, #10b981 0%, #059669 100%); color: white; padding: var(--spacing-lg); border-radius: var(--radius-lg); text-align: center;">
                <div style="font-size: 2rem; font-weight: 700;">${stats.propiedades.por_estado_crm?.contacto || 0}</div>
                <div style="opacity: 0.9; font-size: 0.9rem;">Contacto</div>
              </div>
              <div style="background: linear-gradient(135deg, #f59e0b 0%, #d97706 100%); color: white; padding: var(--spacing-lg); border-radius: var(--radius-lg); text-align: center;">
                <div style="font-size: 2rem; font-weight: 700;">${stats.propiedades.por_estado_crm?.propuesta || 0}</div>
                <div style="opacity: 0.9; font-size: 0.9rem;">Propuesta</div>
              </div>
              <div style="background: linear-gradient(135deg, #8b5cf6 0%, #7c3aed 100%); color: white; padding: var(--spacing-lg); border-radius: var(--radius-lg); text-align: center;">
                <div style="font-size: 2rem; font-weight: 700;">${stats.propiedades.por_estado_crm?.negociacion || 0}</div>
                <div style="opacity: 0.9; font-size: 0.9rem;">Negociación</div>
              </div>
              <div style="background: linear-gradient(135deg, #6366f1 0%, #4f46e5 100%); color: white; padding: var(--spacing-lg); border-radius: var(--radius-lg); text-align: center;">
                <div style="font-size: 2rem; font-weight: 700;">${stats.propiedades.por_estado_crm?.pre_cierre || 0}</div>
                <div style="opacity: 0.9; font-size: 0.9rem;">Pre-Cierre</div>
              </div>
              <div style="background: linear-gradient(135deg, #22c55e 0%, #16a34a 100%); color: white; padding: var(--spacing-lg); border-radius: var(--radius-lg); text-align: center;">
                <div style="font-size: 2rem; font-weight: 700;">${stats.propiedades.por_estado_crm?.cerrado_ganado || 0}</div>
                <div style="opacity: 0.9; font-size: 0.9rem;">Cerrado Ganado</div>
              </div>
              <div style="background: linear-gradient(135deg, #ef4444 0%, #dc2626 100%); color: white; padding: var(--spacing-lg); border-radius: var(--radius-lg); text-align: center;">
                <div style="font-size: 2rem; font-weight: 700;">${stats.propiedades.por_estado_crm?.cerrado_perdido || 0}</div>
                <div style="opacity: 0.9; font-size: 0.9rem;">Cerrado Perdido</div>
              </div>
            </div>
          </div>

          <!-- Propiedades por Estado -->
          <div style="margin-top: var(--spacing-xxl);">
            <h3 style="color: var(--azul-corporativo); margin-bottom: var(--spacing-lg);">
              Propiedades por Estado
            </h3>
            <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: var(--spacing-md);">
              <div style="background: linear-gradient(135deg, #10b981 0%, #059669 100%); color: white; padding: var(--spacing-lg); border-radius: var(--radius-lg); text-align: center;">
                <div style="font-size: 2rem; font-weight: 700;">${stats.propiedades.por_estado?.publicado || 0}</div>
                <div style="opacity: 0.9;">Publicadas</div>
              </div>
              <div style="background: linear-gradient(135deg, #f59e0b 0%, #d97706 100%); color: white; padding: var(--spacing-lg); border-radius: var(--radius-lg); text-align: center;">
                <div style="font-size: 2rem; font-weight: 700;">${stats.propiedades.por_estado?.borrador || 0}</div>
                <div style="opacity: 0.9;">Borradores</div>
              </div>
              <div style="background: linear-gradient(135deg, #6366f1 0%, #4f46e5 100%); color: white; padding: var(--spacing-lg); border-radius: var(--radius-lg); text-align: center;">
                <div style="font-size: 2rem; font-weight: 700;">${stats.propiedades.por_estado?.pausado || 0}</div>
                <div style="opacity: 0.9;">Pausadas</div>
              </div>
              <div style="background: linear-gradient(135deg, #8b5cf6 0%, #7c3aed 100%); color: white; padding: var(--spacing-lg); border-radius: var(--radius-lg); text-align: center;">
                <div style="font-size: 2rem; font-weight: 700;">${stats.propiedades.por_estado?.vendido || 0}</div>
                <div style="opacity: 0.9;">Vendidas</div>
              </div>
            </div>
          </div>

          <!-- Gráfico: Propiedades por Tipo -->
          ${Object.keys(stats.propiedades.por_tipo_inmueble || {}).length > 0 ? `
            <div style="margin-top: var(--spacing-xxl);">
              <h3 style="color: var(--azul-corporativo); margin-bottom: var(--spacing-lg);">
                🏢 Propiedades por Tipo de Inmueble
              </h3>
              <div style="background: var(--blanco); border: 1px solid var(--borde); border-radius: var(--radius-lg); padding: var(--spacing-xl);">
                ${Object.entries(stats.propiedades.por_tipo_inmueble)
                  .sort(([,a], [,b]) => b - a)
                  .map(([tipo, cantidad]) => {
                    const maxCount = Math.max(...Object.values(stats.propiedades.por_tipo_inmueble));
                    const percentage = (cantidad / maxCount) * 100;
                    const colors = ['#0066CC', '#10b981', '#f59e0b', '#8b5cf6', '#ef4444', '#06b6d4'];
                    const colorIndex = Object.keys(stats.propiedades.por_tipo_inmueble).indexOf(tipo);
                    const barColor = colors[colorIndex % colors.length];

                    return `
                      <div style="margin-bottom: var(--spacing-lg);">
                        <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: var(--spacing-xs);">
                          <span style="font-weight: 600; color: var(--texto-oscuro);">${tipo}</span>
                          <span style="font-weight: 700; color: ${barColor}; font-size: 1.1rem;">${cantidad}</span>
                        </div>
                        <div style="background: var(--gris-claro); height: 24px; border-radius: 12px; overflow: hidden; position: relative;">
                          <div style="background: linear-gradient(90deg, ${barColor} 0%, ${barColor}dd 100%); width: ${percentage}%; height: 100%; border-radius: 12px; transition: width 0.6s ease; box-shadow: 0 2px 4px rgba(0,0,0,0.1);"></div>
                        </div>
                      </div>
                    `;
                  }).join('')}
              </div>
            </div>
          ` : ''}

          <!-- Gráfico: Propiedades por Distrito -->
          ${Object.keys(stats.propiedades.por_distrito || {}).length > 0 ? `
            <div style="margin-top: var(--spacing-xxl);">
              <h3 style="color: var(--azul-corporativo); margin-bottom: var(--spacing-lg);">
                📍 Propiedades por Distrito
              </h3>
              <div style="background: var(--blanco); border: 1px solid var(--borde); border-radius: var(--radius-lg); padding: var(--spacing-xl);">
                ${Object.entries(stats.propiedades.por_distrito)
                  .sort(([,a], [,b]) => b - a)
                  .map(([distrito, cantidad]) => {
                    const maxCount = Math.max(...Object.values(stats.propiedades.por_distrito));
                    const percentage = (cantidad / maxCount) * 100;
                    const colors = ['#0066CC', '#10b981', '#f59e0b', '#8b5cf6', '#ef4444', '#06b6d4', '#ec4899', '#14b8a6'];
                    const colorIndex = Object.keys(stats.propiedades.por_distrito).indexOf(distrito);
                    const barColor = colors[colorIndex % colors.length];

                    return `
                      <div style="margin-bottom: var(--spacing-lg);">
                        <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: var(--spacing-xs);">
                          <span style="font-weight: 600; color: var(--texto-oscuro);">${distrito}</span>
                          <span style="font-weight: 700; color: ${barColor}; font-size: 1.1rem;">${cantidad}</span>
                        </div>
                        <div style="background: var(--gris-claro); height: 24px; border-radius: 12px; overflow: hidden; position: relative;">
                          <div style="background: linear-gradient(90deg, ${barColor} 0%, ${barColor}dd 100%); width: ${percentage}%; height: 100%; border-radius: 12px; transition: width 0.6s ease; box-shadow: 0 2px 4px rgba(0,0,0,0.1);"></div>
                        </div>
                      </div>
                    `;
                  }).join('')}
              </div>
            </div>
          ` : ''}
        ` : `
          <div class="empty-state" style="margin-top: var(--spacing-xxl);">
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="width: 60px; height: 60px; opacity: 0.2;">
              <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"></path>
              <polyline points="9 22 9 12 15 12 15 22"></polyline>
            </svg>
            <h3>Comienza a publicar</h3>
            <p>Registra tu primera propiedad y comienza a recibir contactos.</p>
            <a href="registro-propiedad.html" class="btn btn-primary" style="margin-top: var(--spacing-md);">
              Registrar Propiedad
            </a>
          </div>
        `}
      `;
    } catch (error) {
      console.error('❌ Error cargando dashboard ofertante:', error);
      throw error;
    }
  }

  async getFavoritosContent() {
    try {
      const favoriteStats = await favoritesService.getFavoriteStats();
      const favoritesList = favoriteStats.favoritesList || [];

      console.log('📋 DEBUG getFavoritosContent - favoritesList:', favoritesList);

      if (!favoritesList || favoritesList.length === 0) {
        return `
          <h2 style="color: var(--azul-corporativo); margin-bottom: var(--spacing-xl);">
            Mis Favoritos
          </h2>
          <div class="empty-state">
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"></path>
            </svg>
            <h3>No tienes favoritos aún</h3>
            <p>Las propiedades que marques como favoritas aparecerán aquí.</p>
            <a href="busqueda.html" class="btn btn-primary" style="margin-top: var(--spacing-lg);">
              Buscar Propiedades
            </a>
          </div>
        `;
      }

      // Construir tabla de favoritos
      const favoritesRows = favoritesList.map(fav => {
        const propiedad = fav.propiedad || {};
        const precio = propiedad.precio ? `S/ ${propiedad.precio.toLocaleString('es-PE')}` : 'Precio no disponible';
        const tipo = propiedad.tipo_inmueble?.nombre || 'N/A';
        const distrito = propiedad.distrito?.nombre || 'N/A';
        const fecha = new Date(fav.fecha_agregado).toLocaleDateString('es-PE');

        return `
          <tr>
            <td>
              <div style="display: flex; align-items: center; gap: var(--spacing-md);">
                ${propiedad.imagen_principal ? `
                  <img src="${propiedad.imagen_principal}" alt="${propiedad.titulo}"
                       style="width: 80px; height: 60px; object-fit: cover; border-radius: var(--radius-md);">
                ` : `
                  <div style="width: 80px; height: 60px; background: var(--gris-claro); border-radius: var(--radius-md); display: flex; align-items: center; justify-content: center;">
                    ${this.getIcon('building')}
                  </div>
                `}
                <div>
                  <strong>${propiedad.titulo || 'Sin título'}</strong>
                  <div style="font-size: 0.85rem; color: var(--gris-medio);">${tipo} - ${distrito}</div>
                </div>
              </div>
            </td>
            <td style="font-weight: 600; color: var(--azul-corporativo);">${precio}</td>
            <td style="color: var(--gris-medio); font-size: 0.9rem;">${fecha}</td>
            <td style="text-align: right;">
              <button class="btn btn-secondary" style="padding: var(--spacing-xs) var(--spacing-sm); font-size: 0.85rem;"
                      data-property-id="${propiedad.id}">
                Ver Detalle
              </button>
              <button class="btn btn-danger" style="padding: var(--spacing-xs) var(--spacing-sm); font-size: 0.85rem; background: #ef4444; border: none; margin-left: var(--spacing-xs);"
                      data-remove-favorite="${fav.id}">
                ${this.getIcon('heart')}
              </button>
            </td>
          </tr>
        `;
      }).join('');

      return `
        <h2 style="color: var(--azul-corporativo); margin-bottom: var(--spacing-md);">
          Mis Favoritos (${favoritesList.length})
        </h2>
        <p style="color: var(--gris-medio); margin-bottom: var(--spacing-xl);">
          Precio promedio: S/ ${favoriteStats.avgPrice.toLocaleString('es-PE')}
        </p>

        <div style="overflow-x: auto;">
          <table style="width: 100%; border-collapse: collapse; background: var(--blanco); border-radius: var(--radius-lg); overflow: hidden;">
            <thead style="background: var(--gris-claro);">
              <tr>
                <th style="padding: var(--spacing-md); text-align: left; font-weight: 600;">Propiedad</th>
                <th style="padding: var(--spacing-md); text-align: left; font-weight: 600;">Precio</th>
                <th style="padding: var(--spacing-md); text-align: left; font-weight: 600;">Agregado</th>
                <th style="padding: var(--spacing-md); text-align: right; font-weight: 600;">Acciones</th>
              </tr>
            </thead>
            <tbody>
              ${favoritesRows}
            </tbody>
          </table>
        </div>
      `;
    } catch (error) {
      console.error('❌ Error cargando favoritos:', error);
      throw error;
    }
  }

  async getHistorialContent() {
    try {
      const mySearches = await searchService.getMySearches();
      const searchesList = mySearches.data?.busquedas || [];

      if (searchesList.length === 0) {
        return `
          <h2 style="color: var(--azul-corporativo); margin-bottom: var(--spacing-xl);">
            Historial de Búsquedas
          </h2>
          <div class="empty-state">
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <circle cx="12" cy="12" r="10"></circle>
              <polyline points="12 6 12 12 16 14"></polyline>
            </svg>
            <h3>No tienes búsquedas recientes</h3>
            <p>Tu historial de búsquedas aparecerá aquí.</p>
            <a href="busqueda.html" class="btn btn-primary" style="margin-top: var(--spacing-lg);">
              Realizar una Búsqueda
            </a>
          </div>
        `;
      }

      // Construir tabla de búsquedas
      const searchesRows = searchesList.map(search => {
        const fecha = new Date(search.fecha_busqueda).toLocaleDateString('es-PE', {
          year: 'numeric',
          month: 'short',
          day: 'numeric',
          hour: '2-digit',
          minute: '2-digit'
        });

        const filtros = search.filtros_json ? JSON.parse(search.filtros_json) : {};
        const tipo = filtros.tipo_inmueble || 'Todos';
        const distrito = filtros.distrito || 'Todos';
        const precioRange = filtros.precio_min || filtros.precio_max
          ? `S/ ${filtros.precio_min || 0} - ${filtros.precio_max || '∞'}`
          : 'Sin filtro';

        return `
          <tr>
            <td style="padding: var(--spacing-md);">${fecha}</td>
            <td style="padding: var(--spacing-md);">${tipo}</td>
            <td style="padding: var(--spacing-md);">${distrito}</td>
            <td style="padding: var(--spacing-md); color: var(--gris-medio);">${precioRange}</td>
            <td style="padding: var(--spacing-md); text-align: center; color: var(--azul-corporativo); font-weight: 600;">
              ${search.resultados_count || 0}
            </td>
            <td style="padding: var(--spacing-md); text-align: right;">
              <button class="btn btn-secondary" style="padding: var(--spacing-xs) var(--spacing-sm); font-size: 0.85rem;">
                Repetir Búsqueda
              </button>
            </td>
          </tr>
        `;
      }).join('');

      return `
        <h2 style="color: var(--azul-corporativo); margin-bottom: var(--spacing-md);">
          Historial de Búsquedas
        </h2>
        <p style="color: var(--gris-medio); margin-bottom: var(--spacing-xl);">
          ${searchesList.length} búsquedas realizadas
        </p>

        <div style="overflow-x: auto;">
          <table style="width: 100%; border-collapse: collapse; background: var(--blanco); border-radius: var(--radius-lg); overflow: hidden;">
            <thead style="background: var(--gris-claro);">
              <tr>
                <th style="padding: var(--spacing-md); text-align: left; font-weight: 600;">Fecha</th>
                <th style="padding: var(--spacing-md); text-align: left; font-weight: 600;">Tipo</th>
                <th style="padding: var(--spacing-md); text-align: left; font-weight: 600;">Distrito</th>
                <th style="padding: var(--spacing-md); text-align: left; font-weight: 600;">Rango de Precio</th>
                <th style="padding: var(--spacing-md); text-align: center; font-weight: 600;">Resultados</th>
                <th style="padding: var(--spacing-md); text-align: right; font-weight: 600;">Acciones</th>
              </tr>
            </thead>
            <tbody>
              ${searchesRows}
            </tbody>
          </table>
        </div>
      `;
    } catch (error) {
      console.error('❌ Error cargando historial:', error);
      throw error;
    }
  }

  async getPropiedadesContent() {
    try {
      const propertyStats = await propertiesService.getPropertyStats(5);
      const propertiesList = propertyStats.propertiesList;

      // Header con botón de registro
      let content = `
        <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: var(--spacing-xl);">
          <h2 style="color: var(--azul-corporativo); margin: 0;">
            Mis Propiedades (${propertyStats.totalPublished}/${propertyStats.planLimit})
          </h2>
          <a href="registro-propiedad.html" class="btn btn-primary">
            + Registrar Nueva Propiedad
          </a>
        </div>
      `;

      if (propertiesList.length === 0) {
        content += `
          <div class="empty-state">
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"></path>
              <polyline points="9 22 9 12 15 12 15 22"></polyline>
            </svg>
            <h3>No tienes propiedades registradas</h3>
            <p>Comienza registrando tu primera propiedad.</p>
          </div>
        `;
        return content;
      }

      // Grid de propiedades
      const propertiesCards = propertiesList.map(prop => {
        const precio = prop.precio ? `S/ ${prop.precio.toLocaleString('es-PE')}` : 'Consultar';
        const tipo = prop.tipo_inmueble?.nombre || 'N/A';
        const distrito = prop.distrito?.nombre || 'N/A';
        const estadoColor = {
          'publicado': '#10b981',
          'borrador': '#f59e0b',
          'pausado': '#6366f1',
          'vendido': '#8b5cf6'
        }[prop.estado] || '#6b7280';

        return `
          <div class="kpi-card" style="padding: 0; overflow: hidden;">
            ${prop.imagen_principal ? `
              <img src="${prop.imagen_principal}" alt="${prop.titulo}"
                   style="width: 100%; height: 200px; object-fit: cover;">
            ` : `
              <div style="width: 100%; height: 200px; background: var(--gris-claro); display: flex; align-items: center; justify-content: center;">
                ${this.getIcon('building')}
              </div>
            `}
            <div style="padding: var(--spacing-md);">
              <div style="display: inline-block; background: ${estadoColor}; color: white; padding: 2px 8px; border-radius: 4px; font-size: 0.75rem; margin-bottom: var(--spacing-sm);">
                ${prop.estado?.toUpperCase() || 'BORRADOR'}
              </div>
              <h3 style="color: var(--azul-corporativo); margin-bottom: var(--spacing-xs); font-size: 1.1rem;">
                ${prop.titulo || 'Sin título'}
              </h3>
              <p style="color: var(--gris-medio); font-size: 0.9rem; margin-bottom: var(--spacing-sm);">
                ${tipo} - ${distrito}
              </p>
              <div style="font-size: 1.3rem; font-weight: 700; color: var(--azul-corporativo); margin-bottom: var(--spacing-md);">
                ${precio}
              </div>
              <div style="display: flex; gap: var(--spacing-xs); font-size: 0.85rem; color: var(--gris-medio); margin-bottom: var(--spacing-md);">
                <span>${this.getIcon('chart')} ${prop.vistas || 0} vistas</span>
                <span style="margin-left: var(--spacing-sm);">${this.getIcon('users')} ${prop.contactos || 0} contactos</span>
              </div>
              <div style="display: flex; gap: var(--spacing-xs);">
                <button class="btn btn-secondary" style="flex: 1; padding: var(--spacing-xs); font-size: 0.85rem;" data-edit-property="${prop.id}">
                  Editar
                </button>
                <button class="btn btn-primary" style="flex: 1; padding: var(--spacing-xs); font-size: 0.85rem;" data-view-property="${prop.id}">
                  Ver
                </button>
              </div>
            </div>
          </div>
        `;
      }).join('');

      content += `
        <div style="display: grid; grid-template-columns: repeat(auto-fill, minmax(300px, 1fr)); gap: var(--spacing-lg);">
          ${propertiesCards}
        </div>
      `;

      return content;
    } catch (error) {
      console.error('❌ Error cargando propiedades:', error);
      throw error;
    }
  }

  getPerfilContent() {
    if (!this.currentUser) return '';

    return `
      <h2 style="color: var(--azul-corporativo); margin-bottom: var(--spacing-xl);">
        Mi Perfil
      </h2>
      <div style="max-width: 600px;">
        <div style="background: var(--gris-claro); padding: var(--spacing-lg); border-radius: var(--radius-lg); margin-bottom: var(--spacing-xl);">
          <h3 style="margin-bottom: var(--spacing-md);">Información Personal</h3>
          <p><strong>Nombre:</strong> ${this.currentUser.nombre} ${this.currentUser.apellido}</p>
          <p><strong>Email:</strong> ${this.currentUser.email}</p>
          <p><strong>Teléfono:</strong> ${this.currentUser.telefono || 'No registrado'}</p>
          <p><strong>DNI:</strong> ${this.currentUser.dni || 'No registrado'}</p>
        </div>

        <button class="btn btn-primary">Editar Perfil</button>
        <button class="btn btn-secondary" style="margin-left: var(--spacing-sm);">Cambiar Contraseña</button>
      </div>
    `;
  }

  getPlaceholderContent(tabId) {
    const titles = {
      'pipeline': 'Pipeline CRM',
      'leads': 'Mis Leads',
      'cola': 'Cola de Atención',
      'metricas': 'Métricas',
      'calendario': 'Calendario',
      'super-dashboard': 'Super Dashboard',
      'usuarios': 'Gestión de Usuarios',
      'configuracion': 'Configuración',
      'reportes': 'Reportes'
    };

    return `
      <h2 style="color: var(--azul-corporativo); margin-bottom: var(--spacing-xl);">
        ${titles[tabId] || 'Contenido'}
      </h2>
      <div class="empty-state">
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <path d="M12 2v20M2 12h20"></path>
        </svg>
        <h3>Funcionalidad en desarrollo</h3>
        <p>Esta sección estará disponible próximamente.</p>
      </div>
    `;
  }

  getPlaceholderDashboard(perfilId) {
    const perfilNames = { 3: 'Corredor', 4: 'Administrador' };
    return `
      <h2 style="color: var(--azul-corporativo); margin-bottom: var(--spacing-xl);">
        Dashboard ${perfilNames[perfilId] || 'Usuario'}
      </h2>
      <div class="empty-state">
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <rect x="3" y="3" width="7" height="7"></rect>
          <rect x="14" y="3" width="7" height="7"></rect>
          <rect x="14" y="14" width="7" height="7"></rect>
          <rect x="3" y="14" width="7" height="7"></rect>
        </svg>
        <h3>Dashboard en desarrollo</h3>
        <p>Las métricas y gráficos para este perfil estarán disponibles próximamente.</p>
      </div>
    `;
  }

  setupTabEventListeners(tabId) {
    // Event listeners para links internos de tabs
    document.querySelectorAll('[data-tab-link]').forEach(link => {
      link.addEventListener('click', (e) => {
        e.preventDefault();
        const targetTab = e.currentTarget.dataset.tabLink;
        this.switchTab(targetTab, this.currentUser.perfil_id);
      });
    });

    // Event listeners específicos por tab
    if (tabId === 'favoritos') {
      // Eliminar favorito
      document.querySelectorAll('[data-remove-favorite]').forEach(btn => {
        btn.addEventListener('click', async (e) => {
          const favoritoId = e.currentTarget.dataset.removeFavorite;
          if (confirm('¿Eliminar de favoritos?')) {
            try {
              await favoritesService.removeFavorite(favoritoId);
              showNotification('Eliminado de favoritos', 'success');
              this.loadTabContent('favoritos', this.currentUser.perfil_id);
            } catch (error) {
              showNotification('Error al eliminar', 'error');
            }
          }
        });
      });
    }
  }

  setupUserMenu() {
    // Toggle dropdown
    this.userMenuBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      this.userMenu.classList.toggle('active');
    });

    // Cerrar al hacer click fuera
    document.addEventListener('click', (e) => {
      if (!this.userMenu.contains(e.target)) {
        this.userMenu.classList.remove('active');
      }
    });
  }

  setupLogout() {
    this.logoutBtn.addEventListener('click', (e) => {
      e.preventDefault();

      if (confirm('¿Estás seguro que deseas cerrar sesión?')) {
        authService.logout();
      }
    });
  }

  getIcon(type) {
    const icons = {
      'dashboard': '<svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="3" width="7" height="7"></rect><rect x="14" y="3" width="7" height="7"></rect><rect x="14" y="14" width="7" height="7"></rect><rect x="3" y="14" width="7" height="7"></rect></svg>',
      'heart': '<svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"></path></svg>',
      'clock': '<svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"></circle><polyline points="12 6 12 12 16 14"></polyline></svg>',
      'user': '<svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path><circle cx="12" cy="7" r="4"></circle></svg>',
      'building': '<svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"></path><polyline points="9 22 9 12 15 12 15 22"></polyline></svg>',
      'briefcase': '<svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="2" y="7" width="20" height="14" rx="2" ry="2"></rect><path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16"></path></svg>',
      'users': '<svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path><circle cx="9" cy="7" r="4"></circle><path d="M23 21v-2a4 4 0 0 0-3-3.87"></path><path d="M16 3.13a4 4 0 0 1 0 7.75"></path></svg>',
      'inbox': '<svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="22 12 16 12 14 15 10 15 8 12 2 12"></polyline><path d="M5.45 5.11L2 12v6a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2v-6l-3.45-6.89A2 2 0 0 0 16.76 4H7.24a2 2 0 0 0-1.79 1.11z"></path></svg>',
      'chart': '<svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="12" y1="20" x2="12" y2="10"></line><line x1="18" y1="20" x2="18" y2="4"></line><line x1="6" y1="20" x2="6" y2="16"></line></svg>',
      'calendar': '<svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect><line x1="16" y1="2" x2="16" y2="6"></line><line x1="8" y1="2" x2="8" y2="6"></line><line x1="3" y1="10" x2="21" y2="10"></line></svg>',
      'settings': '<svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="3"></circle><path d="M12 1v6m0 6v6m6-10.5l-6 3m0 3l-6 3m7.5-12l-3 6m-3 0l-3-6"></path></svg>',
      'file': '<svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path><polyline points="14 2 14 8 20 8"></polyline></svg>',
      'search': '<svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="11" cy="11" r="8"></circle><path d="m21 21-4.35-4.35"></path></svg>',
      'bookmark': '<svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="m19 21-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2v16z"></path></svg>',
      'map': '<svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"></path><circle cx="12" cy="10" r="3"></circle></svg>'
    };
    return icons[type] || '';
  }
}

// Inicializar cuando el DOM esté listo
document.addEventListener('DOMContentLoaded', () => {
  new Dashboard();
});

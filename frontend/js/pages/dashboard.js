/**
 * 🎯 Dashboard Universal - Quadrante
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

    // Usuario actual
    this.currentUser = null;
    this.currentTab = null;

    // Data cacheada del nuevo endpoint unificado
    this.dashboardStats = null;
    this.propertyStats = null;
    this.allProperties = [];
    this.currentPage = 1;

    // Inicializar módulos
    this.filters = new DashboardFilters(this);
    this.pagination = new DashboardPagination(this);
    this.carousel = new DashboardCarousel(this);

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
      4: [ // Admin
        { id: 'dashboard', name: 'Dashboard', icon: this.getIcon('dashboard') },
        { id: 'propiedades', name: 'Propiedades', icon: this.getIcon('building') },
        { id: 'favoritos', name: 'Favoritos', icon: this.getIcon('heart') },
        { id: 'historial', name: 'Búsquedas', icon: this.getIcon('search') },
        { id: 'usuarios', name: 'Usuarios', icon: this.getIcon('users') },
        { id: 'mantenimientos', name: 'Mantenimientos', icon: this.getIcon('settings') },
        { id: 'aprobaciones', name: 'Aprobaciones', icon: this.getIcon('check-circle') }
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
    
    // 🔒 Iniciar gestor de inactividad
    if (window.inactivityManager) {
      inactivityManager.start();
      console.log('✅ Gestor de inactividad iniciado');
    }
  }

  async loadCurrentUser() {
    try {
      // Obtener usuario del storage primero (para mostrar rápido)
      const storedUser = authService.getCurrentUser();
      if (storedUser) {
        this.displayUserInfo(storedUser);
        this.loadTabs(storedUser.perfil_id);
      }

      // Luego obtener datos frescos del backend
      const freshUser = await authService.getMyProfile();
      this.currentUser = freshUser;

      // Actualizar UI con datos frescos
      this.displayUserInfo(freshUser);
      this.loadTabs(freshUser.perfil_id);

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

    // Rol/Perfil - Asegurar que perfil_id sea número
    const perfilId = parseInt(user.perfil_id);
    const perfilNames = {
      1: 'Demandante',
      2: 'Ofertante',
      3: 'Corredor',
      4: 'Administrador'
    };
    this.userRole.textContent = perfilNames[perfilId] || 'Usuario';

    // Avatar
    this.generateAvatar(user);

    // 🔥 Ocultar "Mi Plan" para administradores (perfil_id === 4)
    const planLink = document.getElementById('planLink');
    if (planLink) {
      if (perfilId === 4) {
        planLink.style.display = 'none';
      } else {
        planLink.style.display = 'flex';
      }
    }
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

  setupUserMenu() {
    if (!this.userMenuBtn || !this.userMenu) {
      console.error('❌ Elementos del menú de usuario no encontrados');
      return;
    }

    // Toggle del menú de usuario
    this.userMenuBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      const isActive = this.userMenu.classList.toggle('active');
      console.log(`${isActive ? '✅' : '❌'} Menú de usuario ${isActive ? 'abierto' : 'cerrado'}`);
    });

    // Cerrar menú al hacer click fuera
    document.addEventListener('click', (e) => {
      if (!this.userMenu.contains(e.target)) {
        this.userMenu.classList.remove('active');
      }
    });

    console.log('✅ setupUserMenu() completado');
  }

  setupLogout() {
    this.logoutBtn.addEventListener('click', (e) => {
      e.preventDefault();
      if (confirm('¿Estás seguro que deseas cerrar sesión?')) {
        authService.logout();
      }
    });
  }

  loadTabs(perfilId) {
    // Asegurar que sea número
    const perfilIdNum = parseInt(perfilId);
    const tabs = this.tabsConfig[perfilIdNum];

    if (!tabs) {
      console.error('❌ No hay configuración de tabs para perfil:', perfilIdNum);
      return;
    }

    // Limpiar tabs anteriores
    this.tabsList.innerHTML = '';

    // Crear tabs
    tabs.forEach((tab, index) => {
      const tabBtn = document.createElement('button');
      tabBtn.className = 'tab-btn';
      tabBtn.dataset.tab = tab.id;
      tabBtn.dataset.tooltip = tab.name; // 🔥 Tooltip para móvil
      tabBtn.innerHTML = `${tab.icon} <span class="tab-btn-text">${tab.name}</span>`;

      // Primer tab activo por defecto
      if (index === 0) {
        tabBtn.classList.add('active');
        this.currentTab = tab.id;
        this.loadTabContent(tab.id, perfilIdNum);
      }

      // Event listener
      tabBtn.addEventListener('click', () => {
        this.switchTab(tab.id, perfilIdNum);
      });

      this.tabsList.appendChild(tabBtn);
    });
  }

  switchTab(tabId, perfilId) {
    // Asegurar que sea número
    const perfilIdNum = parseInt(perfilId);
    
    // Actualizar botón activo
    document.querySelectorAll('.tab-btn').forEach(btn => {
      btn.classList.remove('active');
    });
    document.querySelector(`[data-tab="${tabId}"]`)?.classList.add('active');

    // Cargar contenido
    this.currentTab = tabId;
    this.loadTabContent(tabId, perfilIdNum);
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
      } else if (tabId === 'busquedas') {
        content = await this.getBusquedasContent();
      } else if (tabId === 'historial') {
        content = await this.getHistorialContent();
      } else if (tabId === 'propiedades') {
        content = await this.getPropiedadesContent();
      } else if (tabId === 'perfil') {
        content = this.getPerfilContent();
      } else if (tabId === 'mantenimientos') {
        content = this.getMantenimientosContent();
      } else if (tabId === 'aprobaciones') {
        content = this.getAprobacionesContent();
      } else {
        // Tabs no implementados (Corredor)
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
    // Asegurar que sea número
    const perfilIdNum = parseInt(perfilId);
    
    if (perfilIdNum === 1) {
      return await this.getDemandanteDashboard();
    } else if (perfilIdNum === 2) {
      return await this.getOfertanteDashboard();
    } else if (perfilIdNum === 4) {
      return await this.getAdminDashboard();
    } else {
      return this.getPlaceholderDashboard(perfilIdNum);
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

        <!-- Gráfico: Búsquedas por Tipo de Inmueble (PIE CHART) -->
        ${stats.resumen.total_busquedas > 0 && Object.keys(stats.busquedas.por_tipo_inmueble || {}).length > 0 ? 
          Charts.generatePieChart(stats.busquedas.por_tipo_inmueble, {
            title: '🔍 Búsquedas por Tipo de Inmueble',
            size: 320
          })
        : ''}

        <!-- Gráfico: Favoritos por Tipo de Inmueble (PIE CHART) -->
        ${stats.resumen.total_favoritos > 0 && Object.keys(stats.favoritos.por_tipo_inmueble || {}).length > 0 ?
          Charts.generatePieChart(stats.favoritos.por_tipo_inmueble, {
            title: '❤️ Favoritos por Tipo de Inmueble',
            size: 320,
            colors: ['#ef4444', '#f59e0b', '#10b981', '#0066CC', '#8b5cf6', '#ec4899']
          })
        : ''}

        <!-- Gráfico: Búsquedas por Distrito (BARRAS VERTICALES) -->
        ${stats.resumen.total_busquedas > 0 && Object.keys(stats.busquedas.por_distrito || {}).length > 0 ?
          Charts.generateVerticalBarChart(stats.busquedas.por_distrito, {
            title: '📍 Búsquedas por Distrito',
            height: 350,
            colors: ['#0066CC', '#10b981', '#f59e0b', '#8b5cf6', '#ef4444', '#06b6d4', '#ec4899', '#14b8a6']
          })
        : ''}

        <!-- Gráfico: Favoritos por Distrito (BARRAS VERTICALES) -->
        ${stats.resumen.total_favoritos > 0 && Object.keys(stats.favoritos.por_distrito || {}).length > 0 ?
          Charts.generateVerticalBarChart(stats.favoritos.por_distrito, {
            title: '📍 Favoritos por Distrito',
            height: 350,
            colors: ['#ef4444', '#10b981', '#f59e0b', '#0066CC', '#8b5cf6', '#06b6d4', '#ec4899', '#14b8a6']
          })
        : ''}

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

  async getAdminDashboard() {
    try {
      const currentYear = new Date().getFullYear();
      const stats = await this.getDashboardStats(currentYear);

      return `
        <div class="admin-dashboard">
          <div class="dashboard-hero" style="display: flex; justify-content: space-between; align-items: center; margin-bottom: var(--spacing-xl);">
            <div>
              <h1 style="color: var(--azul-corporativo); font-size: 2rem; margin: 0;">
                Panel de Administración
              </h1>
              <p style="color: var(--gris-medio); margin-top: 0.5rem;">
                Vista general del sistema inmobiliario
              </p>
            </div>
            <div style="display: flex; gap: var(--spacing-md); align-items: center;">
              <select id="filterYear" class="dashboard-filter" style="padding: 10px; border: 2px solid var(--azul-corporativo); border-radius: 8px; font-size: 1rem;">
                <option value="2025" ${currentYear === 2025 ? 'selected' : ''}>2025</option>
                <option value="2024" ${currentYear === 2024 ? 'selected' : ''}>2024</option>
                <option value="2023">2023</option>
              </select>
              <select id="filterMonth" class="dashboard-filter" style="padding: 10px; border: 2px solid var(--azul-corporativo); border-radius: 8px; font-size: 1rem;">
                <option value="">Todo el año</option>
                <option value="1">Enero</option>
                <option value="2">Febrero</option>
                <option value="3">Marzo</option>
                <option value="4">Abril</option>
                <option value="5">Mayo</option>
                <option value="6">Junio</option>
                <option value="7">Julio</option>
                <option value="8">Agosto</option>
                <option value="9">Septiembre</option>
                <option value="10">Octubre</option>
                <option value="11">Noviembre</option>
                <option value="12">Diciembre</option>
              </select>
            </div>
          </div>

          <!-- KPIs principales - PALETA CORPORATIVA -->
          <div class="kpis-grid" style="grid-template-columns: repeat(4, 1fr); gap: var(--spacing-lg);">
            <div class="kpi-card" style="border-left: 4px solid var(--azul-corporativo);">
              <div class="kpi-header">
                <div class="kpi-icon" style="color: var(--azul-corporativo);">🏢</div>
                <span class="kpi-title">Propiedades</span>
              </div>
              <div class="kpi-value" style="color: var(--azul-corporativo);">${stats.propiedades?.total || 0}</div>
              <div class="kpi-subtitle">${stats.propiedades?.publicadas || 0} publicadas</div>
            </div>

            <div class="kpi-card" style="border-left: 4px solid var(--dorado);">
              <div class="kpi-header">
                <div class="kpi-icon" style="color: var(--dorado);">💰</div>
                <span class="kpi-title">Valor Cartera</span>
              </div>
              <div class="kpi-value" style="color: var(--dorado);">S/ ${((stats.propiedades?.valor_total || 0) / 1000000).toFixed(1)}M</div>
              <div class="kpi-subtitle">Promedio: S/ ${(stats.propiedades?.precio_promedio || 0).toLocaleString('es-PE')}</div>
            </div>

            <div class="kpi-card" style="border-left: 4px solid #10b981;">
              <div class="kpi-header">
                <div class="kpi-icon" style="color: #10b981;">✅</div>
                <span class="kpi-title">Cerrados</span>
              </div>
              <div class="kpi-value" style="color: #10b981;">${stats.propiedades?.por_estado_crm?.cerrado_ganado || 0}</div>
              <div class="kpi-subtitle">${stats.propiedades?.por_estado_crm?.pre_cierre || 0} por cerrar</div>
            </div>

            <div class="kpi-card" style="border-left: 4px solid #f59e0b;">
              <div class="kpi-header">
                <div class="kpi-icon" style="color: #f59e0b;">📊</div>
                <span class="kpi-title">En Pipeline</span>
              </div>
              <div class="kpi-value" style="color: #f59e0b);">${(stats.propiedades?.por_estado_crm?.contacto || 0) + (stats.propiedades?.por_estado_crm?.propuesta || 0) + (stats.propiedades?.por_estado_crm?.negociacion || 0)}</div>
              <div class="kpi-subtitle">Contacto, Propuesta, Negociación</div>
            </div>
          </div>

          <!-- Estadísticas detalladas -->
          <div style="display: grid; grid-template-columns: 1fr 1fr; gap: var(--spacing-lg); margin-top: var(--spacing-xl);">
            <div class="kpi-card">
              <h3 style="color: var(--azul-corporativo); margin-bottom: var(--spacing-md);">
                📈 Propiedades por Estado
              </h3>
              <div style="display: flex; flex-direction: column; gap: var(--spacing-sm);">
                ${Object.entries(stats.propiedades?.por_estado_crm || {}).map(([estado, cantidad]) => `
                  <div style="display: flex; justify-content: space-between; align-items: center; padding: var(--spacing-xs); background: var(--gris-claro); border-radius: 6px;">
                    <span style="text-transform: capitalize; color: var(--gris-oscuro);">${estado}</span>
                    <strong style="color: var(--azul-corporativo);">${cantidad}</strong>
                  </div>
                `).join('')}
              </div>
            </div>

            <div class="kpi-card">
              <h3 style="color: var(--azul-corporativo); margin-bottom: var(--spacing-md);">
                🎯 Top Distritos
              </h3>
              <div style="display: flex; flex-direction: column; gap: var(--spacing-sm);">
                ${Object.entries(stats.propiedades?.por_distrito || {}).slice(0, 5).map(([distrito, cantidad]) => `
                  <div style="display: flex; justify-content: space-between; align-items: center; padding: var(--spacing-xs); background: var(--gris-claro); border-radius: 6px;">
                    <span style="color: var(--gris-oscuro);">${distrito}</span>
                    <strong style="color: var(--azul-corporativo);">${cantidad}</strong>
                  </div>
                `).join('')}
              </div>
            </div>
          </div>

          <!-- Pipeline CRM Visual -->
          <div style="margin-top: var(--spacing-xl);">
            <h3 style="color: var(--azul-corporativo); margin-bottom: var(--spacing-lg);">
              📊 Pipeline de Ventas
            </h3>
            <div style="display: grid; grid-template-columns: repeat(7, 1fr); gap: var(--spacing-sm);">
              <div style="background: white; border: 2px solid var(--azul-corporativo); padding: var(--spacing-md); border-radius: 8px; text-align: center;">
                <div style="font-size: 1.5rem; font-weight: 700; color: var(--azul-corporativo);">${stats.propiedades?.por_estado_crm?.lead || 0}</div>
                <div style="font-size: 0.85rem; color: var(--gris-medio); margin-top: 4px;">Lead</div>
              </div>
              <div style="background: white; border: 2px solid #10b981; padding: var(--spacing-md); border-radius: 8px; text-align: center;">
                <div style="font-size: 1.5rem; font-weight: 700; color: #10b981;">${stats.propiedades?.por_estado_crm?.contacto || 0}</div>
                <div style="font-size: 0.85rem; color: var(--gris-medio); margin-top: 4px;">Contacto</div>
              </div>
              <div style="background: white; border: 2px solid #f59e0b; padding: var(--spacing-md); border-radius: 8px; text-align: center;">
                <div style="font-size: 1.5rem; font-weight: 700; color: #f59e0b;">${stats.propiedades?.por_estado_crm?.propuesta || 0}</div>
                <div style="font-size: 0.85rem; color: var(--gris-medio); margin-top: 4px;">Propuesta</div>
              </div>
              <div style="background: white; border: 2px solid #8b5cf6; padding: var(--spacing-md); border-radius: 8px; text-align: center;">
                <div style="font-size: 1.5rem; font-weight: 700; color: #8b5cf6;">${stats.propiedades?.por_estado_crm?.negociacion || 0}</div>
                <div style="font-size: 0.85rem; color: var(--gris-medio); margin-top: 4px;">Negociación</div>
              </div>
              <div style="background: white; border: 2px solid #6366f1; padding: var(--spacing-md); border-radius: 8px; text-align: center;">
                <div style="font-size: 1.5rem; font-weight: 700; color: #6366f1;">${stats.propiedades?.por_estado_crm?.pre_cierre || 0}</div>
                <div style="font-size: 0.85rem; color: var(--gris-medio); margin-top: 4px;">Pre-Cierre</div>
              </div>
              <div style="background: white; border: 2px solid #22c55e; padding: var(--spacing-md); border-radius: 8px; text-align: center;">
                <div style="font-size: 1.5rem; font-weight: 700; color: #22c55e;">${stats.propiedades?.por_estado_crm?.cerrado_ganado || 0}</div>
                <div style="font-size: 0.85rem; color: var(--gris-medio); margin-top: 4px;">✅ Ganado</div>
              </div>
              <div style="background: white; border: 2px solid #ef4444; padding: var(--spacing-md); border-radius: 8px; text-align: center;">
                <div style="font-size: 1.5rem; font-weight: 700; color: #ef4444;">${stats.propiedades?.por_estado_crm?.cerrado_perdido || 0}</div>
                <div style="font-size: 0.85rem; color: var(--gris-medio); margin-top: 4px;">❌ Perdido</div>
              </div>
            </div>
          </div>

          <!-- Gráficos de análisis -->
          <div style="display: grid; grid-template-columns: 1fr 1fr; gap: var(--spacing-xl); margin-top: var(--spacing-xl);">
            ${Object.keys(stats.propiedades?.por_tipo_inmueble || {}).length > 0 ?
              Charts.generatePieChart(stats.propiedades.por_tipo_inmueble, {
                title: '🏢 Propiedades por Tipo',
                size: 300,
                colors: ['var(--azul-corporativo)', '#10b981', '#f59e0b', '#8b5cf6', '#ef4444', '#06b6d4']
              })
            : ''}
            
            ${Object.keys(stats.propiedades?.por_distrito || {}).length > 0 ?
              Charts.generatePieChart(stats.propiedades.por_distrito, {
                title: '📍 Propiedades por Distrito',
                size: 300,
                colors: ['var(--azul-corporativo)', 'var(--dorado)', '#10b981', '#f59e0b', '#8b5cf6', '#ef4444']
              })
            : ''}
          </div>
        </div>
      `;
    } catch (error) {
      console.error('❌ Error cargando dashboard admin:', error);
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

          <!-- Gráfico: Propiedades por Tipo (PIE CHART) -->
          ${Object.keys(stats.propiedades.por_tipo_inmueble || {}).length > 0 ?
            Charts.generatePieChart(stats.propiedades.por_tipo_inmueble, {
              title: '🏢 Propiedades por Tipo de Inmueble',
              size: 320,
              colors: ['#0066CC', '#10b981', '#f59e0b', '#8b5cf6', '#ef4444', '#06b6d4']
            })
          : ''}

          <!-- Gráfico: Propiedades por Distrito (BARRAS VERTICALES) -->
          ${Object.keys(stats.propiedades.por_distrito || {}).length > 0 ?
            Charts.generateVerticalBarChart(stats.propiedades.por_distrito, {
              title: '📍 Propiedades por Distrito',
              height: 350,
              colors: ['#0066CC', '#10b981', '#f59e0b', '#8b5cf6', '#ef4444', '#06b6d4', '#ec4899', '#14b8a6']
            })
          : ''}
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

      // 🔥 Cards hermosas como en resultados.html
      const favoritesCards = favoritesList.map((fav, index) => {
        const prop = fav.propiedad || {};
        
        // Construir URLs completas para imagenes (igual que en Propiedades)
        const baseUrl = 'https://ik.imagekit.io/quadrante/';
        let imagenes = [];
        
        if (prop.imagenes && prop.imagenes.length > 0) {
          imagenes = prop.imagenes.map(img => {
            if (img.startsWith('http://') || img.startsWith('https://')) {
              return img;
            }
            return baseUrl + img;
          });
        } else if (prop.imagenes_galeria && prop.imagenes_galeria.length > 0) {
          imagenes = prop.imagenes_galeria;
        } else if (prop.imagen_principal) {
          imagenes = [prop.imagen_principal];
        } else {
          imagenes = ['https://via.placeholder.com/400x300?text=Sin+Imagen'];
        }
        
        const precio = prop.precio_alquiler ? 
          `S/ ${parseFloat(prop.precio_alquiler).toLocaleString('es-PE')}/mes` : 
          prop.precio_venta ? 
          `S/ ${parseFloat(prop.precio_venta).toLocaleString('es-PE')}` : 
          'Precio no disponible';

        return `
          <div class="property-card" data-property-id="${prop.id || prop.registro_cab_id}">
            <div class="property-number">${index + 1}</div>
            <button class="favorite-btn active" data-favorite-id="${fav.id}" title="Quitar de favoritos">❤</button>
            <div class="property-image-carousel">
              <div class="carousel-images" data-current="0">
                ${imagenes.map((img, i) => `
                  <img src="${img}" alt="${prop.titulo} - imagen ${i+1}" 
                       class="carousel-image ${i === 0 ? 'active' : ''}" data-index="${i}"
                       onerror="this.src='https://via.placeholder.com/400x300?text=Sin+Imagen'">
                `).join('')}
              </div>
              ${imagenes.length > 1 ? `
                <button class="carousel-prev" data-property-id="${prop.id || prop.registro_cab_id}">‹</button>
                <button class="carousel-next" data-property-id="${prop.id || prop.registro_cab_id}">›</button>
                <div class="carousel-indicators">
                  ${imagenes.map((_, i) => `
                    <span class="indicator ${i === 0 ? 'active' : ''}" data-index="${i}"></span>
                  `).join('')}
                </div>
              ` : ''}
            </div>
            <div class="property-info">
              <h3 class="property-title">${prop.titulo || 'Sin título'}</h3>
              <div class="property-location">📍 ${prop.direccion || 'Ubicación no disponible'}</div>
              <div class="property-price">${precio}</div>
              <div class="property-features">
                <span class="feature">📐 ${prop.area || 0} m²</span>
                ${prop.banos ? `<span class="feature">🛁 ${prop.banos} baños</span>` : ''}
                ${prop.parqueos ? `<span class="feature">🚗 ${prop.parqueos} parqueos</span>` : ''}
                ${prop.antiguedad ? `<span class="feature">⏱️ ${prop.antiguedad} años</span>` : ''}
              </div>
              <p class="property-description">${(prop.descripcion || '').substring(0, 150)}...</p>
              <div class="property-actions">
                <button class="btn btn-primary" data-view-property="${prop.id || prop.registro_cab_id}">
                  Ver Detalle
                </button>
                <button class="btn btn-secondary" data-contact-property="${prop.id || prop.registro_cab_id}">
                  Contactar
                </button>
              </div>
            </div>
          </div>
        `;
      }).join('');

      return `
        <div class="favoritos-header" style="margin-bottom: var(--spacing-xl);">
          <h2 style="color: var(--azul-corporativo); margin: 0;">
            Mis Favoritos (${favoritesList.length})
          </h2>
          <p style="color: var(--gris-medio); margin-top: var(--spacing-sm);">
            Precio promedio: S/ ${favoriteStats.avgPrice.toLocaleString('es-PE')}
          </p>
        </div>
        <div class="properties-grid">
          ${favoritesCards}
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
      // Obtener MIS propiedades (usa el token para identificar el usuario)
      const token = authService.getToken();
      const response = await fetch(`${API_CONFIG.BASE_URL}/propiedades/mis-propiedades?limit=50`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await response.json();

      // ✅ El API ahora retorna imagenes[] directamente
      const propiedades = data.data || [];
      
      // ✅ ORDENAR: Última creada PRIMERO (por registro_cab_id descendente)
      this.allProperties = propiedades.sort((a, b) => {
        const idA = a.registro_cab_id || 0;
        const idB = b.registro_cab_id || 0;
        return idB - idA; // Descendente (mayor ID = más reciente)
      });

      this.pagination.updateItemsPerPage();

      console.log('✅ Propiedades cargadas:', this.allProperties.length);
      console.log('📋 IDs disponibles:', this.allProperties.map(p => p.registro_cab_id));
      
      if (this.allProperties.length > 0) {
        const ultima = this.allProperties[0];
        console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
        console.log('📦 ÚLTIMA PROPIEDAD CREADA (más reciente):');
        console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
        console.log('🆔 ID:', ultima.registro_cab_id);
        console.log('📝 Título:', ultima.titulo);
        console.log('🏢 Tipo:', ultima.tipo_inmueble_nombre);
        console.log('📍 Distrito:', ultima.distrito_nombre);
        console.log('🏠 Dirección:', ultima.direccion);
        console.log('🗺️ Latitud:', ultima.latitud, '(Tipo:', typeof ultima.latitud + ')');
        console.log('🗺️ Longitud:', ultima.longitud, '(Tipo:', typeof ultima.longitud + ')');
        console.log('📏 Área:', ultima.area, 'm²');
        console.log('🛏️ Habitaciones:', ultima.habitaciones);
        console.log('🚿 Baños:', ultima.banos);
        console.log('🚗 Parqueos:', ultima.parqueos);
        console.log('💰 Transacción:', ultima.transaccion);
        console.log('💵 Precio:', ultima.transaccion === 'venta' ? ultima.precio_venta : ultima.precio_alquiler, ultima.moneda);
        console.log('📊 Estado:', ultima.estado);
        console.log('📈 Estado CRM:', ultima.estado_crm);
        console.log('📸 Imagen Principal:', ultima.imagen_principal);
        console.log('🖼️ Galería:', ultima.imagenes?.length || 0, 'imágenes');
        console.log('📞 Teléfono:', ultima.telefono);
        console.log('📧 Email:', ultima.email);
        console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
      }

      // Header con filtros usando el módulo
      const content = `
        <div class="propiedades-header" style="margin-bottom: var(--spacing-xl);">
          <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: var(--spacing-lg);">
            <h2 style="color: var(--azul-corporativo); margin: 0;">
              Mis Propiedades (<span id="propCount">${this.allProperties.length}</span>)
            </h2>
            <button id="btnNuevaPropiedad" class="btn btn-primary">
              ➕ Nueva Propiedad
            </button>
          </div>

          ${this.filters.render()}
        </div>

        ${this.allProperties.length === 0 ? `
          <div class="empty-state">
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"></path>
              <polyline points="9 22 9 12 15 12 15 22"></polyline>
            </svg>
            <h3>No hay propiedades registradas</h3>
            <p>Comienza registrando tu primera propiedad.</p>
          </div>
        ` : `
          <div id="propertiesGrid" class="properties-grid">
            <!-- Se renderiza con paginación -->
          </div>
          
          <!-- Paginador -->
          <div id="paginadorContainer"></div>
        `}
      `;

      return content;
    } catch (error) {
      console.error('❌ Error cargando propiedades:', error);
      throw error;
    }
  }

  renderPropertiesPage() {
    console.log('🎨 Renderizando propiedades page...');
    console.log('📊 Total propiedades:', this.allProperties?.length);
    
    const filtered = this.filters.getFiltered(this.allProperties);
    const pageData = this.pagination.getPageData(filtered);

    console.log('🔍 Propiedades filtradas:', filtered.length);
    console.log('📄 Propiedades en página:', pageData.items.length);

    // Actualizar contador
    const countEl = document.getElementById('propCount');
    if (countEl) countEl.textContent = filtered.length;

    // Renderizar propiedades
    const grid = document.getElementById('propertiesGrid');
    if (!grid) {
      console.error('❌ No se encontró #propertiesGrid');
      return;
    }

    if (pageData.items.length === 0) {
      grid.innerHTML = '<div class="empty-state"><p>No se encontraron propiedades con los filtros aplicados.</p></div>';
      const paginadorContainer = document.getElementById('paginadorContainer');
      if (paginadorContainer) paginadorContainer.innerHTML = '';
      return;
    }

    grid.innerHTML = pageData.items.map((prop, index) => {
      const baseUrl = 'https://ik.imagekit.io/quadrante/';
      let imagenes = [];
      
      if (prop.imagenes && prop.imagenes.length > 0) {
        imagenes = prop.imagenes.map(img => {
          if (img.startsWith('http://') || img.startsWith('https://')) return img;
          return baseUrl + img;
        });
      } else if (prop.imagen_principal) {
        imagenes = [prop.imagen_principal];
      } else {
        imagenes = ['https://via.placeholder.com/400x300?text=Sin+Imagen'];
      }
      
      const precio = prop.precio_alquiler ? 
        `S/ ${parseFloat(prop.precio_alquiler).toLocaleString('es-PE')}/mes` : 
        prop.precio_venta ? 
        `S/ ${parseFloat(prop.precio_venta).toLocaleString('es-PE')}` : 
        'Precio no disponible';
      
      const estadoBadge = {
        'publicado': { color: '#10b981', text: 'PUBLICADO' },
        'borrador': { color: '#f59e0b', text: 'BORRADOR' },
        'pausado': { color: '#6366f1', text: 'PAUSADO' },
        'vendido': { color: '#8b5cf6', text: 'VENDIDO' }
      }[prop.estado] || { color: '#6b7280', text: 'BORRADOR' };

      // 🎯 Nuevo: Badge de Estado CRM
      const estadoCRMBadge = {
        'lead': { color: '#6b7280', text: '🔍 Lead' },
        'contactado': { color: '#3b82f6', text: '📞 Contactado' },
        'visita_programada': { color: '#eab308', text: '📅 Visita Programada' },
        'negociacion': { color: '#f97316', text: '💼 En Negociación' },
        'cerrado_ganado': { color: '#22c55e', text: '✅ Cerrado - Ganado' },
        'cerrado_perdido': { color: '#ef4444', text: '❌ Cerrado - Perdido' }
      }[prop.estado_crm] || { color: '#6b7280', text: '⚪ Sin Estado' };

      return `
        <div class="property-card" data-property-id="${prop.registro_cab_id}">
          <div class="property-number">${pageData.startIndex + index + 1}</div>
          
          <!-- Badge de Estado de Propiedad -->
          <div class="property-badge" style="position: absolute; top: 50px; left: 10px; background: ${estadoBadge.color}; color: white; padding: 4px 10px; border-radius: 6px; font-size: 0.75rem; font-weight: 600; z-index: 20;">
            ${estadoBadge.text}
          </div>
          
          <!-- 🎯 Nuevo: Badge de Estado CRM -->
          <div class="property-crm-badge" style="position: absolute; top: 50px; right: 10px; background: ${estadoCRMBadge.color}; color: white; padding: 4px 10px; border-radius: 6px; font-size: 0.75rem; font-weight: 600; z-index: 20; box-shadow: 0 2px 4px rgba(0,0,0,0.15);">
            ${estadoCRMBadge.text}
          </div>
          <div class="property-image-carousel">
            <div class="carousel-images" data-current="0">
              ${imagenes.map((img, i) => `
                <img src="${img}" alt="${prop.titulo} - imagen ${i+1}" 
                     class="carousel-image ${i === 0 ? 'active' : ''}" data-index="${i}"
                     onerror="this.src='https://via.placeholder.com/400x300?text=Sin+Imagen'">
              `).join('')}
            </div>
            ${imagenes.length > 1 ? `
              <button class="carousel-prev" data-property-id="${prop.registro_cab_id}">‹</button>
              <button class="carousel-next" data-property-id="${prop.registro_cab_id}">›</button>
              <div class="carousel-indicators">
                ${imagenes.map((_, i) => `
                  <span class="indicator ${i === 0 ? 'active' : ''}" data-index="${i}"></span>
                `).join('')}
              </div>
            ` : ''}
          </div>
          <div class="property-info">
            <h3 class="property-title">${prop.titulo || 'Sin título'}</h3>
            <div class="property-location">📍 ${prop.direccion || 'Ubicación no disponible'}</div>
            <div class="property-price">${precio}</div>
            <div class="property-features">
              <span class="feature">📐 ${prop.area || 0} m²</span>
              ${prop.banos ? `<span class="feature">🛁 ${prop.banos} baños</span>` : ''}
              ${prop.parqueos ? `<span class="feature">🚗 ${prop.parqueos} parqueos</span>` : ''}
              ${prop.antiguedad ? `<span class="feature">⏱️ ${prop.antiguedad} años</span>` : ''}
            </div>
            <div class="property-stats" style="display: flex; gap: 1rem; margin: 0.75rem 0; font-size: 0.85rem; color: var(--gris-medio);">
              <span>👁️ ${prop.vistas || 0} vistas</span>
              <span>📞 ${prop.contactos || 0} contactos</span>
            </div>
            
            <!-- 🎯 Nuevo: Información de Contacto del Propietario -->
            ${(prop.telefono || prop.email) ? `
              <div class="property-contact" style="background: rgba(0, 102, 204, 0.03); border-radius: 8px; padding: 10px 12px; margin: 0.75rem 0; border-left: 3px solid var(--azul-corporativo);">
                <div style="font-size: 0.8rem; color: var(--gris-medio); margin-bottom: 6px; font-weight: 600;">👤 Contacto del Propietario</div>
                <div style="display: flex; gap: 8px; flex-wrap: wrap;">
                  ${prop.telefono ? `
                    <a href="tel:${prop.telefono}" class="contact-btn" style="display: inline-flex; align-items: center; gap: 4px; padding: 4px 10px; background: #22c55e; color: white; border-radius: 6px; text-decoration: none; font-size: 0.8rem; font-weight: 500; transition: all 0.2s;">
                      📱 ${prop.telefono}
                    </a>
                  ` : ''}
                  ${prop.email ? `
                    <a href="mailto:${prop.email}" class="contact-btn" style="display: inline-flex; align-items: center; gap: 4px; padding: 4px 10px; background: #3b82f6; color: white; border-radius: 6px; text-decoration: none; font-size: 0.8rem; font-weight: 500; transition: all 0.2s;">
                      📧 ${prop.email}
                    </a>
                  ` : ''}
                </div>
              </div>
            ` : ''}
            
            <p class="property-description">${(prop.descripcion || '').substring(0, 120)}...</p>
            <div class="admin-actions-simple" style="display: grid; grid-template-columns: repeat(auto-fit, minmax(90px, 1fr)); gap: 0.5rem;">
              <button class="btn-admin" data-view-property="${prop.registro_cab_id}">📄 Detalle</button>
              ${prop.latitud && prop.longitud ? `
                <button class="btn-admin" data-map-property="${prop.registro_cab_id}" data-lat="${prop.latitud}" data-lng="${prop.longitud}">🗺️ Mapa</button>
              ` : `
                <button class="btn-admin" disabled style="opacity: 0.5; cursor: not-allowed;" title="Sin coordenadas de ubicación">🗺️ Mapa</button>
              `}
              <button class="btn-admin" data-edit-property="${prop.registro_cab_id}">✏️ Editar</button>
              ${this.currentUser?.perfil_id === 4 ? `
                <button class="btn-admin" data-assign-broker="${prop.registro_cab_id}" style="background: var(--dorado); color: white;">👤 Asignar</button>
              ` : ''}
            </div>
          </div>
        </div>
      `;
    }).join('');

    // Renderizar paginador
    const paginadorContainer = document.getElementById('paginadorContainer');
    if (paginadorContainer) {
      const paginadorHTML = this.pagination.render(filtered.length);
      paginadorContainer.innerHTML = paginadorHTML;
      console.log('✅ Paginador renderizado');

      // 🔥 CONFIGURAR EVENT LISTENERS DEL PAGINADOR
      this.pagination.setupListeners();
      console.log('✅ Listeners del paginador configurados');
    } else {
      console.error('❌ No se encontró #paginadorContainer');
    }

    // Setup carrusel y listeners
    console.log('🎠 Configurando carrusel...');
    this.carousel.setup();
    this.setupPropertyListeners();
    console.log('✅ Renderizado completo');
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

    // 🔥 Filtros de año/mes en dashboard
    if (tabId === 'dashboard') {
      const yearFilter = document.getElementById('filterYear');
      const monthFilter = document.getElementById('filterMonth');
      
      if (yearFilter && monthFilter) {
        const applyFilters = async () => {
          const year = yearFilter.value;
          const month = monthFilter.value;
          await this.loadTabContent('dashboard', this.currentUser.perfil_id);
        };
        
        yearFilter.addEventListener('change', applyFilters);
        monthFilter.addEventListener('change', applyFilters);
      }
    }

    // 🔥 Event listeners para carrusel de imágenes
    this.setupCarouselListeners();

    // Event listeners específicos por tab
    if (tabId === 'favoritos') {
      // Eliminar favorito
      document.querySelectorAll('[data-favorite-id]').forEach(btn => {
        btn.addEventListener('click', async (e) => {
          e.stopPropagation();
          const favoritoId = e.currentTarget.dataset.favoriteId;
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
      
      // Ver detalle de propiedad
      document.querySelectorAll('[data-view-property]').forEach(btn => {
        btn.addEventListener('click', (e) => {
          e.stopPropagation();
          const propId = e.currentTarget.dataset.viewProperty;
          window.location.href = `propiedad.html?id=${propId}`;
        });
      });
    }

    if (tabId === 'propiedades') {
      // Renderizar página inicial e inicializar filtros
      setTimeout(async () => {
        await this.filters.setup();
        this.renderPropertiesPage();
      }, 100);
    }
  }

  setupPropertyListeners() {
    console.log('📋 setupPropertyListeners llamado');

    // Ver detalle en popup
    const viewBtns = document.querySelectorAll('[data-view-property]');
    console.log(`🔍 Botones [data-view-property] encontrados: ${viewBtns.length}`);

    viewBtns.forEach((btn, index) => {
      console.log(`  Botón ${index + 1}: propId=${btn.dataset.viewProperty}`);
      btn.addEventListener('click', async (e) => {
        e.stopPropagation();
        const propId = e.currentTarget.dataset.viewProperty;
        console.log(`🖱️ Click en botón Ver Detalle, propId: ${propId}`);
        await this.showPropertyDetailPopup(propId);
      });
    });

    // Mapa en popup
    const mapBtns = document.querySelectorAll('[data-map-property]');
    console.log(`🗺️ Botones [data-map-property] encontrados: ${mapBtns.length}`);

    mapBtns.forEach(btn => {
      btn.addEventListener('click', (e) => {
        e.stopPropagation();
        const lat = e.currentTarget.dataset.lat;
        const lng = e.currentTarget.dataset.lng;
        console.log(`🖱️ Click en botón Mapa, lat: ${lat}, lng: ${lng}`);
        this.showMapPopup(lat, lng);
      });
    });

    // Editar propiedad
    const editBtns = document.querySelectorAll('[data-edit-property]');
    console.log(`✏️ Botones [data-edit-property] encontrados: ${editBtns.length}`);

    editBtns.forEach(btn => {
      btn.addEventListener('click', async (e) => {
        e.stopPropagation();
        const propId = parseInt(e.currentTarget.dataset.editProperty);
        
        console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
        console.log('🖱️ CLICK EN BOTÓN EDITAR');
        console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
        console.log('Dataset:', e.currentTarget.dataset);
        console.log('dataset.editProperty:', e.currentTarget.dataset.editProperty);
        console.log('propId (parseado):', propId);
        console.log('Tipo:', typeof propId);
        console.log('Es válido?', !isNaN(propId) && propId > 0);
        console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
        
        if (!propId || isNaN(propId)) {
          console.error('❌ ID inválido:', propId);
          showNotification('❌ Error: ID de propiedad inválido', 'error');
          return;
        }
        
        // Abrir formulario en modo EDITAR
        const propertyForm = new PropertyForm(this, propId);
        await propertyForm.init();
      });
    });

    // Asignar corredor (solo admin)
    const assignBtns = document.querySelectorAll('[data-assign-broker]');
    console.log(`👤 Botones [data-assign-broker] encontrados: ${assignBtns.length}`);

    assignBtns.forEach(btn => {
      btn.addEventListener('click', async (e) => {
        e.stopPropagation();
        const propId = e.currentTarget.dataset.assignBroker;
        console.log(`🖱️ Click en botón Asignar Corredor, propId: ${propId}`);
        await this.showAssignBrokerPopup(propId);
      });
    });

    // ➕ Nueva Propiedad (formulario multipaso)
    const btnNuevaPropiedad = document.getElementById('btnNuevaPropiedad');
    if (btnNuevaPropiedad) {
      console.log('✅ Botón Nueva Propiedad encontrado');
      btnNuevaPropiedad.addEventListener('click', () => {
        console.log('🖱️ Click en Nueva Propiedad');
        this.showPropertyForm();
      });
    }
  }

  showPropertyForm(propId = null) {
    console.log('🎯 Abriendo formulario de propiedad...', propId ? `Editar ID: ${propId}` : 'Nueva');
    const form = new PropertyForm(this, propId);
    form.init();
  }

  setupAdminListeners(tabId) {
    if (tabId === 'admin-usuarios') {
      // Ver perfil de usuario
      document.querySelectorAll('[data-view-user]').forEach(btn => {
        btn.addEventListener('click', (e) => {
          e.stopPropagation();
          const userId = e.currentTarget.dataset.viewUser;
          window.location.href = `usuario.html?id=${userId}`;
        });
      });
    }

    if (tabId === 'propiedades-admin') {
      // Listeners admin
      // Publicar propiedad
      document.querySelectorAll('[data-publish-property]').forEach(btn => {
        btn.addEventListener('click', async (e) => {
          e.stopPropagation();
          const propId = e.currentTarget.dataset.publishProperty;
          if (confirm('¿Publicar esta propiedad?')) {
            try {
              const token = authService.getToken();
              await fetch(`${API_CONFIG.BASE_URL}/propiedades/${propId}/estado`, {
                method: 'PATCH',
                headers: {
                  'Authorization': `Bearer ${token}`,
                  'Content-Type': 'application/json'
                },
                body: JSON.stringify({ estado: 'publicado' })
              });
              showNotification('Propiedad publicada', 'success');
              this.loadTabContent('propiedades', this.currentUser.perfil_id);
            } catch (error) {
              showNotification('Error al publicar', 'error');
            }
          }
        });
      });

      // Pausar propiedad
      document.querySelectorAll('[data-pause-property]').forEach(btn => {
        btn.addEventListener('click', async (e) => {
          e.stopPropagation();
          const propId = e.currentTarget.dataset.pauseProperty;
          if (confirm('¿Pausar esta propiedad?')) {
            try {
              const token = authService.getToken();
              await fetch(`${API_CONFIG.BASE_URL}/propiedades/${propId}/estado`, {
                method: 'PATCH',
                headers: {
                  'Authorization': `Bearer ${token}`,
                  'Content-Type': 'application/json'
                },
                body: JSON.stringify({ estado: 'pausado' })
              });
              showNotification('Propiedad pausada', 'success');
              this.loadTabContent('propiedades', this.currentUser.perfil_id);
            } catch (error) {
              showNotification('Error al pausar', 'error');
            }
          }
        });
      });

      // Asignar corredor
      document.querySelectorAll('[data-assign-broker]').forEach(btn => {
        btn.addEventListener('click', async (e) => {
          e.stopPropagation();
          const propId = e.currentTarget.dataset.assignBroker;
          const corredorId = prompt('Ingresa el ID del corredor a asignar:');
          if (corredorId) {
            try {
              const token = authService.getToken();
              await fetch(`${API_CONFIG.BASE_URL}/propiedades/${propId}/asignar-corredor`, {
                method: 'PATCH',
                headers: {
                  'Authorization': `Bearer ${token}`,
                  'Content-Type': 'application/json'
                },
                body: JSON.stringify({ corredor_id: parseInt(corredorId) })
              });
              showNotification('Corredor asignado', 'success');
              this.loadTabContent('propiedades', this.currentUser.perfil_id);
            } catch (error) {
              showNotification('Error al asignar', 'error');
            }
          }
        });
      });
    }
  }

  setupCarouselListeners() {
    // Delegado al módulo carousel
    this.carousel.setup();
  }

  async showPropertyDetailPopup(propId) {
    console.log(`📄 showPropertyDetailPopup llamado con propId: ${propId}`);
    try {
      // ✅ WORKAROUND CORS: Buscar en memoria primero
      let prop = this.allProperties.find(p => p.registro_cab_id == propId);
      
      if (!prop) {
        // Si no está en memoria, intentar fetch
        const token = authService.getToken();
        console.log(`🔑 Token obtenido: ${token ? 'OK' : 'FALTA'}`);

        const url = `${API_CONFIG.BASE_URL}/propiedades/${propId}`;
        console.log(`📡 Fetching: ${url}`);

        const response = await fetch(url, {
          headers: { 'Authorization': `Bearer ${token}` },
          mode: 'cors'
        });

        console.log(`📡 Response status: ${response.status}`);

        const data = await response.json();
        console.log(`📦 Data recibida:`, data);
        prop = data.data;
      } else {
        console.log(`✅ Propiedad encontrada en memoria`);
      }

      const modalHtml = `
        <div class="modal-overlay" id="detailModal" style="position: fixed; top: 0; left: 0; right: 0; bottom: 0; background: rgba(0,0,0,0.8); z-index: 99999; display: flex; align-items: center; justify-content: center; padding: 20px; animation: fadeIn 0.2s ease;">
          <div style="background: white; border-radius: 16px; max-width: 700px; width: 100%; max-height: 90vh; overflow-y: auto; box-shadow: 0 25px 80px rgba(0,0,0,0.4); animation: slideUp 0.3s ease;">
            <div style="padding: var(--spacing-xl); border-bottom: 2px solid var(--borde); display: flex; justify-content: space-between; align-items: center; background: linear-gradient(135deg, var(--azul-corporativo) 0%, #0056b3 100%); color: white; border-radius: 16px 16px 0 0;">
              <h2 style="margin: 0; color: white; display: flex; align-items: center; gap: 0.5rem;">
                <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"></path></svg>
                Detalles de Propiedad
              </h2>
              <button onclick="document.getElementById('detailModal').remove()" style="background: rgba(255,255,255,0.2); border: none; font-size: 24px; cursor: pointer; color: white; width: 36px; height: 36px; border-radius: 50%; display: flex; align-items: center; justify-content: center; transition: all 0.2s;" onmouseover="this.style.background='rgba(255,255,255,0.3)'" onmouseout="this.style.background='rgba(255,255,255,0.2)'">&times;</button>
            </div>
            <div style="padding: var(--spacing-xl);">
              <h3 style="margin-top: 0;">${prop.titulo}</h3>
              <p style="color: var(--gris-medio); margin-bottom: var(--spacing-md);">📍 ${prop.direccion}, ${prop.distrito}</p>
              <div style="display: grid; grid-template-columns: repeat(2, 1fr); gap: var(--spacing-md); margin-bottom: var(--spacing-lg);">
                <div><strong>Tipo:</strong> ${prop.tipo_inmueble}</div>
                <div><strong>Operación:</strong> ${prop.tipo_operacion}</div>
                <div><strong>Precio:</strong> S/ ${(prop.precio_venta || prop.precio_alquiler || 0).toLocaleString('es-PE')}</div>
                <div><strong>Área:</strong> ${prop.area} m²</div>
                <div><strong>Dormitorios:</strong> ${prop.dormitorios || 0}</div>
                <div><strong>Baños:</strong> ${prop.banos || 0}</div>
                <div><strong>Parqueos:</strong> ${prop.parqueos || 0}</div>
                <div><strong>Estado:</strong> ${prop.estado}</div>
              </div>
              <div style="margin-bottom: var(--spacing-md);">
                <strong>Descripción:</strong>
                <p style="margin-top: 8px; line-height: 1.6;">${prop.descripcion || 'Sin descripción'}</p>
              </div>
              <div style="display: flex; gap: var(--spacing-sm); justify-content: flex-end;">
                <button onclick="window.location.href='propiedad.html?id=${propId}'" class="btn btn-secondary">Ver Completo</button>
                <button onclick="window.location.href='registro-propiedad.html?id=${propId}'" class="btn btn-primary">Editar</button>
              </div>
            </div>
          </div>
        </div>
      `;
      document.body.insertAdjacentHTML('beforeend', modalHtml);
      console.log('✅ Modal HTML insertado en body');

      document.getElementById('detailModal').addEventListener('click', (e) => {
        if (e.target.id === 'detailModal') e.target.remove();
      });
      console.log('✅ Listener de cierre agregado al modal');
    } catch (error) {
      console.error('❌ Error en showPropertyDetailPopup:', error);
      showNotification('Error al cargar detalles', 'error');
    }
  }

  showMapPopup(lat, lng) {
    console.log(`🗺️ showMapPopup llamado - lat: ${lat}, lng: ${lng}`);
    
    // ✅ Validar y convertir a números
    lat = parseFloat(lat);
    lng = parseFloat(lng);
    
    if (!lat || !lng || isNaN(lat) || isNaN(lng)) {
      console.error('❌ Coordenadas inválidas:', { lat, lng });
      showNotification('📍 Esta propiedad no tiene coordenadas de ubicación', 'warning');
      return;
    }

    const modalHtml = `
      <div class="modal-overlay" id="mapModal" style="position: fixed; top: 0; left: 0; right: 0; bottom: 0; background: rgba(0,0,0,0.8); z-index: 99999; display: flex; align-items: center; justify-content: center; padding: 20px; animation: fadeIn 0.2s ease;">
        <div style="background: white; border-radius: 16px; max-width: 900px; width: 100%; max-height: 90vh; overflow: hidden; box-shadow: 0 25px 80px rgba(0,0,0,0.4); animation: slideUp 0.3s ease;">
          <div style="padding: var(--spacing-lg); border-bottom: 2px solid var(--borde); display: flex; justify-content: space-between; align-items: center; background: linear-gradient(135deg, #10b981 0%, #059669 100%); color: white;">
            <h2 style="margin: 0; color: white; display: flex; align-items: center; gap: 0.5rem;">
              <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"></path><circle cx="12" cy="10" r="3"></circle></svg>
              Ubicación en Mapa
            </h2>
            <button onclick="document.getElementById('mapModal').remove()" style="background: rgba(255,255,255,0.2); border: none; font-size: 24px; cursor: pointer; color: white; width: 36px; height: 36px; border-radius: 50%; display: flex; align-items: center; justify-content: center; transition: all 0.2s;" onmouseover="this.style.background='rgba(255,255,255,0.3)'" onmouseout="this.style.background='rgba(255,255,255,0.2)'">&times;</button>
          </div>
          <div style="padding: var(--spacing-md);">
            <div id="propertyMap" style="height: 500px; border-radius: 8px;"></div>
            <div style="margin-top: var(--spacing-md); text-align: center;">
              <p style="color: var(--gris-medio); margin-bottom: var(--spacing-sm);">
                Coordenadas: ${lat}, ${lng}
              </p>
              <a href="https://www.google.com/maps?q=${lat},${lng}" target="_blank" class="btn btn-primary">
                Abrir en Google Maps
              </a>
            </div>
          </div>
        </div>
      </div>
    `;
    document.body.insertAdjacentHTML('beforeend', modalHtml);
    
    // Inicializar mapa Leaflet
    setTimeout(() => {
      const map = L.map('propertyMap').setView([lat, lng], 16);
      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '© OpenStreetMap contributors'
      }).addTo(map);
      L.marker([lat, lng]).addTo(map);
    }, 100);
    
    document.getElementById('mapModal').addEventListener('click', (e) => {
      if (e.target.id === 'mapModal') e.target.remove();
    });
  }

  async showAssignBrokerPopup(propId) {
    try {
      const token = authService.getToken();
      
      // Obtener lista de corredores (perfil_id = 3)
      const response = await fetch(`${API_CONFIG.BASE_URL}/usuarios?perfil_id=3`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      
      if (!response.ok) {
        showNotification('Error al cargar corredores', 'error');
        return;
      }
      
      const data = await response.json();
      const corredores = data.data || [];
      
      if (corredores.length === 0) {
        showNotification('No hay corredores disponibles', 'warning');
        return;
      }
      
      const modalHtml = `
        <div class="modal-overlay" id="assignBrokerModal" style="position: fixed; top: 0; left: 0; right: 0; bottom: 0; background: rgba(0,0,0,0.7); z-index: 10000; display: flex; align-items: center; justify-content: center; padding: 20px;">
          <div style="background: white; border-radius: 16px; max-width: 500px; width: 100%; max-height: 90vh; overflow-y: auto; box-shadow: 0 20px 60px rgba(0,0,0,0.3);">
            <div style="padding: var(--spacing-xl); border-bottom: 2px solid var(--borde); display: flex; justify-content: space-between; align-items: center; background: var(--azul-corporativo); color: white; border-radius: 16px 16px 0 0;">
              <h2 style="margin: 0; color: white;">👤 Asignar Corredor</h2>
              <button onclick="document.getElementById('assignBrokerModal').remove()" style="background: none; border: none; font-size: 28px; cursor: pointer; color: white;">&times;</button>
            </div>
            <div style="padding: var(--spacing-xl);">
              <p style="margin-bottom: var(--spacing-lg); color: var(--gris-oscuro);">Selecciona el corredor que gestionará esta propiedad:</p>
              <div style="display: flex; flex-direction: column; gap: var(--spacing-sm);">
                ${corredores.map(corredor => `
                  <button 
                    class="broker-option" 
                    data-broker-id="${corredor.usuario_id}"
                    style="padding: var(--spacing-md); border: 2px solid var(--borde); border-radius: 8px; background: white; cursor: pointer; text-align: left; transition: all 0.2s; display: flex; align-items: center; gap: var(--spacing-sm);"
                    onmouseover="this.style.borderColor='var(--azul-corporativo)'; this.style.background='rgba(0,102,204,0.05)';"
                    onmouseout="this.style.borderColor='var(--borde)'; this.style.background='white';"
                  >
                    <div style="width: 40px; height: 40px; border-radius: 50%; background: var(--azul-corporativo); color: white; display: flex; align-items: center; justify-content: center; font-weight: 700; flex-shrink: 0;">
                      ${(corredor.nombre?.[0] || 'C').toUpperCase()}
                    </div>
                    <div style="flex: 1;">
                      <div style="font-weight: 600; color: var(--azul-corporativo); margin-bottom: 4px;">${corredor.nombre} ${corredor.apellido}</div>
                      <div style="font-size: 0.85rem; color: var(--gris-medio);">📧 ${corredor.email}</div>
                    </div>
                  </button>
                `).join('')}
              </div>
            </div>
          </div>
        </div>
      `;
      
      document.body.insertAdjacentHTML('beforeend', modalHtml);
      
      // Event listeners para seleccionar corredor
      document.querySelectorAll('.broker-option').forEach(btn => {
        btn.addEventListener('click', async () => {
          const brokerId = btn.dataset.brokerId;
          await this.assignBrokerToProperty(propId, brokerId);
          document.getElementById('assignBrokerModal').remove();
        });
      });
      
      // Cerrar al hacer click fuera
      document.getElementById('assignBrokerModal').addEventListener('click', (e) => {
        if (e.target.id === 'assignBrokerModal') e.target.remove();
      });
      
    } catch (error) {
      console.error('Error en showAssignBrokerPopup:', error);
      showNotification('Error al mostrar corredores', 'error');
    }
  }

  async assignBrokerToProperty(propId, brokerId) {
    try {
      const token = authService.getToken();
      
      const response = await fetch(`${API_CONFIG.BASE_URL}/propiedades/${propId}/asignar-corredor`, {
        method: 'PATCH',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ corredor_id: parseInt(brokerId) })
      });
      
      if (!response.ok) {
        throw new Error('Error al asignar corredor');
      }
      
      showNotification('✅ Corredor asignado exitosamente', 'success');
      
      // Recargar las propiedades
      this.renderPropertiesPage();
      
    } catch (error) {
      console.error('Error asignando corredor:', error);
      showNotification('❌ Error al asignar corredor', 'error');
    }
  }

  setupUserMenu() {
    console.log('🎯 Configurando menú de usuario...');
    console.log('userMenuBtn:', this.userMenuBtn);
    console.log('userMenu:', this.userMenu);
    
    if (!this.userMenuBtn || !this.userMenu) {
      console.error('❌ Elementos del menú no encontrados');
      return;
    }
    
    // ✅ Toggle dropdown con soporte para touch
    const toggleMenu = (e) => {
      e.preventDefault();
      e.stopPropagation();
      console.log('🖱️ Toggle menú clickeado');
      this.userMenu.classList.toggle('active');
      console.log('Menu active:', this.userMenu.classList.contains('active'));
    };
    
    this.userMenuBtn.addEventListener('click', toggleMenu);
    this.userMenuBtn.addEventListener('touchend', toggleMenu); // ✅ Soporte móvil

    // ✅ Cerrar al hacer click/touch fuera
    const closeMenu = (e) => {
      if (!this.userMenu.contains(e.target)) {
        this.userMenu.classList.remove('active');
      }
    };
    
    document.addEventListener('click', closeMenu);
    document.addEventListener('touchend', closeMenu); // ✅ Soporte móvil
    
    console.log('✅ Menú de usuario configurado');
  }

  setupLogout() {
    this.logoutBtn.addEventListener('click', (e) => {
      e.preventDefault();

      if (confirm('¿Estás seguro que deseas cerrar sesión?')) {
        authService.logout();
      }
    });
  }

  /**
   * 🔧 Vista de Mantenimientos (Admin)
   */
  getMantenimientosContent() {
    return `
      <div class="tab-header">
        <h2>Mantenimientos del Sistema</h2>
        <p class="tab-subtitle">Gestiona las configuraciones y catálogos del sistema</p>
      </div>

      <div class="maintenance-grid">
        <div class="maintenance-card">
          ${this.getIcon('building')}
          <h3>Tipos de Inmuebles</h3>
          <p>Gestionar catálogo de tipos de propiedades</p>
          <button class="btn btn-outline btn-sm">Administrar</button>
        </div>
        
        <div class="maintenance-card">
          ${this.getIcon('map')}
          <h3>Distritos</h3>
          <p>Gestionar ubicaciones y zonas</p>
          <button class="btn btn-outline btn-sm">Administrar</button>
        </div>
        
        <div class="maintenance-card">
          ${this.getIcon('settings')}
          <h3>Características</h3>
          <p>Administrar características de propiedades</p>
          <button class="btn btn-outline btn-sm">Administrar</button>
        </div>
        
        <div class="maintenance-card">
          ${this.getIcon('users')}
          <h3>Perfiles</h3>
          <p>Configurar perfiles y permisos</p>
          <button class="btn btn-outline btn-sm">Administrar</button>
        </div>
      </div>
    `;
  }

  /**
   * ✅ Vista de Aprobaciones (Admin)
   */
  getAprobacionesContent() {
    return `
      <div class="tab-header">
        <h2>Aprobaciones Pendientes</h2>
        <p class="tab-subtitle">Revisa y aprueba solicitudes de suscripciones y propiedades</p>
      </div>

      <div class="approvals-section">
        <div class="approvals-stats">
          <div class="stat-card">
            <div class="stat-icon">${this.getIcon('clock')}</div>
            <div class="stat-info">
              <span class="stat-value">12</span>
              <span class="stat-label">Pendientes</span>
            </div>
          </div>
          <div class="stat-card">
            <div class="stat-icon">${this.getIcon('check-circle')}</div>
            <div class="stat-info">
              <span class="stat-value">45</span>
              <span class="stat-label">Aprobadas Hoy</span>
            </div>
          </div>
        </div>

        <div class="empty-state">
          ${this.getIcon('check-circle')}
          <h3>No hay aprobaciones pendientes</h3>
          <p>Todas las solicitudes han sido procesadas</p>
        </div>
      </div>
    `;
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
      'map': '<svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"></path><circle cx="12" cy="10" r="3"></circle></svg>',
      'check-circle': '<svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path><polyline points="22 4 12 14.01 9 11.01"></polyline></svg>'
    };
    return icons[type] || '';
  }
}

// Inicializar cuando el DOM esté listo
document.addEventListener('DOMContentLoaded', () => {
  new Dashboard();
});

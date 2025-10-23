/**
 * 📊 Dashboard Home Tab - Tab principal con estadísticas
 * Archivo: tabs/dashboard-home/dashboard-home.js
 * Líneas: ~450 (necesario por complejidad de 3 dashboards)
 * EXTRAÍDO DE: dashboard.js líneas 371-902
 */

class DashboardHomeTab {
  constructor(app) {
    this.app = app;
    this.dashboardStats = null;
  }

  /**
   * Renderizar tab
   */
  async render() {
    try {
      const perfilId = this.app.currentUser.perfil_id;
      return await this.getDashboardContent(perfilId);
    } catch (error) {
      console.error('❌ Error rendering dashboard home:', error);
      return this.getErrorContent(error);
    }
  }

  /**
   * Obtener contenido del dashboard según perfil
   */
  async getDashboardContent(perfilId) {
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

  /**
   * 📊 Dashboard para Demandante (perfil 1)
   */
  async getDemandanteDashboard() {
    try {
      const currentYear = new Date().getFullYear();
      const stats = await this.getDashboardStats(currentYear);

      console.log('📊 Dashboard Demandante Stats:', stats);

      return `
        <h2 style="color: var(--azul-corporativo); margin-bottom: var(--spacing-xl);">
          Dashboard - ${this.app.currentUser?.nombre || 'Usuario'}
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
        ${stats.resumen.total_busquedas > 0 && Object.keys(stats.busquedas.por_tipo_inmueble || {}).length > 0 ?
          Charts.generatePieChart(stats.busquedas.por_tipo_inmueble, {
            title: '🔍 Búsquedas por Tipo de Inmueble',
            size: 320
          })
        : ''}

        <!-- Gráfico: Favoritos por Tipo de Inmueble -->
        ${stats.resumen.total_favoritos > 0 && Object.keys(stats.favoritos.por_tipo_inmueble || {}).length > 0 ?
          Charts.generatePieChart(stats.favoritos.por_tipo_inmueble, {
            title: '❤️ Favoritos por Tipo de Inmueble',
            size: 320,
            colors: ['#ef4444', '#f59e0b', '#10b981', '#0066CC', '#8b5cf6', '#ec4899']
          })
        : ''}

        <!-- Gráfico: Búsquedas por Distrito -->
        ${stats.resumen.total_busquedas > 0 && Object.keys(stats.busquedas.por_distrito || {}).length > 0 ?
          Charts.generateVerticalBarChart(stats.busquedas.por_distrito, {
            title: '📍 Búsquedas por Distrito',
            height: 350,
            colors: ['#0066CC', '#10b981', '#f59e0b', '#8b5cf6', '#ef4444', '#06b6d4', '#ec4899', '#14b8a6']
          })
        : ''}

        <!-- Gráfico: Favoritos por Distrito -->
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

  /**
   * 📊 Dashboard para Ofertante (perfil 2)
   */
  async getOfertanteDashboard() {
    try {
      const currentYear = new Date().getFullYear();
      const stats = await this.getDashboardStats(currentYear);

      console.log('📊 Dashboard Ofertante Stats:', stats);

      return `
        <h2 style="color: var(--azul-corporativo); margin-bottom: var(--spacing-xl);">
          Dashboard - ${this.app.currentUser?.nombre || 'Usuario'}
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

          <!-- Cerrados Ganados -->
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
          ${Object.keys(stats.propiedades.por_tipo_inmueble || {}).length > 0 ?
            Charts.generatePieChart(stats.propiedades.por_tipo_inmueble, {
              title: '🏢 Propiedades por Tipo de Inmueble',
              size: 320,
              colors: ['#0066CC', '#10b981', '#f59e0b', '#8b5cf6', '#ef4444', '#06b6d4']
            })
          : ''}

          <!-- Gráfico: Propiedades por Distrito -->
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

  /**
   * 📊 Dashboard para Admin (perfil 4)
   */
  async getAdminDashboard() {
    try {
      const currentYear = new Date().getFullYear();
      const stats = await this.getDashboardStats(currentYear, null, null, 4);

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
          </div>

          <!-- KPIs principales -->
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
      return `
        <div class="empty-state">
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"></path>
            <line x1="12" y1="9" x2="12" y2="13"></line>
            <line x1="12" y1="17" x2="12.01" y2="17"></line>
          </svg>
          <h3>No se pudieron cargar las estadísticas</h3>
          <p>El servicio respondió con error. Puedes intentar nuevamente más tarde.</p>
          <div style="margin-top: 12px; display:flex; gap:8px; justify-content:center;">
            <button class="btn btn-primary" onclick="window.dashboardApp.router.navigate('dashboard')">Reintentar</button>
          </div>
        </div>
      `;
    }
  }

  /**
   * Placeholder para perfiles sin dashboard específico
   */
  getPlaceholderDashboard(perfilId) {
    return `
      <div class="empty-state">
        <h3>Dashboard no disponible</h3>
        <p>No hay un dashboard configurado para el perfil ${perfilId}</p>
      </div>
    `;
  }

  /**
   * Contenido de error
   */
  getErrorContent(error) {
    return `
      <div class="empty-state">
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"></path>
          <line x1="12" y1="9" x2="12" y2="13"></line>
          <line x1="12" y1="17" x2="12.01" y2="17"></line>
        </svg>
        <h3>Error al cargar contenido</h3>
        <p>${error.message || 'Por favor, intenta nuevamente.'}</p>
      </div>
    `;
  }

  /**
   * Obtener iconos SVG
   */
  getIcon(type) {
    const icons = {
      'search': '<svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="11" cy="11" r="8"></circle><path d="m21 21-4.35-4.35"></path></svg>',
      'heart': '<svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"></path></svg>',
      'building': '<svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"></path><polyline points="9 22 9 12 15 12 15 22"></polyline></svg>',
      'map': '<svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"></path><circle cx="12" cy="10" r="3"></circle></svg>',
      'chart': '<svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="12" y1="20" x2="12" y2="10"></line><line x1="18" y1="20" x2="18" y2="4"></line><line x1="6" y1="20" x2="6" y2="16"></line></svg>',
      'users': '<svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path><circle cx="9" cy="7" r="4"></circle><path d="M23 21v-2a4 4 0 0 0-3-3.87"></path><path d="M16 3.13a4 4 0 0 1 0 7.75"></path></svg>',
      'briefcase': '<svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="2" y="7" width="20" height="14" rx="2" ry="2"></rect><path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16"></path></svg>'
    };
    return icons[type] || '';
  }

  /**
   * Lifecycle hook: después de renderizar
   */
  async afterRender() {
    console.log('✅ DashboardHomeTab renderizado');
  }

  /**
   * Lifecycle hook: antes de destruir
   */
  async destroy() {
    console.log('🗑️ Destruyendo DashboardHomeTab');
    this.dashboardStats = null;
  }
}

// Exponer globalmente para el router
window.DashboardHomeTab = DashboardHomeTab;

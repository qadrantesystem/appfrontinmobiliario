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
    } else if (perfilIdNum === 3) {
      return await this.getCorredorDashboard();
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
   * 📊 Dashboard para Corredor (perfil 3)
   * Combina características de Ofertante y Demandante
   */
  async getCorredorDashboard() {
    try {
      const currentYear = new Date().getFullYear();
      const stats = await this.getDashboardStats(currentYear);

      console.log('📊 Dashboard Corredor Stats:', stats);

      // Función para formatear números
      const formatNumber = (num) => {
        if (num >= 1000000) return (num / 1000000).toFixed(1) + 'M';
        if (num >= 1000) return (num / 1000).toFixed(1) + 'K';
        return num ? num.toString() : '0';
      };

      // Calcular el mes más activo
      const getMesActivo = () => {
        if (!stats.propiedades || !stats.propiedades.por_mes) return 'N/A';
        const meses = stats.propiedades.por_mes;
        let maxMes = '';
        let maxCount = 0;
        for (const [mes, count] of Object.entries(meses)) {
          if (count > maxCount) {
            maxCount = count;
            maxMes = mes;
          }
        }
        const mesesNombres = ['', 'Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic'];
        return mesesNombres[parseInt(maxMes)] || 'N/A';
      };

      return `
        <h2 style="color: var(--azul-corporativo); margin-bottom: var(--spacing-xl);">
          Dashboard Corredor - ${this.app.currentUser?.nombre || 'Usuario'}
        </h2>

        <!-- KPIs Grid Principal -->
        <div class="kpis-grid">
          <!-- Total Propiedades -->
          <div class="kpi-card">
            <div class="kpi-header">
              <div class="kpi-icon">${this.getIcon('building')}</div>
              <span class="kpi-title">Total Propiedades</span>
            </div>
            <div class="kpi-value">${stats.resumen.total_propiedades}</div>
            <div class="kpi-subtitle">En cartera</div>
          </div>

          <!-- Propiedades Activas -->
          <div class="kpi-card">
            <div class="kpi-header">
              <div class="kpi-icon">${this.getIcon('checkCircle')}</div>
              <span class="kpi-title">Activas</span>
            </div>
            <div class="kpi-value">${stats.propiedades?.por_estado?.activo || 0}</div>
            <div class="kpi-subtitle">Publicadas</div>
          </div>

          <!-- Valor Total -->
          <div class="kpi-card">
            <div class="kpi-header">
              <div class="kpi-icon">${this.getIcon('dollar')}</div>
              <span class="kpi-title">Valor Total</span>
            </div>
            <div class="kpi-value">$${formatNumber(stats.propiedades?.valor_total || 0)}</div>
            <div class="kpi-subtitle">Portafolio</div>
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
        </div>

        <!-- Sección de Búsquedas y Favoritos -->
        <div class="dashboard-sections">
          <!-- Búsquedas por Distrito -->
          <div class="dashboard-section">
            <h3 class="section-title">
              ${this.getIcon('map')} Búsquedas por Distrito
            </h3>
            <div class="district-list">
              ${stats.busquedas?.por_distrito && Object.keys(stats.busquedas.por_distrito).length > 0 ? 
                Object.entries(stats.busquedas.por_distrito)
                  .sort((a, b) => b[1] - a[1])
                  .slice(0, 5)
                  .map(([distrito, count]) => `
                    <div class="district-item">
                      <span class="district-name">${distrito}</span>
                      <span class="district-count">${count} búsquedas</span>
                    </div>
                  `).join('') :
                '<div class="empty-message">No hay búsquedas registradas</div>'
              }
            </div>
          </div>

          <!-- Favoritos por Distrito -->
          <div class="dashboard-section">
            <h3 class="section-title">
              ${this.getIcon('heart')} Favoritos por Distrito
            </h3>
            <div class="district-list">
              ${stats.favoritos?.por_distrito && Object.keys(stats.favoritos.por_distrito).length > 0 ?
                Object.entries(stats.favoritos.por_distrito)
                  .sort((a, b) => b[1] - a[1])
                  .slice(0, 5)
                  .map(([distrito, count]) => `
                    <div class="district-item">
                      <span class="district-name">${distrito}</span>
                      <span class="district-count">${count} favoritos</span>
                    </div>
                  `).join('') :
                '<div class="empty-message">No hay favoritos registrados</div>'
              }
            </div>
          </div>
        </div>

        <!-- Resumen de Propiedades por Tipo -->
        <div class="dashboard-section" style="margin-top: var(--spacing-xl);">
          <h3 class="section-title">
            ${this.getIcon('grid')} Propiedades por Tipo
          </h3>
          <div class="type-grid">
            ${stats.propiedades?.por_tipo_inmueble && Object.keys(stats.propiedades.por_tipo_inmueble).length > 0 ?
              Object.entries(stats.propiedades.por_tipo_inmueble)
                .map(([tipo, count]) => `
                  <div class="type-card">
                    <div class="type-icon">${this.getPropertyIcon(tipo)}</div>
                    <div class="type-name">${tipo}</div>
                    <div class="type-count">${count}</div>
                  </div>
                `).join('') :
              '<div class="empty-message">No hay propiedades registradas</div>'
            }
          </div>
        </div>

        <!-- Stats Adicionales -->
        <div class="stats-row" style="margin-top: var(--spacing-xl);">
          <div class="stat-card">
            <span class="stat-label">Mes más activo</span>
            <span class="stat-value">${getMesActivo()}</span>
          </div>
          <div class="stat-card">
            <span class="stat-label">Precio promedio</span>
            <span class="stat-value">$${formatNumber(stats.propiedades?.precio_promedio || 0)}</span>
          </div>
          <div class="stat-card">
            <span class="stat-label">Búsquedas este año</span>
            <span class="stat-value">${stats.resumen.total_busquedas}</span>
          </div>
        </div>

        <style>
          .dashboard-sections {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
            gap: var(--spacing-xl);
            margin-top: var(--spacing-xl);
          }

          .dashboard-section {
            background: white;
            border-radius: var(--border-radius);
            padding: var(--spacing-lg);
            box-shadow: var(--shadow-sm);
          }

          .section-title {
            color: var(--azul-corporativo);
            font-size: 1.1rem;
            font-weight: 600;
            margin-bottom: var(--spacing-md);
            display: flex;
            align-items: center;
            gap: var(--spacing-sm);
          }

          .district-list {
            display: flex;
            flex-direction: column;
            gap: var(--spacing-sm);
          }

          .district-item {
            display: flex;
            justify-content: space-between;
            align-items: center;
            padding: var(--spacing-sm);
            background: var(--gray-50);
            border-radius: var(--border-radius-sm);
          }

          .district-name {
            font-weight: 500;
            color: var(--text-primary);
          }

          .district-count {
            color: var(--text-secondary);
            font-size: 0.9rem;
          }

          .type-grid {
            display: grid;
            grid-template-columns: repeat(auto-fill, minmax(120px, 1fr));
            gap: var(--spacing-md);
          }

          .type-card {
            text-align: center;
            padding: var(--spacing-md);
            background: var(--gray-50);
            border-radius: var(--border-radius-sm);
          }

          .type-icon {
            font-size: 1.5rem;
            margin-bottom: var(--spacing-xs);
          }

          .type-name {
            font-size: 0.9rem;
            color: var(--text-secondary);
            margin-bottom: var(--spacing-xs);
          }

          .type-count {
            font-size: 1.2rem;
            font-weight: 600;
            color: var(--azul-corporativo);
          }

          .stats-row {
            display: flex;
            gap: var(--spacing-lg);
            flex-wrap: wrap;
          }

          .stat-card {
            flex: 1;
            min-width: 150px;
            background: white;
            border-radius: var(--border-radius);
            padding: var(--spacing-md);
            box-shadow: var(--shadow-sm);
            display: flex;
            flex-direction: column;
            align-items: center;
            text-align: center;
          }

          .stat-label {
            color: var(--text-secondary);
            font-size: 0.9rem;
            margin-bottom: var(--spacing-xs);
          }

          .stat-value {
            color: var(--azul-corporativo);
            font-size: 1.5rem;
            font-weight: 600;
          }

          .empty-message {
            text-align: center;
            padding: var(--spacing-lg);
            color: var(--text-secondary);
            font-style: italic;
          }

          @media (max-width: 768px) {
            .dashboard-sections {
              grid-template-columns: 1fr;
            }

            .type-grid {
              grid-template-columns: repeat(auto-fill, minmax(100px, 1fr));
            }
          }
        </style>
      `;
    } catch (error) {
      console.error('❌ Error cargando dashboard corredor:', error);
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

      console.log('📊 Dashboard Admin Stats:', stats);

      // Función para formatear números grandes
      const formatNumber = (num) => {
        if (num >= 1000000) return (num / 1000000).toFixed(1) + 'M';
        if (num >= 1000) return (num / 1000).toFixed(1) + 'K';
        return num ? num.toString() : '0';
      };

      // Calcular propiedades sin corredor
      const propiedadesSinCorredor = stats.propiedades?.sin_corredor || 
        (stats.propiedades?.total - (stats.propiedades?.con_corredor || 0)) || 0;

      return `
        <div class="admin-dashboard">
          <div class="dashboard-hero" style="display: flex; justify-content: space-between; align-items: center; margin-bottom: var(--spacing-xl);">
            <div>
              <h1 style="color: var(--azul-corporativo); font-size: 2rem; margin: 0;">
                Panel de Administración
              </h1>
              <p style="color: var(--gris-medio); margin-top: 0.5rem;">
                Vista general del sistema inmobiliario - ${currentYear}
              </p>
            </div>
          </div>

          <!-- KPIs principales -->
          <div class="kpis-grid" style="grid-template-columns: repeat(auto-fit, minmax(250px, 1fr)); gap: var(--spacing-lg);">
            <!-- Total Propiedades -->
            <div class="kpi-card" style="border-left: 4px solid var(--azul-corporativo);">
              <div class="kpi-header">
                <div class="kpi-icon">${this.getIcon('building')}</div>
                <span class="kpi-title">Total Propiedades</span>
              </div>
              <div class="kpi-value">${stats.propiedades?.total || stats.resumen?.total_propiedades || 0}</div>
              <div class="kpi-subtitle">${stats.propiedades?.por_estado?.activo || 0} activas</div>
            </div>

            <!-- Total Búsquedas -->
            <div class="kpi-card" style="border-left: 4px solid #10b981;">
              <div class="kpi-header">
                <div class="kpi-icon" style="color: #10b981;">${this.getIcon('search')}</div>
                <span class="kpi-title">Total Búsquedas</span>
              </div>
              <div class="kpi-value" style="color: #10b981;">${formatNumber(stats.resumen?.total_busquedas || stats.busquedas?.total || 0)}</div>
              <div class="kpi-subtitle">Este año ${currentYear}</div>
            </div>

            <!-- Propiedades Sin Corredor -->
            <div class="kpi-card" style="border-left: 4px solid #ef4444;">
              <div class="kpi-header">
                <div class="kpi-icon" style="color: #ef4444;">⚠️</div>
                <span class="kpi-title">Sin Corredor</span>
              </div>
              <div class="kpi-value" style="color: #ef4444;">${propiedadesSinCorredor}</div>
              <div class="kpi-subtitle">Requieren asignación</div>
            </div>

            <!-- Valor Cartera -->
            <div class="kpi-card" style="border-left: 4px solid var(--dorado);">
              <div class="kpi-header">
                <div class="kpi-icon" style="color: var(--dorado);">${this.getIcon('dollar')}</div>
                <span class="kpi-title">Valor Cartera</span>
              </div>
              <div class="kpi-value" style="color: var(--dorado);">$${formatNumber(stats.propiedades?.valor_total || 0)}</div>
              <div class="kpi-subtitle">Promedio: $${formatNumber(stats.propiedades?.precio_promedio || 0)}</div>
            </div>
          </div>

          <!-- Sección de Búsquedas por Distrito -->
          <div style="margin-top: var(--spacing-xl); background: white; border-radius: var(--border-radius); padding: var(--spacing-lg); box-shadow: var(--shadow-sm);">
            <h3 style="color: var(--azul-corporativo); margin-bottom: var(--spacing-lg); display: flex; align-items: center; gap: var(--spacing-sm);">
              ${this.getIcon('map')} Búsquedas por Distrito
            </h3>
            <div style="display: grid; grid-template-columns: repeat(auto-fill, minmax(200px, 1fr)); gap: var(--spacing-md);">
              ${stats.busquedas?.por_distrito && Object.keys(stats.busquedas.por_distrito).length > 0 ?
                Object.entries(stats.busquedas.por_distrito)
                  .sort((a, b) => b[1] - a[1])
                  .slice(0, 10)
                  .map(([distrito, count]) => {
                    const porcentaje = ((count / (stats.busquedas?.total || stats.resumen?.total_busquedas || 1)) * 100).toFixed(1);
                    return `
                      <div style="background: var(--gray-50); padding: var(--spacing-md); border-radius: var(--border-radius-sm); border-left: 3px solid var(--azul-corporativo);">
                        <div style="display: flex; justify-content: space-between; align-items: center;">
                          <span style="font-weight: 600; color: var(--text-primary);">${distrito}</span>
                          <span style="background: var(--azul-corporativo); color: white; padding: 2px 8px; border-radius: 12px; font-size: 0.85rem;">${count}</span>
                        </div>
                        <div style="margin-top: 4px;">
                          <div style="background: #e5e7eb; height: 4px; border-radius: 2px; overflow: hidden;">
                            <div style="background: var(--azul-corporativo); height: 100%; width: ${porcentaje}%; transition: width 0.3s ease;"></div>
                          </div>
                          <span style="font-size: 0.75rem; color: var(--text-secondary);">${porcentaje}% del total</span>
                        </div>
                      </div>
                    `;
                  }).join('') :
                '<div style="text-align: center; color: var(--text-secondary); padding: var(--spacing-lg);">No hay datos de búsquedas por distrito</div>'
              }
            </div>
          </div>

          <!-- Pipeline CRM y Asignación de Corredores -->
          <div style="display: grid; grid-template-columns: 1fr 1fr; gap: var(--spacing-xl); margin-top: var(--spacing-xl);">
            <!-- Pipeline CRM -->
            <div style="background: white; border-radius: var(--border-radius); padding: var(--spacing-lg); box-shadow: var(--shadow-sm);">
              <h3 style="color: var(--azul-corporativo); margin-bottom: var(--spacing-lg);">
                📊 Pipeline de Ventas
              </h3>
              <div style="display: flex; flex-direction: column; gap: var(--spacing-sm);">
                ${['lead', 'contacto', 'propuesta', 'negociacion', 'pre_cierre', 'cerrado_ganado', 'cerrado_perdido'].map(estado => {
                  const count = stats.propiedades?.por_estado_crm?.[estado] || 0;
                  const colors = {
                    lead: '#6b7280',
                    contacto: '#10b981',
                    propuesta: '#f59e0b',
                    negociacion: '#8b5cf6',
                    pre_cierre: '#6366f1',
                    cerrado_ganado: '#22c55e',
                    cerrado_perdido: '#ef4444'
                  };
                  const labels = {
                    lead: 'Lead',
                    contacto: 'Contacto',
                    propuesta: 'Propuesta',
                    negociacion: 'Negociación',
                    pre_cierre: 'Pre-Cierre',
                    cerrado_ganado: '✅ Ganado',
                    cerrado_perdido: '❌ Perdido'
                  };
                  return `
                    <div style="display: flex; align-items: center; justify-content: space-between; padding: var(--spacing-sm); background: ${colors[estado]}10; border-left: 3px solid ${colors[estado]}; border-radius: 4px;">
                      <span style="font-weight: 500; color: ${colors[estado]};">${labels[estado]}</span>
                      <span style="font-size: 1.2rem; font-weight: 700; color: ${colors[estado]};">${count}</span>
                    </div>
                  `;
                }).join('')}
              </div>
            </div>

            <!-- Estado de Asignación de Corredores -->
            <div style="background: white; border-radius: var(--border-radius); padding: var(--spacing-lg); box-shadow: var(--shadow-sm);">
              <h3 style="color: var(--azul-corporativo); margin-bottom: var(--spacing-lg);">
                👥 Asignación de Corredores
              </h3>
              <div style="display: flex; flex-direction: column; gap: var(--spacing-lg);">
                <!-- Gráfico circular simple -->
                <div style="display: flex; align-items: center; justify-content: center;">
                  <div style="position: relative; width: 150px; height: 150px;">
                    <svg viewBox="0 0 100 100" style="transform: rotate(-90deg);">
                      <circle cx="50" cy="50" r="40" fill="none" stroke="#e5e7eb" stroke-width="10"></circle>
                      <circle cx="50" cy="50" r="40" fill="none" stroke="#10b981" stroke-width="10" 
                        stroke-dasharray="${((stats.propiedades?.con_corredor || 0) / (stats.propiedades?.total || 1)) * 251.2} 251.2"></circle>
                    </svg>
                    <div style="position: absolute; top: 50%; left: 50%; transform: translate(-50%, -50%); text-align: center;">
                      <div style="font-size: 1.5rem; font-weight: 700; color: var(--azul-corporativo);">
                        ${Math.round(((stats.propiedades?.con_corredor || 0) / (stats.propiedades?.total || 1)) * 100)}%
                      </div>
                      <div style="font-size: 0.75rem; color: var(--text-secondary);">Asignadas</div>
                    </div>
                  </div>
                </div>
                
                <!-- Detalles -->
                <div style="display: grid; grid-template-columns: 1fr 1fr; gap: var(--spacing-md);">
                  <div style="text-align: center; padding: var(--spacing-md); background: #10b98110; border-radius: var(--border-radius-sm);">
                    <div style="font-size: 2rem; font-weight: 700; color: #10b981;">${stats.propiedades?.con_corredor || ((stats.propiedades?.total || 0) - propiedadesSinCorredor)}</div>
                    <div style="font-size: 0.85rem; color: var(--text-secondary);">Con Corredor</div>
                  </div>
                  <div style="text-align: center; padding: var(--spacing-md); background: #ef444410; border-radius: var(--border-radius-sm);">
                    <div style="font-size: 2rem; font-weight: 700; color: #ef4444;">${propiedadesSinCorredor}</div>
                    <div style="font-size: 0.85rem; color: var(--text-secondary);">Sin Asignar</div>
                  </div>
                </div>
                
                ${propiedadesSinCorredor > 0 ? `
                  <div style="background: #fef2f2; border: 1px solid #fecaca; border-radius: var(--border-radius-sm); padding: var(--spacing-md);">
                    <div style="display: flex; align-items: center; gap: var(--spacing-sm); color: #dc2626;">
                      <span>⚠️</span>
                      <span style="font-weight: 500;">Acción Requerida</span>
                    </div>
                    <p style="font-size: 0.85rem; color: #7f1d1d; margin: 4px 0 0 0;">
                      Hay ${propiedadesSinCorredor} propiedades que necesitan un corredor asignado.
                    </p>
                  </div>
                ` : `
                  <div style="background: #f0fdf4; border: 1px solid #bbf7d0; border-radius: var(--border-radius-sm); padding: var(--spacing-md);">
                    <div style="display: flex; align-items: center; gap: var(--spacing-sm); color: #16a34a;">
                      <span>✅</span>
                      <span style="font-weight: 500;">Todo en orden</span>
                    </div>
                    <p style="font-size: 0.85rem; color: #14532d; margin: 4px 0 0 0;">
                      Todas las propiedades tienen corredor asignado.
                    </p>
                  </div>
                `}
              </div>
            </div>
          </div>

          <!-- Métricas adicionales -->
          <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: var(--spacing-lg); margin-top: var(--spacing-xl);">
            <!-- Total Usuarios -->
            <div style="background: white; border-radius: var(--border-radius); padding: var(--spacing-lg); box-shadow: var(--shadow-sm); text-align: center;">
              <div style="font-size: 2.5rem; color: var(--azul-corporativo);">${this.getIcon('users')}</div>
              <div style="font-size: 2rem; font-weight: 700; color: var(--text-primary); margin: var(--spacing-sm) 0;">${stats.usuarios?.total || 0}</div>
              <div style="color: var(--text-secondary);">Usuarios Registrados</div>
            </div>

            <!-- Favoritos Totales -->
            <div style="background: white; border-radius: var(--border-radius); padding: var(--spacing-lg); box-shadow: var(--shadow-sm); text-align: center;">
              <div style="font-size: 2.5rem; color: #ef4444;">${this.getIcon('heart')}</div>
              <div style="font-size: 2rem; font-weight: 700; color: var(--text-primary); margin: var(--spacing-sm) 0;">${stats.resumen?.total_favoritos || 0}</div>
              <div style="color: var(--text-secondary);">Total Favoritos</div>
            </div>

            <!-- Tipos de Inmuebles -->
            <div style="background: white; border-radius: var(--border-radius); padding: var(--spacing-lg); box-shadow: var(--shadow-sm); text-align: center;">
              <div style="font-size: 2.5rem; color: #8b5cf6;">${this.getIcon('grid')}</div>
              <div style="font-size: 2rem; font-weight: 700; color: var(--text-primary); margin: var(--spacing-sm) 0;">${Object.keys(stats.propiedades?.por_tipo_inmueble || {}).length}</div>
              <div style="color: var(--text-secondary);">Tipos de Inmueble</div>
            </div>

            <!-- Distritos Activos -->
            <div style="background: white; border-radius: var(--border-radius); padding: var(--spacing-lg); box-shadow: var(--shadow-sm); text-align: center;">
              <div style="font-size: 2.5rem; color: #06b6d4;">${this.getIcon('map')}</div>
              <div style="font-size: 2rem; font-weight: 700; color: var(--text-primary); margin: var(--spacing-sm) 0;">${Object.keys(stats.propiedades?.por_distrito || {}).length}</div>
              <div style="color: var(--text-secondary);">Distritos con Propiedades</div>
            </div>
          </div>

          <style>
            .admin-dashboard .kpi-card {
              transition: transform 0.2s ease, box-shadow 0.2s ease;
            }
            
            .admin-dashboard .kpi-card:hover {
              transform: translateY(-2px);
              box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
            }

            @media (max-width: 768px) {
              .admin-dashboard > div[style*="grid-template-columns: 1fr 1fr"] {
                grid-template-columns: 1fr !important;
              }
            }
          </style>
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
      'briefcase': '<svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="2" y="7" width="20" height="14" rx="2" ry="2"></rect><path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16"></path></svg>',
      'checkCircle': '<svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path><polyline points="22 4 12 14.01 9 11.01"></polyline></svg>',
      'dollar': '<svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="12" y1="1" x2="12" y2="23"></line><path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"></path></svg>',
      'grid': '<svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="3" width="7" height="7"></rect><rect x="14" y="3" width="7" height="7"></rect><rect x="14" y="14" width="7" height="7"></rect><rect x="3" y="14" width="7" height="7"></rect></svg>'
    };
    return icons[type] || '';
  }

  /**
   * Obtener iconos para tipos de propiedad
   */
  getPropertyIcon(tipo) {
    const tipoLower = tipo.toLowerCase();
    if (tipoLower.includes('casa')) {
      return '🏠';
    } else if (tipoLower.includes('departamento') || tipoLower.includes('apartamento')) {
      return '🏢';
    } else if (tipoLower.includes('terreno') || tipoLower.includes('lote')) {
      return '🏞️';
    } else if (tipoLower.includes('local') || tipoLower.includes('comercial')) {
      return '🏪';
    } else if (tipoLower.includes('oficina')) {
      return '🏛️';
    } else if (tipoLower.includes('bodega') || tipoLower.includes('almacén')) {
      return '🏭';
    } else {
      return '🏘️';
    }
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

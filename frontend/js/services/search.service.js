/**
 * 🔍 Search Service
 * Gestión de búsquedas de propiedades
 */

class SearchService {
  /**
   * Registrar una nueva búsqueda
   * @param {Object} searchFilters - Filtros de la búsqueda
   * @returns {Promise<Object>} - Resultado de la búsqueda
   */
  async registerSearch(searchFilters) {
    try {
      const response = await apiRequest(API_CONFIG.SEARCH.REGISTER, {
        method: 'POST',
        auth: true,
        body: JSON.stringify(searchFilters)
      });

      console.log('✅ Búsqueda registrada:', response);
      return response;
    } catch (error) {
      console.error('❌ Error registrando búsqueda:', error);
      throw error;
    }
  }

  /**
   * Obtener mis búsquedas realizadas
   * @returns {Promise<Object>} - Historial de búsquedas del usuario
   */
  async getMySearches() {
    try {
      const response = await apiRequest(API_CONFIG.SEARCH.MY_SEARCHES, {
        method: 'GET',
        auth: true
      });

      console.log('✅ Búsquedas obtenidas:', response);
      return response;
    } catch (error) {
      console.error('❌ Error obteniendo búsquedas:', error);
      // Si el endpoint no existe (404), devolver array vacío
      if (error.message.includes('Not Found') || error.message.includes('404')) {
        console.warn('⚠️ Endpoint de búsquedas no implementado, usando datos vacíos');
        return { success: true, data: { busquedas: [] } };
      }
      throw error;
    }
  }

  /**
   * Obtener alertas de búsqueda guardadas
   * @returns {Promise<Object>} - Búsquedas guardadas con alertas activas
   */
  async getSearchAlerts() {
    try {
      const response = await apiRequest(API_CONFIG.SEARCH.ALERTS, {
        method: 'GET',
        auth: true
      });

      console.log('✅ Alertas obtenidas:', response);
      return response;
    } catch (error) {
      console.error('❌ Error obteniendo alertas:', error);
      // Si el endpoint no existe (404), devolver array vacío
      if (error.message.includes('Not Found') || error.message.includes('404')) {
        console.warn('⚠️ Endpoint de alertas no implementado, usando datos vacíos');
        return { success: true, data: { alertas: [] } };
      }
      throw error;
    }
  }

  /**
   * Crear una nueva alerta de búsqueda
   * @param {Object} alertData - Datos de la alerta (criterios y frecuencia)
   * @returns {Promise<Object>} - Alerta creada
   */
  async createSearchAlert(alertData) {
    try {
      const response = await apiRequest(API_CONFIG.SEARCH.CREATE_ALERT, {
        method: 'POST',
        auth: true,
        body: JSON.stringify(alertData)
      });

      console.log('✅ Alerta creada:', response);
      return response;
    } catch (error) {
      console.error('❌ Error creando alerta:', error);
      throw error;
    }
  }

  /**
   * Calcular estadísticas de búsquedas para el dashboard
   * @param {number} planLimit - Límite de búsquedas según el plan (default: 10)
   * @returns {Promise<Object>} - Estadísticas calculadas
   */
  async getSearchStats(planLimit = 10) {
    try {
      const mySearches = await this.getMySearches();
      const alerts = await this.getSearchAlerts();

      // Calcular búsquedas realizadas en el período actual (mes actual)
      const now = new Date();
      const currentMonth = now.getMonth();
      const currentYear = now.getFullYear();

      const searchesThisMonth = mySearches.data?.busquedas?.filter(search => {
        const searchDate = new Date(search.fecha_busqueda);
        return searchDate.getMonth() === currentMonth &&
               searchDate.getFullYear() === currentYear;
      }) || [];

      const searchesPerformed = searchesThisMonth.length;
      const searchesRemaining = Math.max(0, planLimit - searchesPerformed);
      const savedSearches = alerts.data?.alertas?.length || 0;

      // Última actividad
      const lastSearch = mySearches.data?.busquedas?.[0];
      const lastActivity = lastSearch
        ? new Date(lastSearch.fecha_busqueda).toLocaleDateString('es-PE')
        : 'Sin actividad';

      return {
        searchesPerformed,
        searchesRemaining,
        planLimit,
        savedSearches,
        lastActivity,
        totalSearches: mySearches.data?.busquedas?.length || 0,
        activeAlerts: alerts.data?.alertas?.filter(a => a.activa)?.length || 0
      };
    } catch (error) {
      console.error('❌ Error calculando estadísticas:', error);
      // Retornar valores por defecto en caso de error
      return {
        searchesPerformed: 0,
        searchesRemaining: planLimit,
        planLimit,
        savedSearches: 0,
        lastActivity: 'Sin actividad',
        totalSearches: 0,
        activeAlerts: 0
      };
    }
  }
}

// Crear instancia única (Singleton)
const searchService = new SearchService();
window.searchService = searchService;

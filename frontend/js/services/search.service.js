/**
 * 🔍 Search Service
 * Gestión de búsquedas de propiedades
 */

class SearchService {
  /**
   * Buscar propiedades (modo invitado)
   * @param {Object} filters - Filtros de búsqueda
   * @returns {Promise<Array>} - Lista de propiedades encontradas
   */
  async buscarPropiedades(filters) {
    try {
      console.log('🔍 Buscando propiedades con filtros:', filters);
      
      // Para modo invitado, usamos endpoint público
      const queryParams = new URLSearchParams();
      
      // Agregar filtros a la query
      if (filters.tipo_inmueble_id) {
        queryParams.append('tipo_inmueble_id', filters.tipo_inmueble_id);
      }
      if (filters.transaccion) {
        queryParams.append('transaccion', filters.transaccion);
      }
      if (filters.area) {
        queryParams.append('area_min', filters.area);
      }
      if (filters.presupuesto_compra) {
        queryParams.append('presupuesto_max', filters.presupuesto_compra);
      }
      if (filters.presupuesto_alquiler) {
        queryParams.append('alquiler_max', filters.presupuesto_alquiler);
      }
      if (filters.distritos_ids && filters.distritos_ids.length > 0) {
        queryParams.append('distritos_ids', filters.distritos_ids.join(','));
      }
      
      const url = `${API_CONFIG.BASE_URL}/propiedades/public-search?${queryParams.toString()}`;
      
      const response = await fetch(url, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json'
        }
      });
      
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }
      
      const data = await response.json();
      console.log(`✅ ${data.data?.length || 0} propiedades encontradas`);
      
      return data.data || [];
    } catch (error) {
      console.error('❌ Error buscando propiedades:', error);
      // En caso de error, retornar datos de ejemplo para modo invitado
      console.log('📋 Usando datos de ejemplo para modo invitado');
      return this.getExampleProperties();
    }
  }

  /**
   * Datos de ejemplo para modo invitado
   */
  getExampleProperties() {
    return [
      {
        id: 1,
        codigo: 'PROP001',
        titulo: 'Departamento en Surco',
        descripcion: 'Hermoso departamento con 3 habitaciones, 2 baños, cocina integral y balcón.',
        distrito: 'Surco',
        area: 120,
        precio: 250000,
        estado_nombre: 'Disponible',
        imagenes: [
          { url: 'https://images.unsplash.com/photo-1512917774080-9991f1c4c750?w=800&h=600&fit=crop', descripcion: 'Sala de estar' }
        ]
      },
      {
        id: 2,
        codigo: 'PROP002',
        titulo: 'Casa en Miraflores',
        descripcion: 'Amplia casa con jardín, piscina y 4 habitaciones. Excelente ubicación.',
        distrito: 'Miraflores',
        area: 200,
        precio: 450000,
        estado_nombre: 'Disponible',
        imagenes: [
          { url: 'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?w=800&h=600&fit=crop', descripcion: 'Fachada' }
        ]
      },
      {
        id: 3,
        codigo: 'PROP003',
        titulo: 'Oficina en San Isidro',
        descripcion: 'Moderna oficina en zona corporativa, ideal para empresas.',
        distrito: 'San Isidro',
        area: 80,
        precio: 180000,
        estado_nombre: 'Disponible',
        imagenes: [
          { url: 'https://images.unsplash.com/photo-1497366216548-37526070297c?w=800&h=600&fit=crop', descripcion: 'Espacio de trabajo' }
        ]
      }
    ];
  }

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

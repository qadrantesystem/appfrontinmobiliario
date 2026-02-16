/**
 * 🏢 Properties Service
 * Gestión de propiedades inmobiliarias
 */

class PropertiesService {
  /**
   * Listar todas las propiedades (búsqueda pública)
   * @param {Object} filters - Filtros de búsqueda
   * @returns {Promise<Object>} - Lista de propiedades
   */
  async listProperties(filters = {}) {
    try {
      // Construir query params
      const queryParams = new URLSearchParams(filters).toString();
      const endpoint = queryParams
        ? `${API_CONFIG.PROPERTIES.LIST}?${queryParams}`
        : API_CONFIG.PROPERTIES.LIST;

      const response = await apiRequest(endpoint, {
        method: 'GET',
        auth: false // Búsqueda pública
      });

      return response;
    } catch (error) {
      console.error('❌ Error listando propiedades:', error);
      throw error;
    }
  }

  /**
   * Obtener mis propiedades publicadas (solo Ofertante)
   * @returns {Promise<Object>} - Lista de mis propiedades
   */
  async getMyProperties() {
    try {
      const response = await apiRequest(API_CONFIG.PROPERTIES.MY_PROPERTIES, {
        method: 'GET',
        auth: true
      });

      return response;
    } catch (error) {
      console.error('❌ Error obteniendo mis propiedades:', error);
      throw error;
    }
  }

  /**
   * Obtener detalle de una propiedad
   * @param {number} id - ID de la propiedad
   * @returns {Promise<Object>} - Detalle de la propiedad
   */
  async getProperty(id) {
    try {
      const response = await apiRequest(API_CONFIG.PROPERTIES.GET(id), {
        method: 'GET',
        auth: false // Detalle público
      });

      return response;
    } catch (error) {
      console.error('❌ Error obteniendo propiedad:', error);
      throw error;
    }
  }

  /**
   * Crear nueva propiedad con imágenes
   * @param {FormData} formData - Datos de la propiedad con imágenes
   * @returns {Promise<Object>} - Propiedad creada
   */
  async createProperty(formData) {
    try {
      const token = localStorage.getItem('access_token');

      const response = await fetch(
        `${API_CONFIG.BASE_URL}${API_CONFIG.PROPERTIES.CREATE}`,
        {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${token}`
            // NO incluir Content-Type, el navegador lo añade automáticamente con boundary
          },
          body: formData
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.detail || data.message || 'Error creando propiedad');
      }

      return data;
    } catch (error) {
      console.error('❌ Error creando propiedad:', error);
      throw error;
    }
  }

  /**
   * Actualizar propiedad existente
   * @param {number} id - ID de la propiedad
   * @param {Object} propertyData - Datos actualizados
   * @returns {Promise<Object>} - Propiedad actualizada
   */
  async updateProperty(id, propertyData) {
    try {
      const response = await apiRequest(API_CONFIG.PROPERTIES.UPDATE(id), {
        method: 'PUT',
        auth: true,
        body: JSON.stringify(propertyData)
      });

      return response;
    } catch (error) {
      console.error('❌ Error actualizando propiedad:', error);
      throw error;
    }
  }

  /**
   * Eliminar propiedad
   * @param {number} id - ID de la propiedad
   * @returns {Promise<Object>} - Confirmación de eliminación
   */
  async deleteProperty(id) {
    try {
      const response = await apiRequest(API_CONFIG.PROPERTIES.DELETE(id), {
        method: 'DELETE',
        auth: true
      });

      return response;
    } catch (error) {
      console.error('❌ Error eliminando propiedad:', error);
      throw error;
    }
  }

  /**
   * Obtener estadísticas de mis propiedades para el dashboard (Ofertante)
   * @param {number} planLimit - Límite de registros según el plan (default: 5)
   * @returns {Promise<Object>} - Estadísticas calculadas
   */
  async getPropertyStats(planLimit = 5) {
    try {
      const myProperties = await this.getMyProperties();
      const propertiesList = myProperties.data?.propiedades || [];

      // Estadísticas básicas
      const totalPublished = propertiesList.length;
      const registrosRestantes = Math.max(0, planLimit - totalPublished);

      // Agrupar por estado
      const byStatus = propertiesList.reduce((acc, prop) => {
        const estado = prop.estado || 'borrador';
        acc[estado] = (acc[estado] || 0) + 1;
        return acc;
      }, {});

      const publicadas = byStatus['publicado'] || 0;
      const borradores = byStatus['borrador'] || 0;
      const pausadas = byStatus['pausado'] || 0;
      const vendidas = byStatus['vendido'] || 0;

      // Total de vistas (sumar vistas de todas las propiedades)
      const totalVistas = propertiesList.reduce((sum, prop) =>
        sum + (prop.vistas || 0), 0
      );

      // Total de contactos (sumar contactos de todas las propiedades)
      const totalContactos = propertiesList.reduce((sum, prop) =>
        sum + (prop.contactos || 0), 0
      );

      // Propiedad más vista
      const sortedByViews = [...propertiesList].sort((a, b) =>
        (b.vistas || 0) - (a.vistas || 0)
      );
      const masVista = sortedByViews[0];

      // Última publicación
      const sortedByDate = [...propertiesList].sort((a, b) =>
        new Date(b.fecha_publicacion) - new Date(a.fecha_publicacion)
      );
      const ultimaPublicacion = sortedByDate[0];
      const ultimaPublicacionFecha = ultimaPublicacion
        ? new Date(ultimaPublicacion.fecha_publicacion).toLocaleDateString('es-PE')
        : 'Sin publicaciones';

      // Precio promedio
      const prices = propertiesList
        .map(prop => prop.precio || 0)
        .filter(price => price > 0);

      const avgPrice = prices.length > 0
        ? prices.reduce((sum, price) => sum + price, 0) / prices.length
        : 0;

      return {
        totalPublished,
        registrosRestantes,
        planLimit,
        publicadas,
        borradores,
        pausadas,
        vendidas,
        totalVistas,
        totalContactos,
        masVista: masVista?.titulo || 'Sin propiedades',
        masVistaVistas: masVista?.vistas || 0,
        ultimaPublicacion: ultimaPublicacion?.titulo || 'Sin publicaciones',
        ultimaPublicacionFecha,
        avgPrice: Math.round(avgPrice),
        propertiesList
      };
    } catch (error) {
      console.error('❌ Error calculando estadísticas de propiedades:', error);
      return {
        totalPublished: 0,
        registrosRestantes: planLimit,
        planLimit,
        publicadas: 0,
        borradores: 0,
        pausadas: 0,
        vendidas: 0,
        totalVistas: 0,
        totalContactos: 0,
        masVista: 'Sin propiedades',
        masVistaVistas: 0,
        ultimaPublicacion: 'Sin publicaciones',
        ultimaPublicacionFecha: 'Sin publicaciones',
        avgPrice: 0,
        propertiesList: []
      };
    }
  }
}

// Crear instancia única (Singleton)
const propertiesService = new PropertiesService();
window.propertiesService = propertiesService;

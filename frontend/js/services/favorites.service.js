/**
 * ❤️ Favorites Service
 * Gestión de propiedades favoritas
 */

class FavoritesService {
  /**
   * Obtener lista de favoritos del usuario
   * @returns {Promise<Object>} - Lista de propiedades favoritas
   */
  async getFavorites() {
    try {
      const response = await apiRequest(API_CONFIG.FAVORITES.LIST, {
        method: 'GET',
        auth: true
      });

      console.log('✅ Favoritos obtenidos:', response);
      return response;
    } catch (error) {
      console.error('❌ Error obteniendo favoritos:', error);
      throw error;
    }
  }

  /**
   * Agregar propiedad a favoritos
   * @param {number} propiedadId - ID de la propiedad
   * @returns {Promise<Object>} - Favorito creado
   */
  async addFavorite(propiedadId) {
    try {
      const response = await apiRequest(API_CONFIG.FAVORITES.ADD, {
        method: 'POST',
        auth: true,
        body: JSON.stringify({ propiedad_id: propiedadId })
      });

      console.log('✅ Favorito agregado:', response);
      return response;
    } catch (error) {
      console.error('❌ Error agregando favorito:', error);
      throw error;
    }
  }

  /**
   * Eliminar propiedad de favoritos
   * @param {number} favoritoId - ID del favorito (no de la propiedad)
   * @returns {Promise<Object>} - Confirmación de eliminación
   */
  async removeFavorite(favoritoId) {
    try {
      const response = await apiRequest(API_CONFIG.FAVORITES.DELETE(favoritoId), {
        method: 'DELETE',
        auth: true
      });

      console.log('✅ Favorito eliminado:', response);
      return response;
    } catch (error) {
      console.error('❌ Error eliminando favorito:', error);
      throw error;
    }
  }

  /**
   * Verificar si una propiedad está en favoritos
   * @param {number} propiedadId - ID de la propiedad
   * @returns {Promise<boolean>} - true si está en favoritos
   */
  async isFavorite(propiedadId) {
    try {
      const favorites = await this.getFavorites();
      const favoritesList = favorites.data?.favoritos || [];

      return favoritesList.some(fav => fav.propiedad_id === propiedadId);
    } catch (error) {
      console.error('❌ Error verificando favorito:', error);
      return false;
    }
  }

  /**
   * Obtener estadísticas de favoritos para el dashboard
   * @returns {Promise<Object>} - Estadísticas calculadas
   */
  async getFavoriteStats() {
    try {
      const favorites = await this.getFavorites();

      // 🔍 DEBUG: Ver estructura de respuesta
      console.log('🔍 DEBUG getFavoriteStats - favorites completo:', favorites);

      // El backend puede devolver dos formatos:
      // 1. {success: true, data: {favoritos: [...]}}
      // 2. Directamente un array [...]
      let favoritesList = [];

      if (Array.isArray(favorites)) {
        // Formato 2: Array directo
        favoritesList = favorites;
        console.log('✅ Formato detectado: Array directo');
      } else if (favorites.data?.favoritos) {
        // Formato 1: Objeto con data.favoritos
        favoritesList = favorites.data.favoritos;
        console.log('✅ Formato detectado: Objeto con data.favoritos');
      } else if (favorites.favoritos) {
        // Formato alternativo: Objeto con favoritos directo
        favoritesList = favorites.favoritos;
        console.log('✅ Formato detectado: Objeto con favoritos');
      }

      console.log('🔍 DEBUG getFavoriteStats - favoritesList:', favoritesList);
      console.log('🔍 DEBUG getFavoriteStats - favoritesList.length:', favoritesList.length);

      // 🚀 NUEVO: Enriquecer datos obteniendo detalles completos de cada propiedad
      console.log('🔄 Enriqueciendo datos de favoritos con detalles completos...');
      const enrichedFavorites = await Promise.all(
        favoritesList.map(async (fav) => {
          try {
            // Obtener detalles completos de la propiedad
            const propertyDetails = await apiRequest(
              API_CONFIG.PROPERTIES.GET(fav.registro_cab_id),
              { method: 'GET', auth: true }
            );

            // Extraer datos relevantes
            const propData = propertyDetails.data || propertyDetails;

            return {
              ...fav,
              // Enriquecer con datos completos
              tipo_inmueble: propData.tipo_inmueble,
              distrito: propData.distrito,
              precio: fav.propiedad_precio || propData.precio_alquiler || propData.precio_venta,
              titulo: fav.propiedad_titulo || propData.titulo,
              tipo_operacion: fav.propiedad_tipo || propData.tipo_operacion,
              fecha_agregado: fav.created_at
            };
          } catch (error) {
            console.error(`❌ Error obteniendo detalles de propiedad ${fav.registro_cab_id}:`, error);
            // Si falla, usar datos básicos
            return {
              ...fav,
              tipo_inmueble: 'Otro',
              distrito: 'No especificado',
              precio: fav.propiedad_precio || 0,
              titulo: fav.propiedad_titulo || 'Sin título',
              tipo_operacion: fav.propiedad_tipo || 'No especificado',
              fecha_agregado: fav.created_at
            };
          }
        })
      );

      console.log('✅ Favoritos enriquecidos:', enrichedFavorites);

      // Calcular estadísticas con datos enriquecidos
      const totalFavorites = enrichedFavorites.length;

      // Agrupar por tipo de propiedad
      const byType = enrichedFavorites.reduce((acc, fav) => {
        const tipo = fav.tipo_inmueble || 'Otro';
        acc[tipo] = (acc[tipo] || 0) + 1;
        return acc;
      }, {});

      // Agrupar por distrito
      const byDistrict = enrichedFavorites.reduce((acc, fav) => {
        const distrito = fav.distrito || 'No especificado';
        acc[distrito] = (acc[distrito] || 0) + 1;
        return acc;
      }, {});

      // Rango de precios
      const prices = enrichedFavorites
        .map(fav => parseFloat(fav.precio) || 0)
        .filter(price => price > 0);

      const avgPrice = prices.length > 0
        ? prices.reduce((sum, price) => sum + price, 0) / prices.length
        : 0;

      const minPrice = prices.length > 0 ? Math.min(...prices) : 0;
      const maxPrice = prices.length > 0 ? Math.max(...prices) : 0;

      // Última adición
      const sortedByDate = [...enrichedFavorites].sort((a, b) =>
        new Date(b.fecha_agregado) - new Date(a.fecha_agregado)
      );
      const lastAdded = sortedByDate[0];
      const lastAddedDate = lastAdded
        ? new Date(lastAdded.fecha_agregado).toLocaleDateString('es-PE')
        : 'Sin favoritos';

      console.log('📊 Estadísticas calculadas:', {
        totalFavorites,
        byType,
        byDistrict
      });

      return {
        totalFavorites,
        byType,
        byDistrict,
        avgPrice: Math.round(avgPrice),
        minPrice,
        maxPrice,
        lastAdded: lastAdded?.titulo || 'Sin favoritos',
        lastAddedDate,
        favoritesList: enrichedFavorites
      };
    } catch (error) {
      console.error('❌ Error calculando estadísticas de favoritos:', error);
      return {
        totalFavorites: 0,
        byType: {},
        byDistrict: {},
        avgPrice: 0,
        minPrice: 0,
        maxPrice: 0,
        lastAdded: 'Sin favoritos',
        lastAddedDate: 'Sin favoritos',
        favoritesList: []
      };
    }
  }

  /**
   * Toggle favorito (agregar si no existe, eliminar si existe)
   * @param {number} propiedadId - ID de la propiedad
   * @returns {Promise<Object>} - Resultado de la operación
   */
  async toggleFavorite(propiedadId) {
    try {
      const favorites = await this.getFavorites();
      const favoritesList = favorites.data?.favoritos || [];

      const existing = favoritesList.find(fav => fav.propiedad_id === propiedadId);

      if (existing) {
        // Eliminar
        await this.removeFavorite(existing.id);
        return {
          action: 'removed',
          message: 'Eliminado de favoritos'
        };
      } else {
        // Agregar
        await this.addFavorite(propiedadId);
        return {
          action: 'added',
          message: 'Agregado a favoritos'
        };
      }
    } catch (error) {
      console.error('❌ Error toggle favorito:', error);
      throw error;
    }
  }
}

// Crear instancia única (Singleton)
const favoritesService = new FavoritesService();
window.favoritesService = favoritesService;

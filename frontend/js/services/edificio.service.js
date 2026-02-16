/**
 * 🏢 EDIFICIO SERVICE
 * Servicio para gestión de edificios y oficinas
 *
 * Endpoints:
 * - GET /propiedades/edificios-disponibles - Listar edificios disponibles
 * - GET /propiedades/{edificio_id}/caracteristicas - Características del edificio
 */

class EdificioService {
  constructor() {
    this.baseURL = `${API_CONFIG.BASE_URL}/propiedades`;
  }

  /**
   * 📋 Listar edificios disponibles para selector de padre
   * @returns {Promise<Array>} - Lista de edificios disponibles
   */
  async listarDisponibles() {
    try {
      const token = localStorage.getItem('access_token');

      // ✅ Usar endpoint PÚBLICO para ver TODOS los edificios disponibles
      // (una oficina puede estar en un edificio de otro propietario)
      let response;
      let url = `${this.baseURL}/edificios-disponibles`;
      
      response = await fetch(url, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      // Si el endpoint específico no existe, usar mis-propiedades (autenticado)
      if (!response.ok) {
        console.warn('⚠️ Endpoint edificios-disponibles no disponible, usando mis-propiedades');
        url = `${this.baseURL}/mis-propiedades?limit=100`;
        response = await fetch(url, {
          method: 'GET',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        });
      }

      if (!response.ok) {
        throw new Error(`Error HTTP: ${response.status}`);
      }

      const result = await response.json();

      let edificios = result.data || [];

      // ✅ FILTRAR: Solo edificios completos (tipo_inmueble_id = 12)
      edificios = edificios.filter(prop => {
        return prop.tipo_inmueble_id === 12;
      });

      return edificios;

    } catch (error) {
      console.error('❌ Error al listar edificios disponibles:', error);
      throw error;
    }
  }

  /**
   * 📊 Obtener características de un edificio agrupadas por categoría
   * @param {number} edificioId - ID del edificio
   * @returns {Promise<Object>} - Características agrupadas {categoria: [características]}
   */
  async obtenerCaracteristicas(edificioId) {
    try {
      const token = localStorage.getItem('access_token');
      const url = `${this.baseURL}/${edificioId}/caracteristicas`;
      
      const response = await fetch(url, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        throw new Error(`Error HTTP: ${response.status}`);
      }

      const result = await response.json();

      // Extraer data del wrapper ResponseModel
      const caracteristicas = result.data || {};

      return caracteristicas;

    } catch (error) {
      console.error('❌ Error al obtener características del edificio:', error);
      throw error;
    }
  }

  /**
   * 🔢 Obtener cantidad de pisos de un edificio
   * @param {number} edificioId - ID del edificio
   * @returns {Promise<number>} - Cantidad de pisos (default 10 si no existe)
   */
  async obtenerCantidadPisos(edificioId) {
    try {
      const token = localStorage.getItem('access_token');
      // Característica ID 110 = "Cantidad Pisos Edificio"
      // ✅ Usar endpoint correcto (sin /detalle)
      const url = `${API_CONFIG.BASE_URL}/propiedades/${edificioId}`;

      const response = await fetch(url, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        console.warn('⚠️ No se pudo obtener detalle del edificio, usando 10 pisos por defecto');
        return 10;
      }

      const result = await response.json();
      const data = result.data || result;

      // Buscar característica "Cantidad Pisos Edificio" en el detalle
      const caracteristicas = data.caracteristicas || [];

      // Buscar por ID 110 o por nombre "Cantidad Pisos Edificio"
      // ⚠️ NO confundir con "Cantidad Oficinas por Piso" (ID 120)
      const pisosCaract = caracteristicas.find(c => {
        // Comparar como números para evitar problemas de tipos
        const caracId = parseInt(c.caracteristica_id);
        const esId110 = caracId === 110;
        const nombreLower = (c.nombre || '').toLowerCase();
        // Buscar específicamente "cantidad pisos edificio" (no "oficinas por piso")
        const esPorNombre = nombreLower.includes('cantidad') &&
                           nombreLower.includes('piso') &&
                           nombreLower.includes('edificio');

        return esId110 || esPorNombre;
      });

      if (pisosCaract) {
        const cantidadPisos = parseInt(pisosCaract.valor) || 10;
        return cantidadPisos;
      }

      console.warn('⚠️ No se encontró característica de pisos, usando 10 por defecto');
      return 10;

    } catch (error) {
      console.error('❌ Error al obtener cantidad de pisos:', error);
      return 10; // Default
    }
  }
}

// Instancia singleton
const edificioService = new EdificioService();

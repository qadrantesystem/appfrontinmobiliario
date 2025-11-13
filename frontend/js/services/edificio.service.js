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
        console.log('🔗 Fallback URL:', url);
        response = await fetch(url, {
          method: 'GET',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        });
      }

      console.log('📡 Response status:', response.status);
      console.log('🌐 URL final usada:', url);

      if (!response.ok) {
        throw new Error(`Error HTTP: ${response.status}`);
      }

      const result = await response.json();
      console.log('📦 RAW Response completo:', result);
      
      let edificios = result.data || [];

      console.log('📦 Propiedades recibidas del backend:', edificios.length);
      console.log('🔍 Primera propiedad (muestra):', edificios[0]);
      console.log('🔍 tipo_inmueble_id de la primera:', edificios[0]?.tipo_inmueble_id, 'tipo:', typeof edificios[0]?.tipo_inmueble_id);
      
      // DEBUG: Ver TODAS las propiedades y sus tipos
      console.log('📊 TODOS los tipo_inmueble_id recibidos:');
      edificios.forEach(p => {
        console.log(`  ID ${p.registro_cab_id}: tipo_inmueble_id = ${p.tipo_inmueble_id} (${typeof p.tipo_inmueble_id}) - ${p.nombre_inmueble}`);
      });

      // ✅ FILTRAR: Solo edificios completos (tipo_inmueble_id = 12)
      const edificiosOriginales = edificios.length;
      edificios = edificios.filter(prop => {
        const esEdificio = prop.tipo_inmueble_id === 12;
        
        if (esEdificio) {
          console.log(`✅ Edificio detectado: ID ${prop.registro_cab_id} - ${prop.nombre_inmueble} (tipo: ${prop.tipo_inmueble_id})`);
        }
        
        return esEdificio;
      });

      console.log(`📋 Filtrado: ${edificios.length} edificios de ${edificiosOriginales} propiedades totales`);
      console.log('🏢 IDs de edificios disponibles:', edificios.map(e => e.registro_cab_id));

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
      
      console.log('📡 Obteniendo características del edificio:', edificioId);
      console.log('🌐 URL:', url);

      const response = await fetch(url, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      console.log('📥 Response status:', response.status);

      if (!response.ok) {
        throw new Error(`Error HTTP: ${response.status}`);
      }

      const result = await response.json();
      console.log('📦 Características RAW:', result);

      // Extraer data del wrapper ResponseModel
      const caracteristicas = result.data || {};
      
      console.log('📊 Características procesadas:', caracteristicas);
      console.log('📊 Número de categorías:', Object.keys(caracteristicas).length);
      Object.keys(caracteristicas).forEach(cat => {
        console.log(`  - ${cat}: ${caracteristicas[cat].length} características`);
      });

      return caracteristicas;

    } catch (error) {
      console.error('❌ Error al obtener características del edificio:', error);
      throw error;
    }
  }
}

// Instancia singleton
const edificioService = new EdificioService();

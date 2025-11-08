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

      const response = await fetch(`${this.baseURL}/edificios-disponibles`, {
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
      return result.data || [];

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

      const response = await fetch(`${this.baseURL}/${edificioId}/caracteristicas`, {
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
      return result.data || {};

    } catch (error) {
      console.error('❌ Error al obtener características del edificio:', error);
      throw error;
    }
  }
}

// Instancia singleton
const edificioService = new EdificioService();

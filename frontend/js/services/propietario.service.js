/**
 * 👤 PROPIETARIO SERVICE
 * Servicio para gestión de propietarios normalizados
 *
 * Endpoints:
 * - GET /propietarios/{dni} - Buscar por DNI (auto-fill)
 * - GET /propietarios - Listar todos
 * - POST /propietarios - Crear nuevo
 * - PUT /propietarios/{id} - Actualizar
 * - DELETE /propietarios/{id} - Desactivar
 */

class PropietarioService {
  constructor() {
    this.baseURL = `${API_CONFIG.BASE_URL}/propietarios`;
  }

  /**
   * 🔍 Buscar propietario por DNI (auto-fill)
   * @param {string} dni - DNI del propietario
   * @returns {Promise<Object|null>} - Datos del propietario o null si no existe
   */
  async buscarPorDNI(dni) {
    try {
      const token = localStorage.getItem('access_token');

      const response = await fetch(`${this.baseURL}/${dni}`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (response.status === 404) {
        // Propietario no existe - retornar null
        return null;
      }

      if (!response.ok) {
        throw new Error(`Error HTTP: ${response.status}`);
      }

      const data = await response.json();

      return {
        propietario_id: data.propietario_id,
        dni: data.dni,
        nombre: data.nombre,
        telefono: data.telefono,
        email: data.email || '',
        existe: true
      };

    } catch (error) {
      console.error('❌ Error al buscar propietario por DNI:', error);
      throw error;
    }
  }

  /**
   * ➕ Crear nuevo propietario
   * @param {Object} propietarioData - Datos del nuevo propietario
   * @returns {Promise<Object>} - Propietario creado
   */
  async crear(propietarioData) {
    try {
      const token = localStorage.getItem('access_token');

      const response = await fetch(this.baseURL, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(propietarioData)
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.detail || 'Error al crear propietario');
      }

      return await response.json();

    } catch (error) {
      console.error('❌ Error al crear propietario:', error);
      throw error;
    }
  }

  /**
   * 📋 Listar propietarios
   * @param {number} skip - Registros a saltar (paginación)
   * @param {number} limit - Cantidad de registros
   * @param {boolean} activo - Filtrar por activos/inactivos
   * @returns {Promise<Array>} - Lista de propietarios
   */
  async listar(skip = 0, limit = 100, activo = true) {
    try {
      const token = localStorage.getItem('access_token');

      const params = new URLSearchParams({
        skip: skip.toString(),
        limit: limit.toString(),
        activo: activo.toString()
      });

      const response = await fetch(`${this.baseURL}?${params}`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        throw new Error(`Error HTTP: ${response.status}`);
      }

      return await response.json();

    } catch (error) {
      console.error('❌ Error al listar propietarios:', error);
      throw error;
    }
  }

  /**
   * 🔄 Actualizar propietario
   * @param {number} propietarioId - ID del propietario
   * @param {Object} updateData - Datos a actualizar
   * @returns {Promise<Object>} - Propietario actualizado
   */
  async actualizar(propietarioId, updateData) {
    try {
      const token = localStorage.getItem('access_token');

      const response = await fetch(`${this.baseURL}/${propietarioId}`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(updateData)
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.detail || 'Error al actualizar propietario');
      }

      return await response.json();

    } catch (error) {
      console.error('❌ Error al actualizar propietario:', error);
      throw error;
    }
  }

  /**
   * ❌ Desactivar propietario (soft delete)
   * @param {number} propietarioId - ID del propietario
   * @returns {Promise<void>}
   */
  async desactivar(propietarioId) {
    try {
      const token = localStorage.getItem('access_token');

      const response = await fetch(`${this.baseURL}/${propietarioId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.detail || 'Error al desactivar propietario');
      }

    } catch (error) {
      console.error('❌ Error al desactivar propietario:', error);
      throw error;
    }
  }
}

// Instancia singleton
const propietarioService = new PropietarioService();

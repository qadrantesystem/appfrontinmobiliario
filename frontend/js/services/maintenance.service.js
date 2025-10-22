/**
 * 🛠️ Maintenance Service
 * Servicio para gestionar todos los CRUDs de mantenimiento del sistema
 *
 * Módulos:
 * - Tipos de Inmueble
 * - Distritos
 * - Características
 * - Características por Tipo
 * - Perfiles
 * - Planes
 */

class MaintenanceService {
  constructor() {
    this.baseUrl = API_CONFIG.BASE_URL;
  }

  /**
   * Método genérico para peticiones HTTP
   */
  async request(endpoint, method = 'GET', body = null, requiresAuth = true) {
    try {
      const headers = {
        'Content-Type': 'application/json'
      };

      if (requiresAuth) {
        const token = authService.getToken();
        if (!token) {
          throw new Error('No hay sesión activa');
        }
        headers['Authorization'] = `Bearer ${token}`;
      }

      const config = {
        method,
        headers
      };

      if (body && method !== 'GET') {
        config.body = JSON.stringify(body);
      }

      const response = await fetch(`${this.baseUrl}${endpoint}`, config);

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || `Error ${response.status}: ${response.statusText}`);
      }

      return await response.json();

    } catch (error) {
      console.error(`❌ Error en petición ${method} ${endpoint}:`, error);
      throw error;
    }
  }

  // ==========================================
  // 🏢 TIPOS DE INMUEBLE
  // ==========================================

  /**
   * Listar todos los tipos de inmueble
   */
  async getTiposInmueble() {
    return await this.request('/tipos-inmueble', 'GET', null, false);
  }

  /**
   * Crear tipo de inmueble
   */
  async createTipoInmueble(data) {
    return await this.request('/tipos-inmueble', 'POST', data, true);
  }

  /**
   * Actualizar tipo de inmueble
   */
  async updateTipoInmueble(id, data) {
    return await this.request(`/tipos-inmueble/${id}`, 'PUT', data, true);
  }

  /**
   * Eliminar tipo de inmueble
   */
  async deleteTipoInmueble(id) {
    return await this.request(`/tipos-inmueble/${id}`, 'DELETE', null, true);
  }

  // ==========================================
  // 📍 DISTRITOS
  // ==========================================

  /**
   * Listar todos los distritos
   */
  async getDistritos() {
    return await this.request('/distritos', 'GET', null, false);
  }

  /**
   * Crear distrito
   */
  async createDistrito(data) {
    return await this.request('/distritos', 'POST', data, true);
  }

  /**
   * Actualizar distrito
   */
  async updateDistrito(id, data) {
    return await this.request(`/distritos/${id}`, 'PUT', data, true);
  }

  /**
   * Eliminar distrito
   */
  async deleteDistrito(id) {
    return await this.request(`/distritos/${id}`, 'DELETE', null, true);
  }

  // ==========================================
  // ⚙️ CARACTERÍSTICAS
  // ==========================================

  /**
   * Listar todas las características
   */
  async getCaracteristicas() {
    return await this.request('/caracteristicas', 'GET', null, false);
  }

  /**
   * Crear característica
   */
  async createCaracteristica(data) {
    return await this.request('/caracteristicas', 'POST', data, true);
  }

  /**
   * Actualizar característica
   */
  async updateCaracteristica(id, data) {
    return await this.request(`/caracteristicas/${id}`, 'PUT', data, true);
  }

  /**
   * Eliminar característica
   */
  async deleteCaracteristica(id) {
    return await this.request(`/caracteristicas/${id}`, 'DELETE', null, true);
  }

  // ==========================================
  // 🔗 CARACTERÍSTICAS POR TIPO
  // ==========================================

  /**
   * Obtener características asignadas a un tipo de inmueble
   * Endpoint: GET /tipos-inmueble/{id}/caracteristicas
   */
  async getCaracteristicasPorTipo(tipoInmuebleId) {
    return await this.request(`/tipos-inmueble/${tipoInmuebleId}/caracteristicas`, 'GET', null, false);
  }

  /**
   * Asignar características a tipo de inmueble
   * Endpoint: POST /tipos-inmueble/{id}/caracteristicas
   */
  async asignarCaracteristicasATipo(tipoInmuebleId, caracteristicasIds) {
    return await this.request(
      `/tipos-inmueble/${tipoInmuebleId}/caracteristicas`,
      'POST',
      { caracteristicas_ids: caracteristicasIds },
      true
    );
  }

  // ==========================================
  // 👥 PERFILES
  // ==========================================

  /**
   * Listar todos los perfiles
   */
  async getPerfiles() {
    return await this.request('/perfiles', 'GET', null, true);
  }

  /**
   * Crear perfil
   */
  async createPerfil(data) {
    return await this.request('/perfiles', 'POST', data, true);
  }

  /**
   * Actualizar perfil
   */
  async updatePerfil(id, data) {
    return await this.request(`/perfiles/${id}`, 'PUT', data, true);
  }

  /**
   * Eliminar perfil
   */
  async deletePerfil(id) {
    return await this.request(`/perfiles/${id}`, 'DELETE', null, true);
  }

  // ==========================================
  // 💳 PLANES
  // ==========================================

  /**
   * Listar todos los planes
   */
  async getPlanes() {
    return await this.request('/planes', 'GET', null, false);
  }

  /**
   * Crear plan
   */
  async createPlan(data) {
    return await this.request('/planes', 'POST', data, true);
  }

  /**
   * Actualizar plan
   */
  async updatePlan(id, data) {
    return await this.request(`/planes/${id}`, 'PUT', data, true);
  }

  /**
   * Eliminar plan
   */
  async deletePlan(id) {
    return await this.request(`/planes/${id}`, 'DELETE', null, true);
  }
}

// Instancia global del servicio
const maintenanceService = new MaintenanceService();

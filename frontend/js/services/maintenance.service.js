/**
 * 🛠️ Maintenance Service
 * Servicio para gestionar todos los CRUDs de mantenimiento del sistema
 *
 * Módulos:
 * - Tipos de Inmueble
 * - Distritos
 * - Características
 * - Perfiles
 * - Planes
 * - Usuarios
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
        throw new Error(errorData.detail || errorData.message || `Error ${response.status}: ${response.statusText}`);
      }

      return await response.json();

    } catch (error) {
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
   * Listar tipos de inmueble con paginación
   */
  async getTiposInmueblePaginado(page = 1, pageSize = 5, search = '') {
    let url = `/tipos-inmueble/paginado?page=${page}&page_size=${pageSize}`;
    if (search) {
      url += `&search=${encodeURIComponent(search)}`;
    }
    return await this.request(url, 'GET', null, false);
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
   * Listar distritos con paginación
   */
  async getDistritosPaginado(page = 1, pageSize = 5, search = '') {
    let url = `/distritos/paginado?page=${page}&page_size=${pageSize}`;
    if (search) {
      url += `&search=${encodeURIComponent(search)}`;
    }
    return await this.request(url, 'GET', null, false);
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
  // 📁 CATEGORÍAS
  // ==========================================

  /**
   * Listar todas las categorías
   */
  async getCategorias() {
    return await this.request('/categorias', 'GET', null, false);
  }

  /**
   * Listar categorías con paginación
   */
  async getCategoriasPaginado(page = 1, pageSize = 5, search = '') {
    let url = `/categorias/paginado?page=${page}&page_size=${pageSize}`;
    if (search) {
      url += `&search=${encodeURIComponent(search)}`;
    }
    return await this.request(url, 'GET', null, false);
  }

  /**
   * Crear categoría
   */
  async createCategoria(data) {
    return await this.request('/categorias', 'POST', data, true);
  }

  /**
   * Actualizar categoría
   */
  async updateCategoria(id, data) {
    return await this.request(`/categorias/${id}`, 'PUT', data, true);
  }

  /**
   * Eliminar categoría (soft delete)
   */
  async deleteCategoria(id) {
    return await this.request(`/categorias/${id}`, 'DELETE', null, true);
  }

  // ==========================================
  // ⚙️ CARACTERÍSTICAS
  // ==========================================

  /**
   * Listar características con paginación
   */
  async getCaracteristicasPaginado(page = 1, pageSize = 5, search = '') {
    let url = `/caracteristicas/paginado?page=${page}&page_size=${pageSize}`;
    if (search) {
      url += `&search=${encodeURIComponent(search)}`;
    }
    return await this.request(url, 'GET', null, false);
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

  /**
   * Listar características agrupadas por tipo de inmueble
   */
  async getCaracteristicasPorTipoAgrupadas(tipoInmuebleId) {
    return await this.request(`/caracteristicas-x-inmueble/tipo-inmueble/${tipoInmuebleId}/mantenimiento`, 'GET', null, false);
  }

  // ==========================================
  // 👥 PERFILES
  // ==========================================

  /**
   * Listar todos los perfiles
   */
  async getPerfiles() {
    return await this.request('/perfiles-mae', 'GET', null, true);
  }

  /**
   * Listar perfiles con paginación
   */
  async getPerfilesPaginado(page = 1, pageSize = 5, search = '') {
    let url = `/perfiles-mae/paginado?page=${page}&page_size=${pageSize}`;
    if (search) {
      url += `&search=${encodeURIComponent(search)}`;
    }
    return await this.request(url, 'GET', null, true);
  }

  /**
   * Crear perfil
   */
  async createPerfil(data) {
    return await this.request('/perfiles-mae', 'POST', data, true);
  }

  /**
   * Actualizar perfil
   */
  async updatePerfil(id, data) {
    return await this.request(`/perfiles-mae/${id}`, 'PUT', data, true);
  }

  /**
   * Eliminar perfil
   */
  async deletePerfil(id) {
    return await this.request(`/perfiles-mae/${id}`, 'DELETE', null, true);
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
   * Listar planes con paginación
   */
  async getPlanesPaginado(page = 1, pageSize = 5, search = '') {
    let url = `/planes/paginado?page=${page}&page_size=${pageSize}`;
    if (search) {
      url += `&search=${encodeURIComponent(search)}`;
    }
    return await this.request(url, 'GET', null, false);
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

  // ==========================================
  // 👤 USUARIOS
  // ==========================================

  /**
   * Listar usuarios con paginación y filtros
   * @param {number} page - Página actual
   * @param {number} limit - Registros por página
   * @param {string} search - Búsqueda por nombre o email
   * @param {number|null} perfil_id - Filtrar por perfil
   * @param {string} estado - Filtrar por estado (activo/inactivo)
   * @param {number|null} anio - Filtrar por año de registro
   * @param {number|null} mes - Filtrar por mes de registro
   * @returns {Promise<Object>} Lista paginada de usuarios
   */
  async getUsuarios(page = 1, limit = 10, search = '', perfil_id = null, estado = '', anio = null, mes = null) {
    const params = new URLSearchParams({ page, limit });
    if (search) params.set('search', search);
    if (perfil_id) params.set('perfil_id', perfil_id);
    if (estado) params.set('estado', estado);
    if (anio) params.set('anio', anio);
    if (mes) params.set('mes', mes);
    return this.request(`/usuarios?${params}`, 'GET', null, true);
  }

  /**
   * Cambiar el perfil de un usuario
   * @param {number} userId - ID del usuario
   * @param {number} perfil_id - Nuevo perfil a asignar
   * @returns {Promise<Object>} Usuario actualizado
   */
  async changeUserProfile(userId, perfil_id) {
    return this.request(`/usuarios/${userId}/perfil`, 'POST', { perfil_id }, true);
  }

  /**
   * Activar o desactivar un usuario
   * @param {number} userId - ID del usuario
   * @param {string} estado - Nuevo estado (activo/inactivo)
   * @returns {Promise<Object>} Usuario actualizado
   */
  async toggleUserStatus(userId, estado) {
    return this.request(`/usuarios/${userId}/estado?estado=${estado}`, 'PATCH', null, true);
  }
}

// Instancia global del servicio
const maintenanceService = new MaintenanceService();

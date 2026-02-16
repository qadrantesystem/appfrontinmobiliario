/**
 * 🌟 SERVICIO DE FAVORITOS - Agregar/Quitar
 */

class FavoritesActionService {
  constructor() {
    this.baseURL = API_CONFIG.BASE_URL;
  }

  /**
   * ❤️ Agregar propiedad a favoritos
   */
  async agregarFavorito(propiedadId, notas = "") {
    try {
      const token = authService.getToken();

      if (!token) {
        Swal.fire({
          icon: 'info',
          title: 'Suscripción Requerida',
          text: 'Esta opción está disponible si te suscribes',
          confirmButtonText: 'Entendido',
          confirmButtonColor: '#2c5282'
        });
        return null;
      }

      const response = await fetch(`${this.baseURL}/favoritos/`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          registro_cab_id: propiedadId,
          notas: notas
        })
      });

      if (response.status === 401) {
        showNotification('⏱️ Sesión expirada. Redirigiendo al login...', 'warning');
        setTimeout(() => authService.logout('Sesión expirada'), 2000);
        return null;
      }

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.detail || 'Error al agregar favorito');
      }

      const data = await response.json();
      showNotification('❤️ Agregado a favoritos', 'success');
      return data;

    } catch (error) {
      console.error('❌ Error al agregar favorito:', error);
      showNotification(`❌ ${error.message}`, 'error');
      return null;
    }
  }

  /**
   * 💔 Quitar propiedad de favoritos
   */
  async quitarFavorito(propiedadId) {
    try {
      const token = authService.getToken();

      if (!token) {
        Swal.fire({
          icon: 'info',
          title: 'Suscripción Requerida',
          text: 'Esta opción está disponible si te suscribes',
          confirmButtonText: 'Entendido',
          confirmButtonColor: '#2c5282'
        });
        return false;
      }

      const response = await fetch(`${this.baseURL}/favoritos/${propiedadId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (response.status === 401) {
        showNotification('⏱️ Sesión expirada. Redirigiendo al login...', 'warning');
        setTimeout(() => authService.logout('Sesión expirada'), 2000);
        return false;
      }

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.detail || 'Error al quitar favorito');
      }

      showNotification('💔 Eliminado de favoritos', 'info');
      return true;

    } catch (error) {
      console.error('❌ Error al quitar favorito:', error);
      showNotification(`❌ ${error.message}`, 'error');
      return false;
    }
  }

  /**
   * 🔄 Toggle favorito (agregar o quitar)
   */
  async toggleFavorito(propiedadId, esFavorito) {
    if (esFavorito) {
      return await this.quitarFavorito(propiedadId);
    } else {
      const result = await this.agregarFavorito(propiedadId);
      return result !== null;
    }
  }
}

// Instancia global
const favoritesActionService = new FavoritesActionService();

/**
 * ❤️ Favorites Handler Module
 * Maneja la funcionalidad de favoritos en las tarjetas de propiedades
 * Desacoplado y reutilizable
 */

class FavoritesHandler {
  constructor() {
    this.favoritesCache = new Map(); // Cache: propiedadId -> favoritoId
    this.initialized = false;
  }

  /**
   * ✅ Inicializar el handler de favoritos
   * Carga el estado inicial y configura los listeners
   */
  async init() {
    try {
      await this.loadFavoritesState();
      this.setupListeners();
      this.initialized = true;
    } catch (error) {
      console.error('❌ Error inicializando FavoritesHandler:', error);
    }
  }

  /**
   * 📥 Cargar estado de favoritos del backend
   */
  async loadFavoritesState() {
    try {
      const token = authService.getToken();
      if (!token) return;

      const response = await fetch(`${API_CONFIG.BASE_URL}/favoritos/`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });

      if (!response.ok) throw new Error('Error al cargar favoritos');

      const data = await response.json();
      const favoritos = Array.isArray(data) ? data : (data.data || []);

      this.favoritesCache.clear();

      favoritos.forEach(fav => {
        const propId = parseInt(fav.registro_cab_id);
        const favId = parseInt(fav.favorito_id);
        this.favoritesCache.set(propId, favId);
        this.updateButtonState(propId, true);
      });

    } catch (error) {
      console.error('❌ Error cargando favoritos:', error);
    }
  }

  /**
   * 🎯 Configurar listeners para todos los botones de favoritos
   */
  setupListeners() {
    document.addEventListener('click', async (e) => {
      const btn = e.target.closest('[data-favorite-property]');
      if (!btn) return;

      e.stopPropagation();
      e.preventDefault();

      await this.handleFavoriteClick(btn);
    });
  }

  /**
   * 🖱️ Manejar click en botón de favorito
   */
  async handleFavoriteClick(button) {
    const propId = parseInt(button.dataset.favoriteProperty);
    const isFavorite = this.favoritesCache.has(propId);

    button.disabled = true;
    button.style.opacity = '0.6';

    try {
      if (isFavorite) {
        await this.removeFavorite(propId);
      } else {
        await this.addFavorite(propId);
      }
    } catch (error) {
      console.error('❌ Error en handleFavoriteClick:', error);
    } finally {
      button.disabled = false;
      button.style.opacity = '1';
    }
  }

  /**
   * ➕ Agregar propiedad a favoritos
   */
  async addFavorite(propId) {
    try {
      const result = await favoritesActionService.agregarFavorito(propId);

      if (result) {
        const favoritoId = result.favorito_id || result.id;
        this.favoritesCache.set(propId, favoritoId);
        this.updateButtonState(propId, true);
        this.animateButton(propId);
      }

    } catch (error) {
      console.error('❌ Error agregando favorito:', error);
      showNotification('❌ Error al agregar a favoritos', 'error');
    }
  }

  /**
   * ➖ Quitar propiedad de favoritos
   */
  async removeFavorite(propId) {
    try {
      const favoritoId = this.favoritesCache.get(propId);

      if (!favoritoId) {
        showNotification('❌ Error al quitar de favoritos', 'error');
        return;
      }

      const success = await favoritesActionService.quitarFavorito(favoritoId);

      if (success) {
        this.favoritesCache.delete(propId);
        this.updateButtonState(propId, false);
        this.animateButton(propId);
      }

    } catch (error) {
      console.error('❌ Error quitando favorito:', error);
      showNotification('❌ Error al quitar de favoritos', 'error');
    }
  }

  /**
   * 🎨 Actualizar estado visual del botón
   * ✅ FIX: Actualiza TODOS los botones con el mismo propId (móvil + desktop)
   */
  updateButtonState(propId, isFavorite) {
    const buttons = document.querySelectorAll(`[data-favorite-property="${propId}"]`);

    if (buttons.length === 0) return;

    buttons.forEach(button => {
      if (isFavorite) {
        button.classList.add('is-favorite');
        button.title = 'Quitar de favoritos';
      } else {
        button.classList.remove('is-favorite');
        button.title = 'Agregar a favoritos';
      }
      
      // Forzar repaint
      button.style.display = 'none';
      button.offsetHeight;
      button.style.display = '';
    });
  }

  /**
   * ✨ Animar botón
   * ✅ FIX: Anima TODOS los botones con el mismo propId
   */
  animateButton(propId) {
    const buttons = document.querySelectorAll(`[data-favorite-property="${propId}"]`);

    if (buttons.length === 0) return;

    buttons.forEach(button => {
      button.classList.add('favorite-pulse');
      setTimeout(() => button.classList.remove('favorite-pulse'), 600);
    });
  }

  /**
   * 🔄 Refrescar todos los botones (útil después de renderizar nueva página)
   */
  refreshAllButtons() {
    this.favoritesCache.forEach((favoritoId, propId) => {
      this.updateButtonState(propId, true);
    });
  }

  /**
   * ❓ Verificar si una propiedad es favorita
   */
  isFavorite(propId) {
    return this.favoritesCache.has(parseInt(propId));
  }

  /**
   * 📊 Obtener estadísticas
   */
  getStats() {
    return {
      total: this.favoritesCache.size,
      propiedades: Array.from(this.favoritesCache.keys())
    };
  }
}

// Crear instancia global única (Singleton)
if (!window.favoritesHandler) {
  window.favoritesHandler = new FavoritesHandler();
}

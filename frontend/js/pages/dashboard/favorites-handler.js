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
    console.log('❤️ Inicializando FavoritesHandler...');

    try {
      await this.loadFavoritesState();
      this.setupListeners();
      this.initialized = true;
      console.log('✅ FavoritesHandler inicializado');
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
      if (!token) {
        console.warn('⚠️ No hay token, no se cargan favoritos');
        return;
      }

      console.log('📥 Cargando favoritos desde API...');

      const response = await fetch(`${API_CONFIG.BASE_URL}/favoritos/`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });

      if (!response.ok) {
        throw new Error('Error al cargar favoritos');
      }

      const data = await response.json();
      const favoritos = Array.isArray(data) ? data : (data.data || []);

      console.log(`✅ ${favoritos.length} favoritos cargados`);

      // Limpiar cache
      this.favoritesCache.clear();

      // Actualizar cache y UI
      favoritos.forEach(fav => {
        const propId = parseInt(fav.registro_cab_id);
        const favId = parseInt(fav.favorito_id);

        // Guardar en cache
        this.favoritesCache.set(propId, favId);

        // Actualizar UI
        this.updateButtonState(propId, true);
      });

      console.log('✅ Estado de favoritos cargado en cache');

    } catch (error) {
      console.error('❌ Error cargando favoritos:', error);
    }
  }

  /**
   * 🎯 Configurar listeners para todos los botones de favoritos
   */
  setupListeners() {
    // Usar event delegation en el documento
    document.addEventListener('click', async (e) => {
      const btn = e.target.closest('[data-favorite-property]');
      if (!btn) return;

      e.stopPropagation();
      e.preventDefault();

      await this.handleFavoriteClick(btn);
    });

    console.log('✅ Listeners de favoritos configurados (event delegation)');
  }

  /**
   * 🖱️ Manejar click en botón de favorito
   */
  async handleFavoriteClick(button) {
    const propId = parseInt(button.dataset.favoriteProperty);
    const isFavorite = this.favoritesCache.has(propId);

    console.log(`❤️ Click favorito - PropID: ${propId}, es favorito: ${isFavorite}`);

    // Deshabilitar botón temporalmente
    button.disabled = true;
    button.style.opacity = '0.6';

    try {
      if (isFavorite) {
        // Quitar de favoritos
        await this.removeFavorite(propId);
      } else {
        // Agregar a favoritos
        await this.addFavorite(propId);
      }
    } catch (error) {
      console.error('❌ Error en handleFavoriteClick:', error);
    } finally {
      // Rehabilitar botón
      button.disabled = false;
      button.style.opacity = '1';
    }
  }

  /**
   * ➕ Agregar propiedad a favoritos
   */
  async addFavorite(propId) {
    try {
      console.log(`➕ Agregando propiedad ${propId} a favoritos...`);

      const result = await favoritesActionService.agregarFavorito(propId);

      if (result) {
        // Agregar al cache
        const favoritoId = result.favorito_id || result.id;
        this.favoritesCache.set(propId, favoritoId);

        // Actualizar UI
        this.updateButtonState(propId, true);

        // Animación
        this.animateButton(propId);

        console.log('✅ Favorito agregado exitosamente');
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
      console.log(`➖ Quitando propiedad ${propId} de favoritos...`);

      // Obtener el favorito_id del cache
      const favoritoId = this.favoritesCache.get(propId);

      if (!favoritoId) {
        console.error('❌ No se encontró el favorito_id en cache');
        showNotification('❌ Error al quitar de favoritos', 'error');
        return;
      }

      const success = await favoritesActionService.quitarFavorito(favoritoId);

      if (success) {
        // Quitar del cache
        this.favoritesCache.delete(propId);

        // Actualizar UI
        this.updateButtonState(propId, false);

        // Animación
        this.animateButton(propId);

        console.log('✅ Favorito eliminado exitosamente');
      }

    } catch (error) {
      console.error('❌ Error quitando favorito:', error);
      showNotification('❌ Error al quitar de favoritos', 'error');
    }
  }

  /**
   * 🎨 Actualizar estado visual del botón
   */
  updateButtonState(propId, isFavorite) {
    const button = document.querySelector(`[data-favorite-property="${propId}"]`);
    if (!button) return;

    if (isFavorite) {
      button.classList.add('is-favorite');
      button.title = 'Quitar de favoritos';
    } else {
      button.classList.remove('is-favorite');
      button.title = 'Agregar a favoritos';
    }

    console.log(`🎨 Botón actualizado - PropID: ${propId}, es favorito: ${isFavorite}`);
  }

  /**
   * ✨ Animar botón
   */
  animateButton(propId) {
    const button = document.querySelector(`[data-favorite-property="${propId}"]`);
    if (!button) return;

    button.classList.add('favorite-pulse');
    setTimeout(() => button.classList.remove('favorite-pulse'), 600);
  }

  /**
   * 🔄 Refrescar todos los botones (útil después de renderizar nueva página)
   */
  refreshAllButtons() {
    console.log('🔄 Refrescando estado de todos los botones de favoritos...');

    this.favoritesCache.forEach((favoritoId, propId) => {
      this.updateButtonState(propId, true);
    });

    console.log('✅ Botones refrescados');
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

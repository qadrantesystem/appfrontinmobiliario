/**
 * ❤️ Favoritos Tab - Gestión de propiedades favoritas
 * Archivo: tabs/favoritos/favoritos.js
 * Líneas: ~260
 * EXTRAE: dashboard.js (líneas 904-1082)
 */

class FavoritosTab {
  constructor(app) {
    this.app = app;
    this.favoritos = [];
    this.propiedades = [];
  }

  /**
   * Renderizar tab de Favoritos
   */
  async render() {
    try {
      // Cargar favoritos del usuario
      await this.loadFavoritos();

      // Si no hay favoritos, mostrar empty state
      if (this.favoritos.length === 0) {
        return this.renderEmptyState();
      }

      // Cargar detalles completos de cada propiedad favorita
      await this.loadPropiedadesDetails();

      // Renderizar grid de propiedades
      return this.renderFavoritosGrid();

    } catch (error) {
      console.error('❌ Error en FavoritosTab:', error);
      return this.renderErrorState(error);
    }
  }

  /**
   * Configurar event listeners después del render
   */
  async afterRender() {
    // Setup de carousel (usa módulo existente)
    if (this.app.carousel) {
      this.app.carousel.setup();
    }

    // ❤️ CRÍTICO: Inicializar handler de favoritos SI aún no está
    if (window.favoritesHandler && !window.favoritesHandler.initialized) {
      await window.favoritesHandler.init();
    }

    // ✅ NUEVO: Refrescar botones con el estado correcto
    if (window.favoritesHandler && window.favoritesHandler.initialized) {
      window.favoritesHandler.refreshAllButtons();
    }

    // 🔄 CRÍTICO: Listener para auto-refresh cuando se quite un favorito
    this.setupAutoRefreshListener();
  }

  /**
   * Cleanup al salir del tab
   */
  async destroy() {
    this.favoritos = [];
    this.propiedades = [];
  }

  /**
   * Cargar favoritos del usuario
   */
  async loadFavoritos() {
    try {
      const token = authService.getToken();
      const response = await fetch(`${API_CONFIG.BASE_URL}/favoritos/`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });

      if (!response.ok) {
        throw new Error('Error al obtener favoritos');
      }

      const data = await response.json();
      this.favoritos = Array.isArray(data) ? data : (data.data || []);
    } catch (error) {
      console.error('❌ Error cargando favoritos:', error);
      throw error;
    }
  }

  /**
   * Cargar detalles completos de cada propiedad favorita
   */
  async loadPropiedadesDetails() {
    try {
      const token = authService.getToken();

      const propiedadesPromises = this.favoritos.map(async (fav) => {
        try {
          const propResponse = await fetch(`${API_CONFIG.BASE_URL}/propiedades/${fav.registro_cab_id}`, {
            headers: { 'Authorization': `Bearer ${token}` }
          });

          if (propResponse.ok) {
            const propData = await propResponse.json();
            return {
              ...(propData.data || propData),
              favorito_id: fav.favorito_id,
              es_favorito: true
            };
          }
        } catch (error) {
          console.error(`Error cargando propiedad ${fav.registro_cab_id}:`, error);
        }
        return null;
      });

      this.propiedades = (await Promise.all(propiedadesPromises)).filter(p => p !== null);
    } catch (error) {
      console.error('❌ Error cargando detalles de propiedades:', error);
      throw error;
    }
  }

  /**
   * Renderizar grid de favoritos
   */
  renderFavoritosGrid() {
    const favoritesCards = this.propiedades.map((prop, index) => {
      return this.renderPropertyCard(prop, index);
    }).join('');

    return `
      <div class="favoritos-header" style="margin-bottom: var(--spacing-lg);">
        <h2 style="color: var(--azul-corporativo); margin: 0;">
          ❤️ Mis Favoritos (${this.propiedades.length})
        </h2>
      </div>
      <div class="properties-grid">
        ${favoritesCards}
      </div>
    `;
  }

  /**
   * Renderizar card individual de propiedad
   */
  renderPropertyCard(prop, index) {
    // Preparar imágenes para carousel
    const imagenPrincipal = prop.imagen_principal || 'https://via.placeholder.com/400x300?text=Sin+Imagen';
    const imagenes = prop.imagenes_galeria && prop.imagenes_galeria.length > 0 ?
      [imagenPrincipal, ...prop.imagenes_galeria] :
      [imagenPrincipal];

    // Formatear precio
    const precio = prop.transaccion === 'alquiler' && prop.precio_alquiler ?
      `S/ ${parseFloat(prop.precio_alquiler).toLocaleString('es-PE')}/mes` :
      prop.transaccion === 'venta' && prop.precio_venta ?
      `S/ ${parseFloat(prop.precio_venta).toLocaleString('es-PE')}` :
      'Precio no disponible';

    // Badge de estado CRM
    const estadoCRMBadge = {
      'lead': { bg: 'transparent', border: 'transparent', color: '#6b7280', text: '🔍 Lead', noBorder: true },
      'contactado': { bg: 'white', border: '#0066CC', color: '#0066CC', text: '📞 Contactado' },
      'visita_programada': { bg: 'white', border: '#0066CC', color: '#0066CC', text: '📅 Visita' },
      'negociacion': { bg: 'white', border: '#0066CC', color: '#0066CC', text: '💼 Negociación' },
      'cerrado_ganado': { bg: 'white', border: '#22c55e', color: '#22c55e', text: '✅ Ganado' },
      'cerrado_perdido': { bg: 'white', border: '#ef4444', color: '#ef4444', text: '❌ Perdido' }
    }[prop.estado_crm] || { bg: 'transparent', border: 'transparent', color: '#6b7280', text: '', noBorder: true };

    return `
      <div class="property-card" data-property-id="${prop.registro_cab_id}" data-favorito-id="${prop.favorito_id}">
        <div class="property-number">${index + 1}</div>

        <!-- ❤️ Botón de Favorito -->
        <button class="favorite-btn-beautiful is-favorite"
                data-favorite-property="${prop.registro_cab_id}"
                data-favorito-id="${prop.favorito_id}"
                title="Quitar de favoritos">
          <svg class="heart-icon" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor">
            <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z"/>
          </svg>
        </button>

        <!-- 🖼️ Carousel de Imágenes -->
        <div class="property-image-carousel">
          <div class="carousel-images" data-current="0">
            ${imagenes.map((img, i) => `
              <img src="${img}" alt="${prop.titulo}"
                   class="carousel-image ${i === 0 ? 'active' : ''}"
                   data-index="${i}"
                   onerror="this.src='https://via.placeholder.com/400x300?text=Sin+Imagen'">
            `).join('')}
          </div>
          ${imagenes.length > 1 ? `
            <button class="carousel-prev" data-property-id="${prop.registro_cab_id}">‹</button>
            <button class="carousel-next" data-property-id="${prop.registro_cab_id}">›</button>
            <div class="carousel-indicators">
              ${imagenes.map((_, i) => `
                <span class="indicator ${i === 0 ? 'active' : ''}" data-index="${i}"></span>
              `).join('')}
            </div>
          ` : ''}
        </div>

        <div class="property-info">
          <h3 class="property-title">${prop.titulo}</h3>
          <p class="property-location">📍 ${prop.direccion}</p>
          <div class="property-price">${precio}</div>
          <div class="property-features">
            <span class="feature">📐 ${prop.area || 0} m²</span>
            ${(prop.tipo_inmueble_id !== 12 && prop.tipo_inmueble_id !== 13) ? `
              ${prop.habitaciones ? `<span class="feature">🛏️ ${prop.habitaciones} hab.</span>` : ''}
              ${prop.banos ? `<span class="feature">🛁 ${prop.banos} baños</span>` : ''}
              ${prop.estacionamientos ? `<span class="feature">🚗 ${prop.estacionamientos} estac.</span>` : ''}
            ` : ''}
            ${prop.antiguedad ? `<span class="feature">⏱️ ${prop.antiguedad} años</span>` : ''}
          </div>
          <div class="property-stats" style="display: flex; gap: 1rem; margin: 0.5rem 0; font-size: 0.85rem; color: var(--gris-medio); align-items: center; flex-wrap: wrap;">
            <span>👁️ ${prop.vistas || 0} vistas</span>
            <span>📞 ${prop.contactos || 0} contactos</span>

            <!-- 🎯 Badge de Estado CRM -->
            ${estadoCRMBadge.noBorder ? `
              <span style="color: ${estadoCRMBadge.color}; font-size: 0.75rem; font-weight: 500;">
                ${estadoCRMBadge.text}
              </span>
            ` : `
              <span style="display: inline-flex; align-items: center; gap: 4px; padding: 3px 8px; background: ${estadoCRMBadge.bg}; color: ${estadoCRMBadge.color}; border: 2px solid ${estadoCRMBadge.border}; border-radius: 6px; font-size: 0.7rem; font-weight: 600;">
                ${estadoCRMBadge.text}
              </span>
            `}
          </div>

          ${prop.caracteristicas && prop.caracteristicas.length > 0 ? `
            <div style="margin: 0.5rem 0;">
              <div style="display: flex; flex-wrap: wrap; gap: 4px;">
                ${prop.caracteristicas.slice(0, 5).map(car => `
                  <span style="font-size: 0.7rem; padding: 2px 6px; background: rgba(0, 102, 204, 0.1); color: var(--azul-corporativo); border-radius: 4px;">
                    ${car.nombre || car}
                  </span>
                `).join('')}
                ${prop.caracteristicas.length > 5 ? `<span style="font-size: 0.7rem; color: var(--gris-medio);">+${prop.caracteristicas.length - 5} más</span>` : ''}
              </div>
            </div>
          ` : ''}

          <p class="property-description">${(prop.descripcion || '').substring(0, 120)}...</p>
        </div>
      </div>
    `;
  }

  /**
   * Renderizar estado vacío
   */
  renderEmptyState() {
    return `
      <h2 style="color: var(--azul-corporativo); margin-bottom: var(--spacing-xl);">
        Mis Favoritos
      </h2>
      <div class="empty-state">
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"></path>
        </svg>
        <h3>No tienes favoritos aún</h3>
        <p>Las propiedades que marques como favoritas aparecerán aquí.</p>
      </div>
    `;
  }

  /**
   * Renderizar estado de error
   */
  renderErrorState(error) {
    return `
      <div class="empty-state">
        <h3>Error al cargar favoritos</h3>
        <p>${error.message}</p>
      </div>
    `;
  }

  /**
   * 🔄 Setup auto-refresh cuando se quite un favorito
   * Usa event delegation para detectar clicks en favoritos
   */
  setupAutoRefreshListener() {
    // Event delegation para detectar clicks en botones de favorito
    document.addEventListener('click', async (e) => {
      const btn = e.target.closest('[data-favorite-property]');
      if (!btn) return;

      // Solo procesar si estamos en el tab favoritos
      const favoritosContainer = document.querySelector('.favoritos-header');
      if (!favoritosContainer) return;

      // Esperar a que favorites-handler.js procese el click
      const propId = parseInt(btn.dataset.favoriteProperty);
      const wasRed = btn.classList.contains('is-favorite');

      // Si era rojo (favorito), esperamos que se quite
      if (wasRed) {
        // Esperar 500ms para que el handler procese
        setTimeout(async () => {
          // Verificar si realmente se quitó del cache
          const stillFavorite = window.favoritesHandler?.isFavorite(propId);

          if (!stillFavorite) {
            // Animar salida del card
            const card = btn.closest('.property-card');
            if (card) {
              card.style.transition = 'all 0.3s ease';
              card.style.opacity = '0';
              card.style.transform = 'scale(0.9)';

              setTimeout(async () => {
                // Recargar el tab completo
                const html = await this.render();
                document.getElementById('tabContent').innerHTML = html;
                await this.afterRender();
              }, 300);
            }
          }
        }, 500);
      }
    });
  }
}

// Exponer globalmente
window.FavoritosTab = FavoritosTab;

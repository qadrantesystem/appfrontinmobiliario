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
    // Setup de carousel
    if (this.app.carousel) {
      this.app.carousel.setup();
    }

    // Inicializar handler de favoritos
    if (window.favoritesHandler && !window.favoritesHandler.initialized) {
      await window.favoritesHandler.init();
    }
    if (window.favoritesHandler && window.favoritesHandler.initialized) {
      window.favoritesHandler.refreshAllButtons();
    }

    // Image viewer (click para previsualizar)
    if (window.imageViewer) {
      window.imageViewer.attachToImages('.search-result-image');
    }

    // Botón detalle → usa showPropertyDetailPopup
    document.querySelectorAll('.btn-detalle-fav').forEach(btn => {
      btn.addEventListener('click', async (e) => {
        e.stopPropagation();
        const propId = parseInt(btn.dataset.viewDetail);
        if (window.propiedadesTabInstance?.showPropertyDetailPopup) {
          await window.propiedadesTabInstance.showPropertyDetailPopup(propId);
        } else if (window.PropiedadesTab) {
          const temp = new PropiedadesTab(this.app);
          window.propiedadesTabInstance = temp;
          await temp.showPropertyDetailPopup(propId);
        }
      });
    });

    // Auto-refresh cuando se quite un favorito
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
    // Preparar imágenes para carousel (misma lógica que propiedades.js)
    const baseUrl = 'https://ik.imagekit.io/quadrante/';
    const toUrl = (img) => (img.startsWith('http://') || img.startsWith('https://')) ? img : baseUrl + img;
    const imagenes = [];
    if (prop.imagen_principal) imagenes.push(toUrl(prop.imagen_principal));
    if (Array.isArray(prop.imagenes) && prop.imagenes.length > 0) {
      prop.imagenes.forEach(img => {
        const url = toUrl(img);
        if (!imagenes.includes(url)) imagenes.push(url);
      });
    }
    if (imagenes.length === 0) imagenes.push('https://placehold.co/800x600/e5e7eb/6b7280?text=Sin+Imagen');

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

        <!-- Carousel de Imágenes -->
        <div class="property-image-carousel">
          <div class="carousel-images" data-current="0">
            ${imagenes.map((img, i) => `
              <img src="${img}" alt="${prop.titulo}"
                   class="carousel-image search-result-image ${i === 0 ? 'active' : ''}"
                   data-index="${i}"
                   onerror="this.src='https://placehold.co/800x600/e5e7eb/6b7280?text=Sin+Imagen'">
            `).join('')}
          </div>
          ${imagenes.length > 1 ? `
            <button class="carousel-prev" data-property-id="${prop.registro_cab_id}">&#8249;</button>
            <button class="carousel-next" data-property-id="${prop.registro_cab_id}">&#8250;</button>
            <div class="carousel-indicators">
              ${imagenes.map((_, i) => `
                <span class="indicator ${i === 0 ? 'active' : ''}" data-index="${i}"></span>
              `).join('')}
            </div>
            <div class="photo-counter"><span class="photo-counter-current">1</span>/${imagenes.length}</div>
          ` : ''}
        </div>

        <div class="property-info">
          <h3 class="property-title">${prop.titulo}</h3>
          ${prop.edificio_nombre ? `
            <div style="color: var(--azul-corporativo); font-size: 0.75rem; font-weight: 600; display: flex; align-items: center; gap: 4px;">
              <span>🏢 ${prop.edificio_nombre}</span>
              ${prop.piso ? `<span style="background: #f1f5f9; padding: 1px 6px; border-radius: 3px; font-size: 0.7rem;">Piso ${prop.piso}</span>` : ''}
            </div>
          ` : ''}
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

          ${prop.descripcion ? `<p class="property-description">${prop.descripcion.substring(0, 120)}${prop.descripcion.length > 120 ? '...' : ''}</p>` : ''}
          <div style="display: flex; justify-content: flex-end; margin-top: 4px;">
            <button class="btn-detalle-fav" data-view-detail="${prop.registro_cab_id}" onclick="event.stopPropagation();"
                    style="background: var(--azul-corporativo, #0f4761); color: white; border: none; padding: 4px 10px; border-radius: 4px; font-size: 0.7rem; font-weight: 600; cursor: pointer; display: flex; align-items: center; gap: 4px;"
                    onmouseover="this.style.background='var(--dorado, #ff9700)'"
                    onmouseout="this.style.background='var(--azul-corporativo, #0f4761)'">
              🔍 Detalle
            </button>
          </div>
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
    const container = document.getElementById('tabContent');
    if (!container) return;

    container.addEventListener('click', async (e) => {
      const btn = e.target.closest('[data-favorite-property]');
      if (!btn) return;

      // Solo procesar si estamos en el tab favoritos
      if (!document.querySelector('.favoritos-header')) return;

      const propId = parseInt(btn.dataset.favoriteProperty);
      const card = btn.closest('.property-card');
      if (!card) return;

      // Esperar a que el handler procese el API call
      const checkAndRemove = (attempts = 0) => {
        if (attempts > 10) return; // Max 2.5 segundos
        const stillFavorite = window.favoritesHandler?.isFavorite(propId);
        if (!stillFavorite) {
          // Animar salida del card
          card.style.transition = 'all 0.3s ease';
          card.style.opacity = '0';
          card.style.transform = 'scale(0.9)';
          setTimeout(() => card.remove(), 300);

          // Actualizar contador
          const header = document.querySelector('.favoritos-header h2');
          const remaining = document.querySelectorAll('.property-card').length - 1;
          if (header) header.textContent = `❤️ Mis Favoritos (${remaining})`;

          // Si no quedan favoritos, recargar tab completo
          if (remaining <= 0) {
            setTimeout(async () => {
              const html = await this.render();
              document.getElementById('tabContent').innerHTML = html;
              await this.afterRender();
            }, 400);
          }
        } else {
          setTimeout(() => checkAndRemove(attempts + 1), 250);
        }
      };

      // Empezar a verificar después de 250ms
      setTimeout(() => checkAndRemove(0), 250);
    });
  }
}

// Exponer globalmente
window.FavoritosTab = FavoritosTab;

/**
 * 🏠 Búsquedas Cards - Renderizado de Tarjetas de Propiedades
 * Maneja el renderizado de las tarjetas de propiedades con carrusel
 * ~350 líneas - Separado para mantener arquitectura limpia
 */

class BusquedasCards {
  constructor(busquedasTab) {
    this.tab = busquedasTab;
  }

  /**
   * Renderizar tarjeta de propiedad o combinación
   */
  render(prop, number) {
    // 🔗 DETECTAR SI ES COMBINACIÓN
    if (prop.tipo === 'combinacion') {
      console.log('🔗 Renderizando COMBINACIÓN:', prop.glosa);
      return this.renderCombinacion(prop, number);
    }

    console.log('🎨 BusquedasCards.render() llamado:', {
      titulo: prop.titulo,
      numero: number,
      id: prop.registro_cab_id,
      fotos_raw: prop.fotos,
      fotos_type: typeof prop.fotos,
      fotos_isArray: Array.isArray(prop.fotos)
    });

    const propId = prop.registro_cab_id;

    // ⚠️ El API devuelve "imagenes" (array de strings) y/o "imagen_principal" (string)
    let imagenesAPI = Array.isArray(prop.imagenes) ? prop.imagenes : [];

    // ✅ Si no hay array de imágenes pero hay imagen_principal, usarla
    if (imagenesAPI.length === 0 && prop.imagen_principal) {
      imagenesAPI = [prop.imagen_principal];
    }

    console.log('📸 Imágenes desde API:', imagenesAPI.length, 'URLs');

    // ✅ Consultar estado de favorito dinámicamente
    const isFavorite = window.favoritesHandler?.isFavorite(propId);

    // Preparar imágenes (ya vienen como URLs completas, solo agregar transformación)
    const imagenes = imagenesAPI.length > 0
      ? imagenesAPI.map(url => `${url}?tr=w-800,h-600,fo-auto`)
      : ['https://placehold.co/800x600/e5e7eb/6b7280?text=Sin+Imagen'];

    // Precio
    let precio = '';
    if (prop.precio_venta && prop.precio_venta > 0) {
      precio = `<strong>USD ${this.formatNumber(prop.precio_venta)}</strong>`;
    } else if (prop.precio_alquiler && prop.precio_alquiler > 0) {
      precio = `<strong>USD ${this.formatNumber(prop.precio_alquiler)}/mes</strong>`;
    } else {
      precio = '<span style="color: #6b7280;">Consultar precio</span>';
    }

    // Badge de Estado (Publicado/Borrador/etc)
    const estadoBadge = {
      'publicado': { color: '#10b981', text: '✓ Publicado' },
      'borrador': { color: '#f59e0b', text: '📝 Borrador' },
      'pendiente': { color: '#6b7280', text: '⏳ Pendiente' },
      'rechazado': { color: '#ef4444', text: '✗ Rechazado' }
    }[prop.estado] || { color: '#6b7280', text: '⏳ Pendiente' };

    // Badge de Estado CRM
    const estadoCRMBadge = {
      'prospecto': { bg: 'white', border: '#6b7280', color: '#6b7280', text: '👤 Prospecto' },
      'contactado': { bg: 'white', border: '#0066CC', color: '#0066CC', text: '📞 Contactado' },
      'calificado': { bg: 'white', border: '#10b981', color: '#10b981', text: '✨ Calificado' },
      'presentacion': { bg: 'white', border: '#f59e0b', color: '#f59e0b', text: '🎯 Presentación' },
      'negociacion': { bg: 'white', border: '#0066CC', color: '#0066CC', text: '💼 Negociación' },
      'cerrado_ganado': { bg: 'white', border: '#22c55e', color: '#22c55e', text: '✅ Ganado' },
      'cerrado_perdido': { bg: 'white', border: '#ef4444', color: '#ef4444', text: '❌ Perdido' }
    }[prop.estado_crm] || { bg: 'transparent', border: 'transparent', color: '#6b7280', text: '', noBorder: true };

    return `
      <div class="property-card" data-property-id="${propId}" data-property-number="${number}">
        <div class="property-number">${number}</div>

        <!-- ✅ Checkbox de Selección -->
        <div class="property-checkbox">
          <input type="checkbox"
                 class="property-select-checkbox"
                 data-property-id="${propId}"
                 id="check-${propId}">
          <label for="check-${propId}" class="checkbox-label"></label>
        </div>

        <!-- ❤️ Botón de Favorito -->
        <button class="favorite-btn-beautiful ${isFavorite ? 'is-favorite' : ''}"
                data-favorite-property="${propId}"
                title="${isFavorite ? 'Quitar de favoritos' : 'Agregar a favoritos'}">
          <svg class="heart-icon" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor">
            <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z"/>
          </svg>
        </button>

        <!-- Badge de Estado -->
        <div class="property-badge" style="position: absolute; top: 50px; left: 10px; background: ${estadoBadge.color}; color: white; padding: 4px 10px; border-radius: 6px; font-size: 0.75rem; font-weight: 600; z-index: 20;">
          ${estadoBadge.text}
        </div>

        <!-- Carousel de imágenes -->
        <div class="property-image-carousel">
          <div class="carousel-images" data-carousel="carousel-${propId}" data-current="0">
            ${imagenes.map((img, i) => `
              <img src="${img}" alt="${prop.titulo || 'Propiedad'} - imagen ${i+1}"
                   class="carousel-image ${i === 0 ? 'active' : ''}" data-index="${i}"
                   onerror="this.src='https://placehold.co/800x600/e5e7eb/6b7280?text=Sin+Imagen'">
            `).join('')}
          </div>
          ${imagenes.length > 1 ? `
            <button class="carousel-prev" data-carousel="carousel-${propId}">‹</button>
            <button class="carousel-next" data-carousel="carousel-${propId}">›</button>
            <div class="carousel-indicators" data-carousel="carousel-${propId}">
              ${imagenes.map((_, i) => `
                <span class="indicator ${i === 0 ? 'active' : ''}" data-index="${i}"></span>
              `).join('')}
            </div>
          ` : ''}
        </div>

        <div class="property-info">
          <h3 class="property-title">${prop.titulo || prop.nombre_inmueble || 'Sin título'}</h3>
          ${prop.edificio_nombre ? `
            <div class="property-building" style="color: #0066CC; font-size: 0.85rem; font-weight: 600; margin-bottom: 4px;">
              🏢 ${prop.edificio_nombre}
            </div>
          ` : ''}
          <div class="property-location">📍 ${prop.direccion || 'Ubicación no disponible'}</div>
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
          <div class="property-stats" style="display: flex; gap: 1rem; margin: 0.75rem 0; font-size: 0.85rem; color: var(--gris-medio); align-items: center; flex-wrap: wrap;">
            <span>👁️ ${prop.vistas || 0} vistas</span>
            <span>📞 ${prop.contactos || 0} contactos</span>

            <!-- Badge de Estado CRM -->
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

          <!-- Información de Contacto -->
          ${(prop.telefono || prop.email || prop.propietario_real_telefono || prop.propietario_real_email) ? `
            <div class="property-contact" style="background: white; border-left: 3px solid #0066CC; border-radius: 6px; padding: 6px 8px; margin: 0.4rem 0;">
              <div style="font-size: 0.7rem; color: var(--gris-medio); margin-bottom: 3px; font-weight: 600;">👤 Contacto</div>
              <div style="display: flex; gap: 4px; flex-wrap: wrap; align-items: center;">
                ${(prop.telefono || prop.propietario_real_telefono) ? `
                  <a href="tel:${prop.telefono || prop.propietario_real_telefono}" style="display: inline-flex; align-items: center; gap: 3px; padding: 2px 6px; background: white; color: #0066CC; border: 2px solid #0066CC; border-radius: 4px; text-decoration: none; font-size: 0.7rem; font-weight: 600;">
                    📱 ${prop.telefono || prop.propietario_real_telefono}
                  </a>
                ` : ''}
                ${(prop.email || prop.propietario_real_email) ? `
                  <a href="mailto:${prop.email || prop.propietario_real_email}" style="display: inline-flex; align-items: center; gap: 3px; padding: 2px 6px; background: white; color: #0066CC; border: 2px solid #0066CC; border-radius: 4px; text-decoration: none; font-size: 0.7rem; font-weight: 600;">
                    📧 ${prop.email || prop.propietario_real_email}
                  </a>
                ` : ''}
              </div>
            </div>
          ` : ''}

          <p class="property-description">${(prop.descripcion || '').substring(0, 120)}...</p>
        </div>
      </div>
    `;
  }

  /**
   * 🔗 Renderizar tarjeta de COMBINACIÓN (verde) - Diseño mejorado
   */
  renderCombinacion(combo, number) {
    const oficinas = combo.oficinas || [];
    const primeraImagen = oficinas[0]?.imagen_principal || 'https://placehold.co/800x600/059669/ffffff?text=Combinación';

    // Precio total
    let precio = '';
    if (combo.precio_venta_total && combo.precio_venta_total > 0) {
      precio = `USD ${this.formatNumber(combo.precio_venta_total)}`;
    } else if (combo.precio_alquiler_total && combo.precio_alquiler_total > 0) {
      precio = `USD ${this.formatNumber(combo.precio_alquiler_total)}/mes`;
    } else {
      precio = 'Consultar';
    }

    // Lista de oficinas incluidas (compacta)
    const oficinasHTML = oficinas.map(of => `
      <div style="display: flex; justify-content: space-between; align-items: center; padding: 4px 8px; background: white; border-radius: 4px; margin-bottom: 4px;">
        <span style="font-size: 0.8rem; color: #374151;">${of.nombre}</span>
        <span style="font-size: 0.8rem; color: #059669; font-weight: 600;">${of.area} m²</span>
      </div>
    `).join('');

    // Generar ID único para la combinación
    const oficinaIds = oficinas.map(o => o.registro_cab_id).sort().join('-');
    const comboId = `combo-${combo.edificio_id}-${combo.piso}-${oficinaIds}`;

    // Nombre del edificio limpio
    const edificioNombre = combo.edificio_nombre || 'Edificio';

    return `
      <div class="property-card combination-card" data-combination="true" data-combo-id="${comboId}" data-edificio-id="${combo.edificio_id}" data-property-number="${number}"
           style="border: 2px solid #059669; background: white; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 12px rgba(5, 150, 105, 0.15);">

        <div class="property-number" style="background: #059669;">${number}</div>

        <!-- ✅ Checkbox de Selección -->
        <div class="property-checkbox" style="top: 12px; right: 12px;">
          <input type="checkbox"
                 class="property-select-checkbox combination-checkbox"
                 data-combo-id="${comboId}"
                 data-edificio-id="${combo.edificio_id}"
                 id="check-${comboId}">
          <label for="check-${comboId}" class="checkbox-label" style="border-color: #059669;"></label>
        </div>

        <!-- Header verde con info principal -->
        <div style="background: linear-gradient(135deg, #059669 0%, #047857 100%); color: white; padding: 16px;">
          <div style="display: flex; align-items: center; gap: 8px; margin-bottom: 8px;">
            <span style="background: rgba(255,255,255,0.2); padding: 4px 10px; border-radius: 20px; font-size: 0.7rem; font-weight: 600;">
              🔗 ${combo.cantidad_oficinas} OFICINAS
            </span>
            <span style="background: rgba(255,255,255,0.2); padding: 4px 10px; border-radius: 20px; font-size: 0.7rem; font-weight: 600;">
              ${combo.transaccion === 'venta' ? '💰 VENTA' : '🔄 ALQUILER'}
            </span>
          </div>
          <h3 style="margin: 0 0 4px 0; font-size: 1.1rem; font-weight: 700;">
            🏢 ${edificioNombre}
          </h3>
          <div style="opacity: 0.9; font-size: 0.85rem;">
            📍 ${combo.distrito} · Piso ${combo.piso}
          </div>
        </div>

        <!-- Imagen -->
        <div style="height: 140px; overflow: hidden;">
          <img src="${primeraImagen}" alt="${edificioNombre}"
               style="width: 100%; height: 100%; object-fit: cover;"
               onerror="this.src='https://placehold.co/800x400/059669/ffffff?text=Oficinas'">
        </div>

        <!-- Contenido -->
        <div style="padding: 16px;">
          <!-- Área y Precio destacados -->
          <div style="display: flex; gap: 12px; margin-bottom: 12px;">
            <div style="flex: 1; background: #ecfdf5; border-radius: 8px; padding: 12px; text-align: center;">
              <div style="font-size: 0.7rem; color: #059669; font-weight: 600;">ÁREA TOTAL</div>
              <div style="font-size: 1.3rem; font-weight: 700; color: #047857;">📐 ${combo.area_total} m²</div>
            </div>
            <div style="flex: 1; background: #f0fdf4; border-radius: 8px; padding: 12px; text-align: center;">
              <div style="font-size: 0.7rem; color: #059669; font-weight: 600;">PRECIO TOTAL</div>
              <div style="font-size: 1rem; font-weight: 700; color: #047857;">💵 ${precio}</div>
            </div>
          </div>

          <!-- Oficinas incluidas -->
          <div style="background: #f0fdf4; border-radius: 8px; padding: 10px;">
            <div style="font-size: 0.7rem; color: #059669; font-weight: 600; margin-bottom: 6px;">
              📋 OFICINAS INCLUIDAS
            </div>
            ${oficinasHTML}
          </div>
        </div>
      </div>
    `;
  }

  /**
   * Formatear número con comas
   */
  formatNumber(num) {
    return new Intl.NumberFormat('en-US').format(num);
  }

  /**
   * Setup listeners para las tarjetas
   */
  setupCardListeners() {
    // Hover y Click en tarjeta para resaltar en mapa
    this.tab.container.querySelectorAll('.property-card').forEach(card => {
      // Hover para resaltar
      card.addEventListener('mouseenter', (e) => {
        const propertyNumber = card.dataset.propertyNumber;
        if (this.tab.mapHandler) {
          this.tab.mapHandler.highlightMarker(parseInt(propertyNumber), true);
        }
      });

      card.addEventListener('mouseleave', (e) => {
        const propertyNumber = card.dataset.propertyNumber;
        if (this.tab.mapHandler) {
          this.tab.mapHandler.highlightMarker(parseInt(propertyNumber), false);
        }
      });

      // Click en tarjeta
      card.addEventListener('click', (e) => {
        // Evitar si se hizo click en botón de favorito o carrusel
        if (e.target.closest('.favorite-btn-float') ||
            e.target.closest('.carousel-prev') ||
            e.target.closest('.carousel-next')) {
          return;
        }

        const propertyId = card.dataset.propertyId;
        const propertyNumber = card.dataset.propertyNumber;

        // Resaltar tarjeta
        this.tab.container.querySelectorAll('.property-card').forEach(c => c.classList.remove('selected'));
        card.classList.add('selected');

        // Resaltar marcador en mapa en amarillo (permanente)
        if (this.tab.mapHandler) {
          this.tab.mapHandler.highlightMarker(parseInt(propertyNumber), false, true);
        }
      });
    });

    // Carrusel navigation
    this.setupCarouselListeners();

    // Favoritos
    this.setupFavoritesListeners();
  }

  /**
   * Setup listeners del carrusel
   */
  setupCarouselListeners() {
    // Botones prev/next
    this.tab.container.querySelectorAll('.carousel-prev, .carousel-next').forEach(btn => {
      btn.addEventListener('click', (e) => {
        e.stopPropagation();
        const carouselId = btn.dataset.carousel;
        const direction = btn.classList.contains('carousel-prev') ? -1 : 1;
        this.navigateCarousel(carouselId, direction);
      });
    });

    // Indicadores
    this.tab.container.querySelectorAll('.carousel-indicators .indicator').forEach(indicator => {
      indicator.addEventListener('click', (e) => {
        e.stopPropagation();
        const index = parseInt(indicator.dataset.index);
        const carousel = indicator.closest('.carousel-indicators').dataset.carousel;
        this.goToSlide(carousel, index);
      });
    });
  }

  /**
   * Navegar en el carrusel
   */
  navigateCarousel(carouselId, direction) {
    const carousel = this.tab.container.querySelector(`.carousel-images[data-carousel="${carouselId}"]`);
    if (!carousel) return;

    const images = carousel.querySelectorAll('.carousel-image');
    const currentIndex = Array.from(images).findIndex(img => img.classList.contains('active'));
    let newIndex = currentIndex + direction;

    // Circular
    if (newIndex < 0) newIndex = images.length - 1;
    if (newIndex >= images.length) newIndex = 0;

    this.goToSlide(carouselId, newIndex);
  }

  /**
   * Ir a un slide específico
   */
  goToSlide(carouselId, index) {
    const carousel = this.tab.container.querySelector(`.carousel-images[data-carousel="${carouselId}"]`);
    if (!carousel) return;

    const images = carousel.querySelectorAll('.carousel-image');
    const indicators = this.tab.container.querySelectorAll(`.carousel-indicators[data-carousel="${carouselId}"] .indicator`);

    // Actualizar imágenes
    images.forEach((img, i) => {
      if (i === index) {
        img.classList.add('active');
      } else {
        img.classList.remove('active');
      }
    });

    // Actualizar indicadores
    indicators.forEach((ind, i) => {
      if (i === index) {
        ind.classList.add('active');
      } else {
        ind.classList.remove('active');
      }
    });
  }

  /**
   * Setup listeners de favoritos
   * ✅ Usa event delegation de favoritesHandler - no necesita listeners manuales
   * favoritesHandler.js maneja automáticamente los clicks en [data-favorite-property]
   */
  setupFavoritesListeners() {
    // ✅ No hace falta configurar listeners aquí
    // favoritesHandler.js ya tiene event delegation global configurado
    // que detecta clicks en elementos con [data-favorite-property]

    // Refrescar estado de botones según cache de favoritos
    if (window.favoritesHandler) {
      window.favoritesHandler.refreshAllButtons();
    }
  }
}

// Exportar para uso en busquedas.js
if (typeof window !== 'undefined') {
  window.BusquedasCards = BusquedasCards;
}

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
      return this.renderCombinacion(prop, number);
    }

    const propId = prop.registro_cab_id;

    // El API devuelve "imagenes" (array de strings) y/o "imagen_principal" (string)
    let imagenesAPI = Array.isArray(prop.imagenes) ? prop.imagenes : [];

    if (imagenesAPI.length === 0 && prop.imagen_principal) {
      imagenesAPI = [prop.imagen_principal];
    }

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

    // Tooltip con detalles principales
    const tooltipParts = [
      prop.titulo || prop.nombre_inmueble || '',
      prop.edificio_nombre ? `Edificio: ${prop.edificio_nombre}` : '',
      prop.direccion ? `Dirección: ${prop.direccion}` : '',
      `Área: ${prop.area || 0} m²`,
      prop.transaccion ? `Transacción: ${prop.transaccion}` : '',
      prop.precio_venta ? `Precio Venta: USD ${this.formatNumber(prop.precio_venta)}` : '',
      prop.precio_alquiler ? `Precio Alquiler: USD ${this.formatNumber(prop.precio_alquiler)}/mes` : '',
      prop.habitaciones ? `Habitaciones: ${prop.habitaciones}` : '',
      prop.banos ? `Baños: ${prop.banos}` : '',
      prop.estacionamientos ? `Estacionamientos: ${prop.estacionamientos}` : '',
      prop.antiguedad ? `Antigüedad: ${prop.antiguedad} años` : '',
      prop.implementacion ? `Implementación: ${prop.implementacion}` : '',
      prop.distrito ? `Distrito: ${prop.distrito}` : '',
      prop.piso ? `Piso: ${prop.piso}` : '',
    ].filter(Boolean).join('\n');

    return `
      <div class="property-card" data-property-id="${propId}" data-property-number="${number}" title="${tooltipParts.replace(/"/g, '&quot;')}">

        <!-- ❤️ Botón de Favorito (sobre imagen) -->
        <button class="favorite-btn-beautiful ${isFavorite ? 'is-favorite' : ''}"
                data-favorite-property="${propId}"
                title="${isFavorite ? 'Quitar de favoritos' : 'Agregar a favoritos'}">
          <svg class="heart-icon" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor">
            <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z"/>
          </svg>
        </button>

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

        <div class="property-info" style="padding: 10px 12px;">
          <!-- Número + Checkbox + Título en una fila -->
          <div style="display: flex; align-items: center; gap: 8px; margin-bottom: 4px;">
            <span style="background: var(--azul-corporativo, #0f4761); color: white; min-width: 24px; height: 24px; border-radius: 50%; display: flex; align-items: center; justify-content: center; font-size: 0.7rem; font-weight: 700; flex-shrink: 0;">${number}</span>
            <input type="checkbox" class="property-select-checkbox" data-property-id="${propId}" id="check-${propId}" style="width: 16px; height: 16px; cursor: pointer; flex-shrink: 0; accent-color: var(--azul-corporativo, #0f4761);">
            <h3 class="property-title" style="font-size: 0.85rem; margin: 0; line-height: 1.2; flex: 1;">${prop.titulo || prop.nombre_inmueble || 'Sin título'}</h3>
          </div>
          ${prop.edificio_nombre ? `
            <div style="color: var(--azul-corporativo, #0f4761); font-size: 0.75rem; font-weight: 600; margin-bottom: 2px;">
              🏢 ${prop.edificio_nombre}
            </div>
          ` : ''}
          <div class="property-location" style="font-size: 0.75rem; color: #6b7280; margin-bottom: 4px;">📍 ${prop.direccion || 'Sin ubicación'}</div>
          <div class="property-price" style="font-size: 0.95rem; margin-bottom: 6px;">${precio}</div>
          <div class="property-features" style="display: flex; flex-wrap: wrap; gap: 4px; margin-bottom: 6px;">
            <span class="feature" style="font-size: 0.7rem; padding: 2px 6px; background: #f1f5f9; border-radius: 4px;">📐 ${prop.area || 0} m²</span>
            ${prop.habitaciones ? `<span class="feature" style="font-size: 0.7rem; padding: 2px 6px; background: #f1f5f9; border-radius: 4px;">🛏️ ${prop.habitaciones}</span>` : ''}
            ${prop.banos ? `<span class="feature" style="font-size: 0.7rem; padding: 2px 6px; background: #f1f5f9; border-radius: 4px;">🛁 ${prop.banos}</span>` : ''}
            ${prop.estacionamientos ? `<span class="feature" style="font-size: 0.7rem; padding: 2px 6px; background: #f1f5f9; border-radius: 4px;">🚗 ${prop.estacionamientos}</span>` : ''}
            ${prop.antiguedad ? `<span class="feature" style="font-size: 0.7rem; padding: 2px 6px; background: #f1f5f9; border-radius: 4px;">⏱️ ${prop.antiguedad}a</span>` : ''}
          </div>
          <div style="display: flex; align-items: center; justify-content: space-between; gap: 6px; flex-wrap: wrap;">
            <div style="display: flex; gap: 6px; align-items: center; font-size: 0.7rem; color: #9ca3af;">
              <span>👁️ ${prop.vistas || 0}</span>
              <span>📞 ${prop.contactos || 0}</span>
              ${!estadoCRMBadge.noBorder ? `
                <span style="padding: 1px 6px; color: ${estadoCRMBadge.color}; border: 1.5px solid ${estadoCRMBadge.border}; border-radius: 4px; font-size: 0.65rem; font-weight: 600;">
                  ${estadoCRMBadge.text}
                </span>
              ` : ''}
            </div>
            <button class="btn-detalle-prop" data-view-detail="${propId}" style="background: var(--azul-corporativo, #0f4761); color: white; border: none; padding: 4px 10px; border-radius: 4px; font-size: 0.7rem; font-weight: 600; cursor: pointer; display: flex; align-items: center; gap: 4px;"
                    onclick="event.stopPropagation();">
              🔍 Detalle
            </button>
          </div>
        </div>
      </div>
    `;
  }

  /**
   * 🔗 Renderizar tarjeta de COMBINACIÓN (verde) - Diseño mejorado
   */
  renderCombinacion(combo, number) {
    const oficinas = combo.oficinas || [];
    const primeraImagen = oficinas[0]?.imagen_principal || 'https://placehold.co/800x600/0f4761/ffffff?text=Combinación';

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
      <div style="display: flex; justify-content: space-between; align-items: center; padding: 3px 6px; background: white; border-radius: 4px; margin-bottom: 3px; border: 1px solid #f1f5f9;">
        <span style="font-size: 0.75rem; color: #374151;">${of.nombre}</span>
        <div style="display: flex; align-items: center; gap: 6px;">
          <span style="font-size: 0.75rem; color: var(--azul-corporativo, #0f4761); font-weight: 600;">${of.area} m²</span>
          <button class="btn-detalle-oficina" data-view-detail="${of.registro_cab_id}" onclick="event.stopPropagation();"
                  style="background: none; border: 1.5px solid var(--azul-corporativo, #0f4761); color: var(--azul-corporativo, #0f4761); width: 22px; height: 22px; border-radius: 4px; cursor: pointer; display: flex; align-items: center; justify-content: center; font-size: 0.65rem;"
                  title="Ver detalle de ${of.nombre}">🔍</button>
        </div>
      </div>
    `).join('');

    // Generar ID único para la combinación
    const oficinaIds = oficinas.map(o => o.registro_cab_id).sort().join('-');
    const comboId = `combo-${combo.edificio_id}-${combo.piso}-${oficinaIds}`;

    // Nombre del edificio limpio
    const edificioNombre = combo.edificio_nombre || 'Edificio';

    // Tooltip combinación
    const comboTooltip = [
      `Combinación: ${combo.cantidad_oficinas} oficinas`,
      `Edificio: ${edificioNombre}`,
      `Piso: ${combo.piso}`,
      `Área total: ${combo.area_total} m²`,
      `Transacción: ${combo.transaccion}`,
      `Distrito: ${combo.distrito}`,
      precio !== 'Consultar' ? `Precio: ${precio}` : '',
      '---',
      ...oficinas.map(of => `${of.nombre}: ${of.area} m²`)
    ].filter(Boolean).join('\n');

    return `
      <div class="property-card combination-card" data-combination="true" data-combo-id="${comboId}" data-edificio-id="${combo.edificio_id}" data-property-number="${number}"
           title="${comboTooltip.replace(/"/g, '&quot;')}"
           style="border: 2px solid var(--azul-corporativo, #0f4761); background: white; border-radius: 8px; overflow: hidden; box-shadow: 0 1px 4px rgba(0,0,0,0.06);">

        <!-- Header sobrio con número + checkbox integrado -->
        <div style="background: white; padding: 10px 12px; border-bottom: 2px solid var(--azul-corporativo, #0f4761);">
          <div style="display: flex; align-items: center; gap: 8px; margin-bottom: 6px;">
            <span style="background: var(--azul-corporativo, #0f4761); color: white; min-width: 24px; height: 24px; border-radius: 50%; display: flex; align-items: center; justify-content: center; font-size: 0.7rem; font-weight: 700; flex-shrink: 0;">${number}</span>
            <input type="checkbox" class="property-select-checkbox combination-checkbox" data-combo-id="${comboId}" data-edificio-id="${combo.edificio_id}" id="check-${comboId}" style="width: 16px; height: 16px; cursor: pointer; flex-shrink: 0; accent-color: var(--azul-corporativo, #0f4761);">
            <span style="background: white; color: var(--azul-corporativo, #0f4761); border: 1.5px solid var(--azul-corporativo, #0f4761); padding: 2px 8px; border-radius: 4px; font-size: 0.65rem; font-weight: 600;">
              🔗 ${combo.cantidad_oficinas} OFICINAS
            </span>
            <span style="background: white; color: var(--azul-corporativo, #0f4761); border: 1.5px solid var(--azul-corporativo, #0f4761); padding: 2px 8px; border-radius: 4px; font-size: 0.65rem; font-weight: 600;">
              ${combo.transaccion === 'venta' ? 'VENTA' : 'ALQUILER'}
            </span>
          </div>
          <h3 style="margin: 0 0 2px 0; font-size: 0.9rem; font-weight: 700; color: var(--azul-corporativo, #0f4761);">
            🏢 ${edificioNombre}
          </h3>
          <div style="font-size: 0.75rem; color: #6b7280;">
            📍 ${combo.distrito} · Piso ${combo.piso}
          </div>
        </div>

        <!-- Contenido compacto -->
        <div style="padding: 12px 16px;">
          <!-- Área y Precio en fila -->
          <div style="display: flex; gap: 8px; margin-bottom: 10px;">
            <div style="flex: 1; background: white; border: 1.5px solid var(--azul-corporativo, #0f4761); border-radius: 6px; padding: 8px; text-align: center;">
              <div style="font-size: 0.65rem; color: #6b7280; font-weight: 600;">ÁREA TOTAL</div>
              <div style="font-size: 1.1rem; font-weight: 700; color: var(--azul-corporativo, #0f4761);">📐 ${combo.area_total} m²</div>
            </div>
            <div style="flex: 1; background: white; border: 1.5px solid var(--azul-corporativo, #0f4761); border-radius: 6px; padding: 8px; text-align: center;">
              <div style="font-size: 0.65rem; color: #6b7280; font-weight: 600;">PRECIO TOTAL</div>
              <div style="font-size: 1rem; font-weight: 700; color: var(--azul-corporativo, #0f4761);">💵 ${precio}</div>
            </div>
          </div>

          <!-- Oficinas incluidas -->
          <div style="background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 6px; padding: 8px;">
            <div style="font-size: 0.65rem; color: var(--azul-corporativo, #0f4761); font-weight: 600; margin-bottom: 4px;">
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

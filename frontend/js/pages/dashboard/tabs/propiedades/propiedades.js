/**
 * 🏠 Propiedades Tab - Gestión de propiedades del usuario
 * Archivo: tabs/propiedades/propiedades.js
 * Líneas: ~650 (necesario por complejidad: CRUD completo + filtros + paginación + carrusel + favoritos)
 * EXTRAÍDO DE: dashboard.js líneas 1209-2290
 */

class PropiedadesTab {
  constructor(app) {
    this.app = app;
    this.allProperties = [];
  }

  /**
   * Renderizar tab
   */
  async render() {
    try {
      return await this.getPropiedadesContent();
    } catch (error) {
      console.error('❌ Error rendering propiedades:', error);
      return this.getErrorContent(error);
    }
  }

  /**
   * Obtener contenido de propiedades
   */
  async getPropiedadesContent() {
    try {
      // Obtener MIS propiedades con el nuevo backend mejorado
      const token = authService.getToken();
      const currentUser = authService.getCurrentUser();
      
      // ✅ NUEVO BACKEND: Llamar con más propiedades por página
      const url = `${API_CONFIG.BASE_URL}/propiedades/mis-propiedades?limit=100`;
      
      console.log(`🔍 ${currentUser?.perfil_id === 4 ? 'ADMIN:' : 'USUARIO:'} Obteniendo propiedades (nuevo backend)`);
      
      const response = await fetch(url, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await response.json();

      const propiedades = data.data || [];
      const pagination = data.pagination || {};
      const estadisticas = data.estadisticas || {};
      
      console.log(`📊 Total propiedades recibidas: ${propiedades.length}`);
      console.log(`📊 Paginación:`, pagination);
      console.log(`📊 Estadísticas:`, estadisticas);
      
      // Si hay más propiedades, obtener la siguiente página
      if (pagination.total_pages > 1 && pagination.page === 1) {
        console.log(`🔄 Obteniendo página 2 de ${pagination.total_pages}...`);
        try {
          const page2Response = await fetch(`${API_CONFIG.BASE_URL}/propiedades/mis-propiedades?page=2&limit=100`, {
            headers: { 'Authorization': `Bearer ${token}` }
          });
          const page2Data = await page2Response.json();
          const page2Propiedades = page2Data.data || [];
          propiedades.push(...page2Propiedades);
          console.log(`📊 Total después de página 2: ${propiedades.length}`);
        } catch (error) {
          console.log(`⚠️ No se pudo obtener página 2: ${error.message}`);
        }
      }

      // Ordenar: Última creada primero
      this.allProperties = propiedades.sort((a, b) => {
        const idA = a.registro_cab_id || 0;
        const idB = b.registro_cab_id || 0;
        return idB - idA;
      });

      this.app.pagination.updateItemsPerPage();

      console.log('✅ Propiedades cargadas:', this.allProperties.length);

      // Header con filtros
      const content = `
        <div class="propiedades-header" style="margin-bottom: var(--spacing-xl);">
          <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: var(--spacing-lg);">
            <h2 style="color: var(--azul-corporativo); margin: 0;">
              Mis Propiedades (<span id="propCount">${this.allProperties.length}</span>)
            </h2>
            <button id="btnNuevaPropiedad" class="btn" style="background: var(--dorado); color: white; border: none; padding: var(--spacing-md) var(--spacing-xl); border-radius: var(--radius-md); font-weight: 600; cursor: pointer; transition: var(--transition-fast); box-shadow: var(--shadow-sm);">
              <span style="display: inline-block; width: 16px; height: 16px; border: 2px solid white; border-radius: 50%; position: relative; margin-right: 8px; vertical-align: middle;">
                <span style="position: absolute; top: 50%; left: 50%; transform: translate(-50%, -50%); background: white; width: 8px; height: 2px;"></span>
                <span style="position: absolute; top: 50%; left: 50%; transform: translate(-50%, -50%) rotate(90deg); background: white; width: 8px; height: 2px;"></span>
              </span>
              Nueva Propiedad
            </button>
          </div>

          ${this.app.filters.render()}
        </div>

        ${this.allProperties.length === 0 ? `
          <div class="empty-state">
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"></path>
              <polyline points="9 22 9 12 15 12 15 22"></polyline>
            </svg>
            <h3>No hay propiedades registradas</h3>
            <p>Comienza registrando tu primera propiedad.</p>
          </div>
        ` : `
          <div id="propertiesGrid" class="properties-grid">
            <!-- Se renderiza con paginación -->
          </div>

          <!-- Paginador -->
          <div id="paginadorContainer"></div>
        `}
      `;

      return content;
    } catch (error) {
      console.error('❌ Error cargando propiedades:', error);
      throw error;
    }
  }

  /**
   * Lifecycle hook: Después de renderizar
   */
  async afterRender() {
    console.log('✅ PropiedadesTab renderizado');
    window.currentPropiedadesTab = this;
    window.propiedadesTab = this; // 🔥 NUEVO: Exponer globalmente para onclick

    // ✅ CRÍTICO: Registrar este tab como el activo para los filtros
    this.app.filters.setActiveTab(this);

    // ✅ CRÍTICO: Registrar este tab como el activo para el paginador
    this.app.pagination.setActiveTab(this);

    // ✅ CRÍTICO: Inicializar filtros (carga combos y event listeners)
    console.log('🔧 Inicializando filtros...');
    await this.app.filters.setup();
    console.log('✅ Filtros inicializados');

    // ❤️ CRÍTICO: Inicializar handler de favoritos
    if (window.favoritesHandler && !window.favoritesHandler.initialized) {
      await window.favoritesHandler.init();
    }

    this.renderPropertiesPage();
    this.setupPropertyListeners();
  }

  /**
   * Renderizar página de propiedades con filtros y paginación
   */
  renderPropertiesPage() {
    console.log('🎨 Renderizando propiedades page...');

    const filtered = this.app.filters.getFiltered(this.allProperties);
    const pageData = this.app.pagination.getPageData(filtered);

    console.log(`🔍 Propiedades filtradas: ${filtered.length}`);
    console.log(`📄 Propiedades en página: ${pageData.length}`);

    // ✅ ACTUALIZAR CONTADOR con propiedades filtradas
    const propCountElement = document.getElementById('propCount');
    if (propCountElement) {
      propCountElement.textContent = filtered.length;
    }

    const container = document.getElementById('propertiesGrid');
    if (!container) {
      console.error('❌ No se encontró #propertiesGrid');
      return;
    }

    if (pageData.items.length === 0) {
      container.innerHTML = '<div class="empty-state"><p>No se encontraron propiedades con los filtros aplicados.</p></div>';
      const paginadorContainer = document.getElementById('paginadorContainer');
      if (paginadorContainer) paginadorContainer.innerHTML = '';
      return;
    }

    container.innerHTML = this.generatePropertiesHTML(pageData);
    
    // ✅ IMPORTANTE: Re-configurar listeners después de renderizar
    setTimeout(() => {
      this.setupPropertyListeners();
    }, 50);

    // Renderizar paginador
    const paginadorContainer = document.getElementById('paginadorContainer');
    if (paginadorContainer) {
      const paginadorHTML = this.app.pagination.render(filtered.length);
      paginadorContainer.innerHTML = paginadorHTML;
      this.app.pagination.setupListeners();
      console.log('✅ Paginador renderizado');
    }

    // Setup carousel
    this.app.carousel.setup();
    console.log('✅ Renderizado completo');
  }

  /**
   * Generar HTML para las propiedades
   */
  generatePropertiesHTML(pageData) {
    const baseUrl = 'https://ik.imagekit.io/quadrante/';
    
    return pageData.items.map((prop, index) => {
      let imagenes = [];

      if (prop.imagenes && prop.imagenes.length > 0) {
        imagenes = prop.imagenes.map(img => {
          if (img.startsWith('http://') || img.startsWith('https://')) return img;
          return baseUrl + img;
        });
      } else if (prop.imagen_principal) {
        imagenes = [prop.imagen_principal];
      } else {
        imagenes = ['https://via.placeholder.com/400x300?text=Sin+Imagen'];
      }

      const precio = prop.precio_alquiler ?
        `S/ ${parseFloat(prop.precio_alquiler).toLocaleString('es-PE')}/mes` :
        prop.precio_venta ?
        `S/ ${parseFloat(prop.precio_venta).toLocaleString('es-PE')}` :
        'Precio no disponible';

      const estadoBadge = {
        'publicado': { color: 'var(--azul-corporativo)', text: 'PUBLICADO' },
        'borrador': { color: 'var(--dorado)', text: 'BORRADOR' },
        'pausado': { color: 'var(--azul-medio)', text: 'PAUSADO' },
        'vendido': { color: 'var(--azul-claro)', text: 'VENDIDO' }
      }[prop.estado] || { color: 'var(--gris-medio)', text: 'BORRADOR' };

      const estadoCRMBadge = {
        'lead': { bg: 'transparent', border: 'transparent', color: 'var(--gris-medio)', text: '🔍 Lead', noBorder: true },
        'contactado': { bg: 'white', border: 'var(--azul-corporativo)', color: 'var(--azul-corporativo)', text: '📞 Contactado' },
        'visita_programada': { bg: 'white', border: 'var(--azul-corporativo)', color: 'var(--azul-corporativo)', text: '📅 Visita' },
        'negociacion': { bg: 'white', border: 'var(--azul-corporativo)', color: 'var(--azul-corporativo)', text: '💼 Negociación' },
        'cerrado_ganado': { bg: 'white', border: 'var(--dorado)', color: 'var(--dorado)', text: '✅ Ganado' },
        'cerrado_perdido': { bg: 'white', border: 'var(--dorado-hover)', color: 'var(--dorado-hover)', text: '❌ Perdido' }
      }[prop.estado_crm] || { bg: 'transparent', border: 'transparent', color: 'var(--gris-medio)', text: '', noBorder: true };

      return `
        <div class="property-card" data-property-id="${prop.registro_cab_id}">
          <div class="property-number">${pageData.startIndex + index + 1}</div>

          <!-- ❤️ Botón de Favorito -->
          <button class="favorite-btn-beautiful ${prop.es_favorito ? 'is-favorite' : ''}"
                  data-favorite-property="${prop.registro_cab_id}"
                  title="${prop.es_favorito ? 'Quitar de favoritos' : 'Agregar a favoritos'}">
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
            <div class="carousel-images" data-current="0">
              ${imagenes.map((img, i) => `
                <img src="${img}" alt="${prop.titulo} - imagen ${i+1}"
                     class="carousel-image ${i === 0 ? 'active' : ''}" data-index="${i}"
                     onerror="this.style.display='none'">
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
            <h3 class="property-title">${prop.titulo || 'Sin título'}</h3>
            <div class="property-location">📍 ${prop.direccion || 'Ubicación no disponible'}</div>
            <div class="property-price">${precio}</div>
            <div class="property-features">
              <span class="feature">📐 ${prop.area || 0} m²</span>
              ${prop.banos ? `<span class="feature">🛁 ${prop.banos} baños</span>` : ''}
              ${prop.parqueos ? `<span class="feature">🚗 ${prop.parqueos} parqueos</span>` : ''}
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
              <div class="property-contact" style="background: white; border-left: 3px solid var(--azul-corporativo); border-radius: 6px; padding: 6px 8px; margin: 0.4rem 0;">
                <div style="font-size: 0.7rem; color: var(--gris-medio); margin-bottom: 3px; font-weight: 600;">👤 Contacto</div>

                <div style="display: flex; gap: 4px; flex-wrap: wrap; align-items: center;">
                  ${this.app.currentUser?.perfil_id === 4 && (prop.propietario_real_nombre || prop.propietario_nombre) ? `
                    <span style="display: inline-flex; align-items: center; gap: 3px; padding: 2px 6px; background: white; color: var(--azul-corporativo); border: 2px solid var(--azul-corporativo); border-radius: 4px; font-size: 0.7rem; font-weight: 600;">
                      👤 ${prop.propietario_real_nombre || prop.propietario_nombre}
                    </span>
                  ` : ''}
                  ${(prop.telefono || prop.propietario_real_telefono) ? `
                    <a href="tel:${prop.telefono || prop.propietario_real_telefono}" style="display: inline-flex; align-items: center; gap: 3px; padding: 2px 6px; background: white; color: var(--azul-corporativo); border: 2px solid var(--azul-corporativo); border-radius: 4px; text-decoration: none; font-size: 0.7rem; font-weight: 600; transition: all 0.2s;">
                      📱 ${prop.telefono || prop.propietario_real_telefono}
                    </a>
                  ` : ''}
                  ${(prop.email || prop.propietario_real_email) ? `
                    <a href="mailto:${prop.email || prop.propietario_real_email}" style="display: inline-flex; align-items: center; gap: 3px; padding: 2px 6px; background: white; color: var(--azul-corporativo); border: 2px solid var(--azul-corporativo); border-radius: 4px; text-decoration: none; font-size: 0.7rem; font-weight: 600; transition: all 0.2s;">
                      📧 ${prop.email || prop.propietario_real_email}
                    </a>
                  ` : ''}
                </div>
              </div>
            ` : ''}

            <p class="property-description">${(prop.descripcion || '').substring(0, 120)}...</p>

            <div class="admin-actions-simple" style="display: grid; grid-template-columns: repeat(auto-fit, minmax(90px, 1fr)); gap: 0.5rem;">
              <button class="btn-admin" data-view-property="${prop.registro_cab_id}">📄 Detalle</button>
              ${prop.latitud && prop.longitud ? `
                <button class="btn-admin" data-map-property="${prop.registro_cab_id}" data-lat="${prop.latitud}" data-lng="${prop.longitud}">🗺️ Mapa</button>
              ` : `
                <button class="btn-admin" disabled style="opacity: 0.5; cursor: not-allowed;" title="Sin coordenadas de ubicación">🗺️ Mapa</button>
              `}
              <button class="btn-admin" data-edit-property="${prop.registro_cab_id || prop.id}" style="background: var(--azul-corporativo); color: white;" title="Editar propiedad ID: ${prop.registro_cab_id || prop.id}" onclick="console.log('🔥🔥🔥 CLICK DIRECTO EN EDITAR!!!', this.dataset.editProperty); window.propiedadesTab.editarPropiedad(this.dataset.editProperty)">
              ✏️ Editar
            </button>
              ${prop.estado === 'borrador' && this.app.currentUser?.perfil_id === 4 ? `
                <button class="btn-admin" data-publish-property="${prop.registro_cab_id}" style="background: #28a745; color: white; border: 2px solid #28a745;" title="Publicar propiedad" onclick="console.log('🚀 PUBLICANDO PROPIEDAD!!!', this.dataset.publishProperty); window.propiedadesTab.publicarPropiedad(this.dataset.publishProperty)">
                  🚀 Publicar
                </button>
              ` : ''}
              ${this.app.currentUser?.perfil_id === 4 ? `
                <button class="btn-admin" data-assign-broker="${prop.registro_cab_id}" style="background: var(--dorado); color: white;">👤 Asignar</button>
              ` : ''}
            </div>
          </div>
        </div>
      `;
    }).join('');
  }

  /**
   * Configurar event listeners de propiedades
   */
  setupPropertyListeners() {
    console.log('🎯 Configurando listeners de propiedades...');

    // Ver detalle
    const viewBtns = document.querySelectorAll('[data-view-property]');
    console.log(`📄 Botones [data-view-property] encontrados: ${viewBtns.length}`);

    viewBtns.forEach((btn, index) => {
      console.log(`📄 Agregando listener a botón ${index}:`, btn);
      btn.addEventListener('click', async (e) => {
        console.log('🔥🔥🔥 CLICK EN VER DETALLE!!!', e.currentTarget.dataset.viewProperty);
        e.stopPropagation();
        e.preventDefault();
        const propId = e.currentTarget.dataset.viewProperty;
        console.log('📄 Mostrando popup de propId:', propId);
        await this.showPropertyDetailPopup(propId);
      });
    });

    // Mapa
    const mapBtns = document.querySelectorAll('[data-map-property]');
    console.log(`🗺️ Botones [data-map-property] encontrados: ${mapBtns.length}`);

    mapBtns.forEach((btn, index) => {
      console.log(`🗺️ Agregando listener a botón mapa ${index}:`, btn);
      btn.addEventListener('click', (e) => {
        console.log('🔥🔥🔥 CLICK EN MAPA!!!', e.currentTarget.dataset);
        e.stopPropagation();
        e.preventDefault();
        const lat = e.currentTarget.dataset.lat;
        const lng = e.currentTarget.dataset.lng;
        console.log('🗺️ Abriendo mapa con coords:', lat, lng);
        this.showMapPopup(lat, lng);
      });
    });

    // Editar
    const editBtns = document.querySelectorAll('[data-edit-property]');
    console.log(`✏️ Botones [data-edit-property] encontrados: ${editBtns.length}`);

    editBtns.forEach((btn, index) => {
      console.log(`✏️ Agregando listener a botón editar ${index}:`, btn);
      console.log(`🆔 ID del botón ${index}:`, btn.dataset.editProperty);
      
      btn.addEventListener('click', async (e) => {
        console.log('🔥🔥🔥 CLICK EN EDITAR!!!', e.currentTarget.dataset.editProperty);
        console.log('🏢 Datos completos de la propiedad:', e.currentTarget.closest('.property-card')?.dataset.propertyId);
        
        e.stopPropagation();
        e.preventDefault();
        const propId = parseInt(e.currentTarget.dataset.editProperty);

        if (!propId || isNaN(propId)) {
          console.error('❌ ID inválido:', propId);
          showNotification('❌ Error: ID de propiedad inválido', 'error');
          return;
        }

        console.log('✏️ Abriendo formulario de edición para propId:', propId);
        const propertyForm = new PropertyForm(this.app, propId);
        await propertyForm.init();
      });
    });

    // ❤️ FAVORITOS: Usar el nuevo módulo desacoplado
    // Solo refrescamos los botones, los listeners ya están configurados globalmente
    if (window.favoritesHandler && window.favoritesHandler.initialized) {
      window.favoritesHandler.refreshAllButtons();
      console.log('✅ Botones de favoritos refrescados');
    } else {
      console.warn('⚠️ FavoritesHandler no inicializado aún');
    }

    // Asignar corredor (solo admin)
    const assignBtns = document.querySelectorAll('[data-assign-broker]');
    console.log(`👤 Botones [data-assign-broker] encontrados: ${assignBtns.length}`);

    assignBtns.forEach(btn => {
      btn.addEventListener('click', async (e) => {
        e.stopPropagation();
        const propId = e.currentTarget.dataset.assignBroker;
        await this.showAssignBrokerPopup(propId);
      });
    });

    // Nueva Propiedad
    const btnNuevaPropiedad = document.getElementById('btnNuevaPropiedad');
    if (btnNuevaPropiedad) {
      console.log('✅ Botón Nueva Propiedad encontrado:', btnNuevaPropiedad);
      btnNuevaPropiedad.addEventListener('click', (e) => {
        console.log('🔥🔥🔥 CLICK EN NUEVA PROPIEDAD!!!');
        e.preventDefault();
        e.stopPropagation();
        console.log('➕ Abriendo formulario de nueva propiedad');
        this.showPropertyForm();
      });
    } else {
      console.error('❌ Botón Nueva Propiedad NO encontrado!');
    }

    console.log('✅ Listeners configurados');
  }

  /**
   * 🔥 NUEVO: Método directo para editar propiedad
   */
  editarPropiedad(propId) {
    console.log('🔥🔥🔥 MÉTODO DIRECTO EDITAR PROPIEDAD!!!', propId);
    
    const propIdNum = parseInt(propId);
    if (!propIdNum || isNaN(propIdNum)) {
      console.error('❌ ID inválido:', propId);
      showNotification('❌ Error: ID de propiedad inválido', 'error');
      return;
    }

    console.log('✏️ Abriendo formulario de edición para propId:', propIdNum);
    const propertyForm = new PropertyForm(this.app, propIdNum);
    propertyForm.init();
  }

  /**
   * 🔄 FORZAR RECARGA COMPLETA de propiedades
   */
  async forceReloadProperties() {
    try {
      console.log('🔄 Forzando recarga completa de propiedades...');
      
      // Limpiar cache actual
      this.allProperties = [];
      
      // Recargar datos frescos desde API
      await this.getPropiedadesContent();
      
      // Re-renderizar toda la vista
      this.renderPropertiesPage();
      
      // ✅ IMPORTANTE: Re-configurar listeners después de re-renderizar
      setTimeout(() => {
        this.setupPropertyListeners();
      }, 100);
      
      console.log('✅ Recarga completa finalizada');
      
    } catch (error) {
      console.error('❌ Error en recarga completa:', error);
    }
  }

  /**
   * 🚀 NUEVO: Método para publicar propiedad (solo admin) con SweetAlert2
   */
  async publicarPropiedad(propId) {
    console.log('🚀 MÉTODO PUBLICAR PROPIEDAD!!!', propId);
    
    const propIdNum = parseInt(propId);
    if (!propIdNum || isNaN(propIdNum)) {
      console.error('❌ ID inválido:', propId);
      
      Swal.fire({
        icon: 'error',
        title: '❌ Error',
        text: 'ID de propiedad inválido',
        confirmButtonColor: '#dc3545',
        background: '#FFFFFF',
        color: '#333333'
      });
      return;
    }

    // SweetAlert2 de confirmación con diseño corporativo
    const result = await Swal.fire({
      title: '🚀 Publicar Propiedad',
      html: `
        <div style="text-align: left; padding: 10px 0;">
          <p style="margin: 10px 0; color: #333333;">
            ¿Estás seguro de publicar esta propiedad?
          </p>
          <div style="background: #f0f0f0; padding: 15px; border-radius: 8px; margin: 15px 0;">
            <p style="margin: 5px 0; font-size: 14px; color: #666666;">
              <strong>Cambio:</strong> 
              <span style="color: #ffc107; font-weight: bold;">BORRADOR</span>
              → 
              <span style="color: #28a745; font-weight: bold;">PUBLICADO</span>
            </p>
            <p style="margin: 5px 0; font-size: 14px; color: #666666;">
              <strong>ID:</strong> ${propIdNum}
            </p>
          </div>
          <p style="margin: 10px 0; font-size: 13px; color: #666666;">
            La propiedad será visible para todos los usuarios
          </p>
        </div>
      `,
      icon: 'question',
      showCancelButton: true,
      confirmButtonText: '🚀 Sí, Publicar',
      cancelButtonText: '❌ Cancelar',
      confirmButtonColor: '#28a745',
      cancelButtonColor: '#666666',
      background: '#FFFFFF',
      color: '#333333',
      customClass: {
        popup: 'swal-publicar-popup',
        header: 'swal-publicar-header',
        title: 'swal-publicar-title',
        content: 'swal-publicar-content'
      }
    });

    if (!result.isConfirmed) {
      return;
    }

    // Mostrar loading
    Swal.fire({
      title: '🚀 Publicando...',
      text: 'Por favor espera mientras se publica la propiedad',
      allowOutsideClick: false,
      didOpen: () => {
        Swal.showLoading();
      },
      background: '#FFFFFF',
      color: '#333333'
    });

    try {
      const token = authService.getToken();
      const response = await fetch(`${API_CONFIG.BASE_URL}/propiedades/${propIdNum}/publicar`, {
        method: 'PUT',
        headers: { 
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ estado: 'publicado' })
      });

      if (!response.ok) {
        throw new Error(`Error ${response.status}: ${response.statusText}`);
      }

      const result = await response.json();
      console.log('✅ Propiedad publicada:', result);
      
      // Success con diseño corporativo
      Swal.fire({
        icon: 'success',
        title: '✅ ¡Propiedad Publicada!',
        html: `
          <div style="text-align: center; padding: 10px 0;">
            <p style="margin: 10px 0; color: #333333;">
              La propiedad ha sido publicada exitosamente
            </p>
            <div style="background: linear-gradient(135deg, #28a745, #20c997); color: white; padding: 10px; border-radius: 6px; margin: 15px 0;">
              <p style="margin: 5px 0; font-size: 14px;">
                <strong>Estado:</strong> PUBLICADO
              </p>
              <p style="margin: 5px 0; font-size: 14px;">
                <strong>ID:</strong> ${propIdNum}
              </p>
            </div>
            <p style="margin: 10px 0; font-size: 13px; color: #666666;">
              Ahora es visible para todos los usuarios
            </p>
          </div>
        `,
        confirmButtonColor: '#28a745',
        confirmButtonText: '🎉 Entendido',
        background: '#FFFFFF',
        color: '#333333',
        timer: 4000,
        timerProgressBar: true
      });
      
      // ✅ CORREGIDO: Recargar la lista de propiedades correctamente
      console.log('🔄 Recargando lista de propiedades después de publicar...');
      await this.forceReloadProperties();
      
    } catch (error) {
      console.error('❌ Error al publicar propiedad:', error);
      
      Swal.fire({
        icon: 'error',
        title: '❌ Error al Publicar',
        html: `
          <div style="text-align: left; padding: 10px 0;">
            <p style="margin: 10px 0; color: #333333;">
              No se pudo publicar la propiedad
            </p>
            <div style="background: #f0f0f0; padding: 10px; border-radius: 6px; margin: 10px 0;">
              <p style="margin: 5px 0; font-size: 13px; color: #dc3545;">
                <strong>Error:</strong> ${error.message}
              </p>
            </div>
            <p style="margin: 10px 0; font-size: 13px; color: #666666;">
              Por favor, intenta nuevamente más tarde
            </p>
          </div>
        `,
        confirmButtonColor: '#dc3545',
        confirmButtonText: '❌ Cerrar',
        background: '#FFFFFF',
        color: '#333333'
      });
    }
  }

  /**
   * Mostrar formulario de propiedad
   */
  showPropertyForm(propId = null) {
    console.log('🎯 Abriendo formulario de propiedad...', propId ? `Editar ID: ${propId}` : 'Nueva');
    const form = new PropertyForm(this.app, propId);
    form.init();
  }

  /**
   * 🔥 REESCRITO DESDE CERO - Mostrar popup de detalle de propiedad
   */
  async showPropertyDetailPopup(propId) {
    console.log(`📄📄📄 MOSTRANDO DETALLE DE PROPIEDAD ID: ${propId}`);

    try {
      // 1️⃣ Obtener datos de la propiedad
      const token = authService.getToken();
      const response = await fetch(`${API_CONFIG.BASE_URL}/propiedades/${propId}`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });

      if (!response.ok) throw new Error(`Error HTTP: ${response.status}`);

      const data = await response.json();
      const prop = data.data || data;
      console.log('✅ Propiedad cargada:', prop.titulo);

      // 2️⃣ Crear modal (estructura HTML completa)
      const modal = document.createElement('div');
      modal.id = 'detailModal';
      modal.className = 'modal-overlay';
      modal.style.cssText = 'position: fixed; top: 0; left: 0; right: 0; bottom: 0; background: rgba(0,0,0,0.75); z-index: 99999; display: flex; align-items: center; justify-content: center; padding: 20px;';

      // 3️⃣ Crear contenido del modal
      const modalContent = document.createElement('div');
      modalContent.className = 'modal-content';
      modalContent.style.cssText = 'background: white; border-radius: 16px; max-width: 700px; width: 100%; max-height: 90vh; overflow-y: auto; box-shadow: 0 25px 80px rgba(0,0,0,0.4);';

      modalContent.innerHTML = `
        <div style="padding: var(--spacing-xl); border-bottom: 2px solid var(--borde); display: flex; justify-content: space-between; align-items: center; background: linear-gradient(135deg, var(--azul-corporativo) 0%, var(--azul-medio) 100%); color: white; border-radius: 16px 16px 0 0;">
          <h2 style="margin: 0; color: white; display: flex; align-items: center; gap: 10px;">
            <svg xmlns="http://www.w3.org/2000/svg" width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"></path>
              <polyline points="9 22 9 12 15 12 15 22"></polyline>
            </svg>
            Detalles de Propiedad
          </h2>
          <button class="btn-close-modal" style="background: rgba(255,255,255,0.2); border: none; font-size: 28px; cursor: pointer; color: white; width: 40px; height: 40px; border-radius: 50%; transition: var(--transition-fast); display: flex; align-items: center; justify-content: center;" onmouseover="this.style.background='rgba(255,255,255,0.3)'" onmouseout="this.style.background='rgba(255,255,255,0.2)'">&times;</button>
        </div>
        <div style="padding: var(--spacing-xl);">
          <h3 style="margin-top: 0; color: var(--azul-corporativo); font-size: 1.5rem;">${prop.titulo}</h3>
          <p style="color: var(--gris-medio); margin-bottom: var(--spacing-lg); display: flex; align-items: center; gap: 8px; font-size: 1rem;">
            <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"></path>
              <circle cx="12" cy="10" r="3"></circle>
            </svg>
            ${prop.direccion}, ${prop.distrito}
          </p>
          <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: var(--spacing-md); margin-bottom: var(--spacing-lg); padding: var(--spacing-md); background: linear-gradient(135deg, #f8f9fa 0%, #e9ecef 100%); border-radius: 12px; border: 1px solid var(--borde);">
            <div style="padding: var(--spacing-sm);"><strong style="color: var(--azul-corporativo);">🏢 Tipo:</strong> ${prop.tipo_inmueble}</div>
            <div style="padding: var(--spacing-sm);"><strong style="color: var(--azul-corporativo);">💼 Operación:</strong> ${prop.tipo_operacion}</div>
            <div style="padding: var(--spacing-sm);"><strong style="color: var(--azul-corporativo);">💰 Precio:</strong> S/ ${(prop.precio_venta || prop.precio_alquiler || 0).toLocaleString('es-PE')}</div>
            <div style="padding: var(--spacing-sm);"><strong style="color: var(--azul-corporativo);">📐 Área:</strong> ${prop.area} m²</div>
            <div style="padding: var(--spacing-sm);"><strong style="color: var(--azul-corporativo);">🛏️ Dormitorios:</strong> ${prop.dormitorios || 0}</div>
            <div style="padding: var(--spacing-sm);"><strong style="color: var(--azul-corporativo);">🚿 Baños:</strong> ${prop.banos || 0}</div>
            <div style="padding: var(--spacing-sm);"><strong style="color: var(--azul-corporativo);">🚗 Parqueos:</strong> ${prop.parqueos || 0}</div>
            <div style="padding: var(--spacing-sm);"><strong style="color: var(--azul-corporativo);">📊 Estado:</strong> ${prop.estado}</div>
          </div>
          <div style="margin-bottom: var(--spacing-lg); padding: var(--spacing-md); background: white; border-left: 4px solid var(--azul-corporativo); border-radius: 8px; box-shadow: var(--shadow-sm);">
            <strong style="color: var(--azul-corporativo); display: block; margin-bottom: 8px;">📝 Descripción:</strong>
            <p style="margin: 0; line-height: 1.6; color: var(--gris-oscuro);">${prop.descripcion || 'Sin descripción'}</p>
          </div>
          ${prop.caracteristicas && prop.caracteristicas.length > 0 ? `
            <div style="margin-bottom: var(--spacing-md);">
              <strong style="color: var(--azul-corporativo); display: block; margin-bottom: var(--spacing-sm);">✨ Características:</strong>
              <div style="display: flex; flex-wrap: wrap; gap: 10px; margin-top: 8px;">
                ${prop.caracteristicas.map(car => `
                  <span style="padding: 8px 14px; background: linear-gradient(135deg, var(--azul-corporativo) 0%, var(--azul-medio) 100%); color: white; border-radius: 8px; font-size: 0.9rem; font-weight: 500; box-shadow: var(--shadow-sm); display: flex; align-items: center; gap: 6px;">
                    <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3">
                      <polyline points="20 6 9 17 4 12"></polyline>
                    </svg>
                    ${car.nombre || car}
                  </span>
                `).join('')}
              </div>
            </div>
          ` : ''}
        </div>
        <div style="padding: var(--spacing-md) var(--spacing-lg); background: #f8f9fa; border-top: 1px solid var(--borde); display: flex; justify-content: space-between; align-items: center; gap: var(--spacing-sm); border-radius: 0 0 16px 16px;">
          <small style="color: var(--gris-medio); display: flex; align-items: center; gap: 6px;">
            <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <circle cx="12" cy="12" r="10"></circle>
              <path d="M12 16v-4"></path>
              <path d="M12 8h.01"></path>
            </svg>
            Click fuera o presiona <kbd style="background: white; border: 1px solid var(--borde); padding: 2px 6px; border-radius: 4px; font-family: monospace;">ESC</kbd>
          </small>
          <button class="btn-close-modal" style="padding: 10px 20px; background: var(--gris-medio); color: white; border: none; border-radius: 6px; cursor: pointer; font-weight: 600; transition: var(--transition-fast);" onmouseover="this.style.background='var(--gris-oscuro)'" onmouseout="this.style.background='var(--gris-medio)'">Cerrar</button>
        </div>
      `;

      modal.appendChild(modalContent);
      document.body.appendChild(modal);
      console.log('✅ Modal insertado en DOM');

      // 4️⃣ Función para cerrar modal (UNA SOLA VEZ)
      const closeModal = () => {
        console.log('🔒 Cerrando modal de detalle');
        modal.remove();
        document.removeEventListener('keydown', escapeHandler);
      };

      // 5️⃣ Event Listeners
      // Click en overlay (fondo oscuro)
      modal.addEventListener('click', (e) => {
        if (e.target === modal) {
          console.log('✅ Click en overlay');
          closeModal();
        }
      });

      // Click en botones "Cerrar" (todos los que tengan la clase)
      modalContent.querySelectorAll('.btn-close-modal').forEach(btn => {
        btn.addEventListener('click', (e) => {
          e.stopPropagation();
          console.log('✅ Click en botón cerrar');
          closeModal();
        });
      });

      // Tecla ESC
      const escapeHandler = (e) => {
        if (e.key === 'Escape') {
          console.log('✅ Tecla ESC presionada');
          closeModal();
        }
      };
      document.addEventListener('keydown', escapeHandler);

      console.log('✅ Listeners configurados correctamente');

    } catch (error) {
      console.error('❌ Error mostrando detalle:', error);
      showNotification('Error al cargar detalles de la propiedad', 'error');
    }
  }

  /**
   * 🔥 REESCRITO DESDE CERO - Mostrar popup de mapa
   */
  showMapPopup(lat, lng) {
    console.log(`🗺️🗺️🗺️ MOSTRANDO MAPA - lat: ${lat}, lng: ${lng}`);

    // 1️⃣ Validar coordenadas
    lat = parseFloat(lat);
    lng = parseFloat(lng);

    if (!lat || !lng || isNaN(lat) || isNaN(lng)) {
      console.error('❌ Coordenadas inválidas:', { lat, lng });
      showNotification('📍 Esta propiedad no tiene coordenadas de ubicación', 'warning');
      return;
    }

    console.log('✅ Coordenadas válidas:', { lat, lng });

    // 2️⃣ Crear modal
    const modal = document.createElement('div');
    modal.id = 'mapModal';
    modal.className = 'modal-overlay';
    modal.style.cssText = 'position: fixed; top: 0; left: 0; right: 0; bottom: 0; background: rgba(0,0,0,0.75); z-index: 99999; display: flex; align-items: center; justify-content: center; padding: 20px;';

    // 3️⃣ Crear contenido
    const modalContent = document.createElement('div');
    modalContent.className = 'modal-content';
    modalContent.style.cssText = 'background: white; border-radius: 16px; max-width: 900px; width: 100%; max-height: 90vh; overflow: hidden; box-shadow: 0 25px 80px rgba(0,0,0,0.4);';

    modalContent.innerHTML = `
      <div style="padding: var(--spacing-lg); border-bottom: 2px solid var(--borde); display: flex; justify-content: space-between; align-items: center; background: linear-gradient(135deg, var(--azul-corporativo) 0%, var(--azul-medio) 100%); color: white; border-radius: 16px 16px 0 0;">
        <h2 style="margin: 0; color: white; display: flex; align-items: center; gap: 10px;">
          <svg xmlns="http://www.w3.org/2000/svg" width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"></path>
            <circle cx="12" cy="10" r="3"></circle>
          </svg>
          Ubicación en Mapa
        </h2>
        <button class="btn-close-map" style="background: rgba(255,255,255,0.2); border: none; font-size: 28px; cursor: pointer; color: white; width: 40px; height: 40px; border-radius: 50%; transition: var(--transition-fast); display: flex; align-items: center; justify-content: center;" onmouseover="this.style.background='rgba(255,255,255,0.3)'" onmouseout="this.style.background='rgba(255,255,255,0.2)'">&times;</button>
      </div>
      <div style="padding: var(--spacing-lg);">
        <div id="propertyMap" style="height: 500px; border-radius: 12px; border: 2px solid var(--borde); box-shadow: var(--shadow-md);"></div>
        <div style="margin-top: var(--spacing-lg); display: flex; flex-direction: column; align-items: center; gap: var(--spacing-md); padding: var(--spacing-md); background: linear-gradient(135deg, #f8f9fa 0%, #e9ecef 100%); border-radius: 12px; border: 1px solid var(--borde);">
          <div style="display: flex; align-items: center; gap: 8px; color: var(--gris-oscuro); font-size: 0.95rem;">
            <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <circle cx="12" cy="12" r="10"></circle>
              <path d="M12 6v6l4 2"></path>
            </svg>
            <strong>Coordenadas:</strong> ${lat}, ${lng}
          </div>
          <a
            href="https://www.google.com/maps?q=${lat},${lng}"
            target="_blank"
            style="display: inline-flex; align-items: center; gap: 10px; padding: 12px 24px; background: linear-gradient(135deg, var(--azul-corporativo) 0%, var(--azul-claro) 100%); color: white; text-decoration: none; border-radius: 8px; font-weight: 600; font-size: 1rem; box-shadow: var(--shadow-md); transition: all var(--transition-fast); border: none;"
            onmouseover="this.style.transform='translateY(-2px)'; this.style.boxShadow='0 8px 20px rgba(44, 82, 130, 0.4)'"
            onmouseout="this.style.transform='translateY(0)'; this.style.boxShadow='var(--shadow-md)'"
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">
              <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"></path>
              <circle cx="12" cy="10" r="3"></circle>
            </svg>
            Abrir en Google Maps
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">
              <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"></path>
              <polyline points="15 3 21 3 21 9"></polyline>
              <line x1="10" y1="14" x2="21" y2="3"></line>
            </svg>
          </a>
        </div>
      </div>
      <div style="padding: var(--spacing-md) var(--spacing-lg); background: #f8f9fa; border-top: 1px solid var(--borde); display: flex; justify-content: space-between; align-items: center; gap: var(--spacing-sm); border-radius: 0 0 16px 16px;">
        <small style="color: var(--gris-medio); display: flex; align-items: center; gap: 6px;">
          <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <circle cx="12" cy="12" r="10"></circle>
            <path d="M12 16v-4"></path>
            <path d="M12 8h.01"></path>
          </svg>
          Click fuera o presiona <kbd style="background: white; border: 1px solid #ccc; padding: 2px 6px; border-radius: 4px; font-family: monospace;">ESC</kbd>
        </small>
        <button class="btn-close-map" style="padding: 10px 20px; background: var(--gris-medio); color: white; border: none; border-radius: 6px; cursor: pointer; font-weight: 600; transition: var(--transition-fast);" onmouseover="this.style.background='var(--gris-oscuro)'" onmouseout="this.style.background='var(--gris-medio)'">Cerrar</button>
      </div>
    `;

    modal.appendChild(modalContent);
    document.body.appendChild(modal);
    console.log('✅ Modal de mapa insertado en DOM');

    // 4️⃣ Función para cerrar modal
    const closeModal = () => {
      console.log('🔒 Cerrando modal de mapa');
      modal.remove();
      document.removeEventListener('keydown', escapeHandler);
    };

    // 5️⃣ Event Listeners
    // Click en overlay (fondo oscuro)
    modal.addEventListener('click', (e) => {
      if (e.target === modal) {
        console.log('✅ Click en overlay de mapa');
        closeModal();
      }
    });

    // Click en botones "Cerrar"
    modalContent.querySelectorAll('.btn-close-map').forEach(btn => {
      btn.addEventListener('click', (e) => {
        e.stopPropagation();
        console.log('✅ Click en botón cerrar mapa');
        closeModal();
      });
    });

    // Tecla ESC
    const escapeHandler = (e) => {
      if (e.key === 'Escape') {
        console.log('✅ Tecla ESC presionada en mapa');
        closeModal();
      }
    };
    document.addEventListener('keydown', escapeHandler);

    console.log('✅ Listeners de mapa configurados');

    // 6️⃣ Inicializar mapa Leaflet
    setTimeout(() => {
      console.log('🗺️ Inicializando Leaflet...');
      const map = L.map('propertyMap').setView([lat, lng], 16);
      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '© OpenStreetMap contributors',
        maxZoom: 19
      }).addTo(map);
      L.marker([lat, lng]).addTo(map);
      console.log('✅ Mapa Leaflet inicializado');
    }, 100);
  }

  /**
   * 🔥 REESCRITO DESDE CERO - Popup de asignar corredor con búsqueda, estado CRM y comisión
   */
  async showAssignBrokerPopup(propId) {
    console.log(`👤👤👤 MOSTRANDO POPUP ASIGNAR CORREDOR - Propiedad ID: ${propId}`);

    try {
      const token = authService.getToken();

      // 1️⃣ Obtener datos de la propiedad actual
      const propResponse = await fetch(`${API_CONFIG.BASE_URL}/propiedades/${propId}`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const propData = await propResponse.json();
      const property = propData.data || propData;

      // 2️⃣ Obtener lista de corredores (perfil_id = 3)
      const response = await fetch(`${API_CONFIG.BASE_URL}/usuarios?perfil_id=3`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });

      if (!response.ok) {
        showNotification('Error al cargar corredores', 'error');
        return;
      }

      const data = await response.json();
      const corredores = data.data || [];

      if (corredores.length === 0) {
        showNotification('No hay corredores disponibles', 'warning');
        return;
      }

      console.log(`✅ ${corredores.length} corredores cargados`);

      // 3️⃣ Crear modal
      const modal = document.createElement('div');
      modal.id = 'assignBrokerModal';
      modal.className = 'modal-overlay';
      modal.style.cssText = 'position: fixed; top: 0; left: 0; right: 0; bottom: 0; background: rgba(0,0,0,0.75); z-index: 99999; display: flex; align-items: center; justify-content: center; padding: 20px;';

      // 4️⃣ Crear contenido del modal
      const modalContent = document.createElement('div');
      modalContent.className = 'modal-content';
      modalContent.style.cssText = 'background: white; border-radius: 16px; max-width: 800px; width: 100%; max-height: 90vh; overflow-y: auto; box-shadow: 0 25px 80px rgba(0,0,0,0.4);';

      // Estados CRM
      const estadosCRM = [
        { value: 'nuevo_lead', label: 'Nuevo Lead', color: 'var(--azul-claro)' },
        { value: 'contactado', label: 'Contactado', color: 'var(--azul-corporativo)' },
        { value: 'en_negociacion', label: 'En Negociación', color: 'var(--dorado)' },
        { value: 'calificado', label: 'Calificado', color: 'var(--azul-medio)' },
        { value: 'propuesta_enviada', label: 'Propuesta Enviada', color: 'var(--dorado-hover)' },
        { value: 'cerrado_ganado', label: 'Cerrado Ganado', color: 'var(--azul-corporativo)' },
        { value: 'cerrado_perdido', label: 'Cerrado Perdido', color: 'var(--dorado-hover)' }
      ];

      modalContent.innerHTML = `
        <div style="padding: var(--spacing-xl); border-bottom: 2px solid var(--borde); display: flex; justify-content: space-between; align-items: center; background: linear-gradient(135deg, var(--azul-corporativo) 0%, var(--azul-medio) 100%); color: white; border-radius: 16px 16px 0 0;">
          <h2 style="margin: 0; color: white; display: flex; align-items: center; gap: 10px;">
            <svg xmlns="http://www.w3.org/2000/svg" width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path>
              <circle cx="9" cy="7" r="4"></circle>
              <path d="M23 21v-2a4 4 0 0 0-3-3.87"></path>
              <path d="M16 3.13a4 4 0 0 1 0 7.75"></path>
            </svg>
            Asignar Corredor
          </h2>
          <button class="btn-close-broker" style="background: rgba(255,255,255,0.2); border: none; font-size: 28px; cursor: pointer; color: white; width: 40px; height: 40px; border-radius: 50%; transition: var(--transition-fast); display: flex; align-items: center; justify-content: center;" onmouseover="this.style.background='rgba(255,255,255,0.3)'" onmouseout="this.style.background='rgba(255,255,255,0.2)'">&times;</button>
        </div>

        <div style="padding: var(--spacing-xl);">
          <!-- Título de propiedad -->
          <div style="margin-bottom: var(--spacing-lg); padding: var(--spacing-md); background: linear-gradient(135deg, #f8f9fa 0%, #e9ecef 100%); border-radius: 8px; border-left: 4px solid var(--azul-corporativo);">
            <small style="color: var(--gris-medio); display: block; margin-bottom: 4px;">Propiedad:</small>
            <strong style="color: var(--azul-corporativo); font-size: 1.1rem;">${property.titulo}</strong>
          </div>

          <!-- Formulario -->
          <form id="brokerAssignForm">
            <!-- Buscar Corredor -->
            <div style="margin-bottom: var(--spacing-lg);">
              <label style="display: block; margin-bottom: 8px; font-weight: 600; color: var(--azul-corporativo); display: flex; align-items: center; gap: 6px;">
                <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <circle cx="11" cy="11" r="8"></circle>
                  <path d="m21 21-4.35-4.35"></path>
                </svg>
                Buscar Corredor:
              </label>
              <input
                type="text"
                id="brokerSearchInput"
                placeholder="Buscar por nombre o email..."
                style="width: 100%; padding: 12px; border: 2px solid var(--borde); border-radius: 8px; font-size: 1rem; transition: var(--transition-fast);"
                onfocus="this.style.borderColor='var(--azul-corporativo)'"
                onblur="this.style.borderColor='var(--borde)'"
              />
              <div id="brokerList" style="margin-top: var(--spacing-sm); max-height: 250px; overflow-y: auto; border: 2px solid var(--borde); border-radius: 8px; background: white;">
                ${corredores.map(corredor => `
                  <div
                    class="broker-item"
                    data-broker-id="${corredor.usuario_id}"
                    data-broker-name="${corredor.nombre} ${corredor.apellido}"
                    data-broker-email="${corredor.email}"
                    style="padding: var(--spacing-md); border-bottom: 1px solid var(--borde); cursor: pointer; transition: var(--transition-fast); display: flex; align-items: center; gap: var(--spacing-sm);"
                    onmouseover="this.style.background='#f8f9fa'"
                    onmouseout="this.style.background='white'"
                  >
                    <div style="width: 45px; height: 45px; border-radius: 50%; background: linear-gradient(135deg, var(--azul-corporativo) 0%, var(--azul-claro) 100%); color: white; display: flex; align-items: center; justify-content: center; font-weight: 700; font-size: 1.1rem; box-shadow: var(--shadow-sm);">
                      ${(corredor.nombre?.[0] || 'C').toUpperCase()}${(corredor.apellido?.[0] || '').toUpperCase()}
                    </div>
                    <div style="flex: 1;">
                      <div style="font-weight: 600; color: var(--azul-corporativo);">${corredor.nombre} ${corredor.apellido}</div>
                      <div style="font-size: 0.85rem; color: var(--gris-medio); display: flex; align-items: center; gap: 4px;">
                        <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                          <rect x="2" y="4" width="20" height="16" rx="2"></rect>
                          <path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7"></path>
                        </svg>
                        ${corredor.email}
                      </div>
                    </div>
                    <svg class="broker-check" xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" style="display: none; color: var(--azul-corporativo);">
                      <polyline points="20 6 9 17 4 12"></polyline>
                    </svg>
                  </div>
                `).join('')}
              </div>
            </div>

            <!-- Estado CRM -->
            <div style="margin-bottom: var(--spacing-lg);">
              <label style="display: block; margin-bottom: 8px; font-weight: 600; color: var(--azul-corporativo); display: flex; align-items: center; gap: 6px;">
                <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path>
                  <polyline points="22 4 12 14.01 9 11.01"></polyline>
                </svg>
                Estado CRM:
              </label>
              <select
                id="crmStatusSelect"
                required
                style="width: 100%; padding: 12px; border: 2px solid var(--borde); border-radius: 8px; font-size: 1rem; cursor: pointer; transition: var(--transition-fast); background: white;"
                onfocus="this.style.borderColor='var(--azul-corporativo)'"
                onblur="this.style.borderColor='var(--borde)'"
              >
                <option value="">Seleccionar estado...</option>
                ${estadosCRM.map(estado => `
                  <option value="${estado.value}">${estado.label}</option>
                `).join('')}
              </select>
            </div>

            <!-- Comisión -->
            <div style="margin-bottom: var(--spacing-lg);">
              <label style="display: block; margin-bottom: 8px; font-weight: 600; color: var(--azul-corporativo); display: flex; align-items: center; gap: 6px;">
                <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <line x1="12" y1="1" x2="12" y2="23"></line>
                  <path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"></path>
                </svg>
                Comisión (%):
              </label>
              <div style="position: relative;">
                <input
                  type="number"
                  id="comisionInput"
                  min="0"
                  max="100"
                  step="0.5"
                  placeholder="Ej: 5.5"
                  required
                  style="width: 100%; padding: 12px 40px 12px 12px; border: 2px solid var(--borde); border-radius: 8px; font-size: 1rem; transition: var(--transition-fast);"
                  onfocus="this.style.borderColor='var(--azul-corporativo)'"
                  onblur="this.style.borderColor='var(--borde)'"
                />
                <span style="position: absolute; right: 15px; top: 50%; transform: translateY(-50%); color: var(--gris-medio); font-weight: 600; font-size: 1.1rem;">%</span>
              </div>
              <small style="color: var(--gris-medio); display: block; margin-top: 6px;">Ingresa el porcentaje de comisión (0 - 100)</small>
            </div>
          </form>
        </div>

        <div style="padding: var(--spacing-md) var(--spacing-lg); background: #f8f9fa; border-top: 1px solid var(--borde); display: flex; justify-content: space-between; align-items: center; gap: var(--spacing-md); border-radius: 0 0 16px 16px;">
          <small style="color: var(--gris-medio); display: flex; align-items: center; gap: 6px;">
            <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <circle cx="12" cy="12" r="10"></circle>
              <path d="M12 16v-4"></path>
              <path d="M12 8h.01"></path>
            </svg>
            Completa todos los campos
          </small>
          <div style="display: flex; gap: var(--spacing-sm);">
            <button class="btn-close-broker" type="button" style="padding: 10px 20px; background: var(--gris-medio); color: white; border: none; border-radius: 6px; cursor: pointer; font-weight: 600; transition: var(--transition-fast);" onmouseover="this.style.background='var(--gris-oscuro)'" onmouseout="this.style.background='var(--gris-medio)'">Cancelar</button>
            <button id="btnSaveBroker" type="button" style="padding: 10px 24px; background: linear-gradient(135deg, var(--azul-corporativo) 0%, var(--azul-claro) 100%); color: white; border: none; border-radius: 6px; cursor: pointer; font-weight: 600; transition: var(--transition-fast); box-shadow: var(--shadow-md);" onmouseover="this.style.transform='translateY(-2px)'; this.style.boxShadow='0 8px 20px rgba(44, 82, 130, 0.4)'" onmouseout="this.style.transform='translateY(0)'; this.style.boxShadow='var(--shadow-md)'">
              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" style="vertical-align: middle; margin-right: 6px;">
                <polyline points="20 6 9 17 4 12"></polyline>
              </svg>
              Asignar Corredor
            </button>
          </div>
        </div>
      `;

      modal.appendChild(modalContent);
      document.body.appendChild(modal);
      console.log('✅ Modal de corredor insertado en DOM');

      // 5️⃣ Variables para formulario
      let selectedBrokerId = null;

      // 6️⃣ Event Listeners

      // Búsqueda de corredores
      const searchInput = document.getElementById('brokerSearchInput');
      const brokerItems = document.querySelectorAll('.broker-item');

      searchInput.addEventListener('input', (e) => {
        const query = e.target.value.toLowerCase();
        brokerItems.forEach(item => {
          const name = item.dataset.brokerName.toLowerCase();
          const email = item.dataset.brokerEmail.toLowerCase();
          if (name.includes(query) || email.includes(query)) {
            item.style.display = 'flex';
          } else {
            item.style.display = 'none';
          }
        });
      });

      // Seleccionar corredor
      brokerItems.forEach(item => {
        item.addEventListener('click', () => {
          // Limpiar selección anterior
          brokerItems.forEach(i => {
            i.style.background = 'white';
            i.style.borderLeft = 'none';
            i.querySelector('.broker-check').style.display = 'none';
          });

          // Marcar como seleccionado
          item.style.background = 'rgba(44, 82, 130, 0.05)';
          item.style.borderLeft = '4px solid var(--azul-corporativo)';
          item.querySelector('.broker-check').style.display = 'block';

          selectedBrokerId = item.dataset.brokerId;
          console.log('✅ Corredor seleccionado:', selectedBrokerId);
        });
      });

      // Función para cerrar modal
      const closeModal = () => {
        console.log('🔒 Cerrando modal de corredor');
        modal.remove();
        document.removeEventListener('keydown', escapeHandler);
      };

      // Click en overlay
      modal.addEventListener('click', (e) => {
        if (e.target === modal) {
          closeModal();
        }
      });

      // Botones cerrar/cancelar
      modalContent.querySelectorAll('.btn-close-broker').forEach(btn => {
        btn.addEventListener('click', (e) => {
          e.stopPropagation();
          closeModal();
        });
      });

      // Tecla ESC
      const escapeHandler = (e) => {
        if (e.key === 'Escape') {
          closeModal();
        }
      };
      document.addEventListener('keydown', escapeHandler);

      // Botón Guardar
      document.getElementById('btnSaveBroker').addEventListener('click', async () => {
        const crmStatus = document.getElementById('crmStatusSelect').value;
        const comision = document.getElementById('comisionInput').value;

        // Validaciones
        if (!selectedBrokerId) {
          showNotification('⚠️ Debes seleccionar un corredor', 'warning');
          return;
        }

        if (!crmStatus) {
          showNotification('⚠️ Debes seleccionar un estado CRM', 'warning');
          return;
        }

        if (!comision || parseFloat(comision) < 0 || parseFloat(comision) > 100) {
          showNotification('⚠️ La comisión debe estar entre 0 y 100%', 'warning');
          return;
        }

        // Llamar al método para asignar
        await this.assignBrokerToProperty(propId, selectedBrokerId, crmStatus, parseFloat(comision));
        closeModal();
      });

    } catch (error) {
      console.error('❌ Error en showAssignBrokerPopup:', error);
      showNotification('Error al mostrar corredores', 'error');
    }
  }

  /**
   * Asignar corredor a propiedad con estado CRM y comisión
   */
  async assignBrokerToProperty(propId, brokerId, crmStatus = null, comision = null) {
    try {
      const token = authService.getToken();

      // Preparar payload
      const payload = {
        corredor_id: parseInt(brokerId)
      };

      // Agregar estado CRM si está presente
      if (crmStatus) {
        payload.estado_crm = crmStatus;
      }

      // Agregar comisión si está presente
      if (comision !== null) {
        payload.comision = parseFloat(comision);
      }

      console.log('📤 Asignando corredor con datos:', payload);

      const response = await fetch(`${API_CONFIG.BASE_URL}/propiedades/${propId}/asignar-corredor`, {
        method: 'PATCH',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(payload)
      });

      if (!response.ok) {
        throw new Error('Error al asignar corredor');
      }

      const result = await response.json();
      console.log('✅ Corredor asignado:', result);

      showNotification('✅ Corredor asignado exitosamente', 'success');

      // Recargar las propiedades
      this.renderPropertiesPage();

    } catch (error) {
      console.error('❌ Error asignando corredor:', error);
      showNotification('❌ Error al asignar corredor', 'error');
    }
  }

  /**
   * Contenido de error
   */
  getErrorContent(error) {
    return `
      <div class="empty-state">
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"></path>
          <line x1="12" y1="9" x2="12" y2="13"></line>
          <line x1="12" y1="17" x2="12.01" y2="17"></line>
        </svg>
        <h3>Error al cargar contenido</h3>
        <p>${error.message || 'Por favor, intenta nuevamente.'}</p>
      </div>
    `;
  }

  /**
   * Lifecycle hook: Destruir
   */
  async destroy() {
    console.log('🗑️ Destruyendo PropiedadesTab');
    this.allProperties = [];
  }
}

// Exponer globalmente para el router
window.PropiedadesTab = PropiedadesTab;

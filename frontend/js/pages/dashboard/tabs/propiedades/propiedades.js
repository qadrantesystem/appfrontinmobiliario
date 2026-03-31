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
      
      const response = await fetch(url, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await response.json();

      const propiedades = data.data || [];
      const pagination = data.pagination || {};
      const estadisticas = data.estadisticas || {};
      
      // Si hay más propiedades, obtener la siguiente página
      if (pagination.total_pages > 1 && pagination.page === 1) {
        try {
          const page2Response = await fetch(`${API_CONFIG.BASE_URL}/propiedades/mis-propiedades?page=2&limit=100`, {
            headers: { 'Authorization': `Bearer ${token}` }
          });
          const page2Data = await page2Response.json();
          const page2Propiedades = page2Data.data || [];
          propiedades.push(...page2Propiedades);
        } catch (error) {
        }
      }

      // Ordenar: Edificios primero, luego oficinas por edificio y piso
      this.allProperties = propiedades.sort((a, b) => {
        // 1. Tipo inmueble: edificios (12,13) primero
        const tipoA = (a.tipo_inmueble_id >= 12) ? 0 : 1;
        const tipoB = (b.tipo_inmueble_id >= 12) ? 0 : 1;
        if (tipoA !== tipoB) return tipoA - tipoB;

        // 2. Agrupar por edificio padre (mismo edificio juntos)
        const padreA = a.padre_registro_cab_id || a.registro_cab_id;
        const padreB = b.padre_registro_cab_id || b.registro_cab_id;
        if (padreA !== padreB) return padreA - padreB;

        // 3. Edificio padre antes que sus oficinas
        if (!a.padre_registro_cab_id && b.padre_registro_cab_id) return -1;
        if (a.padre_registro_cab_id && !b.padre_registro_cab_id) return 1;

        // 4. Piso menor a mayor
        const pisoA = a.piso || 0;
        const pisoB = b.piso || 0;
        if (pisoA !== pisoB) return pisoA - pisoB;

        // 5. Nombre alfabético dentro del mismo piso
        return (a.nombre_inmueble || '').localeCompare(b.nombre_inmueble || '');
      });

      this.app.pagination.updateItemsPerPage();

      // Header con filtros
      // Sub-tabs: Propiedades + Oportunidades (solo corredor/admin)
      const perfilId = currentUser?.perfil_id || 1;
      const mostrarOportunidades = perfilId === 3 || perfilId === 4;

      const content = `
        ${mostrarOportunidades ? `
        <div style="display: flex; gap: 0; margin-bottom: 16px; border-bottom: 2px solid #e2e8f0;">
          <button class="sub-tab-btn active" data-subtab="propiedades"
                  style="padding: 10px 20px; border: none; background: none; cursor: pointer; font-weight: 600;
                         font-size: 0.85rem; color: var(--azul-corporativo); border-bottom: 3px solid var(--azul-corporativo);
                         transition: all 0.2s;">
            Mis Propiedades
          </button>
          <button class="sub-tab-btn" data-subtab="oportunidades"
                  style="padding: 10px 20px; border: none; background: none; cursor: pointer; font-weight: 600;
                         font-size: 0.85rem; color: #9ca3af; border-bottom: 3px solid transparent;
                         transition: all 0.2s; position: relative;">
            Oportunidades
            <span id="badgeOportunidades" style="display: none; position: absolute; top: 4px; right: 4px;
                  background: #ef4444; color: white; min-width: 18px; height: 18px; border-radius: 9px;
                  font-size: 0.65rem; display: inline-flex; align-items: center; justify-content: center;
                  font-weight: 700;"></span>
          </button>
        </div>
        ` : ''}

        <div id="subTabPropiedades">
        <div class="propiedades-header" style="margin-bottom: var(--spacing-xl);">
          <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 8px;">
            <h2 style="color: var(--azul-corporativo); margin: 0; font-size: 1.1rem;">
              Mis Propiedades (<span id="propCount">${this.allProperties.length}</span>)
            </h2>
            <button id="btnNuevaPropiedad" style="background: var(--azul-corporativo); color: white; border: none; padding: 5px 12px; border-radius: 5px; font-weight: 600; cursor: pointer; font-size: 0.68rem; display: flex; align-items: center; gap: 4px; transition: all 0.2s;"
                    onmouseover="this.style.opacity='0.85'" onmouseout="this.style.opacity='1'">
              <i class="fas fa-plus" style="font-size: 0.6rem;"></i> Nueva
            </button>
          </div>

          ${this.allProperties.length > 0 ? this._renderLegend() : ''}

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
          <div id="paginadorContainerTop" class="paginacion-top"></div>

          <div id="propertiesGrid" class="properties-grid">
            <!-- Se renderiza con paginación -->
          </div>

          <div id="paginadorContainerBottom" class="paginacion-bottom"></div>
        `}
        </div><!-- fin subTabPropiedades -->

        <div id="subTabOportunidades" style="display: none;"></div>
      `;

      return content;
    } catch (error) {
      console.error('❌ Error cargando propiedades:', error);
      throw error;
    }
  }

  /**
   * Leyenda dinamica: agrupa por tipo_inmueble real + estados
   */
  _renderLegend() {
    const stats = this._calcStats(this.allProperties);
    const coloresTipo = ['#0f4761', '#ff9700', '#17a2b8', '#28a745', '#6a9ec4', '#e88700', '#dc3545', '#4f78a1', '#ffc107', '#6c757d', '#218838', '#f39c12'];

    // Abreviar nombres de tipo
    const abreviar = (nombre) => {
      if (nombre.includes('Oficina')) return 'Ofic.';
      if (nombre.includes('Edificio')) return 'Edif.';
      if (nombre.includes('Departamento')) return 'Depto.';
      if (nombre.includes('Casa')) return 'Casa';
      if (nombre.includes('Local')) return 'Local';
      if (nombre.includes('Terreno')) return 'Terr.';
      return nombre.substring(0, 6) + '.';
    };

    const abreviarEstado = (label) => {
      if (label.includes('Publicados')) return 'Pub.';
      if (label.includes('Borradores')) return 'Borr.';
      if (label.includes('Pausados')) return 'Paus.';
      if (label.includes('Vendidos')) return 'Vend.';
      if (label.includes('Cerrados')) return 'Cerr.';
      return label.substring(0, 5) + '.';
    };

    const chips = [
      ...stats.tipos.map((t, i) => `<span title="${t.nombre}" style="display:inline-flex;align-items:center;gap:3px;font-size:0.65rem;color:#374151;"><span style="width:6px;height:6px;border-radius:50%;background:${coloresTipo[i % coloresTipo.length]};flex-shrink:0;"></span><b>${t.count}</b> ${abreviar(t.nombre)}</span>`),
      ...stats.estados.map(e => `<span title="${e.label}" style="display:inline-flex;align-items:center;gap:3px;font-size:0.65rem;color:#374151;"><span style="width:6px;height:6px;border-radius:50%;background:${e.color};flex-shrink:0;"></span><b>${e.count}</b> ${abreviarEstado(e.label)}</span>`)
    ];

    return `
      <div id="propiedadesLegend" style="display:flex;align-items:center;gap:6px;flex-wrap:wrap;padding:4px 0;margin-bottom:6px;">
        ${chips.join('<span style="color:#d1d5db;">|</span>')}
      </div>
    `;
  }

  _calcStats(props) {
    const tipoMap = {};
    props.forEach(p => {
      const nombre = p.tipo_inmueble || 'Sin tipo';
      tipoMap[nombre] = (tipoMap[nombre] || 0) + 1;
    });
    const tipos = Object.entries(tipoMap)
      .map(([nombre, count]) => ({ nombre, count }))
      .sort((a, b) => b.count - a.count);

    const estadoDef = [
      { key: 'publicado', label: 'Publicados', color: '#0f4761' },
      { key: 'borrador', label: 'Borradores', color: '#ff9700' },
      { key: 'pausado', label: 'Pausados', color: '#6a9ec4' },
      { key: 'vendido', label: 'Vendidos', color: '#28a745' },
      { key: 'cerrado', label: 'Cerrados', color: '#6c757d' }
    ];
    const estados = estadoDef
      .map(e => ({ ...e, count: props.filter(p => p.estado === e.key).length }))
      .filter(e => e.count > 0);

    return { tipos, estados };
  }

  /**
   * Actualizar leyenda cuando se filtra
   */
  _updateLegend(filtered) {
    const stats = this._calcStats(filtered);
    stats.tipos.forEach((t, i) => {
      const el = document.getElementById(`legend_tipo_${i}`);
      if (el) el.textContent = t.count;
    });
    stats.estados.forEach(e => {
      const el = document.getElementById(`legend_est_${e.key}`);
      if (el) el.textContent = e.count;
    });
  }

  /**
   * Lifecycle hook: Después de renderizar
   */
  async afterRender() {
    window.currentPropiedadesTab = this;
    window.propiedadesTab = this; // 🔥 NUEVO: Exponer globalmente para onclick

    // ✅ CRÍTICO: Registrar este tab como el activo para los filtros
    this.app.filters.setActiveTab(this);

    // ✅ CRÍTICO: Registrar este tab como el activo para el paginador
    this.app.pagination.setActiveTab(this);

    // ✅ CRÍTICO: Inicializar filtros (carga combos y event listeners)
    await this.app.filters.setup();

    // ❤️ CRÍTICO: Inicializar handler de favoritos
    if (window.favoritesHandler && !window.favoritesHandler.initialized) {
      await window.favoritesHandler.init();
    }

    // 🖼️ CRÍTICO: Inicializar Image Viewer
    if (window.imageViewer) {
      window.imageViewer.attachToImages('.property-image');
    }

    this.renderPropertiesPage();
    this.setupPropertyListeners();

    // Sub-tabs: Propiedades / Oportunidades
    this.setupSubTabs();
    this.loadOportunidadesBadge();
  }

  setupSubTabs() {
    document.querySelectorAll('.sub-tab-btn').forEach(btn => {
      btn.addEventListener('click', async () => {
        const subtab = btn.dataset.subtab;

        // Toggle visual
        document.querySelectorAll('.sub-tab-btn').forEach(b => {
          b.style.color = '#9ca3af';
          b.style.borderBottomColor = 'transparent';
          b.classList.remove('active');
        });
        btn.style.color = 'var(--azul-corporativo)';
        btn.style.borderBottomColor = 'var(--azul-corporativo)';
        btn.classList.add('active');

        const propDiv = document.getElementById('subTabPropiedades');
        const opDiv = document.getElementById('subTabOportunidades');
        if (!propDiv || !opDiv) return;

        if (subtab === 'oportunidades') {
          propDiv.style.display = 'none';
          opDiv.style.display = 'block';

          // Cargar oportunidades
          if (!this._oportunidadesTab) {
            this._oportunidadesTab = new OportunidadesTab(this.app);
          }
          opDiv.innerHTML = await this._oportunidadesTab.render();
          this._oportunidadesTab.setupListeners();
        } else {
          propDiv.style.display = 'block';
          opDiv.style.display = 'none';
        }
      });
    });
  }

  async loadOportunidadesBadge() {
    try {
      const token = authService.getToken();
      const response = await fetch(`${API_CONFIG.BASE_URL}/contactos/mis-oportunidades?limit=1`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (!response.ok) return;
      const data = await response.json();
      const nuevos = data.totales?.nuevo || 0;
      const badge = document.getElementById('badgeOportunidades');
      if (badge && nuevos > 0) {
        badge.textContent = nuevos;
        badge.style.display = 'inline-flex';
      }
    } catch (e) {}
  }

  /**
   * Renderizar página de propiedades con filtros y paginación
   */
  renderPropertiesPage() {
    const filtered = this.app.filters.getFiltered(this.allProperties);
    const pageData = this.app.pagination.getPageData(filtered);

    // ✅ ACTUALIZAR CONTADOR con propiedades filtradas
    const propCountElement = document.getElementById('propCount');
    if (propCountElement) {
      propCountElement.textContent = filtered.length;
    }

    // ✅ ACTUALIZAR LEYENDA con datos filtrados
    this._updateLegend(filtered);

    const container = document.getElementById('propertiesGrid');
    if (!container) {
      console.error('❌ No se encontró #propertiesGrid');
      return;
    }

    if (pageData.items.length === 0) {
      container.innerHTML = '<div class="empty-state"><p>No se encontraron propiedades con los filtros aplicados.</p></div>';
      const topC = document.getElementById('paginadorContainerTop');
      const botC = document.getElementById('paginadorContainerBottom');
      if (topC) topC.innerHTML = '';
      if (botC) botC.innerHTML = '';
      return;
    }

    container.innerHTML = this.generatePropertiesHTML(pageData);
    
    // ✅ IMPORTANTE: Re-configurar listeners después de renderizar
    setTimeout(() => {
      this.setupPropertyListeners();
    }, 50);

    // Renderizar paginador arriba y abajo
    const paginadorHTML = this.app.pagination.render(filtered.length);
    const topContainer = document.getElementById('paginadorContainerTop');
    const bottomContainer = document.getElementById('paginadorContainerBottom');
    if (topContainer) topContainer.innerHTML = paginadorHTML;
    if (bottomContainer) bottomContainer.innerHTML = paginadorHTML.replace('id="paginador"', 'id="paginadorBottom"');
    this.app.pagination.setupListeners();
    this._setupBottomPaginationListeners();

    // Setup carousel
    this.app.carousel.setup();
  }

  _setupBottomPaginationListeners() {
    const pag = document.getElementById('paginadorBottom');
    if (!pag) return;
    pag.addEventListener('click', (e) => {
      const btn = e.target.closest('.pag-btn');
      if (!btn || btn.disabled) return;
      const page = parseInt(btn.dataset.page);
      if (page && page > 0) this.app.pagination.goToPage(page);
    });
  }

  /**
   * Generar HTML para las propiedades
   */
  generatePropertiesHTML(pageData) {
    const baseUrl = 'https://ik.imagekit.io/quadrante/';
    
    return pageData.items.map((prop, index) => {
      let imagenes = [];
      const toUrl = (img) => (img.startsWith('http://') || img.startsWith('https://')) ? img : baseUrl + img;

      // Construir array: imagen principal primero, luego galería
      if (prop.imagen_principal) {
        imagenes.push(toUrl(prop.imagen_principal));
      }
      if (prop.imagenes && prop.imagenes.length > 0) {
        prop.imagenes.forEach(img => {
          const url = toUrl(img);
          // Evitar duplicar la imagen principal
          if (!imagenes.includes(url)) imagenes.push(url);
        });
      }
      if (imagenes.length === 0) {
        imagenes = ['https://via.placeholder.com/400x300?text=Sin+Imagen'];
      }

      // Moneda dinámica según prop.moneda (USD → $, PEN → S/)
      const simboloMoneda = (prop.moneda || 'PEN').toUpperCase() === 'USD' ? '$' : 'S/';
      const formatPrecio = (val) => parseFloat(val).toLocaleString('es-PE', { minimumFractionDigits: 2, maximumFractionDigits: 2 });

      // Mostrar precios con etiquetas (uno debajo del otro si hay ambos)
      let precioHTML = '';
      if (prop.precio_alquiler && prop.precio_venta) {
        precioHTML = `
          <div style="display: flex; flex-direction: column; gap: 2px;">
            <span style="font-size: 0.7rem; color: var(--gris-medio); font-weight: 600; text-transform: uppercase;">Alquiler</span>
            <span style="font-weight: 700; color: var(--azul-corporativo); font-size: 0.95rem;">${simboloMoneda} ${formatPrecio(prop.precio_alquiler)}/mes</span>
            <span style="font-size: 0.7rem; color: var(--gris-medio); font-weight: 600; text-transform: uppercase; margin-top: 2px;">Venta</span>
            <span style="font-weight: 700; color: var(--dorado); font-size: 0.95rem;">${simboloMoneda} ${formatPrecio(prop.precio_venta)}</span>
          </div>`;
      } else if (prop.precio_alquiler) {
        precioHTML = `<span class="property-price">${simboloMoneda} ${formatPrecio(prop.precio_alquiler)}/mes</span>`;
      } else if (prop.precio_venta) {
        precioHTML = `<span class="property-price">${simboloMoneda} ${formatPrecio(prop.precio_venta)}</span>`;
      } else {
        precioHTML = `<span class="property-price">Precio no disponible</span>`;
      }

      const estadoBadge = {
        'publicado': { color: 'var(--azul-corporativo)', text: 'PUBLICADO' },
        'borrador': { color: 'var(--dorado)', text: 'BORRADOR' },
        'pausado': { color: 'var(--azul-medio)', text: 'PAUSADO' },
        'vendido': { color: 'var(--azul-claro)', text: 'VENDIDO' }
      }[prop.estado] || { color: 'var(--gris-medio)', text: 'BORRADOR' };

      const estadoCRMBadge = {
        'lead': { bg: 'transparent', border: '#6b7280', color: '#6b7280', text: 'Lead', noBorder: true },
        'contacto': { bg: 'white', border: '#10b981', color: '#10b981', text: '📞 Contacto' },
        'propuesta': { bg: 'white', border: '#f59e0b', color: '#f59e0b', text: '📋 Propuesta' },
        'negociacion': { bg: 'white', border: '#8b5cf6', color: '#8b5cf6', text: '💼 Negociacion' },
        'pre_cierre': { bg: 'white', border: '#6366f1', color: '#6366f1', text: '🤝 Pre-Cierre' },
        'cerrado_ganado': { bg: '#ecfdf5', border: '#22c55e', color: '#22c55e', text: '✅ Ganado' },
        'cerrado_perdido': { bg: '#fef2f2', border: '#ef4444', color: '#ef4444', text: '❌ Perdido' }
      }[prop.estado_crm] || { bg: 'transparent', border: 'transparent', color: '#6b7280', text: '', noBorder: true };

      const tipoLabel = prop.tipo_inmueble || '';
      const hasImages = imagenes[0] !== 'https://via.placeholder.com/400x300?text=Sin+Imagen';

      return `
        <div class="property-card" data-property-id="${prop.registro_cab_id}">

          <!-- Imagen con badge de estado y contador fotos -->
          <div class="property-image-carousel">
            <div class="property-badge" style="background:${estadoBadge.color};">${estadoBadge.text}</div>
            ${hasImages ? `
              <div class="carousel-images" data-current="0">
                ${imagenes.map((img, i) => `
                  <img src="${img}" alt="${prop.titulo} - ${i+1}"
                       class="carousel-image property-image ${i === 0 ? 'active' : ''}" data-index="${i}"
                       onerror="this.src='https://via.placeholder.com/400x300?text=Error+imagen'">
                `).join('')}
              </div>
              ${imagenes.length > 1 ? `
                <button class="carousel-prev" data-property-id="${prop.registro_cab_id}">&#8249;</button>
                <button class="carousel-next" data-property-id="${prop.registro_cab_id}">&#8250;</button>
                <div class="photo-counter"><span class="photo-counter-current">1</span>/${imagenes.length}</div>
              ` : ''}
            ` : `
              <div class="property-image-placeholder">
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="1.5">
                  <path stroke-linecap="round" stroke-linejoin="round" d="M2.25 15.75l5.159-5.159a2.25 2.25 0 013.182 0l5.159 5.159m-1.5-1.5 1.409-1.409a2.25 2.25 0 013.182 0l2.909 2.909M3.75 21h16.5A2.25 2.25 0 0022.5 18.75V5.25A2.25 2.25 0 0020.25 3H3.75A2.25 2.25 0 001.5 5.25v13.5A2.25 2.25 0 003.75 21z"/>
                </svg>
                <span>Sin imagen</span>
              </div>
            `}

            <!-- Favorito sobre imagen -->
            <button class="favorite-btn-beautiful ${prop.es_favorito ? 'is-favorite' : ''}"
                    data-favorite-property="${prop.registro_cab_id}"
                    title="${prop.es_favorito ? 'Quitar de favoritos' : 'Agregar a favoritos'}">
              <svg class="heart-icon" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor">
                <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z"/>
              </svg>
            </button>
          </div>

          <div class="property-info">
            <!-- Fila 1: titulo + tipo -->
            <div class="prop-row-title">
              <h3 class="property-title">${prop.titulo || 'Sin titulo'}</h3>
              ${tipoLabel ? `<span class="prop-tipo-badge">${tipoLabel}</span>` : ''}
            </div>

            <!-- Edificio + Piso (para oficinas) -->
            ${prop.edificio_nombre ? `
              <div style="color: var(--azul-corporativo); font-size: 0.75rem; font-weight: 600; display: flex; align-items: center; gap: 4px;">
                <span>🏢 ${prop.edificio_nombre}</span>
                ${prop.piso ? `<span style="background: #f1f5f9; padding: 1px 6px; border-radius: 3px; font-size: 0.7rem;">Piso ${prop.piso}</span>` : ''}
              </div>
            ` : ''}

            <!-- Fila 2: ubicacion -->
            <div class="property-location">${prop.direccion || 'Ubicacion no disponible'}</div>

            <!-- Fila 3: precio + features -->
            <div class="prop-row-price">
              ${precioHTML}
              <div class="property-features">
                <span class="feature">${prop.area || 0} m2</span>
                ${(prop.tipo_inmueble_id !== 12 && prop.tipo_inmueble_id !== 13) ? `
                  ${prop.habitaciones ? `<span class="feature">${prop.habitaciones} hab.</span>` : ''}
                  ${prop.banos ? `<span class="feature">${prop.banos} ban.</span>` : ''}
                  ${prop.estacionamientos ? `<span class="feature">${prop.estacionamientos} est.</span>` : ''}
                ` : ''}
                ${prop.antiguedad ? `<span class="feature">${prop.antiguedad} a.</span>` : ''}
              </div>
            </div>

            <!-- Fila 4: stats + CRM -->
            <div class="prop-row-stats">
              <span>${prop.vistas || 0} vistas</span>
              <span>${prop.contactos || 0} contactos</span>
              ${estadoCRMBadge.text && !estadoCRMBadge.noBorder ? `
                <span style="padding: 1px 6px; color: ${estadoCRMBadge.color}; border: 1.5px solid ${estadoCRMBadge.border}; border-radius: 4px; font-size: 0.65rem; font-weight: 600;">${estadoCRMBadge.text}</span>
              ` : ''}
            </div>

            <!-- Fila 5: Contacto -->
            ${(prop.propietario_real_nombre || prop.propietario_nombre || prop.telefono || prop.email) ? `
              <div class="prop-contact-row">
                ${(prop.propietario_real_nombre || prop.propietario_nombre) ? `
                  <span class="prop-contact-chip"><i class="fas fa-user"></i> ${prop.propietario_real_nombre || prop.propietario_nombre}</span>
                ` : ''}
                ${(prop.telefono || prop.propietario_real_telefono) ? `
                  <a href="tel:${prop.telefono || prop.propietario_real_telefono}" class="prop-contact-chip prop-contact-link">
                    <i class="fas fa-phone"></i> ${prop.telefono || prop.propietario_real_telefono}
                  </a>
                ` : ''}
                ${(prop.email || prop.propietario_real_email) ? `
                  <a href="mailto:${prop.email || prop.propietario_real_email}" class="prop-contact-chip prop-contact-link prop-contact-email">
                    <i class="fas fa-envelope"></i> ${prop.email || prop.propietario_real_email}
                  </a>
                ` : ''}
              </div>
            ` : ''}

            <!-- Acciones -->
            <div class="admin-actions-simple">
              <button class="btn-admin" data-view-property="${prop.registro_cab_id}">Detalle</button>
              ${prop.latitud && prop.longitud ? `
                <button class="btn-admin" data-map-property="${prop.registro_cab_id}" data-lat="${prop.latitud}" data-lng="${prop.longitud}">Mapa</button>
              ` : ''}
              <button class="btn-admin" data-edit-property="${prop.registro_cab_id || prop.id}">Editar</button>
              ${prop.estado === 'borrador' && this.app.currentUser?.perfil_id === 4 ? `
                <button class="btn-admin" data-publish-property="${prop.registro_cab_id}">Publicar</button>
              ` : ''}
              ${this.app.currentUser?.perfil_id === 4 ? `
                ${prop.corredor_nombre ? `
                  <span style="font-size: 0.65rem; color: #059669; font-weight: 600; padding: 2px 6px; background: #ecfdf5; border-radius: 4px;">
                    <i class="fas fa-user-tie"></i> ${prop.corredor_nombre}${prop.comision_corredor ? ` (${prop.comision_corredor}%)` : ''}
                  </span>
                ` : ''}
                <button class="btn-admin" data-assign-broker="${prop.registro_cab_id}"><i class="fas fa-user-tie"></i> ${prop.corredor_asignado_id ? 'Reasignar' : 'Asignar'}</button>
              ` : ''}
              ${(this.app.currentUser?.perfil_id === 3 || this.app.currentUser?.perfil_id === 4) ? `
                <select class="select-crm-estado" data-crm-property="${prop.registro_cab_id}"
                        style="padding: 4px 6px; font-size: 0.68rem; border-radius: 4px; border: 1.5px solid ${estadoCRMBadge.border || '#e2e8f0'};
                               cursor: pointer; background: white; color: ${estadoCRMBadge.color || '#374151'}; font-weight: 600;">
                  <option value="lead" ${prop.estado_crm === 'lead' ? 'selected' : ''}>Lead</option>
                  <option value="contacto" ${prop.estado_crm === 'contacto' ? 'selected' : ''}>Contacto</option>
                  <option value="propuesta" ${prop.estado_crm === 'propuesta' ? 'selected' : ''}>Propuesta</option>
                  <option value="negociacion" ${prop.estado_crm === 'negociacion' ? 'selected' : ''}>Negociacion</option>
                  <option value="pre_cierre" ${prop.estado_crm === 'pre_cierre' ? 'selected' : ''}>Pre-Cierre</option>
                  <option value="cerrado_ganado" ${prop.estado_crm === 'cerrado_ganado' ? 'selected' : ''}>Ganado</option>
                  <option value="cerrado_perdido" ${prop.estado_crm === 'cerrado_perdido' ? 'selected' : ''}>Perdido</option>
                </select>
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
    // Toggle dropdown "mas acciones"
    document.querySelectorAll('[data-toggle-more]').forEach(btn => {
      btn.addEventListener('click', (e) => {
        e.stopPropagation();
        const propId = e.currentTarget.dataset.toggleMore;
        const dropdown = document.getElementById(`dropdown-${propId}`);
        document.querySelectorAll('.prop-more-dropdown').forEach(d => {
          if (d !== dropdown) d.classList.remove('open');
        });
        dropdown.classList.toggle('open');
      });
    });
    document.addEventListener('click', () => {
      document.querySelectorAll('.prop-more-dropdown').forEach(d => d.classList.remove('open'));
    });

    // Ver detalle
    const viewBtns = document.querySelectorAll('[data-view-property]');

    viewBtns.forEach((btn, index) => {
      // Clonar el botón para remover listeners anteriores
      const newBtn = btn.cloneNode(true);
      btn.parentNode.replaceChild(newBtn, btn);
      
      newBtn.addEventListener('click', async (e) => {
        e.stopPropagation();
        e.preventDefault();
        const propId = e.currentTarget.dataset.viewProperty;
        await this.showPropertyDetailPopup(propId);
      }, { once: false });
    });

    // Mapa
    const mapBtns = document.querySelectorAll('[data-map-property]');

    mapBtns.forEach((btn, index) => {
      // Clonar el botón para remover listeners anteriores
      const newBtn = btn.cloneNode(true);
      btn.parentNode.replaceChild(newBtn, btn);
      
      newBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        e.preventDefault();
        const lat = e.currentTarget.dataset.lat;
        const lng = e.currentTarget.dataset.lng;
        this.showMapPopup(lat, lng);
      }, { once: false });
    });

    // Editar
    const editBtns = document.querySelectorAll('[data-edit-property]');

    editBtns.forEach((btn, index) => {
      // Clonar el botón para remover listeners anteriores
      const newBtn = btn.cloneNode(true);
      btn.parentNode.replaceChild(newBtn, btn);
      
      newBtn.addEventListener('click', async (e) => {
        e.stopPropagation();
        e.preventDefault();
        const propId = parseInt(e.currentTarget.dataset.editProperty);

        if (!propId || isNaN(propId)) {
          console.error('❌ ID inválido:', propId);
          showNotification('❌ Error: ID de propiedad inválido', 'error');
          return;
        }

        const propertyForm = new PropertyForm(this.app, propId);
        await propertyForm.init();
      }, { once: false });
    });

    // ❤️ FAVORITOS: Usar el nuevo módulo desacoplado
    // Solo refrescamos los botones, los listeners ya están configurados globalmente
    if (window.favoritesHandler && window.favoritesHandler.initialized) {
      window.favoritesHandler.refreshAllButtons();
    } else {
      console.warn('⚠️ FavoritesHandler no inicializado aún');
    }

    // Publicar (solo admin, solo borradores)
    const publishBtns = document.querySelectorAll('[data-publish-property]');

    publishBtns.forEach(btn => {
      // Clonar el botón para remover listeners anteriores
      const newBtn = btn.cloneNode(true);
      btn.parentNode.replaceChild(newBtn, btn);
      
      newBtn.addEventListener('click', async (e) => {
        e.stopPropagation();
        e.preventDefault();
        const propId = e.currentTarget.dataset.publishProperty;
        await this.publicarPropiedad(propId);
      }, { once: false });
    });

    // Asignar corredor (solo admin)
    const assignBtns = document.querySelectorAll('[data-assign-broker]');

    assignBtns.forEach(btn => {
      // Clonar el botón para remover listeners anteriores
      const newBtn = btn.cloneNode(true);
      btn.parentNode.replaceChild(newBtn, btn);
      
      newBtn.addEventListener('click', async (e) => {
        e.stopPropagation();
        const propId = e.currentTarget.dataset.assignBroker;
        await this.showAssignBrokerPopup(propId);
      }, { once: false });
    });

    // Nueva Propiedad
    const btnNuevaPropiedad = document.getElementById('btnNuevaPropiedad');
    if (btnNuevaPropiedad) {
      btnNuevaPropiedad.addEventListener('click', (e) => {
        e.preventDefault();
        e.stopPropagation();
        this.showPropertyForm();
      });
    }

    // Dropdown CRM estado (corredor/admin)
    document.querySelectorAll('.select-crm-estado').forEach(select => {
      select.addEventListener('change', async (e) => {
        e.stopPropagation();
        const propId = select.dataset.crmProperty;
        const nuevoEstado = select.value;
        try {
          const token = authService.getToken();
          const response = await fetch(`${API_CONFIG.BASE_URL}/propiedades/${propId}/asignar-corredor`, {
            method: 'PATCH',
            headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' },
            body: JSON.stringify({ corredor_id: this.app.currentUser?.usuario_id, estado_crm: nuevoEstado })
          });
          if (response.ok) {
            showNotification(`Estado CRM actualizado a "${nuevoEstado}"`, 'success');
          }
        } catch (error) {
          console.error('Error actualizando CRM:', error);
        }
      });
    });

    // Boton Seguimiento (timeline modal)
    document.querySelectorAll('.btn-seguimiento').forEach(btn => {
      btn.addEventListener('click', async (e) => {
        e.stopPropagation();
        const propId = btn.dataset.trackingProperty;
        await this.showTrackingModal(propId);
      });
    });
  }

  async showTrackingModal(propId) {
    try {
      const token = authService.getToken();
      const response = await fetch(`${API_CONFIG.BASE_URL}/contactos/tracking/${propId}`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (!response.ok) throw new Error('Error cargando tracking');
      const result = await response.json();
      const data = result.data || {};
      const prop = data.propiedad || {};
      const timeline = data.timeline || [];

      const modal = document.createElement('div');
      modal.style.cssText = 'position:fixed;top:0;left:0;right:0;bottom:0;background:rgba(0,0,0,0.85);z-index:99999;display:flex;align-items:center;justify-content:center;padding:16px;';

      modal.innerHTML = `
        <div style="background:white;border-radius:12px;max-width:500px;width:100%;max-height:90vh;overflow-y:auto;">
          <div style="background:var(--azul-corporativo,#0f4761);color:white;padding:14px 20px;border-radius:12px 12px 0 0;display:flex;justify-content:space-between;align-items:center;">
            <h3 style="margin:0;font-size:1rem;">Seguimiento</h3>
            <button onclick="this.closest('div[style*=fixed]').remove()" style="background:rgba(255,255,255,0.2);border:none;color:white;width:32px;height:32px;border-radius:50%;cursor:pointer;font-size:18px;">&times;</button>
          </div>
          <div style="padding:16px;">
            <div style="display:flex;gap:12px;margin-bottom:16px;flex-wrap:wrap;">
              <div style="flex:1;min-width:80px;background:#f8fafc;padding:8px;border-radius:8px;text-align:center;">
                <div style="font-size:1.4rem;font-weight:700;color:var(--azul-corporativo);">${prop.vistas || 0}</div>
                <div style="font-size:0.7rem;color:#6b7280;">Vistas</div>
              </div>
              <div style="flex:1;min-width:80px;background:#f8fafc;padding:8px;border-radius:8px;text-align:center;">
                <div style="font-size:1.4rem;font-weight:700;color:#f59e0b;">${prop.contactos || 0}</div>
                <div style="font-size:0.7rem;color:#6b7280;">Contactos</div>
              </div>
              <div style="flex:1;min-width:80px;background:#f8fafc;padding:8px;border-radius:8px;text-align:center;">
                <div style="font-size:1.4rem;font-weight:700;color:#10b981;">${prop.estado_crm || 'lead'}</div>
                <div style="font-size:0.7rem;color:#6b7280;">Estado CRM</div>
              </div>
            </div>

            <h4 style="margin:0 0 12px;color:var(--azul-corporativo);font-size:0.9rem;">Timeline</h4>
            ${timeline.length === 0 ? '<p style="color:#9ca3af;text-align:center;font-size:0.85rem;">Sin actividad registrada</p>' : ''}
            <div style="border-left:2px solid #e2e8f0;padding-left:16px;display:flex;flex-direction:column;gap:12px;">
              ${timeline.map(t => `
                <div style="position:relative;">
                  <div style="position:absolute;left:-22px;top:2px;width:12px;height:12px;border-radius:50%;
                              background:${t.tipo === 'contacto' ? '#f59e0b' : '#3b82f6'};border:2px solid white;"></div>
                  <div style="font-size:0.75rem;color:#9ca3af;">${t.fecha ? new Date(t.fecha).toLocaleString('es-PE', {day:'2-digit',month:'short',hour:'2-digit',minute:'2-digit'}) : ''}</div>
                  <div style="font-size:0.85rem;font-weight:600;color:#374151;">${t.icono} ${t.titulo}</div>
                  ${t.detalle ? `<div style="font-size:0.78rem;color:#6b7280;">${t.detalle.substring(0, 100)}</div>` : ''}
                  ${t.email ? `<div style="font-size:0.7rem;color:#3b82f6;">${t.email}</div>` : ''}
                </div>
              `).join('')}
            </div>
          </div>
        </div>`;

      modal.addEventListener('click', (e) => { if (e.target === modal) modal.remove(); });
      document.addEventListener('keydown', function esc(e) { if (e.key === 'Escape') { modal.remove(); document.removeEventListener('keydown', esc); } });
      document.body.appendChild(modal);
    } catch (error) {
      console.error('Error mostrando tracking:', error);
      showNotification('Error al cargar seguimiento', 'error');
    }
  }

  /**
   * 🔥 NUEVO: Método directo para editar propiedad
   */
  editarPropiedad(propId) {
    const propIdNum = parseInt(propId);
    if (!propIdNum || isNaN(propIdNum)) {
      console.error('❌ ID inválido:', propId);
      showNotification('❌ Error: ID de propiedad inválido', 'error');
      return;
    }

    const propertyForm = new PropertyForm(this.app, propIdNum);
    propertyForm.init();
  }

  /**
   * 🔄 FORZAR RECARGA COMPLETA de propiedades
   */
  async forceReloadProperties() {
    try {
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

    } catch (error) {
      console.error('❌ Error en recarga completa:', error);
    }
  }

  /**
   * 🚀 NUEVO: Método para publicar propiedad (solo admin) con SweetAlert2
   */
  async publicarPropiedad(propId) {
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
    const form = new PropertyForm(this.app, propId);
    form.init();
  }

  /**
   * 🔥 ÉPICO - Modal de detalle full-screen con características agrupadas
   */
  async showPropertyDetailPopup(propId) {
    try {
      // 1️⃣ Obtener datos de la propiedad
      const token = authService.getToken();
      const response = await fetch(`${API_CONFIG.BASE_URL}/propiedades/${propId}`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });

      if (!response.ok) throw new Error(`Error HTTP: ${response.status}`);

      const data = await response.json();
      const prop = data.data || data;

      // 2️⃣ Detectar si es móvil
      const isMobile = window.innerWidth <= 768;

      // 3️⃣ Crear modal
      const modal = document.createElement('div');
      modal.id = 'detailModal';
      modal.className = 'modal-overlay';
      
      modal.style.cssText = 'position: fixed; top: 0; left: 0; right: 0; bottom: 0; background: rgba(0,0,0,0.85); z-index: 99999; display: flex; align-items: center; justify-content: center; padding: 0;';

      // 4️⃣ Crear contenido del modal
      const modalContent = document.createElement('div');
      modalContent.className = 'modal-content';
      modalContent.style.cssText = 'background: white; border-radius: 0; width: 100vw; height: 100vh; overflow: hidden; box-shadow: none; display: flex; flex-direction: column; margin: 0; padding: 0;';

      // 5️⃣ Mapear implementación a texto legible
      const implementacionMap = {
        '1': 'Implementado',
        '2': 'Semi-implementado', 
        '3': 'Sin implementar'
      };
      const implementacionTexto = implementacionMap[prop.implementacion] || prop.implementacion || 'Sin especificar';
      const antiguedad = prop.antiguedad || prop.anos_antiguedad || 0;
      const resumenNarrativo = `${prop.tipo_inmueble} ubicada en el distrito de ${prop.distrito || 'Lima'}, en ${prop.direccion}. Cuenta con ${prop.area || 0} m²${antiguedad > 0 ? `, ${antiguedad} años de antigüedad` : ''}${implementacionTexto !== 'Sin especificar' ? `, ${implementacionTexto.toLowerCase()}` : ''}.`;

      modalContent.innerHTML = `
        <!-- Header compacto con resumen narrativo -->
        <div style="background: linear-gradient(135deg, var(--azul-corporativo) 0%, var(--azul-medio) 100%); color: white; padding: 12px; flex-shrink: 0; ${isMobile ? '' : 'border-radius: 0;'}">
          <div style="display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 6px;">
            <h2 style="margin: 0; color: white; font-size: 1.2rem; font-weight: 700; flex: 1; line-height: 1.2;">${prop.titulo || 'Propiedad'}</h2>
            <button class="btn-close-modal" style="background: rgba(255,255,255,0.2); border: none; font-size: 20px; cursor: pointer; color: white; width: 32px; height: 32px; border-radius: 50%; transition: all 0.2s; display: flex; align-items: center; justify-content: center; flex-shrink: 0; margin-left: 8px;" onmouseover="this.style.background='rgba(255,255,255,0.3)'; this.style.transform='rotate(90deg)'" onmouseout="this.style.background='rgba(255,255,255,0.2)'; this.style.transform='rotate(0deg)'">&times;</button>
          </div>
          <p style="margin: 0; color: rgba(255,255,255,0.95); font-size: 0.85rem; line-height: 1.4;">${resumenNarrativo}</p>
        </div>

        <!-- Contenido scrolleable SIN padding lateral -->
        <div style="flex: 1; overflow-y: auto; padding: 0; overflow-x: hidden;">
          
          <!-- Información Básica Compacta: solo metraje, años e implementación -->
          <div style="padding: 10px 12px; background: #f8f9fa; border-bottom: 1px solid #e2e8f0;">
            <div style="display: flex; flex-wrap: wrap; gap: 14px; align-items: center; font-size: 0.85rem; color: var(--gris-oscuro);">
              ${prop.area ? `<span style="display: flex; align-items: center; gap: 5px; font-weight: 600;"><svg xmlns="http://www.w3.org/2000/svg" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#ff9800" stroke-width="2"><rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect></svg><span style="color: #ff9800;">${prop.area} m²</span></span>` : ''}
              ${antiguedad > 0 ? `<span style="display: flex; align-items: center; gap: 5px; font-weight: 600;"><svg xmlns="http://www.w3.org/2000/svg" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#6c757d" stroke-width="2"><circle cx="12" cy="12" r="10"></circle><polyline points="12 6 12 12 16 14"></polyline></svg><span style="color: #6c757d;">${antiguedad} años de antigüedad</span></span>` : ''}
              ${implementacionTexto !== 'Sin especificar' ? `<span style="display: flex; align-items: center; gap: 5px; font-weight: 600;"><svg xmlns="http://www.w3.org/2000/svg" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#17a2b8" stroke-width="2"><path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"></path></svg><span style="color: #17a2b8;">${implementacionTexto}</span></span>` : ''}
            </div>
          </div>

          <!-- Descripción - SIN márgenes laterales -->
          ${prop.descripcion ? `
          <div style="padding: 12px; background: white; border-bottom: 1px solid #e2e8f0;">
            <h3 style="margin: 0 0 8px 0; color: var(--azul-corporativo); font-size: 0.9rem; font-weight: 700; display: flex; align-items: center; gap: 6px;">
              <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path>
                <polyline points="14 2 14 8 20 8"></polyline>
                <line x1="16" y1="13" x2="8" y2="13"></line>
                <line x1="16" y1="17" x2="8" y2="17"></line>
              </svg>
              Descripción
            </h3>
            <p style="margin: 0; line-height: 1.5; color: var(--gris-oscuro); font-size: 0.85rem;">${prop.descripcion}</p>
          </div>
          ` : ''}

          <!-- Características Agrupadas - SIN márgenes laterales -->
          <div id="caracteristicas-container" style="padding: 12px; background: #f8f9fa;"></div>

        </div>

        <!-- Footer minimalista -->
        <div style="background: rgba(255,255,255,0.98); padding: 8px 12px; flex-shrink: 0; display: flex; justify-content: center; align-items: center; border-top: 1px solid rgba(0,0,0,0.08); backdrop-filter: blur(10px); ${isMobile ? 'border-radius: 0 0 12px 12px;' : ''}">
          <small style="color: var(--gris-medio); display: flex; align-items: center; gap: 5px; font-size: 0.7rem;">
            <span>Presiona</span>
            <kbd style="background: white; border: 1px solid #ddd; padding: 2px 5px; border-radius: 3px; font-family: monospace; font-size: 0.65rem;">ESC</kbd>
            <span>para cerrar</span>
          </small>
        </div>
      `;

      modal.appendChild(modalContent);
      document.body.appendChild(modal);

      // 6️⃣ Renderizar características agrupadas
      const caracteristicasContainer = modalContent.querySelector('#caracteristicas-container');
      if (prop.caracteristicas && prop.caracteristicas.length > 0) {
        // Agrupar por categoría
        const grouped = {};
        prop.caracteristicas.forEach(car => {
          const categoria = car.categoria || 'Otras';
          if (!grouped[categoria]) {
            grouped[categoria] = [];
          }
          grouped[categoria].push(car);
        });
        
        // Orden de categorías según formulario multipaso
        const ordenCategorias = [
          'Generales del Edificio',
          'Soporte del Edificio',
          'Áreas Comunes del Edificio',
          'Ascensores',
          'De la Oficina',
          'Equipamiento de Oficina',
          'Vista de la Oficina',
          'Información de Áreas',
          'Valorización Edificio',
          'Soporte Urbano'
        ];
        
        // Ordenar categorías
        const categoriasOrdenadas = ordenCategorias.filter(cat => grouped[cat]);
        const categoriasRestantes = Object.keys(grouped).filter(cat => !ordenCategorias.includes(cat));
        const todasCategorias = [...categoriasOrdenadas, ...categoriasRestantes];
        
        // Renderizar cada categoría
        let caracteristicasHTML = '<h3 style="margin: 0 0 8px 0; color: var(--azul-corporativo); font-size: 0.9rem; font-weight: 700; display: flex; align-items: center; gap: 6px;"><svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M9 11l3 3L22 4"></path><path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11"></path></svg>Características</h3>';
        
        todasCategorias.forEach((categoria, index) => {
          const items = grouped[categoria];
          const isOpen = index === 0; // Primera categoría abierta por defecto
          
          caracteristicasHTML += `
            <div style="margin-bottom: 6px; border: 1px solid #e2e8f0; border-radius: 6px; overflow: hidden; background: white;">
              <button 
                class="categoria-toggle" 
                data-categoria="${categoria}"
                style="width: 100%; padding: 10px 14px; background: #f8f9fa; border: none; display: flex; justify-content: space-between; align-items: center; cursor: pointer; font-weight: 600; color: var(--azul-corporativo); transition: all 0.15s; text-align: left;"
                onmouseover="this.style.background='#e9ecef'"
                onmouseout="this.style.background='#f8f9fa'"
              >
                <span style="font-size: 0.85rem; display: flex; align-items: center; gap: 6px;">
                  <span style="font-size: 1rem;">📋</span>
                  ${categoria}
                  <span style="background: var(--azul-corporativo); color: white; padding: 2px 8px; border-radius: 10px; font-size: 0.7rem; font-weight: 700;">${items.length}</span>
                </span>
                <span class="toggle-icon" style="font-size: 1rem; transition: transform 0.2s; color: var(--azul-corporativo);">${isOpen ? '▼' : '▶'}</span>
              </button>
              <div class="categoria-content" style="display: ${isOpen ? 'block' : 'none'}; padding: 10px 14px; background: white; border-top: 1px solid #e2e8f0;">
                <div style="display: grid; grid-template-columns: repeat(auto-fill, minmax(180px, 1fr)); gap: 6px;">
                  ${items.map(car => `
                    <div style="display: flex; align-items: center; gap: 5px; padding: 5px 8px; background: #f0f9ff; border-radius: 5px; font-size: 0.8rem; border: 1px solid #bae6fd;">
                      <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#0ea5e9" stroke-width="3">
                        <polyline points="20 6 9 17 4 12"></polyline>
                      </svg>
                      <span style="color: #0369a1; font-weight: 500;">${car.nombre || car}</span>
                    </div>
                  `).join('')}
                </div>
              </div>
            </div>
          `;
        });
        
        caracteristicasContainer.innerHTML = caracteristicasHTML;
        
        // Agregar event listeners para toggle
        modalContent.querySelectorAll('.categoria-toggle').forEach(btn => {
          btn.addEventListener('click', (e) => {
            const content = btn.nextElementSibling;
            const icon = btn.querySelector('.toggle-icon');
            const isOpen = content.style.display === 'block';
            
            content.style.display = isOpen ? 'none' : 'block';
            icon.textContent = isOpen ? '▶' : '▼';
            icon.style.transform = isOpen ? 'rotate(0deg)' : 'rotate(0deg)';
          });
        });
      } else {
        caracteristicasContainer.innerHTML = '<p style="color: var(--gris-medio); font-style: italic; text-align: center; padding: 20px;">No hay características registradas</p>';
      }

      // 7️⃣ Función para cerrar modal (UNA SOLA VEZ)
      const closeModal = () => {
        modal.remove();
        document.removeEventListener('keydown', escapeHandler);
      };

      // 5️⃣ Event Listeners
      // Click en overlay (fondo oscuro)
      modal.addEventListener('click', (e) => {
        if (e.target === modal) {
          closeModal();
        }
      });

      // Click en botones "Cerrar" (todos los que tengan la clase)
      modalContent.querySelectorAll('.btn-close-modal').forEach(btn => {
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

    } catch (error) {
      console.error('❌ Error mostrando detalle:', error);
      showNotification('Error al cargar detalles de la propiedad', 'error');
    }
  }

  /**
   * 🔥 ÉPICO - Modal de mapa full-screen sin padding lateral
   */
  showMapPopup(lat, lng) {
    // 1️⃣ Validar coordenadas
    lat = parseFloat(lat);
    lng = parseFloat(lng);

    if (!lat || !lng || isNaN(lat) || isNaN(lng)) {
      console.error('❌ Coordenadas inválidas:', { lat, lng });
      showNotification('📍 Esta propiedad no tiene coordenadas de ubicación', 'warning');
      return;
    }

    // 2️⃣ Buscar la dirección de la propiedad desde allProperties
    let direccionPropiedad = 'Dirección no disponible';
    const property = this.allProperties.find(p => 
      parseFloat(p.latitud) === lat && parseFloat(p.longitud) === lng
    );
    if (property && property.direccion) {
      direccionPropiedad = property.direccion;
    }

    // 3️⃣ Crear modal
    const modal = document.createElement('div');
    modal.id = 'mapModal';
    modal.className = 'modal-overlay';
    
    // Detectar si es móvil
    const isMobile = window.innerWidth <= 768;
    
    // Fullscreen para ambos — mapa necesita máximo espacio
    modal.style.cssText = 'position: fixed; top: 0; left: 0; right: 0; bottom: 0; background: rgba(0,0,0,0.85); z-index: 99999; display: flex; align-items: center; justify-content: center; padding: 0;';

    // 4️⃣ Crear contenido
    const modalContent = document.createElement('div');
    modalContent.className = 'modal-content';
    modalContent.style.cssText = 'background: white; border-radius: 0; width: 100vw; height: 100vh; overflow: hidden; box-shadow: none; display: flex; flex-direction: column; margin: 0; padding: 0;';

    modalContent.innerHTML = `
      <!-- Header compacto con dirección Y coordenadas -->
      <div style="background: linear-gradient(135deg, var(--azul-corporativo) 0%, var(--azul-medio) 100%); color: white; padding: 14px 20px; flex-shrink: 0; display: flex; justify-content: space-between; align-items: center; box-shadow: 0 2px 8px rgba(0,0,0,0.15);">
        <div style="flex: 1; min-width: 0;">
          <div style="display: flex; align-items: center; gap: 10px; margin-bottom: 4px;">
            <svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
              <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"></path>
              <circle cx="12" cy="10" r="3"></circle>
            </svg>
            <h2 style="margin: 0; color: white; font-size: 1.1rem; font-weight: 700;">Ubicación en Mapa</h2>
          </div>
          <div style="display: flex; align-items: center; gap: 8px; margin-left: 32px; margin-bottom: 3px;">
            <svg xmlns="http://www.w3.org/2000/svg" width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"></path>
              <polyline points="9 22 9 12 15 12 15 22"></polyline>
            </svg>
            <span style="color: rgba(255,255,255,0.95); font-size: 0.85rem; white-space: nowrap; overflow: hidden; text-overflow: ellipsis;">${direccionPropiedad}</span>
          </div>
          <div style="display: flex; align-items: center; gap: 6px; margin-left: 32px;">
            <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <circle cx="12" cy="12" r="10"></circle>
              <path d="M12 6v6l4 2"></path>
            </svg>
            <span style="color: rgba(255,255,255,0.85); font-size: 0.75rem;">${lat}, ${lng}</span>
          </div>
        </div>
        <div style="display: flex; align-items: center; gap: 10px; flex-shrink: 0;">
          <a
            href="https://www.google.com/maps?q=${lat},${lng}"
            target="_blank"
            style="display: inline-flex; align-items: center; gap: 6px; padding: 7px 12px; background: white; color: var(--azul-corporativo); text-decoration: none; border-radius: 6px; font-weight: 600; font-size: 0.8rem; box-shadow: 0 2px 6px rgba(0,0,0,0.15); transition: all 0.2s; border: none; white-space: nowrap;"
            onmouseover="this.style.transform='translateY(-2px)'; this.style.boxShadow='0 4px 12px rgba(0,0,0,0.25)'"
            onmouseout="this.style.transform='translateY(0)'; this.style.boxShadow='0 2px 6px rgba(0,0,0,0.15)'"
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">
              <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"></path>
              <circle cx="12" cy="10" r="3"></circle>
            </svg>
            Google Maps
          </a>
          <button class="btn-close-map" style="background: rgba(255,255,255,0.2); border: none; font-size: 22px; cursor: pointer; color: white; width: 34px; height: 34px; border-radius: 50%; transition: all 0.2s; display: flex; align-items: center; justify-content: center; flex-shrink: 0;" onmouseover="this.style.background='rgba(255,255,255,0.3)'; this.style.transform='rotate(90deg)'" onmouseout="this.style.background='rgba(255,255,255,0.2)'; this.style.transform='rotate(0deg)'">&times;</button>
        </div>
      </div>
      
      <!-- Mapa full-screen SIN padding ni márgenes -->
      <div id="propertyMap" style="flex: 1; width: 100%; height: 100%; margin: 0; padding: 0;"></div>
      
      <!-- Footer minimalista -->
      <div style="background: rgba(255,255,255,0.96); padding: 8px 20px; flex-shrink: 0; display: flex; justify-content: center; align-items: center; border-top: 1px solid rgba(0,0,0,0.08); backdrop-filter: blur(10px);">
        <small style="color: var(--gris-medio); display: flex; align-items: center; gap: 6px; font-size: 0.75rem;">
          <span>Presiona</span>
          <kbd style="background: white; border: 1px solid #ddd; padding: 2px 6px; border-radius: 4px; font-family: monospace; font-size: 0.7rem;">ESC</kbd>
          <span>para cerrar</span>
        </small>
      </div>
    `;

    modal.appendChild(modalContent);
    document.body.appendChild(modal);

    // 4️⃣ Función para cerrar modal
    const closeModal = () => {
      modal.remove();
      document.removeEventListener('keydown', escapeHandler);
    };

    // 5️⃣ Event Listeners
    // Click en overlay (fondo oscuro)
    modal.addEventListener('click', (e) => {
      if (e.target === modal) {
        closeModal();
      }
    });

    // Click en botones "Cerrar"
    modalContent.querySelectorAll('.btn-close-map').forEach(btn => {
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

    // 6️⃣ Inicializar mapa Leaflet
    setTimeout(() => {
      const map = L.map('propertyMap').setView([lat, lng], 17);
      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '© OpenStreetMap contributors',
        maxZoom: 19
      }).addTo(map);
      L.marker([lat, lng]).addTo(map);
    }, 100);
  }

  /**
   * 🔥 REESCRITO DESDE CERO - Popup de asignar corredor con búsqueda, estado CRM y comisión
   */
  async showAssignBrokerPopup(propId) {
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

      // 3️⃣ Crear modal
      const isMobileBroker = window.innerWidth <= 768;

      const modal = document.createElement('div');
      modal.id = 'assignBrokerModal';
      modal.className = 'modal-overlay';
      if (isMobileBroker) {
        modal.style.cssText = 'position: fixed; top: 0; left: 0; right: 0; bottom: 0; background: rgba(0,0,0,0.85); z-index: 99999; display: flex; align-items: flex-end; justify-content: center; padding: 0;';
      } else {
        modal.style.cssText = 'position: fixed; top: 0; left: 0; right: 0; bottom: 0; background: rgba(0,0,0,0.75); z-index: 99999; display: flex; align-items: center; justify-content: center; padding: 20px;';
      }

      // 4️⃣ Crear contenido del modal
      const modalContent = document.createElement('div');
      modalContent.className = 'modal-content';
      if (isMobileBroker) {
        modalContent.style.cssText = 'background: white; border-radius: 16px 16px 0 0; width: 100%; max-height: 95vh; overflow-y: auto; box-shadow: 0 -10px 40px rgba(0,0,0,0.3);';
      } else {
        modalContent.style.cssText = 'background: white; border-radius: 16px; max-width: 800px; width: 100%; max-height: 90vh; overflow-y: auto; box-shadow: 0 25px 80px rgba(0,0,0,0.4);';
      }

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

      const padModal = isMobileBroker ? 'var(--spacing-md)' : 'var(--spacing-xl)';
      const hSize = isMobileBroker ? '20' : '28';

      modalContent.innerHTML = `
        <div style="padding: ${padModal}; border-bottom: 2px solid var(--borde); display: flex; justify-content: space-between; align-items: center; background: linear-gradient(135deg, var(--azul-corporativo) 0%, var(--azul-medio) 100%); color: white; border-radius: 16px 16px 0 0;">
          <h2 style="margin: 0; color: white; display: flex; align-items: center; gap: 10px; font-size: ${isMobileBroker ? '1rem' : '1.25rem'};">
            <svg xmlns="http://www.w3.org/2000/svg" width="${hSize}" height="${hSize}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path>
              <circle cx="9" cy="7" r="4"></circle>
              <path d="M23 21v-2a4 4 0 0 0-3-3.87"></path>
              <path d="M16 3.13a4 4 0 0 1 0 7.75"></path>
            </svg>
            Asignar Corredor
          </h2>
          <button class="btn-close-broker" style="background: rgba(255,255,255,0.2); border: none; font-size: 28px; cursor: pointer; color: white; width: 40px; height: 40px; border-radius: 50%; transition: var(--transition-fast); display: flex; align-items: center; justify-content: center;" onmouseover="this.style.background='rgba(255,255,255,0.3)'" onmouseout="this.style.background='rgba(255,255,255,0.2)'">&times;</button>
        </div>

        <div style="padding: ${padModal};">
          <!-- Título de propiedad -->
          <div style="margin-bottom: var(--spacing-md); padding: var(--spacing-sm) var(--spacing-md); background: linear-gradient(135deg, #f8f9fa 0%, #e9ecef 100%); border-radius: 8px; border-left: 4px solid var(--azul-corporativo);">
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

      // 5️⃣ Variables para formulario
      let selectedBrokerId = null;

      // 6️⃣ Event Listeners

      // Búsqueda de corredores
      const searchInput = document.getElementById('brokerSearchInput');
      const brokerItems = document.querySelectorAll('.broker-item');

      searchInput.addEventListener('input', (e) => {
        const query = e.target.value.toLowerCase().trim();
        
        brokerItems.forEach(item => {
          const name = (item.dataset.brokerName || '').toLowerCase();
          const email = (item.dataset.brokerEmail || '').toLowerCase();
          
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
        });
      });

      // Función para cerrar modal
      const closeModal = () => {
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
   * 🔥 ACTUALIZADO: Usa nuevo endpoint PUT /propiedades/{propiedad_id}/corredor
   */
  async assignBrokerToProperty(propId, brokerId, crmStatus = null, comision = null) {
    try {
      const token = authService.getToken();

      // ✅ NUEVO PAYLOAD según documentación del backend
      const payload = {};
      
      // Agregar corredor_asignado_id (obligatorio)
      if (brokerId) {
        payload.corredor_asignado_id = parseInt(brokerId);
      }

      // Agregar comisión si está presente
      if (comision !== null && comision !== undefined) {
        payload.comision_corredor = parseFloat(comision);
      }


      // ✅ NUEVO ENDPOINT: PUT /propiedades/{propiedad_id}/corredor
      const response = await fetch(`${API_CONFIG.BASE_URL}/propiedades/${propId}/corredor`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(payload)
      });

      const result = await response.json();

      if (!response.ok) {
        console.error('❌ Error del servidor:', result);
        throw new Error(result.message || 'Error al asignar corredor');
      }


      // Mostrar mensaje de éxito con los cambios
      const cambiosTexto = result.data?.cambios?.join(', ') || 'Corredor asignado';
      showNotification(`✅ ${cambiosTexto}`, 'success');

      // Actualizar estado CRM si fue proporcionado
      if (crmStatus) {
        await this.updatePropertyCRMStatus(propId, crmStatus);
      }

      // Recargar propiedades desde API (no usar cache)
      await this.forceReloadProperties();

    } catch (error) {
      console.error('❌ Error asignando corredor:', error);
      showNotification(`❌ ${error.message}`, 'error');
    }
  }

  /**
   * Actualizar estado CRM de una propiedad (método auxiliar)
   */
  async updatePropertyCRMStatus(propId, crmStatus) {
    try {
      const token = authService.getToken();
      
      const response = await fetch(`${API_CONFIG.BASE_URL}/propiedades/${propId}/estado-crm`, {
        method: 'PATCH',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ estado_crm: crmStatus })
      });

      if (!response.ok) {
        console.warn('⚠️ No se pudo actualizar estado CRM');
      }
    } catch (error) {
      console.warn('⚠️ Error actualizando estado CRM:', error);
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
    this.allProperties = [];
  }
}

// Exponer globalmente para el router
window.PropiedadesTab = PropiedadesTab;

// Página de Resultados con Filtros Dinámicos - Qadrante
class ResultadosPage {
  constructor() {
    this.propiedades = [];
    this.propiedadesFiltradas = [];
    this.filtrosSimplificados = null;
    this.filtrosAdicionales = {
      basico: {},
      avanzado: {}
    };
    this.caracteristicas = [];
    this.tiposInmuebles = [];
    this.distritos = [];
    this.configFiltros = null;
    this.usuarioLogueado = null;
    this.map = null;
    this.markers = [];
    this.favoritos = [];
    this.mostrandoResultados = false;
    this.debouncedPreview = null;

    // Paginación
    this.currentPage = 1;
    this.itemsPerPage = window.innerWidth <= 1024 ? 5 : 10;

    this.init();
  }

  renderResumenGenericosMobile(modoEdicion = false) {
    const box = document.getElementById('resumenGenericosMobile');
    if (!box) return;
    const fs = this.filtrosSimplificados || {};

    if (!modoEdicion) {
      // MODO RESUMEN: Texto elegante
      const distritos = Array.isArray(fs.distritos_ids) && fs.distritos_ids.length > 0
        ? fs.distritos_ids.map(id => this.distritos.find(d => d.id === id)?.nombre).filter(Boolean).join(', ')
        : '—';

      const tipoInmueble = fs.tipo_inmueble_id
        ? (this.tiposInmuebles.find(t => t.id === fs.tipo_inmueble_id)?.nombre || '—')
        : '—';

      const metragem = fs.area ? `${fs.area} m²` : '—';
      const condicion = fs.transaccion ? (fs.transaccion === 'venta' ? 'Venta' : 'Alquiler') : '—';

      let presupuesto = '—';
      if (fs.transaccion === 'venta' && fs.presupuesto_compra) {
        presupuesto = `${Number(fs.presupuesto_compra).toLocaleString()} USD`;
      } else if (fs.transaccion === 'alquiler' && fs.presupuesto_alquiler) {
        presupuesto = `${Number(fs.presupuesto_alquiler).toLocaleString()} USD/mes`;
      }

      box.innerHTML = `
        <div class="item"><span>Distrito(s)</span><strong>${distritos}</strong></div>
        <div class="item"><span>Tipo Inmueble</span><strong>${tipoInmueble}</strong></div>
        <div class="item"><span>Área</span><strong>${metragem}</strong></div>
        <div class="item"><span>Transacción</span><strong>${condicion}</strong></div>
        <div class="item"><span>Presupuesto</span><strong>${presupuesto}</strong></div>
        <div style="margin-top: 16px;">
          <button id="btnEditarGenericosMob" class="btn btn-sm btn-outline" style="width: 100%;">
            <i class="fa-solid fa-pencil"></i> Editar
          </button>
        </div>
      `;

      document.getElementById('btnEditarGenericosMob')?.addEventListener('click', () => {
        this.renderResumenGenericosMobile(true);
        this.setupAccordion(); // Re-adjuntar listeners del acordeón

        // Verificar si algún acordeón está abierto
        setTimeout(() => {
          this.verificarMostrarResultadosPorAcordeon();
        }, 50);
      });

    } else {
      // MODO EDICIÓN: Formulario con multi-select de checkboxes
      const distritosSeleccionados = Array.isArray(fs.distritos_ids) ? fs.distritos_ids : [];
      const distritosNombres = distritosSeleccionados
        .map(id => this.distritos.find(d => d.id === id)?.nombre)
        .filter(Boolean);

      // Mostrar máximo 3 tags, el resto como "+N"
      const visibleTags = distritosNombres.slice(0, 3);
      const remaining = distritosNombres.length - 3;
      let tagsHTML = visibleTags.map(n => `<span class="multi-select__tag">${n}</span>`).join('');
      if (remaining > 0) {
        tagsHTML += `<span class="multi-select__tag">+${remaining}</span>`;
      }

      const tiposOptions = this.tiposInmuebles.map(t => {
        const selected = fs.tipo_inmueble_id === t.id ? 'selected' : '';
        return `<option value="${t.id}" ${selected}>${t.nombre}</option>`;
      }).join('');

      box.innerHTML = `
        <div class="form-group" style="margin-bottom: 8px;">
          <label style="font-size: 11px; color: #666; margin-bottom: 3px; display: block; font-weight: 500;">Distrito(s)</label>
          <div id="gen_distritos_multi_mob" class="multi-select">
            <button type="button" class="multi-select__button" id="gen_distritos_toggle_mob" aria-expanded="false" style="padding: 8px 10px;">
              <span class="multi-select__placeholder" id="gen_distritos_placeholder_mob" style="${distritosSeleccionados.length > 0 ? 'display:none;' : ''}">Selecciona distritos...</span>
              <span class="multi-select__tags" id="gen_distritos_tags_mob">
                ${tagsHTML}
              </span>
              <span class="multi-select__arrow">▾</span>
            </button>
            <div class="multi-select__panel" id="gen_distritos_panel_mob" hidden>
              <div class="multi-select__search">
                <input type="text" id="gen_distritos_search_mob" placeholder="Buscar distrito..." class="multi-select__search-input">
              </div>
              <div class="multi-select__options" id="gen_distritos_options_mob">
                ${this.distritos.map(d => {
                  const checked = distritosSeleccionados.includes(d.id) ? 'checked' : '';
                  return `
                    <div class="multi-option">
                      <input type="checkbox" id="distrito_mob_${d.id}" value="${d.id}" ${checked}>
                      <label for="distrito_mob_${d.id}">${d.nombre}</label>
                    </div>
                  `;
                }).join('')}
              </div>
              <div class="multi-select__actions">
                <button type="button" id="gen_distritos_select_all_mob" class="multi-select__action">Seleccionar todos</button>
                <button type="button" id="gen_distritos_clear_mob" class="multi-select__action alt">Limpiar</button>
              </div>
            </div>
          </div>
          <small style="font-size: 10px; color: #999;">Busca y selecciona múltiples distritos</small>
        </div>

        <div class="form-group" style="margin-bottom: 8px;">
          <label for="gen_tipo_mob" style="font-size: 11px; color: #666; margin-bottom: 3px; display: block; font-weight: 500;">Tipo Inmueble</label>
          <select id="gen_tipo_mob" class="form-control" style="padding: 8px 10px; font-size: 13px;">
            <option value="">Seleccionar...</option>
            ${tiposOptions}
          </select>
        </div>

        <div class="form-group" style="margin-bottom: 8px;">
          <label for="gen_area_mob" style="font-size: 11px; color: #666; margin-bottom: 3px; display: block; font-weight: 500;">Área (m²)</label>
          <input type="number" id="gen_area_mob" class="form-control" style="padding: 8px 10px; font-size: 13px;" placeholder="Ej: 100" value="${fs.area || ''}">
        </div>

        <div class="form-group" style="margin-bottom: 8px;">
          <label style="font-size: 11px; color: #666; margin-bottom: 3px; display: block; font-weight: 500;">Transacción</label>
          <div style="display: flex; gap: 6px;">
            <label style="display: flex; align-items: center; cursor: pointer; flex: 1; padding: 6px 8px; border: 1px solid #ddd; border-radius: 6px; font-size: 12px;">
              <input type="radio" name="gen_transaccion_mob" value="venta" ${fs.transaccion === 'venta' ? 'checked' : ''} style="margin-right: 5px;">
              <span>Venta</span>
            </label>
            <label style="display: flex; align-items: center; cursor: pointer; flex: 1; padding: 6px 8px; border: 1px solid #ddd; border-radius: 6px; font-size: 12px;">
              <input type="radio" name="gen_transaccion_mob" value="alquiler" ${fs.transaccion === 'alquiler' ? 'checked' : ''} style="margin-right: 5px;">
              <span>Alquiler</span>
            </label>
          </div>
        </div>

        <div class="form-group" style="margin-bottom: 8px;" id="gen_presupuesto_group_mob">
          <label for="gen_presupuesto_mob" style="font-size: 11px; color: #666; margin-bottom: 3px; display: block; font-weight: 500;">
            Presupuesto ${fs.transaccion === 'venta' ? '(USD)' : '(USD/mes)'}
          </label>
          <input
            type="number"
            id="gen_presupuesto_mob"
            class="form-control"
            style="padding: 8px 10px; font-size: 13px;"
            placeholder="${fs.transaccion === 'venta' ? 'Ej: 200000' : 'Ej: 1500'}"
            value="${fs.transaccion === 'venta' ? (fs.presupuesto_compra || '') : (fs.presupuesto_alquiler || '')}"
          >
        </div>

        <div style="margin-top: 12px;">
          <button id="btnVolverResumenMob" class="btn btn-outline btn-sm" style="width: 100%; padding: 8px;">
            <i class="fa-solid fa-arrow-left"></i> Volver al Resumen
          </button>
        </div>
      `;

      this.attachGenericosListenersMobile();
    }
  }

  // Listeners para campos genéricos editables (MÓVIL)
  // ✅ Cambios se aplican AUTOMÁTICAMENTE (sin botón Guardar/Cancelar)
  attachGenericosListenersMobile() {
    // Función para aplicar cambios automáticamente
    const aplicarCambios = () => {
      // Obtener distritos desde checkboxes (multi-select)
      const distritosChecked = Array.from(
        document.querySelectorAll('#gen_distritos_options_mob input[type="checkbox"]:checked')
      ).map(cb => parseInt(cb.value));

      const tipoSelect = document.getElementById('gen_tipo_mob');
      const areaInput = document.getElementById('gen_area_mob');
      const transaccionRadio = document.querySelector('input[name="gen_transaccion_mob"]:checked');
      const presupuestoInput = document.getElementById('gen_presupuesto_mob');

      if (!tipoSelect) return;

      const tipoId = tipoSelect.value ? parseInt(tipoSelect.value) : null;
      const area = areaInput.value ? parseFloat(areaInput.value) : null;
      const transaccion = transaccionRadio?.value || null;
      const presupuesto = presupuestoInput.value ? parseFloat(presupuestoInput.value) : null;

      this.filtrosSimplificados = {
        ...this.filtrosSimplificados,
        distritos_ids: distritosChecked.length > 0 ? distritosChecked : [],
        tipo_inmueble_id: tipoId,
        area: area,
        transaccion: transaccion
      };

      if (transaccion === 'venta') {
        this.filtrosSimplificados.presupuesto_compra = presupuesto;
        delete this.filtrosSimplificados.presupuesto_alquiler;
      } else if (transaccion === 'alquiler') {
        this.filtrosSimplificados.presupuesto_alquiler = presupuesto;
        delete this.filtrosSimplificados.presupuesto_compra;
      }

      localStorage.setItem('filtros_simplificados', JSON.stringify(this.filtrosSimplificados));
      this.aplicarFiltrosCompletos();
      this.renderChipsActivos();

      // Actualizar tags visuales del multi-select móvil
      this.actualizarTagsDistritosMobile();

      // Actualizar también la versión desktop
      this.renderResumenGenericos(false);
      this.setupAccordion(); // Re-adjuntar listeners del acordeón

      // Verificar si algún acordeón está abierto
      setTimeout(() => {
        this.verificarMostrarResultadosPorAcordeon();
      }, 50);
    };

    // Setup multi-select de distritos (móvil)
    this.setupMultiSelectDistritosMobile(aplicarCambios);

    // Aplicar automáticamente al cambiar otros campos
    document.getElementById('gen_tipo_mob')?.addEventListener('change', aplicarCambios);
    document.getElementById('gen_area_mob')?.addEventListener('input', aplicarCambios);
    document.getElementById('gen_presupuesto_mob')?.addEventListener('input', aplicarCambios);

    // Listener para cambio de transacción (actualiza label y aplica cambios)
    document.querySelectorAll('input[name="gen_transaccion_mob"]').forEach(radio => {
      radio.addEventListener('change', (e) => {
        const transaccion = e.target.value;
        const presupuestoGroup = document.getElementById('gen_presupuesto_group_mob');
        const presupuestoInput = document.getElementById('gen_presupuesto_mob');
        const label = presupuestoGroup?.querySelector('label');

        if (label && presupuestoInput) {
          label.innerHTML = `Presupuesto ${transaccion === 'venta' ? '(USD)' : '(USD/mes)'}`;
          presupuestoInput.placeholder = transaccion === 'venta' ? 'Ej: 200000' : 'Ej: 1500';

          const fs = this.filtrosSimplificados || {};
          presupuestoInput.value = transaccion === 'venta' ? (fs.presupuesto_compra || '') : (fs.presupuesto_alquiler || '');
        }

        // Aplicar cambios automáticamente
        aplicarCambios();
      });
    });

    // Botón "Volver al Resumen"
    document.getElementById('btnVolverResumenMob')?.addEventListener('click', () => {
      this.renderResumenGenericosMobile(false);
      this.setupAccordion(); // Re-adjuntar listeners del acordeón

      // Verificar si algún acordeón está abierto
      setTimeout(() => {
        this.verificarMostrarResultadosPorAcordeon();
      }, 50);
    });
  }

  setupMobileFilters() {
    const btnOpen = document.getElementById('btnToggleMobileFilters');
    const drawer = document.getElementById('mobileFiltersDrawer');
    const backdrop = document.getElementById('drawerBackdrop');
    const btnClose = document.getElementById('btnCloseMobileFilters');
    const btnAplicar = document.getElementById('btnAplicarFiltrosMobile');
    const btnLimpiar = document.getElementById('btnLimpiarFiltrosMobile');

    // OCULTAR botones inicialmente (solo filtros genéricos abiertos)
    if (btnAplicar) {
      btnAplicar.style.display = 'none';
    }
    if (btnLimpiar) {
      btnLimpiar.style.display = 'none';
    }

    const open = () => {
      if (drawer) {
        drawer.classList.add('open');
        drawer.setAttribute('aria-hidden', 'false');
      }
      if (backdrop) {
        backdrop.classList.add('active');
      }
    };

    const close = () => {
      if (drawer) {
        drawer.classList.remove('open');
        drawer.setAttribute('aria-hidden', 'true');
      }
      if (backdrop) {
        backdrop.classList.remove('active');
      }
    };

    // Función para MOSTRAR botones cuando se abren filtros básicos o avanzados
    const mostrarBotones = () => {
      if (btnAplicar) {
        btnAplicar.style.display = 'inline-flex';
      }
      if (btnLimpiar) {
        btnLimpiar.style.display = 'inline-flex';
      }
    };

    btnOpen?.addEventListener('click', () => {
      // Pintar contenido al abrir
      this.renderResumenGenericosMobile();
      const contBasMob = document.getElementById('contenedorBasicoMobile');
      const contAvzMob = document.getElementById('contenedorAvanzadoMobile');

      if (contBasMob) contBasMob.innerHTML = this.generarHTMLFiltroBasico();
      if (contAvzMob) {
        contAvzMob.innerHTML = this.generarHTMLFiltroAvanzado();
      }

      this.attachBasicoInlineListeners();

      // Abrir drawer
      open();

      // Adjuntar listeners DESPUÉS de que el drawer esté abierto
      // IMPORTANTE: Buscar SOLO dentro del drawer móvil
      setTimeout(() => {
        const drawerMobile = document.getElementById('mobileFiltersDrawer');
        if (drawerMobile) {
          this.attachAvanzadoInlineListeners(drawerMobile);
        } else {
          this.attachAvanzadoInlineListeners();
        }
      }, 250);

      // Agregar listeners para habilitar botones cuando se abran filtros básicos o avanzados
      setTimeout(() => {
        const headerBasico = document.querySelector('.drawer-body .accordion-header[data-accordion="basico"]');
        const headerAvanzado = document.querySelector('.drawer-body .accordion-header[data-accordion="avanzado"]');

        if (headerBasico) {
          headerBasico.addEventListener('click', () => {
            setTimeout(mostrarBotones, 100);
          });
        }
        if (headerAvanzado) {
          headerAvanzado.addEventListener('click', () => {
            setTimeout(mostrarBotones, 100);
          });
        }
      }, 200);
    });
    btnClose?.addEventListener('click', close);
    backdrop?.addEventListener('click', close); // Cerrar al hacer click en el backdrop

    btnAplicar?.addEventListener('click', () => {
      this.aplicarFiltrosCompletos();
      close();
    });
    btnLimpiar?.addEventListener('click', () => {
      this.limpiarFiltrosAdicionales();
      // Re-pintar vacíos
      const contBasMob = document.getElementById('contenedorBasicoMobile');
      const contAvzMob = document.getElementById('contenedorAvanzadoMobile');
      if (contBasMob) contBasMob.innerHTML = this.generarHTMLFiltroBasico();
      if (contAvzMob) contAvzMob.innerHTML = this.generarHTMLFiltroAvanzado();
      this.attachBasicoInlineListeners();
      this.attachAvanzadoInlineListeners();
      this.renderChipsActivos();
    });
  }

  async init() {
    // 1. Cargar filtros de localStorage PRIMERO (antes de llamar al API)
    this.cargarFiltrosSimplificados();

    // 2. Cargar datos del backend CON los filtros ya cargados
    await this.cargarDatos();

    // 3. Cargar configuración del usuario
    this.cargarUsuarioLogueado();
    this.cargarFavoritos();

    // 3. Aplicar filtros
    this.aplicarFiltrosIniciales();
    this.mostrarImagenReferencial();

    // 4. Configurar eventos
    this.setupEventListeners();
    this.setupHamburgerMenu();
    this.setupPresupuesto();
    
    // 🖼️ Inicializar Image Viewer
    if (window.imageViewer) {
      window.imageViewer.attachToImages('.search-result-image');
    }

    // 5. Mostrar layout de 3 columnas
    this.mostrarLayoutTresColumnas();

    // 5.1 Re-asegurar cards visibles y listeners del carrusel
    setTimeout(() => {
      const propertiesList = document.getElementById('propertiesList');
      if (propertiesList) propertiesList.style.display = 'flex';
      this.renderResultados();
      if (window.imageViewer) {
        window.imageViewer.attachToImages('.search-result-image');
      }
    }, 200);

    // 6. Configurar drawer móvil
    this.setupMobileFilters();

    // 7. En móvil, forzar mostrar mapa y resultados
    if (window.innerWidth <= 1024) {
      const imagenRef = document.getElementById('imagenReferencial');
      const mainContainer = document.getElementById('mainContainer');
      const mapPlaceholder = document.getElementById('mapPlaceholder');
      const mapCanvas = document.getElementById('map');
      const propertiesList = document.getElementById('propertiesList');
      const placeholderResultados = document.getElementById('placeholderResultados');

      if (imagenRef) imagenRef.style.display = 'none';
      if (mainContainer) mainContainer.style.display = 'grid';

      if (mapPlaceholder) mapPlaceholder.style.display = 'none';
      if (placeholderResultados) placeholderResultados.style.display = 'none';
      if (mapCanvas) mapCanvas.style.display = 'block';
      if (propertiesList) propertiesList.style.display = 'flex';

      this.renderResultados();

      setTimeout(() => {
        this.renderMapa();
        setTimeout(() => {
          if (this.map) {
            this.map.invalidateSize();
          }
        }, 200);
      }, 100);
    }
  }

  // Utilidad debounce
  debounce(fn, delay = 300) {
    let t;
    return (...args) => {
      clearTimeout(t);
      t = setTimeout(() => fn.apply(this, args), delay);
    };
  }

  cargarUsuarioLogueado() {
    const usuarioStr = localStorage.getItem('usuario');
    if (usuarioStr) {
      this.usuarioLogueado = JSON.parse(usuarioStr);
      document.getElementById('usuarioInfo').textContent = `Usuario: ${this.usuarioLogueado.username}`;
    }
  }

  cargarFavoritos() {
    const favoritosStr = localStorage.getItem('favoritos');
    this.favoritos = favoritosStr ? JSON.parse(favoritosStr) : [];
  }

  guardarFavoritos() {
    localStorage.setItem('favoritos', JSON.stringify(this.favoritos));
  }

  guardarFiltrosAdicionales() {
    localStorage.setItem('filtros_adicionales', JSON.stringify(this.filtrosAdicionales));
  }

  async cargarDatos() {
    try {
      const API_BASE = 'https://appbackimmobiliaria-production.up.railway.app/api/v1';
      const tipoInmuebleId = this.filtrosSimplificados?.tipo_inmueble_id || 1;

      // ✅ Construir objeto de filtros para búsqueda avanzada (igual que dashboard)
      const filtrosBusqueda = {
        filtros_genericos: {
          tipo_inmueble_id: this.filtrosSimplificados?.tipo_inmueble_id ? parseInt(this.filtrosSimplificados.tipo_inmueble_id) : null,
          distrito_ids: this.filtrosSimplificados?.distritos_ids?.length > 0
            ? this.filtrosSimplificados.distritos_ids.map(d => parseInt(d))
            : [],
          transaccion: this.filtrosSimplificados?.transaccion || 'venta'
        },
        filtros_basicos: {
          area: this.filtrosSimplificados?.area ? parseInt(this.filtrosSimplificados.area) : null,
          precio: this.filtrosSimplificados?.presupuesto_compra
            ? parseInt(this.filtrosSimplificados.presupuesto_compra)
            : (this.filtrosSimplificados?.presupuesto_alquiler
              ? parseInt(this.filtrosSimplificados.presupuesto_alquiler)
              : null)
        },
        filtros_avanzados: [],
        page: 1,
        limit: 100,
        incluir_combinaciones: true  // ✅ Clave para obtener oficinas combinadas
      };

      // ✅ Headers: sin token para búsqueda pública (invitados)
      const headers = {
        'Content-Type': 'application/json'
      };

      // Si hay usuario logueado, agregar token y usar endpoint autenticado
      const token = localStorage.getItem('token');
      let propiedadesEndpoint = `${API_BASE}/propiedades/buscar-avanzada-publica`; // Default: público

      if (token) {
        headers['Authorization'] = `Bearer ${token}`;
        propiedadesEndpoint = `${API_BASE}/propiedades/buscar-avanzada`; // Con auth
      }

      const [propiedadesRes, caracteristicasRes, tiposRes, distritosRes, configFiltrosRes] = await Promise.all([
        // ✅ Usar endpoint público o privado según autenticación
        fetch(propiedadesEndpoint, {
          method: 'POST',
          headers: headers,
          body: JSON.stringify(filtrosBusqueda)
        }),
        fetch(`${API_BASE}/caracteristicas`),
        fetch(`${API_BASE}/tipos-inmueble`),
        fetch(`${API_BASE}/distritos`),
        fetch(`${API_BASE}/caracteristicas-x-inmueble/tipo-inmueble/${tipoInmuebleId}/agrupadas`)  // ✅ Filtros avanzados según tipo
      ]);

      // ✅ Mejor manejo de errores - identificar cuál endpoint falló
      const responses = [
        { name: 'propiedades', res: propiedadesRes, url: `/propiedades/buscar-avanzada` },
        { name: 'caracteristicas', res: caracteristicasRes, url: `/caracteristicas` },
        { name: 'tipos', res: tiposRes, url: `/tipos-inmueble` },
        { name: 'distritos', res: distritosRes, url: `/distritos` },
        { name: 'configFiltros', res: configFiltrosRes, url: `/caracteristicas-x-inmueble/tipo-inmueble/${tipoInmuebleId}` }
      ];

      for (const { name, res, url } of responses) {
        if (!res.ok) {
          console.error(`❌ Error en ${name} (${url}): ${res.status} ${res.statusText}`);
          const errorText = await res.text();
          console.error(`📄 Respuesta: ${errorText}`);
          
          // ⚠️ Si falla configFiltros, continuar sin él (no crítico)
          if (name === 'configFiltros') {
            console.warn(`⚠️ Continuando sin configuración de filtros para tipo ${tipoInmuebleId}`);
            continue;
          }
          
          throw new Error(`Error en endpoint ${name}: ${res.status}`);
        }
      }

      const propiedadesData = await propiedadesRes.json();
      const caracteristicasData = await caracteristicasRes.json();
      const tiposData = await tiposRes.json();
      const distritosData = await distritosRes.json();
      
      // ✅ Manejar configFiltros que puede fallar
      let configFiltrosData = null;
      if (configFiltrosRes.ok) {
        configFiltrosData = await configFiltrosRes.json();
      } else {
        console.warn('⚠️ No se pudo cargar configuración de filtros, usando valores por defecto');
        configFiltrosData = { categorias: [] };
      }

      // 🔍 Mapear respuesta de propiedades (soporta combinaciones)
      // El backend puede retornar: { data: [...], metadata: { individuales: X, combinaciones: Y } }
      // O simplemente un array directo
      if (propiedadesData.data && Array.isArray(propiedadesData.data)) {
        this.propiedades = propiedadesData.data;
        this.metadata = propiedadesData.metadata || {};
      } else {
        // Respuesta simple (sin combinaciones)
        this.propiedades = propiedadesData.data || propiedadesData;
        this.metadata = {};
      }

      // Normalizar imagenes de cada propiedad
      this.propiedades.forEach(prop => {
        if (prop.tipo === 'combinacion') return;
        let imgs = Array.isArray(prop.imagenes) ? prop.imagenes : [];
        if (imgs.length === 0 && prop.imagen_principal) {
          imgs = [prop.imagen_principal];
        }
        if (imgs.length === 0) {
          imgs = ['https://placehold.co/800x600/e5e7eb/6b7280?text=Sin+Imagen'];
        }
        prop.imagenes = imgs;
      });

      // Mapear características
      this.caracteristicas = caracteristicasData.map(c => ({
        id: c.caracteristica_id,
        nombre: c.nombre,
        descripcion: c.descripcion,
        tipo_input: c.tipo_input,
        unidad: c.unidad,
        categoria: c.categoria
      }));

      // Mapear tipos de inmueble
      this.tiposInmuebles = tiposData.map(t => ({
        id: t.tipo_inmueble_id,
        nombre: t.nombre,
        icono: t.icono || '🏠',
        descripcion: t.descripcion
      }));

      // Mapear distritos
      this.distritos = distritosData.map(d => ({
        id: d.distrito_id,
        nombre: d.nombre,
        ciudad: d.ciudad,
        provincia: d.provincia
      }));

      this.configFiltros = this.convertirConfigFiltros(configFiltrosData);
    } catch (error) {
      console.error('Error cargando datos:', error);
      alert('Error al cargar los datos. Por favor recarga la página.');
    }
  }

  convertirConfigFiltros(apiData) {
    // Convertir el formato de la API al formato esperado por el código existente
    const filtrosAvanzados = apiData.categorias.map((cat, index) => ({
      tipo_inmueble_id: apiData.tipo_inmueble_id,
      tipo_inmueble_nombre: apiData.tipo_inmueble_nombre,
      categorias: [{
        codigo: cat.nombre.toUpperCase().replace(/ /g, '_'),
        nombre: cat.nombre,
        orden: cat.orden,
        caracteristicas_ids: cat.caracteristicas.map(c => c.caracteristica_id)
      }]
    }));

    return {
      filtros_basicos: [], // Se puede agregar si es necesario
      filtros_avanzados_por_tipo: [{
        tipo_inmueble_id: apiData.tipo_inmueble_id,
        tipo_inmueble_nombre: apiData.tipo_inmueble_nombre,
        categorias: apiData.categorias.map(cat => ({
          codigo: cat.nombre.toUpperCase().replace(/ /g, '_'),
          nombre: cat.nombre,
          orden: cat.orden,
          caracteristicas_ids: cat.caracteristicas.map(c => c.caracteristica_id)
        }))
      }]
    };
  }

  cargarFiltrosSimplificados() {
    const filtrosStr = localStorage.getItem('filtros_simplificados');
    if (filtrosStr) {
      this.filtrosSimplificados = JSON.parse(filtrosStr);
    } else {
      console.warn('⚠️ No se encontraron filtros en localStorage');
    }

    // Cargar filtros adicionales (básico y avanzado) si existen
    const filtrosAdicionalesStr = localStorage.getItem('filtros_adicionales');
    if (filtrosAdicionalesStr) {
      try {
        const filtrosGuardados = JSON.parse(filtrosAdicionalesStr);
        this.filtrosAdicionales = {
          basico: filtrosGuardados.basico || {},
          avanzado: filtrosGuardados.avanzado || {}
        };
      } catch (e) {
      }
    }
  }

  aplicarFiltrosIniciales() {
    if (!this.filtrosSimplificados) {
      this.propiedadesFiltradas = this.propiedades;
      return;
    }

    this.propiedadesFiltradas = this.propiedades.filter(prop => {
      // 🔗 Las combinaciones ya vienen filtradas del backend, no filtrar de nuevo
      if (prop.tipo === 'combinacion') {
        return true;
      }

      // Filtro por distritos múltiples - Comparar por NOMBRE
      if (Array.isArray(this.filtrosSimplificados.distritos_ids) && this.filtrosSimplificados.distritos_ids.length > 0) {
        const nombresDistritos = this.filtrosSimplificados.distritos_ids
          .map(id => this.distritos.find(d => d.id === id)?.nombre)
          .filter(Boolean);

        if (!nombresDistritos.includes(prop.distrito)) {
          return false;
        }
      }

      // Filtro por tipo de inmueble - Comparar por NOMBRE
      if (this.filtrosSimplificados.tipo_inmueble_id) {
        const tipoNombre = this.tiposInmuebles.find(t => t.id === this.filtrosSimplificados.tipo_inmueble_id)?.nombre;
        if (tipoNombre && prop.tipo_inmueble !== tipoNombre) {
          return false;
        }
      }

      // Filtro por área (±15%) - Convertir string a número
      if (this.filtrosSimplificados.area) {
        const areaPropiedad = parseFloat(prop.area || prop.area_total);
        const margen = this.filtrosSimplificados.area * 0.15;
        if (areaPropiedad < (this.filtrosSimplificados.area - margen) ||
          areaPropiedad > (this.filtrosSimplificados.area + margen)) {
          return false;
        }
      }

      // Filtro por presupuesto según transacción (±15%)
      if (this.filtrosSimplificados.presupuesto) {
        const margen = this.filtrosSimplificados.presupuesto * 0.15;

        if (this.filtrosSimplificados.transaccion === 'venta' && prop.precio_venta) {
          if (prop.precio_venta < (this.filtrosSimplificados.presupuesto - margen) ||
            prop.precio_venta > (this.filtrosSimplificados.presupuesto + margen)) {
            return false;
          }
        } else if (this.filtrosSimplificados.transaccion === 'alquiler' && prop.precio_alquiler) {
          if (prop.precio_alquiler < (this.filtrosSimplificados.presupuesto - margen) ||
            prop.precio_alquiler > (this.filtrosSimplificados.presupuesto + margen)) {
            return false;
          }
        }
      }

      return true;
    });
  }

  mostrarImagenReferencial() {
    const imagenRef = document.getElementById('imagenReferencial');
    const mainContainer = document.getElementById('mainContainer');
    const numResultados = this.propiedadesFiltradas.length;

    // Obtener nombres de distritos seleccionados
    let nombreDistrito = '';
    if (Array.isArray(this.filtrosSimplificados?.distritos_ids) && this.filtrosSimplificados.distritos_ids.length > 0) {
      const nombres = this.filtrosSimplificados.distritos_ids
        .map(id => this.distritos.find(d => d.id === id)?.nombre)
        .filter(Boolean);
      nombreDistrito = nombres.join(', ');
    } else if (this.filtrosSimplificados?.distrito_id) {
      const distrito = this.distritos.find(d => d.id === this.filtrosSimplificados.distrito_id);
      nombreDistrito = distrito ? distrito.nombre : '';
    }

    // Actualizar contador
    document.getElementById('numResultados').textContent = numResultados;
    document.getElementById('numDistritos').textContent = nombreDistrito;
    document.getElementById('resultadosCount').textContent =
      numResultados === 0 ? 'Resultados de Búsqueda' : `${numResultados} ${numResultados === 1 ? 'propiedad encontrada' : 'propiedades encontradas'}`;

    // Establecer imagen de fondo según tipo de inmueble
    if (this.filtrosSimplificados?.tipo_inmueble_id) {
      const tipoInmueble = this.tiposInmuebles.find(t => t.id === this.filtrosSimplificados.tipo_inmueble_id);
      const imagenBg = document.querySelector('.imagen-referencial-bg');

      if (tipoInmueble) {
        const nombreLower = tipoInmueble.nombre.toLowerCase();
        let imagenUrl = '';

        if (nombreLower.includes('casa')) {
          imagenUrl = 'https://images.unsplash.com/photo-1568605114967-8130f3a36994?w=1200&q=80';
        } else if (nombreLower.includes('departamento')) {
          imagenUrl = 'https://images.unsplash.com/photo-1545324418-cc1a3fa10c00?w=1200&q=80';
        } else if (nombreLower.includes('terreno')) {
          imagenUrl = 'https://images.unsplash.com/photo-1500382017468-9049fed747ef?w=1200&q=80';
        } else if (nombreLower.includes('oficina')) {
          imagenUrl = 'https://images.unsplash.com/photo-1497366216548-37526070297c?w=1200&q=80';
        } else if (nombreLower.includes('local')) {
          imagenUrl = 'https://images.unsplash.com/photo-1441984904996-e0b6ba687e04?w=1200&q=80';
        } else if (nombreLower.includes('cochera')) {
          imagenUrl = 'https://images.unsplash.com/photo-1590674899484-d5640e854abe?w=1200&q=80';
        }

        if (imagenUrl) {
          imagenBg.style.backgroundImage = `url('${imagenUrl}')`;
        }
      }
    }

    // Mostrar imagen referencial, ocultar resultados
    imagenRef.style.display = 'flex';
    mainContainer.style.display = 'none';
    this.mostrandoResultados = false;
  }

  // ======== FILTROS INLINE (EN IMAGEN REFERENCIAL) ========
  mostrarFiltroBasicoInline() {
    const container = document.getElementById('filtrosInline');
    if (!container) return;
    // Botones activos
    document.getElementById('toggleFiltroBasico')?.classList.add('active');
    document.getElementById('toggleFiltroAvanzado')?.classList.remove('active');

    container.innerHTML = this.generarHTMLFiltroBasico();
    this.cargarValoresFiltroBasico();
    this.attachBasicoInlineListeners();
    this.renderChipsActivos();
  }

  mostrarFiltroAvanzadoInline() {
    const container = document.getElementById('filtrosInline');
    if (!container) return;
    // Botones activos
    document.getElementById('toggleFiltroBasico')?.classList.remove('active');
    document.getElementById('toggleFiltroAvanzado')?.classList.add('active');

    if (!this.filtrosSimplificados?.tipo_inmueble_id) {
      container.innerHTML = '<p class="mensaje-info">⚠️ Debes seleccionar un tipo de inmueble primero</p>';
      return;
    }
    container.innerHTML = this.generarHTMLFiltroAvanzado();
    this.attachAvanzadoInlineListeners();
    this.renderChipsActivos();
  }

  attachBasicoInlineListeners() {
    if (!this.debouncedPreview) {
      this.debouncedPreview = this.debounce(this.actualizarPreview.bind(this), 350);
    }

    // Listeners para pills de transacción (con prevención de duplicados)
    document.querySelectorAll('.pill-transaccion').forEach(pill => {
      // Remover listener anterior si existe
      if (pill._basicoListener) {
        pill.removeEventListener('click', pill._basicoListener);
      }

      // Crear nuevo listener
      const clickHandler = (e) => {
        const filtroId = e.currentTarget.getAttribute('data-filtro-id');
        const value = e.currentTarget.getAttribute('data-value');

        // Actualizar estado
        this.filtrosAdicionales.basico[filtroId] = value;

        // Re-renderizar filtros básicos para mostrar/ocultar campos condicionales
        this.rerenderFiltrosBasicos();

        this.renderChipsActivos();
        this.debouncedPreview();
      };

      // Guardar referencia y agregar listener
      pill._basicoListener = clickHandler;
      pill.addEventListener('click', clickHandler);
    });

    // Listeners dinámicos para inputs number (con prevención de duplicados)
    document.querySelectorAll('input[data-filtro-id][type="number"]').forEach(input => {
      // Remover listener anterior si existe
      if (input._basicoInputListener) {
        input.removeEventListener('input', input._basicoInputListener);
      }

      // Crear nuevo listener
      const inputHandler = (e) => {
        const filtroId = e.currentTarget.getAttribute('data-filtro-id');
        const value = e.currentTarget.value;

        if (value && value.trim() !== '') {
          this.filtrosAdicionales.basico[filtroId] = parseFloat(value);
        } else {
          delete this.filtrosAdicionales.basico[filtroId];
        }

        this.renderChipsActivos();
        this.debouncedPreview();
      };

      // Guardar referencia y agregar listener
      input._basicoInputListener = inputHandler;
      input.addEventListener('input', inputHandler);
    });

    // Listeners dinámicos para selects (con prevención de duplicados)
    document.querySelectorAll('select[data-filtro-id]').forEach(select => {
      // Remover listener anterior si existe
      if (select._basicoSelectListener) {
        select.removeEventListener('change', select._basicoSelectListener);
      }

      // Crear nuevo listener
      const changeHandler = (e) => {
        const filtroId = e.currentTarget.getAttribute('data-filtro-id');
        const value = e.currentTarget.value;

        if (value && value.trim() !== '') {
          this.filtrosAdicionales.basico[filtroId] = value;
        } else {
          delete this.filtrosAdicionales.basico[filtroId];
        }

        this.renderChipsActivos();
        this.debouncedPreview();
      };

      // Guardar referencia y agregar listener
      select._basicoSelectListener = changeHandler;
      select.addEventListener('change', changeHandler);
    });
  }

  rerenderFiltrosBasicos() {
    // Re-renderizar en todos los contenedores
    const contenedores = [
      'contenedorBasico',
      'contenedorBasicoMobile',
      'filtrosInline'
    ];

    contenedores.forEach(id => {
      const container = document.getElementById(id);
      if (container) {
        container.innerHTML = this.generarHTMLFiltroBasico();
      }
    });

    // Re-attach listeners
    this.attachBasicoInlineListeners();
  }

  attachAvanzadoInlineListeners(container = document) {
    // Sub-accordion headers (categorías) - buscar en el contenedor especificado
    const headers = container.querySelectorAll('.accordion-header-avanzado');

    headers.forEach((header) => {
      // Remover listener anterior si existe para evitar duplicados
      if (header._avanzadoListener) {
        header.removeEventListener('click', header._avanzadoListener);
      }

      // Crear el nuevo listener
      const clickHandler = (e) => {
        e.preventDefault();
        e.stopPropagation();

        const categoria = e.currentTarget.getAttribute('data-categoria');

        // Buscar contenido en el mismo contenedor que el header
        const parentContainer = e.currentTarget.closest('.accordion-item-avanzado');
        const content = parentContainer?.querySelector(`.accordion-content-avanzado[data-categoria="${categoria}"]`);
        const icon = e.currentTarget.querySelector('i');

        if (content && icon) {
          const isExpanded = e.currentTarget.getAttribute('aria-expanded') === 'true';
          
          // Toggle current
          e.currentTarget.setAttribute('aria-expanded', !isExpanded);
          content.classList.toggle('open');
          icon.classList.toggle('fa-chevron-down');
          icon.classList.toggle('fa-chevron-up');
        }
      };

      // Guardar referencia y agregar listener
      header._avanzadoListener = clickHandler;
      header.addEventListener('click', clickHandler);
    });

    // Pill icon buttons (checkbox filters) - CON PREVENCIÓN DE DUPLICADOS
    const pills = container.querySelectorAll('.pill-icon[data-tipo="checkbox"]');

    pills.forEach((pill) => {
      // Remover listener anterior si existe para evitar duplicados
      if (pill._avanzadoPillListener) {
        pill.removeEventListener('click', pill._avanzadoPillListener);
      }

      // Crear nuevo listener
      const clickHandler = (e) => {
        const categoria = e.currentTarget.getAttribute('data-cat');
        const caracId = parseInt(e.currentTarget.getAttribute('data-carac-id'));


        if (!this.filtrosAdicionales.avanzado[categoria]) {
          this.filtrosAdicionales.avanzado[categoria] = {};
        }

        const isActive = this.filtrosAdicionales.avanzado[categoria][caracId] === true;

        if (isActive) {
          // Desactivar
          delete this.filtrosAdicionales.avanzado[categoria][caracId];
          if (Object.keys(this.filtrosAdicionales.avanzado[categoria]).length === 0) {
            delete this.filtrosAdicionales.avanzado[categoria];
          }
        } else {
          // Activar
          this.filtrosAdicionales.avanzado[categoria][caracId] = true;
        }

        const nuevoEstadoActivo = this.filtrosAdicionales.avanzado[categoria]?.[caracId] === true;
        e.currentTarget.classList.toggle('active', nuevoEstadoActivo);
        e.currentTarget.setAttribute('aria-pressed', nuevoEstadoActivo ? 'true' : 'false');

        this.actualizarBadgeCategoria(categoria);
        this.renderChipsActivos();
        if (this.debouncedPreview) this.debouncedPreview();
      };

      // Guardar referencia y agregar listener
      pill._avanzadoPillListener = clickHandler;
      pill.addEventListener('click', clickHandler);
    });

    // Number inputs (compact) - CON PREVENCIÓN DE DUPLICADOS
    container.querySelectorAll('.number-filter-compact input[type="number"]').forEach(inp => {
      // Remover listener anterior si existe para evitar duplicados
      if (inp._avanzadoNumberListener) {
        inp.removeEventListener('input', inp._avanzadoNumberListener);
      }

      // Crear nuevo listener
      const inputHandler = (e) => {
        const categoria = e.currentTarget.getAttribute('data-cat');
        const caracId = parseInt(e.currentTarget.getAttribute('data-carac-id'));
        const value = parseFloat(e.currentTarget.value);

        // Initialize category if needed
        if (!this.filtrosAdicionales.avanzado[categoria]) {
          this.filtrosAdicionales.avanzado[categoria] = {};
        }

        // Store or remove value
        if (!isNaN(value) && value > 0) {
          this.filtrosAdicionales.avanzado[categoria][caracId] = value;
        } else {
          delete this.filtrosAdicionales.avanzado[categoria][caracId];
        }

        // Update counter badge
        this.actualizarBadgeCategoria(categoria);

        // Re-render and preview
        this.renderChipsActivos();
        this.debouncedPreview?.();
      };

      // Guardar referencia y agregar listener
      inp._avanzadoNumberListener = inputHandler;
      inp.addEventListener('input', inputHandler);
    });

    // Old checkbox structure (for backwards compatibility)
    document.querySelectorAll('input[name="caracteristicas_avanzado"]').forEach(cb => {
      cb.addEventListener('change', () => { this.renderChipsActivos(); this.debouncedPreview?.(); });
    });
  }

  actualizarBadgeCategoria(categoria) {
    // Update the counter badge for a specific category
    const header = document.querySelector(`.accordion-header-avanzado[data-categoria="${categoria}"]`);
    if (!header) return;

    const count = this.contarCriteriosActivosCategoria(categoria);
    let badge = header.querySelector('.badge-counter');

    if (count > 0) {
      if (!badge) {
        // Create badge
        badge = document.createElement('span');
        badge.className = 'badge-counter';
        // Insert before the arrow
        const arrow = header.querySelector('.accordion-arrow');
        header.insertBefore(badge, arrow);
      }
      badge.textContent = count;
    } else {
      // Remove badge
      if (badge) badge.remove();
    }
  }

  // DEPRECADO: Esta función solo debe usarse para sincronización inicial si es necesario
  // Los event listeners manejan el estado automáticamente, NO llamar esta función en actualizaciones
  capturarDesdeUI() {
    console.warn('⚠️ capturarDesdeUI() está deprecada - Los event listeners manejan el estado automáticamente');

    // Esta función ya NO debe usarse porque puede sobrescribir el estado
    // que los event listeners están manejando correctamente.
    // Se mantiene solo por compatibilidad pero NO debe llamarse.

    // Los filtros básicos y avanzados se actualizan automáticamente via:
    // - attachBasicoInlineListeners() -> actualiza this.filtrosAdicionales.basico
    // - attachAvanzadoInlineListeners() -> actualiza this.filtrosAdicionales.avanzado
  }

  actualizarPreview() {
    // Recalcular sin salir de la imagen referencial
    // NO llamamos capturarDesdeUI() aquí porque los event listeners ya actualizaron this.filtrosAdicionales
    // Capturar desde UI solo debe usarse en la carga inicial, no en cada actualización
    this.aplicarFiltrosIniciales();
    this.aplicarFiltrosBasicos();
    this.aplicarFiltrosAvanzados();

    // Actualizar contadores en la cabecera
    const numResultados = this.propiedadesFiltradas.length;
    document.getElementById('numResultados').textContent = numResultados;
    document.getElementById('resultadosCount').textContent =
      numResultados === 0 ? 'Resultados de Búsqueda' : `${numResultados} ${numResultados === 1 ? 'propiedad encontrada' : 'propiedades encontradas'}`;
  }

  renderChipsActivos() {
    const bar = document.getElementById('filtrosAplicados');
    if (!bar) return;

    const genericos = [];
    const basicos = [];
    const avanzados = [];

    // Filtros Genéricos (del popup/modal)
    const fs = this.filtrosSimplificados || {};

    // Tipo de inmueble
    if (fs.tipo_inmueble_id) {
      const tipoInmueble = this.tiposInmuebles.find(t => t.id === fs.tipo_inmueble_id);
      if (tipoInmueble) genericos.push({ label: `Tipo: ${tipoInmueble.nombre}`, kind: 'generico', key: 'tipo_inmueble_id' });
    }

    // Distritos
    if (Array.isArray(fs.distritos_ids) && fs.distritos_ids.length > 0) {
      const nombres = fs.distritos_ids.map(id => this.distritos.find(d => d.id === id)?.nombre).filter(Boolean);
      if (nombres.length > 0) genericos.push({ label: `Distrito${nombres.length > 1 ? 's' : ''}: ${nombres.join(', ')}`, kind: 'generico', key: 'distritos_ids' });
    }

    // Transacción
    if (fs.transaccion) genericos.push({ label: `Operación: ${fs.transaccion}`, kind: 'generico', key: 'transaccion' });

    // Área
    if (fs.area) genericos.push({ label: `Área ≥ ${fs.area} m²`, kind: 'generico', key: 'area' });

    // Presupuesto
    if (fs.presupuesto_compra) genericos.push({ label: `Venta ≤ ${Number(fs.presupuesto_compra).toLocaleString()} USD`, kind: 'generico', key: 'presupuesto_compra' });
    if (fs.presupuesto_alquiler) genericos.push({ label: `Alquiler ≤ ${Number(fs.presupuesto_alquiler).toLocaleString()} USD/mes`, kind: 'generico', key: 'presupuesto_alquiler' });

    // Básico (solo campos propios, sin duplicar genéricos)
    const b = this.filtrosAdicionales.basico;
    if (b?.parqueos) basicos.push({ label: `Parqueos ≥ ${b.parqueos}`, kind: 'basico', key: 'parqueos' });
    if (b?.antiguedad) basicos.push({ label: `Antigüedad ≤ ${b.antiguedad} años`, kind: 'basico', key: 'antiguedad' });
    if (b?.implementacion) basicos.push({ label: `Impl.: ${b.implementacion}`, kind: 'basico', key: 'implementacion' });

    // Avanzado - checkboxes y números del estado interno
    Object.entries(this.filtrosAdicionales.avanzado).forEach(([categoria, filtros]) => {
      Object.entries(filtros).forEach(([caracId, value]) => {
        const id = parseInt(caracId);
        const carac = this.caracteristicas.find(c => c.id === id);
        
        if (!carac) return;
        
        // Checkbox activo (acepta true o cualquier valor truthy)
        if (carac.tipo_input === 'checkbox' && value) {
          avanzados.push({
            label: carac.nombre,
            kind: 'avz_check',
            key: `${categoria}_${id}`,
            categoria
          });
        }
        
        // Número con valor
        if (carac.tipo_input === 'number' && typeof value === 'number' && value > 0) {
          avanzados.push({
            label: `${carac.nombre} ≥ ${value}${carac.unidad ? ' ' + carac.unidad : ''}`,
            kind: 'avz_num',
            key: `${categoria}_${id}`,
            categoria
          });
        }
      });
    });

    // Avanzado - old structure (backwards compatibility)
    const checked = Array.from(document.querySelectorAll('input[name="caracteristicas_avanzado"]:checked')).map(cb => parseInt(cb.value));
    const nombresChecked = checked.map(id => ({ id, nombre: this.caracteristicas.find(c => c.id === id)?.nombre })).filter(x => x.nombre);
    nombresChecked.forEach(x => avanzados.push({ label: x.nombre, kind: 'avz_check', key: String(x.id) }));

    // Helper para pintar un grupo
    const renderGrupo = (titulo, items) => {
      if (!items || items.length === 0) return '';
      const tags = items.map(c => `
        <span class=\"filtro-tag\" data-kind=\"${c.kind}\" data-key=\"${c.key}\"${c.categoria ? ` data-categoria=\"${c.categoria}\"` : ''}>
          ${c.label}
          <span class=\"remove-tag\" aria-label=\"Quitar\">×</span>
        </span>
      `).join('');
      return `
        <div class=\"filtros-group\">
          <div class=\"filtros-group-title\">${titulo}</div>
          <div class=\"filtros-tags-compact\">${tags}</div>
        </div>
      `;
    };

    // Pintar grupos en orden
    const html = [
      renderGrupo('Genéricos', genericos),
      renderGrupo('Básico', basicos),
      renderGrupo('Avanzados', avanzados)
    ].filter(Boolean).join('');

    bar.innerHTML = html || '<span class="no-filtros">Todos los inmuebles</span>';

    // 📱 También renderizar en el drawer móvil
    const mobileBar = document.getElementById('filtrosTagsMobile');
    if (mobileBar) {
      // Renderizar solo los tags sin títulos de grupo para móvil (más compacto)
      const allTags = [...genericos, ...basicos, ...avanzados];
      const mobileTags = allTags.map(c => `
        <span class="filtro-tag" data-kind="${c.kind}" data-key="${c.key}"${c.categoria ? ` data-categoria="${c.categoria}"` : ''}>
          ${c.label}
          <span class="remove-tag" aria-label="Quitar">×</span>
        </span>
      `).join('');

      mobileBar.innerHTML = mobileTags || '<span style="color: #6c757d; font-size: 0.75rem;">No hay filtros aplicados</span>';
    }
  }

  mostrarResultados() {
    const imagenRef = document.getElementById('imagenReferencial');
    const mainContainer = document.getElementById('mainContainer');

    // Ocultar imagen referencial
    if (imagenRef) imagenRef.style.display = 'none';

    // Mostrar resultados
    if (mainContainer) mainContainer.style.display = 'flex';
    this.mostrandoResultados = true;

    // Verificar qué acordeón está abierto para mostrar resultados o placeholders
    this.verificarMostrarResultadosPorAcordeon();
  }

  // Mostrar layout 3 columnas (Filtros | Resultados | Mapa)
  mostrarLayoutTresColumnas() {
    const imagenRef = document.getElementById('imagenReferencial');
    const mainContainer = document.getElementById('mainContainer');
    imagenRef.style.display = 'none';
    mainContainer.style.display = 'grid';
    this.mostrandoResultados = true;

    // Cargar resumen de genéricos y filtros en acordeón
    this.renderResumenGenericos();

    const contBasico = document.getElementById('contenedorBasico');
    const contAvanzado = document.getElementById('contenedorAvanzado');

    if (contBasico) contBasico.innerHTML = this.generarHTMLFiltroBasico();
    if (contAvanzado) contAvanzado.innerHTML = this.generarHTMLFiltroAvanzado();
    this.attachBasicoInlineListeners();

    // Adjuntar listeners de acordeón avanzado DESPUÉS de que el DOM esté listo
    setTimeout(() => {
      this.attachAvanzadoInlineListeners();
    }, 100);

    this.setupAccordion();
    this.renderChipsActivos();

    // Resultados + mapa
    this.renderResultados();
    this.renderMapa();

    // Rellenar versión móvil de filtros
    this.renderResumenGenericosMobile();
    const contBasMob = document.getElementById('contenedorBasicoMobile');
    const contAvzMob = document.getElementById('contenedorAvanzadoMobile');
    if (contBasMob) contBasMob.innerHTML = this.generarHTMLFiltroBasico();
    if (contAvzMob) contAvzMob.innerHTML = this.generarHTMLFiltroAvanzado();
    this.attachBasicoInlineListeners();

    // Adjuntar listeners con delay
    setTimeout(() => {
      this.attachAvanzadoInlineListeners();
    }, 100);
  }

  // Resumen de filtros simplificados en columna izquierda - CON TOGGLE ELEGANTE
  renderResumenGenericos(modoEdicion = false) {
    const box = document.getElementById('resumenGenericos');
    if (!box) return;
    const fs = this.filtrosSimplificados || {};

    if (!modoEdicion) {
      // MODO RESUMEN: Mostrar como texto elegante
      const distritos = Array.isArray(fs.distritos_ids) && fs.distritos_ids.length > 0
        ? fs.distritos_ids.map(id => this.distritos.find(d => d.id === id)?.nombre).filter(Boolean).join(', ')
        : '—';

      const tipoInmueble = fs.tipo_inmueble_id
        ? (this.tiposInmuebles.find(t => t.id === fs.tipo_inmueble_id)?.nombre || '—')
        : '—';

      const metragem = fs.area ? `${fs.area} m²` : '—';
      const condicion = fs.transaccion ? (fs.transaccion === 'venta' ? 'Venta' : 'Alquiler') : '—';

      let presupuesto = '—';
      if (fs.transaccion === 'venta' && fs.presupuesto_compra) {
        presupuesto = `${Number(fs.presupuesto_compra).toLocaleString()} USD`;
      } else if (fs.transaccion === 'alquiler' && fs.presupuesto_alquiler) {
        presupuesto = `${Number(fs.presupuesto_alquiler).toLocaleString()} USD/mes`;
      }

      box.innerHTML = `
        <div class="item"><span>Distrito(s)</span><strong>${distritos}</strong></div>
        <div class="item"><span>Tipo Inmueble</span><strong>${tipoInmueble}</strong></div>
        <div class="item"><span>Área</span><strong>${metragem}</strong></div>
        <div class="item"><span>Transacción</span><strong>${condicion}</strong></div>
        <div class="item"><span>Presupuesto</span><strong>${presupuesto}</strong></div>
        <div style="margin-top: 16px;">
          <button id="btnEditarGenericos" class="btn btn-sm btn-outline" style="width: 100%;">
            <i class="fa-solid fa-pencil"></i> Editar
          </button>
        </div>
      `;

      // Listener para el botón editar
      document.getElementById('btnEditarGenericos')?.addEventListener('click', () => {
        this.renderResumenGenericos(true); // Cambiar a modo edición
        this.setupAccordion(); // Re-adjuntar listeners del acordeón

        // Verificar si algún acordeón básico/avanzado está abierto y mostrar resultados
        setTimeout(() => {
          this.verificarMostrarResultadosPorAcordeon();
        }, 50);
      });

    } else {
      // MODO EDICIÓN: Mostrar formulario con multi-select de checkboxes
      const distritosSeleccionados = Array.isArray(fs.distritos_ids) ? fs.distritos_ids : [];
      const distritosNombres = distritosSeleccionados
        .map(id => this.distritos.find(d => d.id === id)?.nombre)
        .filter(Boolean);

      // Mostrar máximo 3 tags, el resto como "+N"
      const visibleTags = distritosNombres.slice(0, 3);
      const remaining = distritosNombres.length - 3;
      let tagsHTML = visibleTags.map(n => `<span class="multi-select__tag">${n}</span>`).join('');
      if (remaining > 0) {
        tagsHTML += `<span class="multi-select__tag">+${remaining}</span>`;
      }

      const tiposOptions = this.tiposInmuebles.map(t => {
        const selected = fs.tipo_inmueble_id === t.id ? 'selected' : '';
        return `<option value="${t.id}" ${selected}>${t.nombre}</option>`;
      }).join('');

      box.innerHTML = `
        <div class="form-group" style="margin-bottom: 8px;">
          <label style="font-size: 11px; color: #666; margin-bottom: 3px; display: block; font-weight: 500;">Distrito(s)</label>
          <div id="gen_distritos_multi" class="multi-select">
            <button type="button" class="multi-select__button" id="gen_distritos_toggle" aria-expanded="false" style="padding: 8px 10px;">
              <span class="multi-select__placeholder" id="gen_distritos_placeholder" style="${distritosSeleccionados.length > 0 ? 'display:none;' : ''}">Selecciona distritos...</span>
              <span class="multi-select__tags" id="gen_distritos_tags">
                ${tagsHTML}
              </span>
              <span class="multi-select__arrow">▾</span>
            </button>
            <div class="multi-select__panel" id="gen_distritos_panel" hidden>
              <div class="multi-select__search">
                <input type="text" id="gen_distritos_search" placeholder="Buscar distrito..." class="multi-select__search-input">
              </div>
              <div class="multi-select__options" id="gen_distritos_options">
                ${this.distritos.map(d => {
                  const checked = distritosSeleccionados.includes(d.id) ? 'checked' : '';
                  return `
                    <div class="multi-option">
                      <input type="checkbox" id="distrito_${d.id}" value="${d.id}" ${checked}>
                      <label for="distrito_${d.id}">${d.nombre}</label>
                    </div>
                  `;
                }).join('')}
              </div>
              <div class="multi-select__actions">
                <button type="button" id="gen_distritos_select_all" class="multi-select__action">Seleccionar todos</button>
                <button type="button" id="gen_distritos_clear" class="multi-select__action alt">Limpiar</button>
              </div>
            </div>
          </div>
          <small style="font-size: 10px; color: #999;">Busca y selecciona múltiples distritos</small>
        </div>

        <div class="form-group" style="margin-bottom: 8px;">
          <label for="gen_tipo" style="font-size: 11px; color: #666; margin-bottom: 3px; display: block; font-weight: 500;">Tipo Inmueble</label>
          <select id="gen_tipo" class="form-control" style="padding: 8px 10px; font-size: 13px;">
            <option value="">Seleccionar...</option>
            ${tiposOptions}
          </select>
        </div>

        <div class="form-group" style="margin-bottom: 8px;">
          <label for="gen_area" style="font-size: 11px; color: #666; margin-bottom: 3px; display: block; font-weight: 500;">Área (m²)</label>
          <input type="number" id="gen_area" class="form-control" style="padding: 8px 10px; font-size: 13px;" placeholder="Ej: 100" value="${fs.area || ''}">
        </div>

        <div class="form-group" style="margin-bottom: 8px;">
          <label style="font-size: 11px; color: #666; margin-bottom: 3px; display: block; font-weight: 500;">Transacción</label>
          <div style="display: flex; gap: 6px;">
            <label style="display: flex; align-items: center; cursor: pointer; flex: 1; padding: 6px 8px; border: 1px solid #ddd; border-radius: 6px; font-size: 12px;">
              <input type="radio" name="gen_transaccion" value="venta" ${fs.transaccion === 'venta' ? 'checked' : ''} style="margin-right: 5px;">
              <span>Venta</span>
            </label>
            <label style="display: flex; align-items: center; cursor: pointer; flex: 1; padding: 6px 8px; border: 1px solid #ddd; border-radius: 6px; font-size: 12px;">
              <input type="radio" name="gen_transaccion" value="alquiler" ${fs.transaccion === 'alquiler' ? 'checked' : ''} style="margin-right: 5px;">
              <span>Alquiler</span>
            </label>
          </div>
        </div>

        <div class="form-group" style="margin-bottom: 8px;" id="gen_presupuesto_group">
          <label for="gen_presupuesto" style="font-size: 11px; color: #666; margin-bottom: 3px; display: block; font-weight: 500;">
            Presupuesto ${fs.transaccion === 'venta' ? '(USD)' : '(USD/mes)'}
          </label>
          <input
            type="number"
            id="gen_presupuesto"
            class="form-control"
            style="padding: 8px 10px; font-size: 13px;"
            placeholder="${fs.transaccion === 'venta' ? 'Ej: 200000' : 'Ej: 1500'}"
            value="${fs.transaccion === 'venta' ? (fs.presupuesto_compra || '') : (fs.presupuesto_alquiler || '')}"
          >
        </div>

        <div style="margin-top: 12px;">
          <button id="btnVolverResumen" class="btn btn-outline btn-sm" style="width: 100%; padding: 8px;">
            <i class="fa-solid fa-arrow-left"></i> Volver al Resumen
          </button>
        </div>
      `;

      // Adjuntar listeners después de renderizar
      this.attachGenericosListeners();
    }
  }

  // Listeners para campos genéricos editables - CON MULTI-SELECT DE CHECKBOXES
  attachGenericosListeners() {
    // Función para aplicar cambios automáticamente
    const aplicarCambios = () => {
      // Obtener distritos seleccionados desde checkboxes
      const distritosChecked = Array.from(
        document.querySelectorAll('#gen_distritos_options input[type="checkbox"]:checked')
      ).map(cb => parseInt(cb.value));

      const tipoSelect = document.getElementById('gen_tipo');
      const areaInput = document.getElementById('gen_area');
      const transaccionRadio = document.querySelector('input[name="gen_transaccion"]:checked');
      const presupuestoInput = document.getElementById('gen_presupuesto');

      if (!tipoSelect) return;

      const tipoId = tipoSelect.value ? parseInt(tipoSelect.value) : null;
      const area = areaInput?.value ? parseFloat(areaInput.value) : null;
      const transaccion = transaccionRadio?.value || null;
      const presupuesto = presupuestoInput?.value ? parseFloat(presupuestoInput.value) : null;

      this.filtrosSimplificados = {
        ...this.filtrosSimplificados,
        distritos_ids: distritosChecked.length > 0 ? distritosChecked : [],
        tipo_inmueble_id: tipoId,
        area: area,
        transaccion: transaccion
      };

      if (transaccion === 'venta') {
        this.filtrosSimplificados.presupuesto_compra = presupuesto;
        delete this.filtrosSimplificados.presupuesto_alquiler;
      } else if (transaccion === 'alquiler') {
        this.filtrosSimplificados.presupuesto_alquiler = presupuesto;
        delete this.filtrosSimplificados.presupuesto_compra;
      }

      localStorage.setItem('filtros_simplificados', JSON.stringify(this.filtrosSimplificados));
      this.aplicarFiltrosCompletos();
      this.renderChipsActivos();

      // Actualizar tags visuales del multi-select
      this.actualizarTagsDistritos();
    };

    // Setup multi-select de distritos
    this.setupMultiSelectDistritos(aplicarCambios);

    // Listeners para otros campos
    document.getElementById('gen_tipo')?.addEventListener('change', aplicarCambios);
    document.getElementById('gen_area')?.addEventListener('input', aplicarCambios);
    document.getElementById('gen_presupuesto')?.addEventListener('input', aplicarCambios);

    // Listener para cambio de transacción
    document.querySelectorAll('input[name="gen_transaccion"]').forEach(radio => {
      radio.addEventListener('change', (e) => {
        const transaccion = e.target.value;
        const presupuestoGroup = document.getElementById('gen_presupuesto_group');
        const presupuestoInput = document.getElementById('gen_presupuesto');
        const label = presupuestoGroup?.querySelector('label');

        if (label && presupuestoInput) {
          label.innerHTML = `Presupuesto ${transaccion === 'venta' ? '(USD)' : '(USD/mes)'}`;
          presupuestoInput.placeholder = transaccion === 'venta' ? 'Ej: 200000' : 'Ej: 1500';

          const fs = this.filtrosSimplificados || {};
          presupuestoInput.value = transaccion === 'venta' ? (fs.presupuesto_compra || '') : (fs.presupuesto_alquiler || '');
        }

        aplicarCambios();
      });
    });

    // Botón volver al resumen
    document.getElementById('btnVolverResumen')?.addEventListener('click', () => {
      this.renderResumenGenericos(false);
      this.setupAccordion(); // Re-adjuntar listeners del acordeón

      // Verificar si algún acordeón básico/avanzado está abierto y mostrar resultados
      setTimeout(() => {
        this.verificarMostrarResultadosPorAcordeon();
      }, 50);
    });
  }

  // Configurar multi-select de distritos con checkboxes
  setupMultiSelectDistritos(aplicarCambios) {
    const toggle = document.getElementById('gen_distritos_toggle');
    const panel = document.getElementById('gen_distritos_panel');
    const search = document.getElementById('gen_distritos_search');
    const selectAll = document.getElementById('gen_distritos_select_all');
    const clear = document.getElementById('gen_distritos_clear');
    const container = document.getElementById('gen_distritos_multi');

    if (!toggle || !panel) {
      console.warn('⚠️ Multi-select distritos: elementos no encontrados');
      return;
    }

    // Toggle panel
    toggle.addEventListener('click', (e) => {
      e.stopPropagation();
      const isHidden = panel.hasAttribute('hidden');
      if (isHidden) {
        panel.removeAttribute('hidden');
        toggle.setAttribute('aria-expanded', 'true');
        container.classList.add('open');
      } else {
        panel.setAttribute('hidden', '');
        toggle.setAttribute('aria-expanded', 'false');
        container.classList.remove('open');
      }
    });

    // Search filter - buscar solo dentro del panel específico
    search?.addEventListener('input', (e) => {
      const searchTerm = e.target.value.toLowerCase();
      const options = panel.querySelectorAll('.multi-option');
      options.forEach(opt => {
        const label = opt.querySelector('label').textContent.toLowerCase();
        opt.style.display = label.includes(searchTerm) ? 'flex' : 'none';
      });
    });

    // Checkbox changes
    const checkboxes = document.querySelectorAll('#gen_distritos_options input[type="checkbox"]');
    checkboxes.forEach(cb => {
      cb.addEventListener('change', (e) => {
        aplicarCambios();
      });
    });

    // Select all
    selectAll?.addEventListener('click', () => {
      const visibleCheckboxes = Array.from(checkboxes).filter(cb =>
        cb.closest('.multi-option').style.display !== 'none'
      );
      visibleCheckboxes.forEach(cb => cb.checked = true);
      aplicarCambios();
    });

    // Clear
    clear?.addEventListener('click', () => {
      checkboxes.forEach(cb => cb.checked = false);
      aplicarCambios();
    });

    // Cerrar al hacer click fuera
    document.addEventListener('click', (e) => {
      if (!container.contains(e.target)) {
        panel.setAttribute('hidden', '');
        toggle.setAttribute('aria-expanded', 'false');
        container.classList.remove('open');
      }
    });
  }

  // Actualizar tags visuales del multi-select
  actualizarTagsDistritos() {
    const tagsContainer = document.getElementById('gen_distritos_tags');
    const placeholder = document.getElementById('gen_distritos_placeholder');

    if (!tagsContainer) return;

    const distritosSeleccionados = this.filtrosSimplificados.distritos_ids || [];
    const nombres = distritosSeleccionados
      .map(id => this.distritos.find(d => d.id === id)?.nombre)
      .filter(Boolean);

    if (nombres.length > 0) {
      // Mostrar máximo 3 tags, el resto como "+N"
      const visibleTags = nombres.slice(0, 3);
      const remaining = nombres.length - 3;

      let tagsHTML = visibleTags.map(n => `<span class="multi-select__tag">${n}</span>`).join('');
      if (remaining > 0) {
        tagsHTML += `<span class="multi-select__tag">+${remaining}</span>`;
      }

      tagsContainer.innerHTML = tagsHTML;
      if (placeholder) placeholder.style.display = 'none';
    } else {
      tagsContainer.innerHTML = '';
      if (placeholder) placeholder.style.display = 'block';
    }
  }

  // Configurar multi-select de distritos con checkboxes (MÓVIL)
  setupMultiSelectDistritosMobile(aplicarCambios) {
    const toggle = document.getElementById('gen_distritos_toggle_mob');
    const panel = document.getElementById('gen_distritos_panel_mob');
    const search = document.getElementById('gen_distritos_search_mob');
    const selectAll = document.getElementById('gen_distritos_select_all_mob');
    const clear = document.getElementById('gen_distritos_clear_mob');
    const container = document.getElementById('gen_distritos_multi_mob');

    if (!toggle || !panel) {
      console.warn('⚠️ Multi-select distritos mobile: elementos no encontrados');
      return;
    }

    // Toggle panel
    toggle.addEventListener('click', (e) => {
      e.stopPropagation();
      const isHidden = panel.hasAttribute('hidden');
      if (isHidden) {
        panel.removeAttribute('hidden');
        toggle.setAttribute('aria-expanded', 'true');
        container.classList.add('open');
      } else {
        panel.setAttribute('hidden', '');
        toggle.setAttribute('aria-expanded', 'false');
        container.classList.remove('open');
      }
    });

    // Search filter - buscar solo dentro del panel específico
    search?.addEventListener('input', (e) => {
      const searchTerm = e.target.value.toLowerCase();
      const options = panel.querySelectorAll('.multi-option');
      options.forEach(opt => {
        const label = opt.querySelector('label').textContent.toLowerCase();
        opt.style.display = label.includes(searchTerm) ? 'flex' : 'none';
      });
    });

    // Checkbox changes
    const checkboxes = document.querySelectorAll('#gen_distritos_options_mob input[type="checkbox"]');
    checkboxes.forEach(cb => {
      cb.addEventListener('change', (e) => {
        aplicarCambios();
      });
    });

    // Select all
    selectAll?.addEventListener('click', () => {
      const visibleCheckboxes = Array.from(checkboxes).filter(cb =>
        cb.closest('.multi-option').style.display !== 'none'
      );
      visibleCheckboxes.forEach(cb => cb.checked = true);
      aplicarCambios();
    });

    // Clear
    clear?.addEventListener('click', () => {
      checkboxes.forEach(cb => cb.checked = false);
      aplicarCambios();
    });

    // Cerrar al hacer click fuera
    document.addEventListener('click', (e) => {
      if (!container.contains(e.target)) {
        panel.setAttribute('hidden', '');
        toggle.setAttribute('aria-expanded', 'false');
        container.classList.remove('open');
      }
    });
  }

  // Actualizar tags visuales del multi-select (MÓVIL)
  actualizarTagsDistritosMobile() {
    const tagsContainer = document.getElementById('gen_distritos_tags_mob');
    const placeholder = document.getElementById('gen_distritos_placeholder_mob');

    if (!tagsContainer) return;

    const distritosSeleccionados = this.filtrosSimplificados.distritos_ids || [];
    const nombres = distritosSeleccionados
      .map(id => this.distritos.find(d => d.id === id)?.nombre)
      .filter(Boolean);

    if (nombres.length > 0) {
      // Mostrar máximo 3 tags, el resto como "+N"
      const visibleTags = nombres.slice(0, 3);
      const remaining = nombres.length - 3;

      let tagsHTML = visibleTags.map(n => `<span class="multi-select__tag">${n}</span>`).join('');
      if (remaining > 0) {
        tagsHTML += `<span class="multi-select__tag">+${remaining}</span>`;
      }

      tagsContainer.innerHTML = tagsHTML;
      if (placeholder) placeholder.style.display = 'none';
    } else {
      tagsContainer.innerHTML = '';
      if (placeholder) placeholder.style.display = 'block';
    }
  }

  // Acordeón simple sin librerías
  setupAccordion() {
    // Lógica del acordeón: solo un panel abierto a la vez
    document.querySelectorAll('.accordion-header').forEach(header => {
      // Remover listener anterior si existe
      const oldListener = header._accordionListener;
      if (oldListener) {
        header.removeEventListener('click', oldListener);
      }

      // Crear nuevo listener
      const newListener = (e) => {
        const acordeonId = e.currentTarget.getAttribute('data-accordion');
        const content = document.querySelector(`.accordion-content[data-accordion="${acordeonId}"]`);

        if (!content) return;

        const isOpen = content.classList.contains('open');
        const wasExpanded = e.currentTarget.getAttribute('aria-expanded') === 'true';

        // Cerrar todos los paneles del mismo contenedor (desktop o mobile)
        const container = e.currentTarget.closest('.filters-inner, .drawer-body');
        if (container) {
          container.querySelectorAll('.accordion-header').forEach(h => {
            h.setAttribute('aria-expanded', 'false');
          });
          container.querySelectorAll('.accordion-content').forEach(c => {
            c.classList.remove('open');
          });
        }

        // Alternar el panel actual
        if (!wasExpanded) {
          e.currentTarget.setAttribute('aria-expanded', 'true');
          content.classList.add('open');
        }

        // Verificar si debe mostrar resultados
        this.verificarMostrarResultadosPorAcordeon();

        // Actualizar estado de botones
        this.actualizarEstadoBotones();
      };

      // Guardar referencia y agregar listener
      header._accordionListener = newListener;
      header.addEventListener('click', newListener);
    });

    // NO abrir ningún acordeón por defecto
    // El usuario debe seleccionar qué filtros quiere ver

    // Deshabilitar botones inicialmente (solo genéricos abiertos)
    this.actualizarEstadoBotones();

    // Botones aplicar/limpiar de la columna
    const btnAplicarCol = document.getElementById('btnAplicarFiltrosCol');
    const btnLimpiarCol = document.getElementById('btnLimpiarFiltrosCol');

    btnAplicarCol?.addEventListener('click', () => {
      this.aplicarFiltrosCompletos();
    });

    btnLimpiarCol?.addEventListener('click', () => {
      this.limpiarFiltrosAdicionales();
      // Re-render contenido básico y avanzado vacíos
      document.getElementById('contenedorBasico').innerHTML = this.generarHTMLFiltroBasico();
      document.getElementById('contenedorAvanzado').innerHTML = this.generarHTMLFiltroAvanzado();
      this.attachBasicoInlineListeners();
      this.attachAvanzadoInlineListeners();
      this.renderChipsActivos();
    });
  }

  // Actualizar estado de botones según acordeones abiertos
  actualizarEstadoBotones() {
    const basicoAbierto = document.querySelector('.accordion-header[data-accordion="basico"][aria-expanded="true"]') !== null;
    const avanzadoAbierto = document.querySelector('.accordion-header[data-accordion="avanzado"][aria-expanded="true"]') !== null;

    const mostrarBotones = basicoAbierto || avanzadoAbierto;

    // Botones de la columna desktop
    const btnAplicarCol = document.getElementById('btnAplicarFiltrosCol');
    const btnLimpiarCol = document.getElementById('btnLimpiarFiltrosCol');

    // OCULTAR/MOSTRAR botones (no solo deshabilitar)
    [btnAplicarCol, btnLimpiarCol].forEach(btn => {
      if (btn) {
        btn.style.display = mostrarBotones ? 'inline-flex' : 'none';
      }
    });
  }

  verificarMostrarResultadosPorAcordeon() {
    // Verificar si Filtro Básico está abierto para mostrar cards
    const basicoAbierto = document.querySelector('.accordion-header[data-accordion="basico"][aria-expanded="true"]') !== null;

    const propertiesList = document.getElementById('propertiesList');
    const mapCanvas = document.getElementById('map');

    // Siempre mostrar el mapa (sin placeholders)
    if (mapCanvas) {
      mapCanvas.style.display = 'block';
      // Renderizar mapa siempre con las propiedades filtradas
      this.renderMapa();

      // Forzar que el mapa se redibuje correctamente
      if (this.map) {
        setTimeout(() => {
          this.map.invalidateSize();
        }, 100);
      }
    }

    // Mostrar cards siempre que haya resultados
    if (propertiesList) propertiesList.style.display = 'flex';
    this.renderResultados();
  }

  setupHamburgerMenu() {
    const hamburger = document.getElementById('hamburger');
    const headerActions = document.getElementById('headerActions');

    if (!hamburger || !headerActions) return;

    hamburger.addEventListener('click', () => {
      hamburger.classList.toggle('active');
      headerActions.classList.toggle('active');
    });

    // Cerrar al hacer clic fuera
    document.addEventListener('click', (e) => {
      if (!hamburger.contains(e.target) && !headerActions.contains(e.target)) {
        hamburger.classList.remove('active');
        headerActions.classList.remove('active');
      }
    });
  }

  setupPresupuesto() {
    // Esta función maneja la lógica de presupuesto dinámico
    // Por ahora solo placeholder, se puede expandir después
    const radios = document.querySelectorAll('input[name="transaccion"], input[name="transaccion_basico"]');
    radios.forEach(radio => {
      radio.addEventListener('change', () => {
        // Lógica para cambiar labels de presupuesto según transacción
        // (ya implementada en otros listeners)
      });
    });
  }

  setupEventListeners() {
    // Toggle Filtro Básico
    document.getElementById('toggleFiltroBasico')?.addEventListener('click', () => {
      this.mostrarFiltroBasicoInline();
    });

    // Toggle Filtro Avanzado
    document.getElementById('toggleFiltroAvanzado')?.addEventListener('click', () => {
      this.mostrarFiltroAvanzadoInline();
    });

    // Botón Aplicar Filtros Inline
    document.getElementById('btnAplicarFiltrosInline')?.addEventListener('click', () => {
      this.aplicarFiltrosCompletos();
    });

    // Botón Limpiar Filtros Inline
    document.getElementById('btnLimpiarFiltrosInline')?.addEventListener('click', () => {
      this.limpiarFiltrosAdicionales();
    });

    // Modal Login
    const modal = document.getElementById('loginModal');
    const closeBtn = modal?.querySelector('.modal-close');
    closeBtn?.addEventListener('click', () => {
      modal.style.display = 'none';
    });

    window.addEventListener('click', (e) => {
      if (e.target === modal) {
        modal.style.display = 'none';
      }
    });

    // Cargar filtro básico por defecto
    this.mostrarFiltroBasicoInline();

    // Botón Limpiar (solo básicos y avanzados, NO genéricos)
    document.getElementById('btnLimpiarTodosFiltros')?.addEventListener('click', () => {
      // ✅ Solo limpiar filtros BÁSICOS y AVANZADOS
      // Los filtros GENÉRICOS se mantienen intactos
      this.limpiarFiltrosAdicionales();
    });

    // 📱 Botón Limpiar Todo del Drawer Móvil
    document.getElementById('btnLimpiarTodosFiltrosMobile')?.addEventListener('click', () => {
      this.limpiarFiltrosAdicionales();
    });

    // Delegación: quitar chips
    const chipsBar = document.getElementById('filtrosAplicados');
    chipsBar?.addEventListener('click', (e) => {
      const btn = e.target.closest('.remove-tag');
      if (!btn) return;
      const chip = btn.closest('.filtro-tag');
      const kind = chip?.dataset.kind;
      const key = chip?.dataset.key;
      if (!kind) return;

      if (kind === 'generico') {
        // Filtros genéricos (del popup/modal)
        if (key === 'tipo_inmueble_id') {
          delete this.filtrosSimplificados.tipo_inmueble_id;
        } else if (key === 'distritos_ids') {
          delete this.filtrosSimplificados.distritos_ids;
        } else if (key === 'transaccion') {
          delete this.filtrosSimplificados.transaccion;
        } else if (key === 'area') {
          delete this.filtrosSimplificados.area;
        } else if (key === 'presupuesto_compra') {
          delete this.filtrosSimplificados.presupuesto_compra;
        } else if (key === 'presupuesto_alquiler') {
          delete this.filtrosSimplificados.presupuesto_alquiler;
        }
        // Guardar en localStorage
        localStorage.setItem('filtros_simplificados', JSON.stringify(this.filtrosSimplificados));
        // Aplicar filtros
        this.aplicarFiltros();
        this.renderChipsActivos();
        return;
      } else if (kind === 'basico') {
        // Campos básicos
        if (key === 'transaccion') {
          document.querySelectorAll('input[name="transaccion_basico"]').forEach(r => r.checked = false);
          delete this.filtrosAdicionales.basico.transaccion;
        } else if (key === 'implementacion') {
          const sel = document.getElementById('implementacion_basico');
          if (sel) sel.value = '';
          delete this.filtrosAdicionales.basico.implementacion;
        } else {
          const idMap = {
            area: 'area_basico',
            parqueos: 'parqueos_basico',
            presupuesto_compra: 'presupuesto_compra_basico',
            presupuesto_alquiler: 'presupuesto_alquiler_basico',
            antiguedad: 'antiguedad_basico'
          };
          const inputId = idMap[key];
          const el = document.getElementById(inputId);
          if (el) el.value = '';
          delete this.filtrosAdicionales.basico[key];
        }
      } else if (kind === 'avz_check' || kind === 'avz_num') {
        // New category-based structure: key format is "CATEGORIA_ID"
        if (key.includes('_')) {
          const parts = key.split('_');
          const caracId = parts.pop(); // Last part is the ID
          const categoria = parts.join('_'); // Rest is the category

          // Remove from state
          if (this.filtrosAdicionales.avanzado[categoria]) {
            delete this.filtrosAdicionales.avanzado[categoria][caracId];

            // Update UI
            const pill = document.querySelector(`.pill-icon[data-cat="${categoria}"][data-carac-id="${caracId}"]`);
            if (pill) {
              pill.classList.remove('active');
              pill.setAttribute('aria-pressed', 'false');
            }

            const input = document.querySelector(`.number-filter-compact input[data-cat="${categoria}"][data-carac-id="${caracId}"]`);
            if (input) input.value = '';

            // Update badge
            this.actualizarBadgeCategoria(categoria);
          }
        } else {
          // Old structure (backwards compatibility)
          const cb = document.getElementById(`carac_${key}`);
          if (cb) cb.checked = false;
          const inp = document.querySelector(`input[data-carac-id="${key}"]`);
          if (inp) inp.value = '';
        }
      }

      this.renderChipsActivos();
      this.debouncedPreview?.();
    });

    // 📱 Delegación para quitar chips desde el drawer móvil
    const mobileChipsBar = document.getElementById('filtrosTagsMobile');
    mobileChipsBar?.addEventListener('click', (e) => {
      const btn = e.target.closest('.remove-tag');
      if (!btn) return;
      const chip = btn.closest('.filtro-tag');
      const kind = chip?.dataset.kind;
      const key = chip?.dataset.key;
      if (!kind) return;

      // Reutilizar la misma lógica que el desktop
      if (kind === 'generico') {
        if (key === 'tipo_inmueble_id') {
          delete this.filtrosSimplificados.tipo_inmueble_id;
        } else if (key === 'distritos_ids') {
          delete this.filtrosSimplificados.distritos_ids;
        } else if (key === 'transaccion') {
          delete this.filtrosSimplificados.transaccion;
        } else if (key === 'area') {
          delete this.filtrosSimplificados.area;
        } else if (key === 'presupuesto_compra') {
          delete this.filtrosSimplificados.presupuesto_compra;
        } else if (key === 'presupuesto_alquiler') {
          delete this.filtrosSimplificados.presupuesto_alquiler;
        }
        localStorage.setItem('filtros_simplificados', JSON.stringify(this.filtrosSimplificados));
        this.aplicarFiltros();
        this.renderChipsActivos();
        return;
      } else if (kind === 'basico') {
        if (key === 'transaccion') {
          document.querySelectorAll('input[name="transaccion_basico"]').forEach(r => r.checked = false);
          delete this.filtrosAdicionales.basico.transaccion;
        } else if (key === 'implementacion') {
          const sel = document.getElementById('implementacion_basico');
          if (sel) sel.value = '';
          delete this.filtrosAdicionales.basico.implementacion;
        } else {
          const idMap = {
            area: 'area_basico',
            parqueos: 'parqueos_basico',
            presupuesto_compra: 'presupuesto_compra_basico',
            presupuesto_alquiler: 'presupuesto_alquiler_basico',
            antiguedad: 'antiguedad_basico'
          };
          const inputId = idMap[key];
          const el = document.getElementById(inputId);
          if (el) el.value = '';
          delete this.filtrosAdicionales.basico[key];
        }
      } else if (kind === 'avz_check' || kind === 'avz_num') {
        const categoria = chip?.dataset.categoria;
        const caracId = parseInt(key.split('_').pop());
        if (categoria && !isNaN(caracId)) {
          delete this.filtrosAdicionales.avanzado[categoria][caracId];
          const inp = document.querySelector(`input[name="caracteristicas_avanzado"][value="${caracId}"]`);
          if (inp) inp.checked = false;
          const numInp = document.getElementById(`car_num_${caracId}`);
          if (numInp) numInp.value = '';
        }
      }

      this.renderChipsActivos();
      this.debouncedPreview?.();
    });
  }

  mostrarFiltroBasico() {
    const panel = document.getElementById('panelFiltros');
    const titulo = document.getElementById('tituloFiltro');
    const contenido = document.getElementById('contenidoFiltros');

    titulo.textContent = '📋 Filtro Básico';
    contenido.innerHTML = this.generarHTMLFiltroBasico();
    panel.style.display = 'block';

    // Cargar valores previos si existen
    this.cargarValoresFiltroBasico();
  }

  generarHTMLFiltroBasico() {
    // Solo mostrar los 3 campos del Básico
    const filtros = [
      {
        id: 'parqueos',
        nombre: 'Parqueos Requeridos',
        tipo_input: 'number',
        placeholder: 'Ej: 5'
      },
      {
        id: 'antiguedad',
        nombre: 'Antigüedad (No mayor a años)',
        tipo_input: 'number',
        placeholder: 'Ej: 15'
      },
      {
        id: 'implementacion',
        nombre: 'Nivel de Implementación',
        tipo_input: 'select',
        opciones: [
          { value: '', label: 'Todas' },
          { value: 'Amoblado FULL', label: 'Amoblado FULL' },
          { value: 'Implementada', label: 'Implementada' },
          { value: 'Semi Implementada', label: 'Semi Implementada' },
          { value: 'Por Implementar', label: 'Por Implementar' }
        ]
      }
    ];

    // Nota: No copiar filtros genéricos dentro de "básico" para evitar duplicados en los chips

    return `
      <div class="filtro-section">
        ${filtros.map(filtro => this.renderFiltroBasicoItem(filtro)).join('')}
      </div>
    `;
  }

  renderFiltroBasicoItem(filtro) {
    const value = this.filtrosAdicionales.basico[filtro.id] || '';
    const transaccionActual = this.filtrosAdicionales.basico.transaccion || '';

    // Verificar visibilidad condicional
    if (filtro.visible_cuando) {
      const [campo, valorRequerido] = filtro.visible_cuando.split('=');
      if (this.filtrosAdicionales.basico[campo] !== valorRequerido) {
        return ''; // No mostrar este campo
      }
    }

    if (filtro.tipo_input === 'pills') {
      return `
        <div class="form-group">
          <label>${filtro.nombre}</label>
          <div class="pills-row" role="group" aria-label="${filtro.nombre}">
            ${filtro.opciones.map(opt => `
              <button 
                type="button" 
                class="pill pill-transaccion ${value === opt.value ? 'active' : ''}" 
                data-filtro-id="${filtro.id}"
                data-value="${opt.value}" 
                aria-pressed="${value === opt.value ? 'true' : 'false'}"
              >
                <i class="fa-solid ${opt.icon}"></i> ${opt.label}
              </button>
            `).join('')}
          </div>
        </div>
      `;
    }

    if (filtro.tipo_input === 'number') {
      return `
        <div class="form-group" data-filtro-group="${filtro.id}" style="margin-bottom: 10px;">
          <label for="${filtro.id}_basico" style="font-size: 11px; color: #666; margin-bottom: 4px; display: block; font-weight: 500;">${filtro.nombre}</label>
          <input
            type="number"
            id="${filtro.id}_basico"
            class="form-control"
            style="padding: 8px 10px; font-size: 13px;"
            placeholder="${filtro.placeholder || ''}"
            value="${value}"
            data-filtro-id="${filtro.id}"
          >
        </div>
      `;
    }

    if (filtro.tipo_input === 'select') {
      return `
        <div class="form-group" style="margin-bottom: 10px;">
          <label for="${filtro.id}_basico" style="font-size: 11px; color: #666; margin-bottom: 4px; display: block; font-weight: 500;">${filtro.nombre}</label>
          <select
            id="${filtro.id}_basico"
            class="form-control"
            style="padding: 8px 10px; font-size: 13px;"
            data-filtro-id="${filtro.id}"
          >
            ${filtro.opciones.map(opt => `
              <option value="${opt.value}" ${value === opt.value ? 'selected' : ''}>
                ${opt.label}
              </option>
            `).join('')}
          </select>
        </div>
      `;
    }

    return '';
  }

  cargarValoresFiltroBasico() {
    // Los valores ya están cargados en el HTML, solo necesitamos event listeners
    const radios = document.querySelectorAll('input[name="transaccion_basico"]');
    radios.forEach(radio => {
      radio.addEventListener('change', (e) => {
        this.filtrosAdicionales.basico.transaccion = e.target.value;
      });
    });
  }

  mostrarFiltroAvanzado() {
    const panel = document.getElementById('panelFiltros');
    const titulo = document.getElementById('tituloFiltro');
    const contenido = document.getElementById('contenidoFiltros');

    titulo.textContent = '⚙️ Filtro Avanzado';

    if (!this.filtrosSimplificados?.tipo_inmueble_id) {
      contenido.innerHTML = '<p class="mensaje-info">⚠️ Debes seleccionar un tipo de inmueble primero</p>';
    } else {
      contenido.innerHTML = this.generarHTMLFiltroAvanzado();

      // Adjuntar listeners DESPUÉS de insertar el HTML
      setTimeout(() => {
        this.attachAvanzadoInlineListeners();
      }, 100);
    }

    panel.style.display = 'block';
  }

  generarHTMLFiltroAvanzado() {
    // Validar configuración
    if (!this.configFiltros || !this.configFiltros.filtros_avanzados_por_tipo) {
      return '<p class="mensaje-info">⚠️ Error cargando configuración de filtros avanzados</p>';
    }

    // Si no hay tipo de inmueble, mostrar mensaje
    if (!this.filtrosSimplificados?.tipo_inmueble_id) {
      return `
        <div style="padding: 20px; text-align: center; color: var(--gris-medio);">
          <p><i class="fa-solid fa-info-circle"></i></p>
          <p>Selecciona un tipo de inmueble en la búsqueda básica para ver filtros avanzados</p>
        </div>
      `;
    }

    // Buscar configuración para este tipo de inmueble
    const configTipo = this.configFiltros.filtros_avanzados_por_tipo.find(
      t => t.tipo_inmueble_id === this.filtrosSimplificados.tipo_inmueble_id
    );

    if (!configTipo || !configTipo.categorias || configTipo.categorias.length === 0) {
      return `
        <div style="padding: 20px; text-align: center; color: var(--gris-medio);">
          <p>No hay filtros avanzados disponibles para este tipo de inmueble</p>
        </div>
      `;
    }

    // Mapa de iconos por categoría
    const iconMap = {
      'AREAS_COMUNES_EDIFICIO': 'fa-building',
      'ASCENSORES': 'fa-elevator',
      'IMPLEMENTACION_DETALLE': 'fa-toolbox',
      'SOPORTE_EDIFICIO': 'fa-wrench',
      'CERCANIA_ESTRATEGICA': 'fa-map-marker-alt',
      'VISTA_OFICINA': 'fa-eye',
      'CARACTERISTICAS_CASA': 'fa-home',
      'CARACTERISTICAS_DEPTO': 'fa-building',
      'CARACTERISTICAS_TERRENO': 'fa-map',
      'CARACTERISTICAS_LOCAL': 'fa-store',
      'SERVICIOS': 'fa-wrench',
      'SEGURIDAD': 'fa-shield-halved',
      'TECNOLOGIA_CONECTIVIDAD': 'fa-wifi',
      'SOSTENIBILIDAD': 'fa-leaf',
      'ESPACIOS_PERSONALES': 'fa-door-open',
      'COMPLEMENTARIOS': 'fa-box',
      'OTROS': 'fa-circle-info'
    };

    // Renderizar categorías según configuración
    const htmlResult = configTipo.categorias
      .sort((a, b) => a.orden - b.orden)
      .map((catConfig) => {
        // Obtener características de esta categoría
        const caracteristicasCategoria = catConfig.caracteristicas_ids
          .map(id => this.caracteristicas.find(c => c.id === id))
          .filter(c => c); // Filtrar nulls

        if (caracteristicasCategoria.length === 0) {
          return ''; // No renderizar categorías vacías
        }

        const icon = iconMap[catConfig.codigo] || 'fa-circle-info';
        const countActive = this.contarCriteriosActivosCategoria(catConfig.codigo);
        const badgeHTML = countActive > 0 ? `<span class="badge-counter">${countActive}</span>` : '';

        // Todos los acordeones cerrados por defecto
        const expandedState = 'false';
        const activeClass = '';
        const openClass = '';

        // Renderizar pills de características
        const pillsHTML = caracteristicasCategoria.map(item => this.renderCaracteristicaPill(item, catConfig.codigo)).join('');

        return `
          <div class="accordion-item-avanzado">
            <button class="accordion-header-avanzado ${activeClass}" type="button" data-categoria="${catConfig.codigo}" aria-expanded="${expandedState}">
              <i class="fa-solid ${icon}"></i>
              <span>${catConfig.nombre}</span>
              ${badgeHTML}
              <i class="fa-solid fa-chevron-down accordion-arrow"></i>
            </button>
            <div class="accordion-content-avanzado ${openClass}" data-categoria="${catConfig.codigo}" style="background: #f5f5f5;">
              <div class="pills-row" style="display: flex; flex-wrap: wrap; gap: 8px; padding: 10px;">
                ${pillsHTML}
              </div>
            </div>
          </div>
        `;
      })
      .filter(html => html); // Eliminar strings vacíos

    return htmlResult.join('');
  }

  contarCriteriosActivosCategoria(categoria) {
    if (!this.filtrosAdicionales.avanzado[categoria]) return 0;
    return Object.keys(this.filtrosAdicionales.avanzado[categoria]).length;
  }

  renderCaracteristicaPill(item, codigoCategoria) {
    // Usar el código de categoría pasado como parámetro o el de la característica
    const categoria = codigoCategoria || item.categoria;

    // Mapa de iconos según tipo de característica (sin repeticiones)
    const getIcon = (nombre) => {
      const n = nombre.toLowerCase();

      // Conectividad y tecnología
      if (n.includes('wifi') || n.includes('internet')) return 'fa-wifi';
      if (n.includes('fibra') || n.includes('banda ancha')) return 'fa-network-wired';
      if (n.includes('cable') || n.includes('tv')) return 'fa-tv';
      if (n.includes('telefon')) return 'fa-phone';
      if (n.includes('interfon') || n.includes('intercomunicador')) return 'fa-walkie-talkie';

      // Climatización
      if (n.includes('aire acondicionado') || n.includes('a/c')) return 'fa-snowflake';
      if (n.includes('clima')) return 'fa-temperature-half';
      if (n.includes('calefac')) return 'fa-fire';
      if (n.includes('ventilac')) return 'fa-fan';

      // Movilidad vertical
      if (n.includes('ascensor')) return 'fa-elevator';
      if (n.includes('escalera')) return 'fa-stairs';
      if (n.includes('rampa')) return 'fa-wheelchair';

      // Estacionamiento
      if (n.includes('parqueo') || n.includes('estacionamiento')) return 'fa-square-parking';
      if (n.includes('cochera') || n.includes('garage')) return 'fa-car';
      if (n.includes('moto') || n.includes('bicicleta')) return 'fa-bicycle';

      // Áreas recreativas
      if (n.includes('piscina')) return 'fa-person-swimming';
      if (n.includes('gym') || n.includes('gimnasio')) return 'fa-dumbbell';
      if (n.includes('sauna')) return 'fa-hot-tub-person';
      if (n.includes('spa') || n.includes('jacuzzi')) return 'fa-spa';
      if (n.includes('juegos') || n.includes('niños')) return 'fa-children';
      if (n.includes('cancha') || n.includes('deporte')) return 'fa-basketball';
      if (n.includes('parque') || n.includes('área verde')) return 'fa-tree';
      if (n.includes('jardín')) return 'fa-leaf';
      if (n.includes('bbq') || n.includes('parrilla')) return 'fa-fire-flame-curved';

      // Seguridad
      if (n.includes('seguridad') || n.includes('vigilancia')) return 'fa-shield-halved';
      if (n.includes('cámara') || n.includes('circuito')) return 'fa-video';
      if (n.includes('alarma')) return 'fa-bell';
      if (n.includes('reja') || n.includes('cerco')) return 'fa-fence';
      if (n.includes('garita') || n.includes('caseta')) return 'fa-house-circle-check';

      // Servicios básicos
      if (n.includes('luz') || n.includes('electric')) return 'fa-lightbulb';
      if (n.includes('agua')) return 'fa-droplet';
      if (n.includes('gas')) return 'fa-fire-burner';
      if (n.includes('desagüe') || n.includes('alcantarillado')) return 'fa-faucet-drip';

      // Espacios interiores
      if (n.includes('terraza')) return 'fa-building-flag';
      if (n.includes('balcón')) return 'fa-border-all';
      if (n.includes('cocina')) return 'fa-kitchen-set';
      if (n.includes('baño')) return 'fa-toilet';
      if (n.includes('closet') || n.includes('armario')) return 'fa-box-archive';
      if (n.includes('sala')) return 'fa-couch';
      if (n.includes('comedor')) return 'fa-utensils';
      if (n.includes('lavander')) return 'fa-soap';
      if (n.includes('deposito') || n.includes('almacén')) return 'fa-warehouse';
      if (n.includes('estudio') || n.includes('oficina')) return 'fa-desktop';
      if (n.includes('dormitorio') || n.includes('habitación')) return 'fa-bed';

      // Vistas y acabados
      if (n.includes('vista')) return 'fa-eye';
      if (n.includes('puerta')) return 'fa-door-open';
      if (n.includes('ventana')) return 'fa-window-maximize';
      if (n.includes('piso')) return 'fa-layer-group';
      if (n.includes('techo')) return 'fa-house-chimney';
      if (n.includes('muro') || n.includes('pared')) return 'fa-cubes';
      if (n.includes('pintura')) return 'fa-paint-roller';
      if (n.includes('porcelanato') || n.includes('cerámico')) return 'fa-grip';

      // Servicios adicionales
      if (n.includes('ascensor de servicio')) return 'fa-dolly';
      if (n.includes('sala de reuniones')) return 'fa-users';
      if (n.includes('salón de eventos')) return 'fa-champagne-glasses';
      if (n.includes('co-working') || n.includes('coworking')) return 'fa-laptop';
      if (n.includes('lounge')) return 'fa-mug-saucer';
      if (n.includes('lobby')) return 'fa-door-closed';
      if (n.includes('recepción')) return 'fa-bell-concierge';

      // Por defecto
      return 'fa-circle-check';
    };

    if (item.tipo_input === 'checkbox') {
      const isActive = this.filtrosAdicionales.avanzado[categoria]?.[item.id] === true;
      const icon = getIcon(item.nombre);
      const html = `
        <button
          type="button"
          class="pill-icon ${isActive ? 'active' : ''}"
          data-cat="${categoria}"
          data-carac-id="${item.id}"
          data-tipo="checkbox"
          data-tooltip="${item.nombre}"
          aria-pressed="${isActive ? 'true' : 'false'}"
          title="${item.nombre}"
        >
          <i class="fa-solid ${icon}"></i>
        </button>
      `;
      return html;
    }

    if (item.tipo_input === 'number') {
      const value = this.filtrosAdicionales.avanzado[categoria]?.[item.id] || '';
      const icon = getIcon(item.nombre);
      return `
        <div class="number-filter-compact" data-tooltip="${item.nombre} ${item.unidad ? `(${item.unidad})` : ''}">
          <i class="fa-solid ${icon}"></i>
          <input
            type="number"
            class="form-control-compact"
            value="${value}"
            data-cat="${categoria}"
            data-carac-id="${item.id}"
            placeholder="0"
            title="${item.nombre}"
          >
          ${item.unidad ? `<span class="unit-label">${item.unidad}</span>` : ''}
        </div>
      `;
    }

    return '';
  }

  formatCategoria(categoria) {
    const nombres = {
      'COMPLEMENTARIOS': '📦 Complementarios',
      'GENERALES_EDIFICIO': '🏢 Generales del Edificio',
      'SOPORTE_EDIFICIO': '🛡️ Soporte del Edificio',
      'AREAS_COMUNES': '🏊 Áreas Comunes del Edificio',
      'ASCENSORES': '🛗 Ascensores',
      'DE_LA_OFICINA': '📋 De la Oficina',
      'EQUIPAMIENTO': '⚙️ Equipamiento de Oficina',
      'VISTA_OFICINA': '👁️ Vista de la Oficina',
      'INFO_AREAS': '📐 Información de Áreas',
      'VALORIZACION': '💰 Valorización Edificio',
      'SOPORTE_URBANO': '📍 Soporte Urbano'
    };
    return nombres[categoria] || categoria;
  }

  renderCaracteristicaInput(carac) {
    if (carac.tipo_input === 'checkbox') {
      return `
        <div class="checkbox-item">
          <input type="checkbox" id="carac_${carac.id}" value="${carac.id}" name="caracteristicas_avanzado">
          <label for="carac_${carac.id}">${carac.nombre}</label>
        </div>
      `;
    } else if (carac.tipo_input === 'number') {
      return `
        <div class="form-group-inline">
          <label for="carac_${carac.id}">${carac.nombre}</label>
          <input type="number" id="carac_${carac.id}" class="form-control-sm" placeholder="0" data-carac-id="${carac.id}">
          ${carac.unidad ? `<small>${carac.unidad}</small>` : ''}
        </div>
      `;
    }
    return '';
  }

  aplicarFiltrosCompletos() {
    // Aplicar filtros en orden
    this.aplicarFiltrosIniciales();
    this.aplicarFiltrosBasicos();
    this.aplicarFiltrosAvanzados();

    // Guardar estado en localStorage
    this.guardarFiltrosAdicionales();

    // Solo re-renderizar si ya estamos mostrando resultados
    // NO llamar mostrarResultados() porque resetea la UI
    if (this.mostrandoResultados) {
      this.verificarMostrarResultadosPorAcordeon();
    }
  }

  aplicarFiltrosBasicos() {
    const filtros = this.filtrosAdicionales.basico;

    // Si no hay filtros básicos, salir
    if (Object.keys(filtros).length === 0) {
      return;
    }

    this.propiedadesFiltradas = this.propiedadesFiltradas.filter(prop => {
      // 🔗 Las combinaciones ya vienen filtradas del backend
      if (prop.tipo === 'combinacion') {
        return true;
      }

      // Filtro por transacción (compra/alquiler)
      if (filtros.transaccion === 'venta') {
        // Si busca compra, la propiedad debe tener precio de venta
        if (!prop.precio_venta) {
          return false;
        }

        // Filtro por precio de compra
        if (filtros.precio_compra) {
          const precioMax = parseFloat(filtros.precio_compra);
          if (prop.precio_venta > precioMax) {
            return false;
          }
        }
      }

      if (filtros.transaccion === 'alquiler') {
        // Si busca alquiler, la propiedad debe tener precio de alquiler
        if (!prop.precio_alquiler) {
          return false;
        }

        // Filtro por precio de alquiler
        if (filtros.precio_alquiler) {
          const precioMax = parseFloat(filtros.precio_alquiler);
          if (prop.precio_alquiler > precioMax) {
            return false;
          }
        }
      }

      // Filtro por área (±15% tolerancia)
      if (filtros.area) {
        const areaBuscada = parseFloat(filtros.area);
        const margen = areaBuscada * 0.15;
        if (prop.area < (areaBuscada - margen) || prop.area > (areaBuscada + margen)) {
          return false;
        }
      }

      // Filtro por parqueos (±20% tolerancia)
      if (filtros.parqueos) {
        const parqueosBuscados = parseInt(filtros.parqueos);
        const margen = Math.ceil(parqueosBuscados * 0.2);
        if (prop.estacionamientos < (parqueosBuscados - margen) || prop.estacionamientos > (parqueosBuscados + margen)) {
          return false;
        }
      }

      // Filtro por antigüedad (no mayor a)
      if (filtros.antiguedad) {
        const antiguedadMax = parseInt(filtros.antiguedad);
        if (prop.antiguedad > antiguedadMax) {
          return false;
        }
      }

      // Filtro por implementación
      if (filtros.implementacion && filtros.implementacion !== '') {
        if (prop.implementacion !== filtros.implementacion) {
          return false;
        }
      }

      return true;
    });
  }

  aplicarFiltrosAvanzados() {
    // Check if there are any advanced filters
    const hasFilters = Object.values(this.filtrosAdicionales.avanzado).some(
      categoria => Object.keys(categoria).length > 0
    );

    if (!hasFilters) return;

    this.propiedadesFiltradas = this.propiedadesFiltradas.filter(prop => {
      // 🔗 Las combinaciones ya vienen filtradas del backend
      if (prop.tipo === 'combinacion') {
        return true;
      }

      // Iterate through all categories
      for (const [categoria, filtros] of Object.entries(this.filtrosAdicionales.avanzado)) {
        // Skip empty categories
        if (Object.keys(filtros).length === 0) continue;

        // Check each filter in this category
        for (const [caracId, value] of Object.entries(filtros)) {
          const id = parseInt(caracId);
          const carac = this.caracteristicas.find(c => c.id === id);

          if (!carac) continue;

          // Find if property has this characteristic
          const propCarac = prop.caracteristicas?.find(pc => pc.caracteristica_id === id);

          if (carac.tipo_input === 'checkbox') {
            // Checkbox: property must have this characteristic
            if (!propCarac) return false;
          } else if (carac.tipo_input === 'number') {
            // Number: property value must be >= filter value
            if (!propCarac || !propCarac.valor_numerico) return false;
            if (parseFloat(propCarac.valor_numerico) < parseFloat(value)) return false;
          }
        }
      }

      return true;
    });
  }

  limpiarFiltrosAdicionales() {
    // ✅ IMPORTANTE: Solo limpia filtros BÁSICOS y AVANZADOS
    // Los filtros GENÉRICOS se mantienen intactos

    this.filtrosAdicionales = {
      basico: {},
      avanzado: {}
    };

    // Guardar en localStorage
    this.guardarFiltrosAdicionales();

    // ✅ Re-renderizar acordeones básico y avanzado vacíos (Desktop)
    const contBasico = document.getElementById('contenedorBasico');
    const contAvanzado = document.getElementById('contenedorAvanzado');
    if (contBasico) {
      contBasico.innerHTML = this.generarHTMLFiltroBasico();
      this.attachBasicoInlineListeners();
    }
    if (contAvanzado) {
      contAvanzado.innerHTML = this.generarHTMLFiltroAvanzado();
      this.attachAvanzadoInlineListeners();
    }

    // ✅ Re-renderizar acordeones básico y avanzado vacíos (Mobile)
    const contBasicoMob = document.getElementById('contenedorBasicoMobile');
    const contAvanzadoMob = document.getElementById('contenedorAvanzadoMobile');
    if (contBasicoMob) {
      contBasicoMob.innerHTML = this.generarHTMLFiltroBasico();
    }
    if (contAvanzadoMob) {
      contAvanzadoMob.innerHTML = this.generarHTMLFiltroAvanzado();
    }

    // Re-aplicar filtros (solo genéricos + iniciales ahora)
    this.aplicarFiltrosIniciales();
    this.renderChipsActivos();

  }

  mostrarFavoritos() {
    if (!this.usuarioLogueado) {
      document.getElementById('loginModal').style.display = 'flex';
      return;
    }

    alert('Función de favoritos en desarrollo');
    // TODO: Implementar vista de favoritos
  }

  renderResultados() {
    const container = document.getElementById('propertiesList');
    if (!container) return;

    if (this.propiedadesFiltradas.length === 0) {
      container.innerHTML = `
        <div style="text-align: center; padding: 40px;">
          <h2>No se encontraron propiedades</h2>
          <p>Intenta ajustar tus filtros de búsqueda.</p>
        </div>
      `;
      const paginador = document.getElementById('paginadorContainer');
      if (paginador) paginador.style.display = 'none';
      return;
    }

    // Calcular paginación
    const totalPropiedades = this.propiedadesFiltradas.length;
    const totalPages = Math.ceil(totalPropiedades / this.itemsPerPage);

    // Ajustar currentPage si es necesario
    if (this.currentPage > totalPages) {
      this.currentPage = totalPages || 1;
    }

    // Calcular índices de inicio y fin
    const startIndex = (this.currentPage - 1) * this.itemsPerPage;
    const endIndex = Math.min(startIndex + this.itemsPerPage, totalPropiedades);

    // Obtener propiedades de la página actual
    const propiedadesPagina = this.propiedadesFiltradas.slice(startIndex, endIndex);

    const html = propiedadesPagina.map((prop, index) => {
      // 🔍 Detectar si es combinación o propiedad individual
      if (prop.tipo === 'combinacion') {
        return this.renderCombinacionCard(prop, startIndex + index + 1);
      } else {
        return this.renderPropertyCard(prop, startIndex + index + 1);
      }
    }).join('');

    container.innerHTML = html;
    this.setupCardListeners();

    // Configurar favoritos
    this.setupFavoriteButtons();
    this.loadFavoritesState();

    // Re-inicializar image viewer para nuevas cards
    if (window.imageViewer) {
      window.imageViewer.attachToImages('.search-result-image');
    }

    // Renderizar paginador
    this.renderPaginador(totalPages, startIndex + 1, endIndex, totalPropiedades);
  }

  renderPaginador(totalPages, startIndex, endIndex, totalPropiedades) {
    // Buscar o crear contenedor del paginador
    let paginadorContainer = document.getElementById('paginadorContainer');

    if (!paginadorContainer) {
      // Crear contenedor si no existe
      const listContainer = document.getElementById('propertiesList');
      if (!listContainer) return;

      paginadorContainer = document.createElement('div');
      paginadorContainer.id = 'paginadorContainer';
      paginadorContainer.className = 'paginador-container';
      listContainer.parentNode.appendChild(paginadorContainer);
    }

    // Si solo hay una página, ocultar el paginador
    if (totalPages <= 1) {
      paginadorContainer.style.display = 'none';
      return;
    }

    paginadorContainer.style.display = 'flex';

    // Generar números de página con elipsis
    const generarNumerosPagina = () => {
      const maxButtons = window.innerWidth <= 768 ? 5 : 7;
      const pages = [];

      if (totalPages <= maxButtons) {
        // Mostrar todas las páginas
        for (let i = 1; i <= totalPages; i++) {
          pages.push(i);
        }
      } else {
        // Mostrar con elipsis
        const leftSiblings = Math.floor((maxButtons - 3) / 2);
        const rightSiblings = Math.floor((maxButtons - 3) / 2);

        pages.push(1);

        if (this.currentPage > leftSiblings + 2) {
          pages.push('...');
        }

        const start = Math.max(2, this.currentPage - leftSiblings);
        const end = Math.min(totalPages - 1, this.currentPage + rightSiblings);

        for (let i = start; i <= end; i++) {
          pages.push(i);
        }

        if (this.currentPage < totalPages - rightSiblings - 1) {
          pages.push('...');
        }

        if (totalPages > 1) {
          pages.push(totalPages);
        }
      }

      return pages;
    };

    const pageNumbers = generarNumerosPagina();

    // Generar HTML del paginador
    const html = `
      <div class="paginador-info">
        <span class="paginador-text">Mostrando <strong>${startIndex}-${endIndex}</strong> de <strong>${totalPropiedades}</strong> resultados</span>
      </div>
      <div class="paginador-controls">
        <button
          class="paginador-btn paginador-prev"
          data-action="prev"
          ${this.currentPage === 1 ? 'disabled' : ''}
          aria-label="Página anterior"
        >
          <i class="fa-solid fa-chevron-left"></i>
          <span class="btn-text">Anterior</span>
        </button>

        <div class="paginador-numbers">
          ${pageNumbers.map(page => {
      if (page === '...') {
        return '<span class="paginador-ellipsis">...</span>';
      }
      return `
              <button
                class="paginador-btn paginador-page ${page === this.currentPage ? 'active' : ''}"
                data-page="${page}"
                aria-label="Página ${page}"
                ${page === this.currentPage ? 'aria-current="page"' : ''}
              >
                ${page}
              </button>
            `;
    }).join('')}
        </div>

        <button
          class="paginador-btn paginador-next"
          data-action="next"
          ${this.currentPage === totalPages ? 'disabled' : ''}
          aria-label="Página siguiente"
        >
          <span class="btn-text">Siguiente</span>
          <i class="fa-solid fa-chevron-right"></i>
        </button>
      </div>
    `;

    paginadorContainer.innerHTML = html;

    // Adjuntar listeners
    this.attachPaginadorListeners();
  }

  renderPrecio(prop) {
    let html = '';
    if (prop.precio_venta) {
      html += `<span class="price-tag">💰 Venta: USD ${prop.precio_venta.toLocaleString()}</span>`;
    }
    if (prop.precio_alquiler) {
      if (html) html += ' ';
      html += `<span class="price-tag">💰 Alquiler: USD ${prop.precio_alquiler.toLocaleString()}/mes</span>`;
    }
    return html;
  }

  /**
   * 🏠 Renderizar tarjeta de propiedad individual
   */
  renderPropertyCard(prop, number) {
    const propId = prop.registro_cab_id || prop.id;
    const imagenes = prop.imagenes;
    return `
      <div class="property-card" data-property-id="${propId}">
        <div class="property-number">${number}</div>

        <!-- Botón de Favorito -->
        <button class="favorite-btn-float" data-favorite-property="${propId}" title="Agregar a favoritos" style="position: absolute; top: 10px; right: 10px; background: white; border: 2px solid #333; width: 36px; height: 36px; border-radius: 50%; cursor: pointer; z-index: 30; display: flex; align-items: center; justify-content: center; font-size: 1.5rem; transition: all 0.3s; box-shadow: 0 2px 8px rgba(0,0,0,0.2);">
          ♡
        </button>

        <div class="property-image-carousel">
          <div class="carousel-images" data-carousel="carousel-${propId}" data-current="0">
            ${imagenes.map((img, i) => `
              <img src="${img}" alt="${prop.titulo} - imagen ${i + 1}" class="carousel-image search-result-image ${i === 0 ? 'active' : ''}" data-index="${i}"
                   onerror="this.src='https://placehold.co/800x600/e5e7eb/6b7280?text=Sin+Imagen'">
            `).join('')}
          </div>
          ${imagenes.length > 1 ? `
            <button class="carousel-prev" data-carousel="carousel-${propId}">&#8249;</button>
            <button class="carousel-next" data-carousel="carousel-${propId}">&#8250;</button>
            <div class="carousel-indicators" data-carousel="carousel-${propId}">
              ${imagenes.map((_, i) => `
                <span class="indicator ${i === 0 ? 'active' : ''}" data-index="${i}"></span>
              `).join('')}
            </div>
            <div class="photo-counter"><span class="photo-counter-current">1</span>/${imagenes.length}</div>
          ` : ''}
        </div>
        <div class="property-info">
          <h3 class="property-title">${prop.titulo}</h3>
          <div class="property-price">${this.renderPrecio(prop)}</div>
          <div class="property-features">
            ${prop.area ? `<span class="feature">📐 ${prop.area} m²</span>` : ''}
            ${(prop.tipo_inmueble_id !== 12 && prop.tipo_inmueble_id !== 13) ? `
              ${prop.habitaciones ? `<span class="feature">🛏️ ${prop.habitaciones} hab.</span>` : ''}
              ${prop.banos ? `<span class="feature">🛁 ${prop.banos} baños</span>` : ''}
              ${prop.estacionamientos ? `<span class="feature">🚗 ${prop.estacionamientos} estac.</span>` : ''}
            ` : ''}
            ${prop.antiguedad ? `<span class="feature">⏱️ ${prop.antiguedad} años</span>` : ''}
            ${prop.implementacion ? `<span class="feature">🔧 ${prop.implementacion}</span>` : ''}
          </div>
          ${prop.descripcion ? `<p class="property-description">${prop.descripcion}</p>` : ''}
          <div style="display: flex; align-items: center; justify-content: space-between; margin-top: 8px;">
            ${!this.usuarioLogueado ? `
              <div class="contact-locked">
                🔒 <a href="#" class="login-link" data-property-id="${prop.id}">Inicia sesión para ver contacto</a>
              </div>
            ` : `
              <div class="contact-info" style="margin: 0;">
                <div class="contact-item">📱 +51 999457538</div>
                <div class="contact-item">📧 info@match.pe</div>
              </div>
            `}
            <button class="btn-detalle-resultado" data-view-detail="${propId}" onclick="event.stopPropagation();"
                    style="background: var(--azul-corporativo, #0f4761); color: white; border: none; padding: 6px 14px; border-radius: 6px; font-size: 0.8rem; font-weight: 600; cursor: pointer; display: flex; align-items: center; gap: 4px; flex-shrink: 0; transition: all 0.2s;"
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
   * 🔗 Renderizar tarjeta de COMBINACIÓN de oficinas
   */
  renderCombinacionCard(combinacion, number) {
    const oficinasPreviews = combinacion.oficinas || [];
    const primeraOficina = oficinasPreviews[0] || {};
    const imagenPrincipal = primeraOficina.imagen_principal || 'https://via.placeholder.com/400x300?text=Combinacion';

    // Renderizar precio total
    let precioHtml = '';
    if (combinacion.precio_venta_total) {
      precioHtml += `<span class="price-tag">💰 Venta Total: USD ${combinacion.precio_venta_total.toLocaleString()}</span>`;
    }
    if (combinacion.precio_alquiler_total) {
      if (precioHtml) precioHtml += ' ';
      precioHtml += `<span class="price-tag">💰 Alquiler Total: USD ${combinacion.precio_alquiler_total.toLocaleString()}/mes</span>`;
    }

    return `
      <div class="property-card property-card-combinacion" data-property-id="combo-${combinacion.edificio_id || 'unknown'}">
        <div class="property-number">${number}</div>

        <!-- 🔗 Badge de Combinación -->
        <div class="combinacion-badge">
          🔗 COMBINACIÓN DE ${combinacion.cantidad_oficinas} OFICINAS
        </div>

        <div class="property-image-carousel">
          <div class="carousel-images" data-current="0">
            <img src="${imagenPrincipal}" alt="Combinación de oficinas" class="carousel-image active" onerror="this.src='https://via.placeholder.com/400x300?text=Combinacion'">
          </div>
        </div>

        <div class="property-info">
          <h3 class="property-title">
            <span class="combinacion-icon">🏢</span>
            ${combinacion.glosa || 'Combinación de oficinas'}
          </h3>

          <div class="property-location">
            <i class="fa-solid fa-location-dot"></i>
            ${combinacion.distrito || 'Ubicación no especificada'}
            ${combinacion.piso ? ` - Piso ${combinacion.piso}` : ''}
          </div>

          <div class="property-price">${precioHtml}</div>

          <div class="property-features">
            <span class="feature feature-highlight">📐 ${combinacion.area_total} m² TOTAL</span>
            <span class="feature">🏢 ${combinacion.cantidad_oficinas} oficinas</span>
            <span class="feature">💱 ${combinacion.moneda || 'PEN'}</span>
          </div>

          <!-- Lista de Oficinas Individuales -->
          <div class="oficinas-lista-combinacion">
            <p class="oficinas-header"><strong>Oficinas incluidas:</strong></p>
            <ul class="oficinas-items">
              ${oficinasPreviews.map(ofi => `
                <li class="oficina-item">
                  <span class="oficina-nombre">📄 ${ofi.nombre || 'Oficina'}</span>
                  <span class="oficina-area">${ofi.area} m²</span>
                  ${ofi.precio_venta ? `<span class="oficina-precio">$${ofi.precio_venta.toLocaleString()}</span>` : ''}
                </li>
              `).join('')}
            </ul>
          </div>

          <p class="property-description">
            Esta combinación te permite obtener ${combinacion.area_total} m² de oficinas contiguas en el mismo piso y edificio.
            ${combinacion.transaccion === 'venta' ? 'Ideal para inversión o uso corporativo.' : 'Disponible para alquiler mensual.'}
          </p>

          ${!this.usuarioLogueado ? `
            <div class="contact-locked">
              🔒 <a href="#" class="login-link">Inicia sesión para más información</a>
            </div>
          ` : `
            <div class="contact-info">
              <div class="contact-item">📱 +51 999457538</div>
              <div class="contact-item">📧 info@match.pe</div>
            </div>
          `}
        </div>
      </div>
    `;
  }

  setupCardListeners() {
    const container = document.getElementById('propertiesList');
    if (!container) return;

    // Carrusel prev/next (misma lógica que busquedas-cards.js)
    const carouselBtns = container.querySelectorAll('.carousel-prev, .carousel-next');
    console.log('🎠 Carousel buttons found:', carouselBtns.length);
    carouselBtns.forEach(btn => {
      btn.addEventListener('click', (e) => {
        e.stopPropagation();
        e.preventDefault();
        const carouselId = btn.dataset.carousel;
        console.log('🎠 Carousel click:', carouselId, btn.classList.contains('carousel-prev') ? 'PREV' : 'NEXT');
        const direction = btn.classList.contains('carousel-prev') ? -1 : 1;
        this.navigateCarousel(carouselId, direction);
      });
    });

    // Indicadores (misma lógica que busquedas-cards.js)
    container.querySelectorAll('.carousel-indicators .indicator').forEach(indicator => {
      indicator.addEventListener('click', (e) => {
        e.stopPropagation();
        const index = parseInt(indicator.dataset.index);
        const carouselId = indicator.closest('.carousel-indicators').dataset.carousel;
        this.goToSlide(carouselId, index);
      });
    });

    // Botón Detalle
    container.querySelectorAll('.btn-detalle-resultado').forEach(btn => {
      btn.addEventListener('click', (e) => {
        e.stopPropagation();
        this.showPropertyDetail(parseInt(btn.dataset.viewDetail));
      });
    });

    // Hover sobre cards
    container.querySelectorAll('.property-card').forEach(card => {
      card.addEventListener('mouseenter', (e) => {
        this.activarPropiedad(e.currentTarget.dataset.propertyId);
      });
      card.addEventListener('mouseleave', () => {
        this.desactivarTodo();
      });
    });

    // Links de login
    document.querySelectorAll('.login-link').forEach(link => {
      link.addEventListener('click', (e) => {
        e.preventDefault();
        e.stopPropagation();
        document.getElementById('loginModal').style.display = 'flex';
      });
    });

    // Botones de favorito
    document.querySelectorAll('.favorite-btn').forEach(btn => {
      btn.addEventListener('click', (e) => {
        e.stopPropagation();
        
        // Verificar si el usuario está logueado
        if (!this.usuarioLogueado) {
          this.showToast('Esta función está permitida solo si te registras. Por favor inicia sesión.', 'warning');
          return;
        }
        
        const propId = parseInt(e.currentTarget.dataset.propertyId);
        const idx = this.favoritos.indexOf(propId);
        if (idx >= 0) {
          this.favoritos.splice(idx, 1);
          this.showToast('Propiedad eliminada de favoritos', 'info');
        } else {
          this.favoritos.push(propId);
          this.showToast('Propiedad agregada a favoritos', 'success');
        }
        this.guardarFavoritos();
        // Actualizar icono en botón
        e.currentTarget.textContent = this.favoritos.includes(propId) ? '❤' : '♡';
      });
    });
  }

  setupFavoriteButtons() {
    const favoriteBtns = document.querySelectorAll('[data-favorite-property]');
    favoriteBtns.forEach(btn => {
      btn.addEventListener('click', async (e) => {
        e.stopPropagation();
        e.preventDefault();
        const propId = parseInt(e.currentTarget.dataset.favoriteProperty);
        
        // Verificar si es favorito por el emoji
        const isFavorito = e.currentTarget.textContent.trim() === '❤️';
        
        // Toggle favorito en API
        const success = await favoritesActionService.toggleFavorito(propId, isFavorito);
        
        if (success) {
          if (isFavorito) {
            // Está rojo → quitarlo → blanco con borde
            e.currentTarget.textContent = '♡';
            e.currentTarget.style.border = '2px solid #333';
            e.currentTarget.style.background = 'white';
            e.currentTarget.title = 'Agregar a favoritos';
          } else {
            // Está blanco → agregarlo → rojo
            e.currentTarget.textContent = '❤️';
            e.currentTarget.style.border = 'none';
            e.currentTarget.style.background = 'white';
            e.currentTarget.title = 'Quitar de favoritos';
          }
          
          // Animación
          e.currentTarget.style.transform = 'scale(1.3)';
          setTimeout(() => {
            e.currentTarget.style.transform = 'scale(1)';
          }, 200);
        }
      });
    });
  }

  async loadFavoritesState() {
    try {
      const token = authService.getToken();
      if (!token) return;

      const response = await fetch(`${API_CONFIG.BASE_URL}/favoritos/`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });

      if (!response.ok) return;

      const data = await response.json();
      const favoritos = data.data || [];
      

      // Marcar corazones rojos para favoritos
      favoritos.forEach(fav => {
        const propId = fav.registro_cab_id || fav.propiedad_id;
        const btn = document.querySelector(`[data-favorite-property="${propId}"]`);
        if (btn) {
          btn.textContent = '❤️'; // Corazón rojo relleno
          btn.style.border = 'none';
          btn.title = 'Quitar de favoritos';
        }
      });

    } catch (error) {
      console.error('❌ Error cargando favoritos:', error);
    }
  }

  attachPaginadorListeners() {
    // Botón anterior
    const btnPrev = document.querySelector('.paginador-prev');
    btnPrev?.addEventListener('click', () => {
      if (this.currentPage > 1) {
        this.currentPage--;
        this.renderResultados();
        this.scrollToTop();
      }
    });

    // Botón siguiente
    const btnNext = document.querySelector('.paginador-next');
    btnNext?.addEventListener('click', () => {
      const totalPages = Math.ceil(this.propiedadesFiltradas.length / this.itemsPerPage);
      if (this.currentPage < totalPages) {
        this.currentPage++;
        this.renderResultados();
        this.scrollToTop();
      }
    });

    // Botones de número de página
    document.querySelectorAll('.paginador-page').forEach(btn => {
      btn.addEventListener('click', (e) => {
        const page = parseInt(e.currentTarget.dataset.page);
        if (page && page !== this.currentPage) {
          this.currentPage = page;
          this.renderResultados();
          this.scrollToTop();
        }
      });
    });
  }

  scrollToTop() {
    // Hacer scroll hacia la sección de resultados
    const listingsSection = document.getElementById('listingsSection');
    if (listingsSection) {
      listingsSection.scrollIntoView({ behavior: 'smooth', block: 'start' });
    } else {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  }

  renderMapa() {
    const mapCanvas = document.getElementById('map');

    // Forzar que el mapa sea visible antes de inicializar
    if (mapCanvas) {
      mapCanvas.style.display = 'block';
    }

    // Inicializar mapa si no existe
    if (!this.map && mapCanvas) {
      try {
        this.map = L.map('map', {
          scrollWheelZoom: true,   // Habilitar zoom con scroll (limitado)
          doubleClickZoom: false,  // Deshabilitar zoom con doble click
          touchZoom: true,         // Habilitar zoom táctil (limitado)
          boxZoom: false,          // Deshabilitar zoom con caja
          dragging: true,          // Permitir arrastrar el mapa
          zoomControl: true,       // Mostrar controles de zoom
          minZoom: 11,
          maxZoom: 18
        }).setView([-12.0464, -77.0428], 13);

        L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
          attribution: '© OpenStreetMap contributors',
          maxZoom: 19
        }).addTo(this.map);

        // 🔒 Protección de ubicación para usuarios invitados
        // Aplicar blur y desaturación cuando hacen zoom muy cerca
        this.map.on('zoomend', () => {
          const currentZoom = this.map.getZoom();
          const tiles = document.querySelector('.leaflet-tile-pane');

          // Solo aplicar blur si NO está logueado Y el zoom es >= 17 (muy cerca)
          if (!this.usuarioLogueado && currentZoom >= 17) {
            if (tiles) {
              tiles.style.filter = 'blur(3px) saturate(50%)';
              tiles.style.transition = 'filter 0.3s ease';
            }
          } else {
            if (tiles) {
              tiles.style.filter = 'none';
            }
          }
        });

        // Forzar redimensionamiento
        setTimeout(() => {
          if (this.map) {
            this.map.invalidateSize();
          }
        }, 100);
      } catch (error) {
        console.error('Error inicializando mapa:', error);
        return;
      }
    }

    if (!this.map) return;

    // Limpiar marcadores
    this.markers.forEach(marker => this.map.removeLayer(marker));
    this.markers = [];

    // Crear marcadores
    this.propiedadesFiltradas.forEach((prop, index) => {
      // Obtener coordenadas del API (latitud y longitud como strings, convertir a number)
      let lat = parseFloat(prop.latitud) || -12.0464;
      let lng = parseFloat(prop.longitud) || -77.0428;

      // Agregar pequeño offset aleatorio para evitar superposición de marcadores
      // (±0.002 grados ≈ ±200 metros aprox)
      const offsetLat = (Math.random() - 0.5) * 0.004;
      const offsetLng = (Math.random() - 0.5) * 0.004;
      lat += offsetLat;
      lng += offsetLng;

      // 🔗 Detectar si es combinación para usar marcador diferenciado
      const esCombinacion = prop.tipo === 'combinacion';
      const markerClass = esCombinacion ? 'marker-number marker-combinacion' : 'marker-number';
      const markerIcon = esCombinacion ? '🔗' : (index + 1);
      const markerId = esCombinacion
        ? `combo-${prop.edificio_id || 'unknown'}`
        : (prop.registro_cab_id || prop.id);

      const customIcon = L.divIcon({
        className: 'custom-marker',
        html: `<div class="${markerClass}" data-marker-id="${markerId}">${markerIcon}</div>`,
        iconSize: [40, 40],
        iconAnchor: [20, 20]
      });

      // Construir popup según tipo
      const popupContent = esCombinacion
        ? `<div class="marker-popup marker-popup-combinacion">
            <strong>🔗 ${prop.cantidad_oficinas || 2} Oficinas Combinadas</strong><br>
            <span>${prop.area_total || '—'} m² total</span><br>
            <strong class="popup-price">USD ${prop.precio_venta_total?.toLocaleString() || prop.precio_alquiler_total?.toLocaleString() || '—'}</strong>
          </div>`
        : `<div class="marker-popup">
            <strong>${prop.titulo}</strong><br>
            <strong class="popup-price">USD ${prop.precio_venta?.toLocaleString() || prop.precio_alquiler?.toLocaleString()}</strong>
          </div>`;

      const marker = L.marker([lat, lng], { icon: customIcon })
        .addTo(this.map)
        .bindPopup(popupContent);

      // Usar el mismo ID calculado para el marcador
      const propId = markerId;
      
      marker.on('click', () => {
        this.activarPropiedad(propId);
        this.scrollToCard(propId);
      });

      marker.on('mouseover', () => this.activarPropiedad(propId));
      marker.on('mouseout', () => this.desactivarTodo());

      marker.propertyId = propId;
      this.markers.push(marker);
    });

    // Ajustar zoom para mostrar todos los marcadores
    if (this.markers.length > 0) {
      const group = L.featureGroup(this.markers);
      this.map.fitBounds(group.getBounds().pad(0.1), {
        maxZoom: 16,
        animate: true
      });
    }
  }

  activarPropiedad(propId) {
    this.desactivarTodo();
    const card = document.querySelector(`.property-card[data-property-id="${propId}"]`);
    card?.classList.add('highlighted');
    const markerDiv = document.querySelector(`.marker-number[data-marker-id="${propId}"]`);
    markerDiv?.classList.add('highlighted');
  }

  desactivarTodo() {
    document.querySelectorAll('.highlighted').forEach(el => el.classList.remove('highlighted'));
  }

  scrollToCard(propId) {
    const card = document.querySelector(`.property-card[data-property-id="${propId}"]`);
    if (card) {
      card.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }
  }

  navigateCarousel(carouselId, direction) {
    const carousel = document.querySelector(`.carousel-images[data-carousel="${carouselId}"]`);
    console.log('🎠 navigateCarousel:', carouselId, 'found:', !!carousel);
    if (!carousel) return;

    const images = carousel.querySelectorAll('.carousel-image');
    const currentIndex = Array.from(images).findIndex(img => img.classList.contains('active'));
    let newIndex = currentIndex + direction;

    if (newIndex < 0) newIndex = images.length - 1;
    if (newIndex >= images.length) newIndex = 0;

    this.goToSlide(carouselId, newIndex);
  }

  goToSlide(carouselId, index) {
    const carousel = document.querySelector(`.carousel-images[data-carousel="${carouselId}"]`);
    if (!carousel) return;

    const images = carousel.querySelectorAll('.carousel-image');
    const indicators = document.querySelectorAll(`.carousel-indicators[data-carousel="${carouselId}"] .indicator`);

    console.log('🎠 goToSlide:', carouselId, 'index:', index, 'images:', images.length, 'indicators:', indicators.length);

    images.forEach((img, i) => img.classList.toggle('active', i === index));
    indicators.forEach((ind, i) => ind.classList.toggle('active', i === index));
    carousel.dataset.current = index;

    const card = carousel.closest('.property-card');
    if (card) {
      const counter = card.querySelector('.photo-counter-current');
      if (counter) counter.textContent = index + 1;
    }
  }

  /**
   * Mostrar detalle de propiedad con características (modal full-screen)
   */
  async showPropertyDetail(propId) {
    try {
      // Buscar propiedad en resultados locales
      const propLocal = this.propiedades.find(p => (p.registro_cab_id || p.id) == propId);

      // Fetch detalle completo del API (incluye características)
      let prop = propLocal;
      try {
        const token = localStorage.getItem('token');
        const headers = token ? { 'Authorization': `Bearer ${token}` } : {};
        const response = await fetch(`${API_CONFIG.BASE_URL}/propiedades/${propId}`, { headers });
        if (response.ok) {
          const data = await response.json();
          prop = data.data || data;
        }
      } catch (e) {
        console.warn('No se pudo cargar detalle completo, usando datos locales');
      }

      if (!prop) {
        this.showToast('No se encontró la propiedad', 'warning');
        return;
      }

      const isMobile = window.innerWidth <= 768;

      // Mapear implementación
      const implementacionMap = { '1': 'Implementado', '2': 'Semi-implementado', '3': 'Sin implementar' };
      const implementacionTexto = implementacionMap[prop.implementacion] || prop.implementacion || 'Sin especificar';
      const antiguedad = prop.antiguedad || 0;

      // Imágenes para carrusel en modal
      let modalImagenes = Array.isArray(prop.imagenes) ? prop.imagenes : [];
      if (modalImagenes.length === 0 && prop.imagen_principal) modalImagenes = [prop.imagen_principal];

      const resumenNarrativo = `${prop.tipo_inmueble || 'Propiedad'} ubicada en ${prop.distrito || 'Lima'}, ${prop.direccion || ''}. ${prop.area ? prop.area + ' m²' : ''}${antiguedad > 0 ? ', ' + antiguedad + ' años' : ''}${implementacionTexto !== 'Sin especificar' ? ', ' + implementacionTexto.toLowerCase() : ''}.`;

      // Crear modal
      const modal = document.createElement('div');
      modal.style.cssText = 'position: fixed; top: 0; left: 0; right: 0; bottom: 0; background: rgba(0,0,0,0.85); z-index: 99999; display: flex; align-items: center; justify-content: center; padding: 0;';

      const modalContent = document.createElement('div');
      modalContent.style.cssText = 'background: white; width: 100vw; height: 100vh; overflow: hidden; display: flex; flex-direction: column;';

      modalContent.innerHTML = `
        <!-- Header -->
        <div style="background: linear-gradient(135deg, var(--azul-corporativo, #0f4761) 0%, #1a6b8a 100%); color: white; padding: 12px; flex-shrink: 0;">
          <div style="display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 6px;">
            <h2 style="margin: 0; color: white; font-size: 1.2rem; font-weight: 700; flex: 1; line-height: 1.2;">${prop.titulo || 'Propiedad'}</h2>
            <button class="btn-close-detail" style="background: rgba(255,255,255,0.2); border: none; font-size: 20px; cursor: pointer; color: white; width: 32px; height: 32px; border-radius: 50%; display: flex; align-items: center; justify-content: center; flex-shrink: 0; margin-left: 8px;">&times;</button>
          </div>
          <p style="margin: 0; color: rgba(255,255,255,0.95); font-size: 0.85rem; line-height: 1.4;">${resumenNarrativo}</p>
        </div>

        <!-- Contenido scrolleable -->
        <div style="flex: 1; overflow-y: auto; overflow-x: hidden;">

          ${modalImagenes.length > 0 ? `
          <!-- Galería de imágenes -->
          <div style="position: relative; width: 100%; height: ${isMobile ? '200px' : '300px'}; background: #111;">
            <div class="modal-carousel" style="width: 100%; height: 100%; position: relative;">
              ${modalImagenes.map((img, i) => `
                <img src="${img}" alt="Imagen ${i+1}" style="width: 100%; height: 100%; object-fit: cover; position: absolute; top: 0; left: 0; opacity: ${i === 0 ? '1' : '0'}; transition: opacity 0.3s;" class="modal-carousel-img ${i === 0 ? 'active' : ''}" data-index="${i}">
              `).join('')}
            </div>
            ${modalImagenes.length > 1 ? `
              <button class="modal-carousel-prev" style="position: absolute; left: 10px; top: 50%; transform: translateY(-50%); background: rgba(0,0,0,0.6); color: white; border: none; width: 36px; height: 36px; border-radius: 50%; font-size: 1.4rem; cursor: pointer; z-index: 5;">&#8249;</button>
              <button class="modal-carousel-next" style="position: absolute; right: 10px; top: 50%; transform: translateY(-50%); background: rgba(0,0,0,0.6); color: white; border: none; width: 36px; height: 36px; border-radius: 50%; font-size: 1.4rem; cursor: pointer; z-index: 5;">&#8250;</button>
              <div style="position: absolute; bottom: 8px; right: 10px; background: rgba(0,0,0,0.6); color: white; padding: 3px 10px; border-radius: 4px; font-size: 0.75rem; font-weight: 600;"><span class="modal-counter-current">1</span>/${modalImagenes.length}</div>
            ` : ''}
          </div>
          ` : ''}

          <!-- Info básica -->
          <div style="padding: 10px 12px; background: #f8f9fa; border-bottom: 1px solid #e2e8f0;">
            <div style="display: flex; flex-wrap: wrap; gap: 14px; align-items: center; font-size: 0.85rem;">
              ${prop.area ? `<span style="font-weight: 600; color: #ff9800;">📐 ${prop.area} m²</span>` : ''}
              ${antiguedad > 0 ? `<span style="font-weight: 600; color: #6c757d;">⏱️ ${antiguedad} años</span>` : ''}
              ${implementacionTexto !== 'Sin especificar' ? `<span style="font-weight: 600; color: #17a2b8;">🏗️ ${implementacionTexto}</span>` : ''}
              ${prop.habitaciones ? `<span style="font-weight: 600;">🛏️ ${prop.habitaciones} hab.</span>` : ''}
              ${prop.banos ? `<span style="font-weight: 600;">🛁 ${prop.banos} baños</span>` : ''}
              ${prop.estacionamientos ? `<span style="font-weight: 600;">🚗 ${prop.estacionamientos} estac.</span>` : ''}
            </div>
          </div>

          <!-- Precios -->
          <div style="padding: 10px 12px; display: flex; gap: 10px; flex-wrap: wrap; border-bottom: 1px solid #e2e8f0;">
            ${prop.precio_venta ? `<div style="background: #f0fdf4; border: 1px solid #bbf7d0; padding: 8px 12px; border-radius: 6px; flex: 1; min-width: 140px;"><div style="font-size: 0.7rem; color: #6b7280; font-weight: 600;">VENTA</div><div style="font-size: 1.1rem; font-weight: 700; color: #166534;">USD ${Number(prop.precio_venta).toLocaleString()}</div></div>` : ''}
            ${prop.precio_alquiler ? `<div style="background: #eff6ff; border: 1px solid #bfdbfe; padding: 8px 12px; border-radius: 6px; flex: 1; min-width: 140px;"><div style="font-size: 0.7rem; color: #6b7280; font-weight: 600;">ALQUILER</div><div style="font-size: 1.1rem; font-weight: 700; color: #1e40af;">USD ${Number(prop.precio_alquiler).toLocaleString()}/mes</div></div>` : ''}
          </div>

          <!-- Descripción -->
          ${prop.descripcion ? `
          <div style="padding: 12px; border-bottom: 1px solid #e2e8f0;">
            <h3 style="margin: 0 0 8px 0; color: var(--azul-corporativo, #0f4761); font-size: 0.9rem; font-weight: 700;">📄 Descripción</h3>
            <p style="margin: 0; line-height: 1.5; color: #4a5568; font-size: 0.85rem;">${prop.descripcion}</p>
          </div>
          ` : ''}

          <!-- Características -->
          <div id="detail-caracteristicas" style="padding: 12px; background: #f8f9fa;"></div>
        </div>

        <!-- Footer -->
        <div style="background: white; padding: 8px 12px; flex-shrink: 0; display: flex; justify-content: center; border-top: 1px solid rgba(0,0,0,0.08);">
          <small style="color: #9ca3af; font-size: 0.7rem;">Presiona <kbd style="background: #f3f4f6; border: 1px solid #ddd; padding: 2px 5px; border-radius: 3px; font-family: monospace;">ESC</kbd> para cerrar</small>
        </div>
      `;

      modal.appendChild(modalContent);
      document.body.appendChild(modal);

      // Renderizar características agrupadas
      const caracContainer = modalContent.querySelector('#detail-caracteristicas');
      if (prop.caracteristicas && prop.caracteristicas.length > 0) {
        const grouped = {};
        prop.caracteristicas.forEach(car => {
          const cat = car.categoria || 'Otras';
          if (!grouped[cat]) grouped[cat] = [];
          grouped[cat].push(car);
        });

        const ordenCategorias = [
          'Generales del Edificio', 'Soporte del Edificio', 'De la Oficina',
          'Equipamiento de Oficina', 'Condición Comercial', 'Vista de la Oficina',
          'Información de Áreas', 'Valorización Edificio', 'Soporte Urbano'
        ];
        const categoriasOrdenadas = ordenCategorias.filter(c => grouped[c]);
        const categoriasRestantes = Object.keys(grouped).filter(c => !ordenCategorias.includes(c));
        const todasCategorias = [...categoriasOrdenadas, ...categoriasRestantes];

        let html = '<h3 style="margin: 0 0 8px 0; color: var(--azul-corporativo, #0f4761); font-size: 0.9rem; font-weight: 700;">✅ Características</h3>';
        todasCategorias.forEach((cat, index) => {
          const items = grouped[cat];
          const isOpen = index === 0;
          html += `
            <div style="margin-bottom: 6px; border: 1px solid #e2e8f0; border-radius: 6px; overflow: hidden; background: white;">
              <button class="cat-toggle" style="width: 100%; padding: 10px 14px; background: #f8f9fa; border: none; display: flex; justify-content: space-between; align-items: center; cursor: pointer; font-weight: 600; color: var(--azul-corporativo, #0f4761); text-align: left;">
                <span style="font-size: 0.85rem; display: flex; align-items: center; gap: 6px;">
                  📋 ${cat}
                  <span style="background: var(--azul-corporativo, #0f4761); color: white; padding: 2px 8px; border-radius: 10px; font-size: 0.7rem;">${items.length}</span>
                </span>
                <span class="toggle-icon" style="font-size: 1rem;">${isOpen ? '▼' : '▶'}</span>
              </button>
              <div class="cat-content" style="display: ${isOpen ? 'block' : 'none'}; padding: 10px 14px; border-top: 1px solid #e2e8f0;">
                <div style="display: grid; grid-template-columns: repeat(auto-fill, minmax(180px, 1fr)); gap: 6px;">
                  ${items.map(c => `
                    <div style="display: flex; align-items: center; gap: 5px; padding: 5px 8px; background: #f0f9ff; border-radius: 5px; font-size: 0.8rem; border: 1px solid #bae6fd;">
                      <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#0ea5e9" stroke-width="3"><polyline points="20 6 9 17 4 12"></polyline></svg>
                      <span style="color: #0369a1; font-weight: 500;">${c.nombre || c}</span>
                    </div>
                  `).join('')}
                </div>
              </div>
            </div>`;
        });
        caracContainer.innerHTML = html;

        // Toggle acordeones
        modalContent.querySelectorAll('.cat-toggle').forEach(btn => {
          btn.addEventListener('click', () => {
            const content = btn.nextElementSibling;
            const icon = btn.querySelector('.toggle-icon');
            const isOpen = content.style.display === 'block';
            content.style.display = isOpen ? 'none' : 'block';
            icon.textContent = isOpen ? '▶' : '▼';
          });
        });
      } else {
        caracContainer.innerHTML = '<p style="color: #9ca3af; font-style: italic; text-align: center; padding: 20px;">No hay características registradas</p>';
      }

      // Carrusel del modal
      if (modalImagenes.length > 1) {
        let modalIdx = 0;
        const imgs = modalContent.querySelectorAll('.modal-carousel-img');
        const counterEl = modalContent.querySelector('.modal-counter-current');
        const updateModalCarousel = (newIdx) => {
          imgs.forEach((img, i) => { img.style.opacity = i === newIdx ? '1' : '0'; img.classList.toggle('active', i === newIdx); });
          modalIdx = newIdx;
          if (counterEl) counterEl.textContent = newIdx + 1;
        };
        modalContent.querySelector('.modal-carousel-prev')?.addEventListener('click', (e) => {
          e.stopPropagation();
          updateModalCarousel((modalIdx - 1 + modalImagenes.length) % modalImagenes.length);
        });
        modalContent.querySelector('.modal-carousel-next')?.addEventListener('click', (e) => {
          e.stopPropagation();
          updateModalCarousel((modalIdx + 1) % modalImagenes.length);
        });
      }

      // Cerrar modal
      const closeModal = () => { modal.remove(); document.removeEventListener('keydown', escHandler); };
      modal.addEventListener('click', (e) => { if (e.target === modal) closeModal(); });
      modalContent.querySelector('.btn-close-detail')?.addEventListener('click', closeModal);
      const escHandler = (e) => { if (e.key === 'Escape') closeModal(); };
      document.addEventListener('keydown', escHandler);

    } catch (error) {
      console.error('Error mostrando detalle:', error);
      this.showToast('Error al cargar detalles', 'error');
    }
  }

  showToast(mensaje, tipo = 'info') {
    // Crear o reutilizar contenedor de toast
    let toastContainer = document.getElementById('toastContainer');
    if (!toastContainer) {
      toastContainer = document.createElement('div');
      toastContainer.id = 'toastContainer';
      toastContainer.className = 'toast-container';
      document.body.appendChild(toastContainer);
    }

    // Crear toast
    const toast = document.createElement('div');
    toast.className = `toast toast-${tipo}`;
    
    // Icono según tipo
    const iconos = {
      'info': 'ℹ️',
      'warning': '⚠️',
      'success': '✅',
      'error': '❌'
    };
    
    toast.innerHTML = `
      <span class="toast-icon">${iconos[tipo] || iconos.info}</span>
      <span class="toast-message">${mensaje}</span>
    `;

    toastContainer.appendChild(toast);

    // Mostrar con animación
    setTimeout(() => toast.classList.add('show'), 10);

    // Ocultar después de 3 segundos
    setTimeout(() => {
      toast.classList.remove('show');
      setTimeout(() => toast.remove(), 300);
    }, 3000);
  }
}

// Inicializar página
document.addEventListener('DOMContentLoaded', () => {
  new ResultadosPage();
});

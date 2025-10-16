// Página de Resultados con Filtros Dinámicos - Match Property
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

  renderResumenGenericosMobile() {
    const box = document.getElementById('resumenGenericosMobile');
    if (!box) return;
    const fs = this.filtrosSimplificados || {};

    // Distritos
    const distritos = Array.isArray(fs.distritos_ids) && fs.distritos_ids.length > 0
      ? fs.distritos_ids.map(id => this.distritos.find(d => d.id === id)?.nombre).filter(Boolean).join(', ')
      : (fs.distrito_id ? (this.distritos.find(d => d.id === fs.distrito_id)?.nombre || '') : '—');

    // Tipo de inmueble
    const tipoInmueble = fs.tipo_inmueble_id
      ? (this.tiposInmuebles.find(t => t.id === fs.tipo_inmueble_id)?.nombre || '—')
      : '—';

    // Área/metraje
    const metragem = fs.area ? `${fs.area} m²` : '—';

    // Condición (compra/alquiler)
    const condicion = fs.transaccion ? (fs.transaccion === 'compra' ? 'Compra' : 'Alquiler') : '—';

    // Presupuesto (dependiendo de transacción)
    let presupuesto = '—';
    if (fs.transaccion === 'compra' && fs.presupuesto_compra) {
      presupuesto = `${Number(fs.presupuesto_compra).toLocaleString()} USD`;
    } else if (fs.transaccion === 'alquiler' && fs.presupuesto_alquiler) {
      presupuesto = `${Number(fs.presupuesto_alquiler).toLocaleString()} USD/mes`;
    }

    box.innerHTML = `
      <div class="item"><span>Distrito(s)</span><strong>${distritos || '—'}</strong></div>
      <div class="item"><span>Tipo Inmueble</span><strong>${tipoInmueble}</strong></div>
      <div class="item"><span>Área</span><strong>${metragem}</strong></div>
      <div class="item"><span>Transacción</span><strong>${condicion}</strong></div>
      <div class="item"><span>Presupuesto</span><strong>${presupuesto}</strong></div>
    `;
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
        drawer.setAttribute('aria-hidden','false'); 
      }
      if (backdrop) {
        backdrop.classList.add('active');
      }
    };
    
    const close = () => { 
      if (drawer) { 
        drawer.classList.remove('open'); 
        drawer.setAttribute('aria-hidden','true'); 
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
    // 1. Cargar datos del backend PRIMERO
    await this.cargarDatos();

    // 2. Cargar configuración del usuario
    this.cargarUsuarioLogueado();
    this.cargarFavoritos();
    this.cargarFiltrosSimplificados();

    // 3. Aplicar filtros
    this.aplicarFiltrosIniciales();
    this.mostrarImagenReferencial();

    // 4. Configurar eventos
    this.setupEventListeners();
    this.setupHamburgerMenu();
    this.setupPresupuesto();

    // 5. Mostrar layout de 3 columnas
    this.mostrarLayoutTresColumnas();

    // 6. Configurar drawer móvil
    this.setupMobileFilters();

    // 7. En móvil, forzar mostrar mapa y resultados
    if (window.innerWidth <= 1024) {
      console.log('🔧 Modo móvil detectado, configurando vista...');
      
      // Ocultar imagenReferencial y mostrar mainContainer
      const imagenRef = document.getElementById('imagenReferencial');
      const mainContainer = document.getElementById('mainContainer');
      const mapPlaceholder = document.getElementById('mapPlaceholder');
      const mapCanvas = document.getElementById('map');
      const propertiesList = document.getElementById('propertiesList');
      const placeholderResultados = document.getElementById('placeholderResultados');
      
      if (imagenRef) imagenRef.style.display = 'none';
      if (mainContainer) mainContainer.style.display = 'grid';
      
      // Ocultar placeholders y mostrar contenido real
      if (mapPlaceholder) mapPlaceholder.style.display = 'none';
      if (placeholderResultados) placeholderResultados.style.display = 'none';
      if (mapCanvas) mapCanvas.style.display = 'block';
      if (propertiesList) propertiesList.style.display = 'flex';
      
      console.log('📍 Renderizando resultados y mapa...');
      
      // Renderizar contenido
      this.renderResultados();
      
      // Esperar un momento antes de inicializar el mapa
      setTimeout(() => {
        this.renderMapa();
        
        // Forzar invalidateSize del mapa después de inicializar
        setTimeout(() => {
          if (this.map) {
            console.log('🗺️ Ajustando tamaño del mapa...');
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
      console.log('📡 Cargando datos del backend...');
      const [propiedadesRes, caracteristicasRes, tiposRes, distritosRes, configFiltrosRes] = await Promise.all([
        fetch('data/propiedades.json'),
        fetch('data/caracteristicas.json'),
        fetch('data/tipos-inmuebles.json'),
        fetch('data/distritos.json'),
        fetch('data/caracteristicas_x_filtro.json')
      ]);

      const propiedadesData = await propiedadesRes.json();
      const caracteristicasData = await caracteristicasRes.json();
      const tiposData = await tiposRes.json();
      const distritosData = await distritosRes.json();
      const configFiltrosData = await configFiltrosRes.json();

      this.propiedades = propiedadesData.propiedades;
      this.caracteristicas = caracteristicasData.caracteristicas;
      this.tiposInmuebles = tiposData.tipos;
      this.distritos = distritosData.distritos;
      this.configFiltros = configFiltrosData;

      console.log('✅ Datos cargados:');
      console.log('   - Propiedades:', this.propiedades.length);
      console.log('   - Características:', this.caracteristicas.length);
      console.log('   - Tipos Inmuebles:', this.tiposInmuebles.length);
      console.log('   - Distritos:', this.distritos.length);
      console.log('   - Config Filtros:', this.configFiltros ? 'OK' : 'ERROR');
    } catch (error) {
      console.error('❌ Error cargando datos:', error);
    }
  }

  cargarFiltrosSimplificados() {
    const filtrosStr = localStorage.getItem('filtros_simplificados');
    if (filtrosStr) {
      this.filtrosSimplificados = JSON.parse(filtrosStr);
      console.log('✅ Filtros cargados desde localStorage:', this.filtrosSimplificados);
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
        console.log('✅ Filtros adicionales cargados:', this.filtrosAdicionales);
      } catch (e) {
        console.log('⚠️ Error cargando filtros adicionales');
      }
    }
  }

  aplicarFiltrosIniciales() {
    if (!this.filtrosSimplificados) {
      this.propiedadesFiltradas = this.propiedades;
      return;
    }

    this.propiedadesFiltradas = this.propiedades.filter(prop => {
      // Filtro por distritos múltiples
      if (Array.isArray(this.filtrosSimplificados.distritos_ids) && this.filtrosSimplificados.distritos_ids.length > 0) {
        if (!this.filtrosSimplificados.distritos_ids.includes(prop.distrito_id)) {
          return false;
        }
      } else if (this.filtrosSimplificados.distrito_id) {
        // Compatibilidad hacia atrás por si viene un solo distrito_id
        if (prop.distrito_id !== this.filtrosSimplificados.distrito_id) {
          return false;
        }
      }

      // Filtro por tipo de inmueble
      if (this.filtrosSimplificados.tipo_inmueble_id) {
        if (prop.tipo_inmueble_id !== this.filtrosSimplificados.tipo_inmueble_id) {
          return false;
        }
      }

      // Filtro por metraje (±15%)
      if (this.filtrosSimplificados.metraje) {
        const margen = this.filtrosSimplificados.metraje * 0.15;
        if (prop.area < (this.filtrosSimplificados.metraje - margen) ||
            prop.area > (this.filtrosSimplificados.metraje + margen)) {
          return false;
        }
      }

      // Filtro por presupuesto según transacción (±15%)
      if (this.filtrosSimplificados.presupuesto) {
        const margen = this.filtrosSimplificados.presupuesto * 0.15;

        if (this.filtrosSimplificados.transaccion === 'compra' && prop.precio_venta) {
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

        if (!content) return;

        const wasExpanded = e.currentTarget.getAttribute('aria-expanded') === 'true';

        // Toggle current panel
        if (wasExpanded) {
          e.currentTarget.setAttribute('aria-expanded', 'false');
          e.currentTarget.classList.remove('active');
          content.classList.remove('open');
        } else {
          e.currentTarget.setAttribute('aria-expanded', 'true');
          e.currentTarget.classList.add('active');
          content.classList.add('open');
        }
      };

      // Guardar referencia al listener y agregarlo
      header._avanzadoListener = clickHandler;
      header.addEventListener('click', clickHandler);

      // También intentar con touchstart para móvil
      if ('ontouchstart' in window) {
        header.addEventListener('touchstart', clickHandler, { passive: false });
      }
    });

    // Pill icon buttons (checkbox filters)
    document.querySelectorAll('.pill-icon[data-tipo="checkbox"]').forEach(pill => {
      pill.addEventListener('click', (e) => {
        const categoria = e.currentTarget.getAttribute('data-cat');
        const caracId = parseInt(e.currentTarget.getAttribute('data-carac-id'));

        // Initialize category if needed
        if (!this.filtrosAdicionales.avanzado[categoria]) {
          this.filtrosAdicionales.avanzado[categoria] = {};
        }

        // Toggle value
        const isActive = this.filtrosAdicionales.avanzado[categoria][caracId] === true;
        if (isActive) {
          delete this.filtrosAdicionales.avanzado[categoria][caracId];
        } else {
          this.filtrosAdicionales.avanzado[categoria][caracId] = true;
        }

        // Update UI
        e.currentTarget.classList.toggle('active');
        e.currentTarget.setAttribute('aria-pressed', !isActive ? 'true' : 'false');

        // Update counter badge
        this.actualizarBadgeCategoria(categoria);

        // Re-render and preview
        this.renderChipsActivos();
        this.debouncedPreview?.();
      });
    });

    // Number inputs (compact)
    document.querySelectorAll('.number-filter-compact input[type="number"]').forEach(inp => {
      inp.addEventListener('input', (e) => {
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
      });
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

  // Captura UI actual hacia estado y recalcula conteo en imagen
  capturarDesdeUI() {
    // Básico
    this.filtrosAdicionales.basico = {
      transaccion: document.querySelector('input[name="transaccion_basico"]:checked')?.value,
      area: document.getElementById('area_basico')?.value,
      parqueos: document.getElementById('parqueos_basico')?.value,
      presupuesto_compra: document.getElementById('presupuesto_compra_basico')?.value,
      presupuesto_alquiler: document.getElementById('presupuesto_alquiler_basico')?.value,
      antiguedad: document.getElementById('antiguedad_basico')?.value,
      implementacion: document.getElementById('implementacion_basico')?.value
    };

    // Avanzado
    const checkboxes = document.querySelectorAll('input[name="caracteristicas_avanzado"]:checked');
    const caracsChecked = Array.from(checkboxes).map(cb => parseInt(cb.value));
    const numbers = Array.from(document.querySelectorAll('input[data-carac-id]'))
      .map(inp => ({ id: parseInt(inp.dataset.caracId), val: parseFloat(inp.value) }))
      .filter(x => !isNaN(x.val) && x.val > 0);
    this.filtrosAdicionales.avanzado = { checkboxes: caracsChecked, numbers };
  }

  actualizarPreview() {
    // Recalcular sin salir de la imagen referencial
    this.capturarDesdeUI();
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

    const chips = [];
    // Básico
    const b = this.filtrosAdicionales.basico;
    if (b?.transaccion) chips.push({ label: `Transacción: ${b.transaccion}`, kind: 'basico', key: 'transaccion' });
    if (b?.area) chips.push({ label: `Área ≥ ${b.area} m²`, kind: 'basico', key: 'area' });
    if (b?.parqueos) chips.push({ label: `Parqueos ≥ ${b.parqueos}`, kind: 'basico', key: 'parqueos' });
    if (b?.presupuesto_compra) chips.push({ label: `Compra ≤ ${Number(b.presupuesto_compra).toLocaleString()} USD`, kind: 'basico', key: 'presupuesto_compra' });
    if (b?.presupuesto_alquiler) chips.push({ label: `Alquiler ≤ ${Number(b.presupuesto_alquiler).toLocaleString()} USD/mes`, kind: 'basico', key: 'presupuesto_alquiler' });
    if (b?.antiguedad) chips.push({ label: `Antigüedad ≤ ${b.antiguedad} años`, kind: 'basico', key: 'antiguedad' });
    if (b?.implementacion) chips.push({ label: `Impl.: ${b.implementacion}`, kind: 'basico', key: 'implementacion' });

    // Avanzado - new category-based structure
    for (const [categoria, filtros] of Object.entries(this.filtrosAdicionales.avanzado)) {
      for (const [caracId, value] of Object.entries(filtros)) {
        const id = parseInt(caracId);
        const carac = this.caracteristicas.find(c => c.id === id);

        if (!carac) continue;

        if (carac.tipo_input === 'checkbox') {
          chips.push({
            label: carac.nombre,
            kind: 'avz_check',
            key: `${categoria}_${id}`,
            categoria
          });
        } else if (carac.tipo_input === 'number') {
          chips.push({
            label: `${carac.nombre} ≥ ${value}${carac.unidad ? ' ' + carac.unidad : ''}`,
            kind: 'avz_num',
            key: `${categoria}_${id}`,
            categoria
          });
        }
      }
    }

    // Avanzado - old structure (backwards compatibility)
    const checked = Array.from(document.querySelectorAll('input[name="caracteristicas_avanzado"]:checked'))
      .map(cb => parseInt(cb.value));
    const nombresChecked = checked.map(id => ({ id, nombre: this.caracteristicas.find(c => c.id === id)?.nombre })).filter(x => x.nombre);
    nombresChecked.forEach(x => chips.push({ label: x.nombre, kind: 'avz_check', key: String(x.id) }));

    // Pintar chips
    if (chips.length === 0) {
      bar.innerHTML = '<span class="chip muted">Sin filtros adicionales</span>';
    } else {
      bar.innerHTML = chips.map(c => `
        <span class="chip" data-kind="${c.kind}" data-key="${c.key}"${c.categoria ? ` data-categoria="${c.categoria}"` : ''}>
          ${c.label}
          <button type="button" class="chip__close" aria-label="Quitar">×</button>
        </span>
      `).join('');
    }
  }

  mostrarResultados() {
    const imagenRef = document.getElementById('imagenReferencial');
    const mainContainer = document.getElementById('mainContainer');
    const panelFiltros = document.getElementById('panelFiltros');

    // Ocultar imagen y panel de filtros
    imagenRef.style.display = 'none';
    panelFiltros.style.display = 'none';

    // Mostrar resultados
    mainContainer.style.display = 'flex';
    this.mostrandoResultados = true;

    // Renderizar resultados y mapa
    this.renderResultados();
    this.renderMapa();
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
    
    console.log('📦 Contenedores encontrados:');
    console.log('   contenedorBasico:', contBasico ? 'SÍ' : 'NO');
    console.log('   contenedorAvanzado:', contAvanzado ? 'SÍ' : 'NO');
    
    if (contBasico) contBasico.innerHTML = this.generarHTMLFiltroBasico();
    if (contAvanzado) {
      const htmlAvanzado = this.generarHTMLFiltroAvanzado();
      console.log('   HTML avanzado generado:', htmlAvanzado.length, 'chars');
      contAvanzado.innerHTML = htmlAvanzado;
      console.log('   HTML insertado en DOM');
    }
    
    this.attachBasicoInlineListeners();
    
    // Adjuntar listeners de acordeón avanzado DESPUÉS de que el DOM esté listo
    console.log('⏰ Programando attachAvanzadoInlineListeners en 100ms...');
    setTimeout(() => {
      console.log('⏰ ¡Ejecutando setTimeout ahora!');
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

  // Resumen de filtros simplificados en columna izquierda
  renderResumenGenericos() {
    const box = document.getElementById('resumenGenericos');
    if (!box) return;
    const fs = this.filtrosSimplificados || {};

    console.log('🎨 Renderizando resumen genéricos...');
    console.log('   distritos disponibles:', this.distritos.length);
    console.log('   tipos inmuebles disponibles:', this.tiposInmuebles.length);
    console.log('   distritos_ids en filtros:', fs.distritos_ids);
    console.log('   tipo_inmueble_id en filtros:', fs.tipo_inmueble_id);

    // Distritos
    const distritos = Array.isArray(fs.distritos_ids) && fs.distritos_ids.length > 0
      ? fs.distritos_ids.map(id => this.distritos.find(d => d.id === id)?.nombre).filter(Boolean).join(', ')
      : (fs.distrito_id ? (this.distritos.find(d => d.id === fs.distrito_id)?.nombre || '') : '—');

    // Tipo de inmueble
    const tipoInmueble = fs.tipo_inmueble_id
      ? (this.tiposInmuebles.find(t => t.id === fs.tipo_inmueble_id)?.nombre || '—')
      : '—';

    console.log('   distritos calculados:', distritos);
    console.log('   tipo inmueble calculado:', tipoInmueble);

    // Área/metraje
    const metragem = fs.area ? `${fs.area} m²` : '—';

    // Condición (compra/alquiler)
    const condicion = fs.transaccion ? (fs.transaccion === 'compra' ? 'Compra' : 'Alquiler') : '—';

    // Presupuesto (dependiendo de transacción)
    let presupuesto = '—';
    if (fs.transaccion === 'compra' && fs.presupuesto_compra) {
      presupuesto = `${Number(fs.presupuesto_compra).toLocaleString()} USD`;
    } else if (fs.transaccion === 'alquiler' && fs.presupuesto_alquiler) {
      presupuesto = `${Number(fs.presupuesto_alquiler).toLocaleString()} USD/mes`;
    }

    box.innerHTML = `
      <div class="item"><span>Distrito(s)</span><strong>${distritos || '—'}</strong></div>
      <div class="item"><span>Tipo Inmueble</span><strong>${tipoInmueble}</strong></div>
      <div class="item"><span>Área</span><strong>${metragem}</strong></div>
      <div class="item"><span>Transacción</span><strong>${condicion}</strong></div>
      <div class="item"><span>Presupuesto</span><strong>${presupuesto}</strong></div>
    `;
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

    // Abrir "Filtros Genéricos" por defecto en desktop
    const genericosDesktop = document.querySelector('.filters-section .accordion-header[data-accordion="genericos"]');
    if (genericosDesktop) {
      genericosDesktop.setAttribute('aria-expanded', 'true');
      document.querySelector('.filters-section .accordion-content[data-accordion="genericos"]')?.classList.add('open');
    }

    // Verificar estado inicial
    this.verificarMostrarResultadosPorAcordeon();

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
    // Verificar si Filtro Básico o Filtros Avanzados están abiertos
    const basicoAbierto = document.querySelector('.accordion-header[data-accordion="basico"][aria-expanded="true"]') !== null;
    const avanzadoAbierto = document.querySelector('.accordion-header[data-accordion="avanzado"][aria-expanded="true"]') !== null;

    const mostrarResultados = basicoAbierto || avanzadoAbierto;

    const placeholderResultados = document.getElementById('placeholderResultados');
    const propertiesList = document.getElementById('propertiesList');
    const mapPlaceholder = document.getElementById('mapPlaceholder');
    const mapCanvas = document.getElementById('map');

    if (mostrarResultados) {
      // Mostrar resultados y mapa
      if (placeholderResultados) placeholderResultados.style.display = 'none';
      if (propertiesList) propertiesList.style.display = 'flex';
      if (mapPlaceholder) mapPlaceholder.style.display = 'none';
      if (mapCanvas) mapCanvas.style.display = 'block';
      
      // Renderizar resultados y mapa
      this.renderResultados();
      this.renderMapa();
      
      // Forzar que el mapa se redibuje correctamente
      if (this.map) {
        setTimeout(() => {
          this.map.invalidateSize();
        }, 100);
      }
    } else {
      // Mostrar placeholders
      if (placeholderResultados) placeholderResultados.style.display = 'flex';
      if (propertiesList) propertiesList.style.display = 'none';
      if (mapPlaceholder) mapPlaceholder.style.display = 'flex';
      if (mapCanvas) mapCanvas.style.display = 'none';
    }
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

    // Delegación: quitar chips
    const chipsBar = document.getElementById('filtrosAplicados');
    chipsBar?.addEventListener('click', (e) => {
      const btn = e.target.closest('.chip__close');
      if (!btn) return;
      const chip = btn.closest('.chip');
      const kind = chip?.dataset.kind;
      const key = chip?.dataset.key;
      if (!kind) return;

      if (kind === 'basico') {
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
    if (!this.configFiltros || !this.configFiltros.filtros_basicos) {
      return '<p class="mensaje-info">⚠️ Error cargando configuración de filtros</p>';
    }

    const filtros = this.configFiltros.filtros_basicos;
    
    // Inicializar transacción desde filtros simplificados si existe
    if (this.filtrosSimplificados?.transaccion && !this.filtrosAdicionales.basico.transaccion) {
      this.filtrosAdicionales.basico.transaccion = this.filtrosSimplificados.transaccion;
    }
    
    // Inicializar área desde filtros simplificados si existe
    if (this.filtrosSimplificados?.area && !this.filtrosAdicionales.basico.area) {
      this.filtrosAdicionales.basico.area = this.filtrosSimplificados.area;
    }
    
    // Inicializar presupuesto desde filtros simplificados si existe
    if (this.filtrosSimplificados?.presupuesto_compra && !this.filtrosAdicionales.basico.precio_compra) {
      this.filtrosAdicionales.basico.precio_compra = this.filtrosSimplificados.presupuesto_compra;
    }
    if (this.filtrosSimplificados?.presupuesto_alquiler && !this.filtrosAdicionales.basico.precio_alquiler) {
      this.filtrosAdicionales.basico.precio_alquiler = this.filtrosSimplificados.presupuesto_alquiler;
    }
    
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
        <div class="form-group" data-filtro-group="${filtro.id}">
          <label for="${filtro.id}_basico">${filtro.nombre}</label>
          <input 
            type="number" 
            id="${filtro.id}_basico" 
            class="form-control" 
            placeholder="${filtro.placeholder || ''}" 
            value="${value}"
            data-filtro-id="${filtro.id}"
          >
        </div>
      `;
    }
    
    if (filtro.tipo_input === 'select') {
      return `
        <div class="form-group">
          <label for="${filtro.id}_basico">${filtro.nombre}</label>
          <select 
            id="${filtro.id}_basico" 
            class="form-control"
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
        console.log('🔧 Adjuntando listeners desde mostrarFiltroAvanzado...');
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
      'AREAS_COMUNES_EDIFICIO': '🏢 Áreas Comunes del Edificio',
      'ASCENSORES': '🛗 Ascensores',
      'IMPLEMENTACION_DETALLE': '🔧 Implementación / Detalle',
      'SOPORTE_EDIFICIO': '⚡ Soporte del Edificio',
      'CERCANIA_ESTRATEGICA': '📍 Cercanía Estratégica',
      'VISTA_OFICINA': '🏙️ Vista de la Oficina'
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
    // Los valores ya están en this.filtrosAdicionales.basico gracias a los listeners
    // Solo necesitamos aplicar los filtros
    
    // Aplicar filtros
    this.aplicarFiltrosIniciales();
    this.aplicarFiltrosBasicos();
    this.aplicarFiltrosAvanzados();

    // Guardar estado
    this.guardarFiltrosAdicionales();

    // Mostrar resultados
    this.mostrarResultados();
  }

  aplicarFiltrosBasicos() {
    const filtros = this.filtrosAdicionales.basico;
    
    // Si no hay filtros básicos, salir
    if (Object.keys(filtros).length === 0) {
      return;
    }

    this.propiedadesFiltradas = this.propiedadesFiltradas.filter(prop => {
      // Filtro por transacción (compra/alquiler)
      if (filtros.transaccion === 'compra') {
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
        if (prop.parqueos < (parqueosBuscados - margen) || prop.parqueos > (parqueosBuscados + margen)) {
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
    this.filtrosAdicionales = {
      basico: {},
      avanzado: {}
    };
    
    // Recargar el panel actual
    const titulo = document.getElementById('tituloFiltro').textContent;
    if (titulo.includes('Básico')) {
      this.mostrarFiltroBasico();
    } else {
      this.mostrarFiltroAvanzado();
    }
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
          <p>Intenta ajustar tus filtros de búsqueda</p>
          <a href="busqueda.html" class="btn btn-primary">Volver a Buscar</a>
        </div>
      `;
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

    const html = propiedadesPagina.map((prop, index) => `
      <div class="property-card" data-property-id="${prop.id}">
        <div class="property-number">${startIndex + index + 1}</div>
        <button class="favorite-btn" data-property-id="${prop.id}" aria-label="Marcar favorito">${this.favoritos.includes(prop.id) ? '❤' : '♡'}</button>
        <div class="property-image-carousel">
          <div class="carousel-images" data-current="0">
            ${prop.imagenes.map((img, i) => `
              <img src="${img}" alt="${prop.titulo} - imagen ${i+1}" class="carousel-image ${i === 0 ? 'active' : ''}" data-index="${i}">
            `).join('')}
          </div>
          ${prop.imagenes.length > 1 ? `
            <button class="carousel-prev" data-property-id="${prop.id}">‹</button>
            <button class="carousel-next" data-property-id="${prop.id}">›</button>
            <div class="carousel-indicators">
              ${prop.imagenes.map((_, i) => `
                <span class="indicator ${i === 0 ? 'active' : ''}" data-index="${i}"></span>
              `).join('')}
            </div>
          ` : ''}
        </div>
        <div class="property-info">
          <h3 class="property-title">${prop.titulo}</h3>
          <div class="property-location">📍 ${prop.direccion}</div>
          <div class="property-price">${this.renderPrecio(prop)}</div>
          <div class="property-features">
            <span class="feature">📐 ${prop.area} m²</span>
            <span class="feature">🚗 ${prop.parqueos} parqueos</span>
            <span class="feature">⏱️ ${prop.antiguedad} años</span>
            <span class="feature">🔧 ${prop.implementacion}</span>
          </div>
          <p class="property-description">${prop.descripcion}</p>
          ${!this.usuarioLogueado ? `
            <div class="contact-locked">
              🔒 <a href="#" class="login-link" data-property-id="${prop.id}">Inicia sesión para ver contacto</a>
            </div>
          ` : `
            <div class="contact-info">
              <div class="contact-item">📱 +51 999457538</div>
              <div class="contact-item">📧 info@match.pe</div>
            </div>
          `}
        </div>
      </div>
    `).join('');

    container.innerHTML = html;
    this.setupCardListeners();

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

  setupCardListeners() {
    // Hover sobre cards
    document.querySelectorAll('.property-card').forEach(card => {
      card.addEventListener('mouseenter', (e) => {
        const propId = e.currentTarget.dataset.propertyId;
        this.activarPropiedad(propId);
      });

      card.addEventListener('mouseleave', () => {
        this.desactivarTodo();
      });
    });

    // Carruseles
    document.querySelectorAll('.carousel-prev').forEach(btn => {
      btn.addEventListener('click', (e) => {
        e.stopPropagation();
        const propId = e.currentTarget.dataset.propertyId;
        this.cambiarImagen(propId, -1);
      });
    });

    document.querySelectorAll('.carousel-next').forEach(btn => {
      btn.addEventListener('click', (e) => {
        e.stopPropagation();
        const propId = e.currentTarget.dataset.propertyId;
        this.cambiarImagen(propId, 1);
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
        const propId = parseInt(e.currentTarget.dataset.propertyId);
        const idx = this.favoritos.indexOf(propId);
        if (idx >= 0) {
          this.favoritos.splice(idx, 1);
        } else {
          this.favoritos.push(propId);
        }
        this.guardarFavoritos();
        // Actualizar icono en botón
        e.currentTarget.textContent = this.favoritos.includes(propId) ? '❤' : '♡';
      });
    });
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
        this.map = L.map('map').setView([-12.0464, -77.0428], 13);
        L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
          attribution: '© OpenStreetMap contributors',
          maxZoom: 19
        }).addTo(this.map);
        
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
      const customIcon = L.divIcon({
        className: 'custom-marker',
        html: `<div class="marker-number" data-marker-id="${prop.id}">${index + 1}</div>`,
        iconSize: [40, 40],
        iconAnchor: [20, 20]
      });

      const marker = L.marker([prop.lat, prop.lng], { icon: customIcon })
        .addTo(this.map)
        .bindPopup(`
          <div class="marker-popup">
            <strong>${prop.titulo}</strong><br>
            <small>📍 ${prop.direccion}</small><br>
            <strong class="popup-price">USD ${prop.precio_venta?.toLocaleString() || prop.precio_alquiler?.toLocaleString()}</strong>
          </div>
        `);

      marker.on('click', () => {
        this.activarPropiedad(prop.id);
        this.scrollToCard(prop.id);
      });

      marker.on('mouseover', () => this.activarPropiedad(prop.id));
      marker.on('mouseout', () => this.desactivarTodo());

      marker.propertyId = prop.id;
      this.markers.push(marker);
    });

    // Ajustar zoom para mostrar todos los marcadores
    if (this.markers.length > 0) {
      const group = L.featureGroup(this.markers);
      this.map.fitBounds(group.getBounds().pad(0.1), {
        maxZoom: 15,  // Limitar el zoom máximo para que no se aleje demasiado
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

  cambiarImagen(propId, direccion) {
    const card = document.querySelector(`.property-card[data-property-id="${propId}"]`);
    const carousel = card.querySelector('.carousel-images');
    const imagenes = carousel.querySelectorAll('.carousel-image');
    const indicadores = card.querySelectorAll('.indicator');

    let currentIndex = parseInt(carousel.dataset.current);
    const totalImagenes = imagenes.length;

    currentIndex = (currentIndex + direccion + totalImagenes) % totalImagenes;

    imagenes.forEach((img, i) => img.classList.toggle('active', i === currentIndex));
    indicadores.forEach((ind, i) => ind.classList.toggle('active', i === currentIndex));

    carousel.dataset.current = currentIndex;
  }
}

// Inicializar página
document.addEventListener('DOMContentLoaded', () => {
  new ResultadosPage();
});

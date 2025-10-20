// Home Page - Match Property
class HomePage {
  constructor() {
    this.distritos = [];
    this.tiposInmuebles = [];
    this.datosModalCargados = false;
    this.init();
  }

  async init() {
    await this.loadTextos();
    this.renderFeatures();
    this.renderServices();
    this.renderFooter();
    this.setupHamburgerMenu();
    this.setupBusquedaScroll();
    this.checkOpenModal();
  }

  setupHamburgerMenu() {
    const hamburger = document.getElementById('hamburger');
    const navMenu = document.getElementById('navMenu');

    if (hamburger && navMenu) {
      hamburger.addEventListener('click', () => {
        hamburger.classList.toggle('active');
        navMenu.classList.toggle('active');
      });

      // Cerrar menú al hacer click en un enlace
      navMenu.querySelectorAll('a').forEach(link => {
        link.addEventListener('click', () => {
          hamburger.classList.remove('active');
          navMenu.classList.remove('active');
        });
      });

      // Cerrar menú al hacer click fuera
      document.addEventListener('click', (e) => {
        if (!hamburger.contains(e.target) && !navMenu.contains(e.target)) {
          hamburger.classList.remove('active');
          navMenu.classList.remove('active');
        }
      });
    }
  }

  async loadTextos() {
    try {
      const response = await fetch('data/textos-landing.json');
      this.textos = await response.json();
    } catch (error) {
      console.error('Error cargando textos:', error);
    }
  }

  renderFeatures() {
    const grid = document.getElementById('featuresGrid');
    if (!grid || !this.textos) return;

    const html = this.textos.features.map(feature => `
      <div class="feature-card">
        <div class="feature-icon">${feature.icono}</div>
        <h3>${feature.titulo}</h3>
        <p>${feature.descripcion}</p>
      </div>
    `).join('');

    grid.innerHTML = html;
  }

  renderServices() {
    const grid = document.getElementById('servicesGrid');
    if (!grid || !this.textos) return;

    const html = this.textos.servicios.map(servicio => `
      <div class="service-card">
        <div class="service-icon">${servicio.icono}</div>
        <h3>${servicio.titulo}</h3>
      </div>
    `).join('');

    grid.innerHTML = html;
  }

  renderFooter() {
    if (!this.textos) return;

    // Misión en footer
    const misionEl = document.getElementById('footerMision');
    if (misionEl) {
      misionEl.textContent = this.textos.sobre.mision;
    }

    // Contacto en footer
    const direccionEl = document.getElementById('footerDireccion');
    const telefonoEl = document.getElementById('footerTelefono');
    const emailEl = document.getElementById('footerEmail');

    if (direccionEl) direccionEl.innerHTML = `📍 ${this.textos.contacto.direccion}`;
    if (telefonoEl) telefonoEl.innerHTML = `📞 ${this.textos.contacto.telefono}`;
    if (emailEl) emailEl.innerHTML = `📧 ${this.textos.contacto.email}`;
  }

  setupBusquedaScroll() {
    const btnBuscarHero = document.getElementById('btnBuscarHero');
    const btnBuscarNav = document.getElementById('btnBuscarNav');
    const modalBusqueda = document.getElementById('modalBusqueda');
    const btnCerrarModal = document.getElementById('btnCerrarModal');

    const abrirModal = async (e) => {
      e.preventDefault();
      
      if (modalBusqueda) {
        // Mostrar modal
        modalBusqueda.style.display = 'flex';
        document.body.classList.add('modal-open');
        document.body.style.overflow = 'hidden';
        
        // Cargar datos si no están cargados
        if (!this.datosModalCargados) {
          await this.cargarDatosModal();
        }
      }
    };

    const cerrarModal = () => {
      if (modalBusqueda) {
        // Agregar clase de cierre para animación
        modalBusqueda.classList.add('closing');
        
        // Esperar a que termine la animación
        setTimeout(() => {
          modalBusqueda.style.display = 'none';
          modalBusqueda.classList.remove('closing');
          document.body.classList.remove('modal-open');
          document.body.style.overflow = '';
        }, 300);
      }
    };

    // Abrir modal
    if (btnBuscarHero) {
      btnBuscarHero.addEventListener('click', abrirModal);
    }

    if (btnBuscarNav) {
      btnBuscarNav.addEventListener('click', abrirModal);
    }

    // Cerrar modal con botón X
    if (btnCerrarModal) {
      btnCerrarModal.addEventListener('click', cerrarModal);
    }

    // Cerrar modal al hacer click en el overlay
    if (modalBusqueda) {
      modalBusqueda.addEventListener('click', (e) => {
        if (e.target === modalBusqueda) {
          cerrarModal();
        }
      });
    }

    // Cerrar modal con tecla ESC
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape' && modalBusqueda.style.display === 'flex') {
        cerrarModal();
      }
    });

    // Guardar referencia para uso externo
    this.abrirModalBusqueda = abrirModal;
  }

  checkOpenModal() {
    // Verificar si hay parámetro en la URL para abrir el modal
    const urlParams = new URLSearchParams(window.location.search);
    const openModal = urlParams.get('openModal');
    
    if (openModal === 'true') {
      // Esperar un poco para que todo esté cargado
      setTimeout(async () => {
        const modalBusqueda = document.getElementById('modalBusqueda');
        if (modalBusqueda) {
          modalBusqueda.style.display = 'flex';
          document.body.classList.add('modal-open');
          document.body.style.overflow = 'hidden';
          
          // Cargar datos del modal
          if (!this.datosModalCargados) {
            await this.cargarDatosModal();
          }
        }
        
        // Limpiar el parámetro de la URL sin recargar la página
        const newUrl = window.location.pathname;
        window.history.replaceState({}, '', newUrl);
      }, 500);
    }
  }

  async cargarDatosModal() {
    try {
      // ✅ Usar configuración global que ya tiene HTTPS
      const API_BASE = window.API_CONFIG.BASE_URL;

      console.log('🔧 API_BASE:', API_BASE); // Debug

      const [distritosRes, tiposRes] = await Promise.all([
        fetch(`${API_BASE}/distritos`),
        fetch(`${API_BASE}/tipos-inmueble`)
      ]);

      if (!distritosRes.ok || !tiposRes.ok) {
        throw new Error('Error en la API');
      }

      this.distritos = await distritosRes.json();
      this.tiposInmuebles = await tiposRes.json();
      
      this.renderDistritosModal();
      this.renderTiposModal();
      this.setupTransaccionChange();
      this.setupFormModal();
      
      this.datosModalCargados = true;
    } catch (error) {
      console.error('Error cargando datos del modal:', error);
    }
  }

  setupTransaccionChange() {
    const selectTransaccion = document.getElementById('transaccion');
    const labelPresupuesto = document.getElementById('labelPresupuesto');
    const helperPresupuesto = document.getElementById('helperPresupuesto');
    
    if (!selectTransaccion || !labelPresupuesto) return;
    
    selectTransaccion.addEventListener('change', (e) => {
      if (e.target.value === 'compra') {
        labelPresupuesto.textContent = 'Presupuesto Compra (USD)';
        if (helperPresupuesto) helperPresupuesto.textContent = 'Tolerancia ±15%';
      } else {
        labelPresupuesto.textContent = 'Presupuesto Alquiler (USD/mes)';
        if (helperPresupuesto) helperPresupuesto.textContent = 'Tolerancia ±15%';
      }
    });
  }

  renderDistritosModal() {
    const optionsContainer = document.getElementById('distritoOptions');
    const tagsContainer = document.getElementById('distritoTags');
    const placeholder = document.getElementById('distritoPlaceholder');
    if (!optionsContainer) return;

    // Ordenar alfabéticamente
    const distritosOrdenados = [...this.distritos].sort((a, b) => 
      a.nombre.localeCompare(b.nombre, 'es')
    );

    const html = distritosOrdenados.map(d => `
      <label class="multi-option">
        <input type="checkbox" value="${d.distrito_id}" data-nombre="${d.nombre}">
        <span>${d.nombre}</span>
      </label>
    `).join('');

    optionsContainer.innerHTML = html;
    
    // Actualizar tags cuando se selecciona/deselecciona
    const updateTags = () => {
      const selected = Array.from(
        optionsContainer.querySelectorAll('input[type="checkbox"]:checked')
      );
      
      if (selected.length === 0) {
        tagsContainer.innerHTML = '';
        placeholder.style.display = '';
      } else {
        placeholder.style.display = 'none';
        const nombres = selected.map(cb => cb.getAttribute('data-nombre'));
        const maxChips = 3;
        const chips = nombres.slice(0, maxChips).map(n => 
          `<span class="multi-select__tag">${n}</span>`
        ).join('');
        const extra = nombres.length > maxChips ? 
          `<span class="multi-select__tag">+${nombres.length - maxChips}</span>` : '';
        tagsContainer.innerHTML = chips + extra;
      }
    };

    // Event listener en cada checkbox
    optionsContainer.querySelectorAll('input[type="checkbox"]').forEach(cb => {
      cb.addEventListener('change', updateTags);
    });
    
    // Setup toggle del panel
    const toggleBtn = document.getElementById('distritoToggle');
    const panel = document.getElementById('distritoPanel');
    const multiContainer = document.getElementById('distritoMulti');
    
    if (toggleBtn && panel) {
      toggleBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        const isHidden = panel.hidden;
        panel.hidden = !isHidden;
        toggleBtn.setAttribute('aria-expanded', !isHidden);
        if (multiContainer) multiContainer.classList.toggle('open');
      });
      
      // Cerrar al hacer click fuera
      document.addEventListener('click', (e) => {
        if (multiContainer && !multiContainer.contains(e.target)) {
          panel.hidden = true;
          toggleBtn.setAttribute('aria-expanded', 'false');
          multiContainer.classList.remove('open');
        }
      });
    }
    
    // Botones Seleccionar todos / Limpiar
    const selectAllBtn = document.getElementById('distritoSelectAll');
    const clearBtn = document.getElementById('distritoClear');
    
    if (selectAllBtn) {
      selectAllBtn.addEventListener('click', () => {
        optionsContainer.querySelectorAll('input[type="checkbox"]').forEach(cb => {
          cb.checked = true;
        });
        updateTags();
      });
    }
    
    if (clearBtn) {
      clearBtn.addEventListener('click', () => {
        optionsContainer.querySelectorAll('input[type="checkbox"]').forEach(cb => {
          cb.checked = false;
        });
        updateTags();
      });
    }
  }

  renderTiposModal() {
    const select = document.getElementById('tipoInmueble');
    if (!select) return;

    const html = this.tiposInmuebles.map(t => 
      `<option value="${t.tipo_inmueble_id}">${t.nombre}</option>`
    ).join('');

    select.innerHTML = `<option value="">Selecciona tipo...</option>` + html;
  }

  setupFormModal() {
    const btnHacerMatch = document.getElementById('btnHacerMatch');
    if (!btnHacerMatch) return;

    btnHacerMatch.addEventListener('click', () => {
      // Obtener distritos seleccionados (checkboxes)
      const distritosSeleccionados = Array.from(
        document.querySelectorAll('#distritoOptions input[type="checkbox"]:checked')
      ).map(cb => parseInt(cb.value));

      const tipo = document.getElementById('tipoInmueble').value;
      const transaccion = document.getElementById('transaccion')?.value || 'compra';
      const metraje = document.getElementById('metraje')?.value;
      const presupuesto = document.getElementById('presupuesto')?.value;

      if (distritosSeleccionados.length === 0 || !tipo) {
        alert('Por favor selecciona al menos un distrito y un tipo de inmueble');
        return;
      }

      const filtros = {
        pais: 'PERU',
        departamento: 'LIMA',
        provincia: 'LIMA',
        distritos_ids: distritosSeleccionados,
        tipo_inmueble_id: parseInt(tipo),
        transaccion: transaccion,
        area: metraje ? parseInt(metraje) : null,
        presupuesto_compra: transaccion === 'compra' && presupuesto ? parseInt(presupuesto) : null,
        presupuesto_alquiler: transaccion === 'alquiler' && presupuesto ? parseInt(presupuesto) : null
      };

      localStorage.setItem('filtros_simplificados', JSON.stringify(filtros));
      window.location.href = 'resultados.html';
    });
  }
}

// Inicializar página
document.addEventListener('DOMContentLoaded', () => {
  // Manejar video de intro
  const introVideo = document.getElementById('introVideo');
  const loadingScreen = document.querySelector('.loading-screen');
  
  // Verificar si el video ya se mostró antes (localStorage)
  const videoYaMostrado = localStorage.getItem('matchPropertyVideoMostrado');
  
  if (videoYaMostrado === 'true') {
    // Si ya se mostró, saltar directamente al home
    if (loadingScreen) {
      loadingScreen.classList.add('hidden');
      document.body.classList.add('video-finished');
    }
    // DETENER el video completamente
    if (introVideo) {
      introVideo.pause();
      introVideo.currentTime = 0;
      introVideo.src = ''; // Liberar el recurso
    }
    // Inicializar home page
    new HomePage();
    return; // Salir de la función
  }
  
  if (introVideo) {
    // Intentar reproducir el video automáticamente
    const playPromise = introVideo.play();
    
    if (playPromise !== undefined) {
      playPromise.then(() => {
        console.log('✅ Video reproduciéndose automáticamente');
      }).catch((error) => {
        console.warn('⚠️ Autoplay bloqueado, requiere interacción del usuario:', error);
        // Mostrar indicador de click para reproducir
        loadingScreen.style.cursor = 'pointer';
        const playIndicator = document.createElement('div');
        playIndicator.className = 'play-indicator';
        playIndicator.innerHTML = '<i class="fa-solid fa-play"></i><p>Click para reproducir</p>';
        loadingScreen.appendChild(playIndicator);
      });
    }
    
    // Cuando el video termina, ocultar loading screen y mostrar home
    introVideo.addEventListener('ended', () => {
      console.log('✅ Video terminado, mostrando home...');
      introVideo.pause();
      introVideo.currentTime = 0;
      introVideo.src = ''; // Liberar el recurso
      loadingScreen.classList.add('hidden');
      document.body.classList.add('video-finished');
      // Marcar video como mostrado en localStorage
      localStorage.setItem('matchPropertyVideoMostrado', 'true');
    });
    
    // Manejo de errores del video
    introVideo.addEventListener('error', (e) => {
      console.error('❌ Error cargando video:', e);
      // Si hay error, mostrar home inmediatamente
      loadingScreen.classList.add('hidden');
      document.body.classList.add('video-finished');
    });
    
    // Permitir saltar el video haciendo click
    loadingScreen.addEventListener('click', () => {
      if (introVideo.paused) {
        console.log('▶️ Reproduciendo video...');
        introVideo.play();
        const playIndicator = loadingScreen.querySelector('.play-indicator');
        if (playIndicator) playIndicator.remove();
      } else {
        console.log('⏭️ Video saltado por el usuario');
        introVideo.pause();
        introVideo.currentTime = 0;
        introVideo.src = ''; // Liberar el recurso
        loadingScreen.classList.add('hidden');
        document.body.classList.add('video-finished');
        // Marcar video como mostrado en localStorage
        localStorage.setItem('matchPropertyVideoMostrado', 'true');
      }
    });
  } else {
    // Si no hay video, ocultar loading screen inmediatamente
    if (loadingScreen) {
      loadingScreen.classList.add('hidden');
      document.body.classList.add('video-finished');
    }
  }
  
  // Inicializar home page
  new HomePage();
});

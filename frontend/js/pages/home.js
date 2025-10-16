// Home Page - Match Property
class HomePage {
  constructor() {
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

    const abrirModal = (e) => {
      e.preventDefault();
      
      if (modalBusqueda) {
        // Mostrar modal
        modalBusqueda.style.display = 'flex';
        document.body.classList.add('modal-open');
        
        // Prevenir scroll en el fondo
        document.body.style.overflow = 'hidden';
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
      setTimeout(() => {
        const modalBusqueda = document.getElementById('modalBusqueda');
        if (modalBusqueda) {
          modalBusqueda.style.display = 'flex';
          document.body.classList.add('modal-open');
          document.body.style.overflow = 'hidden';
        }
        
        // Limpiar el parámetro de la URL sin recargar la página
        const newUrl = window.location.pathname;
        window.history.replaceState({}, '', newUrl);
      }, 500);
    }
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

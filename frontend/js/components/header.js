/**
 * 📌 Header Component - Qadrante
 * Componente reutilizable de header con navegación y menú de usuario
 */

class HeaderComponent {
  constructor() {
    this.headerElement = null;
    this.currentUser = null;
    this.currentPage = this.getCurrentPage();
  }

  /**
   * 🚀 Inicializar el header
   */
  async init() {
    try {
      console.log('🚀 HeaderComponent.init() - Iniciando...');

      // ✅ FIX: Si el header ya existe en el DOM (hardcoded), no intentar cargarlo
      const existingHeader = document.querySelector('.dashboard-header');
      if (!existingHeader) {
        console.log('📥 Header no existe, cargando HTML...');
        await this.loadHeaderHTML();
      } else {
        console.log('✅ Header ya existe en el DOM (hardcoded), omitiendo carga');
      }

      // Verificar si hay sesión
      if (authService && authService.isAuthenticated()) {
        console.log('👤 Usuario autenticado, configurando header...');
        await this.loadUserData();
        this.setupEventListeners();
        this.highlightCurrentPage();
        console.log('✅ Header configurado completamente');
      } else {
        console.log('⚠️ Usuario no autenticado, mostrando header público');
        this.showPublicHeader();
      }

    } catch (error) {
      console.error('❌ Error inicializando header:', error);
    }
  }

  /**
   * 📥 Cargar el HTML del header desde el componente
   */
  async loadHeaderHTML() {
    try {
      const response = await fetch('components/header.html');
      if (!response.ok) {
        throw new Error('No se pudo cargar el header');
      }

      const html = await response.text();

      // Insertar el header al inicio del body
      document.body.insertAdjacentHTML('afterbegin', html);

      this.headerElement = document.querySelector('.dashboard-header');

    } catch (error) {
      console.error('❌ Error cargando header HTML:', error);
      throw error;
    }
  }

  /**
   * 👤 Cargar datos del usuario
   */
  async loadUserData() {
    try {
      // Obtener usuario del storage primero
      const storedUser = authService.getCurrentUser();
      if (storedUser) {
        this.displayUserInfo(storedUser);
      }

      // Luego obtener datos frescos del backend
      const freshUser = await authService.getMyProfile();
      this.currentUser = freshUser;
      this.displayUserInfo(freshUser);

      // Mostrar/ocultar "Registrar Propiedad" según perfil (desktop y móvil)
      const registrarLink = document.getElementById('registrarLink');
      const registrarLinkMobile = document.getElementById('registrarLinkMobile');
      if (freshUser.perfil_id === 2 || freshUser.perfil_id === 4) {
        if (registrarLink) registrarLink.style.display = 'block';
        if (registrarLinkMobile) registrarLinkMobile.style.display = 'flex';
      }

      // 🔥 Ocultar botón de iniciar sesión en menú móvil (usuario autenticado)
      const loginBtnMobile = document.getElementById('loginBtnMobile');
      if (loginBtnMobile) loginBtnMobile.style.display = 'none';

    } catch (error) {
      console.error('❌ Error cargando datos del usuario:', error);

      // Intentar con datos del storage
      const storedUser = authService.getCurrentUser();
      if (storedUser) {
        this.displayUserInfo(storedUser);
      }
    }
  }

  /**
   * 🎨 Mostrar información del usuario
   */
  displayUserInfo(user) {
    const userName = document.getElementById('userName');
    const userRole = document.getElementById('userRole');
    const userAvatar = document.getElementById('userAvatar');
    const avatarInitials = document.getElementById('avatarInitials');

    if (!userName || !userRole) return;

    // Nombre completo (solo nombre, sin apellido)
    const fullName = user.nombre || 'Usuario';
    userName.textContent = fullName;

    // Rol/Perfil
    const perfilNames = {
      1: 'Demandante',
      2: 'Ofertante',
      3: 'Corredor',
      4: 'Administrador'
    };
    userRole.textContent = perfilNames[user.perfil_id] || 'Usuario';

    // Avatar - Actualizado para usar avatar_url o avatar_local
    const avatarSource = user.foto_perfil || user.avatar_url || user.avatar_local;
    if (avatarSource) {
      const img = document.createElement('img');
      img.src = avatarSource;
      img.alt = user.nombre;
      img.className = 'user-avatar-img';
      userAvatar.innerHTML = '';
      userAvatar.appendChild(img);
    } else {
      // Generar iniciales (primeras 2 letras del nombre o las iniciales si tiene espacio)
      const nameParts = user.nombre ? user.nombre.split(' ') : ['U'];
      let initials = '';
      if (nameParts.length > 1) {
        // Si tiene nombre y apellido, tomar las iniciales
        initials = nameParts.slice(0, 2).map(n => n.charAt(0)).join('');
      } else {
        // Si solo tiene un nombre, tomar las primeras 2 letras
        initials = (nameParts[0] || 'U').substring(0, 2);
      }
      avatarInitials.textContent = initials.toUpperCase();
    }
  }

  /**
   * 🎯 Resaltar página actual en la navegación
   */
  highlightCurrentPage() {
    const navLinks = document.querySelectorAll('.nav-link');

    navLinks.forEach(link => {
      link.classList.remove('active');

      // Verificar si el href coincide con la página actual
      const href = link.getAttribute('href');
      if (href && (href === this.currentPage || href === `./${this.currentPage}`)) {
        link.classList.add('active');
      }
    });
  }

  /**
   * 📄 Obtener página actual
   */
  getCurrentPage() {
    const path = window.location.pathname;
    const page = path.split('/').pop() || 'index.html';
    return page;
  }

  /**
   * 🔗 Configurar event listeners
   */
  setupEventListeners() {
    console.log('🔧 Configurando event listeners del header...');

    // ✅ NUEVO: Event delegation desde document para evitar conflictos
    document.addEventListener('click', (e) => {
      // Toggle del menú de usuario
      const userMenuBtn = e.target.closest('#userMenuBtn');
      if (userMenuBtn) {
        e.preventDefault();
        e.stopPropagation();
        console.log('👆 Click en userMenuBtn detectado');

        const userMenu = document.querySelector('.user-menu');
        if (userMenu) {
          const isActive = userMenu.classList.contains('active');
          console.log(`📍 Estado actual: ${isActive ? 'ACTIVO' : 'INACTIVO'}`);
          userMenu.classList.toggle('active');
          console.log(`📍 Estado nuevo: ${userMenu.classList.contains('active') ? 'ACTIVO' : 'INACTIVO'}`);
        }
        return;
      }

      // Cerrar menú al hacer click fuera
      const userMenu = document.querySelector('.user-menu');
      if (userMenu && userMenu.classList.contains('active')) {
        const clickedInsideMenu = e.target.closest('.user-menu');
        if (!clickedInsideMenu) {
          console.log('🔒 Cerrando menú (click fuera)');
          userMenu.classList.remove('active');
        }
      }
    });

    console.log('✅ Event delegation configurado para userMenuBtn');

    // 🧹 Limpiar caché al hacer click en logo/inicio
    document.addEventListener('click', async (e) => {
      const homeLink = e.target.closest('.logo-link, a[href="/"], a[href="index.html"], a[href="/index.html"]');
      
      if (homeLink) {
        e.preventDefault();
        console.log('🏠 Click en Inicio detectado - limpiando caché...');
        
        // Mostrar loading
        Swal.fire({
          title: '🧹 Limpiando caché...',
          text: 'Esto mejorará el rendimiento del sistema',
          allowOutsideClick: false,
          showConfirmButton: false,
          didOpen: () => {
            Swal.showLoading();
          }
        });
        
        // Limpiar toda la caché
        await authService.clearAllCache();
        
        // Redirigir a inicio después de limpiar
        setTimeout(() => {
          window.location.href = '/index.html';
        }, 500);
      }
    });

    console.log('✅ Event listener configurado para limpiar caché en inicio');

    // 🔥 Toggle del menú móvil acordeón
    const hamburgerBtn = document.getElementById('hamburgerBtn');
    const mobileMenu = document.getElementById('mobileMenu');

    if (hamburgerBtn && mobileMenu) {
      hamburgerBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        hamburgerBtn.classList.toggle('active');
        mobileMenu.classList.toggle('active');
      });

      // Cerrar menú móvil al hacer click en un enlace
      const mobileLinks = mobileMenu.querySelectorAll('.mobile-menu-link');
      mobileLinks.forEach(link => {
        link.addEventListener('click', () => {
          hamburgerBtn.classList.remove('active');
          mobileMenu.classList.remove('active');
        });
      });

      // Cerrar menú móvil al hacer click fuera
      document.addEventListener('click', (e) => {
        if (mobileMenu && !mobileMenu.contains(e.target) && !hamburgerBtn.contains(e.target)) {
          hamburgerBtn.classList.remove('active');
          mobileMenu.classList.remove('active');
        }
      });

      // Resaltar página actual en menú móvil
      this.highlightMobileMenu();
    }

    // ✅ Logout con event delegation (funciona para desktop y móvil)
    document.addEventListener('click', async (e) => {
      const logoutBtn = e.target.closest('#logoutBtn, #logoutBtnMobile');
      if (logoutBtn) {
        e.preventDefault();
        e.stopPropagation();
        console.log('🚪 Click en Cerrar Sesión detectado');

        // ✅ SweetAlert2 con diseño corporativo
        const result = await Swal.fire({
          title: '¿Cerrar Sesión?',
          text: '¿Estás seguro que deseas salir del sistema?',
          icon: 'question',
          showCancelButton: true,
          confirmButtonColor: '#2C5282', // azul corporativo
          cancelButtonColor: '#718096', // gris
          confirmButtonText: 'Sí, cerrar sesión',
          cancelButtonText: 'Cancelar',
          reverseButtons: true,
          customClass: {
            popup: 'swal-logout-popup',
            confirmButton: 'swal-logout-confirm',
            cancelButton: 'swal-logout-cancel'
          }
        });

        if (result.isConfirmed) {
          console.log('✅ Confirmado, cerrando sesión...');

          // Mostrar loading mientras cierra sesión
          Swal.fire({
            title: 'Cerrando sesión...',
            text: 'Por favor espera',
            icon: 'info',
            allowOutsideClick: false,
            allowEscapeKey: false,
            showConfirmButton: false,
            didOpen: () => {
              Swal.showLoading();
            }
          });

          // Cerrar sesión
          authService.logout();
        } else {
          console.log('❌ Cancelado por el usuario');
        }
      }
    });

    console.log('✅ Event delegation configurado para logout (desktop + móvil)');

    // ✅ Mi Perfil - Abrir modal en lugar de navegar
    document.addEventListener('click', async (e) => {
      const perfilLink = e.target.closest('#perfilLink');
      if (perfilLink) {
        e.preventDefault();
        e.stopPropagation();
        console.log('👤 Click en Mi Perfil detectado');
        
        // Cerrar dropdown menu
        const userMenu = document.querySelector('.user-menu');
        if (userMenu) {
          userMenu.classList.remove('active');
        }
        
        // Abrir modal de perfil
        try {
          const profileModal = new ProfileModal();
          await profileModal.show();
        } catch (error) {
          console.error('Error al abrir modal de perfil:', error);
          
          // Mostrar error con SweetAlert2
          Swal.fire({
            title: 'Error',
            text: 'No se pudo cargar el perfil. Por favor intenta nuevamente.',
            icon: 'error',
            confirmButtonColor: '#2C5282'
          });
        }
      }
    });

    console.log('✅ Event delegation configurado para Mi Perfil');

    // Notificaciones (placeholder)
    const notificationsBtn = document.getElementById('notificationsBtn');
    if (notificationsBtn) {
      notificationsBtn.addEventListener('click', () => {
        console.log('🔔 Notificaciones - Próximamente');
        // TODO: Implementar sistema de notificaciones
      });
    }
  }

  /**
   * 🎯 Resaltar página actual en menú móvil
   */
  highlightMobileMenu() {
    const mobileLinks = document.querySelectorAll('.mobile-menu-link');

    mobileLinks.forEach(link => {
      link.classList.remove('active');

      // Verificar si el href coincide con la página actual
      const href = link.getAttribute('href');
      if (href && (href === this.currentPage || href === `./${this.currentPage}`)) {
        link.classList.add('active');
      }
    });
  }

  /**
   * 🌐 Mostrar header público (sin autenticación)
   */
  showPublicHeader() {
    // Ocultar elementos que requieren autenticación
    const userMenu = document.querySelector('.user-menu');
    const notificationsBtn = document.getElementById('notificationsBtn');

    if (userMenu) userMenu.style.display = 'none';
    if (notificationsBtn) notificationsBtn.style.display = 'none';

    // Mostrar solo navegación pública
    const mainNav = document.querySelector('.main-nav');
    if (mainNav) {
      mainNav.innerHTML = `
        <a href="index.html" class="nav-link">Inicio</a>
        <a href="busqueda.html" class="nav-link">Buscar</a>
        <a href="login.html" class="nav-link">Iniciar Sesión</a>
      `;
    }

    // 🔥 Mostrar/Ocultar opciones en menú móvil
    const loginBtnMobile = document.getElementById('loginBtnMobile');
    const logoutBtnMobile = document.getElementById('logoutBtnMobile');
    const perfilLinkMobile = document.getElementById('perfilLinkMobile');
    const planLinkMobile = document.getElementById('planLinkMobile');
    const registrarLinkMobile = document.getElementById('registrarLinkMobile');

    // Mostrar iniciar sesión, ocultar opciones de usuario autenticado
    if (loginBtnMobile) loginBtnMobile.style.display = 'flex';
    if (logoutBtnMobile) logoutBtnMobile.style.display = 'none';
    if (perfilLinkMobile) perfilLinkMobile.style.display = 'none';
    if (planLinkMobile) planLinkMobile.style.display = 'none';
    if (registrarLinkMobile) registrarLinkMobile.style.display = 'none';
  }
}

// ✅ Crear instancia global del header
window.headerComponent = null;

// Auto-inicializar el header cuando el DOM esté listo
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', async () => {
    console.log('🎯 Inicializando HeaderComponent (DOMContentLoaded)...');
    window.headerComponent = new HeaderComponent();
    await window.headerComponent.init();
  });
} else {
  // DOM ya está listo
  (async () => {
    console.log('🎯 Inicializando HeaderComponent (DOM ready)...');
    window.headerComponent = new HeaderComponent();
    await window.headerComponent.init();
  })();
}

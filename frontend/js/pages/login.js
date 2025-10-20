/**
 * 🔐 Login Page - Quadrante
 * Integración con Backend API
 */

class LoginPage {
  constructor() {
    this.form = document.getElementById('loginForm');
    this.emailInput = document.getElementById('email');
    this.passwordInput = document.getElementById('password');
    this.rememberCheckbox = document.getElementById('remember');
    this.loginBtn = document.getElementById('loginBtn');
    
    this.init();
  }

  init() {
    // Verificar si ya está autenticado
    if (authService.isAuthenticated()) {
      console.log('✅ Usuario ya autenticado, redirigiendo...');
      window.location.href = 'dashboard.html';
      return;
    }

    this.setupHamburgerMenu();
    this.setupLoginForm();
    this.loadRememberedEmail();
  }

  setupHamburgerMenu() {
    const hamburger = document.getElementById('hamburger');
    const navMenu = document.getElementById('navMenu');

    if (hamburger && navMenu) {
      hamburger.addEventListener('click', () => {
        hamburger.classList.toggle('active');
        navMenu.classList.toggle('active');
      });

      navMenu.querySelectorAll('a').forEach(link => {
        link.addEventListener('click', () => {
          hamburger.classList.remove('active');
          navMenu.classList.remove('active');
        });
      });

      document.addEventListener('click', (e) => {
        if (!hamburger.contains(e.target) && !navMenu.contains(e.target)) {
          hamburger.classList.remove('active');
          navMenu.classList.remove('active');
        }
      });
    }
  }

  loadRememberedEmail() {
    const rememberedEmail = localStorage.getItem('remembered_email');
    if (rememberedEmail) {
      this.emailInput.value = rememberedEmail;
      this.rememberCheckbox.checked = true;
    }
  }

  setupLoginForm() {
    this.form.addEventListener('submit', async (e) => {
      e.preventDefault();
      await this.handleLogin();
    });
  }

  async handleLogin() {
    // Obtener valores
    const email = this.emailInput.value.trim();
    const password = this.passwordInput.value;
    const remember = this.rememberCheckbox.checked;

    // Validar
    if (!this.validateForm(email, password)) {
      return;
    }

    // Mostrar loading
    showLoading(this.loginBtn);

    try {
      // Llamar al servicio de autenticación
      const response = await authService.login(email, password);

      // Guardar email si marcó "Recordarme"
      if (remember) {
        localStorage.setItem('remembered_email', email);
      } else {
        localStorage.removeItem('remembered_email');
      }

      // Mostrar éxito
      const usuario = response.data.usuario;
      showNotification(
        `¡Bienvenido ${usuario.nombre}! Redirigiendo...`,
        'success'
      );

      // Redirigir al dashboard
      setTimeout(() => {
        window.location.href = 'dashboard.html';
      }, 1500);

    } catch (error) {
      hideLoading(this.loginBtn);

      // Manejar errores específicos
      let errorMessage = 'Error al iniciar sesión';

      if (error.message.includes('Credenciales')) {
        errorMessage = 'Email o contraseña incorrectos';
      } else if (error.message.includes('verificar')) {
        errorMessage = 'Debes verificar tu email antes de iniciar sesión';
        // Mostrar opción para reenviar código
        this.showVerificationPrompt(email);
        return;
      } else if (error.message.includes('inactivo') || error.message.includes('suspendido')) {
        // Usuario no ha verificado su email
        errorMessage = 'Debes verificar tu email antes de iniciar sesión';
        showNotification(errorMessage, 'warning');
        // Mostrar opción para reenviar código
        this.showVerificationPrompt(email);
        return;
      }

      showNotification(errorMessage, 'error');
      console.error('❌ Error en login:', error);
    }
  }

  validateForm(email, password) {
    // Validar email
    if (!email) {
      showNotification('Por favor ingresa tu email', 'warning');
      this.emailInput.focus();
      return false;
    }

    if (!isValidEmail(email)) {
      showNotification('Por favor ingresa un email válido', 'warning');
      this.emailInput.focus();
      return false;
    }

    // Validar contraseña
    if (!password) {
      showNotification('Por favor ingresa tu contraseña', 'warning');
      this.passwordInput.focus();
      return false;
    }

    if (password.length < 8) {
      showNotification('La contraseña debe tener al menos 8 caracteres', 'warning');
      this.passwordInput.focus();
      return false;
    }

    return true;
  }

  showVerificationPrompt(email) {
    const resend = confirm(
      'Tu cuenta no está verificada.\n\n¿Deseas que te reenviemos el código de verificación?'
    );

    if (resend) {
      this.resendVerificationCode(email);
    }
  }

  async resendVerificationCode(email) {
    try {
      await authService.resendVerification(email);
      showNotification(
        'Código de verificación enviado. Revisa tu email.',
        'success'
      );
      
      // Redirigir a página de verificación (si existe)
      setTimeout(() => {
        window.location.href = `verificar.html?email=${encodeURIComponent(email)}`;
      }, 2000);
    } catch (error) {
      showNotification('Error al reenviar código', 'error');
      console.error('Error:', error);
    }
  }

}

// Inicializar cuando el DOM esté listo
document.addEventListener('DOMContentLoaded', () => {
  new LoginPage();
});

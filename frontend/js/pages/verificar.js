/**
 * ✅ Verificar Email Page - Match Property
 * Integración con Backend API
 */

class VerificarPage {
  constructor() {
    this.form = document.getElementById('verificarForm');
    this.codigoInput = document.getElementById('codigo');
    this.verificarBtn = document.getElementById('verificarBtn');
    this.reenviarBtn = document.getElementById('reenviarBtn');
    this.emailDisplay = document.getElementById('emailDisplay');
    this.email = null;

    this.init();
  }

  init() {
    this.setupHamburgerMenu();
    this.getEmailFromURL();
    this.setupVerificarForm();
    this.setupReenviarButton();
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

  getEmailFromURL() {
    const urlParams = new URLSearchParams(window.location.search);
    this.email = urlParams.get('email');

    if (!this.email) {
      showNotification('No se encontró email. Redirigiendo al registro...', 'error');
      setTimeout(() => {
        window.location.href = 'registro.html';
      }, 2000);
      return;
    }

    // Mostrar email en el mensaje
    this.emailDisplay.innerHTML = `Hemos enviado un código de verificación a <strong>${this.email}</strong>`;
  }

  setupVerificarForm() {
    this.form.addEventListener('submit', async (e) => {
      e.preventDefault();
      await this.handleVerificar();
    });

    // Auto-mayúsculas y solo números
    this.codigoInput.addEventListener('input', (e) => {
      e.target.value = e.target.value.replace(/[^0-9]/g, '');
    });
  }

  setupReenviarButton() {
    this.reenviarBtn.addEventListener('click', async () => {
      await this.handleReenviar();
    });
  }

  async handleVerificar() {
    const codigo = this.codigoInput.value.trim();

    // Validar código
    if (!this.validateCodigo(codigo)) {
      return;
    }

    // Mostrar loading
    showLoading(this.verificarBtn);

    try {
      // Llamar al servicio de verificación
      const response = await authService.verifyEmail(this.email, codigo);

      // Mostrar éxito
      showNotification(
        '¡Email verificado exitosamente! Redirigiendo al login...',
        'success'
      );

      console.log('✅ Email verificado:', response);

      // Redirigir al login después de 2 segundos
      setTimeout(() => {
        window.location.href = 'login.html';
      }, 2000);

    } catch (error) {
      hideLoading(this.verificarBtn);

      // Manejar errores específicos
      let errorMessage = 'Error al verificar código';

      if (error.message.includes('código') || error.message.includes('code')) {
        errorMessage = 'Código incorrecto o expirado. Intenta nuevamente.';
      } else if (error.message.includes('ya verificado') || error.message.includes('already')) {
        errorMessage = 'Este email ya fue verificado. Puedes iniciar sesión.';
        setTimeout(() => {
          window.location.href = 'login.html';
        }, 2000);
      } else if (error.message) {
        errorMessage = error.message;
      }

      showNotification(errorMessage, 'error');
      console.error('❌ Error en verificación:', error);
    }
  }

  async handleReenviar() {
    // Mostrar loading
    showLoading(this.reenviarBtn);

    try {
      // Llamar al servicio de reenvío
      const response = await authService.resendVerification(this.email);

      // Mostrar éxito
      showNotification(
        'Código reenviado. Revisa tu email.',
        'success'
      );

      console.log('✅ Código reenviado:', response);

      // Ocultar loading después de 2 segundos
      setTimeout(() => {
        hideLoading(this.reenviarBtn);
      }, 2000);

    } catch (error) {
      hideLoading(this.reenviarBtn);

      // Manejar errores específicos
      let errorMessage = 'Error al reenviar código';

      if (error.message.includes('ya verificado')) {
        errorMessage = 'Este email ya fue verificado. Puedes iniciar sesión.';
        setTimeout(() => {
          window.location.href = 'login.html';
        }, 2000);
      } else if (error.message.includes('esperar') || error.message.includes('wait')) {
        errorMessage = 'Por favor espera unos minutos antes de solicitar otro código.';
      } else if (error.message) {
        errorMessage = error.message;
      }

      showNotification(errorMessage, 'error');
      console.error('❌ Error al reenviar:', error);
    }
  }

  validateCodigo(codigo) {
    if (!codigo) {
      showNotification('Por favor ingresa el código', 'warning');
      this.codigoInput.focus();
      return false;
    }

    if (codigo.length !== 6) {
      showNotification('El código debe tener 6 dígitos', 'warning');
      this.codigoInput.focus();
      return false;
    }

    if (!/^\d{6}$/.test(codigo)) {
      showNotification('El código solo debe contener números', 'warning');
      this.codigoInput.focus();
      return false;
    }

    return true;
  }
}

// Inicializar cuando el DOM esté listo
document.addEventListener('DOMContentLoaded', () => {
  new VerificarPage();
});

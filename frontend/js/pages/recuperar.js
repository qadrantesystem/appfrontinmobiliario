/**
 * 🔑 Recuperar Contraseña Page - Match Property
 * Integración con Backend API
 */

class RecuperarPage {
  constructor() {
    // Paso 1 - Solicitar código
    this.solicitarForm = document.getElementById('solicitarForm');
    this.emailInput = document.getElementById('emailRecuperar');
    this.solicitarBtn = document.getElementById('solicitarBtn');

    // Paso 2 - Restablecer con código
    this.restablecerForm = document.getElementById('restablecerForm');
    this.codigoInput = document.getElementById('codigoRecuperar');
    this.nuevaPasswordInput = document.getElementById('nuevaPassword');
    this.confirmarPasswordInput = document.getElementById('confirmarPassword');
    this.restablecerBtn = document.getElementById('restablecerBtn');
    this.reenviarCodigoBtn = document.getElementById('reenviarCodigoBtn');

    // Header
    this.headerText = document.getElementById('headerText');

    // Email guardado
    this.userEmail = null;

    this.init();
  }

  init() {
    this.setupHamburgerMenu();
    this.setupSolicitarForm();
    this.setupRestablecerForm();
    this.setupReenviarCodigo();
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

  setupSolicitarForm() {
    this.solicitarForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      await this.handleSolicitarCodigo();
    });
  }

  setupRestablecerForm() {
    // Auto-format código input (solo números)
    this.codigoInput.addEventListener('input', (e) => {
      e.target.value = e.target.value.replace(/[^0-9]/g, '');
    });

    this.restablecerForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      await this.handleRestablecerPassword();
    });
  }

  setupReenviarCodigo() {
    this.reenviarCodigoBtn.addEventListener('click', async () => {
      await this.handleReenviarCodigo();
    });
  }

  async handleSolicitarCodigo() {
    const email = this.emailInput.value.trim();

    // Validar email
    if (!this.validateEmail(email)) {
      return;
    }

    // Mostrar loading
    showLoading(this.solicitarBtn);

    try {
      // Llamar al servicio de recuperación
      const response = await authService.forgotPassword(email);

      hideLoading(this.solicitarBtn);

      // Guardar email
      this.userEmail = email;

      // Mostrar éxito
      showNotification(
        'Código de recuperación enviado. Revisa tu email.',
        'success'
      );

      console.log('✅ Código enviado:', response);

      // Cambiar a formulario de restablecimiento
      setTimeout(() => {
        this.mostrarFormularioRestablecer();
      }, 1000);

    } catch (error) {
      hideLoading(this.solicitarBtn);

      // Manejar errores específicos
      let errorMessage = 'Error al enviar código de recuperación';

      if (error.message.includes('no encontrado') || error.message.includes('not found')) {
        errorMessage = 'Email no encontrado. Verifica que esté correcto.';
      } else if (error.message) {
        errorMessage = error.message;
      }

      showNotification(errorMessage, 'error');
      console.error('❌ Error enviando código:', error);
    }
  }

  async handleRestablecerPassword() {
    const codigo = this.codigoInput.value.trim();
    const nuevaPassword = this.nuevaPasswordInput.value;
    const confirmarPassword = this.confirmarPasswordInput.value;

    // Validar datos
    if (!this.validateRestablecer(codigo, nuevaPassword, confirmarPassword)) {
      return;
    }

    // Mostrar loading
    showLoading(this.restablecerBtn);

    try {
      // Llamar al servicio de reset password
      const response = await authService.resetPassword(
        this.userEmail,
        codigo,
        nuevaPassword
      );

      // Mostrar éxito
      showNotification(
        '¡Contraseña restablecida exitosamente! Redirigiendo al login...',
        'success'
      );

      console.log('✅ Contraseña restablecida:', response);

      // Redirigir al login después de 2 segundos
      setTimeout(() => {
        window.location.href = 'login.html';
      }, 2000);

    } catch (error) {
      hideLoading(this.restablecerBtn);

      // Manejar errores específicos
      let errorMessage = 'Error al restablecer contraseña';

      if (error.message.includes('código') || error.message.includes('code') || error.message.includes('inválido') || error.message.includes('expirado')) {
        errorMessage = 'Código incorrecto o expirado. Solicita uno nuevo.';
      } else if (error.message.includes('usuario') || error.message.includes('user')) {
        errorMessage = 'Usuario no encontrado.';
      } else if (error.message) {
        errorMessage = error.message;
      }

      showNotification(errorMessage, 'error');
      console.error('❌ Error restableciendo contraseña:', error);
    }
  }

  async handleReenviarCodigo() {
    if (!this.userEmail) {
      showNotification('Error: No hay email registrado', 'error');
      return;
    }

    // Mostrar loading
    showLoading(this.reenviarCodigoBtn);

    try {
      // Reenviar código
      const response = await authService.forgotPassword(this.userEmail);

      // Mostrar éxito
      showNotification(
        'Código reenviado. Revisa tu email.',
        'success'
      );

      console.log('✅ Código reenviado:', response);

      // Ocultar loading después de 2 segundos
      setTimeout(() => {
        hideLoading(this.reenviarCodigoBtn);
      }, 2000);

    } catch (error) {
      hideLoading(this.reenviarCodigoBtn);

      // Manejar errores
      let errorMessage = 'Error al reenviar código';

      if (error.message) {
        errorMessage = error.message;
      }

      showNotification(errorMessage, 'error');
      console.error('❌ Error reenviando código:', error);
    }
  }

  mostrarFormularioRestablecer() {
    // Ocultar formulario de solicitud
    this.solicitarForm.style.display = 'none';

    // Mostrar formulario de restablecimiento
    this.restablecerForm.style.display = 'block';

    // Actualizar header
    this.headerText.textContent = `Hemos enviado un código de 6 dígitos a ${this.userEmail}`;

    // Focus en input de código
    setTimeout(() => {
      this.codigoInput.focus();
    }, 300);
  }

  validateEmail(email) {
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

    return true;
  }

  validateRestablecer(codigo, nuevaPassword, confirmarPassword) {
    // Validar código
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

    // Validar nueva contraseña
    if (!nuevaPassword) {
      showNotification('Por favor ingresa tu nueva contraseña', 'warning');
      this.nuevaPasswordInput.focus();
      return false;
    }

    if (nuevaPassword.length < 8) {
      showNotification('La contraseña debe tener al menos 8 caracteres', 'warning');
      this.nuevaPasswordInput.focus();
      return false;
    }

    // Validar confirmación
    if (nuevaPassword !== confirmarPassword) {
      showNotification('Las contraseñas no coinciden', 'error');
      this.confirmarPasswordInput.focus();
      return false;
    }

    return true;
  }
}

// Inicializar cuando el DOM esté listo
document.addEventListener('DOMContentLoaded', () => {
  new RecuperarPage();
});

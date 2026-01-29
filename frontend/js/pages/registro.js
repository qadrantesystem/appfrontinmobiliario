/**
 * 📝 Registro Page - Qadrante
 * Integración con Backend API + Modal de Verificación
 */

class RegistroPage {
  constructor() {
    this.form = document.getElementById('registroForm');
    this.tipoPersonaSelect = document.getElementById('tipoPersona');
    this.datosEmpresa = document.getElementById('datosEmpresa');
    this.datosCorredor = document.getElementById('datosCorredor');
    this.registroBtn = document.getElementById('registroBtn');
    
    // Profile selector
    this.perfilSelect = document.getElementById('perfil');
    this.perfilWarning = document.getElementById('perfilWarning');
    this.warningTitle = document.getElementById('warningTitle');
    this.warningMessage = document.getElementById('warningMessage');

    // Modal elements
    this.modal = document.getElementById('verificacionModal');
    this.modalEmailText = document.getElementById('modalEmailText');
    this.verificacionForm = document.getElementById('verificacionForm');
    this.codigoInput = document.getElementById('codigoVerificacion');
    this.verificarModalBtn = document.getElementById('verificarModalBtn');
    this.reenviarModalBtn = document.getElementById('reenviarModalBtn');

    // Store registered email
    this.registeredEmail = null;

    this.init();
  }

  init() {
    this.setupHamburgerMenu();
    this.setupPerfilSelector();
    this.setupTipoPersonaToggle();
    this.setupRegistroForm();
    this.setupVerificacionModal();
  }

  setupPerfilSelector() {
    const licenciaCorredor = document.getElementById('licenciaCorredor');
    const aniosExperiencia = document.getElementById('aniosExperiencia');
    
    this.perfilSelect.addEventListener('change', (e) => {
      const perfil = e.target.value;
      
      if (!perfil) {
        this.perfilWarning.style.display = 'none';
        this.datosCorredor.style.display = 'none';
        return;
      }
      
      // Ocultar/mostrar sección de corredor
      if (perfil === '3') {
        this.datosCorredor.style.display = 'block';
        licenciaCorredor.required = true;
        aniosExperiencia.required = true;
      } else {
        this.datosCorredor.style.display = 'none';
        licenciaCorredor.required = false;
        aniosExperiencia.required = false;
      }
      
      // Mostrar advertencias según el perfil
      switch(perfil) {
        case '1': // Demandante
          this.perfilWarning.style.display = 'block';
          this.perfilWarning.className = 'alert-info alert-success';
          this.warningTitle.textContent = 'Acceso Inmediato';
          this.warningMessage.innerHTML = 'Como <strong>Demandante</strong> tendrás acceso inmediato para:<br>' +
            '• Buscar inmuebles en todo el portal<br>' +
            '• Guardar favoritos y búsquedas<br>' +
            '• Recibir notificaciones de nuevas propiedades<br>' +
            '• Contactar con corredores y ofertantes';
          break;
          
        case '2': // Ofertante
          this.perfilWarning.style.display = 'block';
          this.perfilWarning.className = 'alert-info alert-warning';
          this.warningTitle.textContent = '► Requiere Aprobación del Administrador';
          this.warningMessage.innerHTML = 'Como <strong>Ofertante</strong> podrás publicar tus propiedades.<br><br>' +
            '<strong>Importante:</strong> Para poder registrar tu primera propiedad, tu cuenta debe ser aprobada por un administrador.<br>' +
            'Este proceso suele tomar entre 24-48 horas hábiles.<br><br>' +
            'Mientras tanto, podrás buscar propiedades y usar las funciones básicas del portal.';
          break;
          
        case '3': // Corredor
          this.perfilWarning.style.display = 'block';
          this.perfilWarning.className = 'alert-info alert-warning';
          this.warningTitle.textContent = '■ Registro Profesional - Requiere Aprobación';
          this.warningMessage.innerHTML = 'Como <strong>Corredor Inmobiliario</strong> tendrás acceso a herramientas profesionales:<br>' +
            '• Registrar propiedades de terceros<br>' +
            '• Gestionar comisiones<br>' +
            '• Pipeline CRM completo<br>' +
            '• Dashboard de ventas<br><br>' +
            '<strong>Importante:</strong> Necesitarás presentar tu licencia de corredor y tu cuenta será verificada por un administrador (24-48 horas).';
          break;
      }
    });
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

  setupTipoPersonaToggle() {
    const razonSocial = document.getElementById('razonSocial');
    const ruc = document.getElementById('ruc');
    const representanteLegal = document.getElementById('representanteLegal');

    this.tipoPersonaSelect.addEventListener('change', (e) => {
      if (e.target.value === 'juridica') {
        this.datosEmpresa.style.display = 'block';
        razonSocial.required = true;
        ruc.required = true;
        representanteLegal.required = true;
      } else {
        this.datosEmpresa.style.display = 'none';
        razonSocial.required = false;
        ruc.required = false;
        representanteLegal.required = false;
      }
    });
  }

  setupRegistroForm() {
    this.form.addEventListener('submit', async (e) => {
      e.preventDefault();
      await this.handleRegistro();
    });
  }

  setupVerificacionModal() {
    // Auto-format código input (solo números)
    this.codigoInput.addEventListener('input', (e) => {
      e.target.value = e.target.value.replace(/[^0-9]/g, '');
    });

    // Handle verification form submit
    this.verificacionForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      await this.handleVerificacion();
    });

    // Handle resend code button
    this.reenviarModalBtn.addEventListener('click', async () => {
      await this.handleReenviarCodigo();
    });

    // Prevent closing modal by clicking overlay
    this.modal.addEventListener('click', (e) => {
      if (e.target === this.modal) {
        showNotification('Por favor verifica tu email para continuar', 'warning');
      }
    });
  }

  async handleRegistro() {
    // Obtener valores del formulario
    const perfil = this.perfilSelect.value;
    const tipoPersona = this.tipoPersonaSelect.value;
    const nombre = document.getElementById('nombre').value.trim();
    const apellido = document.getElementById('apellido').value.trim();
    const email = document.getElementById('emailReg').value.trim();
    const telefono = document.getElementById('telefono').value.trim();
    const numDoc = document.getElementById('numDoc').value.trim();
    const tipoDoc = document.getElementById('tipoDoc').value;
    const password = document.getElementById('passwordReg').value;
    const passwordConfirm = document.getElementById('passwordConfirm').value;

    // Validar perfil seleccionado
    if (!perfil) {
      showNotification('Por favor selecciona tu perfil (Demandante, Ofertante o Corredor)', 'warning');
      this.perfilSelect.focus();
      return;
    }

    // Validar datos
    if (!this.validateForm(email, password, passwordConfirm, nombre, apellido)) {
      return;
    }

    // Construir objeto de datos según API del backend
    const userData = {
      email: email,
      password: password,
      nombre: nombre,
      apellido: apellido,
      telefono: telefono || null,
      dni: numDoc || null,
      tipo_persona: tipoPersona,
      tipo_documento: tipoDoc,
      perfil_id: parseInt(perfil) // Agregar el perfil seleccionado
    };

    // Si es persona jurídica, agregar datos de empresa
    if (tipoPersona === 'juridica') {
      userData.razon_social = document.getElementById('razonSocial').value.trim();
      userData.ruc = document.getElementById('ruc').value.trim();
      userData.representante_legal = document.getElementById('representanteLegal').value.trim();
    }
    
    // Si es corredor (perfil 3), agregar datos profesionales
    if (perfil === '3') {
      userData.licencia_corredor = document.getElementById('licenciaCorredor').value.trim();
      userData.anios_experiencia = document.getElementById('aniosExperiencia').value;
      userData.especialidades = document.getElementById('especialidades').value.trim();
    }

    // Mostrar loading
    showLoading(this.registroBtn);

    try {
      // Llamar al servicio de registro
      const response = await authService.register(userData);

      hideLoading(this.registroBtn);

      // Guardar email para verificación
      this.registeredEmail = email;

      // Mostrar mensaje de éxito según el perfil
      let successMessage = 'Registro exitoso. Revisa tu email para verificar tu cuenta.';
      
      if (perfil === '1') {
        successMessage = 'Bienvenido. Tu cuenta de Demandante está activa. Revisa tu email para verificar.';
      } else if (perfil === '2') {
        successMessage = 'Registro completado. Tu cuenta de Ofertante está pendiente de aprobación administrativa.';
      } else if (perfil === '3') {
        successMessage = 'Registro profesional completado. Tu cuenta de Corredor está pendiente de verificación.';
      }
      
      showNotification(successMessage, 'success');

      console.log('[REGISTRO] Usuario registrado:', response);
      console.log('[PERFIL] Tipo seleccionado:', perfil === '1' ? 'Demandante' : perfil === '2' ? 'Ofertante' : 'Corredor');

      // Mostrar modal de verificación
      setTimeout(() => {
        this.showVerificacionModal();
      }, 1000);

    } catch (error) {
      hideLoading(this.registroBtn);

      // Manejar errores específicos
      let errorMessage = 'Error al registrar usuario';

      if (error.message.includes('ya existe') || error.message.includes('already') || error.message.includes('registrado')) {
        errorMessage = 'Este email ya está registrado. Intenta iniciar sesión.';
      } else if (error.message.includes('email')) {
        errorMessage = 'Por favor verifica tu email';
      } else if (error.message.includes('password')) {
        errorMessage = 'La contraseña debe tener al menos 6 caracteres';
      } else if (error.message) {
        errorMessage = error.message;
      }

      showNotification(errorMessage, 'error');
      console.error('[ERROR] Registro:', error);
    }
  }

  showVerificacionModal() {
    // Actualizar texto del modal con el email
    this.modalEmailText.innerHTML = `Hemos enviado un código de 6 dígitos a <strong>${this.registeredEmail}</strong>`;

    // Limpiar input
    this.codigoInput.value = '';

    // Mostrar modal
    this.modal.classList.add('show');

    // Focus en input de código
    setTimeout(() => {
      this.codigoInput.focus();
    }, 300);
  }

  async handleVerificacion() {
    const codigo = this.codigoInput.value.trim();

    // Validar código
    if (!this.validateCodigo(codigo)) {
      return;
    }

    // Mostrar loading
    showLoading(this.verificarModalBtn);

    try {
      // Llamar al servicio de verificación
      const response = await authService.verifyEmail(this.registeredEmail, codigo);

      // Mostrar éxito
      showNotification(
        'Email verificado correctamente. Redirigiendo al login...',
        'success'
      );

      console.log('[VERIFICACION] Email verificado:', response);

      // Redirigir al login después de 1.5 segundos
      setTimeout(() => {
        window.location.href = 'login.html';
      }, 1500);

    } catch (error) {
      hideLoading(this.verificarModalBtn);

      // Manejar errores específicos
      let errorMessage = 'Error al verificar código';

      if (error.message.includes('código') || error.message.includes('code') || error.message.includes('incorrecto')) {
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
      console.error('[ERROR] Verificación:', error);
    }
  }

  async handleReenviarCodigo() {
    // Mostrar loading
    showLoading(this.reenviarModalBtn);

    try {
      // Llamar al servicio de reenvío
      const response = await authService.resendVerification(this.registeredEmail);

      // Mostrar éxito
      showNotification(
        'Código reenviado. Revisa tu email.',
        'success'
      );

      console.log('[REENVIO] Código reenviado:', response);

      // Ocultar loading después de 2 segundos
      setTimeout(() => {
        hideLoading(this.reenviarModalBtn);
      }, 2000);

    } catch (error) {
      hideLoading(this.reenviarModalBtn);

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
      console.error('[ERROR] Reenvío:', error);
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

  validateForm(email, password, passwordConfirm, nombre, apellido) {
    // Validar nombre
    if (!nombre || nombre.length < 2) {
      showNotification('El nombre debe tener al menos 2 caracteres', 'warning');
      document.getElementById('nombre').focus();
      return false;
    }

    // Validar apellido
    if (!apellido || apellido.length < 2) {
      showNotification('El apellido debe tener al menos 2 caracteres', 'warning');
      document.getElementById('apellido').focus();
      return false;
    }

    // Validar email
    if (!email) {
      showNotification('Por favor ingresa tu email', 'warning');
      document.getElementById('emailReg').focus();
      return false;
    }

    if (!isValidEmail(email)) {
      showNotification('Por favor ingresa un email válido', 'warning');
      document.getElementById('emailReg').focus();
      return false;
    }

    // Validar contraseña
    if (!password) {
      showNotification('Por favor ingresa tu contraseña', 'warning');
      document.getElementById('passwordReg').focus();
      return false;
    }

    if (password.length < 8) {
      showNotification('La contraseña debe tener al menos 8 caracteres', 'warning');
      document.getElementById('passwordReg').focus();
      return false;
    }

    // Validar confirmación de contraseña
    if (password !== passwordConfirm) {
      showNotification('Las contraseñas no coinciden', 'error');
      document.getElementById('passwordConfirm').focus();
      return false;
    }

    // Validar términos y condiciones
    const terminos = document.getElementById('terminos');
    if (!terminos.checked) {
      showNotification('Debes aceptar los términos y condiciones', 'warning');
      return false;
    }

    return true;
  }
}

// Inicializar cuando el DOM esté listo
document.addEventListener('DOMContentLoaded', () => {
  new RegistroPage();
});

/**
 * 👤 AUTO-FILL DNI COMPONENT
 * Componente reutilizable para auto-completar datos del propietario por DNI
 *
 * Uso:
 * const autoFill = new AutoFillDNI('#dni-input', '#nombre-input', '#telefono-input', '#email-input');
 * autoFill.init();
 */

class AutoFillDNI {
  constructor(dniInputSelector, nombreInputSelector, telefonoInputSelector, emailInputSelector, hiddenPropietarioIdSelector = null) {
    this.dniInput = document.querySelector(dniInputSelector);
    this.nombreInput = document.querySelector(nombreInputSelector);
    this.telefonoInput = document.querySelector(telefonoInputSelector);
    this.emailInput = document.querySelector(emailInputSelector);
    this.hiddenPropietarioId = hiddenPropietarioIdSelector ? document.querySelector(hiddenPropietarioIdSelector) : null;

    this.propietarioData = null;
    this.isLoading = false;
  }

  /**
   * 🎬 Inicializar componente
   */
  init() {
    if (!this.dniInput) {
      console.error('❌ Input DNI no encontrado');
      return;
    }

    // Evento onBlur para buscar propietario
    this.dniInput.addEventListener('blur', () => this.handleDNIBlur());

    // Evento onChange para limpiar si se modifica el DNI
    this.dniInput.addEventListener('input', () => this.handleDNIChange());

    console.log('✅ AutoFillDNI inicializado');
  }

  /**
   * 🔍 Manejar evento blur del input DNI
   */
  async handleDNIBlur() {
    const dni = this.dniInput.value.trim();

    // Validar DNI no vacío
    if (!dni || dni.length < 8) {
      this.clearFields();
      return;
    }

    // Validar formato DNI (8 dígitos)
    if (!/^\d{8}$/.test(dni)) {
      this.showError('El DNI debe tener 8 dígitos');
      this.clearFields();
      return;
    }

    // Buscar propietario
    await this.buscarPropietario(dni);
  }

  /**
   * 🔄 Manejar evento change del input DNI
   */
  handleDNIChange() {
    // Si el DNI cambió, limpiar los campos auto-completados
    if (this.propietarioData) {
      this.clearFields();
      this.propietarioData = null;
    }
  }

  /**
   * 🔎 Buscar propietario por DNI usando el servicio
   */
  async buscarPropietario(dni) {
    if (this.isLoading) return;

    try {
      this.isLoading = true;
      this.showLoading();

      // Llamar al servicio
      const propietario = await propietarioService.buscarPorDNI(dni);

      if (propietario) {
        // Propietario encontrado - auto-completar
        this.fillFields(propietario);
        this.showSuccess('Propietario encontrado ✓');
      } else {
        // Propietario NO encontrado - habilitar campos para crear nuevo
        this.enableFieldsForNewPropietario();
        this.showInfo('Propietario no registrado. Puedes crear uno nuevo.');
      }

    } catch (error) {
      console.error('❌ Error al buscar propietario:', error);
      this.showError('Error al buscar propietario. Intenta nuevamente.');
      this.clearFields();
    } finally {
      this.isLoading = false;
      this.hideLoading();
    }
  }

  /**
   * ✏️ Auto-completar campos con datos del propietario
   */
  fillFields(propietario) {
    this.propietarioData = propietario;

    // Llenar campos
    if (this.nombreInput) {
      this.nombreInput.value = propietario.nombre;
      this.nombreInput.disabled = true; // Deshabilitar edición
      this.nombreInput.classList.add('bg-light');
    }

    if (this.telefonoInput) {
      this.telefonoInput.value = propietario.telefono;
      this.telefonoInput.disabled = true;
      this.telefonoInput.classList.add('bg-light');
    }

    if (this.emailInput) {
      this.emailInput.value = propietario.email || '';
      this.emailInput.disabled = true;
      this.emailInput.classList.add('bg-light');
    }

    // Guardar propietario_id en campo oculto (si existe)
    if (this.hiddenPropietarioId) {
      this.hiddenPropietarioId.value = propietario.propietario_id;
    }

    console.log('✅ Campos auto-completados:', propietario);
  }

  /**
   * 🆕 Habilitar campos para crear nuevo propietario
   */
  enableFieldsForNewPropietario() {
    this.propietarioData = null;

    // Habilitar y limpiar campos
    if (this.nombreInput) {
      this.nombreInput.value = '';
      this.nombreInput.disabled = false;
      this.nombreInput.classList.remove('bg-light');
      this.nombreInput.focus();
    }

    if (this.telefonoInput) {
      this.telefonoInput.value = '';
      this.telefonoInput.disabled = false;
      this.telefonoInput.classList.remove('bg-light');
    }

    if (this.emailInput) {
      this.emailInput.value = '';
      this.emailInput.disabled = false;
      this.emailInput.classList.remove('bg-light');
    }

    // Limpiar campo oculto
    if (this.hiddenPropietarioId) {
      this.hiddenPropietarioId.value = '';
    }
  }

  /**
   * 🧹 Limpiar todos los campos
   */
  clearFields() {
    if (this.nombreInput) {
      this.nombreInput.value = '';
      this.nombreInput.disabled = false;
      this.nombreInput.classList.remove('bg-light');
    }

    if (this.telefonoInput) {
      this.telefonoInput.value = '';
      this.telefonoInput.disabled = false;
      this.telefonoInput.classList.remove('bg-light');
    }

    if (this.emailInput) {
      this.emailInput.value = '';
      this.emailInput.disabled = false;
      this.emailInput.classList.remove('bg-light');
    }

    if (this.hiddenPropietarioId) {
      this.hiddenPropietarioId.value = '';
    }

    this.propietarioData = null;
  }

  /**
   * ⏳ Mostrar indicador de carga
   */
  showLoading() {
    if (this.dniInput) {
      this.dniInput.classList.add('loading');
      this.dniInput.disabled = true;
    }
  }

  /**
   * ✅ Ocultar indicador de carga
   */
  hideLoading() {
    if (this.dniInput) {
      this.dniInput.classList.remove('loading');
      this.dniInput.disabled = false;
    }
  }

  /**
   * ✅ Mostrar mensaje de éxito
   */
  showSuccess(message) {
    this.showToast(message, 'success');
  }

  /**
   * ℹ️ Mostrar mensaje informativo
   */
  showInfo(message) {
    this.showToast(message, 'info');
  }

  /**
   * ❌ Mostrar mensaje de error
   */
  showError(message) {
    this.showToast(message, 'error');
  }

  /**
   * 📢 Mostrar toast notification
   */
  showToast(message, type = 'info') {
    // Usar SweetAlert2 si está disponible
    if (typeof Swal !== 'undefined') {
      const icon = type === 'success' ? 'success' : type === 'error' ? 'error' : 'info';

      Swal.fire({
        icon: icon,
        title: message,
        toast: true,
        position: 'top-end',
        showConfirmButton: false,
        timer: 3000,
        timerProgressBar: true
      });
    } else {
      // Fallback a console
      console.log(`[${type.toUpperCase()}] ${message}`);
    }
  }

  /**
   * 📊 Obtener datos actuales del propietario
   * @returns {Object|null} - Datos del propietario o null si no existe
   */
  getPropietarioData() {
    return this.propietarioData;
  }

  /**
   * ✅ Validar si los campos están completos
   * @returns {boolean}
   */
  isValid() {
    const dni = this.dniInput?.value?.trim();
    const nombre = this.nombreInput?.value?.trim();
    const telefono = this.telefonoInput?.value?.trim();

    return !!(dni && nombre && telefono);
  }

  /**
   * 📤 Obtener datos del formulario para crear/actualizar propietario
   * @returns {Object} - Datos del formulario
   */
  getFormData() {
    return {
      dni: this.dniInput?.value?.trim() || '',
      nombre: this.nombreInput?.value?.trim() || '',
      telefono: this.telefonoInput?.value?.trim() || '',
      email: this.emailInput?.value?.trim() || '',
      propietario_id: this.propietarioData?.propietario_id || null
    };
  }
}

/**
 * 🔒 Gestor de Inactividad - Sistema de Seguridad
 * Monitorea la actividad del usuario y cierra sesión automáticamente tras inactividad
 */

class InactivityManager {
  constructor(options = {}) {
    // Configuración (tiempos en milisegundos)
    this.config = {
      warningTime: options.warningTime || 14 * 60 * 1000, // 14 minutos antes de mostrar warning
      timeoutTime: options.timeoutTime || 15 * 60 * 1000, // 15 minutos total
      countdownSeconds: options.countdownSeconds || 30, // 30 segundos de countdown
      checkInterval: options.checkInterval || 1000 // Revisar cada segundo
    };

    // Estado
    this.lastActivity = Date.now();
    this.warningShown = false;
    this.countdownInterval = null;
    this.checkInterval = null;
    this.isActive = false;

    // Eventos que resetean el timer
    this.events = ['mousedown', 'mousemove', 'keypress', 'scroll', 'touchstart', 'click'];

    // Elementos del DOM
    this.modal = null;
    this.countdownElement = null;
  }

  /**
   * Iniciar el monitoreo de inactividad
   */
  start() {
    if (this.isActive) return;

    console.log('🔒 Gestor de inactividad iniciado');
    this.isActive = true;
    this.lastActivity = Date.now();
    
    // Crear modal si no existe
    this.createModal();

    // Agregar listeners de actividad
    this.events.forEach(event => {
      document.addEventListener(event, this.resetTimer.bind(this), true);
    });

    // Iniciar verificación periódica
    this.checkInterval = setInterval(() => {
      this.checkInactivity();
    }, this.config.checkInterval);
  }

  /**
   * Detener el monitoreo
   */
  stop() {
    if (!this.isActive) return;

    console.log('🔒 Gestor de inactividad detenido');
    this.isActive = false;

    // Remover listeners
    this.events.forEach(event => {
      document.removeEventListener(event, this.resetTimer.bind(this), true);
    });

    // Limpiar intervals
    if (this.checkInterval) {
      clearInterval(this.checkInterval);
      this.checkInterval = null;
    }

    if (this.countdownInterval) {
      clearInterval(this.countdownInterval);
      this.countdownInterval = null;
    }

    // Ocultar modal
    this.hideWarning();
  }

  /**
   * Resetear el timer de inactividad
   */
  resetTimer() {
    this.lastActivity = Date.now();
    
    // Si el warning está visible, ocultarlo
    if (this.warningShown) {
      this.hideWarning();
    }
  }

  /**
   * Verificar el tiempo de inactividad
   */
  checkInactivity() {
    if (!this.isActive) return;

    const now = Date.now();
    const inactiveTime = now - this.lastActivity;

    // Si ya pasó el tiempo límite, cerrar sesión
    if (inactiveTime >= this.config.timeoutTime) {
      this.logout();
      return;
    }

    // Si está en tiempo de advertencia y no se ha mostrado el warning
    if (inactiveTime >= this.config.warningTime && !this.warningShown) {
      this.showWarning();
    }
  }

  /**
   * Mostrar popup de advertencia con countdown
   */
  showWarning() {
    if (this.warningShown) return;

    console.log('⚠️ Mostrando advertencia de inactividad');
    this.warningShown = true;

    // Mostrar modal
    if (this.modal) {
      this.modal.classList.add('active');
    }

    // Iniciar countdown
    let secondsLeft = this.config.countdownSeconds;
    this.updateCountdown(secondsLeft);

    this.countdownInterval = setInterval(() => {
      secondsLeft--;
      
      if (secondsLeft <= 0) {
        clearInterval(this.countdownInterval);
        this.logout();
        return;
      }

      this.updateCountdown(secondsLeft);
    }, 1000);
  }

  /**
   * Ocultar el warning
   */
  hideWarning() {
    if (!this.warningShown) return;

    console.log('✅ Ocultando advertencia de inactividad');
    this.warningShown = false;

    // Ocultar modal
    if (this.modal) {
      this.modal.classList.remove('active');
    }

    // Detener countdown
    if (this.countdownInterval) {
      clearInterval(this.countdownInterval);
      this.countdownInterval = null;
    }
  }

  /**
   * Actualizar el countdown en el modal
   */
  updateCountdown(seconds) {
    if (this.countdownElement) {
      this.countdownElement.textContent = seconds;
    }
  }

  /**
   * Cerrar sesión por inactividad
   */
  logout() {
    console.log('🔒 Cerrando sesión por inactividad');
    
    this.stop();
    
    // Usar el servicio de autenticación
    if (window.authService) {
      authService.logout('Tu sesión ha expirado por inactividad');
    } else {
      // Fallback: redirigir directamente
      localStorage.clear();
      sessionStorage.clear();
      window.location.href = 'login.html';
    }
  }

  /**
   * Crear el modal de advertencia
   */
  createModal() {
    // Si ya existe, no crear otro
    if (document.getElementById('inactivityModal')) {
      this.modal = document.getElementById('inactivityModal');
      this.countdownElement = document.getElementById('inactivityCountdown');
      return;
    }

    const modalHTML = `
      <div class="inactivity-modal" id="inactivityModal">
        <div class="inactivity-modal-overlay"></div>
        <div class="inactivity-modal-content">
          <div class="inactivity-modal-icon">
            <svg xmlns="http://www.w3.org/2000/svg" width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <circle cx="12" cy="12" r="10"></circle>
              <polyline points="12 6 12 12 16 14"></polyline>
            </svg>
          </div>
          <h3>Sesión inactiva</h3>
          <p>Tu sesión está a punto de expirar por inactividad</p>
          <div class="inactivity-countdown">
            <span id="inactivityCountdown">30</span>
            <span class="countdown-label">segundos</span>
          </div>
          <div class="inactivity-modal-actions">
            <button class="btn btn-primary" id="continueSessionBtn">
              Continuar sesión
            </button>
            <button class="btn btn-outline" id="logoutNowBtn">
              Cerrar sesión
            </button>
          </div>
        </div>
      </div>
    `;

    document.body.insertAdjacentHTML('beforeend', modalHTML);

    // Guardar referencias
    this.modal = document.getElementById('inactivityModal');
    this.countdownElement = document.getElementById('inactivityCountdown');

    // Event listeners
    document.getElementById('continueSessionBtn').addEventListener('click', () => {
      this.resetTimer();
    });

    document.getElementById('logoutNowBtn').addEventListener('click', () => {
      this.logout();
    });
  }
}

// Crear instancia global
const inactivityManager = new InactivityManager({
  warningTime: 14 * 60 * 1000, // 14 minutos
  timeoutTime: 15 * 60 * 1000, // 15 minutos
  countdownSeconds: 30 // 30 segundos
});

window.inactivityManager = inactivityManager;

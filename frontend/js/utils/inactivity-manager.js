/**
 * 🔒 Gestor de Inactividad - Sistema de Seguridad
 * Monitorea la actividad del usuario y cierra sesión automáticamente tras inactividad
 */

class InactivityManager {
  constructor(options = {}) {
    // Configuración (tiempos en milisegundos)
    this.config = {
      warningTime: options.warningTime || 29 * 60 * 1000, // 29 minutos antes de mostrar warning
      timeoutTime: options.timeoutTime || 30 * 60 * 1000, // 30 minutos total  
      countdownSeconds: options.countdownSeconds || 60, // 60 segundos de countdown
      checkInterval: options.checkInterval || 1000 // Revisar cada segundo
    };

    // Estado
    this.lastActivity = Date.now();
    this.warningShown = false;
    this.countdownInterval = null;
    this.checkInterval = null;
    this.isActive = false;
    this.isLoggingOut = false; // Prevenir múltiples logouts
    this.boundResetTimer = null; // Referencia para event listeners

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

    // Bind del handler una sola vez
    this.boundResetTimer = this.resetTimer.bind(this);

    // Agregar listeners de actividad
    this.events.forEach(event => {
      document.addEventListener(event, this.boundResetTimer, true);
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

    // Remover listeners con la referencia correcta
    if (this.boundResetTimer) {
      this.events.forEach(event => {
        document.removeEventListener(event, this.boundResetTimer, true);
      });
      this.boundResetTimer = null;
    }

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
    const inactiveSeconds = Math.floor(inactiveTime / 1000);
    const inactiveMinutes = Math.floor(inactiveSeconds / 60);
    
    // Debug para pruebas
    if (inactiveSeconds % 30 === 0) { // Log cada 30 segundos
      console.log(`⏱️ Tiempo inactivo: ${inactiveMinutes}m ${inactiveSeconds % 60}s`);
    }

    // Si ya pasó el tiempo límite, cerrar sesión
    if (inactiveTime >= this.config.timeoutTime) {
      console.log('⏰ Tiempo límite alcanzado, cerrando sesión...');
      this.logout();
      return;
    }

    // Si está en tiempo de advertencia y no se ha mostrado el warning
    if (inactiveTime >= this.config.warningTime && !this.warningShown) {
      console.log('⚠️ Tiempo de advertencia alcanzado, mostrando popup...');
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
    // Prevenir múltiples llamadas al logout
    if (this.isLoggingOut) return;
    this.isLoggingOut = true;
    
    console.log('🔒 Cerrando sesión por inactividad');
    
    // Detener el manager inmediatamente
    this.stop();
    
    // Limpiar TODO antes de redirigir
    localStorage.clear();
    sessionStorage.clear();
    
    // Guardar mensaje de logout para mostrar en login
    sessionStorage.setItem('logout_message', 'Tu sesión ha expirado por inactividad');
    
    // Usar el servicio de autenticación si está disponible
    if (window.authService && typeof authService.logout === 'function') {
      try {
        authService.logout('Tu sesión ha expirado por inactividad');
      } catch (error) {
        console.error('Error en logout:', error);
        // Fallback: redirigir directamente con ruta dinámica
        const loginUrl = window.location.origin + '/login';
        window.location.replace(loginUrl);
      }
    } else {
      // Fallback directo con ruta dinámica
      const loginUrl = window.location.origin + '/login';
      console.log('🔄 Redirigiendo a:', loginUrl);
      window.location.replace(loginUrl);
    }
  }

  /**
   * Destruir completamente el manager
   */
  destroy() {
    console.log('🗑️ Destruyendo inactivity manager...');
    
    // Detener primero
    this.stop();
    
    // Remover el modal del DOM
    if (this.modal) {
      this.modal.remove();
      this.modal = null;
    }
    
    // Limpiar referencias
    this.countdownElement = null;
    this.boundResetTimer = null;
    
    // Resetear estado
    this.isLoggingOut = false;
  }

  /**
   * Crear el modal de advertencia
   */
  createModal() {
    // Si ya existe, no crear otro
    if (document.getElementById('inactivityModal')) {
      this.modal = document.getElementById('inactivityModal');
      this.countdownElement = document.getElementById('inactivityCountdown');
      this.attachModalListeners();
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
            <span id="inactivityCountdown">60</span>
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

    // Agregar event listeners
    this.attachModalListeners();
  }

  /**
   * Agregar listeners al modal
   */
  attachModalListeners() {
    const continueBtn = document.getElementById('continueSessionBtn');
    const logoutBtn = document.getElementById('logoutNowBtn');

    if (continueBtn && !continueBtn.hasListener) {
      continueBtn.addEventListener('click', () => {
        console.log('✅ Usuario continuó la sesión');
        this.resetTimer();
      });
      continueBtn.hasListener = true;
    }

    if (logoutBtn && !logoutBtn.hasListener) {
      logoutBtn.addEventListener('click', () => {
        console.log('👋 Usuario cerró sesión manualmente');
        this.logout();
      });
      logoutBtn.hasListener = true;
    }
  }
}

// Crear instancia global
const inactivityManager = new InactivityManager({
  warningTime: 2 * 60 * 1000, // 2 minutos antes de mostrar warning (PARA PRUEBAS)
  timeoutTime: 3 * 60 * 1000, // 3 minutos total (PARA PRUEBAS)
  countdownSeconds: 60 // 60 segundos de countdown
});

// TODO: Para PRODUCCIÓN cambiar a:
// warningTime: 29 * 60 * 1000, // 29 minutos
// timeoutTime: 30 * 60 * 1000, // 30 minutos

window.inactivityManager = inactivityManager;

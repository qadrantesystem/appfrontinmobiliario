/**
 * 🌐 Environment Helper - Detecta y maneja ambientes dinámicamente
 */

class Environment {
    constructor() {
        this.origin = window.location.origin;
        this.hostname = window.location.hostname;
        this.isLocal = this.hostname === 'localhost' || this.hostname === '127.0.0.1';
        this.isProduction = this.hostname.includes('railway.app') || this.hostname.includes('vercel.app');
        
        console.log('🌍 Environment:', {
            origin: this.origin,
            hostname: this.hostname,
            isLocal: this.isLocal,
            isProduction: this.isProduction
        });
    }
    
    /**
     * Obtener URL base del proyecto
     */
    getBaseUrl() {
        return this.origin;
    }
    
    /**
     * Obtener URL de login
     */
    getLoginUrl() {
        return this.origin + '/login';
    }
    
    /**
     * Obtener URL del dashboard
     */
    getDashboardUrl() {
        return this.origin + '/dashboard';
    }
    
    /**
     * Obtener URL del API
     */
    getApiUrl() {
        // Si tienes diferentes URLs de API según el ambiente
        if (this.isLocal) {
            return 'http://localhost:8000'; // Tu API local
        } else if (this.isProduction) {
            return 'https://tu-api-production.com'; // Tu API de producción
        }
        return this.origin; // Fallback
    }
    
    /**
     * Redirigir al login
     */
    redirectToLogin(message = null) {
        if (message) {
            sessionStorage.setItem('logout_message', message);
        }
        const loginUrl = this.getLoginUrl();
        console.log('🔄 Redirigiendo a:', loginUrl);
        window.location.replace(loginUrl);
    }
    
    /**
     * Redirigir al dashboard
     */
    redirectToDashboard() {
        const dashboardUrl = this.getDashboardUrl();
        console.log('🔄 Redirigiendo a:', dashboardUrl);
        window.location.replace(dashboardUrl);
    }
    
    /**
     * Verificar si es ambiente de desarrollo
     */
    isDevelopment() {
        return this.isLocal;
    }
    
    /**
     * Verificar si es ambiente de producción
     */
    isProductionEnvironment() {
        return this.isProduction;
    }
}

// Crear instancia global
const environment = new Environment();
window.environment = environment;

// Exportar para módulos
if (typeof module !== 'undefined' && module.exports) {
    module.exports = environment;
}

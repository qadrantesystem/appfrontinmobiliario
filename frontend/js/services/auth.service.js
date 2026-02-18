/**
 * 🔐 Servicio de Autenticación
 * Sistema Inmobiliario - Gestión de usuarios y sesiones
 */

class AuthService {
    constructor() {
        this.currentUser = null;
        this.isInitialized = false;
        
        // Cargar usuario del storage si existe
        this.loadUserFromStorage();
        
        // Marcar como inicializado
        this.isInitialized = true;
    }

    /**
     * 📝 Registrar nuevo usuario
     */
    async register(userData) {
        try {
            const response = await apiRequest(API_CONFIG.AUTH.REGISTER, {
                method: 'POST',
                body: JSON.stringify(userData)
            });

            return response;
        } catch (error) {
            console.error('❌ Error en registro:', error);
            throw error;
        }
    }

    /**
     * 🔐 Iniciar sesión
     */
    async login(email, password) {
        try {
            const response = await apiRequest(API_CONFIG.AUTH.LOGIN, {
                method: 'POST',
                body: JSON.stringify({ email, password })
            });

            if (response.success && response.data) {
                // Guardar token y datos del usuario
                this.saveSession(response.data);
                return response;
            }

            throw new Error('Respuesta inválida del servidor');
        } catch (error) {
            console.error('❌ Error en login:', error);
            throw error;
        }
    }

    /**
     * ✉️ Verificar email con código
     */
    async verifyEmail(email, codigo) {
        try {
            const response = await apiRequest(
                `${API_CONFIG.AUTH.VERIFY_EMAIL}?email=${email}&codigo=${codigo}`,
                { method: 'POST' }
            );

            return response;
        } catch (error) {
            console.error('❌ Error verificando email:', error);
            throw error;
        }
    }

    /**
     * 📧 Reenviar código de verificación
     */
    async resendVerification(email) {
        try {
            const response = await apiRequest(
                `${API_CONFIG.AUTH.RESEND_VERIFICATION}?email=${email}`,
                { method: 'POST' }
            );

            return response;
        } catch (error) {
            console.error('❌ Error reenviando código:', error);
            throw error;
        }
    }

    /**
     * 🔑 Solicitar recuperación de contraseña
     */
    async forgotPassword(email) {
        try {
            const response = await apiRequest(
                `${API_CONFIG.AUTH.FORGOT_PASSWORD}?email=${email}`,
                { method: 'POST' }
            );

            return response;
        } catch (error) {
            console.error('❌ Error en recuperación:', error);
            throw error;
        }
    }

    /**
     * 🔐 Restablecer contraseña
     */
    async resetPassword(email, codigo, nueva_password) {
        try {
            const response = await apiRequest(
                `${API_CONFIG.AUTH.RESET_PASSWORD}?email=${email}&codigo=${codigo}&nueva_password=${nueva_password}`,
                { method: 'POST' }
            );

            return response;
        } catch (error) {
            console.error('❌ Error restableciendo contraseña:', error);
            throw error;
        }
    }

    /**
     * 👤 Obtener perfil del usuario actual
     */
    async getMyProfile() {
        try {
            // ✅ CORRECTO - Usar /perfiles/me donde está el avatar
            const response = await apiRequest('/perfiles/me', {
                method: 'GET',
                auth: true
            });

            if (response.success && response.data) {
                this.currentUser = response.data;
                this.saveUserToStorage(response.data);
                return response.data;
            }

            throw new Error('Error obteniendo perfil');
        } catch (error) {
            console.error('❌ Error obteniendo perfil:', error);
            throw error;
        }
    }

    /**
     * 📝 Actualizar perfil
     */
    async updateProfile(userData) {
        try {
            // ✅ CORRECTO - Usar /perfiles/me donde está el avatar
            const response = await apiRequest('/perfiles/me', {
                method: 'PUT',
                auth: true,
                body: JSON.stringify(userData)
            });

            if (response.success && response.data) {
                this.currentUser = response.data;
                this.saveUserToStorage(response.data);
                return response;
            }

            throw new Error('Error actualizando perfil');
        } catch (error) {
            console.error('❌ Error actualizando perfil:', error);
            throw error;
        }
    }

    /**
     * 📝 Actualizar perfil (alias para compatibilidad)
     */
    async updateMyProfile(userData) {
        return this.updateProfile(userData);
    }

    /**
     * 🔒 Cambiar contraseña
     */
    async changePassword(currentPassword, newPassword) {
        try {
            const response = await apiRequest(API_CONFIG.USER.CHANGE_PASSWORD, {
                method: 'PUT',
                auth: true,
                body: JSON.stringify({
                    current_password: currentPassword,
                    new_password: newPassword
                })
            });

            return response;
        } catch (error) {
            console.error('❌ Error cambiando contraseña:', error);
            throw error;
        }
    }

    /**
     * 🧹 Limpiar TODA la caché del navegador
     */
    async clearAllCache() {
        try {
            // 1. Limpiar Service Workers y caché
            if ('serviceWorker' in navigator) {
                const registrations = await navigator.serviceWorker.getRegistrations();
                for (let registration of registrations) {
                    await registration.unregister();
                }
            }
            
            // 2. Limpiar Cache Storage
            if ('caches' in window) {
                const cacheNames = await caches.keys();
                await Promise.all(
                    cacheNames.map(cacheName => caches.delete(cacheName))
                );
            }
            
            // 3. Limpiar localStorage
            localStorage.clear();

            // 4. Limpiar sessionStorage
            sessionStorage.clear();
            
            // 5. Limpiar cookies
            document.cookie.split(";").forEach(cookie => {
                const name = cookie.split("=")[0].trim();
                document.cookie = name + '=;expires=Thu, 01 Jan 1970 00:00:00 GMT;path=/';
            });

            return true;
        } catch (error) {
            console.error('❌ Error limpiando caché:', error);
            return false;
        }
    }

    /**
     * 🚪 Cerrar sesión
     */
    logout(message = null) {
        try {
            // Detener el gestor de inactividad si está activo
            if (window.inactivityManager && window.inactivityManager.isActive) {
                window.inactivityManager.stop();
            }

            // Destruir toda la caché del navegador (async, fire-and-forget)
            this.destroyAllSessions();

            // Limpiar estado interno
            this.currentUser = null;

            // Si hay mensaje, guardarlo temporalmente para mostrar en login
            if (message) {
                try {
                    sessionStorage.setItem('logout_message', message);
                } catch (e) {
                    // sessionStorage ya fue limpiado, ignorar
                }
            }

            // Redirigir al login
            if (window.environment && typeof environment.redirectToLogin === 'function') {
                environment.redirectToLogin(message);
            } else {
                window.location.replace(window.location.origin + '/login');
            }
        } catch (error) {
            console.error('❌ Error durante logout:', error);
            window.location.replace(window.location.origin + '/login');
        }
    }

    /**
     * 🧹 Destruir TODAS las sesiones y caché del navegador
     */
    async destroyAllSessions() {
        try {
            // 1. Service Workers
            if ('serviceWorker' in navigator) {
                const registrations = await navigator.serviceWorker.getRegistrations();
                for (let reg of registrations) {
                    await reg.unregister();
                }
            }
            // 2. Cache Storage
            if ('caches' in window) {
                const names = await caches.keys();
                await Promise.all(names.map(n => caches.delete(n)));
            }
            // 3. localStorage
            localStorage.clear();
            // 4. sessionStorage
            sessionStorage.clear();
            // 5. Cookies
            document.cookie.split(';').forEach(c => {
                const name = c.split('=')[0].trim();
                document.cookie = name + '=;expires=Thu, 01 Jan 1970 00:00:00 GMT;path=/';
            });
        } catch (error) {
            console.error('❌ Error destruyendo sesiones:', error);
        }
    }

    /**
     * 🧹 Cerrar sesión Y limpiar TODO el caché
     */
    async logoutAndClearCache(message = 'Sesión cerrada y caché limpiada') {
        try {
            // Primero limpiar toda la caché
            await this.clearAllCache();
            
            // Luego hacer logout normal
            this.logout(message);
        } catch (error) {
            console.error('❌ Error en logout con limpieza:', error);
            // Forzar logout aunque falle la limpieza
            this.logout(message);
        }
    }

    /**
     * 💾 Guardar sesión
     */
    saveSession(data) {
        localStorage.setItem('access_token', data.access_token);
        localStorage.setItem('token_type', data.token_type);
        this.currentUser = data.usuario;
        this.saveUserToStorage(data.usuario);
    }

    /**
     * 💾 Guardar usuario en storage
     */
    /**
     * 💾 Guardar usuario en storage (preservando datos importantes)
     */
    saveUserToStorage(user) {
        // Obtener usuario actual del localStorage para preservar datos
        const currentUserStr = localStorage.getItem('current_user');
        let currentUser = {};
        
        if (currentUserStr) {
            try {
                currentUser = JSON.parse(currentUserStr);
            } catch (error) {
                console.error('Error parseando usuario actual:', error);
            }
        }
        
        // Combinar datos: prioridad a los nuevos pero preservar importantes
        const userToSave = {
            // Preservar datos importantes del usuario actual
            id: user.id || currentUser.id,
            email: user.email || currentUser.email,
            nombre: user.nombre || currentUser.nombre || 'usuario',
            apellido: user.apellido || currentUser.apellido,
            telefono: user.telefono || currentUser.telefono,
            perfil_id: user.perfil_id || currentUser.perfil_id,
            rol: user.rol || currentUser.rol,
            
            // Actualizar datos del perfil (avatar, etc)
            foto_perfil: user.foto_perfil || currentUser.foto_perfil,
            avatar_url: user.avatar_url || currentUser.avatar_url,
            
            // Otros datos del nuevo usuario
            ...user
        };
        
        localStorage.setItem('current_user', JSON.stringify(userToSave));
    }

    /**
     * 📂 Cargar usuario desde storage
     */
    loadUserFromStorage() {
        const userStr = localStorage.getItem('current_user');
        if (userStr) {
            try {
                this.currentUser = JSON.parse(userStr);
            } catch (error) {
                console.error('Error parseando usuario:', error);
                this.currentUser = null;
            }
        }
    }

    /**
     * ✅ Verificar si está autenticado
     */
    isAuthenticated() {
        return !!localStorage.getItem('access_token');
    }

    /**
     * 👤 Obtener usuario actual
     */
    getCurrentUser() {
        return this.currentUser;
    }

    /**
     * 🔑 Obtener token
     */
    getToken() {
        return localStorage.getItem('access_token');
    }
}

// Crear instancia global
const authService = new AuthService();
window.authService = authService;

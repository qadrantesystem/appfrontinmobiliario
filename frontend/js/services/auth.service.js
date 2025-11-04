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
        console.log('✅ AuthService inicializado');
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

            console.log('✅ Usuario registrado:', response);
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
                console.log('✅ Login exitoso:', response.data.usuario);
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

            console.log('✅ Email verificado:', response);
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

            console.log('✅ Código reenviado:', response);
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

            console.log('✅ Código de recuperación enviado:', response);
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

            console.log('✅ Contraseña restablecida:', response);
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
                console.log('✅ Perfil actualizado:', response.data);
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

            console.log('✅ Contraseña cambiada:', response);
            return response;
        } catch (error) {
            console.error('❌ Error cambiando contraseña:', error);
            throw error;
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

            // Limpiar TODO del localStorage
            const keysToRemove = ['access_token', 'token_type', 'current_user', 'refresh_token'];
            keysToRemove.forEach(key => {
                try {
                    localStorage.removeItem(key);
                } catch (e) {
                    console.error(`Error removing ${key}:`, e);
                }
            });
            
            // Limpiar sessionStorage también
            try {
                sessionStorage.clear();
            } catch (e) {
                console.error('Error clearing sessionStorage:', e);
            }
            
            // Limpiar estado interno
            this.currentUser = null;
            
            // Si hay mensaje, guardarlo temporalmente para mostrar en login
            if (message) {
                try {
                    sessionStorage.setItem('logout_message', message);
                } catch (e) {
                    console.error('Error saving logout message:', e);
                }
            }
            
            console.log('✅ Sesión cerrada completamente');
            
            // Usar el helper de ambiente si está disponible
            if (window.environment && typeof environment.redirectToLogin === 'function') {
                environment.redirectToLogin(message);
            } else {
                // Fallback: construir URL manualmente
                const origin = window.location.origin;
                const loginPath = '/login';
                const loginUrl = origin + loginPath;
                
                console.log('🔄 Redirigiendo a:', loginUrl);
                window.location.replace(loginUrl);
            }
        } catch (error) {
            console.error('❌ Error durante logout:', error);
            // Forzar redirección aunque haya errores
            const fallbackUrl = window.location.origin + '/login';
            window.location.replace(fallbackUrl);
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
        
        console.log('💾 Guardando usuario en localStorage:', {
            nombre: userToSave.nombre,
            email: userToSave.email,
            foto_perfil: userToSave.foto_perfil ? 'EXISTS' : 'NOT FOUND'
        });
        
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

/**
 * 🔐 Servicio de Autenticación
 * Sistema Inmobiliario - Gestión de usuarios y sesiones
 */

class AuthService {
    constructor() {
        this.currentUser = null;
        this.loadUserFromStorage();
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
            const response = await apiRequest(API_CONFIG.USER.ME, {
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
            const response = await apiRequest(API_CONFIG.USER.UPDATE, {
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
    logout() {
        localStorage.removeItem('access_token');
        localStorage.removeItem('token_type');
        localStorage.removeItem('current_user');
        this.currentUser = null;
        console.log('✅ Sesión cerrada');
        window.location.href = '/login';
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
    saveUserToStorage(user) {
        localStorage.setItem('current_user', JSON.stringify(user));
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

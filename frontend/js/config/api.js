/**
 * 🔧 Configuración de API
 * Sistema Inmobiliario - Conexión con Backend
 */

const API_CONFIG = {
    BASE_URL: 'https://appbackimmobiliaria-production.up.railway.app/api/v1', // 🚀 Railway (funciona para auth)
    TIMEOUT: 30000, // 30 segundos
    
    // Endpoints de Autenticación
    AUTH: {
        REGISTER: '/auth/register',
        LOGIN: '/auth/login',
        VERIFY_EMAIL: '/auth/verify-email',
        RESEND_VERIFICATION: '/auth/resend-verification',
        FORGOT_PASSWORD: '/auth/forgot-password',
        RESET_PASSWORD: '/auth/reset-password',
        LOGOUT: '/auth/logout'
    },
    
    // Endpoints de Usuario
    USER: {
        ME: '/usuarios/me',
        UPDATE: '/usuarios/me',
        CHANGE_PASSWORD: '/usuarios/me/password'
    },
    
    // Endpoints de Perfiles
    PROFILES: {
        ME: '/perfiles/me',
        UPDATE: '/perfiles/me',
        AVATAR_UPLOAD: '/perfiles/avatar',
        AVATAR_DELETE: '/perfiles/avatar'
    },
    
    // Endpoints de Propiedades
    PROPERTIES: {
        LIST: '/propiedades',
        CREATE: '/propiedades/con-imagenes',
        GET: (id) => `/propiedades/${id}`,
        UPDATE: (id) => `/propiedades/${id}`,
        DELETE: (id) => `/propiedades/${id}`,
        MY_PROPERTIES: '/propiedades/mis-propiedades'
    },
    
    // Endpoints de Búsquedas
    SEARCH: {
        REGISTER: '/busquedas/registrar',
        MY_SEARCHES: '/busquedas/mis-busquedas',
        ALERTS: '/busquedas/alertas',
        CREATE_ALERT: '/busquedas/crear-alerta'
    },
    
    // Endpoints de Favoritos
    FAVORITES: {
        LIST: '/favoritos/',
        ADD: '/favoritos/',
        DELETE: (id) => `/favoritos/${id}`
    },
    
    // Endpoints de Catálogos
    CATALOGS: {
        DISTRICTS: '/distritos/',
        PROPERTY_TYPES: '/tipos-inmueble/',
        CHARACTERISTICS: '/caracteristicas/'
    }
};

// Headers por defecto
const getHeaders = (includeAuth = false) => {
    const headers = {
        'Content-Type': 'application/json'
    };
    
    if (includeAuth) {
        const token = localStorage.getItem('access_token');
        if (token) {
            headers['Authorization'] = `Bearer ${token}`;
        }
    }
    
    return headers;
};

// Función helper para hacer peticiones
const apiRequest = async (endpoint, options = {}) => {
    const url = `${API_CONFIG.BASE_URL}${endpoint}`;
    
    const config = {
        ...options,
        headers: {
            ...getHeaders(options.auth),
            ...options.headers
        }
    };
    
    try {
        const response = await fetch(url, config);
        const data = await response.json();
        
        if (!response.ok) {
            throw new Error(data.detail || data.message || 'Error en la petición');
        }
        
        return data;
    } catch (error) {
        console.error('API Error:', error);
        throw error;
    }
};

// Exportar configuración
window.API_CONFIG = API_CONFIG;
window.apiRequest = apiRequest;
window.getHeaders = getHeaders;

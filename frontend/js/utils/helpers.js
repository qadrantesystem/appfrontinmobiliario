/**
 * 🛠️ Utilidades y Helpers
 * Sistema Inmobiliario
 */

/**
 * 📢 Mostrar notificación
 */
function showNotification(message, type = 'info') {
    // Crear elemento de notificación
    const notification = document.createElement('div');
    notification.className = `notification notification-${type}`;
    notification.innerHTML = `
        <div class="notification-content">
            <span class="notification-icon">${getNotificationIcon(type)}</span>
            <span class="notification-message">${message}</span>
        </div>
    `;
    
    // Agregar al body
    document.body.appendChild(notification);
    
    // Mostrar con animación
    setTimeout(() => notification.classList.add('show'), 100);
    
    // Remover después de 4 segundos
    setTimeout(() => {
        notification.classList.remove('show');
        setTimeout(() => notification.remove(), 300);
    }, 4000);
}

/**
 * 🎨 Obtener icono de notificación
 */
function getNotificationIcon(type) {
    const icons = {
        success: '✅',
        error: '❌',
        warning: '⚠️',
        info: 'ℹ️'
    };
    return icons[type] || icons.info;
}

/**
 * ⏳ Mostrar/Ocultar loading
 */
function showLoading(button) {
    if (!button) return;
    
    button.disabled = true;
    button.dataset.originalText = button.textContent;
    button.innerHTML = '<span class="spinner"></span> Cargando...';
}

function hideLoading(button) {
    if (!button) return;
    
    button.disabled = false;
    button.textContent = button.dataset.originalText || 'Continuar';
}

/**
 * ✅ Validar email
 */
function isValidEmail(email) {
    const regex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return regex.test(email);
}

/**
 * 🔒 Validar contraseña
 */
function isValidPassword(password) {
    // Mínimo 8 caracteres, al menos una mayúscula, una minúscula y un número
    const regex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d).{8,}$/;
    return regex.test(password);
}

/**
 * 📱 Validar teléfono
 */
function isValidPhone(phone) {
    const regex = /^\d{9}$/;
    return regex.test(phone);
}

/**
 * 🆔 Validar DNI
 */
function isValidDNI(dni) {
    const regex = /^\d{8}$/;
    return regex.test(dni);
}

/**
 * 🔄 Redirigir con delay
 */
function redirectTo(url, delay = 0) {
    setTimeout(() => {
        window.location.href = url;
    }, delay);
}

/**
 * 💾 Guardar en localStorage
 */
function saveToStorage(key, value) {
    try {
        localStorage.setItem(key, JSON.stringify(value));
        return true;
    } catch (error) {
        console.error('Error guardando en storage:', error);
        return false;
    }
}

/**
 * 📂 Obtener de localStorage
 */
function getFromStorage(key) {
    try {
        const value = localStorage.getItem(key);
        return value ? JSON.parse(value) : null;
    } catch (error) {
        console.error('Error obteniendo de storage:', error);
        return null;
    }
}

/**
 * 🗑️ Limpiar localStorage
 */
function clearStorage() {
    localStorage.clear();
}

/**
 * 🎯 Formatear precio
 */
function formatPrice(price, currency = 'USD') {
    if (!price) return '-';
    
    const formatted = new Intl.NumberFormat('es-PE', {
        style: 'currency',
        currency: currency === 'USD' ? 'USD' : 'PEN',
        minimumFractionDigits: 0,
        maximumFractionDigits: 0
    }).format(price);
    
    return formatted;
}

/**
 * 📅 Formatear fecha
 */
function formatDate(dateString) {
    if (!dateString) return '-';
    
    const date = new Date(dateString);
    return new Intl.DateTimeFormat('es-PE', {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
    }).format(date);
}

/**
 * ⏰ Tiempo relativo
 */
function timeAgo(dateString) {
    if (!dateString) return '-';
    
    const date = new Date(dateString);
    const now = new Date();
    const seconds = Math.floor((now - date) / 1000);
    
    const intervals = {
        año: 31536000,
        mes: 2592000,
        semana: 604800,
        día: 86400,
        hora: 3600,
        minuto: 60
    };
    
    for (const [name, value] of Object.entries(intervals)) {
        const interval = Math.floor(seconds / value);
        if (interval >= 1) {
            return `Hace ${interval} ${name}${interval > 1 ? 's' : ''}`;
        }
    }
    
    return 'Hace un momento';
}

/**
 * 🔍 Debounce
 */
function debounce(func, wait) {
    let timeout;
    return function executedFunction(...args) {
        const later = () => {
            clearTimeout(timeout);
            func(...args);
        };
        clearTimeout(timeout);
        timeout = setTimeout(later, wait);
    };
}

// Exportar funciones globalmente
window.showNotification = showNotification;
window.showLoading = showLoading;
window.hideLoading = hideLoading;
window.isValidEmail = isValidEmail;
window.isValidPassword = isValidPassword;
window.isValidPhone = isValidPhone;
window.isValidDNI = isValidDNI;
window.redirectTo = redirectTo;
window.saveToStorage = saveToStorage;
window.getFromStorage = getFromStorage;
window.clearStorage = clearStorage;
window.formatPrice = formatPrice;
window.formatDate = formatDate;
window.timeAgo = timeAgo;
window.debounce = debounce;

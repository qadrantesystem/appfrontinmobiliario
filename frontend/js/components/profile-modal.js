/**
 * Modal de Perfil de Usuario
 * Permite editar datos del perfil y subir/cambiar avatar
 */
class ProfileModal {
  constructor() {
    this.modal = null;
    this.userData = null;
    this.avatarFile = null;
    this.avatarPreview = null;
    this.isLoading = false;
    // Usar API_CONFIG si está disponible, sino usar fallback
    this.baseURL = window.API_CONFIG?.BASE_URL || 'http://localhost:8000/api/v1';
    console.log('🔧 ProfileModal usando baseURL:', this.baseURL);
    
    // Debug: mostrar contenido actual de localStorage
    this.debugLocalStorage();
  }

  /**
   * Debug localStorage contents
   */
  debugLocalStorage() {
    const currentUser = JSON.parse(localStorage.getItem('current_user') || '{}');
    console.log('🔍 DEBUG localStorage contents:', {
      hasCurrentUser: !!localStorage.getItem('current_user'),
      avatar_url: currentUser.avatar_url ? 'EXISTS' : 'NOT FOUND',
      avatar_local: currentUser.avatar_local ? 'EXISTS' : 'NOT FOUND',
      foto_perfil: currentUser.foto_perfil ? 'EXISTS' : 'NOT FOUND',
      fullUser: currentUser
    });
  }

  /**
   * Helper para hacer peticiones al API con manejo de CORS
   */
  async apiCall(endpoint, options = {}) {
    const url = `${this.baseURL}${endpoint}`;
    const token = localStorage.getItem('access_token');
    
    const config = {
      ...options,
      headers: {
        'Authorization': `Bearer ${token}`,
        ...options.headers
      },
      mode: 'cors'
      // Removed credentials: 'include' as it can cause CORS issues with some backends
    };
    
    // Si no es FormData, agregar Content-Type
    if (!(options.body instanceof FormData) && options.body) {
      config.headers['Content-Type'] = 'application/json';
    }
    
    try {
      const response = await fetch(url, config);
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.detail || errorData.message || `Error ${response.status}`);
      }
      
      // Para DELETE, puede no haber contenido
      if (response.status === 204 || response.status === 200) {
        const text = await response.text();
        return text ? JSON.parse(text) : {};
      }
      
      return await response.json();
    } catch (error) {
      console.error('API Call Error:', error);
      // Si es error de CORS, intentar con authService
      if (error.message.includes('CORS') || error.message.includes('fetch')) {
        console.log('⚠️ Error de CORS detectado, intentando con authService...');
        throw new Error('Error de conexión. Por favor, intenta nuevamente.');
      }
      throw error;
    }
  }

  /**
   * Inicializar y mostrar el modal
   */
  async show() {
    try {
      // Primero obtener los datos del usuario actual
      await this.loadUserProfile();
      
      // Crear y mostrar el modal
      this.createModal();
      this.attachEventListeners();
      
      // Animar entrada
      requestAnimationFrame(() => {
        this.modal.classList.add('show');
      });
    } catch (error) {
      console.error('Error al abrir modal de perfil:', error);
      this.showNotification('Error al cargar perfil', 'error');
    }
  }

  /**
   * Cargar datos del perfil actual
   */
  async loadUserProfile() {
    // Usar el servicio de autenticación existente que maneja CORS correctamente
    if (typeof authService !== 'undefined' && authService.getMyProfile) {
      // Usar authService si está disponible
      this.userData = await authService.getMyProfile();
      console.log('📱 Perfil cargado desde authService:', this.userData);
    } else {
      // Fallback: intentar obtener desde localStorage primero
      const storedUser = localStorage.getItem('current_user');
      if (storedUser) {
        this.userData = JSON.parse(storedUser);
        console.log('📱 Perfil cargado desde localStorage:', this.userData);
      } else {
        throw new Error('No se pudo cargar el perfil del usuario');
      }
    }
    
    // ✅ CORRECTO - Usar foto_perfil de la base de datos (campo correcto)
    console.log('🔍 Verificando URLs de avatar:', {
      avatar_url: this.userData.avatar_url ? 'EXISTS' : 'NOT FOUND',
      foto_perfil: this.userData.foto_perfil ? 'EXISTS' : 'NOT FOUND'
    });
    
    // Prioridad: foto_perfil (BD) > avatar_url (localStorage) > iniciales
    if (this.userData.foto_perfil) {
      this.userData.avatar_url = this.userData.foto_perfil;
      console.log('✅ Usando foto_perfil de la BD:', this.userData.foto_perfil);
    } else if (this.userData.avatar_url) {
      console.log('✅ Usando avatar_url existente:', this.userData.avatar_url);
    }
    
    console.log('📱 Avatar final para mostrar:', this.userData.avatar_url ? 'LOADED' : 'NOT FOUND');
  }

  /**
   * Crear estructura HTML del modal
   */
  createModal() {
    // Remover modal existente si lo hay
    if (this.modal) {
      this.modal.remove();
    }

    // Debug: Ver qué URL se va a poner en el HTML
    const avatarUrl = this.userData?.avatar_url || this.getDefaultAvatar();
    console.log('🖼️ URL que se pondrá en el avatar:', avatarUrl);
    console.log('🖼️ ¿Es URL de ImageKit?', avatarUrl.includes('imagekit.io') ? 'YES' : 'NO');
    
    const modalHTML = `
      <div class="profile-modal-overlay">
        <div class="profile-modal-container">
          <!-- Header -->
          <div class="profile-modal-header">
            <h2>Mi Perfil</h2>
            <button class="close-btn" aria-label="Cerrar">
              <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <line x1="18" y1="6" x2="6" y2="18"></line>
                <line x1="6" y1="6" x2="18" y2="18"></line>
              </svg>
            </button>
          </div>

          <!-- Content -->
          <div class="profile-modal-body">
            <!-- Avatar Section -->
            <div class="avatar-section">
              <div class="avatar-container">
                <img id="avatarPreview" 
                     src="${avatarUrl}" 
                     alt="Avatar"
                     onerror="this.src='${this.getDefaultAvatar()}'">
                <div class="avatar-overlay">
                  <label for="avatarInput" class="avatar-upload-btn">
                    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                      <path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z"></path>
                      <circle cx="12" cy="13" r="4"></circle>
                    </svg>
                    <span>Cambiar foto</span>
                  </label>
                  <input type="file" 
                         id="avatarInput" 
                         accept="image/jpeg,image/jpg,image/png,image/webp" 
                         style="display: none;">
                </div>
              </div>
              ${(this.userData?.avatar_url || this.userData?.foto_perfil) ? `
                <button class="remove-avatar-btn" type="button">
                  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <polyline points="3 6 5 6 21 6"></polyline>
                    <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
                  </svg>
                  Eliminar foto
                </button>
              ` : ''}
              <small class="avatar-hint" style="color: #6b7280; font-size: 0.75rem; margin-top: 8px; font-style: italic;">
                Nota: La foto se guarda localmente en tu navegador
              </small>
            </div>

            <!-- Form Section -->
            <form id="profileForm" class="profile-form">
              <!-- Nombre -->
              <div class="form-group">
                <label for="nombre">
                  <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path>
                    <circle cx="12" cy="7" r="4"></circle>
                  </svg>
                  Nombre completo
                </label>
                <input type="text" 
                       id="nombre" 
                       name="nombre" 
                       value="${this.userData?.nombre || ''}"
                       placeholder="Ingrese su nombre completo"
                       required>
              </div>

              <!-- Email (solo lectura) -->
              <div class="form-group">
                <label for="email">
                  <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"></path>
                    <polyline points="22,6 12,13 2,6"></polyline>
                  </svg>
                  Correo electrónico
                </label>
                <input type="email" 
                       id="email" 
                       value="${this.userData?.email || ''}"
                       readonly
                       class="readonly-field">
                <small class="field-hint">El correo no se puede modificar</small>
              </div>

              <!-- Teléfono -->
              <div class="form-group">
                <label for="telefono">
                  <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"></path>
                  </svg>
                  Teléfono
                </label>
                <input type="tel"
                       id="telefono"
                       name="telefono"
                       value="${this.userData?.telefono || ''}"
                       placeholder="999999999"
                       pattern="[0-9]{7,15}">
              </div>

              <!-- Info adicional (solo lectura) -->
              <div class="info-section">
                <div class="info-item">
                  <span class="info-label">Perfil:</span>
                  <span class="info-value">${this.getPerfilName(this.userData?.perfil_id)}</span>
                </div>
                <div class="info-item">
                  <span class="info-label">Miembro desde:</span>
                  <span class="info-value">${this.formatDate(this.userData?.fecha_registro)}</span>
                </div>
              </div>
            </form>
          </div>

          <!-- Footer -->
          <div class="profile-modal-footer">
            <button type="button" class="btn btn-secondary" id="cancelBtn">
              Cancelar
            </button>
            <button type="submit" form="profileForm" class="btn btn-primary" id="saveBtn">
              <span class="btn-text">Guardar cambios</span>
              <span class="btn-loader" style="display: none;">
                <svg class="spinner" width="16" height="16" viewBox="0 0 16 16">
                  <circle cx="8" cy="8" r="7" stroke-width="2" stroke="currentColor" fill="none" stroke-dasharray="32" stroke-dashoffset="32">
                    <animate attributeName="stroke-dashoffset" dur="1s" values="32;0" repeatCount="indefinite"/>
                  </circle>
                </svg>
                Guardando...
              </span>
            </button>
          </div>
        </div>
      </div>
    `;

    // Agregar al DOM
    const modalElement = document.createElement('div');
    modalElement.className = 'profile-modal';
    modalElement.innerHTML = modalHTML;
    document.body.appendChild(modalElement);
    
    this.modal = modalElement.querySelector('.profile-modal-overlay');
    this.avatarPreview = modalElement.querySelector('#avatarPreview');
  }

  /**
   * Adjuntar event listeners
   */
  attachEventListeners() {
    const form = this.modal.querySelector('#profileForm');
    const avatarInput = this.modal.querySelector('#avatarInput');
    const removeAvatarBtn = this.modal.querySelector('.remove-avatar-btn');
    const closeBtn = this.modal.querySelector('.close-btn');
    const cancelBtn = this.modal.querySelector('#cancelBtn');
    const overlay = this.modal;

    // Cerrar modal
    closeBtn.addEventListener('click', () => this.close());
    cancelBtn.addEventListener('click', () => this.close());
    
    // Cerrar al hacer click fuera
    overlay.addEventListener('click', (e) => {
      if (e.target === overlay) {
        this.close();
      }
    });

    // Escape key
    this.escapeHandler = (e) => {
      if (e.key === 'Escape') this.close();
    };
    document.addEventListener('keydown', this.escapeHandler);

    // Cambiar avatar
    avatarInput.addEventListener('change', (e) => this.handleAvatarChange(e));

    // Eliminar avatar
    if (removeAvatarBtn) {
      removeAvatarBtn.addEventListener('click', () => this.handleRemoveAvatar());
    }

    // Submit form
    form.addEventListener('submit', (e) => this.handleSubmit(e));
  }

  /**
   * Manejar cambio de avatar
   */
  handleAvatarChange(event) {
    const file = event.target.files[0];
    if (!file) return;

    // Validar tipo
    const validTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
    if (!validTypes.includes(file.type)) {
      this.showNotification('Por favor selecciona una imagen válida (JPG, PNG, WEBP)', 'error');
      return;
    }

    // Validar tamaño (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      this.showNotification('La imagen no debe superar los 5MB', 'error');
      return;
    }

    this.avatarFile = file;

    // Preview
    const reader = new FileReader();
    reader.onload = (e) => {
      this.avatarPreview.src = e.target.result;
      
      // Agregar botón de eliminar si no existe
      const avatarSection = this.modal.querySelector('.avatar-section');
      if (!avatarSection.querySelector('.remove-avatar-btn')) {
        const removeBtn = document.createElement('button');
        removeBtn.className = 'remove-avatar-btn';
        removeBtn.type = 'button';
        removeBtn.innerHTML = `
          <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <polyline points="3 6 5 6 21 6"></polyline>
            <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
          </svg>
          Eliminar foto
        `;
        removeBtn.addEventListener('click', () => this.handleRemoveAvatar());
        avatarSection.appendChild(removeBtn);
      }
    };
    reader.readAsDataURL(file);
  }

  /**
   * Manejar eliminación de avatar
   */
  async handleRemoveAvatar() {
    if (!confirm('¿Estás seguro de eliminar tu foto de perfil?')) return;

    try {
      // ✅ CORRECTO - Usar Railway URL y headers correctos
      console.log('🗑️ Eliminando avatar del servidor...');
      const response = await fetch('https://appbackimmobiliaria-production.up.railway.app/api/v1/perfiles/avatar', {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('access_token')}`
        }
      });
      
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`);
      }
      
      const result = await response.json();
      console.log('✅ Avatar eliminado del servidor:', result);

      // Actualizar UI localmente
      this.avatarPreview.src = this.getDefaultAvatar();
      this.userData.avatar_url = null;

      // Remover botón de eliminar
      const removeBtn = this.modal.querySelector('.remove-avatar-btn');
      if (removeBtn) {
        removeBtn.remove();
      }

      // Actualizar localStorage
      const currentUser = JSON.parse(localStorage.getItem('current_user') || '{}');
      const updatedUser = {
        ...currentUser,
        avatar_url: null,
        foto_perfil: null
      };
      localStorage.setItem('current_user', JSON.stringify(updatedUser));

      // Actualizar dashboard
      this.updateDashboardInfo(this.userData);

      this.showNotification('Foto de perfil eliminada correctamente', 'success');

    } catch (error) {
      console.error('❌ Error eliminando avatar:', error.message);
      this.showNotification('Error al eliminar la foto de perfil', 'error');
    }
  }

  /**
   * Manejar envío del formulario
   */
  async handleSubmit(event) {
    event.preventDefault();
    
    if (this.isLoading) return;
    
    const formData = new FormData(event.target);
    
    try {
      this.setLoading(true);

      // 1. Intentar subir avatar si hay uno nuevo
      let localAvatarUrl = null;
      if (this.avatarFile) {
        console.log('📤 Procesando avatar file:', this.avatarFile.name, 'size:', this.avatarFile.size);
        
        // ✅ CORRECTO - Usar 'file' como nombre del campo (espera el backend)
        const avatarFormData = new FormData();
        avatarFormData.append('file', this.avatarFile);
        
        // Debug del FormData
        console.log('📋 FormData contents:');
        for (let [key, value] of avatarFormData.entries()) {
          console.log(`  ${key}:`, value instanceof File ? `File(${value.name}, ${value.size} bytes)` : value);
        }
        
        try {
          // ✅ CORRECTO - Usar Railway URL y endpoint correcto
          console.log('🌐 Subiendo avatar al servidor...');
          const response = await fetch('https://appbackimmobiliaria-production.up.railway.app/api/v1/perfiles/avatar', {
            method: 'POST',
            headers: {
              'Authorization': `Bearer ${localStorage.getItem('access_token')}`
              // ⚠️ NO poner Content-Type con FormData
            },
            body: avatarFormData
          });
          
          if (!response.ok) {
            throw new Error(`HTTP ${response.status}`);
          }
          
          const result = await response.json();
          console.log('📸 Respuesta del servidor:', result);
          
          // ✅ CORRECTO - La URL viene en result.data.foto_perfil
          if (result.data && result.data.foto_perfil) {
            this.userData.avatar_url = result.data.foto_perfil;
            console.log('✅ Avatar subido al servidor:', this.userData.avatar_url);
          } else {
            console.warn('⚠️ Respuesta inesperada del servidor:', result);
          }
          
        } catch (avatarError) {
          console.error('❌ Error subiendo avatar:', avatarError.message);
          alert('❌ Error al subir la foto. Intenta de nuevo.');
          return; // No continuar si falló la subida
        }
      }

      // 2. Actualizar datos del perfil (usar authService para evitar CORS)
      const profileData = {
        nombre: formData.get('nombre'),
        telefono: formData.get('telefono') || null
      };

      console.log('📝 Actualizando perfil con datos:', profileData);

      let updatedProfile;
      try {
        // ✅ CORRECTO - Usar authService que maneja CORS
        if (typeof authService !== 'undefined' && authService.updateMyProfile) {
          console.log('🌐 Enviando actualización vía authService...');
          updatedProfile = await authService.updateMyProfile(profileData);
        } else {
          // Fallback: usar Railway directo
          console.log('🌐 Enviando actualización a Railway...');
          const response = await fetch('https://appbackimmobiliaria-production.up.railway.app/api/v1/perfiles/me', {
            method: 'PUT',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${localStorage.getItem('access_token')}`
            },
            body: JSON.stringify(profileData)
          });

          if (!response.ok) {
            throw new Error(`HTTP ${response.status}`);
          }

          const result = await response.json();
          updatedProfile = result.data || result;
        }
        console.log('✅ Perfil actualizado:', updatedProfile);

      } catch (updateError) {
        console.error('❌ Error actualizando perfil:', updateError.message);
        this.showNotification('Error al actualizar el perfil', 'error');
        return;
      }

      // Actualizar datos locales con la URL del servidor
      const currentUser = JSON.parse(localStorage.getItem('current_user') || '{}');
      console.log('📋 Current user before update:', {
        nombre: currentUser.nombre,
        avatar_url: currentUser.avatar_url ? 'EXISTS' : 'NOT FOUND',
        foto_perfil: currentUser.foto_perfil ? 'EXISTS' : 'NOT FOUND'
      });
      
      // ✅ CORRECTO - Preservar nombre y actualizar avatar
      const updatedUser = {
        ...currentUser,
        // Preservar datos importantes del usuario
        nombre: profileData.nombre || currentUser.nombre,
        telefono: profileData.telefono || currentUser.telefono,
        email: currentUser.email,
        apellido: currentUser.apellido,
        perfil_id: currentUser.perfil_id,
        rol: currentUser.rol,
        
        // Actualizar avatar con la URL del servidor
        avatar_url: this.userData.avatar_url || currentUser.avatar_url,
        foto_perfil: this.userData.avatar_url || currentUser.foto_perfil
      };
      
      console.log('💾 Guardando en localStorage:', {
        nombre: updatedUser.nombre,
        serverAvatarUrl: this.userData.avatar_url ? 'EXISTS' : 'NOT FOUND',
        finalAvatarUrl: updatedUser.avatar_url ? 'EXISTS' : 'NOT FOUND'
      });
      
      localStorage.setItem('current_user', JSON.stringify(updatedUser));
      
      // También actualizar authService si está disponible
      if (typeof authService !== 'undefined' && authService.saveUserToStorage) {
        authService.saveUserToStorage(updatedUser);
      }
      
      // Verificar que se guardó correctamente
      const savedUser = JSON.parse(localStorage.getItem('current_user') || '{}');
      console.log('✅ Verificación post-guardado:', {
        nombre: savedUser.nombre,
        avatar_url: savedUser.avatar_url ? 'EXISTS' : 'NOT FOUND',
        foto_perfil: savedUser.foto_perfil ? 'EXISTS' : 'NOT FOUND'
      });

      // Actualizar UI del dashboard
      this.updateDashboardInfo({
        ...updatedProfile,
        avatar_url: updatedUser.avatar_url
      });
      
      this.showNotification('Perfil actualizado correctamente', 'success');
      
      // Cerrar modal después de un momento
      setTimeout(() => this.close(), 1500);
      
    } catch (error) {
      console.error('Error:', error);
      this.showNotification(error.message || 'Error al actualizar el perfil', 'error');
    } finally {
      this.setLoading(false);
    }
  }

  /**
   * Actualizar info en el dashboard
   */
  updateDashboardInfo(profile) {
    // Actualizar avatar en el header si existe
    this.updateDashboardAvatar(profile.avatar_url);
    
    // Actualizar nombre si existe
    const nameElement = document.querySelector('.user-name, #userName');
    if (nameElement && profile.nombre) {
      nameElement.textContent = profile.nombre;
    }
    
    // Actualizar el dashboard-app si existe
    if (window.dashboardApp && typeof window.dashboardApp.refreshUserInfo === 'function') {
      window.dashboardApp.refreshUserInfo();
    }
  }

  /**
   * Actualizar avatar en el dashboard
   */
  updateDashboardAvatar(avatarUrl) {
    // Actualizar en el header del dashboard
    const dashboardAvatar = document.querySelector('#userAvatar img, .user-avatar img');
    const avatarInitials = document.querySelector('#avatarInitials');
    
    if (avatarUrl) {
      // Si hay avatar URL o data URL
      if (!dashboardAvatar) {
        // Crear imagen si no existe
        const userAvatarContainer = document.querySelector('#userAvatar, .user-avatar');
        if (userAvatarContainer) {
          const img = document.createElement('img');
          img.src = avatarUrl;
          img.alt = 'Avatar';
          img.className = 'user-avatar-img';
          userAvatarContainer.innerHTML = '';
          userAvatarContainer.appendChild(img);
        }
      } else {
        // Actualizar imagen existente
        dashboardAvatar.src = avatarUrl;
      }
    } else {
      // Sin avatar, mostrar iniciales
      const userAvatarContainer = document.querySelector('#userAvatar, .user-avatar');
      if (userAvatarContainer && avatarInitials) {
        userAvatarContainer.innerHTML = avatarInitials.outerHTML;
      } else if (userAvatarContainer) {
        // Recrear las iniciales
        const name = this.userData?.nombre || 'Usuario';
        const initials = this.getInitials(name);
        userAvatarContainer.innerHTML = `<span id="avatarInitials">${initials}</span>`;
      }
    }
  }
  
  /**
   * Obtener iniciales del nombre
   */
  getInitials(name) {
    const nameParts = name ? name.split(' ') : ['U'];
    if (nameParts.length > 1) {
      return nameParts.slice(0, 2).map(n => n.charAt(0)).join('').toUpperCase();
    }
    return (nameParts[0] || 'U').substring(0, 2).toUpperCase();
  }

  /**
   * Obtener avatar por defecto
   */
  getDefaultAvatar() {
    const name = this.userData?.nombre || 'Usuario';
    const initials = this.getInitials(name);
    
    // Crear avatar con iniciales usando SVG data URI
    const svg = `
      <svg xmlns="http://www.w3.org/2000/svg" width="150" height="150" viewBox="0 0 150 150">
        <rect width="150" height="150" fill="%23006bb3"/>
        <text x="50%" y="50%" text-anchor="middle" dy=".35em" fill="white" font-family="Arial" font-size="60" font-weight="600">
          ${initials}
        </text>
      </svg>
    `;
    
    return `data:image/svg+xml,${encodeURIComponent(svg)}`;
  }

  /**
   * Obtener nombre del perfil
   */
  getPerfilName(perfilId) {
    const perfiles = {
      1: 'Demandante',
      2: 'Ofertante',
      3: 'Corredor',
      4: 'Administrador'
    };
    return perfiles[perfilId] || 'Usuario';
  }

  /**
   * Formatear fecha
   */
  formatDate(dateString) {
    if (!dateString) return 'N/A';
    const date = new Date(dateString);
    return date.toLocaleDateString('es-PE', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  }

  /**
   * Mostrar/ocultar loading
   */
  setLoading(loading) {
    this.isLoading = loading;
    const saveBtn = this.modal.querySelector('#saveBtn');
    const btnText = saveBtn.querySelector('.btn-text');
    const btnLoader = saveBtn.querySelector('.btn-loader');
    
    if (loading) {
      saveBtn.disabled = true;
      btnText.style.display = 'none';
      btnLoader.style.display = 'inline-flex';
    } else {
      saveBtn.disabled = false;
      btnText.style.display = 'inline';
      btnLoader.style.display = 'none';
    }
  }

  /**
   * Mostrar notificación
   */
  showNotification(message, type = 'info') {
    const notification = document.createElement('div');
    notification.className = `profile-notification ${type}`;
    notification.innerHTML = `
      <div class="notification-content">
        ${type === 'success' ? '✅' : type === 'error' ? '❌' : 'ℹ️'}
        <span>${message}</span>
      </div>
    `;
    
    document.body.appendChild(notification);
    
    // Animar entrada
    setTimeout(() => notification.classList.add('show'), 10);
    
    // Remover después de 3 segundos
    setTimeout(() => {
      notification.classList.remove('show');
      setTimeout(() => notification.remove(), 300);
    }, 3000);
  }

  /**
   * Cerrar modal
   */
  close() {
    if (this.modal) {
      this.modal.classList.remove('show');
      
      // Remover event listeners
      document.removeEventListener('keydown', this.escapeHandler);
      
      // Remover del DOM después de la animación
      setTimeout(() => {
        if (this.modal) {
          this.modal.remove();
          this.modal = null;
        }
      }, 300);
    }
  }
}

// Exponer globalmente
window.ProfileModal = ProfileModal;

/**
 * 🏢 PROPERTY FORM MODULE - Formulario Multipaso
 * Se renderiza DENTRO del tab de dashboard
 */

class PropertyForm {
  constructor(dashboard, propId = null) {
    this.dashboard = dashboard;
    this.propId = propId;
    this.currentStep = 1;
    this.totalSteps = 5;
    
    // Estado del formulario
    this.formData = {
      propietario_real_nombre: '',
      propietario_real_dni: '',
      propietario_real_telefono: '',
      propietario_real_email: '',
      tipo_inmueble_id: null,
      distrito_id: null,
      nombre_inmueble: '',
      direccion: '',
      latitud: null,
      longitud: null,
      area: null,
      habitaciones: null,
      banos: null,
      parqueos: null,
      antiguedad: null,
      transaccion: 'venta',
      precio_venta: null,
      precio_alquiler: null,
      moneda: 'PEN',
      titulo: '',
      descripcion: '',
      imagen_principal: null,
      imagenes_galeria: [],
      caracteristicas: []
    };
    
    // Catálogos
    this.tiposInmuebles = [];
    this.distritos = [];
    this.caracteristicasDisponibles = [];
  }

  async init() {
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('🎯 INICIALIZANDO PropertyForm');
    console.log('propId:', this.propId);
    console.log('Modo:', this.propId ? 'EDITAR' : 'NUEVO');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    
    // Exponer globalmente para callbacks inline
    window.propertyForm = this;
    
    console.log('1️⃣ Cargando catálogos...');
    await this.loadCatalogos();
    console.log('✅ Catálogos cargados');
    
    if (this.propId) {
      console.log('2️⃣ Cargando datos de propiedad (modo EDITAR)...');
      await this.loadPropertyData();
      console.log('✅ Datos de propiedad cargados');
    } else {
      console.log('ℹ️ Modo NUEVO - no se cargan datos previos');
    }
    
    console.log('3️⃣ Renderizando formulario...');
    this.render();
    console.log('✅ PropertyForm inicializado completamente');
  }

  async loadCatalogos() {
    try {
      console.log('📦 Cargando catálogos desde API...');
      
      // ✅ APIs PÚBLICAS - NO requieren token
      const [tiposRes, distritosRes] = await Promise.all([
        fetch(`${API_CONFIG.BASE_URL}/tipos-inmueble`),
        fetch(`${API_CONFIG.BASE_URL}/distritos`)
      ]);
      
      console.log('📡 Respuestas recibidas:', {
        tiposStatus: tiposRes.status,
        distritosStatus: distritosRes.status
      });
      
      if (!tiposRes.ok || !distritosRes.ok) {
        throw new Error('Error en las respuestas de la API');
      }
      
      const tiposData = await tiposRes.json();
      const distritosData = await distritosRes.json();
      
      console.log('📋 Datos raw recibidos:', {
        tipos: tiposData,
        distritos: distritosData
      });
      
      this.tiposInmuebles = tiposData.data || tiposData || [];
      this.distritos = distritosData.data || distritosData || [];
      
      console.log('✅ Catálogos cargados correctamente:', {
        totalTipos: this.tiposInmuebles.length,
        totalDistritos: this.distritos.length
      });
      
      if (this.tiposInmuebles.length === 0) {
        console.warn('⚠️ No se cargaron tipos de inmueble');
      }
      if (this.distritos.length === 0) {
        console.warn('⚠️ No se cargaron distritos');
      }
      
    } catch (error) {
      console.error('❌ Error cargando catálogos:', error);
      showNotification('❌ Error al cargar tipos y distritos', 'error');
    }
  }

  async loadCaracteristicasPorTipo(tipoId) {
    if (!tipoId) return;
    
    try {
      console.log(`📦 Cargando características para tipo ${tipoId}...`);
      
      // ✅ API PÚBLICA - NO requiere token
      const response = await fetch(
        `${API_CONFIG.BASE_URL}/caracteristicas-x-inmueble/tipo-inmueble/${tipoId}/agrupadas`
      );
      
      console.log('📡 Respuesta características:', response.status);
      
      if (!response.ok) {
        throw new Error(`Error ${response.status} al cargar características`);
      }
      
      const data = await response.json();
      console.log('📋 Datos características raw:', data);
      
      // La respuesta viene con estructura: { tipo_inmueble_id, tipo_inmueble_nombre, categorias: [...] }
      this.caracteristicasDisponibles = data.categorias || data.data || [];
      
      console.log('✅ Características cargadas:', {
        tipo: tipoId,
        totalGrupos: this.caracteristicasDisponibles.length
      });
      
      // Re-renderizar el paso 3 si estamos ahí
      if (this.currentStep === 3) {
        const container = document.getElementById('caracteristicasContainer');
        if (container) {
          container.innerHTML = this.renderCaracteristicasAcordeon();
          // Re-aplicar event listeners del acordeón
          this.setupCaracteristicasListeners();
        }
      }
      
    } catch (error) {
      console.error('❌ Error cargando características:', error);
      showNotification('❌ Error al cargar características', 'error');
    }
  }

  setupCaracteristicasListeners() {
    document.querySelectorAll('.carac-header').forEach(header => {
      header.addEventListener('click', () => {
        const grupo = header.parentElement;
        const isActive = grupo.classList.contains('active');
        
        // Cerrar todos
        document.querySelectorAll('.carac-group').forEach(g => g.classList.remove('active'));
        
        // Abrir/cerrar el clickeado
        if (!isActive) {
          grupo.classList.add('active');
        }
      });
    });
  }

  async loadPropertyData() {
    try {
      console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
      console.log('📝 CARGANDO DATOS PARA EDITAR');
      console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
      console.log('🆔 Propiedad ID:', this.propId);
      
      const token = authService.getToken();
      console.log('🔑 Token obtenido:', token ? 'OK (' + token.substring(0, 20) + '...)' : '❌ NO HAY TOKEN');
      
      const url = `${API_CONFIG.BASE_URL}/propiedades/${this.propId}`;
      console.log('🌐 URL:', url);
      
      console.log('📡 Enviando petición GET con Authorization...');
      const response = await fetch(url, {
        method: 'GET',
        headers: { 
          'Authorization': `Bearer ${token}` 
        }
      });
      
      console.log('📥 Respuesta recibida - Status:', response.status);
      
      // ⚠️ MANEJO DE TOKEN EXPIRADO (401)
      if (response.status === 401) {
        console.error('🔐 Token expirado o inválido al cargar propiedad');
        showNotification('⏱️ Tu sesión expiró. Redirigiendo al login...', 'warning');
        
        setTimeout(() => {
          authService.logout('Sesión expirada');
        }, 2000);
        return;
      }
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        console.error('❌ Error en respuesta:', errorData);
        throw new Error(errorData.message || `Error ${response.status}: No se pudo cargar la propiedad`);
      }
      
      console.log('✅ Status OK, parseando JSON...');
      const result = await response.json();
      console.log('📦 Resultado completo:', result);
      
      const prop = result.data;
      console.log('🏠 Propiedad data:', prop);
      
      if (!prop) {
        console.error('❌ No se encontraron datos de propiedad en result.data');
        throw new Error('No se encontraron datos de la propiedad');
      }
      
      console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
      console.log('🔄 MAPEANDO DATOS A formData...');
      
      // Mapear datos a formData
      this.formData = {
        propietario_real_nombre: prop.propietario_real_nombre || '',
        propietario_real_dni: prop.propietario_real_dni || '',
        propietario_real_telefono: prop.propietario_real_telefono || '',
        propietario_real_email: prop.propietario_real_email || '',
        
        tipo_inmueble_id: prop.tipo_inmueble_id,
        distrito_id: prop.distrito_id,
        nombre_inmueble: prop.nombre_inmueble || '',
        direccion: prop.direccion || '',
        latitud: prop.latitud || null,
        longitud: prop.longitud || null,
        
        area: prop.area || null,
        habitaciones: prop.habitaciones || 0,
        banos: prop.banos || 1,
        parqueos: prop.parqueos || 0,
        antiguedad: prop.antiguedad || null,
        
        transaccion: prop.transaccion || 'venta',
        precio_venta: prop.precio_venta || null,
        precio_alquiler: prop.precio_alquiler || null,
        moneda: prop.moneda || 'PEN',
        
        titulo: prop.titulo || '',
        descripcion: prop.descripcion || '',
        
        // Imágenes existentes (URLs)
        imagen_principal_url: prop.imagen_principal || null,
        imagenes_galeria_urls: prop.imagenes || [],
        
        // Imágenes nuevas (Files) - vacío inicialmente
        imagen_principal: null,
        imagenes_galeria: [],
        
        // Características existentes
        caracteristicas: prop.caracteristicas?.map(c => ({
          caracteristica_id: c.caracteristica_id,
          valor: c.valor
        })) || []
      };
      
      console.log('✅ formData MAPEADO:', this.formData);
      
      // Cargar características del tipo
      if (prop.tipo_inmueble_id) {
        console.log('🔄 Cargando características para tipo_inmueble_id:', prop.tipo_inmueble_id);
        await this.loadCaracteristicasPorTipo(prop.tipo_inmueble_id);
      }
      
      console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
      console.log('✅ CARGA DE DATOS COMPLETADA');
      console.log('formData.propietario_real_nombre:', this.formData.propietario_real_nombre);
      console.log('formData.tipo_inmueble_id:', this.formData.tipo_inmueble_id);
      console.log('formData.distrito_id:', this.formData.distrito_id);
      console.log('formData.caracteristicas.length:', this.formData.caracteristicas?.length || 0);
      console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
      
    } catch (error) {
      console.error('❌ Error al cargar propiedad:', error);
      showNotification('❌ Error al cargar la propiedad', 'error');
      // Volver a la lista
      this.dashboard.renderPropertiesPage();
    }
  }

  async buscarCoordenadas(direccion, distrito) {
    try {
      showNotification('🔍 Buscando ubicación...', 'info');
      
      // Intentar varias queries con diferente formato
      const queries = [
        `${direccion}, ${distrito || ''}, Lima, Peru`,
        `${direccion}, Lima, Peru`,
        `${direccion}, ${distrito || ''}, Lima`,
        direccion
      ];
      
      let ubicacionEncontrada = null;
      
      for (const query of queries) {
        console.log('🔍 Intentando geocoding con:', query);
        
        const url = `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(query)}&limit=5&countrycodes=pe`;
        
        const response = await fetch(url, {
          headers: {
            'User-Agent': 'QuadranteInmobiliaria/1.0'
          }
        });
        
        const data = await response.json();
        console.log('📍 Resultados:', data);
        
        if (data && data.length > 0) {
          ubicacionEncontrada = data[0];
          break;
        }
        
        // Esperar un poco entre requests
        await new Promise(resolve => setTimeout(resolve, 500));
      }
      
      if (ubicacionEncontrada) {
        const lat = parseFloat(ubicacionEncontrada.lat);
        const lon = parseFloat(ubicacionEncontrada.lon);
        
        // Actualizar campos
        document.getElementById('latitud').value = lat.toFixed(6);
        document.getElementById('longitud').value = lon.toFixed(6);
        
        this.formData.latitud = lat;
        this.formData.longitud = lon;
        
        showNotification(`✅ Ubicación encontrada`, 'success');
        
        // Mostrar en mapa pequeño (opcional)
        this.mostrarMapaPreview(lat, lon);
      } else {
        showNotification('⚠️ No se encontró automáticamente. Selecciona en el mapa.', 'warning');
        // Abrir modal de mapa para selección manual
        this.abrirMapaSeleccion(direccion, distrito);
      }
    } catch (error) {
      console.error('❌ Error en geocoding:', error);
      showNotification('❌ Error al buscar. Selecciona en el mapa.', 'error');
      this.abrirMapaSeleccion(direccion, distrito);
    }
  }

  mostrarMapaPreview(lat, lon) {
    // Pequeño preview del mapa (opcional)
    console.log(`📍 Ubicación: ${lat}, ${lon}`);
  }

  abrirMapaSeleccion(direccion, distrito) {
    // Crear modal con mapa interactivo
    const modalHtml = `
      <div id="mapModal" style="position: fixed; top: 0; left: 0; right: 0; bottom: 0; background: rgba(0,0,0,0.7); z-index: 999999; display: flex; align-items: center; justify-content: center; padding: 20px;">
        <div style="background: white; border-radius: 12px; max-width: 900px; width: 100%; max-height: 90vh; overflow: hidden; box-shadow: 0 10px 40px rgba(0,0,0,0.3);">
          <!-- Header -->
          <div style="padding: 16px 20px; border-bottom: 1px solid #e5e7eb; display: flex; justify-content: space-between; align-items: center;">
            <h3 style="margin: 0; color: var(--azul-corporativo);">📍 Selecciona la Ubicación</h3>
            <button onclick="propertyForm.cerrarMapaModal()" style="background: none; border: none; font-size: 1.5rem; cursor: pointer; color: #6b7280;">×</button>
          </div>
          
          <!-- Instrucciones -->
          <div style="padding: 12px 20px; background: #f0f9ff; border-bottom: 1px solid #e5e7eb;">
            <p style="margin: 0; font-size: 0.9rem; color: #0369a1;">
              💡 Haz click en el mapa para marcar la ubicación exacta de tu propiedad
            </p>
          </div>
          
          <!-- Mapa -->
          <div id="mapContainer" style="height: 500px; width: 100%;"></div>
          
          <!-- Footer -->
          <div style="padding: 16px 20px; border-top: 1px solid #e5e7eb; display: flex; justify-content: space-between; align-items: center;">
            <div style="font-size: 0.85rem; color: #6b7280;">
              <span id="coordsDisplay">Lat: -, Lng: -</span>
            </div>
            <div style="display: flex; gap: 10px;">
              <button onclick="propertyForm.cerrarMapaModal()" class="btn btn-secondary">Cancelar</button>
              <button onclick="propertyForm.confirmarUbicacion()" class="btn btn-primary">✓ Confirmar Ubicación</button>
            </div>
          </div>
        </div>
      </div>
    `;
    
    document.body.insertAdjacentHTML('beforeend', modalHtml);
    
    // Inicializar mapa Leaflet
    setTimeout(() => {
      // Centro en Lima por defecto
      const defaultLat = -12.0464;
      const defaultLng = -77.0428;
      
      const map = L.map('mapContainer').setView([defaultLat, defaultLng], 13);
      
      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '© OpenStreetMap contributors'
      }).addTo(map);
      
      // Marker
      let marker = null;
      this.tempMarker = null;
      this.tempLat = null;
      this.tempLng = null;
      
      // Click en el mapa
      map.on('click', (e) => {
        const lat = e.latlng.lat;
        const lng = e.latlng.lng;
        
        // Remover marker anterior
        if (marker) {
          map.removeLayer(marker);
        }
        
        // Agregar nuevo marker
        marker = L.marker([lat, lng]).addTo(map);
        
        // Guardar temporalmente
        this.tempLat = lat;
        this.tempLng = lng;
        
        // Actualizar display
        document.getElementById('coordsDisplay').textContent = 
          `Lat: ${lat.toFixed(6)}, Lng: ${lng.toFixed(6)}`;
      });
      
      // Si hay dirección, intentar buscarla y centrar
      if (direccion) {
        this.centrarMapaEnDireccion(map, direccion, distrito);
      }
      
      this.currentMap = map;
    }, 100);
  }

  async centrarMapaEnDireccion(map, direccion, distrito) {
    try {
      const query = `${direccion}, ${distrito || ''}, Lima, Peru`;
      const url = `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(query)}&limit=1&countrycodes=pe`;
      
      const response = await fetch(url, {
        headers: { 'User-Agent': 'QuadranteInmobiliaria/1.0' }
      });
      
      const data = await response.json();
      
      if (data && data.length > 0) {
        const lat = parseFloat(data[0].lat);
        const lng = parseFloat(data[0].lon);
        map.setView([lat, lng], 16);
      }
    } catch (error) {
      console.error('Error al centrar mapa:', error);
    }
  }

  cerrarMapaModal() {
    const modal = document.getElementById('mapModal');
    if (modal) {
      modal.remove();
    }
    if (this.currentMap) {
      this.currentMap.remove();
      this.currentMap = null;
    }
  }

  confirmarUbicacion() {
    if (this.tempLat && this.tempLng) {
      document.getElementById('latitud').value = this.tempLat.toFixed(6);
      document.getElementById('longitud').value = this.tempLng.toFixed(6);
      
      this.formData.latitud = this.tempLat;
      this.formData.longitud = this.tempLng;
      
      showNotification('✅ Ubicación confirmada', 'success');
      this.cerrarMapaModal();
    } else {
      showNotification('⚠️ Primero haz click en el mapa para marcar la ubicación', 'warning');
    }
  }

  render() {
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('🎨 RENDERIZANDO FORMULARIO');
    console.log('Paso:', this.currentStep);
    console.log('Modo:', this.propId ? 'EDITAR (ID: ' + this.propId + ')' : 'NUEVO');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    
    const container = this.dashboard.tabContent;
    
    container.innerHTML = `
      <div class="property-form-container" style="max-width: 900px; margin: 0 auto;">
        ${this.renderHeader()}
        ${this.renderProgressBar()}
        ${this.renderStepContent()}
        ${this.renderNavigationButtons()}
      </div>
    `;
    
    console.log('✅ HTML insertado en el DOM');
    
    this.setupEventListeners();
    console.log('✅ Event listeners configurados');
    
    // Pre-llenar campos si está en modo EDITAR
    if (this.propId) {
      console.log('🔄 Modo EDITAR detectado, llamando a populateFormFields()...');
      this.populateFormFields();
    } else {
      console.log('ℹ️ Modo NUEVO, no se pre-llenan campos');
    }
  }

  populateFormFields() {
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('🔄 EJECUTANDO populateFormFields()');
    console.log('Paso actual:', this.currentStep);
    console.log('formData disponible:', !!this.formData);
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    
    // Rellenar campos según el paso actual
    if (this.currentStep === 1) {
      console.log('📝 Llenando campos del Paso 1 (Propietario)');
      console.log('  propietario_real_nombre:', this.formData.propietario_real_nombre);
      
      const campos = {
        'propietario_nombre': this.formData.propietario_real_nombre || '',
        'propietario_dni': this.formData.propietario_real_dni || '',
        'propietario_telefono': this.formData.propietario_real_telefono || '',
        'propietario_email': this.formData.propietario_real_email || ''
      };
      
      for (const [id, valor] of Object.entries(campos)) {
        const campo = document.getElementById(id);
        if (campo) {
          campo.value = valor;
          console.log(`  ✅ ${id} = "${valor}"`);
        } else {
          console.error(`  ❌ Campo ${id} NO ENCONTRADO en el DOM`);
        }
      }
    } 
    else if (this.currentStep === 2) {
      document.getElementById('tipo_inmueble_id').value = this.formData.tipo_inmueble_id || '';
      document.getElementById('distrito_id').value = this.formData.distrito_id || '';
      document.getElementById('nombre_inmueble').value = this.formData.nombre_inmueble || '';
      document.getElementById('direccion').value = this.formData.direccion || '';
      document.getElementById('latitud').value = this.formData.latitud || '';
      document.getElementById('longitud').value = this.formData.longitud || '';
    } 
    else if (this.currentStep === 3) {
      document.getElementById('area').value = this.formData.area || '';
      document.getElementById('habitaciones').value = this.formData.habitaciones || '';
      document.getElementById('banos').value = this.formData.banos || '';
      document.getElementById('parqueos').value = this.formData.parqueos || '';
      document.getElementById('antiguedad').value = this.formData.antiguedad || '';
      
      // Pre-seleccionar características
      this.formData.caracteristicas.forEach(carac => {
        const input = document.querySelector(`[data-carac-id="${carac.caracteristica_id}"]`);
        if (input) {
          if (input.type === 'checkbox') {
            input.checked = carac.valor === 'Sí';
          } else {
            input.value = carac.valor;
          }
        }
      });
    }
    else if (this.currentStep === 4) {
      // Pre-seleccionar transacción
      const transaccionRadio = document.querySelector(`input[name="transaccion"][value="${this.formData.transaccion}"]`);
      if (transaccionRadio) {
        transaccionRadio.checked = true;
        // Trigger click para activar la card y mostrar campos correctos
        transaccionRadio.closest('.transaction-card')?.click();
      }
      
      // Rellenar precios
      document.getElementById('precio_venta').value = this.formData.precio_venta || '';
      document.getElementById('precio_alquiler').value = this.formData.precio_alquiler || '';
      document.getElementById('moneda_venta').value = this.formData.moneda || 'PEN';
      document.getElementById('moneda_alquiler').value = this.formData.moneda || 'PEN';
      document.getElementById('titulo').value = this.formData.titulo || '';
      document.getElementById('descripcion').value = this.formData.descripcion || '';
    }
  }

  renderHeader() {
    return `
      <div style="margin-bottom: var(--spacing-xl); display: flex; justify-content: space-between; align-items: center;">
        <div>
          <h2 style="color: var(--azul-corporativo); margin: 0 0 8px 0;">
            ${this.propId ? '✏️ Editar' : '➕ Nueva'} Propiedad
          </h2>
          <p style="color: var(--gris-medio); margin: 0;">
            Paso ${this.currentStep} de ${this.totalSteps}: ${this.getStepName(this.currentStep)}
          </p>
        </div>
        <button id="btnVolverLista" class="btn btn-secondary">
          ← Volver a Lista
        </button>
      </div>
    `;
  }

  renderProgressBar() {
    const progress = (this.currentStep / this.totalSteps) * 100;
    const steps = [
      { num: 1, icon: '👤', name: 'Propietario' },
      { num: 2, icon: '🏠', name: 'Información' },
      { num: 3, icon: '📐', name: 'Características' },
      { num: 4, icon: '💰', name: 'Precio' },
      { num: 5, icon: '📸', name: 'Imágenes' }
    ];
    
    return `
      <div class="progress-container" style="background: white; padding: var(--spacing-lg); border-radius: 12px; margin-bottom: var(--spacing-lg); box-shadow: 0 2px 8px rgba(0,0,0,0.1);">
        <!-- Barra de progreso -->
        <div style="position: relative; height: 8px; background: #e9ecef; border-radius: 999px; overflow: hidden; margin-bottom: var(--spacing-lg);">
          <div style="position: absolute; top: 0; left: 0; height: 100%; background: linear-gradient(90deg, var(--azul-corporativo), var(--dorado)); width: ${progress}%; transition: width 0.3s;"></div>
        </div>
        
        <!-- Steps indicators (responsive) -->
        <div class="progress-steps" style="display: flex; justify-content: space-between; gap: 8px;">
          ${steps.map(step => {
            const isActive = step.num === this.currentStep;
            const isCompleted = step.num < this.currentStep;
            
            return `
              <div class="progress-step ${isActive ? 'active' : ''} ${isCompleted ? 'completed' : ''}" style="text-align: center; flex: 1; min-width: 60px;">
                <div class="step-circle" style="width: 44px; height: 44px; border-radius: 50%; background: ${isCompleted ? 'var(--dorado)' : isActive ? 'var(--azul-corporativo)' : '#e9ecef'}; color: ${(isCompleted || isActive) ? 'white' : 'var(--gris-medio)'}; display: inline-flex; align-items: center; justify-content: center; margin-bottom: 6px; font-weight: 700; font-size: 20px; transition: all 0.3s; ${isActive ? 'box-shadow: 0 4px 12px rgba(0, 102, 204, 0.3);' : ''}">
                  ${isCompleted ? '✓' : step.icon}
                </div>
                <div class="step-label" style="font-size: 0.75rem; color: ${isActive ? 'var(--azul-corporativo)' : 'var(--gris-medio)'}; font-weight: ${isActive ? '700' : '500'};">
                  ${step.name}
                </div>
              </div>
            `;
          }).join('')}
        </div>
      </div>
    `;
  }

  getStepName(step) {
    const names = ['', 'Propietario', 'Información', 'Características', 'Precio', 'Imágenes'];
    return names[step] || '';
  }

  renderStepContent() {
    return `
      <div style="background: white; padding: var(--spacing-xl); border-radius: 12px; box-shadow: 0 2px 8px rgba(0,0,0,0.1); margin-bottom: var(--spacing-lg);">
        ${this.renderCurrentStep()}
      </div>
    `;
  }

  renderCurrentStep() {
    const steps = [
      null,
      () => this.renderStep1(),
      () => this.renderStep2(),
      () => this.renderStep3(),
      () => this.renderStep4(),
      () => this.renderStep5()
    ];
    return steps[this.currentStep] ? steps[this.currentStep]() : '<p>Paso no encontrado</p>';
  }

  renderStep1() {
    return `
      <h3 style="margin-bottom: var(--spacing-lg); color: var(--azul-corporativo);">
        👤 Información del Propietario
      </h3>
      <div style="display: grid; gap: var(--spacing-md);">
        ${this.renderInput('propietario_nombre', 'Nombre Completo', 'text', true, 'Juan Pérez García')}
        ${this.renderInput('propietario_dni', 'DNI', 'text', true, '12345678', { maxlength: 8, pattern: '[0-9]{8}' })}
        ${this.renderInput('propietario_telefono', 'Teléfono', 'tel', true, '+51 999 888 777')}
        ${this.renderInput('propietario_email', 'Email', 'email', false, 'juan.perez@email.com')}
      </div>
    `;
  }

  renderStep2() {
    return `
      <h3 style="margin-bottom: var(--spacing-lg); color: var(--azul-corporativo);">
        🏠 Información Básica del Inmueble
      </h3>
      <div style="display: grid; gap: var(--spacing-md);">
        ${this.renderSelect('tipo_inmueble_id', 'Tipo de Inmueble', this.tiposInmuebles, true)}
        ${this.renderSelect('distrito_id', 'Distrito', this.distritos, true)}
        ${this.renderInput('nombre_inmueble', 'Nombre del Inmueble', 'text', true, 'Departamento Vista al Mar')}
        ${this.renderInput('direccion', 'Dirección', 'text', true, 'Av. La Marina 2000')}
        
        <div style="display: grid; grid-template-columns: 1fr 1fr auto; gap: var(--spacing-sm);">
          ${this.renderInput('latitud', 'Latitud', 'number', false, '-12.0975', { step: '0.000001' })}
          ${this.renderInput('longitud', 'Longitud', 'number', false, '-77.0305', { step: '0.000001' })}
          <div style="align-self: end;">
            <button type="button" id="btnUbicarMapa" class="btn btn-secondary">📍</button>
          </div>
        </div>
      </div>
    `;
  }

  renderStep3() {
    return `
      <h3 style="margin-bottom: var(--spacing-md); color: var(--azul-corporativo); font-size: 1.1rem;">
        📐 Características del Inmueble
      </h3>
      
      <!-- Características Físicas Básicas -->
      <div style="background: #f8f9fa; padding: var(--spacing-md); border-radius: 8px; margin-bottom: var(--spacing-lg);">
        <h4 style="margin-bottom: var(--spacing-sm); color: var(--azul-corporativo); font-size: 0.95rem;">Datos Básicos</h4>
        <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(140px, 1fr)); gap: var(--spacing-sm);">
          ${this.renderInputCompact('area', 'Área (m²)', 'number', true, '120', { step: '0.01', min: '1' })}
          ${this.renderInputCompact('habitaciones', 'Habitaciones', 'number', false, '3', { min: '0' })}
          ${this.renderInputCompact('banos', 'Baños', 'number', false, '2', { min: '1' })}
          ${this.renderInputCompact('parqueos', 'Parqueos', 'number', false, '1', { min: '0' })}
          ${this.renderInputCompact('antiguedad', 'Años', 'number', false, '5', { min: '0' })}
        </div>
      </div>

      <!-- Características Adicionales (Acordeón) -->
      <div>
        <h4 style="margin-bottom: var(--spacing-sm); color: var(--azul-corporativo); font-size: 0.95rem;">
          ✨ Características Adicionales
        </h4>
        <p style="color: var(--gris-medio); margin-bottom: var(--spacing-md); font-size: 0.85rem;">
          ${this.formData.tipo_inmueble_id 
            ? 'Selecciona las características que apliquen' 
            : '⚠️ Primero selecciona el tipo de inmueble en el Paso 2'}
        </p>
        <div id="caracteristicasContainer">
          ${this.renderCaracteristicasAcordeon()}
        </div>
      </div>
    `;
  }

  renderInputCompact(id, label, type, required, placeholder, attrs = {}) {
    const attrsStr = Object.entries(attrs).map(([k, v]) => `${k}="${v}"`).join(' ');
    return `
      <div class="form-group">
        <label class="form-label" style="font-size: 0.85rem; margin-bottom: 4px;">
          ${label} ${required ? '<span style="color: red;">*</span>' : ''}
        </label>
        <input 
          type="${type}" 
          id="${id}" 
          class="form-input"
          style="padding: 8px 12px; font-size: 0.9rem;"
          placeholder="${placeholder}"
          ${required ? 'required' : ''}
          ${attrsStr}
        />
      </div>
    `;
  }

  renderStep4() {
    return `
      <h3 style="margin-bottom: var(--spacing-lg); color: var(--azul-corporativo);">
        💰 Transacción y Precio
      </h3>
      <div style="display: grid; gap: var(--spacing-lg);">
        <!-- Cards de Transacción -->
        <div class="form-group">
          <label class="form-label">Tipo de Transacción <span style="color: red;">*</span></label>
          <div class="transaction-cards">
            <label class="transaction-card ${this.formData.transaccion === 'venta' ? 'selected' : ''}" data-transaction="venta">
              <input type="radio" name="transaccion" value="venta" ${this.formData.transaccion === 'venta' ? 'checked' : ''} />
              <div class="card-content">
                <div class="card-icon">🏷️</div>
                <div class="card-title">Venta</div>
                <div class="card-subtitle">Propiedad en venta</div>
              </div>
            </label>
            
            <label class="transaction-card ${this.formData.transaccion === 'alquiler' ? 'selected' : ''}" data-transaction="alquiler">
              <input type="radio" name="transaccion" value="alquiler" ${this.formData.transaccion === 'alquiler' ? 'checked' : ''} />
              <div class="card-content">
                <div class="card-icon">📝</div>
                <div class="card-title">Alquiler</div>
                <div class="card-subtitle">Propiedad para alquilar</div>
              </div>
            </label>
          </div>
        </div>

        <!-- Precio Venta -->
        <div id="precioVentaGroup" style="display: ${this.formData.transaccion === 'venta' ? 'block' : 'none'};">
          <label class="form-label">Precio de Venta <span style="color: red;">*</span></label>
          <div style="display: flex; gap: var(--spacing-sm);">
            <select id="moneda_venta" class="form-select" style="flex: 0 0 100px;">
              <option value="PEN" ${this.formData.moneda === 'PEN' ? 'selected' : ''}>S/</option>
              <option value="USD" ${this.formData.moneda === 'USD' ? 'selected' : ''}>$</option>
            </select>
            <input type="number" id="precio_venta" class="form-input" value="${this.formData.precio_venta || ''}" placeholder="250000" step="100" />
          </div>
        </div>

        <!-- Precio Alquiler -->
        <div id="precioAlquilerGroup" style="display: ${this.formData.transaccion === 'alquiler' ? 'block' : 'none'};">
          <label class="form-label">Precio de Alquiler (mensual) <span style="color: red;">*</span></label>
          <div style="display: flex; gap: var(--spacing-sm);">
            <select id="moneda_alquiler" class="form-select" style="flex: 0 0 100px;">
              <option value="PEN" ${this.formData.moneda === 'PEN' ? 'selected' : ''}>S/</option>
              <option value="USD" ${this.formData.moneda === 'USD' ? 'selected' : ''}>$</option>
            </select>
            <input type="number" id="precio_alquiler" class="form-input" value="${this.formData.precio_alquiler || ''}" placeholder="1500" step="50" />
          </div>
        </div>

        <!-- Título SEO -->
        ${this.renderInput('titulo', 'Título del Anuncio', 'text', true, 'Departamento moderno con vista al mar', { maxlength: '150' })}
        
        <!-- Descripción -->
        <div class="form-group">
          <label class="form-label">Descripción</label>
          <textarea id="descripcion" class="form-textarea" rows="6" placeholder="Describe las características destacadas del inmueble, ubicación, acabados, etc.">${this.formData.descripcion}</textarea>
        </div>
      </div>
    `;
  }

  renderStep5() {
    const isEdit = !!this.propId;
    
    return `
      <h3 style="margin-bottom: var(--spacing-md); color: var(--azul-corporativo); font-size: 1.1rem;">
        📸 Imágenes de la Propiedad
      </h3>
      <p style="color: var(--gris-medio); margin-bottom: var(--spacing-lg); font-size: 0.85rem;">
        ${isEdit ? 'Actualiza las imágenes o deja las actuales' : 'Agrega fotos que destaquen las mejores características de tu inmueble'}
      </p>
      
      <!-- Imagen Principal -->
      <div style="margin-bottom: var(--spacing-lg);">
        <label class="form-label" style="font-size: 0.9rem; margin-bottom: var(--spacing-sm);">
          Imagen Principal ${!isEdit ? '<span style="color: red;">*</span>' : ''}
        </label>
        
        ${isEdit && this.formData.imagen_principal_url ? `
          <div style="margin-bottom: var(--spacing-sm); padding: var(--spacing-sm); background: #f0f9ff; border-radius: 8px; border: 1px solid #bfdbfe;">
            <div style="display: flex; align-items: center; gap: var(--spacing-sm);">
              <img src="${this.formData.imagen_principal_url}" style="width: 80px; height: 80px; object-fit: cover; border-radius: 6px;" />
              <div style="flex: 1;">
                <div style="font-weight: 600; color: #0369a1; font-size: 0.9rem;">Imagen Actual</div>
                <div style="font-size: 0.8rem; color: #6b7280;">Puedes reemplazarla subiendo una nueva</div>
              </div>
            </div>
          </div>
        ` : ''}
        
        <div id="dropZonePrincipal" class="drop-zone" style="padding: var(--spacing-lg);">
          <div id="previewPrincipal">
            <div style="font-size: 2.5rem; margin-bottom: 8px;">📷</div>
            <div style="font-weight: 600; margin-bottom: 4px;">${isEdit ? 'Nueva imagen principal (opcional)' : 'Arrastra la imagen aquí o haz click'}</div>
            <small style="color: var(--gris-medio); font-size: 0.8rem;">JPG, PNG o WEBP (máx 5MB)</small>
          </div>
        </div>
        <input type="file" id="imagenPrincipal" accept="image/*" style="display: none;" ${!isEdit ? 'required' : ''} />
      </div>

      <!-- Galería (4 imágenes) -->
      <div>
        <label class="form-label" style="font-size: 0.9rem; margin-bottom: var(--spacing-sm);">
          Galería (hasta 4 imágenes adicionales)
        </label>
        
        ${isEdit && this.formData.imagenes_galeria_urls?.length > 0 ? `
          <div style="margin-bottom: var(--spacing-sm);">
            <div style="font-size: 0.85rem; color: #6b7280; margin-bottom: 8px;">Imágenes actuales (${this.formData.imagenes_galeria_urls.length}):</div>
            <div style="display: grid; grid-template-columns: repeat(auto-fill, minmax(100px, 1fr)); gap: 8px;">
              ${this.formData.imagenes_galeria_urls.map((url, index) => `
                <div style="position: relative;">
                  <img src="${url}" style="width: 100%; height: 100px; object-fit: cover; border-radius: 6px; border: 2px solid #bfdbfe;" />
                  <div style="position: absolute; bottom: 4px; right: 4px; background: rgba(0,0,0,0.7); color: white; padding: 2px 6px; border-radius: 4px; font-size: 0.7rem;">
                    #${index + 1}
                  </div>
                </div>
              `).join('')}
            </div>
          </div>
        ` : ''}
        
        <div id="dropZoneGaleria" class="drop-zone" style="padding: var(--spacing-md);">
          <div style="font-size: 2rem; margin-bottom: 6px;">🖼️</div>
          <div style="font-weight: 600; font-size: 0.9rem;">${isEdit ? 'Nuevas imágenes (reemplazarán las actuales)' : 'Arrastra hasta 4 imágenes'}</div>
        </div>
        <input type="file" id="imagenesGaleria" accept="image/*" multiple style="display: none;" />
        <div id="previewGaleria" style="display: grid; grid-template-columns: repeat(auto-fill, minmax(100px, 1fr)); gap: 8px; margin-top: var(--spacing-md);"></div>
      </div>
    `;
  }

  renderCaracteristicasAcordeon() {
    if (!this.caracteristicasDisponibles || this.caracteristicasDisponibles.length === 0) {
      return `
        <div style="text-align: center; padding: var(--spacing-xl); background: #f8f9fa; border-radius: 12px;">
          <div style="font-size: 3rem; margin-bottom: var(--spacing-md);">🏠</div>
          <p style="color: var(--gris-medio);">
            Las características se cargarán automáticamente cuando selecciones el tipo de inmueble
          </p>
        </div>
      `;
    }

    return `
      <div class="caracteristicas-acordeon">
        ${this.caracteristicasDisponibles.map((grupo, index) => {
          // ✅ La API devuelve: { nombre, orden, caracteristicas }
          const grupoNombre = grupo.nombre || grupo.grupo_nombre || 'Sin categoría';
          const caracteristicas = grupo.caracteristicas || [];
          
          return `
            <div class="carac-group ${index === 0 ? 'active' : ''}" data-grupo="${grupoNombre}">
              <div class="carac-header">
                <div class="carac-header-left">
                  <div class="carac-icon">${this.getGrupoIcon(grupoNombre)}</div>
                  <div>
                    <div class="carac-title">${grupoNombre}</div>
                    <div class="carac-count">${caracteristicas.length} características</div>
                  </div>
                </div>
                <div class="carac-arrow">▼</div>
              </div>
              <div class="carac-body">
                <div class="carac-content">
                  ${caracteristicas.map(carac => {
                    // ✅ La API devuelve: tipo_input (no tipo_dato)
                    const tipoInput = carac.tipo_input || carac.tipo_dato || 'text';
                    const isBoolean = tipoInput === 'checkbox' || tipoInput === 'boolean';
                    const caracId = carac.caracteristica_id || carac.id;
                    const caracNombre = carac.nombre || '';
                    const caracIcono = carac.icono || '📋';
                    
                    return `
                      <label class="checkbox-label">
                        ${isBoolean
                          ? `<input type="checkbox" name="caracteristica_${caracId}" data-carac-id="${caracId}" data-tipo="boolean" />`
                          : `<input type="text" name="caracteristica_${caracId}" data-carac-id="${caracId}" data-tipo="${tipoInput}" placeholder="${caracNombre}" />`
                        }
                        <span>${caracIcono} ${caracNombre}</span>
                      </label>
                    `;
                  }).join('')}
                </div>
              </div>
            </div>
          `;
        }).join('')}
      </div>
    `;
  }

  getGrupoIcon(grupoNombre) {
    // Normalizar nombre para buscar ícono
    const nombre = grupoNombre.toLowerCase();
    
    if (nombre.includes('seguridad')) return '🔒';
    if (nombre.includes('servicio')) return '⚡';
    if (nombre.includes('área') || nombre.includes('comun')) return '🏊';
    if (nombre.includes('acabado')) return '✨';
    if (nombre.includes('ubicación') || nombre.includes('ubicacion')) return '📍';
    if (nombre.includes('exterior') || nombre.includes('jardin')) return '🌳';
    if (nombre.includes('cocina')) return '🍳';
    if (nombre.includes('baño') || nombre.includes('bano')) return '🚿';
    if (nombre.includes('parqueo') || nombre.includes('estacionamiento')) return '🚗';
    if (nombre.includes('edificio')) return '🏢';
    if (nombre.includes('amenidad') || nombre.includes('recreacion')) return '🎯';
    
    return '📋';
  }

  renderInput(id, label, type, required, placeholder, attrs = {}) {
    const attrsStr = Object.entries(attrs).map(([k, v]) => `${k}="${v}"`).join(' ');
    return `
      <div class="form-group">
        <label class="form-label">
          ${label} ${required ? '<span style="color: red;">*</span>' : ''}
        </label>
        <input 
          type="${type}" 
          id="${id}" 
          class="form-input"
          placeholder="${placeholder}"
          ${required ? 'required' : ''}
          ${attrsStr}
        />
      </div>
    `;
  }

  renderSelect(id, label, options, required) {
    return `
      <div class="form-group">
        <label class="form-label">
          ${label} ${required ? '<span style="color: red;">*</span>' : ''}
        </label>
        <select id="${id}" class="form-select" ${required ? 'required' : ''}>
          <option value="">Selecciona...</option>
          ${options.map(opt => `
            <option value="${opt.id || opt.tipo_inmueble_id || opt.distrito_id}">
              ${opt.nombre}
            </option>
          `).join('')}
        </select>
      </div>
    `;
  }

  renderNavigationButtons() {
    return `
      <div style="display: flex; justify-content: space-between; align-items: center;">
        <button 
          type="button" 
          id="btnAnterior" 
          class="btn btn-secondary"
          style="visibility: ${this.currentStep === 1 ? 'hidden' : 'visible'};"
        >
          ← Anterior
        </button>
        
        <div style="color: var(--gris-medio); font-size: 0.9rem;">
          Paso ${this.currentStep} de ${this.totalSteps}
        </div>
        
        <button 
          type="button" 
          id="btnSiguiente" 
          class="btn btn-primary"
        >
          ${this.currentStep === this.totalSteps ? '✅ Publicar Propiedad' : 'Siguiente →'}
        </button>
      </div>
    `;
  }

  setupEventListeners() {
    // Volver a lista
    document.getElementById('btnVolverLista')?.addEventListener('click', () => {
      this.dashboard.renderPropertiesPage();
    });

    // Navegación
    document.getElementById('btnAnterior')?.addEventListener('click', () => this.previousStep());
    document.getElementById('btnSiguiente')?.addEventListener('click', () => this.nextStep());

    // ✅ Transaction Cards (Paso 4)
    document.querySelectorAll('.transaction-card').forEach(card => {
      card.addEventListener('click', () => {
        // Remover selected de todas
        document.querySelectorAll('.transaction-card').forEach(c => c.classList.remove('selected'));
        // Agregar selected a la clickeada
        card.classList.add('selected');
        
        // Activar el radio
        const radio = card.querySelector('input[type="radio"]');
        if (radio) radio.checked = true;
        
        // Mostrar/ocultar campos de precio
        const transaccion = radio.value;
        const precioVenta = document.getElementById('precioVentaGroup');
        const precioAlquiler = document.getElementById('precioAlquilerGroup');
        
        if (transaccion === 'venta') {
          precioVenta.style.display = 'block';
          precioAlquiler.style.display = 'none';
        } else {
          precioVenta.style.display = 'none';
          precioAlquiler.style.display = 'block';
        }
      });
    });

    // ✅ Tipo inmueble change (cargar características)
    document.getElementById('tipo_inmueble_id')?.addEventListener('change', async (e) => {
      const tipoId = e.target.value;
      this.formData.tipo_inmueble_id = tipoId;
      
      if (tipoId) {
        showNotification('Cargando características...', 'info');
        await this.loadCaracteristicasPorTipo(tipoId);
        showNotification('✅ Características cargadas', 'success');
      }
    });

    // ✅ Botón Ubicar en Mapa (Geocoding)
    document.getElementById('btnUbicarMapa')?.addEventListener('click', async () => {
      const direccion = document.getElementById('direccion')?.value;
      const distrito = document.getElementById('distrito_id');
      const distritoTexto = distrito?.options[distrito.selectedIndex]?.text;
      
      if (!direccion) {
        showNotification('⚠️ Primero ingresa una dirección', 'warning');
        return;
      }
      
      await this.buscarCoordenadas(direccion, distritoTexto);
    });

    // ✅ Acordeón de características (Paso 5)
    document.querySelectorAll('.carac-header').forEach(header => {
      header.addEventListener('click', () => {
        const grupo = header.parentElement;
        const isActive = grupo.classList.contains('active');
        
        // Cerrar todos
        document.querySelectorAll('.carac-group').forEach(g => g.classList.remove('active'));
        
        // Abrir/cerrar el clickeado
        if (!isActive) {
          grupo.classList.add('active');
        }
      });
    });

    // Drag & drop imágenes
    this.setupImageHandlers();
  }

  setupImageHandlers() {
    const dropPrincipal = document.getElementById('dropZonePrincipal');
    const inputPrincipal = document.getElementById('imagenPrincipal');
    
    if (dropPrincipal && inputPrincipal) {
      dropPrincipal.addEventListener('click', () => inputPrincipal.click());
      dropPrincipal.addEventListener('dragover', (e) => {
        e.preventDefault();
        dropPrincipal.classList.add('drag-over');
      });
      dropPrincipal.addEventListener('dragleave', (e) => {
        e.preventDefault();
        dropPrincipal.classList.remove('drag-over');
      });
      dropPrincipal.addEventListener('drop', (e) => {
        e.preventDefault();
        dropPrincipal.classList.remove('drag-over');
        if (e.dataTransfer.files.length > 0) {
          this.handleImagePrincipal(e.dataTransfer.files[0]);
        }
      });
      inputPrincipal.addEventListener('change', (e) => {
        if (e.target.files.length > 0) {
          this.handleImagePrincipal(e.target.files[0]);
        }
      });
    }
    
    // Galería (hasta 4 imágenes)
    const dropGaleria = document.getElementById('dropZoneGaleria');
    const inputGaleria = document.getElementById('imagenesGaleria');
    
    if (dropGaleria && inputGaleria) {
      dropGaleria.addEventListener('click', () => inputGaleria.click());
      dropGaleria.addEventListener('dragover', (e) => {
        e.preventDefault();
        dropGaleria.classList.add('drag-over');
      });
      dropGaleria.addEventListener('dragleave', (e) => {
        e.preventDefault();
        dropGaleria.classList.remove('drag-over');
      });
      dropGaleria.addEventListener('drop', (e) => {
        e.preventDefault();
        dropGaleria.classList.remove('drag-over');
        if (e.dataTransfer.files.length > 0) {
          this.handleImagenesGaleria(e.dataTransfer.files);
        }
      });
      inputGaleria.addEventListener('change', (e) => {
        if (e.target.files.length > 0) {
          this.handleImagenesGaleria(e.target.files);
        }
      });
    }
  }

  handleImagenesGaleria(files) {
    const maxFiles = 4;
    const filesArray = Array.from(files).slice(0, maxFiles);
    
    if (files.length > maxFiles) {
      showNotification(`⚠️ Solo se permiten ${maxFiles} imágenes máximo`, 'warning');
    }
    
    // Agregar a formData (sin exceder 4)
    const currentCount = this.formData.imagenes_galeria.length;
    const remaining = maxFiles - currentCount;
    
    if (remaining <= 0) {
      showNotification(`⚠️ Ya tienes ${maxFiles} imágenes. Elimina alguna primero.`, 'warning');
      return;
    }
    
    const toAdd = filesArray.slice(0, remaining);
    this.formData.imagenes_galeria.push(...toAdd);
    
    // Renderizar preview
    this.renderGaleriaPreview();
    showNotification(`✅ ${toAdd.length} imagen(es) agregada(s)`, 'success');
  }

  renderGaleriaPreview() {
    const container = document.getElementById('previewGaleria');
    if (!container) return;
    
    container.innerHTML = this.formData.imagenes_galeria.map((file, index) => {
      const url = URL.createObjectURL(file);
      return `
        <div class="image-preview" style="position: relative;">
          <img src="${url}" style="width: 100%; height: 100px; object-fit: cover; border-radius: 6px;" />
          <button 
            type="button" 
            class="remove-btn" 
            onclick="propertyForm.removeGaleriaImage(${index})"
            style="position: absolute; top: 4px; right: 4px; width: 24px; height: 24px; border-radius: 50%; background: rgba(239, 68, 68, 0.9); color: white; border: none; cursor: pointer; font-size: 0.8rem; display: flex; align-items: center; justify-content: center;"
          >
            ✕
          </button>
        </div>
      `;
    }).join('');
  }

  removeGaleriaImage(index) {
    this.formData.imagenes_galeria.splice(index, 1);
    this.renderGaleriaPreview();
    showNotification('Imagen eliminada', 'info');
  }

  handleImagePrincipal(file) {
    if (file.size > 5 * 1024 * 1024) {
      showNotification('⚠️ La imagen no debe superar 5MB', 'warning');
      return;
    }
    
    if (!file.type.startsWith('image/')) {
      showNotification('⚠️ Solo se permiten archivos de imagen', 'warning');
      return;
    }
    
    this.formData.imagen_principal = file;
    
    const reader = new FileReader();
    reader.onload = (e) => {
      document.getElementById('previewPrincipal').innerHTML = `
        <div class="image-preview" style="position: relative;">
          <img src="${e.target.result}" style="max-width: 100%; max-height: 250px; border-radius: 8px; object-fit: cover;" />
          <button type="button" class="remove-btn" onclick="propertyForm.removeImagePrincipal()" style="position: absolute; top: 8px; right: 8px; width: 32px; height: 32px; border-radius: 50%; background: rgba(239, 68, 68, 0.9); color: white; border: none; cursor: pointer; font-weight: 700; display: flex; align-items: center; justify-content: center;">
            ✕
          </button>
          <div style="margin-top: 8px; text-align: center; color: var(--gris-medio); font-size: 0.85rem;">
            ${file.name} (${(file.size / 1024).toFixed(0)} KB)
          </div>
        </div>
      `;
    };
    reader.readAsDataURL(file);
    showNotification('✅ Imagen cargada correctamente', 'success');
  }

  removeImagePrincipal() {
    this.formData.imagen_principal = null;
    document.getElementById('imagenPrincipal').value = '';
    document.getElementById('previewPrincipal').innerHTML = `
      <div style="font-size: 2.5rem; margin-bottom: 8px;">📷</div>
      <div style="font-weight: 600; margin-bottom: 4px;">Arrastra la imagen aquí o haz click</div>
      <small style="color: var(--gris-medio); font-size: 0.8rem;">JPG, PNG o WEBP (máx 5MB)</small>
    `;
  }

  collectStepData() {
    // Recopilar datos del paso actual
    if (this.currentStep === 1) {
      this.formData.propietario_real_nombre = document.getElementById('propietario_nombre')?.value || '';
      this.formData.propietario_real_dni = document.getElementById('propietario_dni')?.value || '';
      this.formData.propietario_real_telefono = document.getElementById('propietario_telefono')?.value || '';
      this.formData.propietario_real_email = document.getElementById('propietario_email')?.value || '';
    } else if (this.currentStep === 2) {
      this.formData.tipo_inmueble_id = document.getElementById('tipo_inmueble_id')?.value || null;
      this.formData.distrito_id = document.getElementById('distrito_id')?.value || null;
      this.formData.nombre_inmueble = document.getElementById('nombre_inmueble')?.value || '';
      this.formData.direccion = document.getElementById('direccion')?.value || '';
      this.formData.latitud = document.getElementById('latitud')?.value || null;
      this.formData.longitud = document.getElementById('longitud')?.value || null;
    } else if (this.currentStep === 3) {
      this.formData.area = document.getElementById('area')?.value || null;
      this.formData.habitaciones = document.getElementById('habitaciones')?.value || null;
      this.formData.banos = document.getElementById('banos')?.value || null;
      this.formData.parqueos = document.getElementById('parqueos')?.value || null;
      this.formData.antiguedad = document.getElementById('antiguedad')?.value || null;
      
      // ✅ Recolectar características seleccionadas
      this.formData.caracteristicas = [];
      document.querySelectorAll('[data-carac-id]').forEach(input => {
        const caracId = input.dataset.caracId;
        const tipo = input.dataset.tipo;
        
        if (tipo === 'boolean' && input.checked) {
          this.formData.caracteristicas.push({
            caracteristica_id: parseInt(caracId),
            valor: 'Sí'
          });
        } else if (tipo !== 'boolean' && input.value.trim()) {
          this.formData.caracteristicas.push({
            caracteristica_id: parseInt(caracId),
            valor: input.value.trim()
          });
        }
      });
      
      console.log('✅ Características recopiladas:', this.formData.caracteristicas);
    } else if (this.currentStep === 4) {
      const transaccion = document.querySelector('input[name="transaccion"]:checked')?.value || 'venta';
      this.formData.transaccion = transaccion;
      this.formData.precio_venta = document.getElementById('precio_venta')?.value || null;
      this.formData.precio_alquiler = document.getElementById('precio_alquiler')?.value || null;
      this.formData.moneda = document.getElementById(`moneda_${transaccion}`)?.value || 'PEN';
      this.formData.titulo = document.getElementById('titulo')?.value || '';
      this.formData.descripcion = document.getElementById('descripcion')?.value || '';
    }
  }

  validateCurrentStep() {
    // TODO: Validación por paso
    return true;
  }

  previousStep() {
    if (this.currentStep > 1) {
      this.collectStepData();
      this.currentStep--;
      this.render();
    }
  }

  async nextStep() {
    if (!this.validateCurrentStep()) {
      showNotification('Por favor completa todos los campos requeridos', 'warning');
      return;
    }
    
    this.collectStepData();
    
    if (this.currentStep < this.totalSteps) {
      this.currentStep++;
      this.render();
    } else {
      await this.submitForm();
    }
  }

  async submitForm() {
    try {
      const isEdit = !!this.propId;
      
      // Validar imagen principal SOLO en modo CREAR
      if (!isEdit && !this.formData.imagen_principal) {
        showNotification('⚠️ Debes agregar una imagen principal', 'warning');
        this.currentStep = 5;
        this.render();
        return;
      }

      showNotification(isEdit ? '📤 Actualizando propiedad...' : '📤 Publicando propiedad...', 'info');
      
      // Construir JSON para la API
      const propiedadJson = {
        propietario_real_nombre: this.formData.propietario_real_nombre,
        propietario_real_dni: this.formData.propietario_real_dni,
        propietario_real_telefono: this.formData.propietario_real_telefono,
        propietario_real_email: this.formData.propietario_real_email || null,
        
        tipo_inmueble_id: parseInt(this.formData.tipo_inmueble_id),
        distrito_id: parseInt(this.formData.distrito_id),
        nombre_inmueble: this.formData.nombre_inmueble,
        direccion: this.formData.direccion,
        latitud: this.formData.latitud ? parseFloat(this.formData.latitud) : null,
        longitud: this.formData.longitud ? parseFloat(this.formData.longitud) : null,
        
        area: parseFloat(this.formData.area),
        habitaciones: this.formData.habitaciones ? parseInt(this.formData.habitaciones) : 0,
        banos: this.formData.banos ? parseInt(this.formData.banos) : 1,
        parqueos: this.formData.parqueos ? parseInt(this.formData.parqueos) : 0,
        antiguedad: this.formData.antiguedad ? parseInt(this.formData.antiguedad) : null,
        
        transaccion: this.formData.transaccion,
        precio_venta: this.formData.transaccion === 'venta' && this.formData.precio_venta ? parseFloat(this.formData.precio_venta) : null,
        precio_alquiler: this.formData.transaccion === 'alquiler' && this.formData.precio_alquiler ? parseFloat(this.formData.precio_alquiler) : null,
        moneda: this.formData.moneda,
        
        titulo: this.formData.titulo,
        descripcion: this.formData.descripcion || '',
        
        caracteristicas: this.formData.caracteristicas || []
      };

      console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
      console.log('📤 DATOS A ENVIAR AL BACKEND:');
      console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
      console.log('📋 JSON:', JSON.stringify(propiedadJson, null, 2));
      console.log('📸 Imagen Principal:', this.formData.imagen_principal?.name, '(' + (this.formData.imagen_principal?.size / 1024).toFixed(0) + ' KB)');
      console.log('🖼️ Galería:', this.formData.imagenes_galeria.length, 'imágenes');
      this.formData.imagenes_galeria.forEach((img, i) => {
        console.log(`   ${i + 1}. ${img.name} (${(img.size / 1024).toFixed(0)} KB)`);
      });
      console.log('✨ Características:', propiedadJson.caracteristicas.length);
      propiedadJson.caracteristicas.forEach((c, i) => {
        console.log(`   ${i + 1}. ID ${c.caracteristica_id}: "${c.valor}"`);
      });
      console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');

      // Construir FormData
      const formData = new FormData();
      formData.append('propiedad_json', JSON.stringify(propiedadJson));
      
      // Agregar imágenes SOLO si hay nuevas
      if (this.formData.imagen_principal) {
        formData.append('imagen_principal', this.formData.imagen_principal);
        console.log('📸 Nueva imagen principal a enviar');
      } else if (isEdit) {
        console.log('📸 Mantiene imagen principal actual');
      }
      
      // Agregar imágenes de galería SOLO si hay nuevas
      if (this.formData.imagenes_galeria.length > 0) {
        this.formData.imagenes_galeria.forEach((imagen, index) => {
          formData.append('imagenes_galeria', imagen);
        });
        console.log(`🖼️ ${this.formData.imagenes_galeria.length} nuevas imágenes de galería a enviar`);
      } else if (isEdit) {
        console.log('🖼️ Mantiene galería actual');
      }

      // Enviar a la API (diferente endpoint según modo)
      const token = authService.getToken();
      const url = isEdit 
        ? `${API_CONFIG.BASE_URL}/propiedades/actualizar-completa/${this.propId}`
        : `${API_CONFIG.BASE_URL}/propiedades/con-imagenes`;
      
      const response = await fetch(url, {
        method: isEdit ? 'PUT' : 'POST',
        headers: {
          'Authorization': `Bearer ${token}`
        },
        body: formData
      });

      const result = await response.json();
      
      console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
      console.log('📥 RESPUESTA DEL SERVIDOR:');
      console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
      console.log('Status:', response.status);
      console.log('Respuesta:', result);
      console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');

      // ⚠️ MANEJO DE TOKEN EXPIRADO (401)
      if (response.status === 401) {
        console.error('🔐 Token expirado o inválido');
        showNotification('⏱️ Tu sesión expiró. Redirigiendo al login...', 'warning');
        
        setTimeout(() => {
          authService.logout('Sesión expirada');
        }, 2000);
        return;
      }

      if (!response.ok) {
        throw new Error(result.message || result.detail || (isEdit ? 'Error al actualizar propiedad' : 'Error al crear propiedad'));
      }

      showNotification(
        isEdit ? '✅ Propiedad actualizada exitosamente' : '✅ Propiedad publicada exitosamente', 
        'success'
      );
      
      // Volver a la lista y recargar
      setTimeout(async () => {
        await this.dashboard.loadTabContent('propiedades', this.dashboard.currentUser.perfil_id);
      }, 1500);
      
    } catch (error) {
      console.error('❌ Error:', error);
      const isEdit = !!this.propId;
      showNotification(
        `❌ Error al ${isEdit ? 'actualizar' : 'publicar'}: ${error.message}`, 
        'error'
      );
    }
  }
}

// Exponer globalmente
window.PropertyForm = PropertyForm;

/**
 * 🏢 PROPERTY FORM MODULE - Formulario Multipaso
 * Se renderiza DENTRO del tab de dashboard
 */

class PropertyForm {
  constructor(dashboard, propId = null) {
    this.dashboard = dashboard;
    this.propId = propId;
    this.currentStep = 1;
    this.totalSteps = 6; // 🆕 Ahora son 6 pasos (agregado paso para Edificio/Casa)
    
    // Estado del formulario
    this.formData = {
      // 🆕 NUEVO: propietario_id en lugar de propietario_real_*
      propietario_id: null,
      // 🆕 NUEVO: padre_registro_cab_id para oficinas (self-referencing FK)
      padre_registro_cab_id: null,
      tipo_inmueble_id: null,
      distrito_id: null,
      nombre_inmueble: '',
      direccion: '',
      latitud: null,
      longitud: null,
      area: null,
      // ❌ REMOVIDO: habitaciones, banos, parqueos (van a caracteristicas dinámicas)
      antiguedad: null,
      implementacion: null,
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

    // 🆕 Componentes reutilizables
    this.autoFillDNI = null;
    this.selectorEdificio = null;
    this.modalMasivo = null;
    
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
      console.log('ℹ️ Modo NUEVO - cargando datos del usuario logueado...');
      this.loadCurrentUserData();
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
      
      // ✅ Orden personalizado de tipos de inmueble (prioriza edificios completos antes que unidades)
      const getTipoPriority = (tipo) => {
        const nombre = (tipo?.nombre || '').toLowerCase();
        if (nombre.includes('edificio') && nombre.includes('oficina') && nombre.includes('completo')) return 1;
        if (nombre.includes('edificio') && nombre.includes('departamento') && nombre.includes('completo')) return 2;
        if (nombre.includes('condominio')) return 3;
        if (nombre.includes('oficina')) return 4;
        if (nombre.includes('departamento')) return 5;
        if (nombre.includes('casa')) return 6;
        return 9;
      };

      this.tiposInmuebles.sort((a, b) => {
        const prioDiff = getTipoPriority(a) - getTipoPriority(b);
        if (prioDiff !== 0) return prioDiff;
        const ordenA = a.orden || 999;
        const ordenB = b.orden || 999;
        if (ordenA !== ordenB) return ordenA - ordenB;
        return (a.nombre || '').localeCompare(b.nombre || '');
      });
      
      console.log('✅ Catálogos cargados correctamente:', {
        totalTipos: this.tiposInmuebles.length,
        totalDistritos: this.distritos.length,
        ordenTipos: this.tiposInmuebles.map(t => `${t.orden}: ${t.nombre}`)
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
      
      console.log('🔧 API_CONFIG:', API_CONFIG);
      console.log('🔧 API_CONFIG.BASE_URL:', API_CONFIG.BASE_URL);
      console.log('🔧 this.propId:', this.propId);
      
      const url = `${API_CONFIG.BASE_URL}/propiedades/${this.propId}`;
      console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
      console.log('🌐 URL COMPLETA QUE SE VA A LLAMAR:');
      console.log(url);
      console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
      
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
      console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
      console.log('📦 RESULTADO COMPLETO DEL BACKEND:');
      console.log(JSON.stringify(result, null, 2));
      console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
      
      const prop = result.data;
      console.log('🏠 Propiedad data:', prop);
      console.log('🔍 prop.oficinas (tipo):', typeof prop.oficinas);
      console.log('🔍 prop.oficinas (array?):', Array.isArray(prop.oficinas));
      console.log('🔍 prop.oficinas (valor):', prop.oficinas);
      console.log('🔍 prop.oficinas (length):', prop.oficinas?.length);
      console.log('🔍 prop.total_oficinas:', prop.total_oficinas);
      console.log('🔍 Object.keys(prop):', Object.keys(prop));
      
      if (!prop) {
        console.error('❌ No se encontraron datos de propiedad en result.data');
        throw new Error('No se encontraron datos de la propiedad');
      }
      
      console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
      console.log('🔄 MAPEANDO DATOS A formData...');
      
      // 🔍 Buscar IDs desde los catálogos (backend devuelve nombres)
      const tipoInmuebleId = prop.tipo_inmueble_id || 
        this.tiposInmuebles.find(t => t.nombre === prop.tipo_inmueble)?.tipo_inmueble_id;
      
      const distritoId = prop.distrito_id || 
        this.distritos.find(d => d.nombre === prop.distrito)?.distrito_id;
      
      console.log('🔍 tipo_inmueble (nombre):', prop.tipo_inmueble);
      console.log('🔍 tipo_inmueble_id (encontrado):', tipoInmuebleId);
      console.log('🔍 distrito (nombre):', prop.distrito);
      console.log('🔍 distrito_id (encontrado):', distritoId);
      console.log('🔍 nombre_inmueble:', prop.nombre_inmueble);
      console.log('🔍 titulo:', prop.titulo);
      console.log('🔍 padre_registro_cab_id:', prop.padre_registro_cab_id);  // ✅ DEBUG
      console.log('🔍 TODOS LOS CAMPOS:', Object.keys(prop));
      
      // ✅ BUSCAR propietario_id por DNI si no viene en la respuesta
      let propietarioId = prop.propietario?.propietario_id || prop.propietario_id || null;
      
      if (!propietarioId && prop.propietario?.dni) {
        console.log('🔍 propietario_id no viene en respuesta, buscando por DNI:', prop.propietario.dni);
        try {
          const propietarioExistente = await propietarioService.buscarPorDNI(prop.propietario.dni);
          if (propietarioExistente) {
            propietarioId = propietarioExistente.propietario_id;
            console.log('✅ propietario_id encontrado:', propietarioId);
          }
        } catch (error) {
          console.error('❌ Error buscando propietario por DNI:', error);
        }
      }
      
      // Mapear datos a formData (ajustado a estructura real del backend)
      this.formData = {
        // ✅ CRÍTICO: Guardar propietario_id para modo EDITAR
        propietario_id: propietarioId,
        propietario_real_nombre: prop.propietario?.nombre || '',
        propietario_real_dni: prop.propietario?.dni || '',
        propietario_real_telefono: prop.propietario?.telefono || '',
        propietario_real_email: prop.propietario?.email || '',
        
        // ✅ NUEVO: Cargar padre_registro_cab_id y piso para oficinas
        padre_registro_cab_id: prop.padre_registro_cab_id || null,
        piso: prop.piso || null,

        tipo_inmueble_id: tipoInmuebleId,
        tipo_inmueble_nombre: prop.tipo_inmueble || '',
        distrito_id: distritoId,
        nombre_inmueble: prop.nombre_inmueble || '',
        direccion: prop.direccion || '',
        latitud: prop.latitud || null,
        longitud: prop.longitud || null,
        
        area: prop.area || null,
        antiguedad: prop.antiguedad || null,
        implementacion: prop.implementacion || null,
        
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
        caracteristicas: (() => {
          console.log('🔍 Características raw:', prop.caracteristicas);
          console.log('🔍 Primera característica:', prop.caracteristicas?.[0]);
          
          if (!prop.caracteristicas || prop.caracteristicas.length === 0) {
            console.warn('⚠️ No hay características en prop.caracteristicas');
            return [];
          }
          
          const mapped = prop.caracteristicas.map(c => {
            console.log('  Mapeando:', c);
            return {
              caracteristica_id: c.caracteristica_id || c.id,
              valor: c.valor || c.value || 'Sí'
            };
          });
          
          console.log('✅ Características mapeadas:', mapped);
          return mapped;
        })(),
        
        // 🆕 Oficinas existentes (para edificios completos)
        oficinasExistentes: prop.oficinas || [],
        
        // 🆕 IMPORTANTE: Inicializar oficinasSeleccionadas vacío (se llenará en renderStep4)
        oficinasSeleccionadas: []
      };
      
      console.log('✅ formData MAPEADO:', this.formData);
      console.log('🔍 formData.padre_registro_cab_id:', this.formData.padre_registro_cab_id);  // ✅ DEBUG
      console.log('🏢 prop.oficinas (raw del backend):', prop.oficinas);
      console.log('🏢 formData.oficinasExistentes (guardado):', this.formData.oficinasExistentes);
      console.log('📊 Total oficinas recibidas:', this.formData.oficinasExistentes?.length || 0);
      
      // Cargar características del tipo
      if (tipoInmuebleId) {
        console.log('🔄 Cargando características para tipo_inmueble_id:', tipoInmuebleId);
        await this.loadCaracteristicasPorTipo(tipoInmuebleId);
      }
      
      // ✅ Si es Edificio Completo Y las oficinas ya vinieron en la respuesta principal, NO hacer fetch adicional
      const nombreTipo = (prop.tipo_inmueble || '').toLowerCase();
      const tieneOficinasEnRespuesta = prop.oficinas && prop.oficinas.length > 0;
      
      // ✅ Detectar edificios completos (oficinas o departamentos)
      const esEdificioCompleto = nombreTipo.includes('edificio') && nombreTipo.includes('completo');
      
      if (esEdificioCompleto) {
        console.log('🏢 Detectado Edificio Completo en modo editar:', nombreTipo);
        console.log('📦 Oficinas ya en respuesta:', tieneOficinasEnRespuesta);
        console.log('📊 Cantidad de oficinas:', prop.oficinas?.length || 0);
        
        // ✅ SIEMPRE cargar oficinas para construir edificioConfig
        try {
          await this.loadOficinasEdificio(this.propId);
        } catch (error) {
          console.error('⚠️ Error cargando oficinas:', error);
        }
      }
      
      console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
      console.log('✅ CARGA DE DATOS COMPLETADA');
      console.log('formData.propietario_real_nombre:', this.formData.propietario_real_nombre);
      console.log('formData.tipo_inmueble_id:', this.formData.tipo_inmueble_id);
      console.log('formData.distrito_id:', this.formData.distrito_id);
      console.log('🏢 formData.oficinasExistentes:', this.formData.oficinasExistentes?.length || 0);
      console.log('📊 Oficinas cargadas:', this.formData.oficinasExistentes);
      console.log('formData.caracteristicas.length:', this.formData.caracteristicas?.length || 0);
      console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
      
    } catch (error) {
      console.error('❌ Error al cargar propiedad:', error);
      showNotification('❌ Error al cargar la propiedad', 'error');
      // Volver a la lista
      await this.dashboard.loadTabContent('propiedades', this.dashboard.currentUser.perfil_id);
    }
  }

  /**
   * 🏷️ Obtener label dinámico para nombre del inmueble
   */
  getNombreInmuebleLabel(tipoInmueble) {
    const tipo = (tipoInmueble || '').toLowerCase();
    
    if (tipo.includes('edificio') && tipo.includes('oficina')) {
      return 'Nombre del Edificio de Oficinas';
    }
    if (tipo.includes('edificio') && tipo.includes('departamento')) {
      return 'Nombre del Edificio de Departamentos';
    }
    if (tipo.includes('oficina')) {
      return 'Número de Oficina';
    }
    if (tipo.includes('departamento')) {
      return 'Número de Departamento';
    }
    if (tipo.includes('casa')) {
      return 'Nombre de la Casa';
    }
    if (tipo.includes('condominio')) {
      return 'Nombre del Condominio';
    }
    if (tipo.includes('local')) {
      return 'Nombre del Local Comercial';
    }
    if (tipo.includes('terreno')) {
      return 'Nombre del Terreno';
    }
    if (tipo.includes('almacén')) {
      return 'Nombre del Almacén';
    }
    if (tipo.includes('consultorio')) {
      return 'Número de Consultorio';
    }
    if (tipo.includes('cochera')) {
      return 'Número de Cochera';
    }
    if (tipo.includes('habitación')) {
      return 'Número de Habitación';
    }
    
    return 'Nombre del Inmueble';
  }

  /**
   * 📍 Actualizar vista previa de dirección
   */
  updateDireccionPreview() {
    const tipoVia = document.getElementById('tipo_via')?.value || '';
    const nombreVia = document.getElementById('nombre_via')?.value || '';
    const numero = document.getElementById('numero_direccion')?.value || '';
    const urbanizacion = document.getElementById('urbanizacion')?.value || '';
    const referencia = document.getElementById('referencia')?.value || '';
    
    // Construir dirección completa
    let direccionCompleta = '';
    
    if (tipoVia && nombreVia) {
      direccionCompleta = `${tipoVia} ${nombreVia}`;
      
      if (numero) {
        direccionCompleta += ` ${numero}`;
      }
      
      if (urbanizacion) {
        direccionCompleta += `, ${urbanizacion}`;
      }
      
      if (referencia) {
        direccionCompleta += ` - ${referencia}`;
      }
    }
    
    // Actualizar campo oculto y vista previa
    const direccionInput = document.getElementById('direccion');
    const direccionText = document.getElementById('direccion_text');
    
    if (direccionInput) {
      direccionInput.value = direccionCompleta;
      this.formData.direccion = direccionCompleta;
    }
    
    if (direccionText) {
      direccionText.textContent = direccionCompleta || '-';
    }
  }

  /**
   * 📍 Parsear dirección existente (modo editar)
   */
  parseDireccion(direccionCompleta) {
    if (!direccionCompleta) return;
    
    // Intentar parsear la dirección
    // Formato esperado: "Av. Angamos Este 2520, Urbanización - Referencia"
    
    const partes = direccionCompleta.split(',');
    const principal = partes[0]?.trim() || '';
    const urbanizacion = partes[1]?.trim() || '';
    
    // Separar tipo de vía, nombre y número
    const match = principal.match(/^(Av\.|Jr\.|Calle|Psje\.|Prol\.)\s+(.+?)(?:\s+(\d+.*))?$/);
    
    if (match) {
      document.getElementById('tipo_via').value = match[1] || 'Av.';
      document.getElementById('nombre_via').value = match[2]?.trim() || '';
      document.getElementById('numero_direccion').value = match[3]?.trim() || '';
    } else {
      // Si no coincide el patrón, poner todo en nombre_via
      document.getElementById('nombre_via').value = principal;
    }
    
    // Separar urbanización y referencia
    if (urbanizacion) {
      const refMatch = urbanizacion.split('-');
      document.getElementById('urbanizacion').value = refMatch[0]?.trim() || '';
      document.getElementById('referencia').value = refMatch[1]?.trim() || '';
    }
    
    // Actualizar vista previa
    this.updateDireccionPreview();
  }

  /**
   * 🏢 Helper: Verificar si un tipo de inmueble requiere configuración masiva
   * @param {number} tipoInmuebleId - ID del tipo de inmueble
   * @returns {object} { esEdificio: boolean, esCondominio: boolean, requiereConfigMasiva: boolean }
   */
  getTipoInmuebleConfig(tipoInmuebleId) {
    const tipo = this.tiposInmuebles.find(t => t.tipo_inmueble_id == tipoInmuebleId);
    const nombreTipo = (tipo?.nombre || '').toLowerCase();
    
    // Tipos que requieren configuración masiva
    const esEdificioOficinas = nombreTipo.includes('edificio') && nombreTipo.includes('oficina');
    const esEdificioDepartamentos = nombreTipo.includes('edificio') && nombreTipo.includes('departamento');
    const esCondominio = nombreTipo.includes('condominio');
    
    return {
      esEdificioOficinas,
      esEdificioDepartamentos,
      esCondominio,
      requiereConfigMasiva: esEdificioOficinas || esEdificioDepartamentos || esCondominio,
      nombreTipo
    };
  }

  /**
   * 👤 Cargar datos del usuario logueado (modo NUEVO)
   */
  loadCurrentUserData() {
    try {
      const currentUser = authService.getCurrentUser();
      
      if (currentUser) {
        console.log('👤 Cargando datos del usuario:', currentUser.nombre);

        // Pre-llenar datos del propietario con datos del usuario
        this.formData.propietario_real_nombre = currentUser.nombre || '';
        this.formData.propietario_real_dni = currentUser.dni || '';
        const telefonoRaw = currentUser.telefono || '';
        if (telefonoRaw) {
          const soloNumeros = ('' + telefonoRaw).replace(/\D/g, '');
          this.formData.propietario_real_telefono = soloNumeros.startsWith('51') || telefonoRaw.startsWith('+51')
            ? `+${soloNumeros.startsWith('51') ? soloNumeros : '51' + soloNumeros}`
            : `+51 ${soloNumeros}`;
        } else {
          this.formData.propietario_real_telefono = '';
        }
        this.formData.propietario_real_email = currentUser.email || '';

        console.log('✅ Datos del usuario cargados en formData');
      } else {
        console.log('⚠️ No hay usuario logueado');
      }
    } catch (error) {
      console.error('❌ Error cargando datos del usuario:', error);
    }
  }

  /**
   * 🏢 Cargar oficinas de un edificio completo
   * Usa la nueva API: GET /propiedades/{edificio_id}/oficinas
   */
  async loadOficinasEdificio(edificioId) {
    try {
      console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
      console.log('🏢 CARGANDO OFICINAS DEL EDIFICIO');
      console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
      
      const token = authService.getToken();
      const url = `${API_CONFIG.BASE_URL}/propiedades/${edificioId}/oficinas`;
      
      console.log('🌐 URL:', url);
      
      const response = await fetch(url, {
        method: 'GET',
        headers: { 
          'Authorization': `Bearer ${token}` 
        }
      });
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        console.error('❌ Error al cargar oficinas:', errorData);
        throw new Error(errorData.message || `Error ${response.status}`);
      }
      
      const result = await response.json();
      console.log('📦 RESPUESTA COMPLETA DEL BACKEND:', JSON.stringify(result, null, 2));
      
      const oficinas = result.data || [];
      console.log(`✅ ${oficinas.length} oficinas encontradas`);
      
      // 🔍 DEBUG: Ver estructura de la primera oficina
      if (oficinas.length > 0) {
        console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
        console.log('🔍 ESTRUCTURA DE PRIMERA OFICINA:');
        console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
        console.log('JSON completo:', JSON.stringify(oficinas[0], null, 2));
        console.log('Keys disponibles:', Object.keys(oficinas[0]));
        console.log('Características:', oficinas[0].caracteristicas);
        console.log('Tipo de características:', typeof oficinas[0].caracteristicas);
        console.log('Length características:', oficinas[0].caracteristicas?.length);
        console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
      }
      
      // Extraer configuración del edificio de las características
      const pisos = this.formData.caracteristicas.find(c => c.caracteristica_id === 110)?.valor || 0;
      const oficinasPorPiso = this.formData.caracteristicas.find(c => c.caracteristica_id === 120)?.valor || 0;
      const sotanos = this.formData.caracteristicas.find(c => c.caracteristica_id === 121)?.valor || 0;
      
      // Mapear oficinas a formato interno
      const oficinasConfig = oficinas.map(ofi => ({
        oficina_numero: ofi.numero_oficina || parseInt(ofi.nombre.match(/\d+/)?.[0] || 0),
        piso: ofi.piso || Math.floor((ofi.numero_oficina || 0) / 100),
        area: ofi.area || 50,
        nombre: ofi.nombre || `Oficina ${ofi.numero_oficina}`,
        caracteristicas: ofi.caracteristicas || []
      }));
      
      // ✅ GUARDAR LAS OFICINAS EN EL FORMATO QUE ESPERA renderStep4()
      this.formData.oficinasExistentes = oficinas.map((ofi, index) => {
        // 🔧 Generar numero_oficina si no viene del backend
        let numeroOficina = ofi.numero_oficina;
        if (!numeroOficina) {
          // Usar piso y posición para generar: piso 9, oficina 1 = 901
          const piso = ofi.piso || 1;
          const posicionEnPiso = (index % parseInt(oficinasPorPiso || 4)) + 1;
          numeroOficina = (parseInt(piso) * 100) + parseInt(posicionEnPiso);
        }
        
        console.log(`  🏢 Oficina ${index + 1}:`, {
          registro_cab_id: ofi.registro_cab_id,
          numero_oficina_original: ofi.numero_oficina,
          numero_oficina_generado: numeroOficina,
          piso: ofi.piso,
          area: ofi.area,
          caracteristicas: ofi.caracteristicas
        });
        
        return {
          registro_cab_id: ofi.registro_cab_id,
          nombre: ofi.nombre || `Oficina ${numeroOficina}`,
          numero_oficina: parseInt(numeroOficina),
          piso: parseInt(ofi.piso) || 1,
          area: parseFloat(ofi.area) || 50,
          estado: ofi.estado || 'borrador',
          precio_venta: ofi.precio_venta || null,
          precio_alquiler: ofi.precio_alquiler || null,
          caracteristicas: ofi.caracteristicas || []
        };
      });
      
      console.log('✅ oficinasExistentes guardadas:', this.formData.oficinasExistentes.length);
      console.log('📊 Primera oficina:', this.formData.oficinasExistentes[0]);
      
      // Mapear equipamiento desde características
      // ✅ AHORA EL BACKEND DEVUELVE EL NOMBRE DE LA CARACTERÍSTICA
      const equipamiento = {};
      
      console.log('🔧 MAPEANDO EQUIPAMIENTO EXISTENTE (desde backend):');
      console.log('Total oficinas a procesar:', oficinas.length);
      
      oficinas.forEach((ofi, idx) => {
        // ✅ Extraer numero_oficina del nombre si no viene en el campo
        const numeroOficina = ofi.numero_oficina || parseInt(ofi.nombre.match(/\d+/)?.[0] || 0);
        
        console.log(`\n  📍 Oficina ${idx + 1} (${numeroOficina}):`, {
          caracteristicas_count: ofi.caracteristicas?.length || 0,
          caracteristicas_type: typeof ofi.caracteristicas,
          caracteristicas_is_array: Array.isArray(ofi.caracteristicas),
          caracteristicas: ofi.caracteristicas
        });
        
        if (!ofi.caracteristicas) {
          console.log(`    ⚠️ NO HAY CARACTERÍSTICAS (undefined)`);
        } else if (!Array.isArray(ofi.caracteristicas)) {
          console.log(`    ⚠️ NO ES UN ARRAY:`, ofi.caracteristicas);
        } else if (ofi.caracteristicas.length === 0) {
          console.log(`    ⚠️ ARRAY VACÍO`);
        } else {
          console.log(`    ✅ ${ofi.caracteristicas.length} características encontradas`);
          ofi.caracteristicas.forEach((carac, cidx) => {
            const nombreEquip = carac.nombre || carac.caracteristica_id;
            const valor = carac.valor;
            
            console.log(`      [${cidx + 1}] ID: ${carac.caracteristica_id}, Nombre: "${nombreEquip}", Valor: "${valor}"`);
            
            // Solo incluir si el valor es "Sí", "true", "1", etc.
            const esValido = valor === 'Sí' || valor === 'true' || valor === '1' || valor === true;
            console.log(`          → ¿Es válido? ${esValido}`);
            
            if (nombreEquip && esValido) {
              if (!equipamiento[nombreEquip]) {
                equipamiento[nombreEquip] = [];
              }
              // ✅ Usar numeroOficina extraído
              equipamiento[nombreEquip].push(numeroOficina.toString());
              console.log(`          ✅ Agregado a equipamiento`);
            }
          });
        }
      });
      
      console.log('✅ Equipamiento mapeado:', equipamiento);
      
      // Guardar en formData
      this.formData.edificioConfig = {
        pisos: parseInt(pisos),
        oficinas_por_piso: parseInt(oficinasPorPiso),
        sotanos: parseInt(sotanos),
        oficinas: oficinasConfig,
        sotanos_config: [], // TODO: Cargar config de sótanos si está disponible
        equipamiento: equipamiento
      };
      
      // ✅ GUARDAR EQUIPAMIENTO EN formData PARA QUE ESTÉ DISPONIBLE AL GUARDAR
      this.formData.equipamiento = equipamiento;
      
      console.log('✅ formData.equipamiento guardado:', this.formData.equipamiento);
      
      console.log('✅ Configuración de edificio restaurada:', {
        total_oficinas: oficinasConfig.length,
        oficinasExistentes: this.formData.oficinasExistentes.length,
        pisos: pisos,
        oficinas_por_piso: oficinasPorPiso,
        equipamiento: Object.keys(equipamiento).length
      });
      
      console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
      
    } catch (error) {
      console.error('❌ Error al cargar oficinas del edificio:', error);
      // No bloquear la edición si falla la carga de oficinas
      // El usuario podrá reconfigurar en Step 4
      showNotification('⚠️ No se pudieron cargar las oficinas. Reconfigura en el Paso 4', 'warning');
    }
  }

  async buscarCoordenadasYMostrarMapa(direccion, distrito) {
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
        
        showNotification(`✅ Ubicación encontrada - Verifica en el mapa`, 'success');
        
        // SIEMPRE abrir el mapa con la ubicación encontrada
        this.abrirMapaSeleccion(direccion, distrito, lat, lon);
      } else {
        showNotification('⚠️ No se encontró automáticamente. Marca en el mapa.', 'warning');
        // Abrir mapa sin coordenadas (centrado en Lima)
        this.abrirMapaSeleccion(direccion, distrito);
      }
    } catch (error) {
      console.error('❌ Error en geocoding:', error);
      showNotification('📍 Marca la ubicación en el mapa', 'info');
      this.abrirMapaSeleccion(direccion, distrito);
    }
  }

  async buscarCoordenadas(direccion, distrito) {
    // Método legacy - redirige al nuevo método
    await this.buscarCoordenadasYMostrarMapa(direccion, distrito);
  }

  mostrarMapaPreview(lat, lon) {
    // Pequeño preview del mapa (opcional)
    console.log(`📍 Ubicación: ${lat}, ${lon}`);
  }

  abrirMapaSeleccion(direccion, distrito, latInicial = null, lonInicial = null) {
    // Crear modal con mapa interactivo
    const modalHtml = `
      <div id="mapModal" style="position: fixed; top: 0; left: 0; right: 0; bottom: 0; background: rgba(0,0,0,0.7); z-index: 999999; display: flex; align-items: center; justify-content: center; padding: 20px;">
        <div style="background: white; border-radius: 12px; max-width: 900px; width: 100%; max-height: 90vh; display: flex; flex-direction: column; box-shadow: 0 10px 40px rgba(0,0,0,0.3);">
          <!-- Header con botones -->
          <div style="padding: 16px 20px; border-bottom: 2px solid #e5e7eb; display: flex; justify-content: space-between; align-items: center; flex-shrink: 0; background: linear-gradient(135deg, #f8fafc 0%, #f1f5f9 100%);">
            <div style="display: flex; align-items: center; gap: 12px;">
              <div style="width: 40px; height: 40px; border-radius: 50%; background: var(--azul-corporativo); display: flex; align-items: center; justify-content: center; color: white; font-size: 1.2rem;">
                📍
              </div>
              <div>
                <h3 style="margin: 0; color: var(--azul-corporativo); font-size: 1.1rem;">Selecciona la Ubicación</h3>
                <p style="margin: 0; font-size: 0.8rem; color: #64748b;">Haz click en el mapa para marcar</p>
              </div>
            </div>
            <div style="display: flex; gap: 10px; align-items: center;">
              <button onclick="propertyForm.cerrarMapaModal()" class="btn btn-secondary" style="padding: 8px 16px; font-size: 0.9rem;">
                Cancelar
              </button>
              <button onclick="propertyForm.confirmarUbicacion()" class="btn btn-primary" style="padding: 8px 20px; font-size: 0.9rem;">
                ✓ Confirmar
              </button>
            </div>
          </div>
          
          <!-- Mapa -->
          <div id="mapContainer" style="height: 500px; width: 100%; flex-shrink: 0;"></div>
          
          <!-- Footer con coordenadas -->
          <div style="padding: 12px 20px; border-top: 1px solid #e5e7eb; display: flex; justify-content: center; align-items: center; flex-shrink: 0; background: #f8fafc;">
            <div style="font-size: 0.85rem; color: #64748b; font-weight: 500;">
              <span id="coordsDisplay">📍 Haz click en el mapa para seleccionar</span>
            </div>
          </div>
        </div>
      </div>
    `;
    
    document.body.insertAdjacentHTML('beforeend', modalHtml);
    
    // Inicializar mapa Leaflet
    setTimeout(() => {
      // Usar coordenadas iniciales si se proporcionan, sino Lima por defecto
      const centerLat = latInicial || -12.0464;
      const centerLng = lonInicial || -77.0428;
      const zoom = (latInicial && lonInicial) ? 16 : 13;
      
      const map = L.map('mapContainer').setView([centerLat, centerLng], zoom);
      
      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '© OpenStreetMap contributors'
      }).addTo(map);
      
      // Marker
      let marker = null;
      this.tempMarker = null;
      this.tempLat = latInicial;
      this.tempLng = lonInicial;
      
      // Si hay coordenadas iniciales, colocar marker
      if (latInicial && lonInicial) {
        marker = L.marker([latInicial, lonInicial]).addTo(map);
        document.getElementById('coordsDisplay').textContent = 
          `Lat: ${latInicial.toFixed(6)}, Lng: ${lonInicial.toFixed(6)}`;
      }
      
      // Click en el mapa
      map.on('click', async (e) => {
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
          `Lat: ${lat.toFixed(6)}, Lng: ${lng.toFixed(6)} - Obteniendo dirección...`;
        
        // 🆕 Reverse Geocoding: Obtener dirección desde coordenadas
        await this.obtenerDireccionDesdeCoordenadas(lat, lng);
      });
      
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

  async obtenerDireccionDesdeCoordenadas(lat, lng) {
    try {
      // Reverse Geocoding con Nominatim
      const url = `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}&zoom=18&addressdetails=1`;
      
      const response = await fetch(url, {
        headers: { 'User-Agent': 'QuadranteInmobiliaria/1.0' }
      });
      
      const data = await response.json();
      console.log('🔍 Reverse Geocoding:', data);
      console.log('📍 Address object:', data.address);
      
      if (data && data.address) {
        const address = data.address;
        
        // Extraer componentes de la dirección
        const road = address.road || address.street || '';
        const houseNumber = address.house_number || '';
        const suburb = address.suburb || address.neighbourhood || '';
        const district = address.city_district || address.district || address.city || '';
        
        console.log('📋 Componentes extraídos:', { road, houseNumber, suburb, district });
        
        // Determinar tipo de vía
        let tipoVia = 'Calle';
        if (road.toLowerCase().includes('avenida') || road.toLowerCase().includes('av.')) {
          tipoVia = 'Av.';
        } else if (road.toLowerCase().includes('jirón') || road.toLowerCase().includes('jr.')) {
          tipoVia = 'Jr.';
        } else if (road.toLowerCase().includes('pasaje') || road.toLowerCase().includes('psje.')) {
          tipoVia = 'Psje.';
        } else if (road.toLowerCase().includes('prolongación') || road.toLowerCase().includes('prol.')) {
          tipoVia = 'Prol.';
        }
        
        // Limpiar nombre de vía (quitar el tipo si viene incluido)
        let nombreVia = road.replace(/^(Avenida|Av\.|Jirón|Jr\.|Calle|Pasaje|Psje\.|Prolongación|Prol\.)\s*/i, '').trim();
        
        console.log('🔧 Procesado:', { tipoVia, nombreVia });
        
        // Guardar temporalmente para usar al confirmar
        this.tempDireccion = {
          tipoVia,
          nombreVia,
          numero: houseNumber,
          urbanizacion: suburb,
          distrito: district
        };
        
        console.log('✅ Dirección capturada:', this.tempDireccion);
        
        // Actualizar display con dirección encontrada
        const direccionCompleta = `${tipoVia} ${nombreVia} ${houseNumber}`.trim();
        console.log('📝 Dirección completa formateada:', direccionCompleta);
        
        const coordsDisplayElement = document.getElementById('coordsDisplay');
        console.log('🎯 Elemento coordsDisplay:', coordsDisplayElement);
        
        if (coordsDisplayElement) {
          const textoFinal = `📍 ${direccionCompleta} - ${district}`;
          console.log('💬 Texto a mostrar:', textoFinal);
          coordsDisplayElement.textContent = textoFinal;
          console.log('✅ Display actualizado correctamente');
        } else {
          console.warn('⚠️ Elemento coordsDisplay no encontrado en el DOM');
        }
      } else {
        const coordsDisplayElement = document.getElementById('coordsDisplay');
        if (coordsDisplayElement) {
          coordsDisplayElement.textContent = `Lat: ${lat.toFixed(6)}, Lng: ${lng.toFixed(6)}`;
        }
      }
    } catch (error) {
      console.error('❌ Error en reverse geocoding:', error);
      const coordsDisplayElement = document.getElementById('coordsDisplay');
      if (coordsDisplayElement) {
        coordsDisplayElement.textContent = `Lat: ${lat.toFixed(6)}, Lng: ${lng.toFixed(6)}`;
      }
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
    console.log('🎯 CONFIRMANDO UBICACIÓN');
    console.log('📍 Coordenadas:', this.tempLat, this.tempLng);
    console.log('📋 Dirección temporal:', this.tempDireccion);
    
    if (this.tempLat && this.tempLng) {
      // Guardar coordenadas
      document.getElementById('latitud').value = this.tempLat.toFixed(6);
      document.getElementById('longitud').value = this.tempLng.toFixed(6);
      
      this.formData.latitud = this.tempLat;
      this.formData.longitud = this.tempLng;
      
      // 🆕 Llenar campos de dirección si se capturó
      if (this.tempDireccion) {
        console.log('✅ tempDireccion existe, llenando campos...');
        
        const tipoViaSelect = document.getElementById('tipo_via');
        const nombreViaInput = document.getElementById('nombre_via');
        const numeroInput = document.getElementById('numero_direccion');
        const urbanizacionInput = document.getElementById('urbanizacion');
        
        console.log('🔍 Elementos encontrados:', {
          tipoViaSelect: !!tipoViaSelect,
          nombreViaInput: !!nombreViaInput,
          numeroInput: !!numeroInput,
          urbanizacionInput: !!urbanizacionInput
        });
        
        if (tipoViaSelect && this.tempDireccion.tipoVia) {
          tipoViaSelect.value = this.tempDireccion.tipoVia;
          console.log('✅ Tipo vía actualizado:', this.tempDireccion.tipoVia);
        }
        
        if (nombreViaInput && this.tempDireccion.nombreVia) {
          nombreViaInput.value = this.tempDireccion.nombreVia;
          console.log('✅ Nombre vía actualizado:', this.tempDireccion.nombreVia);
        }
        
        if (numeroInput && this.tempDireccion.numero) {
          numeroInput.value = this.tempDireccion.numero;
          console.log('✅ Número actualizado:', this.tempDireccion.numero);
        }
        
        if (urbanizacionInput && this.tempDireccion.urbanizacion) {
          urbanizacionInput.value = this.tempDireccion.urbanizacion;
          console.log('✅ Urbanización actualizada:', this.tempDireccion.urbanizacion);
        }
        
        // Actualizar dirección completa
        console.log('🔄 Actualizando dirección completa...');
        this.updateDireccionPreview();
        
        showNotification('✅ Ubicación y dirección confirmadas', 'success');
      } else {
        console.log('⚠️ No hay tempDireccion');
        showNotification('✅ Ubicación confirmada', 'success');
      }
      
      console.log('🚪 Cerrando modal...');
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

    // ✅ FIX: Usar document.getElementById en lugar de this.dashboard.tabContent
    const container = document.getElementById('tabContent');

    if (!container) {
      console.error('❌ No se encontró el contenedor #tabContent');
      return;
    }

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
    
    // 🎨 Inicializar iconos Lucide
    if (typeof lucide !== 'undefined') {
      lucide.createIcons();
    }
    
    // ⏱️ Esperar que el DOM esté completamente renderizado antes de pre-llenar
    setTimeout(() => {
      if (this.propId) {
        // Modo EDITAR: llenar todos los campos con datos de la propiedad
        this.populateFormFields();
      } else {
        // Modo NUEVO: llenar solo Paso 1 con datos del usuario logueado
        console.log('👤 Modo NUEVO - Pre-llenando datos del usuario en Paso 1');
        this.populateFormFields();
      }
    }, 100);
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
      console.log('📝 Llenando campos del Paso 2 (Información Básica)');
      console.log('  tipo_inmueble_id:', this.formData.tipo_inmueble_id);
      console.log('  distrito_id:', this.formData.distrito_id);
      console.log('  nombre_inmueble:', this.formData.nombre_inmueble);
      
      const campos = {
        'tipo_inmueble_id': this.formData.tipo_inmueble_id || '',
        'distrito_id': this.formData.distrito_id || '',
        'nombre_inmueble': this.formData.nombre_inmueble || '',
        'direccion': this.formData.direccion || '',
        'latitud': this.formData.latitud || '',
        'longitud': this.formData.longitud || ''
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
      
      // 🆕 Parsear dirección en componentes separados
      if (this.formData.direccion) {
        this.parseDireccion(this.formData.direccion);
      }
      
      // Nota: La pre-selección de edificio padre se hace en initSelectorEdificio()
      // después de que cargue las opciones de forma asíncrona
    } 
    else if (this.currentStep === 3) {
      console.log('📝 Llenando campos del Paso 3 (Características)');
      console.log('  area:', this.formData.area);
      console.log('  antiguedad:', this.formData.antiguedad);
      console.log('  implementacion:', this.formData.implementacion);
      console.log('  caracteristicas:', this.formData.caracteristicas?.length || 0);

      const campos = {
        'area': this.formData.area || '',
        'antiguedad': this.formData.antiguedad || '',
        'implementacion': this.formData.implementacion || ''
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
      
      // ✅ ESPERAR A QUE SE CARGUEN LAS CARACTERÍSTICAS DINÁMICAS
      // Las características se cargan con loadCaracteristicasPorTipo() que es async
      setTimeout(() => {
        console.log('  🔄 Pre-seleccionando características dinámicas...');
        console.log('  📊 Características disponibles:', this.formData.caracteristicas?.length || 0);
        
        // Mostrar valores específicos que buscamos
        const pisos = this.formData.caracteristicas?.find(c => c.caracteristica_id == 110);
        const oficinas = this.formData.caracteristicas?.find(c => c.caracteristica_id == 120);
        const sotanos = this.formData.caracteristicas?.find(c => c.caracteristica_id == 121);
        
        console.log('  🏢 PisOS (ID 110):', pisos?.valor || 'NO ENCONTRADO');
        console.log('  🏢 Oficinas por Piso (ID 120):', oficinas?.valor || 'NO ENCONTRADO');
        console.log('  🏢 Sótanos (ID 121):', sotanos?.valor || 'NO ENCONTRADO');
        
        this.formData.caracteristicas?.forEach(carac => {
          const input = document.querySelector(`[data-carac-id="${carac.caracteristica_id}"]`);
          if (input) {
            if (input.type === 'checkbox') {
              // ✅ Aceptar múltiples valores: "Sí", "true", true, "1", 1
              const valorTruthy = carac.valor === 'Sí' || carac.valor === 'true' || carac.valor === true || carac.valor === '1' || carac.valor === 1;
              input.checked = valorTruthy;
              console.log(`    ✅ Checkbox ${carac.caracteristica_id} = ${carac.valor} (checked: ${valorTruthy})`);
            } else if (input.type === 'radio') {
              const radio = document.querySelector(`[data-carac-id="${carac.caracteristica_id}"][value="${carac.valor}"]`);
              if (radio) {
                radio.checked = true;
                console.log(`    ✅ Radio ${carac.caracteristica_id} = ${carac.valor}`);
              }
            } else {
              input.value = carac.valor;
              console.log(`    ✅ Input ${carac.caracteristica_id} = ${carac.valor}`);
            }
          } else {
            console.log(`    ❌ Input carac ID ${carac.caracteristica_id} NO ENCONTRADO`);
          }
        });
      }, 300); // ⏱️ Mayor delay para esperar que carguen las características
    }
    else if (this.currentStep === 5) {
      console.log('📝 Llenando campos del Paso 5 (Precios y Descripción)');
      console.log('  transaccion:', this.formData.transaccion);
      console.log('  precio_venta:', this.formData.precio_venta);
      console.log('  titulo:', this.formData.titulo);
      
      // Pre-seleccionar transacción
      const transaccionRadio = document.querySelector(`input[name="transaccion"][value="${this.formData.transaccion}"]`);
      if (transaccionRadio) {
        transaccionRadio.checked = true;
        console.log(`  ✅ Transacción "${this.formData.transaccion}" seleccionada`);
        // Trigger click para activar la card y mostrar campos correctos
        transaccionRadio.closest('.transaction-card')?.click();
      } else {
        console.error(`  ❌ Radio transaccion="${this.formData.transaccion}" NO ENCONTRADO`);
      }
      
      // Rellenar precios
      const campos = {
        'precio_venta': this.formData.precio_venta || '',
        'precio_alquiler': this.formData.precio_alquiler || '',
        'moneda_venta': this.formData.moneda || 'PEN',
        'moneda_alquiler': this.formData.moneda || 'PEN',
        'titulo': this.formData.titulo || '',
        'descripcion': this.formData.descripcion || ''
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
    
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('✅ populateFormFields() COMPLETADO');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  }

  renderHeader() {
    return `
      <div style="margin-bottom: var(--spacing-lg); display: flex; justify-content: space-between; align-items: center;">
        <div>
          <h2 style="color: var(--azul-corporativo); margin: 0 0 4px 0; font-size: 1.5rem; display: flex; align-items: center; gap: 8px;">
            <span style="display: inline-flex; align-items: center; justify-content: center; width: 32px; height: 32px; border-radius: 8px; background: var(--azul-corporativo); color: white; font-size: 18px;">
              ${this.propId ? '✏️' : '➕'}
            </span>
            ${this.propId ? 'Editar' : 'Nueva'} Propiedad
          </h2>
          <p style="color: var(--gris-medio); margin: 0; font-size: 0.85rem;">
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
    // Detectar si es edificio completo para mostrar paso "Configurar"
    const tipoId = parseInt(this.formData.tipo_inmueble_id) || 0;
    const esEdificioCompleto = tipoId === 12; // Edificio Completo Oficinas

    const progress = (this.currentStep / this.totalSteps) * 100;

    // Pasos dinámicos según tipo de inmueble
    const steps = esEdificioCompleto ? [
      { num: 1, icon: '👤', name: 'Propietario' },
      { num: 2, icon: '🏠', name: 'Información' },
      { num: 3, icon: '📐', name: 'Características' },
      { num: 4, icon: '🏢', name: 'Configurar' },
      { num: 5, icon: '💰', name: 'Precio' },
      { num: 6, icon: '📸', name: 'Imágenes' }
    ] : [
      { num: 1, icon: '👤', name: 'Propietario' },
      { num: 2, icon: '🏠', name: 'Información' },
      { num: 3, icon: '📐', name: 'Características' },
      { num: 4, icon: '💰', name: 'Precio' },
      { num: 5, icon: '📸', name: 'Imágenes' }
    ];
    
    return `
      <div class="progress-container" style="background: white; padding: var(--spacing-md); border-radius: 12px; margin-bottom: var(--spacing-md); box-shadow: 0 2px 8px rgba(0,0,0,0.08);">
        <!-- Barra de progreso -->
        <div style="position: relative; height: 6px; background: #e9ecef; border-radius: 999px; overflow: hidden; margin-bottom: var(--spacing-md);">
          <div style="position: absolute; top: 0; left: 0; height: 100%; background: linear-gradient(90deg, var(--azul-corporativo), var(--azul-claro)); width: ${progress}%; transition: width 0.3s;"></div>
        </div>
        
        <!-- Steps indicators (responsive) -->
        <div class="progress-steps" style="display: flex; justify-content: space-between; gap: 6px;">
          ${steps.map(step => {
            const isActive = step.num === this.currentStep;
            const isCompleted = step.num < this.currentStep;
            
            return `
              <div class="progress-step ${isActive ? 'active' : ''} ${isCompleted ? 'completed' : ''}" style="text-align: center; flex: 1; min-width: 55px;">
                <div class="step-circle" style="width: 40px; height: 40px; border-radius: 50%; background: white; border: 3px solid ${isCompleted ? 'var(--dorado)' : isActive ? 'var(--azul-corporativo)' : '#dee2e6'}; color: ${isCompleted ? 'var(--dorado)' : isActive ? 'var(--azul-corporativo)' : 'var(--gris-medio)'}; display: inline-flex; align-items: center; justify-content: center; margin-bottom: 4px; font-weight: 600; font-size: 18px; transition: all 0.3s; ${isActive ? 'box-shadow: 0 4px 12px rgba(44, 82, 130, 0.25); transform: scale(1.05);' : ''} ${isCompleted ? 'box-shadow: 0 3px 10px rgba(245, 166, 35, 0.2);' : ''}">
                  ${isCompleted ? '✓' : step.icon}
                </div>
                <div class="step-label" style="font-size: 0.7rem; color: ${isActive ? 'var(--azul-corporativo)' : isCompleted ? 'var(--dorado)' : 'var(--gris-medio)'}; font-weight: ${isActive ? '700' : isCompleted ? '600' : '500'};">
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
    // Nombres dinámicos según tipo de inmueble
    const tipoId = parseInt(this.formData.tipo_inmueble_id) || 0;
    const esEdificioCompleto = tipoId === 12;

    const names = esEdificioCompleto
      ? ['', 'Propietario', 'Información', 'Características', 'Configurar', 'Precio', 'Imágenes']
      : ['', 'Propietario', 'Información', 'Características', 'Precio', 'Imágenes'];
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
      () => this.renderStep4(), // 🆕 NUEVO: Configurar Oficinas (solo Edificio/Casa)
      () => this.renderStep5(), // Transacción y Precio
      () => this.renderStep6()  // Imágenes
    ];
    return steps[this.currentStep] ? steps[this.currentStep]() : '<p>Paso no encontrado</p>';
  }

  
  renderStep1() {
    return `
      <h3 style="margin-bottom: var(--spacing-md); color: var(--azul-corporativo); font-size: 1.3rem; font-weight: 600;">
        Información del Propietario
      </h3>
      <div style="display: grid; gap: var(--spacing-md);">
        <!-- 🎯 Layout compacto: DNI + Nombre + Celular en una fila -->
        <div id="propietarioBasicosContainer" class="propietario-grid">
          ${this.renderInput('propietario_dni', 'DNI / RUC', 'text', true, '12345678', { maxlength: 11, pattern: '[0-9]{8,11}', title: 'DNI (8 dígitos) o RUC (11 dígitos)' })}
          ${this.renderInput('propietario_nombre', 'Nombre Completo', 'text', true, 'Juan Pérez García')}
          ${this.renderInput('propietario_telefono', 'Teléfono', 'tel', true, '+51 999 888 777')}
        </div>
        ${this.renderInput('propietario_email', 'Email', 'email', false, 'juan.perez@email.com')}
        <!-- Campo oculto para propietario_id (si existe) -->
        <input type="hidden" id="propietario_id_hidden" value="">
      </div>
    `;
  }

  renderStep2() {
    // ✅ Verificar si requiere edificio padre por tipo_inmueble_id
    // IDs que REQUIEREN edificio padre: 1=Oficina en Edificio, 3=Departamento
    const tipoIdInt = parseInt(this.formData.tipo_inmueble_id) || 0;
    const requiereEdificioPadre = (tipoIdInt === 1 || tipoIdInt === 3);

    // Para label dinámico
    const tipoSeleccionado = this.tiposInmuebles.find(t => t.tipo_inmueble_id == this.formData.tipo_inmueble_id);
    const nombreTipo = (tipoSeleccionado?.nombre || tipoSeleccionado?.nombre_tipo || '');

    // ✅ Label dinámico para nombre del inmueble
    const labelNombreInmueble = this.getNombreInmuebleLabel(nombreTipo);

    return `
      <h3 style="margin-bottom: var(--spacing-md); color: var(--azul-corporativo); display: flex; align-items: center; gap: 10px; font-size: 1.3rem;">
        <span style="display: inline-flex; align-items: center; justify-content: center; width: 36px; height: 36px; border-radius: 50%; background: white; border: 3px solid var(--azul-corporativo);">
          <i data-lucide="home" style="width: 20px; height: 20px; color: var(--azul-corporativo);"></i>
        </span>
        Información Básica del Inmueble
      </h3>
      <div style="display: grid; gap: var(--spacing-md);">
        <!-- ✅ Tipo Inmueble + Distrito en una sola fila -->
        <div class="tipo-distrito-grid" style="display: grid; grid-template-columns: 1fr 1fr; gap: var(--spacing-sm);">
          ${this.renderSelect('tipo_inmueble_id', 'Tipo de Inmueble', this.tiposInmuebles, true)}
          <div class="form-group">
            <label for="distrito_id">
              Distrito ${requiereEdificioPadre ? '<span style="color: #ff9800; font-size: 0.8rem;">(heredado del edificio)</span>' : '<span style="color: red;">*</span>'}
            </label>
            <select id="distrito_id" class="form-control" ${requiereEdificioPadre ? 'disabled style="background: #f5f5f5; cursor: not-allowed;"' : 'required'}>
              <option value="">Seleccionar...</option>
              ${this.distritos.map(d => `<option value="${d.distrito_id}" ${this.formData.distrito_id == d.distrito_id ? 'selected' : ''}>${d.nombre}</option>`).join('')}
            </select>
            ${requiereEdificioPadre ? '<small style="color: #ff9800;">💡 Se heredará del edificio seleccionado</small>' : ''}
          </div>
        </div>

        <!-- ✅ Selector de Edificio + Piso (tipos 1 y 3 requieren edificio padre) -->
        <div id="edificio-padre-container" style="display: ${requiereEdificioPadre ? 'block' : 'none'};">
          <div class="form-group" style="background: linear-gradient(135deg, #fff3e0 0%, #ffe0b2 100%); border: 2px solid #ff9800; border-radius: 12px; padding: 16px;">

            <!-- Edificio -->
            <label for="edificio-padre-select" style="display: flex; align-items: center; gap: 8px; font-weight: 600; color: #e65100; margin-bottom: 8px;">
              🏢 Seleccionar Edificio <span style="color: red;">*</span>
            </label>
            <select id="edificio-padre-select" class="form-control" style="border: 2px solid #ff9800; font-size: 1rem; padding: 12px; margin-bottom: 12px;">
              <option value="">-- Seleccionar edificio --</option>
            </select>

            <!-- Piso (aparece después de seleccionar edificio) -->
            <div id="piso-container" style="display: none; margin-top: 12px;">
              <label for="piso-select" style="display: flex; align-items: center; gap: 8px; font-weight: 600; color: #e65100; margin-bottom: 8px;">
                🔢 Número de Piso <span style="color: red;">*</span>
              </label>
              <select id="piso-select" class="form-control" style="border: 2px solid #ff9800; font-size: 1rem; padding: 12px;">
                <option value="">-- Seleccionar piso --</option>
              </select>
            </div>

            <small style="display: block; margin-top: 12px; color: #e65100;">
              💡 Al seleccionar edificio se heredan: distrito, dirección y coordenadas.
            </small>
          </div>
          <!-- Contenedor para mostrar info del edificio seleccionado -->
          <div id="edificio-caracteristicas-container" style="margin-top: var(--spacing-md);"></div>
        </div>
        
        <!-- ✅ Nombre del Inmueble con label dinámico -->
        <div class="form-group" id="nombre_inmueble_container">
          <label for="nombre_inmueble" id="label_nombre_inmueble">
            ${labelNombreInmueble} <span style="color: red;">*</span>
          </label>
          <input type="text" id="nombre_inmueble" class="form-control" required>
        </div>
        
        <!-- 🆕 Dirección separada en componentes -->
        <div class="direccion-group" style="border: 1px solid #e2e8f0; padding: var(--spacing-md); border-radius: 8px; background: #f8fafc;">
          <!-- ✅ Header con título y botón -->
          <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: var(--spacing-sm);">
            <label style="margin: 0; font-weight: 600; color: var(--azul-corporativo);">
              📍 Dirección <span style="color: red;">*</span>
            </label>
            <button type="button" id="btnUbicarMapa" class="btn btn-secondary" style="padding: 6px 16px; font-size: 0.85rem;">
              📍 Ubicar en Mapa
            </button>
          </div>
          
          <!-- ✅ Fila compacta: Tipo Vía + Nombre Vía + Número -->
          <div class="direccion-compacta-grid" style="display: grid; grid-template-columns: 120px 1fr 100px; gap: 8px; margin-bottom: var(--spacing-sm);">
            <div class="form-group" style="margin-bottom: 0;">
              <label for="tipo_via" style="font-size: 0.85rem;">Tipo de Vía</label>
              <select id="tipo_via" class="form-control" style="padding: 8px 10px; font-size: 0.95rem;">
                <option value="Av.">Avenida</option>
                <option value="Jr.">Jirón</option>
                <option value="Calle">Calle</option>
                <option value="Psje.">Pasaje</option>
                <option value="Prol.">Prolongación</option>
              </select>
            </div>
            
            <div class="form-group" style="margin-bottom: 0;">
              <label for="nombre_via" style="font-size: 0.85rem;">Nombre de la Vía *</label>
              <input type="text" id="nombre_via" class="form-control" placeholder="Ej: Angamos Este" required style="padding: 8px 10px; font-size: 0.95rem;">
            </div>
            
            <div class="form-group" style="margin-bottom: 0;">
              <label for="numero_direccion" style="font-size: 0.85rem;">Número</label>
              <input type="text" id="numero_direccion" class="form-control" placeholder="2520" style="padding: 8px 10px; font-size: 0.95rem;">
            </div>
          </div>
          
          <div id="direccionSecundariaContainer" style="display: grid; grid-template-columns: 1fr 1fr; gap: var(--spacing-sm);">
            <div class="form-group">
              <label for="urbanizacion" style="font-size: 0.85rem;">Urbanización / Conjunto</label>
              <input type="text" id="urbanizacion" class="form-control" placeholder="Opcional">
            </div>
            
            <div class="form-group">
              <label for="referencia" style="font-size: 0.85rem;">Referencia</label>
              <input type="text" id="referencia" class="form-control" placeholder="Ej: Frente al parque">
            </div>
          </div>
          
          <!-- Campo oculto para dirección completa -->
          <input type="hidden" id="direccion" value="">
          
          <!-- Vista previa de dirección -->
          <div id="direccion_preview" style="margin-top: var(--spacing-sm); padding: var(--spacing-sm); background: white; border-radius: 4px; font-size: 0.9rem; color: #64748b;">
            <strong>Vista previa:</strong> <span id="direccion_text">-</span>
          </div>
        </div>

        <!-- 🆕 Coordenadas ocultas -->
        <input type="hidden" id="latitud" value="">
        <input type="hidden" id="longitud" value="">
      </div>
    `;
  }

  renderStep3() {
    return `
      <h3 style="margin-bottom: var(--spacing-md); color: var(--azul-corporativo); display: flex; align-items: center; gap: 10px; font-size: 1.3rem;">
        <span style="display: inline-flex; align-items: center; justify-content: center; width: 36px; height: 36px; border-radius: 50%; background: white; border: 3px solid var(--azul-corporativo);">
          <i data-lucide="sliders" style="width: 20px; height: 20px; color: var(--azul-corporativo);"></i>
        </span>
        Características del Inmueble
      </h3>
      
      <!-- Características Físicas Básicas -->
      <div style="background: #f8f9fa; padding: var(--spacing-md); border-radius: 8px; margin-bottom: var(--spacing-lg);">
        <h4 style="margin-bottom: var(--spacing-sm); color: var(--azul-corporativo); font-size: 0.95rem;">Datos Básicos</h4>
        <!-- ✅ Grid compacto en una sola línea -->
        <div class="datos-basicos-grid" style="display: grid; grid-template-columns: 150px 150px 1fr; gap: var(--spacing-sm);">
          ${this.renderInputCompact('area', 'Área (m²)', 'number', true, '120', { step: '0.01', min: '1' })}
          ${this.renderInputCompact('antiguedad', 'Años de Antigüedad', 'number', false, '5', { min: '0' })}
          ${this.renderSelectCompact('implementacion', 'Implementación', [
            { value: '', label: 'Seleccionar...' },
            { value: '1', label: 'Sin implementar' },
            { value: '2', label: 'Semi implementado' },
            { value: '3', label: 'Implementado' },
            { value: '4', label: 'Totalmente implementado' }
          ], false)}
        </div>
        <p style="color: var(--gris-medio); margin-top: var(--spacing-sm); font-size: 0.85rem;">
          ℹ️ Habitaciones, baños y parqueos se agregan en "Características Adicionales" abajo
        </p>
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

  renderSelectCompact(id, label, options, required) {
    return `
      <div class="form-group">
        <label class="form-label" style="font-size: 0.85rem; margin-bottom: 4px;">
          ${label} ${required ? '<span style="color: red;">*</span>' : ''}
        </label>
        <select
          id="${id}"
          class="form-select"
          style="padding: 8px 12px; font-size: 0.9rem;"
          ${required ? 'required' : ''}
        >
          ${options.map(opt => `
            <option value="${opt.value}" ${this.formData[id] == opt.value ? 'selected' : ''}>
              ${opt.label}
            </option>
          `).join('')}
        </select>
      </div>
    `;
  }

  renderStep4() {
    // 🆕 NUEVO PASO: Configurar Oficinas (solo para Edificio Completo)
    const tipoInmuebleId = parseInt(this.formData.tipo_inmueble_id);
    
    // ✅ DETECCIÓN CORRECTA: Solo IDs 12 y 13 son edificios completos
    const esEdificioCompleto = tipoInmuebleId === 12 || tipoInmuebleId === 13;
    
    const tipoSeleccionado = this.tiposInmuebles.find(t =>
      parseInt(t.tipo_inmueble_id) === tipoInmuebleId
    );
    const nombreTipo = tipoSeleccionado?.nombre || '';
    
    console.log('🏢 renderStep4 - ID:', tipoInmuebleId, '| Nombre:', nombreTipo, '| Es Edificio Completo:', esEdificioCompleto);

    // Si NO es Edificio Completo (IDs 12 o 13), mostrar mensaje y permitir continuar
    if (!esEdificioCompleto) {
      return `
        <div class="paso-opcional-message">
          <div style="font-size: 3rem; margin-bottom: 16px;">⏭️</div>
          <h3>Paso opcional</h3>
          <p>Este paso solo aplica para<br><strong>Edificios de Oficinas Completo</strong> y <strong>Edificios de Departamentos Completo</strong></p>
          <p style="margin-top: 12px; font-size: 0.9rem;">Haz click en <strong>"Siguiente"</strong> para continuar</p>
        </div>
      `;
    }

    // Obtener valores de características
    const cantidadPisos = this.getCaracteristicaValor(110) || 0; // ID 110: Cantidad Pisos Edificio
    const oficinasPorPiso = this.getCaracteristicaValor(120) || 0; // ID 120: Cantidad Oficinas por Piso
    const cantidadSotanos = this.getCaracteristicaValor(121) || 0; // ID 121: Cantidad de Sótanos

    const totalOficinas = parseInt(cantidadPisos) * parseInt(oficinasPorPiso);

    // 🆕 Cargar oficinas existentes si estamos en modo edición
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('🔍 DEBUG RENDERSTEP4 - Verificando oficinas existentes:');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('  this.propId:', this.propId);
    console.log('  this.formData.oficinasExistentes:', this.formData.oficinasExistentes);
    console.log('  length:', this.formData.oficinasExistentes?.length);
    
    if (this.propId && this.formData.oficinasExistentes?.length > 0) {
      console.log('✅ MODO EDITAR - Cargando oficinas existentes');
      console.log('📊 Total oficinas:', this.formData.oficinasExistentes.length);
      console.log('📊 Primera oficina:', this.formData.oficinasExistentes[0]);
      
      // 🆕 Pre-seleccionar SOLO oficinas que tienen equipamiento
      // Las oficinas sin equipamiento NO deben aparecer pintadas
      this.formData.oficinasSeleccionadas = this.formData.oficinasExistentes
        .filter(oficina => {
          // ✅ FILTRO: Solo incluir si tiene características con valor "Sí" o "true"
          // Excluir características del edificio (como piso, área, etc.)
          const tieneEquipamiento = oficina.caracteristicas?.some(c => {
            const valor = c.valor;
            const esEquipamiento = valor === 'Sí' || valor === 'true' || valor === '1' || valor === true;
            return esEquipamiento;
          });
          
          console.log(`  📍 Oficina ${oficina.numero_oficina}: ${tieneEquipamiento ? '✅ CON equipamiento' : '❌ SIN equipamiento'}`);
          
          return tieneEquipamiento;
        })
        .map(oficina => {
          console.log('  Mapeando oficina con equipamiento:', {
            registro_cab_id: oficina.registro_cab_id,
            numero_oficina: oficina.numero_oficina,
            piso: oficina.piso,
            area: oficina.area,
            caracteristicas: oficina.caracteristicas?.length || 0
          });
          
          return {
            registro_cab_id: oficina.registro_cab_id,
            numero_oficina: parseInt(oficina.numero_oficina), // ✅ Asegurar que sea número
            piso: parseInt(oficina.piso), // ✅ Asegurar que sea número
            area: parseFloat(oficina.area) || 50,
            estado: oficina.estado || 'borrador',
            precio_venta: oficina.precio_venta || null,
            precio_alquiler: oficina.precio_alquiler || null,
            caracteristicas: oficina.caracteristicas || []
          };
        });
      
      console.log('✅ Oficinas CON equipamiento mapeadas:', this.formData.oficinasSeleccionadas.length);
      console.log('📊 Oficinas sin equipamiento (no pintadas):', this.formData.oficinasExistentes.length - this.formData.oficinasSeleccionadas.length);
      console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    } else {
      console.log('⚠️ NO hay oficinas existentes para cargar');
      console.log('  Razón: propId =', this.propId, ', oficinas =', this.formData.oficinasExistentes?.length || 0);
      // Inicializar array vacío para evitar errores
      this.formData.oficinasSeleccionadas = this.formData.oficinasSeleccionadas || [];
      console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    }

    if (esEdificioCompleto) {
      return `
        <h3 style="margin-bottom: var(--spacing-md); color: var(--azul-corporativo); font-size: 1.1rem;">
          🏢 Configurar Oficinas del Edificio
        </h3>

        ${cantidadPisos && oficinasPorPiso ? `
          <!-- UNA SOLA COLUMNA CENTRADA -->
          <div style="max-width: 500px; margin: 0 auto;">

            <!-- Resumen compacto arriba -->
            <div style="background: linear-gradient(135deg, var(--azul-corporativo) 0%, var(--azul-claro) 100%); color: white; padding: 12px var(--spacing-md); border-radius: 8px; margin-bottom: var(--spacing-md); text-align: center;">
              <div style="display: flex; justify-content: space-around; font-size: 0.85rem;">
                <div><strong style="font-size: 1.2rem;">${cantidadPisos}</strong><br>Pisos</div>
                <div><strong style="font-size: 1.2rem;">${oficinasPorPiso}</strong><br>Oficinas/Piso</div>
                <div><strong style="font-size: 1.2rem;">${totalOficinas}</strong><br>Total</div>
              </div>
            </div>

            <!-- Botones de acción para oficinas seleccionadas -->
            <div id="oficinasControlPanel" style="display: flex; gap: 8px; margin-bottom: var(--spacing-md);">
              <button
                type="button"
                id="btn-metraje"
                class="btn-primary"
                title="Asignar metraje a las oficinas seleccionadas (doradas)"
                style="flex: 1; padding: 10px 16px; font-size: 0.9rem; font-weight: 600;"
              >
                📐 Metraje
              </button>
              <button
                type="button"
                id="btn-equipar"
                class="btn-secondary"
                title="Configurar equipamiento de las oficinas seleccionadas (doradas)"
                style="flex: 1; padding: 10px 16px; font-size: 0.9rem; font-weight: 600; background: var(--dorado); color: white; border: none;"
              >
                🔧 Equipar
              </button>
            </div>

            <!-- Edificio clickeable con borde -->
            <div id="torreContainer" style="border: 3px solid var(--azul-corporativo); border-radius: 8px; padding: var(--spacing-md); background: white; box-shadow: 0 4px 12px rgba(44, 82, 130, 0.15);">
              ${this.renderTorreClickeable(cantidadPisos, oficinasPorPiso, cantidadSotanos)}
            </div>

            <!-- Leyenda de colores (alineada a la izquierda) -->
            <div style="margin-top: var(--spacing-sm); display: flex; flex-wrap: wrap; gap: 12px; font-size: 0.7rem; color: var(--gris-medio);">
              <div style="display: flex; align-items: center; gap: 3px;">
                <span style="width: 12px; height: 12px; background: linear-gradient(135deg, var(--azul-corporativo) 0%, var(--azul-claro) 100%); border-radius: 2px;"></span>
                <span>Existente</span>
              </div>
              <div style="display: flex; align-items: center; gap: 3px;">
                <span style="width: 12px; height: 12px; background: linear-gradient(135deg, var(--dorado) 0%, var(--dorado-hover) 100%); border-radius: 2px;"></span>
                <span>Seleccionada</span>
              </div>
              <div style="display: flex; align-items: center; gap: 3px;">
                <span style="width: 12px; height: 12px; background: linear-gradient(135deg, #10b981 0%, #059669 100%); border-radius: 2px;"></span>
                <span>Nueva</span>
              </div>
              <div style="display: flex; align-items: center; gap: 3px;">
                <span style="width: 12px; height: 12px; background: linear-gradient(135deg, #ef4444 0%, #dc2626 100%); border-radius: 2px;"></span>
                <span>A eliminar</span>
              </div>
            </div>
          </div>
        ` : `
          <div style="background: #fff3cd; border: 2px solid #ffc107; padding: var(--spacing-lg); border-radius: 12px; text-align: center;">
            <div style="font-size: 2.5rem; margin-bottom: var(--spacing-md);">⚠️</div>
            <h4 style="color: #856404; margin-bottom: var(--spacing-sm);">Características incompletas</h4>
            <p style="color: #856404; margin-bottom: var(--spacing-md);">
              Para configurar las oficinas, debes completar estas características en el Paso 3:
            </p>
            <ul style="list-style: none; padding: 0; color: #856404;">
              <li>✓ Cantidad de Pisos</li>
              <li>✓ Cantidad de Oficinas por Piso</li>
              <li>✓ Cantidad de Sótanos (opcional)</li>
            </ul>
            <button
              type="button"
              onclick="propertyForm.currentStep = 3; propertyForm.render();"
              style="margin-top: var(--spacing-md); padding: 12px 24px; background: var(--azul-corporativo); color: white; border: none; border-radius: 8px; cursor: pointer; font-weight: 600;"
            >
              ← Volver al Paso 3
            </button>
          </div>
        `}
      `;
    }

    if (esCasa) {
      // TODO: Implementar lógica para casas (más adelante)
      return `
        <div style="text-align: center; padding: var(--spacing-xl);">
          <div style="font-size: 3rem; margin-bottom: var(--spacing-md);">🏠</div>
          <h3 style="color: var(--azul-corporativo);">Configuración de Casa</h3>
          <p style="color: var(--gris-medio);">Próximamente...</p>
          <p style="color: var(--gris-medio); font-size: 0.9rem;">Haz click en "Siguiente" para continuar</p>
        </div>
      `;
    }
  }

  renderStep5() {
    return `
      <h3 style="margin-bottom: var(--spacing-md); color: var(--azul-corporativo); display: flex; align-items: center; gap: 10px; font-size: 1.3rem;">
        <span style="display: inline-flex; align-items: center; justify-content: center; width: 36px; height: 36px; border-radius: 50%; background: white; border: 3px solid var(--azul-corporativo);">
          <i data-lucide="dollar-sign" style="width: 20px; height: 20px; color: var(--azul-corporativo);"></i>
        </span>
        Transacción y Precio
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

  renderStep6() {
    const isEdit = !!this.propId;

    return `
      <h3 style="margin-bottom: var(--spacing-md); color: var(--azul-corporativo); display: flex; align-items: center; gap: 10px; font-size: 1.3rem;">
        <span style="display: inline-flex; align-items: center; justify-content: center; width: 36px; height: 36px; border-radius: 50%; background: white; border: 3px solid var(--azul-corporativo);">
          <i data-lucide="camera" style="width: 20px; height: 20px; color: var(--azul-corporativo);"></i>
        </span>
        Imágenes de la Propiedad
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
      <div style="display: flex; justify-content: space-between; align-items: center; gap: 12px; flex-wrap: wrap; padding: 16px 0; margin-top: 24px; border-top: 2px solid #e9ecef;">
        <button 
          type="button" 
          id="btnAnterior" 
          class="btn btn-secondary"
          style="
            visibility: ${this.currentStep === 1 ? 'hidden' : 'visible'};
            font-weight: 600;
            font-size: 0.95rem;
            padding: 12px 24px;
            border-radius: 12px;
            transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
            display: inline-flex;
            align-items: center;
            gap: 8px;
            box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
            border: none;
            cursor: pointer;
            background: linear-gradient(135deg, #f8f9fa 0%, #e9ecef 100%);
            color: #495057;
          "
        >
          ← Anterior
        </button>
        
        <div style="
          font-weight: 600;
          color: var(--azul-corporativo, #2c5282);
          font-size: 0.85rem;
          padding: 8px 16px;
          background: rgba(44, 82, 130, 0.08);
          border-radius: 20px;
          white-space: nowrap;
        ">
          Paso ${this.currentStep} de ${this.totalSteps}
        </div>
        
        <button 
          type="button" 
          id="btnSiguiente" 
          class="btn btn-primary"
          style="
            font-weight: 700;
            font-size: 0.95rem;
            padding: 12px 24px;
            border-radius: 12px;
            transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
            display: inline-flex;
            align-items: center;
            gap: 8px;
            box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
            border: none;
            cursor: pointer;
            background: linear-gradient(135deg, var(--azul-corporativo, #2c5282) 0%, #1e3a5f 100%);
            color: white;
          "
        >
          ${this.currentStep === this.totalSteps ? '✅ Publicar Propiedad' : 'Siguiente →'}
        </button>
      </div>
    `;
  }

  setupEventListeners() {
    // Volver a lista
    const btnVolver = document.getElementById('btnVolverLista');
    if (btnVolver) {
      btnVolver.addEventListener('click', () => {
        console.log('🔙 Click en Volver a Lista');
        this.close();  // ✅ Cerrar el formulario
      });
      console.log('✅ Botón "Volver a Lista" conectado');
    } else {
      console.error('❌ Botón "btnVolverLista" NO ENCONTRADO');
    }

    // Navegación
    document.getElementById('btnAnterior')?.addEventListener('click', () => this.previousStep());
    document.getElementById('btnSiguiente')?.addEventListener('click', () => this.nextStep());

    // 🆕 STEP 1: Inicializar AutoFillDNI (si estamos en step 1)
    if (this.currentStep === 1) {
      this.initAutoFillDNI();
    }

    // 🆕 STEP 2: Inicializar SelectorEdificio (si es tipo Oficina)
    if (this.currentStep === 2) {
      this.initSelectorEdificio();
    }

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

    // ✅ Tipo inmueble change (cargar características + mostrar selector edificio si es oficina)
    document.getElementById('tipo_inmueble_id')?.addEventListener('change', async (e) => {
      const tipoId = e.target.value;
      this.formData.tipo_inmueble_id = tipoId;

      if (tipoId) {
        showNotification('Cargando características...', 'info');
        await this.loadCaracteristicasPorTipo(tipoId);
        showNotification('✅ Características cargadas', 'success');
      }

      // ✅ Mostrar/ocultar selector de edificio por tipo_inmueble_id
      // IDs que REQUIEREN edificio padre: 1=Oficina en Edificio, 3=Departamento
      const tipoIdInt = parseInt(tipoId);
      const requiereEdificioPadre = (tipoIdInt === 1 || tipoIdInt === 3);

      console.log('🏢 Tipo ID:', tipoIdInt, '- Requiere edificio padre:', requiereEdificioPadre);

      const edificioContainer = document.getElementById('edificio-padre-container');

      if (edificioContainer) {
        edificioContainer.style.display = requiereEdificioPadre ? 'block' : 'none';

        // Si requiere edificio padre, inicializar selector
        if (requiereEdificioPadre && !this.selectorEdificio) {
          this.initSelectorEdificio();
        }
      }

      // Para el label dinámico
      const tipoSeleccionado = this.tiposInmuebles.find(t => t.tipo_inmueble_id == tipoId);
      const nombreTipo = (tipoSeleccionado?.nombre || tipoSeleccionado?.nombre_tipo || '');
      const nombreTipoLower = nombreTipo.toLowerCase();
      
      // 🆕 Actualizar label de "Nombre del Inmueble" dinámicamente
      const labelNombreInmueble = document.getElementById('label_nombre_inmueble');
      if (labelNombreInmueble) {
        const nuevoLabel = this.getNombreInmuebleLabel(nombreTipo);
        labelNombreInmueble.innerHTML = `${nuevoLabel} <span style="color: red;">*</span>`;
        console.log(`✅ Label actualizado: "${nuevoLabel}"`);
      }
    const nombreInmuebleInput = document.getElementById('nombre_inmueble');
      const nombreContainer = document.getElementById('nombre_inmueble_container');
      if (nombreInmuebleInput) {
        if (nombreTipoLower.includes('casa')) {
          if (nombreContainer) nombreContainer.style.display = 'none';
          nombreInmuebleInput.value = '';
        } else {
          if (nombreContainer) nombreContainer.style.display = 'block';
          const autoNombre = this.getNombreInmuebleLabel(nombreTipo);
          nombreInmuebleInput.placeholder = autoNombre;
          if (!nombreInmuebleInput.value) {
            nombreInmuebleInput.value = autoNombre;
          }
        }
      }
});

    // 🆕 Listeners para concatenar dirección automáticamente
    const direccionInputs = ['tipo_via', 'nombre_via', 'numero_direccion', 'urbanizacion', 'referencia'];
    direccionInputs.forEach(inputId => {
      const input = document.getElementById(inputId);
      if (input) {
        input.addEventListener('input', () => this.updateDireccionPreview());
      }
    });

    // 🆕 Formatear teléfono automáticamente con +51
    const telefonoInput = document.getElementById('propietario_telefono');
    if (telefonoInput) {
      telefonoInput.addEventListener('input', (e) => {
        let value = e.target.value.replace(/\D/g, ''); // Solo números
        
        // Limitar a 9 dígitos
        if (value.length > 9) {
          value = value.substring(0, 9);
        }
        
        // Formatear: 999 999 999
        if (value.length >= 6) {
          value = value.substring(0, 3) + ' ' + value.substring(3, 6) + ' ' + value.substring(6);
        } else if (value.length >= 3) {
          value = value.substring(0, 3) + ' ' + value.substring(3);
        }
        
        e.target.value = value;
      });
      
      // Al perder el foco, agregar +51 si no está
      telefonoInput.addEventListener('blur', (e) => {
        const value = e.target.value.trim();
        if (value && !value.startsWith('+51')) {
          e.target.value = '+51 ' + value;
        }
      });
    }

    // ✅ Botón Ubicar en Mapa (Geocoding)
    document.getElementById('btnUbicarMapa')?.addEventListener('click', async () => {
      const direccion = document.getElementById('direccion')?.value;
      const distrito = document.getElementById('distrito_id');
      const distritoTexto = distrito?.options[distrito.selectedIndex]?.text;
      
      // SIEMPRE abrir el mapa, incluso sin dirección
      if (!direccion || direccion.trim() === '') {
        showNotification('📍 Marca la ubicación en el mapa', 'info');
        this.abrirMapaSeleccion('', distritoTexto || 'Lima');
        return;
      }
      
      // Intentar geocoding pero SIEMPRE mostrar el mapa
      await this.buscarCoordenadasYMostrarMapa(direccion, distritoTexto);
    });

    // ✅ Acordeón de características (Paso 3)
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

    // 🆕 STEP 4: Checkbox "Mismo metraje para todas las oficinas"
    const mismoMetrajeCheck = document.getElementById('mismo-metraje-check');
    if (mismoMetrajeCheck) {
      mismoMetrajeCheck.addEventListener('change', (e) => {
        const metrajeUnicoContainer = document.getElementById('metraje-unico-container');
        const metrajeIndividualContainer = document.getElementById('metraje-individual-container');

        if (e.target.checked) {
          // Mismo metraje para todas
          metrajeUnicoContainer.style.display = 'block';
          metrajeIndividualContainer.style.display = 'none';
        } else {
          // Metraje individual
          metrajeUnicoContainer.style.display = 'none';
          metrajeIndividualContainer.style.display = 'block';
        }
      });
    }

    // 🆕 BOTÓN METRAJE (Paso 4)
    document.getElementById('btn-metraje')?.addEventListener('click', () => {
      // Obtener oficinas seleccionadas (doradas)
      const oficinasSeleccionadas = document.querySelectorAll('.oficina-seleccionable.selected');

      if (oficinasSeleccionadas.length === 0) {
        showNotification('⚠️ Primero selecciona las oficinas para asignar metraje', 'warning');
        return;
      }

      // Extraer datos de las oficinas seleccionadas
      const oficinasData = Array.from(oficinasSeleccionadas).map(el => ({
        id: el.dataset.oficinaId,
        registroCabId: el.dataset.registroCabId,
        metraje: el.dataset.metraje || '50',
        piso: el.dataset.piso,
        esNueva: el.classList.contains('oficina-nueva')
      }));

      this.mostrarModalMetraje(oficinasData);
    });

    // 🆕 BOTÓN EQUIPAR (Paso 4)
    document.getElementById('btn-equipar')?.addEventListener('click', () => {
      // Obtener oficinas seleccionadas (doradas)
      const oficinasSeleccionadas = document.querySelectorAll('.oficina-seleccionable.selected');

      if (oficinasSeleccionadas.length === 0) {
        showNotification('⚠️ Primero selecciona las oficinas que quieres equipar', 'warning');
        return;
      }

      // Extraer los números de las oficinas seleccionadas
      const numerosOficinas = Array.from(oficinasSeleccionadas).map(el => el.dataset.oficinaId);

      this.mostrarModalEquipamiento(numerosOficinas);
    });

    // 🆕 STEP 4: Inputs dinámicos de oficinas por piso (si existe la torre)
    if (this.currentStep === 4 && document.querySelector('.oficinas-por-piso-input')) {
      this.attachOficinasInputListeners();
      this.attachOficinaExistenteListeners(); // 🎯 Listeners para SELECCIONAR oficinas (dorado)
    }

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
      
      console.log('👤 Datos del propietario recopilados (Paso 1):', {
        dni: this.formData.propietario_real_dni,
        nombre: this.formData.propietario_real_nombre,
        telefono: this.formData.propietario_real_telefono,
        email: this.formData.propietario_real_email
      });
    } else if (this.currentStep === 2) {
      this.formData.tipo_inmueble_id = document.getElementById('tipo_inmueble_id')?.value || null;
      this.formData.distrito_id = document.getElementById('distrito_id')?.value || null;
      this.formData.nombre_inmueble = document.getElementById('nombre_inmueble')?.value || '';
      this.formData.direccion = document.getElementById('direccion')?.value || '';
      this.formData.latitud = document.getElementById('latitud')?.value || null;
      this.formData.longitud = document.getElementById('longitud')?.value || null;

      // 🏢 Campos para Oficina en Edificio (tipos 1 y 3)
      const tipoIdInt = parseInt(this.formData.tipo_inmueble_id) || 0;
      const requiereEdificioPadre = (tipoIdInt === 1 || tipoIdInt === 3);

      if (requiereEdificioPadre) {
        this.formData.padre_registro_cab_id = document.getElementById('edificio-padre-select')?.value || null;
        this.formData.piso = document.getElementById('piso-select')?.value || null;

        console.log('🏢 Datos de edificio padre recopilados (Paso 2):', {
          padre_registro_cab_id: this.formData.padre_registro_cab_id,
          piso: this.formData.piso
        });
      }
    } else if (this.currentStep === 3) {
      this.formData.area = document.getElementById('area')?.value || null;
      this.formData.antiguedad = document.getElementById('antiguedad')?.value || null;
      this.formData.implementacion = document.getElementById('implementacion')?.value || null;
      
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
      // 🏢 PASO 4: Recolectar datos de configuración de edificio completo
      // ✅ Detectar edificios completos (oficinas o departamentos)
      const tipoSeleccionado = this.tiposInmuebles.find(t => 
        parseInt(t.tipo_inmueble_id) === parseInt(this.formData.tipo_inmueble_id)
      );
      const nombreTipo = (tipoSeleccionado?.nombre || tipoSeleccionado?.nombre_tipo || '').toLowerCase();
      const esEdificioCompleto = nombreTipo.includes('edificio') && nombreTipo.includes('completo');
      
      if (esEdificioCompleto) {
        console.log('🏢 Recopilando datos de Edificio Completo...');

        // ✅ GARANTIZAR DATOS COMPLETOS: Generar oficinas programáticamente
        console.log('🔍 Verificando edificioConfig existente:', this.formData.edificioConfig);
        
        // Datos del edificio (ya recopilados en step 3)
        const pisos = parseInt(this.formData.caracteristicas.find(c => c.caracteristica_id === 110)?.valor || 0);
        const oficinasPorPiso = parseInt(this.formData.caracteristicas.find(c => c.caracteristica_id === 120)?.valor || 0);
        const sotanos = parseInt(this.formData.caracteristicas.find(c => c.caracteristica_id === 121)?.valor || 0);

        console.log(`📊 Generando oficinas: ${pisos} pisos × ${oficinasPorPiso} oficinas/piso = ${pisos * oficinasPorPiso} oficinas`);

        // ✅ GENERAR OFICINAS PROGRAMÁTICAMENTE (sin depender del DOM)
        const oficinasConfig = [];
        
        for (let piso = pisos; piso >= 1; piso--) {
          const oficinasEnEstePiso = this.getOficinasEnPiso(piso, oficinasPorPiso);
          
          for (let i = 1; i <= oficinasEnEstePiso; i++) {
            const oficinaNum = (piso * 100) + i;
            
            // Intentar obtener metraje del DOM si existe, sino usar default
            const oficinaEl = document.querySelector(`.oficina-seleccionable[data-oficina-id="${oficinaNum}"]`);
            const metraje = oficinaEl ? parseFloat(oficinaEl.dataset.metraje) || 50 : 50;

            oficinasConfig.push({
              oficina_numero: oficinaNum,
              piso: piso,
              area: metraje,
              nombre: `Oficina ${oficinaNum}`
            });
          }
        }

        // ✅ GENERAR SÓTANOS PROGRAMÁTICAMENTE
        const sotanosConfig = [];
        for (let s = 1; s <= sotanos; s++) {
          const parqueosInput = document.getElementById(`sotano-${s}-parqueos`);
          const parqueos = parqueosInput ? parseInt(parqueosInput.value) || 0 : 0;
          
          sotanosConfig.push({
            nivel: s,
            parqueos: parqueos
          });
        }

        // ✅ GUARDAR SIEMPRE (sobrescribir si ya existe)
        this.formData.edificioConfig = {
          pisos: pisos,
          oficinas_por_piso: oficinasPorPiso,
          sotanos: sotanos,
          oficinas: oficinasConfig,
          sotanos_config: sotanosConfig,
          equipamiento: this.formData.equipamiento || {}
        };

        console.log('✅ Configuración de edificio guardada:', {
          total_pisos: pisos,
          total_oficinas: oficinasConfig.length,
          total_sotanos: sotanosConfig.length,
          oficinas: oficinasConfig
        });
      }
    } else if (this.currentStep === 5) {
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
    // Validación por paso
    if (this.currentStep === 1) {
      // Paso 1: Propietario
      const dni = document.getElementById('propietario_dni')?.value;
      const nombre = document.getElementById('propietario_nombre')?.value;
      const telefono = document.getElementById('propietario_telefono')?.value?.replace(/\D/g, '');
      
      if (!dni || (dni.length !== 8 && dni.length !== 11)) {
        showNotification('⚠️ El DNI/RUC debe tener 8 u 11 dígitos', 'warning');
        return false;
      }
      
      if (!nombre || nombre.trim() === '') {
        showNotification('⚠️ El nombre del propietario es requerido', 'warning');
        return false;
      }
      
      if (!telefono || telefono.trim() === '' || telefono.length < 9) {
        showNotification('⚠️ El teléfono es requerido (9 dígitos)', 'warning');
        return false;
      }
    }
    
    if (this.currentStep === 2) {
      // Paso 2: Información Básica
      const tipoInmueble = document.getElementById('tipo_inmueble_id')?.value;
      const distrito = document.getElementById('distrito_id')?.value;
      const nombreInmuebleInput = document.getElementById('nombre_inmueble');
      const nombreInmueble = nombreInmuebleInput?.value;
      const nombreVia = document.getElementById('nombre_via')?.value;
      
      if (!tipoInmueble) {
        showNotification('⚠️ Selecciona el tipo de inmueble', 'warning');
        return false;
      }

      // 🏢 VALIDACIÓN OBLIGATORIA: Edificio + Piso para tipos 1 (Oficina) y 3 (Departamento)
      const tipoIdInt = parseInt(tipoInmueble);
      const requiereEdificioPadre = (tipoIdInt === 1 || tipoIdInt === 3);

      if (requiereEdificioPadre) {
        // Validar edificio
        const edificioSelect = document.getElementById('edificio-padre-select');
        const edificioId = edificioSelect?.value;

        if (!edificioId) {
          showNotification('⚠️ Debes seleccionar el edificio donde está ubicada la oficina', 'warning');
          if (edificioSelect) {
            edificioSelect.style.border = '3px solid #ef4444';
            edificioSelect.style.boxShadow = '0 0 10px rgba(239, 68, 68, 0.5)';
            edificioSelect.focus();
            setTimeout(() => {
              edificioSelect.style.border = '2px solid #ff9800';
              edificioSelect.style.boxShadow = '';
            }, 3000);
          }
          return false;
        }

        // Validar piso
        const pisoSelect = document.getElementById('piso-select');
        const piso = pisoSelect?.value;

        if (!piso) {
          showNotification('⚠️ Debes seleccionar el número de piso', 'warning');
          if (pisoSelect) {
            pisoSelect.style.border = '3px solid #ef4444';
            pisoSelect.style.boxShadow = '0 0 10px rgba(239, 68, 68, 0.5)';
            pisoSelect.focus();
            setTimeout(() => {
              pisoSelect.style.border = '2px solid #ff9800';
              pisoSelect.style.boxShadow = '';
            }, 3000);
          }
          return false;
        }
      }

      if (!distrito) {
        showNotification('⚠️ Selecciona el distrito', 'warning');
        return false;
      }
      
      if (nombreInmuebleInput?.offsetParent !== null && (!nombreInmueble || nombreInmueble.trim() === '')) {
        showNotification('⚠️ El nombre del inmueble es requerido', 'warning');
        return false;
      }
      
      // 🆕 Validar que al menos el nombre de vía esté completo
      if (!nombreVia || nombreVia.trim() === '') {
        showNotification('⚠️ Debes completar al menos el nombre de la vía en la dirección', 'warning');
        return false;
      }
      
      // Actualizar dirección antes de validar
      this.updateDireccionPreview();
      
      const direccion = document.getElementById('direccion')?.value;
      if (!direccion || direccion.trim() === '') {
        showNotification('⚠️ La dirección es requerida', 'warning');
        return false;
      }
    }
    
    return true;
  }

  async previousStep() {
    if (this.currentStep > 1) {
      this.collectStepData();
      this.currentStep--;
      
      // ✅ SALTAR PASO 4 si NO es edificio completo (IDs 12 o 13) al retroceder
      if (this.currentStep === 4) {
        const tipoInmuebleId = parseInt(this.formData.tipo_inmueble_id);
        const esEdificioCompleto = tipoInmuebleId === 12 || tipoInmuebleId === 13;
        
        if (!esEdificioCompleto) {
          console.log('⏮️ Saltando Paso 4 (retroceso) - No es edificio completo (ID:', tipoInmuebleId, ')');
          this.currentStep = 3; // Retroceder al paso 3 (Características)
        }
      }
      
      this.render();
      
      // ✅ Re-llenar campos después de renderizar
      setTimeout(() => {
        this.populateFormFields();
        // 🎨 Re-inicializar iconos Lucide
        if (typeof lucide !== 'undefined') {
          lucide.createIcons();
        }
      }, 100);

      // 🆕 Cargar características automáticamente al volver al paso 3
      if (this.currentStep === 3 && this.formData.tipo_inmueble_id) {
        console.log('🔄 Cargando características para tipo:', this.formData.tipo_inmueble_id);
        await this.loadCaracteristicasPorTipo(this.formData.tipo_inmueble_id);
      }
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
      
      // ✅ SALTAR PASO 4 si NO es edificio completo (IDs 12 o 13)
      if (this.currentStep === 4) {
        const tipoInmuebleId = parseInt(this.formData.tipo_inmueble_id);
        const esEdificioCompleto = tipoInmuebleId === 12 || tipoInmuebleId === 13;
        
        if (!esEdificioCompleto) {
          console.log('⏭️ Saltando Paso 4 - No es edificio completo (ID:', tipoInmuebleId, ')');
          this.currentStep = 5; // Saltar al paso 5 (Precio)
        }
      }
      
      this.render();
      
      // ✅ Re-llenar campos después de renderizar
      setTimeout(() => {
        this.populateFormFields();
        // 🎨 Re-inicializar iconos Lucide
        if (typeof lucide !== 'undefined') {
          lucide.createIcons();
        }
      }, 100);

      // 🆕 Cargar características automáticamente al entrar en paso 3
      if (this.currentStep === 3 && this.formData.tipo_inmueble_id) {
        console.log('🔄 Cargando características para tipo:', this.formData.tipo_inmueble_id);
        await this.loadCaracteristicasPorTipo(this.formData.tipo_inmueble_id);
      }
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
        this.currentStep = 6; // 🆕 Actualizado a paso 6 (Imágenes)
        this.render();
        return;
      }

      showNotification(isEdit ? '📤 Actualizando propiedad...' : '📤 Publicando propiedad...', 'info');

      // 🆕 PASO 1: Crear/obtener propietario_id
      let propietarioId = this.formData.propietario_id;
      
      console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
      console.log('🔍 VERIFICANDO PROPIETARIO_ID:');
      console.log('  isEdit:', isEdit);
      console.log('  propietarioId inicial:', propietarioId);
      console.log('  formData.propietario_id:', this.formData.propietario_id);
      console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');

      if (!propietarioId && !isEdit) {
        // ✅ PRIMERO: Buscar propietario por DNI
        const dni = this.formData.propietario_real_dni || this.formData.propietario_dni || '';
        
        console.log('🔍 Buscando propietario con DNI:', dni);
        
        try {
          // Intentar buscar propietario existente por DNI
          const propietarioExistente = await propietarioService.buscarPorDNI(dni);
          
          if (propietarioExistente) {
            // Propietario encontrado
            propietarioId = propietarioExistente.propietario_id;
            console.log('✅ Propietario existente encontrado:', propietarioId);
            showNotification('✅ Propietario encontrado', 'info');
          } else {
            // No existe, crear nuevo
            console.log('🆕 Creando nuevo propietario...');
            
            const propietarioPayload = {
              dni: dni,
              nombre: this.formData.propietario_real_nombre || this.formData.propietario_nombre || '',
              telefono: this.formData.propietario_real_telefono || this.formData.propietario_telefono || '',
              email: this.formData.propietario_real_email || this.formData.propietario_email || null
            };
            
            console.log('📋 Payload propietario:', propietarioPayload);

            const propietarioCreado = await propietarioService.crear(propietarioPayload);
            propietarioId = propietarioCreado.propietario_id;
            console.log('✅ Propietario creado:', propietarioId);
            showNotification('✅ Propietario registrado', 'success');
          }
        } catch (error) {
          console.error('❌ Error gestionando propietario:', error);
          throw new Error(`Error al gestionar propietario: ${error.message}`);
        }
      }
      
      // ✅ GUARDAR propietario_id en formData para que esté disponible en prepareEdificioCompletoData()
      this.formData.propietario_id = propietarioId;
      console.log('💾 propietario_id guardado en formData:', this.formData.propietario_id);

      // 🆕 PASO 2: Obtener padre_registro_cab_id si es Oficina
      let padreRegistroCabId = null;
      console.log('🔍 Verificando selectorEdificio:', this.selectorEdificio);
      if (this.selectorEdificio) {
        padreRegistroCabId = this.selectorEdificio.getEdificioId();
        console.log('🏢 Edificio padre seleccionado:', padreRegistroCabId);
      } else {
        console.log('⚠️ No hay selectorEdificio inicializado');
      }

      // 🏢 VERIFICAR SI ES EDIFICIO COMPLETO (se evaluará más adelante con la lógica completa)
      // La verificación se hará después de preparar los datos para la API

      // 🆕 PASO 3: Construir JSON para la API (NUEVO ESQUEMA - PROPIEDAD INDIVIDUAL)
      const propiedadJson = {
        propietario_id: propietarioId,
        padre_registro_cab_id: padreRegistroCabId,
        piso: this.formData.piso ? parseInt(this.formData.piso) : null,

        tipo_inmueble_id: parseInt(this.formData.tipo_inmueble_id),
        distrito_id: parseInt(this.formData.distrito_id),
        nombre_inmueble: this.formData.nombre_inmueble,
        direccion: this.formData.direccion,
        latitud: this.formData.latitud ? parseFloat(this.formData.latitud) : null,
        longitud: this.formData.longitud ? parseFloat(this.formData.longitud) : null,

        area: this.formData.area ? parseFloat(this.formData.area) : 0,
        // ❌ REMOVIDO: habitaciones, banos, parqueos (van a características)
        antiguedad: this.formData.antiguedad ? parseInt(this.formData.antiguedad) : null,
        implementacion: this.formData.implementacion ? parseInt(this.formData.implementacion) : null,

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

      // Determinar si es Edificio Completo para usar API específica
      const tipoSeleccionado = this.tiposInmuebles.find(t => t.tipo_inmueble_id == this.formData.tipo_inmueble_id);
      const nombreTipo = (tipoSeleccionado?.nombre || tipoSeleccionado?.nombre_tipo || '').toLowerCase();
      // ✅ DETECCIÓN: Edificios completos (oficinas o departamentos)
      const esEdificioCompleto = nombreTipo.includes('edificio') && nombreTipo.includes('completo');
      
      // Enviar a la API (diferente endpoint según modo y tipo)
      const token = authService.getToken();
      let url, response;
      
      if (esEdificioCompleto && !isEdit) {
        // 🏢 CREAR EDIFICIO COMPLETO
        console.log('🏢 Detectado Edificio Completo - usando API POST /propiedades/edificio-completo');
        
        // ✅ VALIDAR que exista configuración de oficinas
        if (!this.formData.edificioConfig || !this.formData.edificioConfig.oficinas || this.formData.edificioConfig.oficinas.length === 0) {
          console.error('❌ No hay configuración de oficinas');
          showNotification('❌ Debes configurar las oficinas del edificio en el Paso 4', 'error');
          this.submitBtn.disabled = false;
          this.submitBtn.textContent = 'Publicar Propiedad';
          return;
        }
        
        url = `${API_CONFIG.BASE_URL}/propiedades/edificio-completo`;
        
        // Preparar datos específicos para edificio completo
        const edificioCompletoData = this.prepareEdificioCompletoData();
        
        // Crear FormData para la API de edificio completo
        const edificioFormData = new FormData();
        edificioFormData.append('edificio_json', JSON.stringify(edificioCompletoData));
        
        // Agregar imágenes
        if (this.formData.imagen_principal) {
          edificioFormData.append('imagen_principal', this.formData.imagen_principal);
        }
        if (this.formData.imagenes_galeria.length > 0) {
          this.formData.imagenes_galeria.forEach(imagen => {
            edificioFormData.append('imagenes_galeria', imagen);
          });
        }
        
        response = await fetch(url, {
          method: 'POST',  // ✅ POST para crear
          headers: {
            'Authorization': `Bearer ${token}`
          },
          body: edificioFormData
        });
      } else if (esEdificioCompleto && isEdit) {
        // 🏢 ACTUALIZAR EDIFICIO COMPLETO
        console.log('🏢 Actualizando Edificio Completo - usando API PUT /propiedades/edificio-completo/{id}');
        
        // ✅ VALIDAR que exista configuración de oficinas
        if (!this.formData.edificioConfig || !this.formData.edificioConfig.oficinas || this.formData.edificioConfig.oficinas.length === 0) {
          console.error('❌ No hay configuración de oficinas');
          showNotification('❌ Debes configurar las oficinas del edificio en el Paso 4', 'error');
          this.submitBtn.disabled = false;
          this.submitBtn.textContent = 'Actualizar Propiedad';
          return;
        }
        
        url = `${API_CONFIG.BASE_URL}/propiedades/edificio-completo/${this.propId}`;
        
        // Preparar datos específicos para edificio completo
        const edificioCompletoData = this.prepareEdificioCompletoData();
        
        console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
        console.log('🏢 DATOS A ENVIAR EN MODO EDITAR:');
        console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
        console.log('📤 URL:', url);
        console.log('📋 edificioCompletoData:', JSON.stringify(edificioCompletoData, null, 2));
        console.log('🏢 Total oficinas:', edificioCompletoData.oficinas?.length);
        console.log('🛠️ Equipamiento:', edificioCompletoData.oficinas?.map(o => ({
          numero: o.numero_oficina,
          caracteristicas: o.caracteristicas?.length || 0
        })));
        console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
        
        // Crear FormData para la API de edificio completo
        const edificioFormData = new FormData();
        edificioFormData.append('edificio_json', JSON.stringify(edificioCompletoData));
        
        // Agregar imágenes
        if (this.formData.imagen_principal) {
          edificioFormData.append('imagen_principal', this.formData.imagen_principal);
        }
        if (this.formData.imagenes_galeria.length > 0) {
          this.formData.imagenes_galeria.forEach(imagen => {
            edificioFormData.append('imagenes_galeria', imagen);
          });
        }
        
        response = await fetch(url, {
          method: 'PUT',  // ✅ PUT para actualizar
          headers: {
            'Authorization': `Bearer ${token}`
          },
          body: edificioFormData
        });
      } else {
        // 📄 API NORMAL para otras propiedades o edición
        url = isEdit 
          ? `${API_CONFIG.BASE_URL}/propiedades/actualizar-completa/${this.propId}`
          : `${API_CONFIG.BASE_URL}/propiedades/con-imagenes`;
          
        response = await fetch(url, {
          method: isEdit ? 'PUT' : 'POST',
          headers: {
            'Authorization': `Bearer ${token}`
          },
          body: formData
        });
      }

      const result = await response.json();
      
      console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
      console.log('📥 RESPUESTA DEL SERVIDOR:');
      console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
      console.log('Status:', response.status);
      console.log('Respuesta completa:', JSON.stringify(result, null, 2));
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
        isEdit ? '✅ Propiedad actualizada exitosamente' : 
        (esEdificioCompleto ? '🏢 Edificio completo creado con todas sus oficinas' : '✅ Propiedad publicada exitosamente'),
        'success'
      );

      // 🏢 Si fue Edificio Completo, mostrar estadísticas
      if (!isEdit && esEdificioCompleto && result.data && result.data.oficinas) {
        console.log('🏢 Estadísticas del Edificio Creado:');
        console.log(`📊 Total oficinas: ${result.data.total_oficinas}`);
        console.log(`🅿️ Total sótanos: ${result.data.total_sotanos}`);
        console.log(`🚗 Total parqueos: ${result.data.total_parqueos}`);
        
        // Mostrar notificación detallada
        setTimeout(() => {
          showNotification(
            `🏢 Edificio creado: ${result.data.total_oficinas} oficinas, ${result.data.total_sotanos} sótanos`,
            'info'
          );
        }, 2000);
      }

      // Volver a la lista
      setTimeout(() => {
        this.close();  // ✅ Cerrar formulario y volver a la lista
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

  /**
   * 🆕 Inicializar componente AutoFillDNI (Step 1)
   */
  initAutoFillDNI() {
    console.log('🔧 Inicializando AutoFillDNI...');

    if (!this.autoFillDNI) {
      this.autoFillDNI = new AutoFillDNI(
        '#propietario_dni',
        '#propietario_nombre',
        '#propietario_telefono',
        '#propietario_email',
        '#propietario_id_hidden'
      );
      this.autoFillDNI.init();
      console.log('✅ AutoFillDNI inicializado');
    }
  }

  /**
   * 🆕 Inicializar componente SelectorEdificio (Step 2 - solo si es Oficina)
   */
  async initSelectorEdificio() {
    console.log('🔧 Inicializando SelectorEdificio...');
    console.log('🔍 formData.padre_registro_cab_id en initSelectorEdificio:', this.formData.padre_registro_cab_id);  // ✅ DEBUG

    const selectElement = document.querySelector('#edificio-padre-select');
    const containerElement = document.querySelector('#edificio-caracteristicas-container');

    if (selectElement && containerElement && !this.selectorEdificio) {
      this.selectorEdificio = new SelectorEdificio(
        '#edificio-padre-select',
        '#edificio-caracteristicas-container'
      );

      // 🆕 Configurar callback para heredar datos del edificio
      this.selectorEdificio.setOnChangeCallback((edificio) => {
        this.handleEdificioHerencia(edificio);
      });

      // Inicializar y esperar a que cargue las opciones
      await this.selectorEdificio.init();
      console.log('✅ SelectorEdificio inicializado');

      // ✅ Si hay un edificio padre en formData, pre-seleccionarlo AHORA
      console.log('🔍 Verificando padre_registro_cab_id:', this.formData.padre_registro_cab_id);  // ✅ DEBUG
      if (this.formData.padre_registro_cab_id) {
        console.log('🏢 Pre-seleccionando edificio padre después de cargar opciones:', this.formData.padre_registro_cab_id);

        // Usar el método setEdificio del componente
        await this.selectorEdificio.setEdificio(this.formData.padre_registro_cab_id);
      }
    }
  }

  /**
   * 🏢 Manejar herencia de datos del edificio padre
   * Cuando se selecciona un edificio, hereda: distrito, dirección, coordenadas y carga pisos
   */
  async handleEdificioHerencia(edificio) {
    const pisoContainer = document.getElementById('piso-container');
    const pisoSelect = document.getElementById('piso-select');

    if (!edificio) {
      console.log('🔄 Edificio deseleccionado - limpiando herencia');
      // Ocultar combo de piso
      if (pisoContainer) pisoContainer.style.display = 'none';
      if (pisoSelect) pisoSelect.innerHTML = '<option value="">-- Seleccionar piso --</option>';
      return;
    }

    console.log('🏢 Heredando datos del edificio:', edificio);

    // 1. Heredar distrito
    if (edificio.distrito_id) {
      const distritoSelect = document.getElementById('distrito_id');
      if (distritoSelect) {
        distritoSelect.value = edificio.distrito_id;
        this.formData.distrito_id = edificio.distrito_id;
        console.log('✅ Distrito heredado:', edificio.distrito_id);
        distritoSelect.dispatchEvent(new Event('change', { bubbles: true }));
      }
    }

    // 2. Heredar dirección
    if (edificio.direccion) {
      const direccionInput = document.getElementById('direccion');
      const nombreViaInput = document.getElementById('nombre_via');

      if (direccionInput && (!direccionInput.value || direccionInput.value.trim() === '')) {
        direccionInput.value = edificio.direccion;
        this.formData.direccion = edificio.direccion;
        console.log('✅ Dirección heredada:', edificio.direccion);
      }

      if (nombreViaInput && (!nombreViaInput.value || nombreViaInput.value.trim() === '')) {
        nombreViaInput.value = edificio.direccion.split(',')[0] || edificio.direccion;
      }
    }

    // 3. Heredar coordenadas
    if (edificio.latitud && edificio.longitud) {
      const latitudInput = document.getElementById('latitud');
      const longitudInput = document.getElementById('longitud');

      if (latitudInput) {
        latitudInput.value = edificio.latitud;
        this.formData.latitud = edificio.latitud;
      }
      if (longitudInput) {
        longitudInput.value = edificio.longitud;
        this.formData.longitud = edificio.longitud;
      }
      console.log('✅ Coordenadas heredadas:', edificio.latitud, edificio.longitud);

      if (typeof this.updateMapMarker === 'function') {
        this.updateMapMarker(parseFloat(edificio.latitud), parseFloat(edificio.longitud));
      }
    }

    // 4. 🆕 Cargar pisos del edificio
    if (pisoContainer && pisoSelect) {
      try {
        pisoSelect.innerHTML = '<option value="">Cargando pisos...</option>';
        pisoContainer.style.display = 'block';

        const cantidadPisos = await edificioService.obtenerCantidadPisos(edificio.registro_cab_id);

        // Generar opciones de piso
        let opcionesPiso = '<option value="">-- Seleccionar piso --</option>';
        for (let i = 1; i <= cantidadPisos; i++) {
          opcionesPiso += `<option value="${i}">Piso ${i}</option>`;
        }
        pisoSelect.innerHTML = opcionesPiso;

        console.log(`✅ Combo de pisos cargado: 1 a ${cantidadPisos}`);

        // Si ya había un piso guardado, seleccionarlo
        if (this.formData.piso) {
          pisoSelect.value = this.formData.piso;
        }

      } catch (error) {
        console.error('❌ Error cargando pisos:', error);
        // Fallback: mostrar 1-20
        let opcionesPiso = '<option value="">-- Seleccionar piso --</option>';
        for (let i = 1; i <= 20; i++) {
          opcionesPiso += `<option value="${i}">Piso ${i}</option>`;
        }
        pisoSelect.innerHTML = opcionesPiso;
        pisoContainer.style.display = 'block';
      }
    }

    showNotification(`✅ Datos heredados de "${edificio.nombre_inmueble}"`, 'success');
  }

  /**
   * 🆕 Mostrar modal de generación masiva (después de crear edificio)
   */
  async showModalGeneracionMasiva(edificioCreado) {
    console.log('🔧 Mostrando modal generación masiva...', edificioCreado);

    if (!this.modalMasivo) {
      this.modalMasivo = new ModalGeneracionMasiva();
    }

    // Configurar datos del edificio recién creado
    const config = {
      edificio_id: edificioCreado.registro_cab_id,
      propietario_id: edificioCreado.propietario_id,
      distrito_id: edificioCreado.distrito_id,
      nombre_edificio: edificioCreado.nombre_inmueble
    };

    // Mostrar modal
    this.modalMasivo.show(config);

    console.log('✅ Modal generación masiva mostrado');
  }

  /**
   * 🔍 Obtener valor de una característica por ID
   */
  getCaracteristicaValor(caracteristicaId) {
    if (!this.formData.caracteristicas) return null;

    const caracteristica = this.formData.caracteristicas.find(
      c => parseInt(c.caracteristica_id) === parseInt(caracteristicaId)
    );

    return caracteristica ? caracteristica.valor : null;
  }

  /**
   * 🏢 Crear edificio completo con oficinas y sótanos
   */
  async crearEdificioCompleto(finalData) {
    try {
      console.log('🏗️ Iniciando creación de edificio completo...', finalData);

      showNotification('🏗️ Creando edificio y oficinas...', 'info');

      // Construir payload para el backend
      const payload = {
        edificio: {
          propietario_id: finalData.edificio.propietario_id,
          tipo_inmueble_id: finalData.edificio.tipo_inmueble_id,
          distrito_id: finalData.edificio.distrito_id,
          nombre_inmueble: finalData.edificio.nombre_inmueble,
          direccion: finalData.edificio.direccion,
          latitud: finalData.edificio.latitud,
          longitud: finalData.edificio.longitud,
          area: finalData.edificio.area,
          antiguedad: finalData.edificio.antiguedad,
          implementacion: finalData.edificio.implementacion,
          transaccion: finalData.edificio.transaccion,
          precio_venta: finalData.edificio.precio_venta,
          precio_alquiler: finalData.edificio.precio_alquiler,
          moneda: finalData.edificio.moneda,
          titulo: finalData.edificio.titulo,
          descripcion: finalData.edificio.descripcion,
          caracteristicas: finalData.edificio.todas_caracteristicas
        },
        oficinas: finalData.oficinas,
        sotanos: finalData.sotanos
      };

      // Crear FormData para subir imágenes
      const formData = new FormData();
      formData.append('edificio_json', JSON.stringify(payload));

      // Agregar imagen principal
      if (finalData.edificio.imagen_principal) {
        formData.append('imagen_principal', finalData.edificio.imagen_principal);
      }

      // Agregar galería
      if (finalData.edificio.imagenes_galeria && finalData.edificio.imagenes_galeria.length > 0) {
        finalData.edificio.imagenes_galeria.forEach(img => {
          formData.append('imagenes_galeria', img);
        });
      }

      console.log('📤 Enviando edificio completo al backend...');

      // Llamar al nuevo endpoint de edificio completo
      const response = await fetch(`${API_CONFIG.BASE_URL}/propiedades/edificio-completo`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('access_token')}`
        },
        body: formData
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.detail || 'Error al crear edificio completo');
      }

      const result = await response.json();
      console.log('✅ Edificio completo creado:', result);

      // Mostrar mensaje de éxito
      await Swal.fire({
        icon: 'success',
        title: '¡Edificio creado exitosamente!',
        html: `
          <div class="text-start">
            <p><strong>Edificio:</strong> ${result.data.edificio.nombre}</p>
            <p><strong>Oficinas creadas:</strong> ${result.data.total_oficinas}</p>
            ${result.data.total_sotanos > 0 ? `<p><strong>Sótanos:</strong> ${result.data.total_sotanos}</p>` : ''}
          </div>
        `,
        showConfirmButton: true,
        confirmButtonText: 'Ver Propiedades'
      });

      // Redirigir a lista de propiedades
      window.location.href = '/dashboard/propiedades.html';

    } catch (error) {
      console.error('❌ Error creando edificio completo:', error);
      showNotification('❌ Error al crear edificio: ' + error.message, 'error');

      Swal.fire({
        icon: 'error',
        title: 'Error',
        text: error.message || 'Error al crear el edificio completo'
      });
    }
  }

  /**
   * 🆕 MÉTODOS HELPER - Oficinas Dinámicas por Piso
   */
  getOficinasEnPiso(piso, defaultCount) {
    if (!this.formData.oficinasConfigPorPiso) {
      this.formData.oficinasConfigPorPiso = {};
    }
    return this.formData.oficinasConfigPorPiso[piso] || defaultCount;
  }

  setOficinasEnPiso(piso, cantidad) {
    if (!this.formData.oficinasConfigPorPiso) {
      this.formData.oficinasConfigPorPiso = {};
    }
    this.formData.oficinasConfigPorPiso[piso] = parseInt(cantidad);
    console.log(`🔧 Piso ${piso} actualizado a ${cantidad} oficinas`);
  }

  rerenderTorre() {
    const pisos = this.formData.caracteristicas.find(c => c.caracteristica_id === 110)?.valor || 0;
    const oficinasPorPiso = this.formData.caracteristicas.find(c => c.caracteristica_id === 120)?.valor || 0;
    const sotanos = this.formData.caracteristicas.find(c => c.caracteristica_id === 121)?.valor || 0;

    const torreContainer = document.getElementById('torreContainer');
    if (torreContainer) {
      torreContainer.innerHTML = this.renderTorreClickeable(pisos, oficinasPorPiso, sotanos);

      // Re-aplicar event listeners a los nuevos inputs
      this.attachOficinasInputListeners();

      // Re-aplicar event listeners a las oficinas (para SELECCIÓN dorada)
      this.attachOficinaExistenteListeners();
    }
  }

  /**
   * 🎯 Adjuntar listeners a oficinas para SELECCIÓN (equipar/metraje)
   * Click = toggle selección (dorado) para luego aplicar metraje o equipar
   */
  attachOficinaExistenteListeners() {
    document.querySelectorAll('.oficina-seleccionable').forEach(oficina => {
      oficina.addEventListener('click', (e) => {
        const oficinaId = oficina.dataset.oficinaId;
        const registroCabId = oficina.dataset.registroCabId;
        const paraEliminar = oficina.classList.contains('para-eliminar');

        // Si está marcada para eliminar (roja), no permitir seleccionar
        if (paraEliminar) {
          showNotification('Esta oficina está marcada para eliminar', 'warning');
          return;
        }

        // Toggle clase selected (visual)
        oficina.classList.toggle('selected');

        if (oficina.classList.contains('selected')) {
          oficina.style.background = 'linear-gradient(135deg, var(--dorado) 0%, var(--dorado-hover) 100%)';
          oficina.style.transform = 'scale(1.05)';
          console.log(`🎯 Oficina ${oficinaId} SELECCIONADA para equipar`);
        } else {
          // Restaurar color original (azul para existentes, verde para nuevas)
          const esNueva = oficina.classList.contains('oficina-nueva');
          if (esNueva) {
            oficina.style.background = 'linear-gradient(135deg, #10b981 0%, #059669 100%)';
          } else {
            oficina.style.background = 'linear-gradient(135deg, var(--azul-corporativo) 0%, var(--azul-claro) 100%)';
          }
          oficina.style.transform = 'scale(1)';
          console.log(`🎯 Oficina ${oficinaId} DESELECCIONADA`);
        }
      });
    });
  }

  attachOficinasInputListeners() {
    document.querySelectorAll('.oficinas-por-piso-input').forEach(input => {
      input.addEventListener('change', (e) => {
        const piso = parseInt(e.target.dataset.piso);
        let cantidad = parseInt(e.target.value) || 0;

        // Validar rango (0 a 20)
        if (cantidad < 0) {
          cantidad = 0;
          e.target.value = 0;
        }
        if (cantidad > 20) {
          cantidad = 20;
          e.target.value = 20;
        }

        // Guardar y re-renderizar
        this.setOficinasEnPiso(piso, cantidad);
        this.rerenderTorre();

        showNotification(`Piso ${piso} actualizado a ${cantidad} oficina(s)`, 'success');
      });
    });
  }

  /**
   * 🗑️ Toggle marcar/desmarcar oficina existente para eliminar
   */
  toggleEliminarOficina(registroCabId) {
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('🗑️ TOGGLE ELIMINAR OFICINA');
    console.log('  registroCabId:', registroCabId, typeof registroCabId);

    // Inicializar array si no existe
    if (!this.formData.oficinasParaEliminar) {
      this.formData.oficinasParaEliminar = [];
      console.log('  ✅ Array inicializado');
    }

    const index = this.formData.oficinasParaEliminar.indexOf(registroCabId);
    console.log('  Index en array:', index);

    if (index === -1) {
      // Marcar para eliminar
      this.formData.oficinasParaEliminar.push(registroCabId);
      console.log(`  🗑️ MARCADA para eliminar`);
      showNotification(`Oficina ID ${registroCabId} marcada para eliminar`, 'warning');
    } else {
      // Desmarcar
      this.formData.oficinasParaEliminar.splice(index, 1);
      console.log(`  ✅ DESMARCADA`);
      showNotification(`Oficina ID ${registroCabId} desmarcada`, 'info');
    }

    console.log('  📋 Array actual:', JSON.stringify(this.formData.oficinasParaEliminar));
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  }

  /**
   * 🔍 Verificar si una oficina está marcada para eliminar
   */
  estaParaEliminar(registroCabId) {
    const resultado = this.formData.oficinasParaEliminar?.includes(registroCabId) || false;
    if (resultado) {
      console.log(`    🔴 Oficina ${registroCabId} ESTÁ marcada para eliminar`);
    }
    return resultado;
  }

  /**
   * 🏗️ NUEVO: Torre clickeable con selección y parqueos integrados
   * En modo edición: muestra oficinas REALES de la base de datos
   * En modo creación: muestra oficinas TEÓRICAS basadas en características
   */
  renderTorreClickeable(pisos, oficinasPorPiso, sotanos) {
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('🏗️ RENDERIZANDO TORRE CLICKEABLE');
    console.log('  Pisos (teórico):', pisos);
    console.log('  Oficinas por piso (teórico):', oficinasPorPiso);
    console.log('  Oficinas existentes (DB):', this.formData.oficinasExistentes?.length || 0);
    console.log('  Oficinas seleccionadas:', this.formData.oficinasSeleccionadas?.length || 0);
    console.log('  Modo:', this.propId ? 'EDICIÓN' : 'CREACIÓN');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');

    let html = '<div style="display: flex; flex-direction: column; gap: 8px;">';

    // 🆕 MODO EDICIÓN: Usar oficinas REALES agrupadas por piso
    const modoEdicion = this.propId && this.formData.oficinasExistentes?.length > 0;

    if (modoEdicion) {
      console.log('📊 MODO EDICIÓN - Usando oficinas REALES de la base de datos');

      // Agrupar oficinas reales por piso
      const oficinasPorPisoReal = {};
      this.formData.oficinasExistentes.forEach(ofi => {
        const pisoOficina = parseInt(ofi.piso) || 1;
        if (!oficinasPorPisoReal[pisoOficina]) {
          oficinasPorPisoReal[pisoOficina] = [];
        }
        oficinasPorPisoReal[pisoOficina].push(ofi);
      });

      console.log('📊 Oficinas agrupadas por piso:', oficinasPorPisoReal);

      // Calcular el máximo de pisos (entre teórico y real)
      const pisosReales = Object.keys(oficinasPorPisoReal).map(p => parseInt(p));
      const maxPisoReal = pisosReales.length > 0 ? Math.max(...pisosReales) : 0;
      const totalPisos = Math.max(parseInt(pisos) || 0, maxPisoReal);

      console.log(`📊 Pisos: teórico=${pisos}, real max=${maxPisoReal}, total=${totalPisos}`);

      // Renderizar pisos (de arriba hacia abajo) con oficinas REALES + NUEVAS
      for (let piso = totalPisos; piso >= 1; piso--) {
        const oficinasExistentes = oficinasPorPisoReal[piso] || [];
        const cantidadExistentes = oficinasExistentes.length;

        // ✅ Obtener cantidad configurada por el usuario
        const cantidadConfigurada = this.getOficinasEnPiso(piso, cantidadExistentes);

        // Calcular oficinas nuevas (si subió) o a eliminar automáticamente (si bajó)
        const oficinasNuevas = Math.max(0, cantidadConfigurada - cantidadExistentes);
        const oficinasAEliminarAuto = Math.max(0, cantidadExistentes - cantidadConfigurada);

        // 🗑️ Si bajó el número, marcar automáticamente las últimas oficinas para eliminar
        if (oficinasAEliminarAuto > 0) {
          // Ordenar oficinas por numero_oficina descendente y marcar las últimas
          const oficinasOrdenadas = [...oficinasExistentes].sort((a, b) =>
            (b.numero_oficina || b.registro_cab_id) - (a.numero_oficina || a.registro_cab_id)
          );

          for (let i = 0; i < oficinasAEliminarAuto; i++) {
            const oficinaAMarcar = oficinasOrdenadas[i];
            if (oficinaAMarcar && !this.estaParaEliminar(oficinaAMarcar.registro_cab_id)) {
              // Marcar automáticamente para eliminar
              if (!this.formData.oficinasParaEliminar) {
                this.formData.oficinasParaEliminar = [];
              }
              this.formData.oficinasParaEliminar.push(oficinaAMarcar.registro_cab_id);
              console.log(`  🗑️ Auto-marcada para eliminar: ${oficinaAMarcar.nombre} (ID: ${oficinaAMarcar.registro_cab_id})`);
            }
          }
        }

        // ✅ Si subió el número (o volvió al original), desmarcar oficinas de este piso
        if (cantidadConfigurada >= cantidadExistentes && this.formData.oficinasParaEliminar?.length > 0) {
          // Desmarcar oficinas de este piso que estaban marcadas
          const idsDeEstePiso = oficinasExistentes.map(o => o.registro_cab_id);
          const marcadasDeEstePiso = this.formData.oficinasParaEliminar.filter(id => idsDeEstePiso.includes(id));

          if (marcadasDeEstePiso.length > 0) {
            // Desmarcar todas las de este piso (ya que subió al número original o más)
            marcadasDeEstePiso.forEach(id => {
              const index = this.formData.oficinasParaEliminar.indexOf(id);
              if (index > -1) {
                this.formData.oficinasParaEliminar.splice(index, 1);
                console.log(`  ✅ Auto-desmarcada: ID ${id}`);
              }
            });
          }
        }

        console.log(`  Piso ${piso}: ${cantidadExistentes} existentes, ${oficinasNuevas} nuevas, ${oficinasAEliminarAuto} a eliminar (config: ${cantidadConfigurada})`);

        html += `
          <div style="display: flex; align-items: center; gap: var(--spacing-sm);">
            <div style="min-width: 60px; font-weight: 600; color: var(--azul-corporativo); font-size: 0.85rem;">
              Piso ${piso}
            </div>

            <!-- INPUT para cambiar cantidad de oficinas por piso -->
            <input
              type="number"
              id="oficinas-piso-${piso}"
              class="oficinas-por-piso-input"
              data-piso="${piso}"
              min="0"
              max="20"
              value="${cantidadConfigurada}"
              style="
                width: 50px;
                padding: 4px 6px;
                text-align: center;
                border: 2px solid var(--azul-claro);
                border-radius: 4px;
                font-weight: 600;
                font-size: 0.85rem;
                color: var(--azul-corporativo);
              "
              title="Total: ${cantidadConfigurada} | Existentes: ${cantidadExistentes} | Nuevas: ${oficinasNuevas}"
            />

            <div id="oficinas-contenedor-piso-${piso}" style="display: flex; gap: 4px; flex: 1; flex-wrap: wrap;">
        `;

        // 1️⃣ Renderizar oficinas EXISTENTES (de BD)
        oficinasExistentes.forEach(oficina => {
          let numeroOficina = oficina.numero_oficina;
          if (!numeroOficina && oficina.nombre) {
            const match = oficina.nombre.match(/(\d+)/);
            numeroOficina = match ? parseInt(match[1]) : oficina.registro_cab_id;
          }

          // 🗑️ Verificar si está marcada para eliminar (por bajar el input)
          const paraEliminar = this.estaParaEliminar(oficina.registro_cab_id);

          const displayName = oficina.nombre || `Oficina ${numeroOficina}`;
          const shortName = displayName.replace('Oficina ', 'Of. ');

          // Determinar color según estado
          // Rojo = para eliminar, Azul = normal (click lo pone dorado)
          let bgColor, borderStyle, iconPrefix, extraClass;
          if (paraEliminar) {
            bgColor = 'linear-gradient(135deg, #ef4444 0%, #dc2626 100%)'; // Rojo
            borderStyle = '2px dashed white';
            iconPrefix = '🗑️ ';
            extraClass = 'para-eliminar';
          } else {
            bgColor = 'linear-gradient(135deg, var(--azul-corporativo) 0%, var(--azul-claro) 100%)'; // Azul
            borderStyle = '2px solid white';
            iconPrefix = '';
            extraClass = '';
          }

          html += `
            <div
              class="oficina-seleccionable oficina-existente ${extraClass}"
              data-oficina-id="${numeroOficina}"
              data-registro-cab-id="${oficina.registro_cab_id}"
              data-metraje="${oficina.area || 50}"
              data-piso="${piso}"
              data-existente="true"
              style="
                min-width: 70px;
                flex: 1;
                max-width: 120px;
                height: 45px;
                background: ${bgColor};
                border: ${borderStyle};
                border-radius: 6px;
                display: flex;
                align-items: center;
                justify-content: center;
                color: white;
                font-weight: 600;
                font-size: 0.75rem;
                box-shadow: 0 2px 6px rgba(44, 82, 130, 0.3);
                cursor: pointer;
                transition: all 0.2s;
                ${paraEliminar ? 'opacity: 0.8; text-decoration: line-through;' : ''}
              "
              title="${paraEliminar ? '🗑️ MARCADA PARA ELIMINAR' : `${displayName} - ${oficina.area || 50}m² - Click para seleccionar`}"
            >
              ${iconPrefix}${shortName}
            </div>
          `;
        });

        // 2️⃣ Renderizar oficinas NUEVAS (a crear)
        // Usar formato: edificioId-pisoNumero (ej: 189-401, 189-402)
        const edificioId = this.propId || 0;
        for (let i = 1; i <= oficinasNuevas; i++) {
          const nuevoNumero = (piso * 100) + cantidadExistentes + i;
          const nombreOficina = edificioId ? `${edificioId}-${nuevoNumero}` : `+${nuevoNumero}`;

          html += `
            <div
              class="oficina-seleccionable oficina-nueva"
              data-oficina-id="${nuevoNumero}"
              data-piso="${piso}"
              data-metraje="50"
              data-existente="false"
              data-nombre="${nombreOficina}"
              style="
                min-width: 70px;
                flex: 1;
                max-width: 120px;
                height: 45px;
                background: linear-gradient(135deg, #10b981 0%, #059669 100%);
                border: 2px dashed white;
                border-radius: 6px;
                display: flex;
                align-items: center;
                justify-content: center;
                color: white;
                font-weight: 600;
                font-size: 0.75rem;
                box-shadow: 0 2px 6px rgba(16, 185, 129, 0.3);
                cursor: pointer;
                transition: all 0.2s;
              "
              title="Nueva oficina ${nombreOficina} - Click para seleccionar"
            >
              +${nuevoNumero}
            </div>
          `;
        }

        // 3️⃣ Placeholder si no hay ninguna oficina
        if (cantidadConfigurada === 0) {
          html += `
            <div style="
              flex: 1;
              height: 45px;
              background: #f1f5f9;
              border: 2px dashed #cbd5e1;
              border-radius: 6px;
              display: flex;
              align-items: center;
              justify-content: center;
              color: #94a3b8;
              font-size: 0.8rem;
            ">
              Sin oficinas - Usa el input para agregar
            </div>
          `;
        }

        html += '</div></div>';
      }

    } else {
      // 🆕 MODO CREACIÓN: Comportamiento original (oficinas teóricas)
      console.log('📊 MODO CREACIÓN - Usando oficinas TEÓRICAS');

      // Pisos (de arriba hacia abajo) - CLICKEABLES
      for (let piso = parseInt(pisos); piso >= 1; piso--) {
        // Obtener cantidad de oficinas para este piso (por defecto usa oficinasPorPiso)
        const oficinasEnEstePiso = this.getOficinasEnPiso(piso, parseInt(oficinasPorPiso));

        html += `
          <div style="display: flex; align-items: center; gap: var(--spacing-sm);">
            <div style="min-width: 60px; font-weight: 600; color: var(--azul-corporativo); font-size: 0.85rem;">
              Piso ${piso}
            </div>

            <!-- INPUT para cambiar cantidad de oficinas por piso -->
            <input
              type="number"
              id="oficinas-piso-${piso}"
              class="oficinas-por-piso-input"
              data-piso="${piso}"
              min="1"
              max="10"
              value="${oficinasEnEstePiso}"
              style="
                width: 50px;
                padding: 4px 6px;
                text-align: center;
                border: 2px solid var(--azul-claro);
                border-radius: 4px;
                font-weight: 600;
                font-size: 0.85rem;
                color: var(--azul-corporativo);
              "
              title="Cantidad de oficinas en este piso"
            />

            <div id="oficinas-contenedor-piso-${piso}" style="display: flex; gap: 4px; flex: 1;">
        `;

        for (let ofi = 1; ofi <= oficinasEnEstePiso; ofi++) {
          const oficinaNum = (piso * 100) + ofi; // Fórmula consecutiva por piso: piso 9 = 901, 902, 903

          // VERIFICAR SI ESTA OFICINA YA EXISTE (modo edición)
          const oficinaExistente = this.formData.oficinasSeleccionadas?.find(
            o => parseInt(o.numero_oficina) === parseInt(oficinaNum)
          );
          const estaSeleccionada = !!oficinaExistente;

          if (estaSeleccionada) {
            console.log(`  ✅ Oficina ${oficinaNum} encontrada en seleccionadas:`, oficinaExistente);
          }

          html += `
            <div
              class="oficina-seleccionable ${estaSeleccionada ? 'selected' : ''}"
              data-oficina-id="${oficinaNum}"
              data-metraje="${oficinaExistente?.area || 50}"
              data-registro-cab-id="${oficinaExistente?.registro_cab_id || ''}"
              style="
                flex: 1;
                height: 45px;
                background: ${estaSeleccionada
                  ? 'linear-gradient(135deg, var(--dorado) 0%, var(--dorado-hover) 100%)'
                  : 'linear-gradient(135deg, var(--azul-corporativo) 0%, var(--azul-claro) 100%)'
                };
                border: 2px solid white;
                border-radius: 6px;
                display: flex;
                align-items: center;
                justify-content: center;
                color: white;
                font-weight: 600;
                font-size: 0.9rem;
                box-shadow: 0 2px 6px rgba(44, 82, 130, 0.3);
                cursor: pointer;
                transition: all 0.2s;
                ${estaSeleccionada ? 'transform: scale(1.05);' : ''}
              "
              title="${estaSeleccionada
                ? `Oficina ${oficinaNum} - ${oficinaExistente?.area || 50}m² - Estado: ${oficinaExistente?.estado || 'borrador'}`
                : `Seleccionar Oficina ${oficinaNum}`
              }"
              onclick="
                this.classList.toggle('selected');
                if (this.classList.contains('selected')) {
                  this.style.background = 'linear-gradient(135deg, var(--dorado) 0%, var(--dorado-hover) 100%)';
                  this.style.transform = 'scale(1.05)';
                } else {
                  this.style.background = 'linear-gradient(135deg, var(--azul-corporativo) 0%, var(--azul-claro) 100%)';
                  this.style.transform = 'scale(1)';
                }
              "
              title="Oficina ${oficinaNum} - Click para seleccionar"
            >
              ${oficinaNum}
            </div>
          `;
        }

        html += '</div></div>';
      }
    }

    // Sótanos con INPUT DE PARQUEOS DENTRO
    if (sotanos > 0) {
      html += '<div style="margin: var(--spacing-sm) 0; border-top: 2px dashed #dee2e6;"></div>';

      for (let sotano = 1; sotano <= parseInt(sotanos); sotano++) {
        html += `
          <div style="display: flex; align-items: center; gap: var(--spacing-sm);">
            <div style="min-width: 60px; font-weight: 600; color: var(--dorado); font-size: 0.85rem;">
              Sótano ${sotano}
            </div>
            <div style="
              flex: 1;
              background: linear-gradient(135deg, var(--dorado) 0%, var(--dorado-hover) 100%);
              color: white;
              padding: 10px 16px;
              border-radius: 8px;
              display: flex;
              align-items: center;
              justify-content: space-between;
              box-shadow: 0 2px 6px rgba(245, 166, 35, 0.3);
            ">
              <div style="display: flex; align-items: center; gap: 8px;">
                <i class="fas fa-car"></i>
                <span style="font-weight: 600; font-size: 0.9rem;">Parqueos:</span>
              </div>
              <input
                type="number"
                id="sotano-${sotano}-parqueos"
                data-sotano="${sotano}"
                placeholder="20"
                min="0"
                value="10"
                style="
                  width: 70px;
                  padding: 6px 10px;
                  font-size: 0.9rem;
                  text-align: center;
                  border: 2px solid white;
                  background: rgba(255, 255, 255, 0.95);
                  color: var(--dorado);
                  font-weight: 600;
                  border-radius: 6px;
                "
              />
            </div>
          </div>
        `;
      }
    }

    html += '</div>';

    return html;
  }

  /**
   * 🏗️ Renderizar visualización de torre con colores corporativos
   */
  renderTorreVisualizacion(pisos, oficinasPorPiso, sotanos) {
    let html = '<div style="display: flex; flex-direction: column; gap: 8px;">';

    // Pisos (de arriba hacia abajo)
    for (let piso = parseInt(pisos); piso >= 1; piso--) {
      html += `
        <div style="display: flex; align-items: center; gap: var(--spacing-md); animation: fadeInUp 0.3s ease-out; animation-delay: ${(parseInt(pisos) - piso) * 0.05}s; opacity: 0; animation-fill-mode: forwards;">
          <div style="min-width: 70px; font-weight: 600; color: var(--azul-corporativo); font-size: 0.9rem;">
            Piso ${piso}
          </div>
          <div style="display: flex; gap: 6px; flex-wrap: wrap;">
      `;

      for (let ofi = 1; ofi <= parseInt(oficinasPorPiso); ofi++) {
        const oficinaNum = (piso * 100) + ofi; // 🆕 Fórmula consecutiva por piso: piso 9 = 901, 902, 903
        html += `
          <div
            style="
              width: 50px;
              height: 40px;
              background: linear-gradient(135deg, var(--azul-corporativo) 0%, var(--azul-claro) 100%);
              border: 2px solid white;
              border-radius: 6px;
              display: flex;
              align-items: center;
              justify-content: center;
              color: white;
              font-weight: 600;
              font-size: 0.85rem;
              box-shadow: 0 2px 6px rgba(44, 82, 130, 0.3);
              transition: transform 0.2s ease;
            "
            title="Oficina ${oficinaNum}"
            onmouseover="this.style.transform='translateY(-2px) scale(1.05)'"
            onmouseout="this.style.transform='translateY(0) scale(1)'"
          >
            ${oficinaNum}
          </div>
        `;
      }

      html += '</div></div>';
    }

    // Sótanos
    if (sotanos > 0) {
      html += '<div style="margin: var(--spacing-md) 0; border-top: 2px dashed #dee2e6;"></div>';

      for (let sotano = 1; sotano <= parseInt(sotanos); sotano++) {
        html += `
          <div style="display: flex; align-items: center; gap: var(--spacing-md);">
            <div style="min-width: 70px; font-weight: 600; color: var(--dorado); font-size: 0.9rem;">
              Sótano ${sotano}
            </div>
            <div style="flex: 1; background: linear-gradient(135deg, var(--dorado) 0%, var(--dorado-hover) 100%); color: white; padding: 12px 20px; border-radius: 8px; display: flex; align-items: center; gap: 10px; box-shadow: 0 2px 6px rgba(245, 166, 35, 0.3);">
              <i class="fas fa-car"></i>
              <span style="font-weight: 600;">Parqueos</span>
            </div>
          </div>
        `;
      }
    }

    html += '</div>';

    // Agregar keyframe para animación
    html += `
      <style>
        @keyframes fadeInUp {
          from {
            opacity: 0;
            transform: translateY(10px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
      </style>
    `;

    return html;
  }

  /**
   * 📐 Renderizar inputs de metraje individual
   */
  renderMetrajeIndividual(pisos, oficinasPorPiso) {
    let html = '<div style="display: grid; gap: var(--spacing-sm);">';

    let oficinaGlobal = 1;
    for (let piso = 1; piso <= parseInt(pisos); piso++) {
      html += `
        <div style="background: white; padding: var(--spacing-md); border-radius: 8px; border: 1px solid #e5e7eb;">
          <h5 style="color: var(--azul-corporativo); margin-bottom: var(--spacing-sm); font-size: 0.95rem;">
            Piso ${piso}
          </h5>
          <div style="display: grid; grid-template-columns: repeat(auto-fill, minmax(200px, 1fr)); gap: var(--spacing-sm);">
      `;

      for (let ofi = 1; ofi <= parseInt(oficinasPorPiso); ofi++) {
        const oficinaNum = (piso * 100) + ofi; // 🆕 Fórmula consecutiva por piso: piso 9 = 901, 902, 903
        html += `
          <div class="form-group" style="margin: 0;">
            <label class="form-label" style="font-size: 0.85rem; margin-bottom: 4px;">
              Oficina ${oficinaNum}
            </label>
            <input
              type="number"
              class="form-input metraje-individual-input"
              data-piso="${piso}"
              data-oficina="${ofi}"
              data-global="${oficinaNum}"
              placeholder="m²"
              step="0.01"
              min="1"
              value="50"
            />
          </div>
        `;
        oficinaGlobal++;
      }

      html += '</div></div>';
    }

    html += '</div>';
    return html;
  }

  /**
   * 🅿️ Renderizar configuración de sótanos
   */
  renderSotanosConfig(sotanos) {
    let html = '<div style="display: grid; gap: var(--spacing-md);">';

    for (let sotano = 1; sotano <= parseInt(sotanos); sotano++) {
      html += `
        <div style="background: rgba(255, 255, 255, 0.15); padding: var(--spacing-md); border-radius: 8px; border: 1px solid rgba(255, 255, 255, 0.3);">
          <div class="form-group" style="margin: 0;">
            <label class="form-label" style="color: white; font-size: 0.9rem; margin-bottom: 8px;">
              Sótano ${sotano} - Cantidad de Parqueos
            </label>
            <input
              type="number"
              class="form-input"
              id="sotano-${sotano}-parqueos"
              data-sotano="${sotano}"
              placeholder="Ej: 20"
              min="0"
              value="10"
              style="padding: 10px; font-size: 0.95rem;"
            />
          </div>
        </div>
      `;
    }

    html += '</div>';
    return html;
  }

  /**
   * 📐 NUEVO: Renderizar metraje individual COMPACTO (versión optimizada)
   * Con selección múltiple y aplicación en lote
   */
  renderMetrajeIndividualCompacto(pisos, oficinasPorPiso) {
    let html = `
      <div style="background: white; border-radius: 8px; padding: var(--spacing-md); border: 1px solid #e5e7eb;">
        <h5 style="color: var(--azul-corporativo); margin-bottom: var(--spacing-sm); font-size: 0.95rem; display: flex; align-items: center; gap: 8px;">
          <i class="fas fa-ruler"></i>
          Configurar Metraje por Oficina
        </h5>

        <!-- Control superior: Input + Botón aplicar -->
        <div style="display: flex; gap: var(--spacing-sm); margin-bottom: var(--spacing-md); padding: var(--spacing-sm); background: #f0f9ff; border-radius: 6px;">
          <input
            type="number"
            id="metraje-batch-input"
            class="form-input"
            placeholder="Área (m²)"
            step="0.01"
            min="1"
            value="50"
            style="flex: 1; padding: 8px; font-size: 0.9rem;"
          />
          <button
            type="button"
            id="btn-aplicar-metraje"
            class="btn-primary"
            style="padding: 8px 16px; font-size: 0.9rem; white-space: nowrap;"
          >
            <i class="fas fa-check"></i> Aplicar
          </button>
        </div>

        <p style="font-size: 0.85rem; color: var(--gris-medio); margin-bottom: var(--spacing-md);">
          💡 Selecciona una o más oficinas y haz click en "Aplicar" para asignarles el mismo metraje
        </p>

        <!-- Lista de oficinas seleccionables -->
        <div style="display: grid; gap: 6px; max-height: 300px; overflow-y: auto;">
    `;

    let oficinaGlobal = 1;
    for (let piso = parseInt(pisos); piso >= 1; piso--) {
      for (let ofi = 1; ofi <= parseInt(oficinasPorPiso); ofi++) {
        const oficinaNum = (piso * 100) + ofi; // 🆕 Fórmula consecutiva por piso: piso 9 = 901, 902, 903

        html += `
          <div
            class="oficina-metraje-item"
            data-oficina-id="${oficinaNum}"
            data-piso="${piso}"
            data-numero="${ofi}"
            style="
              display: flex;
              align-items: center;
              justify-content: space-between;
              padding: 8px 12px;
              border: 2px solid #e5e7eb;
              border-radius: 6px;
              cursor: pointer;
              transition: all 0.2s;
              background: white;
            "
            onclick="this.classList.toggle('selected'); this.style.background = this.classList.contains('selected') ? '#dbeafe' : 'white'; this.style.borderColor = this.classList.contains('selected') ? 'var(--azul-corporativo)' : '#e5e7eb';"
          >
            <div style="display: flex; align-items: center; gap: 10px;">
              <div style="
                width: 32px;
                height: 32px;
                background: linear-gradient(135deg, var(--azul-corporativo), var(--azul-claro));
                color: white;
                border-radius: 6px;
                display: flex;
                align-items: center;
                justify-content: center;
                font-weight: 600;
                font-size: 0.85rem;
              ">
                ${oficinaNum}
              </div>
              <div>
                <div style="font-weight: 600; font-size: 0.9rem; color: #1f2937;">
                  Oficina ${oficinaNum}
                </div>
                <div style="font-size: 0.8rem; color: var(--gris-medio);">
                  Piso ${piso} - Of. ${ofi}
                </div>
              </div>
            </div>
            <div>
              <input
                type="number"
                class="metraje-individual-input"
                data-oficina-id="${oficinaNum}"
                placeholder="m²"
                step="0.01"
                min="1"
                value="50"
                style="width: 80px; padding: 6px 8px; font-size: 0.85rem; text-align: right; border: 1px solid #d1d5db; border-radius: 4px;"
                onclick="event.stopPropagation();"
              />
            </div>
          </div>
        `;

        oficinaGlobal++;
      }
    }

    html += `
        </div>
      </div>

      <script>
        // Event listener para aplicar metraje en lote
        document.getElementById('btn-aplicar-metraje')?.addEventListener('click', () => {
          const metrajeValue = document.getElementById('metraje-batch-input')?.value;

          if (!metrajeValue || parseFloat(metrajeValue) <= 0) {
            showNotification('⚠️ Ingresa un área válida', 'warning');
            return;
          }

          const selectedItems = document.querySelectorAll('.oficina-metraje-item.selected');

          if (selectedItems.length === 0) {
            showNotification('⚠️ Selecciona al menos una oficina', 'warning');
            return;
          }

          // Aplicar el valor a todas las oficinas seleccionadas
          selectedItems.forEach(item => {
            const oficinaId = item.dataset.oficinaId;
            const input = item.querySelector(\`.metraje-individual-input[data-oficina-id="\${oficinaId}"]\`);
            if (input) {
              input.value = metrajeValue;
            }
          });

          showNotification(\`✅ Metraje aplicado a \${selectedItems.length} oficina(s)\`, 'success');

          // Deseleccionar todas
          selectedItems.forEach(item => {
            item.classList.remove('selected');
            item.style.background = 'white';
            item.style.borderColor = '#e5e7eb';
          });
        });
      </script>
    `;

    return html;
  }

  /**
   * 🛠️ NUEVO: Mostrar modal de equipamiento crosstab
   * @param {Array} oficinasSeleccionadas - Array con IDs de oficinas seleccionadas
   */
  mostrarModalEquipamiento(oficinasSeleccionadas) {
    console.log('🛠️ Abriendo modal de equipamiento...');
    console.log('📊 Oficinas seleccionadas:', oficinasSeleccionadas);
    
    // ✅ Equipamientos con IDs CORRECTOS (122-130)
    const equipamientos = [
      { id: 122, nombre: 'Falsos techos' },
      { id: 123, nombre: 'Luminarias' },
      { id: 124, nombre: 'AAC' },
      { id: 125, nombre: 'Piso Laminado' },
      { id: 126, nombre: 'Pintura' },
      { id: 127, nombre: 'Muebles de Cocina' },
      { id: 128, nombre: 'Mobiliario' },
      { id: 129, nombre: 'Cableado estructurado' },
      { id: 130, nombre: 'Rollers' }
    ];

    // 🆕 Obtener datos de oficinas existentes con sus equipamientos
    const oficinasConDatos = oficinasSeleccionadas.map(numOficina => {
      const oficinaExistente = this.formData.oficinasSeleccionadas?.find(
        o => o.numero_oficina == numOficina
      );
      
      return {
        numero: numOficina,
        registro_cab_id: oficinaExistente?.registro_cab_id || null,
        caracteristicas: oficinaExistente?.caracteristicas || []
      };
    });
    
    console.log('📋 Oficinas con datos:', oficinasConDatos);

    // Usar las oficinas seleccionadas
    const oficinas = oficinasSeleccionadas;

    // Crear HTML del modal
    let html = `
      <div id="modal-equipamiento" style="
        position: fixed;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        background: rgba(0, 0, 0, 0.7);
        display: flex;
        align-items: center;
        justify-content: center;
        z-index: 9999;
      ">
        <div style="
          background: white;
          border-radius: 12px;
          width: 90%;
          max-width: 1200px;
          max-height: 90vh;
          overflow: hidden;
          box-shadow: 0 10px 40px rgba(0, 0, 0, 0.3);
        ">
          <!-- Header -->
          <div style="
            background: linear-gradient(135deg, var(--azul-corporativo), var(--azul-claro));
            color: white;
            padding: 12px var(--spacing-md);
            display: flex;
            justify-content: space-between;
            align-items: center;
          ">
            <h3 style="margin: 0; font-size: 1.1rem; font-weight: 600; color: white;">
              <i class="fas fa-cog"></i> Equipamiento de Oficinas
            </h3>
            <button
              id="btn-cerrar-equipamiento"
              style="
                background: transparent;
                border: none;
                color: white;
                font-size: 1.5rem;
                cursor: pointer;
                padding: 0;
                width: 32px;
                height: 32px;
              "
            >
              <i class="fas fa-times"></i>
            </button>
          </div>

          <!-- Body con scroll -->
          <div style="
            padding: var(--spacing-md);
            overflow-x: auto;
            overflow-y: auto;
            max-height: calc(90vh - 140px);
          ">
            <p style="color: var(--gris-medio); margin-bottom: var(--spacing-md); font-size: 0.9rem;">
              📦 Configurando equipamiento para <strong>${oficinas.length} oficina(s) seleccionada(s)</strong>
            </p>
            <p style="color: var(--gris-medio); margin-bottom: var(--spacing-md); font-size: 0.85rem;">
              Marca los equipamientos que incluye cada oficina:
            </p>

            <!-- Tabla Crosstab -->
            <table style="
              width: 100%;
              border-collapse: collapse;
              font-size: 0.85rem;
            ">
              <thead>
                <tr style="background: #f8f9fa;">
                  <th style="
                    padding: 12px;
                    text-align: left;
                    border: 1px solid #dee2e6;
                    font-weight: 600;
                    position: sticky;
                    left: 0;
                    background: #f8f9fa;
                    z-index: 10;
                  ">
                    EQUIPAMIENTO
                  </th>
                  ${oficinas.map(ofi => `
                    <th style="
                      padding: 8px 4px;
                      text-align: center;
                      border: 1px solid #dee2e6;
                      font-weight: 600;
                      min-width: 50px;
                      background: linear-gradient(135deg, var(--azul-corporativo), var(--azul-claro));
                      color: white;
                      font-size: 0.8rem;
                    ">
                      ${ofi}
                    </th>
                  `).join('')}
                </tr>
              </thead>
              <tbody>
                ${equipamientos.map((equip, idx) => `
                  <tr style="background: ${idx % 2 === 0 ? '#fff' : '#f0f4f8'};">
                    <td style="
                      padding: 8px 12px;
                      border: 1px solid #dee2e6;
                      font-weight: 500;
                      position: sticky;
                      left: 0;
                      background: ${idx % 2 === 0 ? '#fff' : '#f0f4f8'};
                      z-index: 9;
                      font-size: 0.9rem;
                    ">
                      ${equip.nombre}
                    </td>
                    ${oficinas.map(ofi => {
                      // ✅ Verificar si esta oficina tiene este equipamiento
                      const oficinaData = oficinasConDatos.find(o => o.numero == ofi);
                      const tieneEquipamiento = oficinaData?.caracteristicas?.some(
                        c => c.caracteristica_id == equip.id && (c.valor === 'Sí' || c.valor === 'true' || c.valor === true)
                      ) || false;
                      
                      return `
                      <td style="
                        padding: 6px;
                        border: 1px solid #dee2e6;
                        text-align: center;
                      ">
                        <input
                          type="checkbox"
                          class="equip-check"
                          data-equipamiento-id="${equip.id}"
                          data-equipamiento-nombre="${equip.nombre}"
                          data-oficina="${ofi}"
                          ${tieneEquipamiento ? 'checked' : ''}
                          style="
                            width: 18px;
                            height: 18px;
                            cursor: pointer;
                          "
                        />
                      </td>
                      `;
                    }).join('')}
                  </tr>
                `).join('')}
              </tbody>
            </table>
          </div>

          <!-- Footer -->
          <div style="
            background: #f8f9fa;
            padding: var(--spacing-md);
            display: flex;
            justify-content: flex-end;
            gap: var(--spacing-sm);
            border-top: 1px solid #dee2e6;
          ">
            <button
              id="btn-cancelar-equipamiento"
              class="btn-secondary"
              style="padding: 10px 20px;"
            >
              Cancelar
            </button>
            <button
              id="btn-guardar-equipamiento"
              class="btn-primary"
              style="padding: 10px 20px;"
            >
              <i class="fas fa-save"></i> Guardar
            </button>
          </div>
        </div>
      </div>
    `;

    // Insertar modal en el body
    document.body.insertAdjacentHTML('beforeend', html);

    // Event listeners
    document.getElementById('btn-cerrar-equipamiento').onclick = () => {
      document.getElementById('modal-equipamiento').remove();
    };

    document.getElementById('btn-cancelar-equipamiento').onclick = () => {
      document.getElementById('modal-equipamiento').remove();
    };

    document.getElementById('btn-guardar-equipamiento').onclick = () => {
      // Recopilar datos
      const checkboxes = document.querySelectorAll('.equip-check:checked');
      const equipamientoData = {};

      checkboxes.forEach(cb => {
        const equipNombre = cb.dataset.equipamientoNombre; // ✅ Usar nombre del equipamiento
        const oficina = cb.dataset.oficina;

        if (!equipamientoData[equipNombre]) {
          equipamientoData[equipNombre] = [];
        }
        equipamientoData[equipNombre].push(oficina);
      });

      console.log('📦 Equipamiento configurado:', equipamientoData);

      // Guardar en formData
      this.formData.equipamiento = equipamientoData;

      showNotification('✅ Equipamiento guardado', 'success');
      document.getElementById('modal-equipamiento').remove();
    };
  }

  /**
   * 📐 NUEVO: Mostrar modal de metraje para oficinas seleccionadas
   * @param {Array} oficinasData - Array con datos de oficinas seleccionadas
   */
  mostrarModalMetraje(oficinasData) {
    console.log('📐 Abriendo modal de metraje...');
    console.log('📊 Oficinas seleccionadas:', oficinasData);

    // Crear HTML del modal
    let html = `
      <div id="modal-metraje" style="
        position: fixed;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        background: rgba(0, 0, 0, 0.7);
        display: flex;
        align-items: center;
        justify-content: center;
        z-index: 9999;
      ">
        <div style="
          background: white;
          border-radius: 12px;
          width: 90%;
          max-width: 600px;
          max-height: 90vh;
          overflow: hidden;
          box-shadow: 0 10px 40px rgba(0, 0, 0, 0.3);
        ">
          <!-- Header -->
          <div style="
            background: linear-gradient(135deg, var(--azul-corporativo), var(--azul-claro));
            color: white;
            padding: 12px var(--spacing-md);
            display: flex;
            justify-content: space-between;
            align-items: center;
          ">
            <h3 style="margin: 0; font-size: 1.1rem; font-weight: 600; color: white;">
              📐 Asignar Metraje
            </h3>
            <button
              id="btn-cerrar-metraje"
              style="
                background: transparent;
                border: none;
                color: white;
                font-size: 1.5rem;
                cursor: pointer;
                padding: 0;
                width: 32px;
                height: 32px;
              "
            >
              <i class="fas fa-times"></i>
            </button>
          </div>

          <!-- Body con scroll -->
          <div style="
            padding: var(--spacing-md);
            overflow-y: auto;
            max-height: calc(90vh - 180px);
          ">
            <p style="color: var(--gris-medio); margin-bottom: var(--spacing-md); font-size: 0.9rem;">
              Configurando metraje para <strong>${oficinasData.length} oficina(s) seleccionada(s)</strong>
            </p>

            <!-- Aplicar a todas -->
            <div style="background: #f0f9ff; padding: 12px; border-radius: 8px; margin-bottom: var(--spacing-md); border: 1px solid #0ea5e9;">
              <label style="font-size: 0.85rem; font-weight: 600; color: var(--azul-corporativo); display: block; margin-bottom: 6px;">
                Aplicar mismo metraje a todas:
              </label>
              <div style="display: flex; gap: 8px;">
                <input
                  type="number"
                  id="metraje-todas-input"
                  class="form-input"
                  placeholder="50"
                  step="0.01"
                  min="1"
                  value="50"
                  style="flex: 1; padding: 8px; font-size: 0.9rem; text-align: center;"
                />
                <button
                  type="button"
                  id="btn-aplicar-todas"
                  class="btn-primary"
                  style="padding: 8px 16px; font-size: 0.85rem; white-space: nowrap;"
                >
                  Aplicar a todas
                </button>
              </div>
            </div>

            <!-- Lista de oficinas con inputs individuales -->
            <div style="display: flex; flex-direction: column; gap: 8px;">
              ${oficinasData.map(ofi => `
                <div style="
                  display: flex;
                  align-items: center;
                  justify-content: space-between;
                  padding: 10px 12px;
                  background: ${ofi.esNueva ? '#ecfdf5' : '#f8fafc'};
                  border: 1px solid ${ofi.esNueva ? '#10b981' : '#e2e8f0'};
                  border-radius: 6px;
                ">
                  <div style="display: flex; align-items: center; gap: 8px;">
                    <span style="
                      width: 24px;
                      height: 24px;
                      background: ${ofi.esNueva ? 'linear-gradient(135deg, #10b981 0%, #059669 100%)' : 'linear-gradient(135deg, var(--azul-corporativo) 0%, var(--azul-claro) 100%)'};
                      border-radius: 4px;
                      display: flex;
                      align-items: center;
                      justify-content: center;
                      color: white;
                      font-size: 0.7rem;
                      font-weight: 600;
                    ">${ofi.esNueva ? '+' : ''}</span>
                    <span style="font-weight: 600; color: var(--azul-corporativo);">
                      Oficina ${ofi.id}
                    </span>
                    <span style="font-size: 0.75rem; color: var(--gris-medio);">
                      (Piso ${ofi.piso})
                    </span>
                    ${ofi.esNueva ? '<span style="font-size: 0.7rem; background: #10b981; color: white; padding: 2px 6px; border-radius: 4px;">NUEVA</span>' : ''}
                  </div>
                  <div style="display: flex; align-items: center; gap: 6px;">
                    <input
                      type="number"
                      class="metraje-input-individual"
                      data-oficina-id="${ofi.id}"
                      data-registro-cab-id="${ofi.registroCabId || ''}"
                      data-piso="${ofi.piso}"
                      data-es-nueva="${ofi.esNueva}"
                      value="${ofi.metraje}"
                      step="0.01"
                      min="1"
                      style="width: 80px; padding: 6px; text-align: center; border: 1px solid #cbd5e1; border-radius: 4px; font-size: 0.9rem;"
                    />
                    <span style="font-size: 0.85rem; color: var(--gris-medio);">m²</span>
                  </div>
                </div>
              `).join('')}
            </div>
          </div>

          <!-- Footer -->
          <div style="
            background: #f8f9fa;
            padding: var(--spacing-md);
            display: flex;
            justify-content: flex-end;
            gap: var(--spacing-sm);
            border-top: 1px solid #dee2e6;
          ">
            <button
              id="btn-cancelar-metraje"
              class="btn-secondary"
              style="padding: 10px 20px;"
            >
              Cancelar
            </button>
            <button
              id="btn-guardar-metraje"
              class="btn-primary"
              style="padding: 10px 20px;"
            >
              <i class="fas fa-save"></i> Guardar
            </button>
          </div>
        </div>
      </div>
    `;

    // Insertar modal en el body
    document.body.insertAdjacentHTML('beforeend', html);

    // Event listeners
    document.getElementById('btn-cerrar-metraje').onclick = () => {
      document.getElementById('modal-metraje').remove();
    };

    document.getElementById('btn-cancelar-metraje').onclick = () => {
      document.getElementById('modal-metraje').remove();
    };

    // Aplicar a todas
    document.getElementById('btn-aplicar-todas').onclick = () => {
      const valorTodas = document.getElementById('metraje-todas-input').value;
      if (!valorTodas || parseFloat(valorTodas) <= 0) {
        showNotification('⚠️ Ingresa un valor válido', 'warning');
        return;
      }
      document.querySelectorAll('.metraje-input-individual').forEach(input => {
        input.value = valorTodas;
      });
      showNotification(`✅ Metraje ${valorTodas}m² aplicado a todas`, 'success');
    };

    // Guardar metraje
    document.getElementById('btn-guardar-metraje').onclick = () => {
      const inputs = document.querySelectorAll('.metraje-input-individual');
      let actualizados = 0;

      inputs.forEach(input => {
        const oficinaId = input.dataset.oficinaId;
        const metraje = input.value;
        const esNueva = input.dataset.esNueva === 'true';

        // Actualizar el data-metraje en la oficina de la torre
        const oficinaEl = document.querySelector(`.oficina-seleccionable[data-oficina-id="${oficinaId}"]`);
        if (oficinaEl) {
          oficinaEl.dataset.metraje = metraje;
          console.log(`📐 Oficina ${oficinaId}: metraje actualizado a ${metraje}m²`);
          actualizados++;
        }

        // Guardar en formData para oficinas nuevas
        if (esNueva) {
          if (!this.formData.oficinasNuevas) {
            this.formData.oficinasNuevas = [];
          }
          const existeIdx = this.formData.oficinasNuevas.findIndex(o => o.numero == oficinaId);
          if (existeIdx >= 0) {
            this.formData.oficinasNuevas[existeIdx].area = parseFloat(metraje);
          } else {
            this.formData.oficinasNuevas.push({
              numero: oficinaId,
              piso: input.dataset.piso,
              area: parseFloat(metraje)
            });
          }
        }
      });

      // Deseleccionar oficinas y restaurar colores
      document.querySelectorAll('.oficina-seleccionable.selected').forEach(oficina => {
        oficina.classList.remove('selected');
        const esNueva = oficina.classList.contains('oficina-nueva');
        if (esNueva) {
          oficina.style.background = 'linear-gradient(135deg, #10b981 0%, #059669 100%)';
        } else {
          oficina.style.background = 'linear-gradient(135deg, var(--azul-corporativo) 0%, var(--azul-claro) 100%)';
        }
        oficina.style.transform = 'scale(1)';
      });

      showNotification(`✅ Metraje guardado para ${actualizados} oficina(s)`, 'success');
      document.getElementById('modal-metraje').remove();
    };
  }

  /**
   * 🅿️ NUEVO: Renderizar sótanos COMPACTO
   * Input de parqueos DENTRO del rectángulo del sótano
   */
  renderSotanosConfigCompacto(sotanos) {
    if (!sotanos || parseInt(sotanos) === 0) {
      return '';
    }

    let html = `
      <div style="background: white; border-radius: 8px; padding: var(--spacing-md); border: 1px solid #e5e7eb; margin-top: var(--spacing-md);">
        <h5 style="color: var(--dorado); margin-bottom: var(--spacing-sm); font-size: 0.95rem; display: flex; align-items: center; gap: 8px;">
          <i class="fas fa-car"></i>
          Configurar Parqueos por Sótano
        </h5>

        <div style="display: grid; gap: 8px;">
    `;

    for (let sotano = 1; sotano <= parseInt(sotanos); sotano++) {
      html += `
        <div style="
          background: linear-gradient(135deg, var(--dorado) 0%, var(--dorado-hover) 100%);
          color: white;
          padding: 12px 16px;
          border-radius: 8px;
          box-shadow: 0 2px 6px rgba(245, 166, 35, 0.3);
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: var(--spacing-md);
        ">
          <div style="display: flex; align-items: center; gap: 10px; flex: 1;">
            <i class="fas fa-car" style="font-size: 1.2rem;"></i>
            <span style="font-weight: 600; font-size: 0.95rem;">Sótano ${sotano}</span>
          </div>

          <div style="display: flex; align-items: center; gap: 8px;">
            <label style="font-size: 0.85rem; white-space: nowrap;">
              Parqueos:
            </label>
            <input
              type="number"
              id="sotano-${sotano}-parqueos"
              class="form-input"
              data-sotano="${sotano}"
              placeholder="Ej: 20"
              min="0"
              value="10"
              style="
                width: 80px;
                padding: 6px 10px;
                font-size: 0.9rem;
                text-align: center;
                border: 2px solid white;
                background: rgba(255, 255, 255, 0.95);
                color: var(--dorado);
                font-weight: 600;
              "
            />
          </div>
        </div>
      `;
    }

    html += `
        </div>
      </div>
    `;

    return html;
  }

  /**
   * 🏢 Preparar datos para API de Edificio Completo
   * Formatea los datos según la estructura esperada por el backend
   */
  prepareEdificioCompletoData() {
    console.log('🏗️ Preparando datos para Edificio Completo...');
    
    // ✅ VALIDACIÓN PREVIA
    if (!this.formData.edificioConfig) {
      console.error('❌ No existe edificioConfig');
      throw new Error('No se ha configurado el edificio');
    }
    
    if (!this.formData.edificioConfig.oficinas || this.formData.edificioConfig.oficinas.length === 0) {
      console.error('❌ No hay oficinas configuradas');
      throw new Error('No se han configurado oficinas');
    }
    
    // Validar y truncar campos de texto según límites de BD
    const truncateString = (str, maxLength) => {
      if (!str) return str;
      return str.length > maxLength ? str.substring(0, maxLength) : str;
    };
    
    // Validar rango numérico
    const validateNumeric = (value, min, max) => {
      if (value === null || value === undefined) return null;
      const num = parseFloat(value);
      if (isNaN(num)) return null;
      return Math.max(min, Math.min(max, num));
    };
    
    // ✅ Datos del propietario (PASO 1)
    const propietarioData = {
      dni: this.formData.propietario_real_dni || '',
      nombre: this.formData.propietario_real_nombre || '',
      telefono: this.formData.propietario_real_telefono || '',
      email: this.formData.propietario_real_email || ''
    };
    
    console.log('👤 Datos del propietario a enviar:', propietarioData);
    
    // Datos del edificio principal
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('🔍 PREPARANDO EDIFICIO - PROPIETARIO_ID:');
    console.log('  this.formData.propietario_id:', this.formData.propietario_id);
    console.log('  parseInt(this.formData.propietario_id):', parseInt(this.formData.propietario_id));
    console.log('  Resultado final:', parseInt(this.formData.propietario_id) || null);
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    
    const edificio = {
      propietario_id: parseInt(this.formData.propietario_id) || null,
      propietario_dni: propietarioData.dni,
      propietario_nombre: propietarioData.nombre,
      propietario_telefono: propietarioData.telefono,
      propietario_email: propietarioData.email,
      tipo_inmueble_id: parseInt(this.formData.tipo_inmueble_id),
      distrito_id: parseInt(this.formData.distrito_id),
      nombre_inmueble: truncateString(this.formData.nombre_inmueble || this.formData.titulo, 200),
      direccion: truncateString(this.formData.direccion, 300),
      // Latitud: NUMERIC(10,8) = -99.99999999 a 99.99999999
      latitud: this.formData.latitud ? validateNumeric(this.formData.latitud, -90, 90) : null,
      // Longitud: NUMERIC(11,8) = -999.99999999 a 999.99999999
      longitud: this.formData.longitud ? validateNumeric(this.formData.longitud, -180, 180) : null,
      // Area: NUMERIC(10,2) = 0 a 99999999.99
      area: validateNumeric(this.formData.area, 0, 99999999.99) || 0,
      antiguedad: this.formData.antiguedad ? parseInt(this.formData.antiguedad) : null,
      implementacion: this.formData.implementacion ? parseInt(this.formData.implementacion) : null,
      transaccion: this.formData.tipo_operacion || 'venta',
      // Precios: NUMERIC(12,2) y NUMERIC(10,2)
      precio_venta: this.formData.precio_venta ? validateNumeric(this.formData.precio_venta, 0, 9999999999.99) : null,
      precio_alquiler: this.formData.precio_alquiler ? validateNumeric(this.formData.precio_alquiler, 0, 99999999.99) : null,
      moneda: this.formData.moneda || 'PEN',
      titulo: truncateString(this.formData.titulo, 200),
      descripcion: this.formData.descripcion,
      caracteristicas: this.formData.caracteristicas || []
    };
    
    // 🛠️ Mapeo de equipamiento a caracteristica_id (categoría 19)
    const equipamientoMap = {
      'Falsos techos': 122,
      'Luminarias': 123,
      'AAC': 124,
      'Piso Laminado': 125,
      'Pintura': 126,
      'Muebles de Cocina': 127,
      'Mobiliario': 128,
      'Cableado estructurado': 129,
      'Rollers': 130
    };
    
    // Preparar oficinas
    const oficinas = [];
    console.log('🔍 DEBUG edificioConfig:', this.formData.edificioConfig);
    console.log('🔍 DEBUG oficinas array:', this.formData.edificioConfig?.oficinas);
    console.log('🔍 DEBUG equipamiento:', this.formData.equipamiento);
    
    if (this.formData.edificioConfig && this.formData.edificioConfig.oficinas) {
      this.formData.edificioConfig.oficinas.forEach(oficina => {
        // 🛠️ Construir características de equipamiento para esta oficina
        const caracteristicasOficina = [];
        const equipamientoSeleccionado = this.formData.equipamiento || {};
        
        Object.keys(equipamientoSeleccionado).forEach(nombreEquipamiento => {
          const oficinasConEquipamiento = equipamientoSeleccionado[nombreEquipamiento] || [];
          
          // Si esta oficina tiene este equipamiento
          if (oficinasConEquipamiento.includes(oficina.oficina_numero.toString())) {
            const caracId = equipamientoMap[nombreEquipamiento];
            if (caracId) {
              caracteristicasOficina.push({
                caracteristica_id: caracId,
                valor: 'true'
              });
            }
          }
        });
        
        oficinas.push({
          piso: oficina.piso,
          numero_oficina: oficina.oficina_numero,
          nombre: truncateString(oficina.nombre, 200),
          // Area: NUMERIC(10,2) = 0 a 99999999.99
          area: validateNumeric(oficina.area, 0, 99999999.99) || 0,
          caracteristicas: caracteristicasOficina // ✅ Equipamiento mapeado correctamente
        });
      });
    }
    
    // Preparar sótanos
    const sotanos = [];
    console.log('🔍 DEBUG sotanos_config:', this.formData.edificioConfig?.sotanos_config);
    
    if (this.formData.edificioConfig && this.formData.edificioConfig.sotanos_config) {
      this.formData.edificioConfig.sotanos_config.forEach(sotano => {
        sotanos.push({
          nivel: sotano.nivel,
          parqueos: sotano.parqueos
        });
      });
    }
    
    const edificioCompleto = {
      edificio: edificio,
      oficinas: oficinas,
      sotanos: sotanos,
      oficinas_para_eliminar: this.formData.oficinasParaEliminar || []  // 🗑️ IDs de oficinas a eliminar
    };

    // Log de oficinas para eliminar
    if (this.formData.oficinasParaEliminar?.length > 0) {
      console.log('🗑️ Oficinas marcadas para ELIMINAR:', this.formData.oficinasParaEliminar);
    }
    
    // Contar oficinas con equipamiento
    const oficinasConEquipamiento = oficinas.filter(ofi => ofi.caracteristicas.length > 0).length;
    const totalEquipamientos = oficinas.reduce((sum, ofi) => sum + ofi.caracteristicas.length, 0);
    
    console.log('📊 Edificio Completo preparado:', {
      edificio: edificio.nombre_inmueble,
      total_oficinas: oficinas.length,
      oficinas_con_equipamiento: oficinasConEquipamiento,
      total_equipamientos: totalEquipamientos,
      total_sotanos: sotanos.length
    });
    
    // Log detallado de oficinas con equipamiento
    if (totalEquipamientos > 0) {
      console.log('🛠️ Oficinas con equipamiento:');
      oficinas.forEach(ofi => {
        if (ofi.caracteristicas.length > 0) {
          console.log(`   Oficina ${ofi.numero_oficina}: ${ofi.caracteristicas.length} equipamientos`);
        }
      });
    }
    
    return edificioCompleto;
  }

  /**
   * 🏗️ ÉPICO: Guardar Edificio Completo con todas las oficinas
   * Llama a /api/v1/propiedades/edificio-completo
   */
  async submitEdificioCompleto(propietarioId) {
    try {
      console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
      console.log('🏗️ GUARDANDO EDIFICIO COMPLETO');
      console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');

      // 1️⃣ Construir datos del EDIFICIO (cabecera)
      const edificioData = {
        propietario_id: propietarioId,
        tipo_inmueble_id: parseInt(this.formData.tipo_inmueble_id),
        distrito_id: parseInt(this.formData.distrito_id),
        nombre_inmueble: this.formData.nombre_inmueble,
        direccion: this.formData.direccion,
        latitud: this.formData.latitud ? parseFloat(this.formData.latitud) : null,
        longitud: this.formData.longitud ? parseFloat(this.formData.longitud) : null,
        area: this.formData.area ? parseFloat(this.formData.area) : 0,
        antiguedad: this.formData.antiguedad ? parseInt(this.formData.antiguedad) : null,
        implementacion: this.formData.implementacion ? parseInt(this.formData.implementacion) : null,
        transaccion: this.formData.transaccion,
        precio_venta: this.formData.transaccion === 'venta' && this.formData.precio_venta ? parseFloat(this.formData.precio_venta) : null,
        precio_alquiler: this.formData.transaccion === 'alquiler' && this.formData.precio_alquiler ? parseFloat(this.formData.precio_alquiler) : null,
        moneda: this.formData.moneda,
        titulo: this.formData.titulo,
        descripcion: this.formData.descripcion || '',
        caracteristicas: this.formData.caracteristicas || []
      };

      // 2️⃣ Construir lista de OFICINAS con EQUIPAMIENTO
      // 🔑 Mapeo de equipamiento a caracteristica_id (categoría 19)
      const equipamientoMap = {
        'Falsos techos': 122,
        'Luminarias': 123,
        'AAC': 124,
        'Sprinklers': 125,
        'Fibra Óptica': 126,
        'Tabiques Mamp.': 127,
        'Mobiliario': 128,
        'Sillas': 129,
        'Rollers': 130
      };

      const oficinasData = this.formData.edificioConfig.oficinas.map(oficina => {
        // Características base de la oficina
        const caracteristicasOficina = [];

        // 🛠️ Agregar equipamiento si fue seleccionado para esta oficina
        const equipamientoSeleccionado = this.formData.equipamiento || {};

        Object.keys(equipamientoSeleccionado).forEach(nombreEquipamiento => {
          const oficinasConEquipamiento = equipamientoSeleccionado[nombreEquipamiento] || [];

          // Si esta oficina tiene este equipamiento
          if (oficinasConEquipamiento.includes(oficina.oficina_numero.toString())) {
            const caracId = equipamientoMap[nombreEquipamiento];
            if (caracId) {
              caracteristicasOficina.push({
                caracteristica_id: caracId,
                valor: 'Sí'
              });
            }
          }
        });

        return {
          piso: oficina.piso,
          numero_oficina: oficina.oficina_numero,
          nombre: oficina.nombre,
          area: oficina.area,
          caracteristicas: caracteristicasOficina // 🆕 Características individuales por oficina
        };
      });

      // 3️⃣ Construir lista de SÓTANOS
      const sotanosData = this.formData.edificioConfig.sotanos_config.map(sotano => ({
        nivel: sotano.nivel,
        parqueos: sotano.parqueos
      }));

      // 4️⃣ Armar JSON ÉPICO
      const edificioCompletoJson = {
        edificio: edificioData,
        oficinas: oficinasData,
        sotanos: sotanosData
      };

      console.log('📊 EDIFICIO:');
      console.log('   - Nombre:', edificioData.nombre_inmueble);
      console.log('   - Propietario ID:', propietarioId);
      console.log('   - Distrito ID:', edificioData.distrito_id);
      console.log('   - Área total:', edificioData.area, 'm²');
      console.log('   - Características:', edificioData.caracteristicas.length);

      console.log('\n🏢 OFICINAS:', oficinasData.length);
      oficinasData.forEach((ofi, i) => {
        const equipCount = ofi.caracteristicas.length;
        console.log(`   ${i + 1}. ${ofi.nombre} - Piso ${ofi.piso} - ${ofi.area} m² - ${equipCount} equipamientos`);
        if (equipCount > 0) {
          ofi.caracteristicas.forEach(c => {
            const nombreEquip = Object.keys(equipamientoMap).find(k => equipamientoMap[k] === c.caracteristica_id);
            console.log(`      ✓ ${nombreEquip}`);
          });
        }
      });

      console.log('\n🅿️ SÓTANOS:', sotanosData.length);
      sotanosData.forEach((sotano, i) => {
        console.log(`   ${i + 1}. Sótano ${sotano.nivel} - ${sotano.parqueos} parqueos`);
      });

      console.log('\n📄 JSON COMPLETO:');
      console.log(JSON.stringify(edificioCompletoJson, null, 2));

      // 5️⃣ Construir FormData
      const formData = new FormData();
      formData.append('edificio_json', JSON.stringify(edificioCompletoJson));

      // Agregar imagen principal
      if (this.formData.imagen_principal) {
        formData.append('imagen_principal', this.formData.imagen_principal);
        console.log('\n📸 Imagen principal:', this.formData.imagen_principal.name);
      }

      // Agregar galería
      if (this.formData.imagenes_galeria.length > 0) {
        this.formData.imagenes_galeria.forEach((imagen, index) => {
          formData.append('imagenes_galeria', imagen);
        });
        console.log('🖼️ Galería:', this.formData.imagenes_galeria.length, 'imágenes');
      }

      console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');

      // 6️⃣ Enviar a la API
      const token = authService.getToken();
      const url = `${API_CONFIG.BASE_URL}/propiedades/edificio-completo`;

      console.log('📤 Enviando a:', url);
      showNotification('🏗️ Creando edificio completo...', 'info');

      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`
        },
        body: formData
      });

      const result = await response.json();

      console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
      console.log('📥 RESPUESTA DEL SERVIDOR:');
      console.log('Status:', response.status);
      console.log('Resultado:', result);
      console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');

      // 7️⃣ Manejar respuesta
      if (!response.ok) {
        throw new Error(result.detail || result.message || 'Error al crear edificio completo');
      }

      showNotification('✅ ¡Edificio completo creado exitosamente!', 'success');

      // Mostrar resumen
      Swal.fire({
        icon: 'success',
        title: '🏗️ Edificio Completo Creado',
        html: `
          <div style="text-align: left;">
            <p><strong>📋 Edificio:</strong> ${result.data.edificio.nombre}</p>
            <p><strong>🏢 Oficinas creadas:</strong> ${result.data.total_oficinas}</p>
            <p><strong>🅿️ Sótanos:</strong> ${result.data.total_sotanos}</p>
            <p><strong>🚗 Parqueos totales:</strong> ${result.data.total_parqueos}</p>
          </div>
        `,
        confirmButtonText: 'Ver Propiedades'
      }).then(() => {
        // Redirigir a tab de propiedades
        if (window.DashboardApp) {
          window.DashboardApp.switchTab('propiedades');
        }
      });

    } catch (error) {
      console.error('❌ Error guardando edificio completo:', error);
      showNotification(`❌ Error: ${error.message}`, 'error');
    }
  }

  /**
   * 🚪 Cerrar el formulario y volver a la lista
   */
  close() {
    console.log('🚪 Cerrando formulario PropertyForm...');
    
    // Destruir el formulario del DOM
    if (this.container) {
      this.container.remove();
      console.log('✅ Formulario eliminado del DOM');
    }
    
    // ✅ SOLUCIÓN: Simplemente cerrar, no recargar la página
    // El tab de propiedades ya está activo y mostrará la lista
    console.log('✅ Formulario cerrado, permaneciendo en el tab actual');
    
    // Forzar el refresco del tab de propiedades
    if (this.dashboard && this.dashboard.router) {
      console.log('🔄 Forzando refresco de propiedades...');
      console.log('📍 Tab actual:', this.dashboard.router.currentTab);
      
      // Temporalmente cambiar el tab para forzar recarga
      const originalTab = this.dashboard.router.currentTab;
      this.dashboard.router.currentTab = null; // Resetear forzado
      
      // Navegar a propiedades para forzar recarga completa
      setTimeout(() => {
        this.dashboard.router.navigate('propiedades');
      }, 100);
    } else {
      console.warn('⚠️ No se encontró dashboard o router para refrescar');
      // Fallback: intentar con window.DashboardApp si existe
      if (window.DashboardApp && window.DashboardApp.router) {
        console.log('🔄 Usando fallback window.DashboardApp...');
        window.DashboardApp.router.navigate('propiedades');
      }
    }
  }
}

// Exponer globalmente
window.PropertyForm = PropertyForm;

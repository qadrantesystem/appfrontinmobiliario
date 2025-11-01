/**
 * 📝 Búsquedas Form - Modal de Nueva Búsqueda
 * Maneja el modal de formulario para crear nuevas búsquedas
 * ~300 líneas - Separado para mantener arquitectura limpia
 */

class BusquedasForm {
  constructor(busquedasTab) {
    this.tab = busquedasTab;
    this.selectedDistritos = [];
    this.allDistritos = [];
  }

  /**
   * Abrir modal de búsqueda
   */
  async open() {
    console.log('📝 Abriendo modal de búsqueda...');
    const modal = this.tab.container.querySelector('#modalNuevaBusqueda');
    if (!modal) {
      console.error('❌ No se encontró modal #modalNuevaBusqueda');
      return;
    }

    modal.style.display = 'flex';
    console.log('✅ Modal visible, cargando datos...');
    await this.loadData();
    console.log('✅ Datos cargados, configurando listeners...');
    this.setupListeners();
    console.log('✅ Modal completamente inicializado');
  }

  /**
   * Cerrar modal
   */
  close() {
    const modal = this.tab.container.querySelector('#modalNuevaBusqueda');
    if (modal) {
      modal.style.display = 'none';
      this.resetForm();
    }
  }

  /**
   * Cargar datos del modal (tipos, distritos)
   */
  async loadData() {
    await Promise.all([
      this.loadTiposPropiedad(),
      this.loadDistritos()
    ]);
  }

  /**
   * Cargar tipos de propiedad
   */
  async loadTiposPropiedad() {
    try {
      console.log('🏢 Cargando tipos de inmueble...');
      const url = `${API_CONFIG.BASE_URL}/tipos-inmueble`;
      console.log('📡 URL:', url);

      const response = await fetch(url, {
        headers: { 'Authorization': `Bearer ${authService.getToken()}` }
      });

      console.log('📥 Response status:', response.status);
      const data = await response.json();
      console.log('📦 Tipos recibidos:', data);

      // El API puede devolver array directo o {data: []}
      const tipos = Array.isArray(data) ? data : (data.data || []);
      console.log('📦 Tipos procesados:', tipos.length);

      const select = this.tab.container.querySelector('#modalTipoInmueble');
      if (!select) {
        console.error('❌ No se encontró select #modalTipoInmueble');
        return;
      }

      if (tipos.length > 0) {
        select.innerHTML = '<option value="">Selecciona tipo...</option>' +
          tipos.map(tipo =>
            `<option value="${tipo.tipo_inmueble_id}">${tipo.nombre}</option>`
          ).join('');
        console.log(`✅ ${tipos.length} tipos de inmueble cargados en select`);
      } else {
        console.warn('⚠️ No hay tipos de inmueble disponibles');
      }
    } catch (error) {
      console.error('❌ Error cargando tipos:', error);
    }
  }

  /**
   * Cargar distritos
   */
  async loadDistritos() {
    try {
      console.log('📍 Cargando distritos...');
      const url = `${API_CONFIG.BASE_URL}/distritos?limit=100`;
      console.log('📡 URL:', url);

      const response = await fetch(url, {
        headers: { 'Authorization': `Bearer ${authService.getToken()}` }
      });

      console.log('📥 Response status:', response.status);
      const data = await response.json();
      console.log('📦 Distritos recibidos:', data);

      // El API puede devolver array directo o {data: []}
      this.allDistritos = Array.isArray(data) ? data : (data.data || []);
      console.log(`✅ ${this.allDistritos.length} distritos cargados`);
      console.log('📦 Estructura de distrito[0]:', this.allDistritos[0]);
      this.renderDistritoOptions();
    } catch (error) {
      console.error('❌ Error cargando distritos:', error);
    }
  }

  /**
   * Renderizar opciones de distrito
   */
  renderDistritoOptions() {
    const container = this.tab.container.querySelector('#modalDistritoOptions');
    if (!container) {
      console.error('❌ No se encontró #modalDistritoOptions');
      return;
    }

    console.log('📍 Renderizando opciones de distrito...');
    console.log('📍 Cantidad de distritos:', this.allDistritos.length);

    container.innerHTML = this.allDistritos.map(d => {
      // Detectar el campo de ID (puede ser ubigeo, distrito_id, id, etc.)
      const distritoId = d.ubigeo || d.distrito_id || d.id;
      const distritoNombre = d.nombre || d.distrito || 'Sin nombre';

      console.log(`📍 Distrito: ID=${distritoId}, Nombre=${distritoNombre}`);

      return `
        <div class="multi-select-custom__option" data-value="${distritoId}">
          <input type="checkbox" id="distrito_${distritoId}" value="${distritoId}">
          <label for="distrito_${distritoId}">${distritoNombre}</label>
        </div>
      `;
    }).join('');

    console.log('✅ Opciones de distrito renderizadas');
  }

  /**
   * Inicializar multi-select de distritos
   */
  initDistritoMultiSelect() {
    const button = this.tab.container.querySelector('#modalDistritoToggle');
    const panel = this.tab.container.querySelector('#modalDistritoPanel');
    const searchInput = this.tab.container.querySelector('#modalDistritoSearch');
    const selectAllBtn = this.tab.container.querySelector('#modalDistritoSelectAll');
    const clearBtn = this.tab.container.querySelector('#modalDistritoClear');
    const optionsContainer = this.tab.container.querySelector('#modalDistritoOptions');

    if (!button || !panel) return;

    // Toggle panel
    button.addEventListener('click', (e) => {
      e.stopPropagation();
      const isHidden = panel.hasAttribute('hidden');
      if (isHidden) {
        panel.removeAttribute('hidden');
      } else {
        panel.setAttribute('hidden', '');
      }
    });

    // Cerrar al hacer click fuera
    document.addEventListener('click', (e) => {
      if (!panel.contains(e.target) && e.target !== button) {
        panel.setAttribute('hidden', '');
      }
    });

    // Búsqueda
    if (searchInput) {
      searchInput.addEventListener('input', (e) => {
        const search = e.target.value.toLowerCase();
        const options = optionsContainer.querySelectorAll('.multi-select-custom__option');

        options.forEach(opt => {
          const label = opt.querySelector('label').textContent.toLowerCase();
          opt.style.display = label.includes(search) ? 'flex' : 'none';
        });
      });
    }

    // Seleccionar todos
    if (selectAllBtn) {
      selectAllBtn.addEventListener('click', () => {
        const checkboxes = optionsContainer.querySelectorAll('input[type="checkbox"]:not([style*="display: none"])');
        checkboxes.forEach(cb => {
          cb.checked = true;
          this.updateDistritoSelection(cb.value, true);
        });
        this.updateDistritoTags();
      });
    }

    // Limpiar
    if (clearBtn) {
      clearBtn.addEventListener('click', () => {
        const checkboxes = optionsContainer.querySelectorAll('input[type="checkbox"]');
        checkboxes.forEach(cb => {
          cb.checked = false;
        });
        this.selectedDistritos = [];
        this.updateDistritoTags();
      });
    }

    // Checkbox change
    optionsContainer.addEventListener('change', (e) => {
      if (e.target.type === 'checkbox') {
        this.updateDistritoSelection(e.target.value, e.target.checked);
        this.updateDistritoTags();
      }
    });
  }

  /**
   * Actualizar selección de distrito
   */
  updateDistritoSelection(ubigeo, isChecked) {
    if (isChecked) {
      if (!this.selectedDistritos.includes(ubigeo)) {
        this.selectedDistritos.push(ubigeo);
      }
    } else {
      this.selectedDistritos = this.selectedDistritos.filter(d => d !== ubigeo);
    }
  }

  /**
   * Actualizar tags de distritos seleccionados
   */
  updateDistritoTags() {
    const tagsContainer = this.tab.container.querySelector('#modalDistritoTags');
    const placeholder = this.tab.container.querySelector('#modalDistritoPlaceholder');

    if (!tagsContainer || !placeholder) return;

    if (this.selectedDistritos.length === 0) {
      tagsContainer.innerHTML = '';
      placeholder.style.display = 'block';
    } else {
      placeholder.style.display = 'none';
      tagsContainer.innerHTML = this.selectedDistritos.slice(0, 3).map(distritoId => {
        // Buscar por cualquier campo de ID posible
        const distrito = this.allDistritos.find(d =>
          (d.distrito_id == distritoId) ||
          (d.ubigeo == distritoId) ||
          (d.id == distritoId)
        );
        const nombre = distrito ? (distrito.nombre || distrito.distrito) : distritoId;
        return `
          <span class="multi-select-custom__tag">
            ${nombre}
            <button type="button" class="multi-select-custom__tag-remove" data-distrito-id="${distritoId}">×</button>
          </span>
        `;
      }).join('');

      if (this.selectedDistritos.length > 3) {
        tagsContainer.innerHTML += `<span class="multi-select-custom__tag">+${this.selectedDistritos.length - 3} más</span>`;
      }

      // Event listeners para remover tags
      tagsContainer.querySelectorAll('.multi-select-custom__tag-remove').forEach(btn => {
        btn.addEventListener('click', (e) => {
          e.stopPropagation();
          const distritoId = btn.dataset.distritoId;
          const checkbox = this.tab.container.querySelector(`#distrito_${distritoId}`);
          if (checkbox) checkbox.checked = false;
          this.updateDistritoSelection(distritoId, false);
          this.updateDistritoTags();
        });
      });
    }
  }

  /**
   * Setup listeners del modal
   */
  setupListeners() {
    // Cerrar modal
    const btnCerrar = this.tab.container.querySelector('#btnCerrarModalBusqueda');
    if (btnCerrar) {
      btnCerrar.addEventListener('click', () => this.close());
    }

    // Click en overlay para cerrar
    const overlay = this.tab.container.querySelector('#modalNuevaBusqueda');
    if (overlay) {
      overlay.addEventListener('click', (e) => {
        if (e.target === overlay) this.close();
      });
    }

    // Ejecutar búsqueda
    const btnBuscar = this.tab.container.querySelector('#btnEjecutarBusqueda');
    if (btnBuscar) {
      btnBuscar.addEventListener('click', () => this.executeSearch());
    }

    // Cambio de transacción (actualiza label de presupuesto)
    const selectTransaccion = this.tab.container.querySelector('#modalTransaccion');
    if (selectTransaccion) {
      selectTransaccion.addEventListener('change', (e) => {
        const label = this.tab.container.querySelector('#modalLabelPresupuesto');
        const helper = this.tab.container.querySelector('#modalHelperPresupuesto');

        if (e.target.value === 'alquiler') {
          if (label) label.textContent = 'Presupuesto Alquiler (USD)';
          if (helper) helper.textContent = 'Tolerancia ±15%';
        } else {
          if (label) label.textContent = 'Presupuesto Compra (USD)';
          if (helper) helper.textContent = 'Tolerancia ±15%';
        }
      });
    }

    // Inicializar multi-select
    this.initDistritoMultiSelect();
  }

  /**
   * Recopilar filtros del modal
   */
  collectFilters() {
    const tipoInmueble = this.tab.container.querySelector('#modalTipoInmueble')?.value;
    const transaccion = this.tab.container.querySelector('#modalTransaccion')?.value || 'compra';
    const metraje = parseFloat(this.tab.container.querySelector('#modalMetraje')?.value);
    const presupuesto = parseFloat(this.tab.container.querySelector('#modalPresupuesto')?.value);

    const filters = {
      tipo_inmueble: tipoInmueble || null,
      distritos: this.selectedDistritos.length > 0 ? this.selectedDistritos : null,
      tipo_transaccion: transaccion,
      metraje: metraje || null,
      presupuesto: presupuesto || null
    };

    return filters;
  }

  /**
   * Ejecutar búsqueda
   */
  async executeSearch() {
    const filters = this.collectFilters();

    // Cerrar modal
    this.close();

    // Ejecutar búsqueda en el tab principal
    await this.tab.executeSearch(filters);
  }

  /**
   * Resetear formulario
   */
  resetForm() {
    const tipoSelect = this.tab.container.querySelector('#modalTipoInmueble');
    const transaccionSelect = this.tab.container.querySelector('#modalTransaccion');
    const metrajeInput = this.tab.container.querySelector('#modalMetraje');
    const presupuestoInput = this.tab.container.querySelector('#modalPresupuesto');

    if (tipoSelect) tipoSelect.value = '';
    if (transaccionSelect) transaccionSelect.value = 'compra';
    if (metrajeInput) metrajeInput.value = '';
    if (presupuestoInput) presupuestoInput.value = '';

    // Limpiar distritos
    this.selectedDistritos = [];
    const checkboxes = this.tab.container.querySelectorAll('#modalDistritoOptions input[type="checkbox"]');
    checkboxes.forEach(cb => cb.checked = false);
    this.updateDistritoTags();
  }
}

// Exportar para uso en busquedas.js
if (typeof window !== 'undefined') {
  window.BusquedasForm = BusquedasForm;
}

// Página de Búsqueda Simplificada - Match Property
class BusquedaPage {
  constructor() {
    this.distritos = [];
    this.tiposInmuebles = [];
    this.filtrosSeleccionados = {
      pais: 'PERU',
      departamento: 'LIMA',
      provincia: 'LIMA',
      distritos_ids: [],
      tipo_inmueble_id: null,
      metraje: null,
      transaccion: 'compra',
      presupuesto: null
    };

    this.init();
  }

  async init() {
    await this.loadData();
    this.renderDistritos();
    this.renderTiposInmuebles();
    this.setupEventListeners();
    this.setupHamburgerMenu();
    this.setupPresupuestoDinamico();
    this.setupBackgroundChanger();
  }

  setupHamburgerMenu() {
    const hamburger = document.getElementById('hamburger');
    const navMenu = document.getElementById('navMenu');

    if (hamburger && navMenu) {
      hamburger.addEventListener('click', () => {
        hamburger.classList.toggle('active');
        navMenu.classList.toggle('active');
      });

      navMenu.querySelectorAll('a').forEach(link => {
        link.addEventListener('click', () => {
          hamburger.classList.remove('active');
          navMenu.classList.remove('active');
        });
      });

      document.addEventListener('click', (e) => {
        if (!hamburger.contains(e.target) && !navMenu.contains(e.target)) {
          hamburger.classList.remove('active');
          navMenu.classList.remove('active');
        }
      });
    }
  }

  setupPresupuestoDinamico() {
    const radioCompra = document.querySelector('input[name="transaccion"][value="compra"]');
    const radioAlquiler = document.querySelector('input[name="transaccion"][value="alquiler"]');
    const labelPresupuesto = document.getElementById('labelPresupuesto');
    const inputPresupuesto = document.getElementById('presupuesto');
    const helperPresupuesto = document.getElementById('helperPresupuesto');

    const actualizarCampo = () => {
      const esCompra = radioCompra.checked;
      
      if (esCompra) {
        labelPresupuesto.textContent = '💰 Presupuesto Compra (USD)';
        inputPresupuesto.placeholder = '750,000';
        helperPresupuesto.textContent = '💡 Tolerancia ±15% (Sin IGV)';
      } else {
        labelPresupuesto.textContent = '💰 Presupuesto Alquiler (USD/mes)';
        inputPresupuesto.placeholder = '8,500';
        helperPresupuesto.textContent = '💡 Tolerancia ±15%';
      }

      // Actualizar valor en filtros
      this.filtrosSeleccionados.transaccion = esCompra ? 'compra' : 'alquiler';
    };

    radioCompra.addEventListener('change', actualizarCampo);
    radioAlquiler.addEventListener('change', actualizarCampo);
  }

  setupBackgroundChanger() {
    const tipoInmuebleSelect = document.getElementById('tipoInmueble');
    const filtrosCard = document.querySelector('.filtro-simplificado-card');

    if (!tipoInmuebleSelect || !filtrosCard) return;

    tipoInmuebleSelect.addEventListener('change', (e) => {
      // Remover el data-tipo previo
      filtrosCard.removeAttribute('data-tipo');

      const tipoId = e.target.value;
      if (!tipoId) return;

      // Buscar el tipo de inmueble en el array
      const tipoInmueble = this.tiposInmuebles.find(t => t.id == tipoId);
      if (!tipoInmueble) return;

      // Mapear nombre a slug para CSS
      const nombreLower = tipoInmueble.nombre.toLowerCase();
      let tipoSlug = '';

      if (nombreLower.includes('casa')) tipoSlug = 'casa';
      else if (nombreLower.includes('departamento')) tipoSlug = 'departamento';
      else if (nombreLower.includes('terreno')) tipoSlug = 'terreno';
      else if (nombreLower.includes('oficina')) tipoSlug = 'oficina';
      else if (nombreLower.includes('local')) tipoSlug = 'local';
      else if (nombreLower.includes('cochera') || nombreLower.includes('estacionamiento')) tipoSlug = 'cochera';

      if (tipoSlug) {
        filtrosCard.setAttribute('data-tipo', tipoSlug);
      }
    });
  }

  async loadData() {
    try {
      const [distritosRes, tiposRes] = await Promise.all([
        fetch('data/distritos.json'),
        fetch('data/tipos-inmuebles.json')
      ]);

      const distritosData = await distritosRes.json();
      const tiposData = await tiposRes.json();

      this.distritos = distritosData.distritos;
      this.tiposInmuebles = tiposData.tipos;
    } catch (error) {
      console.error('Error cargando datos:', error);
    }
  }

  renderDistritos() {
    const panel = document.getElementById('distritoPanel');
    const toggleBtn = document.getElementById('distritoToggle');
    const optionsContainer = document.getElementById('distritoOptions');
    const searchInput = document.getElementById('distritoSearch');
    const selectAllBtn = document.getElementById('distritoSelectAll');
    const clearBtn = document.getElementById('distritoClear');
    const tagsContainer = document.getElementById('distritoTags');
    const placeholder = document.getElementById('distritoPlaceholder');

    if (!panel || !toggleBtn || !optionsContainer) return;

    const renderOptions = (filterText = '') => {
      const term = (filterText || '').toLowerCase();
      const selectedSet = new Set(this.filtrosSeleccionados.distritos_ids || []);
      const listaFiltrada = this.distritos
        .filter(d => d.nombre.toLowerCase().includes(term))
        .sort((a, b) => a.nombre.localeCompare(b.nombre, 'es')); // Orden alfabético
      optionsContainer.innerHTML = listaFiltrada.map(d => `
        <label class="multi-option">
          <input type="checkbox" value="${d.id}" ${selectedSet.has(d.id) ? 'checked' : ''}>
          <span>${d.nombre}</span>
        </label>
      `).join('');

      // Checkbox listeners
      optionsContainer.querySelectorAll('input[type="checkbox"]').forEach(cb => {
        cb.addEventListener('change', () => {
          const id = parseInt(cb.value);
          const arr = new Set(this.filtrosSeleccionados.distritos_ids || []);
          if (cb.checked) {
            arr.add(id);
          } else {
            arr.delete(id);
          }
          this.filtrosSeleccionados.distritos_ids = Array.from(arr);
          updateTags();
        });
      });
    };

    const updateTags = () => {
      const ids = this.filtrosSeleccionados.distritos_ids || [];
      if (ids.length === 0) {
        tagsContainer.innerHTML = '';
        placeholder.style.display = '';
      } else {
        const nombres = ids
          .map(id => this.distritos.find(d => d.id === id)?.nombre)
          .filter(Boolean);
        placeholder.style.display = 'none';
        // Mostrar hasta 3 chips y un contador +N
        const maxChips = 3;
        const chips = nombres.slice(0, maxChips).map(n => `<span class="multi-select__tag">${n}</span>`).join('');
        const extra = nombres.length > maxChips ? `<span class="multi-select__tag">+${nombres.length - maxChips}</span>` : '';
        tagsContainer.innerHTML = chips + extra;
      }
    };

    // Inicial
    renderOptions();
    updateTags();

    // Abrir/cerrar panel en flujo normal
    const multiContainer = document.getElementById('distritoMulti');
    const openPanel = () => {
      panel.hidden = false;
      toggleBtn.setAttribute('aria-expanded', 'true');
      multiContainer?.classList.add('open');
      searchInput?.focus();
    };
    const closePanel = () => {
      panel.hidden = true;
      toggleBtn.setAttribute('aria-expanded', 'false');
      multiContainer?.classList.remove('open');
    };
    toggleBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      if (panel.hidden) openPanel(); else closePanel();
    });
    // Cerrar con clic fuera del contenedor
    document.addEventListener('mousedown', (e) => {
      if (panel.hidden) return;
      if (!multiContainer.contains(e.target)) closePanel();
    });
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape') closePanel();
    });

    // Buscar en vivo
    searchInput?.addEventListener('input', (e) => {
      renderOptions(e.target.value.trim());
    });

    // Seleccionar todos (en la vista filtrada)
    selectAllBtn?.addEventListener('click', () => {
      const term = searchInput?.value?.toLowerCase() || '';
      const idsFiltrados = this.distritos
        .filter(d => d.nombre.toLowerCase().includes(term))
        .map(d => d.id);
      const conjunto = new Set([...(this.filtrosSeleccionados.distritos_ids || []), ...idsFiltrados]);
      this.filtrosSeleccionados.distritos_ids = Array.from(conjunto);
      renderOptions(term);
      updateTags();
    });

    // Limpiar selección
    clearBtn?.addEventListener('click', () => {
      this.filtrosSeleccionados.distritos_ids = [];
      renderOptions(searchInput?.value || '');
      updateTags();
    });
  }

  renderTiposInmuebles() {
    const select = document.getElementById('tipoInmueble');
    if (!select) return;

    const html = this.tiposInmuebles.map(tipo => `
      <option value="${tipo.id}">${tipo.icono} ${tipo.nombre}</option>
    `).join('');

    select.innerHTML = `<option value="">Selecciona un tipo...</option>` + html;

    // Event listener para cambio de tipo
    select.addEventListener('change', (e) => {
      this.filtrosSeleccionados.tipo_inmueble_id = e.target.value ? parseInt(e.target.value) : null;
    });
  }

  setupEventListeners() {
    // Cambiar fondo según tipo de inmueble seleccionado
    this.setupBackgroundChanger();

    // Botón Hacer MATCH
    const btnHacerMatch = document.getElementById('btnHacerMatch');
    btnHacerMatch?.addEventListener('click', () => this.realizarBusqueda());

    // Input de metraje
    document.getElementById('metraje')?.addEventListener('input', (e) => {
      this.filtrosSeleccionados.metraje = e.target.value ? parseInt(e.target.value) : null;
    });

    // Input de presupuesto
    document.getElementById('presupuesto')?.addEventListener('input', (e) => {
      this.filtrosSeleccionados.presupuesto = e.target.value ? parseInt(e.target.value) : null;
    });
  }

  realizarBusqueda() {
    // Validar que al menos tenga distrito y tipo
    if (!this.filtrosSeleccionados.distritos_ids || this.filtrosSeleccionados.distritos_ids.length === 0) {
      alert('Por favor selecciona al menos un distrito');
      return;
    }

    if (!this.filtrosSeleccionados.tipo_inmueble_id) {
      alert('Por favor selecciona un tipo de inmueble');
      return;
    }

    // Preparar objeto de filtros para enviar
    const filtrosParaResultados = {
      pais: this.filtrosSeleccionados.pais,
      departamento: this.filtrosSeleccionados.departamento,
      provincia: this.filtrosSeleccionados.provincia,
      distritos_ids: this.filtrosSeleccionados.distritos_ids,
      tipo_inmueble_id: this.filtrosSeleccionados.tipo_inmueble_id,
      area: this.filtrosSeleccionados.metraje, // Renombrado de metraje a area
      transaccion: this.filtrosSeleccionados.transaccion,
      // Presupuesto separado según tipo de transacción
      presupuesto_compra: this.filtrosSeleccionados.transaccion === 'compra' ? this.filtrosSeleccionados.presupuesto : null,
      presupuesto_alquiler: this.filtrosSeleccionados.transaccion === 'alquiler' ? this.filtrosSeleccionados.presupuesto : null
    };

    // Guardar filtros en localStorage
    localStorage.setItem('filtros_simplificados', JSON.stringify(filtrosParaResultados));

    // Redirigir a página de resultados
    window.location.href = 'resultados.html';
  }
}

// Inicializar página
document.addEventListener('DOMContentLoaded', () => {
  new BusquedaPage();
});

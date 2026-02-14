// Home Page - Qadrante
class HomePage {
  constructor() {
    this.distritos = [];
    this.tiposInmuebles = [];
    this.distritosSeleccionadosHero = [];
    this.datosModalCargados = false;
    this.init();
  }

  async init() {
    await this.loadTextos();
    this.renderServices();
    this.renderFooter();
    this.setupHamburgerMenu();
    this.setupScrollHeader();
    this.setupBusquedaModal();
    this.setupContactoForm();
    this.setupPublicarInmueble();
    this.checkOpenModal();
    await this.cargarDatosHero();
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

  setupScrollHeader() {
    const header = document.getElementById('mainHeader');
    if (!header) return;

    const actualizarHeader = () => {
      if (window.scrollY > 50) {
        header.classList.add('header--scrolled');
      } else {
        header.classList.remove('header--scrolled');
      }
    };

    window.addEventListener('scroll', actualizarHeader);
    actualizarHeader();
  }

  async loadTextos() {
    try {
      const response = await fetch('data/textos-landing.json');
      this.textos = await response.json();
    } catch {
      this.textos = null;
    }
  }

  renderServices() {
    const grid = document.getElementById('servicesGrid');
    if (!grid || !this.textos) return;

    const html = this.textos.servicios.map(servicio => `
      <div class="service-card">
        <img src="${servicio.imagen}" alt="${servicio.titulo}" class="service-card-img" loading="lazy">
        <div class="service-card-body">
          <h3>${servicio.titulo}</h3>
          <p>${servicio.descripcion || ''}</p>
        </div>
      </div>
    `).join('');

    grid.innerHTML = html;
  }

  renderFooter() {
    if (!this.textos) return;

    const misionEl = document.getElementById('footerMision');
    if (misionEl) {
      misionEl.textContent = this.textos.sobre.mision;
    }

    const direccionEl = document.getElementById('footerDireccion');
    const telefonoEl = document.getElementById('footerTelefono');
    const emailEl = document.getElementById('footerEmail');

    if (direccionEl) direccionEl.textContent = this.textos.contacto.direccion;
    if (telefonoEl) telefonoEl.textContent = this.textos.contacto.telefono;
    if (emailEl) {
      emailEl.innerHTML = `<a href="mailto:${this.textos.contacto.email}" style="color: rgba(255,255,255,0.8)">${this.textos.contacto.email}</a>`;
    }
  }

  async cargarDatosHero() {
    try {
      const API_BASE = window.API_CONFIG.BASE_URL;

      const [distritosRes, tiposRes] = await Promise.all([
        fetch(`${API_BASE}/distritos`),
        fetch(`${API_BASE}/tipos-inmueble`)
      ]);

      if (!distritosRes.ok || !tiposRes.ok) return;

      this.distritos = await distritosRes.json();
      this.tiposInmuebles = await tiposRes.json();

      this.renderHeroTipos();
      this.renderHeroDistritos();
      this.setupHeroBusqueda();
    } catch {
      // API no disponible, la barra de busqueda queda con placeholders
    }
  }

  renderHeroTipos() {
    const select = document.getElementById('heroTipoInmueble');
    if (!select) return;

    const html = this.tiposInmuebles.map(t =>
      `<option value="${t.tipo_inmueble_id}">${t.nombre}</option>`
    ).join('');

    select.innerHTML = `<option value="">Tipo de inmueble...</option>` + html;
  }

  renderHeroDistritos() {
    const optionsContainer = document.getElementById('heroDistritoOptions');
    const trigger = document.getElementById('heroDistritoTrigger');
    const dropdown = document.getElementById('heroDistritoDropdown');
    const searchInput = document.getElementById('heroDistritoSearch');
    if (!optionsContainer || !trigger || !dropdown) return;

    const distritosOrdenados = [...this.distritos].sort((a, b) =>
      a.nombre.localeCompare(b.nombre, 'es')
    );

    const renderOpciones = (filtro = '') => {
      const filtrados = filtro
        ? distritosOrdenados.filter(d => d.nombre.toLowerCase().includes(filtro.toLowerCase()))
        : distritosOrdenados;

      optionsContainer.innerHTML = filtrados.map(d => `
        <label>
          <input type="checkbox" value="${d.distrito_id}" data-nombre="${d.nombre}"
            ${this.distritosSeleccionadosHero.includes(d.distrito_id) ? 'checked' : ''}>
          ${d.nombre}
        </label>
      `).join('');

      optionsContainer.querySelectorAll('input[type="checkbox"]').forEach(cb => {
        cb.addEventListener('change', () => {
          const id = parseInt(cb.value);
          if (cb.checked) {
            if (!this.distritosSeleccionadosHero.includes(id)) {
              this.distritosSeleccionadosHero.push(id);
            }
          } else {
            this.distritosSeleccionadosHero = this.distritosSeleccionadosHero.filter(d => d !== id);
          }
          this.actualizarTriggerDistritos();
        });
      });
    };

    renderOpciones();

    trigger.addEventListener('click', (e) => {
      e.stopPropagation();
      dropdown.classList.toggle('open');
    });

    if (searchInput) {
      searchInput.addEventListener('input', (e) => {
        renderOpciones(e.target.value);
      });
    }

    document.addEventListener('click', (e) => {
      const distritoContainer = document.querySelector('.hero-search-distrito');
      if (distritoContainer && !distritoContainer.contains(e.target)) {
        dropdown.classList.remove('open');
      }
    });
  }

  actualizarTriggerDistritos() {
    const trigger = document.getElementById('heroDistritoTrigger');
    if (!trigger) return;

    if (this.distritosSeleccionadosHero.length === 0) {
      trigger.textContent = 'Distritos...';
    } else {
      const nombres = this.distritosSeleccionadosHero.map(id => {
        const d = this.distritos.find(dist => dist.distrito_id === id);
        return d ? d.nombre : '';
      }).filter(Boolean);

      if (nombres.length <= 2) {
        trigger.textContent = nombres.join(', ');
      } else {
        trigger.textContent = `${nombres[0]}, ${nombres[1]} +${nombres.length - 2}`;
      }
    }
  }

  setupHeroBusqueda() {
    const btnBuscar = document.getElementById('btnBuscarHeroInline');
    if (!btnBuscar) return;

    btnBuscar.addEventListener('click', () => {
      const tipo = document.getElementById('heroTipoInmueble')?.value;
      const transaccion = document.getElementById('heroTransaccion')?.value || 'venta';

      if (!tipo && this.distritosSeleccionadosHero.length === 0) {
        Swal.fire({
          title: 'Campos incompletos',
          text: 'Selecciona un tipo de inmueble y al menos un distrito para iniciar la búsqueda.',
          icon: 'warning',
          confirmButtonText: 'Entendido',
          confirmButtonColor: '#ff9700'
        });
        return;
      }

      if (!tipo) {
        Swal.fire({
          title: 'Tipo de inmueble requerido',
          text: 'Selecciona el tipo de inmueble que estás buscando.',
          icon: 'warning',
          confirmButtonText: 'Entendido',
          confirmButtonColor: '#ff9700'
        });
        return;
      }

      if (this.distritosSeleccionadosHero.length === 0) {
        Swal.fire({
          title: 'Distrito requerido',
          text: 'Selecciona al menos un distrito donde deseas buscar.',
          icon: 'warning',
          confirmButtonText: 'Entendido',
          confirmButtonColor: '#ff9700'
        });
        return;
      }

      const filtros = {
        pais: 'PERU',
        departamento: 'LIMA',
        provincia: 'LIMA',
        distritos_ids: this.distritosSeleccionadosHero,
        tipo_inmueble_id: parseInt(tipo),
        transaccion: transaccion,
        area: null,
        presupuesto_compra: null,
        presupuesto_alquiler: null
      };

      localStorage.setItem('filtros_simplificados', JSON.stringify(filtros));
      window.location.href = 'resultados.html';
    });
  }

  setupBusquedaModal() {
    const btnBuscarNav = document.getElementById('btnBuscarNav');
    const btnBusquedaAvanzada = document.getElementById('btnBusquedaAvanzada');
    const modalBusqueda = document.getElementById('modalBusqueda');
    const btnCerrarModal = document.getElementById('btnCerrarModal');

    const abrirModal = async (e) => {
      e.preventDefault();

      if (modalBusqueda) {
        modalBusqueda.style.display = 'flex';
        document.body.classList.add('modal-open');
        document.body.style.overflow = 'hidden';

        if (!this.datosModalCargados) {
          await this.cargarDatosModal();
        }
      }
    };

    const cerrarModal = () => {
      if (modalBusqueda) {
        modalBusqueda.classList.add('closing');

        setTimeout(() => {
          modalBusqueda.style.display = 'none';
          modalBusqueda.classList.remove('closing');
          document.body.classList.remove('modal-open');
          document.body.style.overflow = '';
        }, 300);
      }
    };

    if (btnBuscarNav) {
      btnBuscarNav.addEventListener('click', abrirModal);
    }

    if (btnBusquedaAvanzada) {
      btnBusquedaAvanzada.addEventListener('click', abrirModal);
    }

    if (btnCerrarModal) {
      btnCerrarModal.addEventListener('click', cerrarModal);
    }

    if (modalBusqueda) {
      modalBusqueda.addEventListener('click', (e) => {
        if (e.target === modalBusqueda) {
          cerrarModal();
        }
      });
    }

    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape' && modalBusqueda?.style.display === 'flex') {
        cerrarModal();
      }
    });

    this.abrirModalBusqueda = abrirModal;
  }

  checkOpenModal() {
    const urlParams = new URLSearchParams(window.location.search);
    const openModal = urlParams.get('openModal');

    if (openModal === 'true') {
      setTimeout(async () => {
        const modalBusqueda = document.getElementById('modalBusqueda');
        if (modalBusqueda) {
          modalBusqueda.style.display = 'flex';
          document.body.classList.add('modal-open');
          document.body.style.overflow = 'hidden';

          if (!this.datosModalCargados) {
            await this.cargarDatosModal();
          }
        }

        const newUrl = window.location.pathname;
        window.history.replaceState({}, '', newUrl);
      }, 500);
    }
  }

  async cargarDatosModal() {
    try {
      const API_BASE = window.API_CONFIG.BASE_URL;

      if (this.distritos.length === 0 || this.tiposInmuebles.length === 0) {
        const [distritosRes, tiposRes] = await Promise.all([
          fetch(`${API_BASE}/distritos`),
          fetch(`${API_BASE}/tipos-inmueble`)
        ]);

        if (!distritosRes.ok || !tiposRes.ok) return;

        this.distritos = await distritosRes.json();
        this.tiposInmuebles = await tiposRes.json();
      }

      this.renderDistritosModal();
      this.renderTiposModal();
      this.setupTransaccionChange();
      this.setupFormModal();

      this.datosModalCargados = true;
    } catch {
      // Error cargando datos del modal
    }
  }

  setupTransaccionChange() {
    const selectTransaccion = document.getElementById('transaccion');
    const labelPresupuesto = document.getElementById('labelPresupuesto');
    const helperPresupuesto = document.getElementById('helperPresupuesto');

    if (!selectTransaccion || !labelPresupuesto) return;

    selectTransaccion.addEventListener('change', (e) => {
      if (e.target.value === 'venta') {
        labelPresupuesto.textContent = 'Presupuesto Venta (USD)';
        if (helperPresupuesto) helperPresupuesto.textContent = 'Tolerancia ±15%';
      } else {
        labelPresupuesto.textContent = 'Presupuesto Alquiler (USD/mes)';
        if (helperPresupuesto) helperPresupuesto.textContent = 'Tolerancia ±15%';
      }
    });
  }

  renderDistritosModal() {
    const optionsContainer = document.getElementById('distritoOptions');
    const tagsContainer = document.getElementById('distritoTags');
    const placeholder = document.getElementById('distritoPlaceholder');
    if (!optionsContainer) return;

    const distritosOrdenados = [...this.distritos].sort((a, b) =>
      a.nombre.localeCompare(b.nombre, 'es')
    );

    const html = distritosOrdenados.map(d => `
      <label class="multi-option">
        <input type="checkbox" value="${d.distrito_id}" data-nombre="${d.nombre}">
        <span>${d.nombre}</span>
      </label>
    `).join('');

    optionsContainer.innerHTML = html;

    const updateTags = () => {
      const selected = Array.from(
        optionsContainer.querySelectorAll('input[type="checkbox"]:checked')
      );

      if (selected.length === 0) {
        tagsContainer.innerHTML = '';
        placeholder.style.display = '';
      } else {
        placeholder.style.display = 'none';
        const nombres = selected.map(cb => cb.getAttribute('data-nombre'));
        const maxChips = 3;
        const chips = nombres.slice(0, maxChips).map(n =>
          `<span class="multi-select__tag">${n}</span>`
        ).join('');
        const extra = nombres.length > maxChips ?
          `<span class="multi-select__tag">+${nombres.length - maxChips}</span>` : '';
        tagsContainer.innerHTML = chips + extra;
      }
    };

    optionsContainer.querySelectorAll('input[type="checkbox"]').forEach(cb => {
      cb.addEventListener('change', updateTags);
    });

    const toggleBtn = document.getElementById('distritoToggle');
    const panel = document.getElementById('distritoPanel');
    const multiContainer = document.getElementById('distritoMulti');

    if (toggleBtn && panel) {
      toggleBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        const isHidden = panel.hidden;
        panel.hidden = !isHidden;
        toggleBtn.setAttribute('aria-expanded', !isHidden);
        if (multiContainer) multiContainer.classList.toggle('open');
      });

      document.addEventListener('click', (e) => {
        if (multiContainer && !multiContainer.contains(e.target)) {
          panel.hidden = true;
          toggleBtn.setAttribute('aria-expanded', 'false');
          multiContainer.classList.remove('open');
        }
      });
    }

    const selectAllBtn = document.getElementById('distritoSelectAll');
    const clearBtn = document.getElementById('distritoClear');

    if (selectAllBtn) {
      selectAllBtn.addEventListener('click', () => {
        optionsContainer.querySelectorAll('input[type="checkbox"]').forEach(cb => {
          cb.checked = true;
        });
        updateTags();
      });
    }

    if (clearBtn) {
      clearBtn.addEventListener('click', () => {
        optionsContainer.querySelectorAll('input[type="checkbox"]').forEach(cb => {
          cb.checked = false;
        });
        updateTags();
      });
    }
  }

  renderTiposModal() {
    const select = document.getElementById('tipoInmueble');
    if (!select) return;

    const html = this.tiposInmuebles.map(t =>
      `<option value="${t.tipo_inmueble_id}">${t.nombre}</option>`
    ).join('');

    select.innerHTML = `<option value="">Selecciona tipo...</option>` + html;
  }

  setupFormModal() {
    const btnHacerMatch = document.getElementById('btnHacerMatch');
    if (!btnHacerMatch) return;

    btnHacerMatch.addEventListener('click', () => {
      const distritosSeleccionados = Array.from(
        document.querySelectorAll('#distritoOptions input[type="checkbox"]:checked')
      ).map(cb => parseInt(cb.value));

      const tipo = document.getElementById('tipoInmueble').value;
      const transaccion = document.getElementById('transaccion')?.value || 'venta';
      const metraje = document.getElementById('metraje')?.value;
      const presupuesto = document.getElementById('presupuesto')?.value;

      if (!tipo || distritosSeleccionados.length === 0) {
        Swal.fire({
          title: 'Campos incompletos',
          text: 'Selecciona un tipo de inmueble y al menos un distrito para iniciar la búsqueda.',
          icon: 'warning',
          confirmButtonText: 'Entendido',
          confirmButtonColor: '#ff9700'
        });
        return;
      }

      const filtros = {
        pais: 'PERU',
        departamento: 'LIMA',
        provincia: 'LIMA',
        distritos_ids: distritosSeleccionados,
        tipo_inmueble_id: parseInt(tipo),
        transaccion: transaccion,
        area: metraje ? parseInt(metraje) : null,
        presupuesto_compra: transaccion === 'venta' && presupuesto ? parseInt(presupuesto) : null,
        presupuesto_alquiler: transaccion === 'alquiler' && presupuesto ? parseInt(presupuesto) : null
      };

      localStorage.setItem('filtros_simplificados', JSON.stringify(filtros));
      window.location.href = 'resultados.html';
    });
  }

  setupPublicarInmueble() {
    const btn = document.getElementById('btnPublicarInmueble');
    if (!btn) return;

    btn.addEventListener('click', () => {
      Swal.fire({
        title: 'Debes registrarte',
        text: 'Para publicar un inmueble necesitas crear una cuenta primero.',
        icon: 'info',
        confirmButtonText: 'Ir a Registro',
        confirmButtonColor: '#ff9700',
        showCancelButton: true,
        cancelButtonText: 'Cancelar'
      }).then((result) => {
        if (result.isConfirmed) {
          window.location.href = '/registro';
        }
      });
    });
  }

  setupContactoForm() {
    const form = document.getElementById('contactoForm');
    const mensaje = document.getElementById('contactoMensaje');
    if (!form) return;

    form.addEventListener('submit', async (e) => {
      e.preventDefault();

      const formData = new FormData(form);
      const datos = {
        nombre: formData.get('nombre'),
        email: formData.get('email'),
        mensaje: formData.get('mensaje')
      };

      try {
        const API_BASE = window.API_CONFIG.BASE_URL;
        const response = await fetch(`${API_BASE}/contacto`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(datos)
        });

        if (response.ok) {
          if (mensaje) mensaje.textContent = 'Mensaje enviado correctamente. Te contactaremos pronto.';
          form.reset();
        } else {
          if (mensaje) mensaje.textContent = 'Hubo un error al enviar. Intenta nuevamente.';
        }
      } catch {
        if (mensaje) mensaje.textContent = 'No se pudo conectar con el servidor. Intenta más tarde.';
      }
    });
  }
}

// Inicializar
document.addEventListener('DOMContentLoaded', () => {
  new HomePage();
});

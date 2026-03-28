/**
 * Building 3D - Visualizacion isometrica tipo Tony Stark
 * Renderiza el esqueleto del edificio en 3D con CSS transforms
 */
class Building3D {
  constructor() {
    this.modal = null;
    this.rotation = { x: -25, y: 45 };
    this.isDragging = false;
    this.lastMouse = { x: 0, y: 0 };
  }

  /**
   * Abrir visualizacion 3D del edificio
   * @param {Object} edificio - datos del edificio
   * @param {Array} oficinas - array de oficinas con piso, nombre, area, estado, etc
   */
  open(edificio, oficinas) {
    // Agrupar oficinas por piso
    const pisos = {};
    oficinas.forEach(ofi => {
      const piso = ofi.piso || 1;
      if (!pisos[piso]) pisos[piso] = [];
      pisos[piso].push(ofi);
    });

    const pisosOrdenados = Object.keys(pisos).map(Number).sort((a, b) => a - b);
    const maxOficinasPorPiso = Math.max(...Object.values(pisos).map(arr => arr.length), 1);
    const totalPisos = pisosOrdenados.length || 1;

    // Crear modal fullscreen
    this.modal = document.createElement('div');
    this.modal.className = 'building-3d-overlay';
    this.modal.innerHTML = `
      <div class="building-3d-container">
        <!-- Header -->
        <div class="building-3d-header">
          <div>
            <h2 class="building-3d-title">${edificio.nombre || edificio.titulo || 'Edificio'}</h2>
            <p class="building-3d-subtitle">${totalPisos} pisos | ${oficinas.length} oficinas | ${edificio.direccion || ''}</p>
          </div>
          <button class="building-3d-close" onclick="this.closest('.building-3d-overlay').remove()">&times;</button>
        </div>

        <!-- Leyenda -->
        <div class="building-3d-legend">
          <span class="legend-item"><span class="legend-dot" style="background: #22c55e;"></span> Libre</span>
          <span class="legend-item"><span class="legend-dot" style="background: #3b82f6;"></span> Alquiler</span>
          <span class="legend-item"><span class="legend-dot" style="background: #f59e0b;"></span> Venta</span>
          <span class="legend-item"><span class="legend-dot" style="background: #8b5cf6;"></span> Ambos</span>
          <span class="legend-item"><span class="legend-dot" style="background: #ef4444;"></span> Ocupada</span>
        </div>

        <!-- Escena 3D -->
        <div class="building-3d-scene">
          <div class="building-3d-perspective" id="building3dPerspective"
               style="transform: rotateX(${this.rotation.x}deg) rotateY(${this.rotation.y}deg);">

            <!-- Grid base -->
            <div class="building-3d-base" style="width: ${maxOficinasPorPiso * 90 + 40}px; height: 20px;">
              <div class="base-grid"></div>
            </div>

            <!-- Pisos -->
            ${pisosOrdenados.map((pisoNum, pisoIdx) => {
              const oficinasDelPiso = pisos[pisoNum];
              return `
                <div class="building-3d-floor" data-piso="${pisoNum}"
                     style="--floor-index: ${pisoIdx}; --total-floors: ${totalPisos};">
                  <div class="floor-label">P${pisoNum}</div>
                  <div class="floor-offices">
                    ${oficinasDelPiso.map(ofi => {
                      const color = this.getColor(ofi);
                      const estado = this.getEstadoLabel(ofi);
                      return `
                        <div class="office-3d" data-office-id="${ofi.registro_cab_id || ''}"
                             style="--office-color: ${color};"
                             title="${ofi.nombre_inmueble || ofi.nombre || 'Oficina'} | ${ofi.area || 0}m2 | ${estado}">
                          <div class="office-top"></div>
                          <div class="office-front">
                            <span class="office-name">${(ofi.nombre_inmueble || ofi.nombre || 'Of.').replace('Oficina ', 'Of.')}</span>
                            <span class="office-area">${ofi.area || 0}m2</span>
                          </div>
                          <div class="office-side"></div>
                          <div class="office-glow"></div>
                        </div>
                      `;
                    }).join('')}
                  </div>
                </div>
              `;
            }).join('')}

            <!-- Antena/techo -->
            <div class="building-3d-roof" style="--total-floors: ${totalPisos};">
              <div class="roof-antenna"></div>
            </div>
          </div>
        </div>

        <!-- Controles -->
        <div class="building-3d-controls">
          <button class="ctrl-btn" data-action="rotate-left" title="Rotar izquierda">&#8592;</button>
          <button class="ctrl-btn" data-action="rotate-right" title="Rotar derecha">&#8594;</button>
          <button class="ctrl-btn" data-action="reset" title="Reset">&#8634;</button>
          <button class="ctrl-btn" data-action="explode" title="Explotar pisos">&#8597;</button>
        </div>

        <!-- Info panel (al hover en oficina) -->
        <div class="building-3d-info" id="building3dInfo" style="display: none;"></div>
      </div>
    `;

    document.body.appendChild(this.modal);
    this.setupInteractions(oficinas);
  }

  getColor(ofi) {
    const estado = (ofi.estado_crm || '').toLowerCase();
    const transaccion = (ofi.transaccion || '').toLowerCase();

    if (estado === 'cerrado_ganado') return '#ef4444'; // Ocupada
    if (transaccion === 'ambos') return '#8b5cf6';
    if (transaccion === 'alquiler') return '#3b82f6';
    if (transaccion === 'venta') return '#f59e0b';
    return '#22c55e'; // Libre
  }

  getEstadoLabel(ofi) {
    const transaccion = (ofi.transaccion || '').toLowerCase();
    if (transaccion === 'ambos') return 'Venta/Alquiler';
    if (transaccion === 'alquiler') return 'Alquiler';
    if (transaccion === 'venta') return 'Venta';
    return 'Libre';
  }

  setupInteractions(oficinas) {
    const perspective = document.getElementById('building3dPerspective');
    if (!perspective) return;

    // Drag para rotar
    this.modal.addEventListener('mousedown', (e) => {
      if (e.target.closest('.ctrl-btn') || e.target.closest('.building-3d-close') || e.target.closest('.building-3d-header')) return;
      this.isDragging = true;
      this.lastMouse = { x: e.clientX, y: e.clientY };
    });

    document.addEventListener('mousemove', (e) => {
      if (!this.isDragging) return;
      const dx = e.clientX - this.lastMouse.x;
      const dy = e.clientY - this.lastMouse.y;
      this.rotation.y += dx * 0.5;
      this.rotation.x = Math.max(-60, Math.min(10, this.rotation.x - dy * 0.3));
      perspective.style.transform = `rotateX(${this.rotation.x}deg) rotateY(${this.rotation.y}deg)`;
      this.lastMouse = { x: e.clientX, y: e.clientY };
    });

    document.addEventListener('mouseup', () => { this.isDragging = false; });

    // Touch support
    this.modal.addEventListener('touchstart', (e) => {
      if (e.target.closest('.ctrl-btn') || e.target.closest('.building-3d-close')) return;
      this.isDragging = true;
      this.lastMouse = { x: e.touches[0].clientX, y: e.touches[0].clientY };
    });

    this.modal.addEventListener('touchmove', (e) => {
      if (!this.isDragging) return;
      e.preventDefault();
      const dx = e.touches[0].clientX - this.lastMouse.x;
      const dy = e.touches[0].clientY - this.lastMouse.y;
      this.rotation.y += dx * 0.5;
      this.rotation.x = Math.max(-60, Math.min(10, this.rotation.x - dy * 0.3));
      perspective.style.transform = `rotateX(${this.rotation.x}deg) rotateY(${this.rotation.y}deg)`;
      this.lastMouse = { x: e.touches[0].clientX, y: e.touches[0].clientY };
    }, { passive: false });

    this.modal.addEventListener('touchend', () => { this.isDragging = false; });

    // Controles
    this.modal.querySelectorAll('.ctrl-btn').forEach(btn => {
      btn.addEventListener('click', (e) => {
        e.stopPropagation();
        const action = btn.dataset.action;
        if (action === 'rotate-left') this.rotation.y -= 45;
        if (action === 'rotate-right') this.rotation.y += 45;
        if (action === 'reset') { this.rotation = { x: -25, y: 45 }; }
        if (action === 'explode') {
          perspective.classList.toggle('exploded');
          return;
        }
        perspective.style.transform = `rotateX(${this.rotation.x}deg) rotateY(${this.rotation.y}deg)`;
      });
    });

    // Hover oficinas
    this.modal.querySelectorAll('.office-3d').forEach(office => {
      office.addEventListener('mouseenter', () => { office.classList.add('hovered'); });
      office.addEventListener('mouseleave', () => { office.classList.remove('hovered'); });
    });

    // Cerrar con ESC
    const escHandler = (e) => {
      if (e.key === 'Escape') { this.modal.remove(); document.removeEventListener('keydown', escHandler); }
    };
    document.addEventListener('keydown', escHandler);

    // Cerrar click fuera
    this.modal.addEventListener('click', (e) => {
      if (e.target === this.modal) this.modal.remove();
    });
  }
}

// Singleton global
if (typeof window !== 'undefined') {
  window.building3D = new Building3D();
}

/**
 * 🗺️ Mapa de Resultados
 * Archivo: search-system/components/results-map.js
 *
 * Muestra propiedades en mapa con marcadores
 * Usa Leaflet (ya cargado en dashboard.html)
 */

class ResultsMap {
  constructor(mainApp) {
    this.mainApp = mainApp;
    this.map = null;
    this.markers = [];
    this.markerCluster = null;
    this.container = null;
  }

  /**
   * Inicializar mapa
   */
  async init() {
    console.log('🗺️ Inicializando ResultsMap...');

    try {
      this.container = document.getElementById('resultsMap');
      if (!this.container) {
        console.warn('⚠️ Contenedor de mapa no encontrado');
        return;
      }

      // Esperar a que Leaflet esté disponible
      if (typeof L === 'undefined') {
        console.error('❌ Leaflet no está cargado');
        return;
      }

      this.createMap();
      console.log('✅ ResultsMap inicializado');
    } catch (error) {
      console.error('❌ Error inicializando ResultsMap:', error);
    }
  }

  /**
   * Crear mapa
   */
  createMap() {
    // Centro de Lima (por defecto)
    const defaultCenter = [-12.0464, -77.0428];
    const defaultZoom = 12;

    // Crear mapa
    this.map = L.map(this.container.id).setView(defaultCenter, defaultZoom);

    // Capa de tiles (OpenStreetMap)
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '© OpenStreetMap contributors',
      maxZoom: 19
    }).addTo(this.map);

    // Custom control: Centrar mapa
    const centerButton = L.Control.extend({
      options: { position: 'topright' },
      onAdd: () => {
        const container = L.DomUtil.create('div', 'leaflet-bar leaflet-control');
        container.innerHTML = `
          <a href="#" title="Centrar mapa" style="display: flex; align-items: center; justify-content: center; width: 30px; height: 30px;">
            <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <circle cx="12" cy="12" r="10"></circle>
              <circle cx="12" cy="12" r="3"></circle>
            </svg>
          </a>
        `;
        container.onclick = (e) => {
          e.preventDefault();
          this.fitAllMarkers();
        };
        return container;
      }
    });

    this.map.addControl(new centerButton());

    console.log('✅ Mapa creado');
  }

  /**
   * Actualizar marcadores con propiedades
   */
  updateMarkers(properties) {
    console.log(`🗺️ Actualizando mapa con ${properties.length} propiedades`);

    // Limpiar marcadores anteriores
    this.clearMarkers();

    // Agregar nuevos marcadores
    properties.forEach(property => {
      if (property.latitud && property.longitud) {
        this.addMarker(property);
      }
    });

    // Ajustar vista para mostrar todos los marcadores
    this.fitAllMarkers();
  }

  /**
   * Agregar marcador
   */
  addMarker(property) {
    const lat = parseFloat(property.latitud);
    const lng = parseFloat(property.longitud);

    if (isNaN(lat) || isNaN(lng)) {
      console.warn(`⚠️ Coordenadas inválidas para propiedad ${property.id}`);
      return;
    }

    // Ícono personalizado según tipo
    const icon = this.createCustomIcon(property);

    // Crear marcador
    const marker = L.marker([lat, lng], { icon })
      .addTo(this.map);

    // Popup con información
    const popupContent = this.createPopupContent(property);
    marker.bindPopup(popupContent);

    // Click en marcador → highlight card
    marker.on('click', () => {
      this.highlightPropertyCard(property.id);
    });

    this.markers.push(marker);
  }

  /**
   * Crear ícono personalizado
   */
  createCustomIcon(property) {
    // Color según estado
    let color = '#2C5282'; // azul corporativo por defecto

    switch (property.estado_nombre?.toLowerCase()) {
      case 'disponible':
        color = '#10B981'; // verde
        break;
      case 'alquilado':
      case 'vendido':
        color = '#6B7280'; // gris
        break;
      case 'en proceso':
        color = '#F59E0B'; // naranja
        break;
    }

    return L.divIcon({
      className: 'custom-marker',
      html: `
        <div class="marker-pin" style="background: ${color};">
          <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="white">
            <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z"/>
          </svg>
        </div>
      `,
      iconSize: [30, 40],
      iconAnchor: [15, 40],
      popupAnchor: [0, -40]
    });
  }

  /**
   * Crear contenido del popup
   */
  createPopupContent(property) {
    const precio = property.precio ? `$ ${this.formatNumber(property.precio)}` : 'Consultar';
    const area = property.area ? `${property.area} m²` : 'N/A';

    return `
      <div class="map-popup" data-property-id="${property.id}">
        <div class="popup-header">
          <strong>${property.codigo || 'N/A'}</strong>
          <span class="status-badge status-${property.estado_nombre?.toLowerCase()?.replace(/\s+/g, '-')}">
            ${property.estado_nombre || 'N/A'}
          </span>
        </div>

        <div class="popup-body">
          <h4>${property.titulo || 'Sin título'}</h4>
          <p class="popup-description">${this.truncate(property.descripcion, 80)}</p>

          <div class="popup-details">
            <div class="detail-row">
              <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect>
              </svg>
              <span>${area}</span>
            </div>
            <div class="detail-row">
              <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <line x1="12" y1="1" x2="12" y2="23"></line>
                <path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"></path>
              </svg>
              <span>${precio}</span>
            </div>
            <div class="detail-row">
              <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"></path>
                <circle cx="12" cy="10" r="3"></circle>
              </svg>
              <span>${property.distrito || 'N/A'}</span>
            </div>
          </div>
        </div>

        <div class="popup-actions">
          <button
            class="btn-popup-view"
            onclick="window.location.href='detalle-propiedad.html?id=${property.id}'"
          >
            Ver Detalles
          </button>
        </div>
      </div>
    `;
  }

  /**
   * Limpiar marcadores
   */
  clearMarkers() {
    this.markers.forEach(marker => marker.remove());
    this.markers = [];
  }

  /**
   * Ajustar vista para mostrar todos los marcadores
   */
  fitAllMarkers() {
    if (this.markers.length === 0) {
      // Volver a centro por defecto
      this.map.setView([-12.0464, -77.0428], 12);
      return;
    }

    const group = L.featureGroup(this.markers);
    this.map.fitBounds(group.getBounds(), {
      padding: [50, 50],
      maxZoom: 15
    });
  }

  /**
   * Highlight card de propiedad
   */
  highlightPropertyCard(propertyId) {
    // Remover highlights anteriores
    document.querySelectorAll('.property-card.highlighted').forEach(card => {
      card.classList.remove('highlighted');
    });

    // Highlight nuevo card
    const card = document.querySelector(`[data-property-id="${propertyId}"]`);
    if (card) {
      card.classList.add('highlighted');

      // Scroll al card
      card.scrollIntoView({ behavior: 'smooth', block: 'center' });

      // Quitar highlight después de 3 segundos
      setTimeout(() => {
        card.classList.remove('highlighted');
      }, 3000);
    }
  }

  /**
   * Helpers
   */
  formatNumber(num) {
    return new Intl.NumberFormat('en-US').format(num);
  }

  truncate(text, maxLength) {
    if (!text) return '';
    if (text.length <= maxLength) return text;
    return text.substring(0, maxLength) + '...';
  }
}

// Exponer globalmente
window.ResultsMap = ResultsMap;

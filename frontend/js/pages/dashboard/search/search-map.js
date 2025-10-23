/**
 * 🗺️ Search Map Module
 * Mapa interactivo con Leaflet
 * Diseño: Replicado de resultados.html
 */

class SearchMapModule {
  constructor(searchController) {
    this.searchController = searchController;
    this.map = null;
    this.markers = [];
    this.markersLayer = null;

    window.searchMapModule = this;
  }

  /**
   * Renderizar módulo de mapa
   */
  async render() {
    console.log('🎨 SearchMapModule.render() called');

    return `
      <!-- Placeholder del Mapa -->
      <div id="mapPlaceholder" class="map-placeholder">
        <div class="placeholder-image-container">
          <img src="https://images.unsplash.com/photo-1497366754035-f200968a6e72?w=1920&h=1080&fit=crop"
               alt="Edificio corporativo"
               class="placeholder-image">
          <div class="placeholder-overlay">
            <i class="fa-solid fa-map-location-dot"></i>
            <h3>Mapa de Resultados</h3>
            <p>Aplica filtros para ver propiedades en el mapa</p>
          </div>
        </div>
      </div>

      <!-- Contenedor del Mapa -->
      <div id="mapCanvas" class="map-canvas" style="display: none;"></div>
    `;
  }

  /**
   * Inicializar el mapa
   */
  initMap() {
    console.log('🗺️ Inicializando mapa Leaflet...');

    const mapContainer = document.getElementById('mapCanvas');
    if (!mapContainer) {
      console.error('❌ Contenedor del mapa no encontrado');
      return;
    }

    // Crear mapa centrado en Lima, Perú
    this.map = L.map('mapCanvas', {
      center: [-12.0464, -77.0428], // Lima, Perú
      zoom: 12,
      zoomControl: true,
      scrollWheelZoom: true
    });

    // Agregar capa de tiles (OpenStreetMap)
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
      maxZoom: 19
    }).addTo(this.map);

    // Crear capa para los marcadores
    this.markersLayer = L.layerGroup().addTo(this.map);

    console.log('✅ Mapa inicializado correctamente');
  }

  /**
   * Actualizar marcadores en el mapa
   */
  async updateMarkers(properties) {
    console.log('📍 Actualizando marcadores del mapa...', properties.length);

    if (!properties || properties.length === 0) {
      this.hideMap();
      return;
    }

    // Mostrar mapa si está oculto
    this.showMap();

    // Si el mapa no está inicializado, inicializarlo
    if (!this.map) {
      this.initMap();
    }

    // Limpiar marcadores anteriores
    this.clearMarkers();

    // Filtrar propiedades con coordenadas válidas
    const propertiesWithCoords = properties.filter(prop =>
      prop.latitud && prop.longitud &&
      !isNaN(parseFloat(prop.latitud)) &&
      !isNaN(parseFloat(prop.longitud))
    );

    console.log(`📍 ${propertiesWithCoords.length} de ${properties.length} propiedades tienen coordenadas`);

    if (propertiesWithCoords.length === 0) {
      showNotification('Las propiedades no tienen coordenadas para mostrar en el mapa', 'warning');
      this.hideMap();
      return;
    }

    // Crear marcadores
    const bounds = [];

    propertiesWithCoords.forEach((prop, index) => {
      const lat = parseFloat(prop.latitud);
      const lng = parseFloat(prop.longitud);
      const propId = prop.registro_cab_id || prop.id || prop.propiedad_id;

      // Agregar coordenadas a los bounds
      bounds.push([lat, lng]);

      // Precio según transacción
      let precio = 'Precio no disponible';
      if (prop.precio_compra || prop.precio_venta) {
        precio = `S/ ${parseFloat(prop.precio_compra || prop.precio_venta).toLocaleString('es-PE')}`;
      } else if (prop.precio_alquiler) {
        precio = `S/ ${parseFloat(prop.precio_alquiler).toLocaleString('es-PE')}/mes`;
      }

      // Imagen
      const imagen = prop.imagen_principal || 'https://via.placeholder.com/300x200?text=Sin+Imagen';

      // Crear ícono personalizado
      const icon = L.divIcon({
        className: 'custom-marker',
        html: `
          <div class="marker-pin">
            <span class="marker-number">${index + 1}</span>
          </div>
        `,
        iconSize: [40, 40],
        iconAnchor: [20, 40],
        popupAnchor: [0, -40]
      });

      // Crear marcador
      const marker = L.marker([lat, lng], { icon: icon });

      // Popup con información de la propiedad
      const popupContent = `
        <div class="map-popup">
          <img src="${imagen}" alt="${prop.titulo || 'Propiedad'}" class="popup-image"
               onerror="this.src='https://via.placeholder.com/300x200?text=Sin+Imagen'">
          <div class="popup-content">
            <h4 class="popup-title">${prop.titulo || 'Sin título'}</h4>
            <p class="popup-location">
              <i class="fa-solid fa-location-dot"></i>
              ${prop.direccion || prop.ubicacion || 'Ubicación no especificada'}
            </p>
            <p class="popup-price">${precio}</p>
            <div class="popup-features">
              ${prop.area ? `<span>📐 ${prop.area} m²</span>` : ''}
              ${prop.habitaciones ? `<span>🛏️ ${prop.habitaciones} hab.</span>` : ''}
              ${prop.banos ? `<span>🚿 ${prop.banos} baños</span>` : ''}
            </div>
            <button class="btn btn-primary btn-sm" onclick="window.open('/propiedad/${propId}', '_blank')">
              Ver Detalles
            </button>
          </div>
        </div>
      `;

      marker.bindPopup(popupContent, {
        maxWidth: 300,
        className: 'custom-popup'
      });

      // Agregar marcador a la capa
      this.markersLayer.addLayer(marker);
      this.markers.push(marker);
    });

    // Ajustar vista del mapa para mostrar todos los marcadores
    if (bounds.length > 0) {
      this.map.fitBounds(bounds, {
        padding: [50, 50],
        maxZoom: 15
      });
    }

    console.log('✅ Marcadores actualizados:', this.markers.length);
  }

  /**
   * Limpiar marcadores del mapa
   */
  clearMarkers() {
    if (this.markersLayer) {
      this.markersLayer.clearLayers();
    }
    this.markers = [];
  }

  /**
   * Mostrar mapa
   */
  showMap() {
    const placeholder = document.getElementById('mapPlaceholder');
    const mapCanvas = document.getElementById('mapCanvas');

    if (placeholder) {
      placeholder.style.display = 'none';
    }

    if (mapCanvas) {
      mapCanvas.style.display = 'block';

      // Invalidar tamaño del mapa (necesario para Leaflet)
      setTimeout(() => {
        if (this.map) {
          this.map.invalidateSize();
        }
      }, 100);
    }
  }

  /**
   * Ocultar mapa
   */
  hideMap() {
    const placeholder = document.getElementById('mapPlaceholder');
    const mapCanvas = document.getElementById('mapCanvas');

    if (placeholder) {
      placeholder.style.display = 'block';
    }

    if (mapCanvas) {
      mapCanvas.style.display = 'none';
    }

    this.clearMarkers();
  }

  /**
   * Centrar mapa en una coordenada
   */
  centerMap(lat, lng, zoom = 14) {
    if (this.map) {
      this.map.setView([lat, lng], zoom);
    }
  }

  /**
   * Abrir popup de un marcador específico
   */
  openMarkerPopup(index) {
    if (this.markers[index]) {
      this.markers[index].openPopup();
    }
  }

  /**
   * Setup event listeners
   */
  setupEventListeners() {
    console.log('🎛️ SearchMapModule.setupEventListeners() called');

    // El mapa se inicializa cuando se muestran resultados
    // No hay listeners específicos que configurar aquí
  }

  /**
   * Destruir mapa (cleanup)
   */
  destroy() {
    console.log('🗑️ Destruyendo mapa...');

    if (this.map) {
      this.map.remove();
      this.map = null;
    }

    this.clearMarkers();
    this.markersLayer = null;
  }
}

// Exportar clase a window
window.SearchMapModule = SearchMapModule;

let searchMapModule;

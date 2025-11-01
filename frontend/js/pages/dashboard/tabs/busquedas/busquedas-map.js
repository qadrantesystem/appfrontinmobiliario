/**
 * 🗺️ Búsquedas Map - Manejo del Mapa de Resultados
 * Maneja el mapa de Leaflet con marcadores numerados
 * ~250 líneas - Separado para mantener arquitectura limpia
 */

class BusquedasMap {
  constructor(busquedasTab) {
    this.tab = busquedasTab;
    this.map = null;
    this.markers = [];
  }

  /**
   * Inicializar mapa
   */
  init() {
    const mapContainer = this.tab.container.querySelector('#busquedasMap');
    if (!mapContainer) return;

    // Crear mapa centrado en Lima
    this.map = L.map('busquedasMap').setView([-12.0464, -77.0428], 13);

    // Agregar capa de OpenStreetMap
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '&copy; OpenStreetMap contributors',
      maxZoom: 19
    }).addTo(this.map);

    console.log('✅ Mapa inicializado');
  }

  /**
   * Actualizar marcadores en el mapa
   */
  updateMarkers(properties, startNumber = 1) {
    if (!this.map) return;

    // Limpiar marcadores previos
    this.clearMarkers();

    const bounds = [];

    properties.forEach((prop, index) => {
      const lat = parseFloat(prop.latitud);
      const lng = parseFloat(prop.longitud);

      if (isNaN(lat) || isNaN(lng)) return;

      // Agregar offset aleatorio para evitar solapamiento
      const latOffset = (Math.random() - 0.5) * 0.002;
      const lngOffset = (Math.random() - 0.5) * 0.002;
      const offsetLat = lat + latOffset;
      const offsetLng = lng + lngOffset;

      const number = startNumber + index;

      // Crear marcador con número
      const marker = L.marker([offsetLat, offsetLng], {
        icon: this.createNumberedIcon(number)
      });

      marker.propertyId = prop.registro_cab_id;
      marker.propertyNumber = number;

      // Popup
      marker.bindPopup(`
        <div style="text-align: center;">
          <strong>${prop.titulo || 'Propiedad'}</strong><br>
          <small>${prop.direccion || prop.distrito || ''}</small>
        </div>
      `);

      marker.addTo(this.map);
      this.markers.push(marker);

      bounds.push([offsetLat, offsetLng]);
    });

    // Ajustar vista a los marcadores
    if (bounds.length > 0) {
      this.map.fitBounds(bounds, { padding: [50, 50] });
    }
  }

  /**
   * Crear icono numerado
   */
  createNumberedIcon(number) {
    return L.divIcon({
      className: 'custom-number-marker',
      html: `<div>${number}</div>`,
      iconSize: [36, 36],
      iconAnchor: [18, 18]
    });
  }

  /**
   * Limpiar todos los marcadores
   */
  clearMarkers() {
    this.markers.forEach(marker => marker.remove());
    this.markers = [];
  }

  /**
   * Resaltar marcador
   */
  highlightMarker(number, isHover = false, isClick = false) {
    if (!this.map) return;

    // Remover resaltado de todos los marcadores
    this.tab.container.querySelectorAll('.custom-number-marker > div').forEach(markerDiv => {
      markerDiv.style.transform = 'scale(1)';
      markerDiv.style.zIndex = '1000';
      markerDiv.style.background = '#2C5282'; // Azul por defecto
      markerDiv.style.boxShadow = '0 3px 10px rgba(0, 0, 0, 0.3)';
    });

    // Resaltar el marcador correspondiente
    const markers = this.tab.container.querySelectorAll('.custom-number-marker > div');
    markers.forEach(markerDiv => {
      const markerText = markerDiv.textContent.trim();
      if (parseInt(markerText) === number) {
        if (isHover) {
          // Hover: solo hacer más grande
          markerDiv.style.transform = 'scale(1.3)';
          markerDiv.style.zIndex = '2000';
        } else if (isClick) {
          // Click: pintar de amarillo y hacer más grande
          markerDiv.style.transform = 'scale(1.4)';
          markerDiv.style.zIndex = '3000';
          markerDiv.style.background = '#E8A317'; // Amarillo
          markerDiv.style.boxShadow = '0 4px 12px rgba(232, 163, 23, 0.6)';
        } else {
          // Mouseleave: volver a normal
          markerDiv.style.transform = 'scale(1)';
          markerDiv.style.zIndex = '1000';
        }
      }
    });
  }

  /**
   * Centrar mapa en una coordenada
   */
  centerOn(lat, lng, zoom = 16) {
    if (!this.map) return;
    this.map.setView([lat, lng], zoom);
  }

  /**
   * Obtener el marcador por número
   */
  getMarkerByNumber(number) {
    return this.markers.find(m => m.propertyNumber === number);
  }

  /**
   * Destruir mapa
   */
  destroy() {
    if (this.map) {
      this.map.remove();
      this.map = null;
    }
    this.markers = [];
  }
}

// Exportar para uso en busquedas.js
if (typeof window !== 'undefined') {
  window.BusquedasMap = BusquedasMap;
}

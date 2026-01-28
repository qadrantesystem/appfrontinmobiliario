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
      const esCombinacion = prop.tipo === 'combinacion';

      // Crear marcador con número (verde para combinaciones)
      const marker = L.marker([offsetLat, offsetLng], {
        icon: esCombinacion
          ? this.createCombinationIcon(number)
          : this.createNumberedIcon(number)
      });

      marker.propertyId = esCombinacion ? prop.edificio_id : prop.registro_cab_id;
      marker.propertyNumber = number;
      marker.isCombination = esCombinacion;

      // Popup (diferente para combinaciones vs individuales)
      const popupContent = esCombinacion
        ? `<div style="text-align: center;">
            <div style="background: #4CAF50; color: white; padding: 4px 8px; border-radius: 4px; margin-bottom: 6px; font-size: 11px;">
              🔗 COMBINACIÓN
            </div>
            <strong>${prop.edificio_nombre || 'Edificio'}</strong><br>
            <small>📐 ${prop.area_total} m² | Piso ${prop.piso}</small><br>
            <small>📍 ${prop.distrito || ''}</small>
          </div>`
        : `<div style="text-align: center;">
            ${prop.edificio_nombre ? `
              <div style="background: #0066CC; color: white; padding: 4px 8px; border-radius: 4px; margin-bottom: 6px; font-size: 11px;">
                🏢 ${prop.edificio_nombre}
              </div>
            ` : ''}
            <strong>${prop.titulo || prop.nombre_inmueble || 'Oficina'}</strong><br>
            <small>📐 ${prop.area || 0} m²</small><br>
            <small>📍 ${prop.direccion || prop.distrito || ''}</small>
          </div>`;

      marker.bindPopup(popupContent);

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
   * Crear icono numerado (azul por defecto)
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
   * Crear icono verde para combinaciones
   */
  createCombinationIcon(number) {
    return L.divIcon({
      className: 'custom-number-marker combination-marker',
      html: `<div style="background: #4CAF50 !important; border: 3px solid #2e7d32 !important;">🔗 ${number}</div>`,
      iconSize: [44, 44],
      iconAnchor: [22, 22]
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

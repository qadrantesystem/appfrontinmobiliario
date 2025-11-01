/**
 * 📄 Generador de Fichas PDF A4
 * Archivo: search-system/services/pdf-generator.service.js
 *
 * Genera fichas profesionales en PDF con:
 * - 4 imágenes
 * - Características
 * - Detalles
 * - Logo Quadrante
 * - Grilla con propiedades generales
 *
 * Requiere: jsPDF y html2canvas
 */

class PDFGenerator {
  constructor(mainApp) {
    this.mainApp = mainApp;
    this.logoUrl = 'assets/images/logos/logo.jpg'; // Logo de Quadrante
  }

  /**
   * Generar fichas PDF
   */
  async generate(properties) {
    console.log(`📄 Generando ${properties.length} fichas PDF...`);

    if (typeof jsPDF === 'undefined') {
      console.error('❌ jsPDF no está cargado');
      showNotification('❌ Librería PDF no disponible', 'error');
      return;
    }

    try {
      // Mostrar loading
      Swal.fire({
        title: 'Generando Fichas PDF',
        html: `Procesando <strong>0</strong> de <strong>${properties.length}</strong> propiedades...`,
        allowOutsideClick: false,
        allowEscapeKey: false,
        showConfirmButton: false,
        didOpen: () => {
          Swal.showLoading();
        }
      });

      // Crear un PDF por propiedad
      const pdfPromises = properties.map((property, index) =>
        this.generateSinglePDF(property, index, properties.length)
      );

      const pdfs = await Promise.all(pdfPromises);

      // Cerrar loading
      Swal.close();

      // Ofrecer descarga
      await this.offerDownload(pdfs, properties);

      showNotification('✅ Fichas generadas correctamente', 'success');

    } catch (error) {
      console.error('❌ Error generando PDFs:', error);
      Swal.close();
      showNotification('❌ Error al generar fichas', 'error');
    }
  }

  /**
   * Generar PDF de una propiedad
   */
  async generateSinglePDF(property, index, total) {
    console.log(`📄 Generando ficha ${index + 1}/${total}: ${property.codigo}`);

    // Actualizar loading
    Swal.update({
      html: `Procesando <strong>${index + 1}</strong> de <strong>${total}</strong> propiedades...`
    });

    // Crear HTML de la ficha
    const fichaHTML = await this.createFichaHTML(property);

    // Crear PDF usando jsPDF
    const pdf = new jsPDF({
      orientation: 'portrait',
      unit: 'mm',
      format: 'a4'
    });

    // Convertir HTML a canvas usando html2canvas
    const container = document.createElement('div');
    container.style.position = 'absolute';
    container.style.left = '-9999px';
    container.innerHTML = fichaHTML;
    document.body.appendChild(container);

    try {
      const canvas = await html2canvas(container, {
        scale: 2,
        logging: false,
        useCORS: true
      });

      const imgData = canvas.toDataURL('image/png');
      const imgWidth = 210; // A4 width in mm
      const imgHeight = (canvas.height * imgWidth) / canvas.width;

      pdf.addImage(imgData, 'PNG', 0, 0, imgWidth, imgHeight);

      document.body.removeChild(container);

      return {
        pdf,
        filename: `Ficha_${property.codigo || property.id}.pdf`,
        property
      };

    } catch (error) {
      console.error(`❌ Error generando PDF para ${property.codigo}:`, error);
      document.body.removeChild(container);
      throw error;
    }
  }

  /**
   * Crear HTML de la ficha
   */
  async createFichaHTML(property) {
    // Tomar máximo 4 imágenes
    const imagenes = (property.imagenes || []).slice(0, 4);

    return `
      <div class="pdf-ficha" style="
        width: 210mm;
        min-height: 297mm;
        padding: 20mm;
        background: white;
        font-family: Arial, sans-serif;
        color: #333;
      ">
        <!-- Header con Logo -->
        <div class="ficha-header" style="
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 20px;
          padding-bottom: 15px;
          border-bottom: 3px solid #2C5282;
        ">
          <img src="${this.logoUrl}" alt="Quadrante" style="height: 50px;">
          <div style="text-align: right;">
            <h2 style="margin: 0; color: #2C5282; font-size: 24px;">
              ${property.codigo || 'N/A'}
            </h2>
            <p style="margin: 5px 0 0 0; font-size: 12px; color: #6B7280;">
              ${new Date().toLocaleDateString('es-PE', { year: 'numeric', month: 'long', day: 'numeric' })}
            </p>
          </div>
        </div>

        <!-- Título y Ubicación -->
        <div class="ficha-titulo" style="margin-bottom: 20px;">
          <h1 style="margin: 0 0 10px 0; font-size: 22px; color: #1F2937;">
            ${property.titulo || 'Sin título'}
          </h1>
          <div style="display: flex; gap: 15px; font-size: 14px; color: #6B7280;">
            <span>📍 ${property.direccion || 'N/A'}</span>
            <span>• ${property.distrito || 'N/A'}</span>
            <span>• ${property.departamento || 'Lima'}</span>
          </div>
        </div>

        <!-- Grid de 4 Imágenes -->
        <div class="ficha-imagenes" style="
          display: grid;
          grid-template-columns: repeat(2, 1fr);
          gap: 10px;
          margin-bottom: 20px;
        ">
          ${imagenes.length > 0 ? imagenes.map(img => `
            <div style="
              width: 100%;
              height: 120px;
              background: #F3F4F6;
              border-radius: 8px;
              overflow: hidden;
            ">
              <img src="${img.url}" alt="${img.descripcion || ''}" style="
                width: 100%;
                height: 100%;
                object-fit: cover;
              ">
            </div>
          `).join('') : `
            <div style="grid-column: 1 / -1; text-align: center; padding: 40px; background: #F3F4F6; border-radius: 8px;">
              <p style="margin: 0; color: #9CA3AF;">Sin imágenes disponibles</p>
            </div>
          `}
        </div>

        <!-- Descripción -->
        <div class="ficha-descripcion" style="
          margin-bottom: 20px;
          padding: 15px;
          background: #F9FAFB;
          border-left: 4px solid #2C5282;
          border-radius: 4px;
        ">
          <h3 style="margin: 0 0 10px 0; font-size: 16px; color: #2C5282;">
            Descripción
          </h3>
          <p style="margin: 0; font-size: 13px; line-height: 1.6; color: #4B5563;">
            ${property.descripcion || 'Sin descripción disponible'}
          </p>
        </div>

        <!-- Grilla de Características Principales -->
        <div class="ficha-caracteristicas" style="margin-bottom: 20px;">
          <h3 style="margin: 0 0 15px 0; font-size: 18px; color: #1F2937;">
            Características Principales
          </h3>
          <table style="
            width: 100%;
            border-collapse: collapse;
            font-size: 13px;
          ">
            <tr style="background: #F3F4F6;">
              <td style="padding: 10px; border: 1px solid #E5E7EB; font-weight: bold;">Área Total</td>
              <td style="padding: 10px; border: 1px solid #E5E7EB;">${property.area || 'N/A'} m²</td>
              <td style="padding: 10px; border: 1px solid #E5E7EB; font-weight: bold;">Área Ocupada</td>
              <td style="padding: 10px; border: 1px solid #E5E7EB;">${property.area_ocupada || 'N/A'} m²</td>
            </tr>
            <tr>
              <td style="padding: 10px; border: 1px solid #E5E7EB; font-weight: bold;">Precio ${property.operacion === 'alquiler' ? 'Alquiler' : 'Venta'}</td>
              <td style="padding: 10px; border: 1px solid #E5E7EB; color: #2C5282; font-weight: bold;">
                $ ${this.formatNumber(property.precio || 0)}
              </td>
              <td style="padding: 10px; border: 1px solid #E5E7EB; font-weight: bold;">Estado</td>
              <td style="padding: 10px; border: 1px solid #E5E7EB;">
                <span style="
                  padding: 4px 12px;
                  background: ${this.getStatusColor(property.estado_nombre)};
                  color: white;
                  border-radius: 4px;
                  font-size: 11px;
                ">
                  ${property.estado_nombre || 'N/A'}
                </span>
              </td>
            </tr>
            <tr style="background: #F3F4F6;">
              <td style="padding: 10px; border: 1px solid #E5E7EB; font-weight: bold;">Antigüedad</td>
              <td style="padding: 10px; border: 1px solid #E5E7EB;">${property.antiguedad || 'N/A'} años</td>
              <td style="padding: 10px; border: 1px solid #E5E7EB; font-weight: bold;">Parqueos</td>
              <td style="padding: 10px; border: 1px solid #E5E7EB;">${property.parqueos || 0}</td>
            </tr>
            <tr>
              <td style="padding: 10px; border: 1px solid #E5E7EB; font-weight: bold;">Altura Edificio</td>
              <td style="padding: 10px; border: 1px solid #E5E7EB;">${property.altura_edificio || 'N/A'} pisos</td>
              <td style="padding: 10px; border: 1px solid #E5E7EB; font-weight: bold;">Implementación</td>
              <td style="padding: 10px; border: 1px solid #E5E7EB;">${property.implementacion_nombre || 'N/A'}</td>
            </tr>
            <tr style="background: #F3F4F6;">
              <td style="padding: 10px; border: 1px solid #E5E7EB; font-weight: bold;">Disponibilidad</td>
              <td style="padding: 10px; border: 1px solid #E5E7EB;">${property.disponibilidad || 'N/A'}</td>
              <td style="padding: 10px; border: 1px solid #E5E7EB; font-weight: bold;">Tipo de Venta</td>
              <td style="padding: 10px; border: 1px solid #E5E7EB;">${property.cafet_nombre || 'N/A'}</td>
            </tr>
          </table>
        </div>

        <!-- Servicios y Equipamiento -->
        <div class="ficha-servicios" style="margin-bottom: 20px;">
          <h3 style="margin: 0 0 15px 0; font-size: 18px; color: #1F2937;">
            Servicios y Equipamiento
          </h3>
          <div style="display: grid; grid-template-columns: repeat(2, 1fr); gap: 10px; font-size: 13px;">
            ${this.renderServicios(property)}
          </div>
        </div>

        <!-- Footer -->
        <div class="ficha-footer" style="
          margin-top: 30px;
          padding-top: 15px;
          border-top: 2px solid #E5E7EB;
          text-align: center;
          font-size: 11px;
          color: #6B7280;
        ">
          <p style="margin: 0;">
            Documento generado automáticamente por <strong>Quadrante</strong>
          </p>
          <p style="margin: 5px 0 0 0;">
            www.quadrante.com | contacto@quadrante.com | +51 XXX XXX XXX
          </p>
        </div>
      </div>
    `;
  }

  /**
   * Render servicios
   */
  renderServicios(property) {
    const servicios = [
      { key: 'ascensores', label: 'Ascensores', icon: '🛗' },
      { key: 'grupo_electrogeno', label: 'Grupo Electrógeno', icon: '⚡' },
      { key: 'fibra_optica', label: 'Fibra Óptica', icon: '🌐' },
      { key: 'seguridad_24h', label: 'Seguridad 24h', icon: '🛡️' },
      { key: 'estacionamiento_visitas', label: 'Est. Visitas', icon: '🅿️' },
      { key: 'aire_acondicionado', label: 'Aire Acondicionado', icon: '❄️' }
    ];

    return servicios.map(servicio => {
      const value = property[servicio.key];
      const hasService = value === true || value === 'si' || value > 0;

      return `
        <div style="
          display: flex;
          align-items: center;
          gap: 8px;
          padding: 8px;
          background: ${hasService ? '#ECFDF5' : '#F3F4F6'};
          border-radius: 6px;
        ">
          <span style="font-size: 18px;">${servicio.icon}</span>
          <span style="color: ${hasService ? '#059669' : '#9CA3AF'};">
            ${servicio.label}
            ${typeof value === 'number' ? `: ${value}` : ''}
          </span>
        </div>
      `;
    }).join('');
  }

  /**
   * Ofrecer descarga
   */
  async offerDownload(pdfs, properties) {
    if (pdfs.length === 1) {
      // Descargar directamente
      pdfs[0].pdf.save(pdfs[0].filename);
    } else {
      // Opción de descargar todas o individualmente
      const result = await Swal.fire({
        title: 'Fichas Generadas',
        html: `
          <p>Se generaron <strong>${pdfs.length}</strong> fichas PDF.</p>
          <p>¿Cómo deseas descargarlas?</p>
        `,
        icon: 'success',
        showCancelButton: true,
        showDenyButton: true,
        confirmButtonText: 'Descargar Todas',
        denyButtonText: 'Descargar ZIP',
        cancelButtonText: 'Cancelar',
        confirmButtonColor: '#2C5282'
      });

      if (result.isConfirmed) {
        // Descargar todas individualmente
        pdfs.forEach(({ pdf, filename }) => {
          pdf.save(filename);
        });
      } else if (result.isDenied) {
        // TODO: Crear ZIP (requiere librería JSZip)
        showNotification('⚠️ Descarga ZIP próximamente', 'info');
      }
    }
  }

  /**
   * Helpers
   */
  formatNumber(num) {
    return new Intl.NumberFormat('en-US').format(num);
  }

  getStatusColor(status) {
    const colors = {
      'disponible': '#10B981',
      'alquilado': '#6B7280',
      'vendido': '#6B7280',
      'en proceso': '#F59E0B'
    };
    return colors[status?.toLowerCase()] || '#6B7280';
  }
}

// Exponer globalmente
window.PDFGenerator = PDFGenerator;

/**
 * 📧 Servicio de Envío por Correo
 * Archivo: search-system/services/email.service.js
 *
 * Envía fichas PDF generadas por correo electrónico
 * Adjunta hasta 4 fichas por correo
 */

class EmailService {
  constructor(mainApp) {
    this.mainApp = mainApp;
  }

  /**
   * Enviar correo con fichas adjuntas
   */
  async sendWithAttachments(properties) {
    console.log(`📧 Preparando envío de ${properties.length} fichas por correo...`);

    try {
      // Solicitar datos del correo
      const emailData = await this.promptEmailData(properties.length);
      if (!emailData) {
        console.log('❌ Envío cancelado por el usuario');
        return;
      }

      // Generar PDFs
      Swal.fire({
        title: 'Generando Fichas',
        text: 'Preparando PDFs para enviar...',
        allowOutsideClick: false,
        allowEscapeKey: false,
        showConfirmButton: false,
        didOpen: () => {
          Swal.showLoading();
        }
      });

      const pdfGenerator = this.mainApp.pdfGenerator || new PDFGenerator(this.mainApp);
      const pdfs = await Promise.all(
        properties.map(prop => pdfGenerator.generateSinglePDF(prop, 0, properties.length))
      );

      // Convertir PDFs a Base64 para enviar
      const attachments = await Promise.all(
        pdfs.map(async ({ pdf, filename }) => ({
          filename,
          content: this.pdfToBase64(pdf),
          type: 'application/pdf',
          disposition: 'attachment'
        }))
      );

      // Enviar correo
      Swal.update({
        title: 'Enviando Correo',
        text: 'Por favor espera...'
      });

      await this.sendEmail(emailData, attachments, properties);

      Swal.close();
      showNotification('✅ Correo enviado correctamente', 'success');

    } catch (error) {
      console.error('❌ Error enviando correo:', error);
      Swal.close();
      showNotification('❌ Error al enviar correo', 'error');
    }
  }

  /**
   * Prompt para datos del correo
   */
  async promptEmailData(totalFichas) {
    const { value: formValues } = await Swal.fire({
      title: 'Enviar Fichas por Correo',
      html: `
        <div style="text-align: left;">
          <p style="margin-bottom: 15px; color: #6B7280;">
            Se enviarán <strong>${totalFichas}</strong> ficha(s) adjuntas
          </p>

          <div style="margin-bottom: 15px;">
            <label style="display: block; margin-bottom: 5px; font-weight: 600; color: #374151;">
              Correo Destinatario:
            </label>
            <input
              type="email"
              id="swal-email-to"
              class="swal2-input"
              placeholder="cliente@example.com"
              style="margin: 0; width: 100%;"
            >
          </div>

          <div style="margin-bottom: 15px;">
            <label style="display: block; margin-bottom: 5px; font-weight: 600; color: #374151;">
              Asunto:
            </label>
            <input
              type="text"
              id="swal-email-subject"
              class="swal2-input"
              value="Fichas de Propiedades - Quadrante"
              style="margin: 0; width: 100%;"
            >
          </div>

          <div style="margin-bottom: 15px;">
            <label style="display: block; margin-bottom: 5px; font-weight: 600; color: #374151;">
              Mensaje:
            </label>
            <textarea
              id="swal-email-message"
              class="swal2-textarea"
              placeholder="Mensaje personalizado (opcional)"
              style="margin: 0; width: 100%; min-height: 100px;"
            >Estimado cliente,

Adjunto encontrará las fichas de las propiedades seleccionadas.

Quedo atento a cualquier consulta.

Saludos cordiales,
Equipo Quadrante</textarea>
          </div>

          <div style="margin-bottom: 10px;">
            <label style="display: flex; align-items: center; gap: 8px; cursor: pointer;">
              <input
                type="checkbox"
                id="swal-email-copy"
                checked
                style="margin: 0;"
              >
              <span style="font-size: 14px; color: #6B7280;">
                Enviarme una copia
              </span>
            </label>
          </div>
        </div>
      `,
      focusConfirm: false,
      showCancelButton: true,
      confirmButtonText: 'Enviar',
      cancelButtonText: 'Cancelar',
      confirmButtonColor: '#2C5282',
      width: '600px',
      preConfirm: () => {
        const to = document.getElementById('swal-email-to').value;
        const subject = document.getElementById('swal-email-subject').value;
        const message = document.getElementById('swal-email-message').value;
        const sendCopy = document.getElementById('swal-email-copy').checked;

        if (!to) {
          Swal.showValidationMessage('El correo destinatario es requerido');
          return false;
        }

        if (!this.validateEmail(to)) {
          Swal.showValidationMessage('Correo destinatario inválido');
          return false;
        }

        if (!subject) {
          Swal.showValidationMessage('El asunto es requerido');
          return false;
        }

        return {
          to,
          subject,
          message: message || '',
          sendCopy
        };
      }
    });

    return formValues;
  }

  /**
   * Enviar correo al backend
   */
  async sendEmail(emailData, attachments, properties) {
    console.log('📧 Enviando correo a:', emailData.to);

    const token = authService.getToken();

    // Construir HTML del correo
    const htmlContent = this.buildEmailHTML(emailData.message, properties);

    const response = await fetch(`${API_CONFIG.BASE_URL}/send-email/`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        to: emailData.to,
        subject: emailData.subject,
        html: htmlContent,
        attachments: attachments,
        send_copy: emailData.sendCopy
      })
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.detail || 'Error al enviar correo');
    }

    const result = await response.json();
    console.log('✅ Correo enviado:', result);

    return result;
  }

  /**
   * Construir HTML del correo
   */
  buildEmailHTML(message, properties) {
    const propertyList = properties.map(prop => `
      <li style="margin-bottom: 10px;">
        <strong>${prop.codigo || 'N/A'}</strong> - ${prop.titulo || 'Sin título'}
        <br>
        <span style="color: #6B7280; font-size: 13px;">
          ${prop.distrito || 'N/A'} • ${prop.area || 'N/A'} m² • $ ${this.formatNumber(prop.precio || 0)}
        </span>
      </li>
    `).join('');

    return `
      <!DOCTYPE html>
      <html lang="es">
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Fichas de Propiedades - Quadrante</title>
      </head>
      <body style="
        font-family: Arial, sans-serif;
        line-height: 1.6;
        color: #333;
        max-width: 600px;
        margin: 0 auto;
        padding: 20px;
      ">
        <!-- Header -->
        <div style="
          text-align: center;
          padding: 20px 0;
          border-bottom: 3px solid #2C5282;
          margin-bottom: 30px;
        ">
          <h1 style="
            margin: 0;
            color: #2C5282;
            font-size: 28px;
          ">Quadrante</h1>
          <p style="
            margin: 5px 0 0 0;
            color: #6B7280;
            font-size: 14px;
          ">Servicios Inmobiliarios</p>
        </div>

        <!-- Mensaje -->
        <div style="
          background: #F9FAFB;
          padding: 20px;
          border-left: 4px solid #2C5282;
          margin-bottom: 30px;
        ">
          <p style="margin: 0; white-space: pre-line;">
            ${message}
          </p>
        </div>

        <!-- Lista de Propiedades -->
        <div style="margin-bottom: 30px;">
          <h2 style="
            color: #1F2937;
            font-size: 18px;
            margin-bottom: 15px;
          ">Propiedades Adjuntas (${properties.length}):</h2>
          <ul style="
            list-style: none;
            padding: 0;
            margin: 0;
          ">
            ${propertyList}
          </ul>
        </div>

        <!-- Footer -->
        <div style="
          text-align: center;
          padding-top: 20px;
          border-top: 2px solid #E5E7EB;
          color: #6B7280;
          font-size: 13px;
        ">
          <p style="margin: 0 0 10px 0;">
            <strong>Quadrante</strong>
          </p>
          <p style="margin: 0;">
            www.quadrante.com | contacto@quadrante.com | +51 XXX XXX XXX
          </p>
          <p style="margin: 10px 0 0 0; font-size: 11px;">
            Este correo fue generado automáticamente. Por favor no responder.
          </p>
        </div>
      </body>
      </html>
    `;
  }

  /**
   * Convertir PDF a Base64
   */
  pdfToBase64(pdf) {
    const output = pdf.output('datauristring');
    // Remover el prefijo "data:application/pdf;base64,"
    return output.split(',')[1];
  }

  /**
   * Validar email
   */
  validateEmail(email) {
    const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return re.test(email);
  }

  /**
   * Helpers
   */
  formatNumber(num) {
    return new Intl.NumberFormat('en-US').format(num);
  }
}

// Exponer globalmente
window.EmailService = EmailService;

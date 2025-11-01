/**
 * 💾 Búsquedas Actions - Guardar y Compartir
 * Maneja las acciones de guardar búsqueda y compartir por correo/WhatsApp
 * ~200 líneas - Separado para mantener arquitectura limpia
 */

class BusquedasActions {
  constructor(busquedasTab) {
    this.tab = busquedasTab;
  }

  /**
   * Guardar búsqueda actual
   */
  async guardar() {
    if (!authService.isAuthenticated()) {
      await Swal.fire({
        icon: 'warning',
        title: 'Sesión requerida',
        text: 'Debes iniciar sesión para guardar búsquedas',
        confirmButtonColor: '#0066CC'
      });
      return;
    }

    if (!this.tab.currentFilters || Object.keys(this.tab.currentFilters).length === 0) {
      await Swal.fire({
        icon: 'info',
        title: 'Sin filtros',
        text: 'No hay filtros activos para guardar',
        confirmButtonColor: '#0066CC'
      });
      return;
    }

    // Pedir nombre de búsqueda con SweetAlert2
    const { value: nombre } = await Swal.fire({
      title: '💾 Guardar Búsqueda',
      input: 'text',
      inputLabel: 'Nombre de la búsqueda',
      inputPlaceholder: 'Ej: Oficinas San Isidro',
      inputValue: '',
      showCancelButton: true,
      confirmButtonText: 'Guardar',
      cancelButtonText: 'Cancelar',
      confirmButtonColor: '#0066CC',
      inputValidator: (value) => {
        if (!value) {
          return 'Por favor ingresa un nombre';
        }
      }
    });

    if (!nombre) return;

    try {
      // Mostrar loading
      Swal.fire({
        title: 'Guardando...',
        text: 'Por favor espera',
        allowOutsideClick: false,
        didOpen: () => {
          Swal.showLoading();
        }
      });

      const response = await fetch(`${API_CONFIG.BASE_URL}/busquedas/guardadas`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${authService.getToken()}`
        },
        body: JSON.stringify({
          nombre: nombre,
          filtros: this.tab.currentFilters,
          total_resultados: this.tab.currentResults.length
        })
      });

      if (!response.ok) throw new Error('Error al guardar');

      const data = await response.json();

      // Cerrar loading y mostrar éxito
      await Swal.fire({
        icon: 'success',
        title: '¡Guardado!',
        text: 'Búsqueda guardada exitosamente',
        confirmButtonColor: '#0066CC',
        timer: 2000
      });

      // Recargar lista de búsquedas
      if (this.tab.listaHandler) {
        await this.tab.listaHandler.load();
      }

    } catch (error) {
      console.error('Error guardando búsqueda:', error);
      await Swal.fire({
        icon: 'error',
        title: 'Error',
        text: 'No se pudo guardar la búsqueda',
        confirmButtonColor: '#0066CC'
      });
    }
  }

  /**
   * Compartir búsqueda
   */
  async compartir() {
    if (this.tab.currentResults.length === 0) {
      await Swal.fire({
        icon: 'info',
        title: 'Sin resultados',
        text: 'No hay resultados para compartir',
        confirmButtonColor: '#0066CC'
      });
      return;
    }

    // Modal con botones para elegir método
    const { value: metodo } = await Swal.fire({
      title: '📤 Compartir Resultados',
      text: `${this.tab.currentResults.length} propiedades encontradas`,
      icon: 'question',
      showCancelButton: true,
      showDenyButton: true,
      confirmButtonText: '📧 Por Correo',
      denyButtonText: '📱 Por WhatsApp',
      cancelButtonText: 'Cancelar',
      confirmButtonColor: '#0066CC',
      denyButtonColor: '#25D366'
    });

    if (metodo === true) {
      // Confirmado = Correo
      await this.compartirPorCorreo();
    } else if (metodo === false) {
      // Denied = WhatsApp
      await this.compartirPorWhatsApp();
    }
  }

  /**
   * Compartir por correo - Usa endpoint backend /api/v1/emails/enviar-fichas
   */
  async compartirPorCorreo() {
    // Máximo 4 propiedades por correo
    const properties = this.tab.currentResults.slice(0, 4);

    if (properties.length === 0) {
      await Swal.fire({
        icon: 'info',
        title: 'Sin resultados',
        text: 'No hay propiedades para enviar',
        confirmButtonColor: '#0066CC'
      });
      return;
    }

    // Advertir si hay más de 4 propiedades
    if (this.tab.currentResults.length > 4) {
      const confirmResult = await Swal.fire({
        icon: 'warning',
        title: 'Límite de envío',
        html: `
          <p>Se enviarán solo las primeras <strong>4 propiedades</strong></p>
          <p style="color: #6B7280; font-size: 14px;">
            Total encontrado: ${this.tab.currentResults.length} propiedades
          </p>
        `,
        showCancelButton: true,
        confirmButtonText: 'Continuar',
        cancelButtonText: 'Cancelar',
        confirmButtonColor: '#0066CC'
      });

      if (!confirmResult.isConfirmed) return;
    }

    // Pedir datos del correo con modal completo
    const { value: formValues } = await Swal.fire({
      title: '📧 Enviar Fichas por Correo',
      html: `
        <div style="text-align: left;">
          <p style="margin-bottom: 15px; color: #6B7280;">
            Se enviarán <strong>${properties.length}</strong> ficha(s) adjuntas en PDF
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
              value="Propiedades Quadrante - Fichas Adjuntas"
              style="margin: 0; width: 100%;"
            >
          </div>

          <div style="margin-bottom: 15px;">
            <label style="display: block; margin-bottom: 5px; font-weight: 600; color: #374151;">
              Mensaje Personal (opcional):
            </label>
            <textarea
              id="swal-email-message"
              class="swal2-textarea"
              placeholder="Agrega un mensaje personalizado..."
              style="margin: 0; width: 100%; min-height: 80px;"
            >Estimado cliente,

Adjunto encontrará las fichas de las propiedades seleccionadas que podrían ser de su interés.

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
      confirmButtonText: 'Enviar Fichas',
      cancelButtonText: 'Cancelar',
      confirmButtonColor: '#0066CC',
      width: '600px',
      preConfirm: () => {
        const to = document.getElementById('swal-email-to').value;
        const subject = document.getElementById('swal-email-subject').value;
        const message = document.getElementById('swal-email-message').value;
        const sendCopy = document.getElementById('swal-email-copy').checked;

        // Validaciones
        if (!to) {
          Swal.showValidationMessage('El correo destinatario es requerido');
          return false;
        }

        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(to)) {
          Swal.showValidationMessage('Correo destinatario inválido');
          return false;
        }

        if (!subject) {
          Swal.showValidationMessage('El asunto es requerido');
          return false;
        }

        return { to, subject, message, sendCopy };
      }
    });

    if (!formValues) return;

    try {
      // Mostrar loading
      Swal.fire({
        title: 'Enviando Fichas',
        html: `
          <div style="text-align: center;">
            <p>Generando PDFs y enviando correo...</p>
            <p style="color: #6B7280; font-size: 14px;">Esto puede tomar unos segundos</p>
          </div>
        `,
        allowOutsideClick: false,
        allowEscapeKey: false,
        didOpen: () => {
          Swal.showLoading();
        }
      });

      // Llamar endpoint backend
      const response = await fetch(`${API_CONFIG.BASE_URL}/emails/enviar-fichas`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${authService.getToken()}`
        },
        body: JSON.stringify({
          to_email: formValues.to,
          subject: formValues.subject,
          message: formValues.message || '',
          propiedad_ids: properties.map(p => p.registro_cab_id),
          send_copy: formValues.sendCopy
        })
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.detail || 'Error al enviar correo');
      }

      const result = await response.json();

      // Cerrar loading y mostrar éxito
      await Swal.fire({
        icon: 'success',
        title: '¡Enviado!',
        html: `
          <p>Fichas enviadas correctamente a:</p>
          <p style="font-weight: 600; color: #2C5282;">${formValues.to}</p>
          <p style="color: #6B7280; font-size: 14px;">
            ${result.propiedades_enviadas} PDF(s) adjuntos
          </p>
        `,
        confirmButtonColor: '#0066CC'
      });

    } catch (error) {
      console.error('Error compartiendo por correo:', error);
      await Swal.fire({
        icon: 'error',
        title: 'Error',
        text: error.message || 'No se pudo enviar el correo',
        confirmButtonColor: '#0066CC'
      });
    }
  }

  /**
   * Compartir por WhatsApp
   */
  async compartirPorWhatsApp() {
    // Pedir teléfono con validación
    const { value: telefono } = await Swal.fire({
      title: '📱 Compartir por WhatsApp',
      input: 'tel',
      inputLabel: 'Número de WhatsApp',
      inputPlaceholder: 'Ej: 51999999999 (con código de país)',
      showCancelButton: true,
      confirmButtonText: 'Enviar',
      cancelButtonText: 'Cancelar',
      confirmButtonColor: '#25D366',
      inputValidator: (value) => {
        if (!value) {
          return 'Por favor ingresa un número';
        }
        if (!/^\d+$/.test(value)) {
          return 'Número inválido (solo números)';
        }
        if (value.length < 10) {
          return 'Número muy corto (mín. 10 dígitos)';
        }
      }
    });

    if (!telefono) return;

    try {
      // Generar mensaje con resumen
      const total = this.tab.currentResults.length;
      const preview = this.tab.currentResults.slice(0, 5);

      let mensaje = `🏢 *Propiedades Encontradas*\n\n`;
      mensaje += `Total: ${total} propiedades\n\n`;

      preview.forEach((prop, index) => {
        mensaje += `${index + 1}. ${prop.titulo || 'Sin título'}\n`;
        mensaje += `   📍 ${prop.direccion || prop.distrito || 'N/A'}\n`;
        mensaje += `   💰 ${this.formatPrecio(prop)}\n`;
        mensaje += `   📐 ${prop.area || 'N/A'} m²\n\n`;
      });

      if (total > 5) {
        mensaje += `... y ${total - 5} propiedades más.\n\n`;
      }

      mensaje += `Enviado desde Quadrante`;

      // Codificar mensaje para URL
      const mensajeCodificado = encodeURIComponent(mensaje);

      // Abrir WhatsApp
      const urlWhatsApp = `https://wa.me/${telefono}?text=${mensajeCodificado}`;
      window.open(urlWhatsApp, '_blank');

    } catch (error) {
      console.error('Error compartiendo por WhatsApp:', error);
      await Swal.fire({
        icon: 'error',
        title: 'Error',
        text: 'No se pudo compartir por WhatsApp',
        confirmButtonColor: '#0066CC'
      });
    }
  }

  /**
   * Formatear precio para WhatsApp
   */
  formatPrecio(prop) {
    if (prop.precio_venta && prop.precio_venta > 0) {
      return `USD ${this.formatNumber(prop.precio_venta)} (Venta)`;
    }
    if (prop.precio_alquiler && prop.precio_alquiler > 0) {
      return `USD ${this.formatNumber(prop.precio_alquiler)}/mes (Alquiler)`;
    }
    if (prop.precio_compra && prop.precio_compra > 0) {
      return `USD ${this.formatNumber(prop.precio_compra)} (Venta)`;
    }
    return 'Precio no disponible';
  }

  /**
   * Formatear número con comas
   */
  formatNumber(num) {
    return new Intl.NumberFormat('en-US').format(num);
  }
}

// Exportar para uso en busquedas.js
if (typeof window !== 'undefined') {
  window.BusquedasActions = BusquedasActions;
}

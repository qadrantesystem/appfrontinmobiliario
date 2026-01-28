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
          nombre_busqueda: nombre,
          criterios_json: this.tab.currentFilters,
          frecuencia_alerta: 'inmediata',  // Por defecto alertas inmediatas
          alerta_activa: true
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
   * MEJORADO: Incluye tabla resumen con edificio, tipo, área, etc.
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

    // Obtener datos del usuario actual
    const user = authService.getCurrentUser();
    const nombreUsuario = user?.nombre || 'Cliente';

    // Obtener resumen de búsqueda
    const resumenBusqueda = this.generarResumenBusqueda();

    // Generar tabla de propiedades
    const tablaHTML = this.generarTablaResumen(properties);

    // Generar mensaje predeterminado con saludo personalizado
    const mensajeDefault = `Hola,

Realizaste una búsqueda en Quadrante con los siguientes criterios:
${resumenBusqueda}

A continuación encontrarás un resumen de las propiedades encontradas:

${this.generarTablaTexto(properties)}

Adjunto encontrarás las fichas detalladas en PDF de cada propiedad.

Quedo atento a cualquier consulta.

Saludos cordiales,
${nombreUsuario}
Equipo Quadrante`;

    // Pedir datos del correo con modal completo
    const { value: formValues } = await Swal.fire({
      title: '📧 Enviar Fichas por Correo',
      html: `
        <div style="text-align: left;">
          <p style="margin-bottom: 15px; color: #6B7280;">
            Se enviarán <strong>${properties.length}</strong> ficha(s) adjuntas en PDF
          </p>

          <!-- Tabla resumen de propiedades -->
          <div style="margin-bottom: 15px; max-height: 150px; overflow-y: auto; border: 1px solid #E5E7EB; border-radius: 8px;">
            ${tablaHTML}
          </div>

          <div style="margin-bottom: 15px;">
            <label style="display: block; margin-bottom: 5px; font-weight: 600; color: #374151;">
              Nombre del Cliente:
            </label>
            <input
              type="text"
              id="swal-client-name"
              class="swal2-input"
              placeholder="Nombre del cliente"
              style="margin: 0; width: 100%;"
            >
          </div>

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
              value="Propiedades Quadrante - Oficinas según tu búsqueda"
              style="margin: 0; width: 100%;"
            >
          </div>

          <div style="margin-bottom: 15px;">
            <label style="display: block; margin-bottom: 5px; font-weight: 600; color: #374151;">
              Mensaje Personal:
            </label>
            <textarea
              id="swal-email-message"
              class="swal2-textarea"
              placeholder="Agrega un mensaje personalizado..."
              style="margin: 0; width: 100%; min-height: 120px; font-size: 12px;"
            >${mensajeDefault}</textarea>
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
      width: '700px',
      didOpen: () => {
        // Actualizar mensaje cuando cambia el nombre del cliente
        const clientNameInput = document.getElementById('swal-client-name');
        const messageTextarea = document.getElementById('swal-email-message');
        clientNameInput.addEventListener('input', () => {
          const clientName = clientNameInput.value || 'Cliente';
          const currentMessage = messageTextarea.value;
          // Reemplazar solo el saludo inicial
          messageTextarea.value = currentMessage.replace(/^Hola[^,]*,/, `Hola ${clientName},`);
        });
      },
      preConfirm: () => {
        const clientName = document.getElementById('swal-client-name').value;
        const to = document.getElementById('swal-email-to').value;
        const subject = document.getElementById('swal-email-subject').value;
        let message = document.getElementById('swal-email-message').value;
        const sendCopy = document.getElementById('swal-email-copy').checked;

        // Actualizar saludo con nombre del cliente
        if (clientName) {
          message = message.replace(/^Hola[^,]*,/, `Hola ${clientName},`);
        }

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

        return { to, subject, message, sendCopy, clientName };
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
          propiedad_ids: properties.map(p => p.registro_cab_id || p.edificio_id),
          send_copy: formValues.sendCopy,
          client_name: formValues.clientName,
          // Enviar tabla resumen para incluir en email
          tabla_resumen: this.generarTablaResumenHTML(properties)
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
            ${result.propiedades_enviadas || properties.length} PDF(s) adjuntos
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
   * Generar resumen de búsqueda en texto
   */
  generarResumenBusqueda() {
    const filters = this.tab.currentFilters || {};
    const fg = filters.filtros_genericos || {};
    const fb = filters.filtros_basicos || {};
    const meta = filters._meta || {};

    const partes = [];

    // Tipo de inmueble
    const tipoNombre = meta.tipo_inmueble_nombre || 'Inmueble';
    partes.push(`• Tipo: ${tipoNombre}`);

    // Transacción
    const transaccion = fg.transaccion || filters.transaccion || 'venta';
    partes.push(`• Transacción: ${transaccion === 'alquiler' ? 'Alquiler' : 'Venta'}`);

    // Área
    const area = fb.area || meta.metraje_original;
    if (area) {
      partes.push(`• Área: ~${area} m²`);
    }

    // Presupuesto
    const precio = fb.precio || meta.presupuesto_original;
    if (precio) {
      partes.push(`• Presupuesto: ~USD ${this.formatNumber(precio)}`);
    }

    return partes.join('\n');
  }

  /**
   * Generar tabla HTML para mostrar en modal
   */
  generarTablaResumen(properties) {
    const rows = properties.map((prop, index) => {
      const esCombinacion = prop.tipo === 'combinacion';
      const distrito = prop.distrito || 'N/A';
      const transaccion = prop.transaccion === 'alquiler' ? 'Alquiler' : 'Venta';

      // Nombre con edificio
      let nombre = '';
      if (esCombinacion) {
        nombre = `🔗 ${prop.edificio_nombre || 'Combinación'} (${prop.cantidad_oficinas} oficinas)`;
      } else {
        const edificio = prop.edificio_nombre ? `${prop.edificio_nombre} - ` : '';
        nombre = `${edificio}${prop.titulo || prop.nombre_inmueble || 'Oficina'}`;
      }

      const area = esCombinacion ? prop.area_total : (prop.area || 0);

      return `
        <tr style="border-bottom: 1px solid #E5E7EB;">
          <td style="padding: 6px 8px; font-size: 11px;">${index + 1}</td>
          <td style="padding: 6px 8px; font-size: 11px;">${distrito}</td>
          <td style="padding: 6px 8px; font-size: 11px;">${transaccion}</td>
          <td style="padding: 6px 8px; font-size: 11px; max-width: 200px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap;" title="${nombre}">${nombre}</td>
          <td style="padding: 6px 8px; font-size: 11px; text-align: right;">${area} m²</td>
        </tr>
      `;
    }).join('');

    return `
      <table style="width: 100%; border-collapse: collapse; font-size: 12px;">
        <thead>
          <tr style="background: #F3F4F6;">
            <th style="padding: 8px; text-align: left; font-weight: 600; font-size: 11px;">#</th>
            <th style="padding: 8px; text-align: left; font-weight: 600; font-size: 11px;">Distrito</th>
            <th style="padding: 8px; text-align: left; font-weight: 600; font-size: 11px;">Tipo</th>
            <th style="padding: 8px; text-align: left; font-weight: 600; font-size: 11px;">Edificio / Oficina</th>
            <th style="padding: 8px; text-align: right; font-weight: 600; font-size: 11px;">Área</th>
          </tr>
        </thead>
        <tbody>
          ${rows}
        </tbody>
      </table>
    `;
  }

  /**
   * Generar tabla en texto plano para el mensaje
   */
  generarTablaTexto(properties) {
    const lineas = ['#  | DISTRITO       | TIPO     | EDIFICIO / OFICINA                    | ÁREA'];
    lineas.push('---|----------------|----------|---------------------------------------|--------');

    properties.forEach((prop, index) => {
      const esCombinacion = prop.tipo === 'combinacion';
      const distrito = (prop.distrito || 'N/A').substring(0, 14).padEnd(14);
      const transaccion = (prop.transaccion === 'alquiler' ? 'Alquiler' : 'Venta').padEnd(8);

      let nombre = '';
      if (esCombinacion) {
        nombre = `${prop.edificio_nombre || 'Combinación'} (${prop.cantidad_oficinas} oficinas)`;
      } else {
        const edificio = prop.edificio_nombre ? `${prop.edificio_nombre} - ` : '';
        nombre = `${edificio}${prop.titulo || prop.nombre_inmueble || 'Oficina'}`;
      }
      nombre = nombre.substring(0, 37).padEnd(37);

      const area = esCombinacion ? prop.area_total : (prop.area || 0);
      const areaStr = `${area} m²`.padStart(8);

      lineas.push(`${(index + 1).toString().padStart(2)} | ${distrito} | ${transaccion} | ${nombre} | ${areaStr}`);
    });

    return lineas.join('\n');
  }

  /**
   * Generar tabla HTML para incluir en email (backend)
   */
  generarTablaResumenHTML(properties) {
    const rows = properties.map((prop, index) => {
      const esCombinacion = prop.tipo === 'combinacion';
      const distrito = prop.distrito || 'N/A';
      const transaccion = prop.transaccion === 'alquiler' ? 'Alquiler' : 'Venta';

      let nombre = '';
      if (esCombinacion) {
        nombre = `🔗 ${prop.edificio_nombre || 'Combinación'} (${prop.cantidad_oficinas} oficinas)`;
      } else {
        const edificio = prop.edificio_nombre ? `<strong>${prop.edificio_nombre}</strong> - ` : '';
        nombre = `${edificio}${prop.titulo || prop.nombre_inmueble || 'Oficina'}`;
      }

      const area = esCombinacion ? prop.area_total : (prop.area || 0);

      return `<tr>
        <td style="padding: 8px; border: 1px solid #ddd;">${index + 1}</td>
        <td style="padding: 8px; border: 1px solid #ddd;">${distrito}</td>
        <td style="padding: 8px; border: 1px solid #ddd;">${transaccion}</td>
        <td style="padding: 8px; border: 1px solid #ddd;">${nombre}</td>
        <td style="padding: 8px; border: 1px solid #ddd; text-align: right;">${area} m²</td>
      </tr>`;
    }).join('');

    return `<table style="width: 100%; border-collapse: collapse; margin: 20px 0;">
      <thead>
        <tr style="background: #0066CC; color: white;">
          <th style="padding: 10px; border: 1px solid #0066CC;">#</th>
          <th style="padding: 10px; border: 1px solid #0066CC;">Distrito</th>
          <th style="padding: 10px; border: 1px solid #0066CC;">Transacción</th>
          <th style="padding: 10px; border: 1px solid #0066CC;">Edificio / Oficina</th>
          <th style="padding: 10px; border: 1px solid #0066CC;">Área</th>
        </tr>
      </thead>
      <tbody>
        ${rows}
      </tbody>
    </table>`;
  }

  /**
   * Compartir por WhatsApp
   * MEJORADO: Incluye edificio, criterios de búsqueda y formato mejorado
   */
  async compartirPorWhatsApp() {
    // Pedir nombre del cliente y teléfono
    const { value: formValues } = await Swal.fire({
      title: '📱 Compartir por WhatsApp',
      html: `
        <div style="text-align: left;">
          <div style="margin-bottom: 15px;">
            <label style="display: block; margin-bottom: 5px; font-weight: 600; color: #374151;">
              Nombre del Cliente:
            </label>
            <input
              type="text"
              id="swal-wa-name"
              class="swal2-input"
              placeholder="Nombre del cliente"
              style="margin: 0; width: 100%;"
            >
          </div>
          <div style="margin-bottom: 15px;">
            <label style="display: block; margin-bottom: 5px; font-weight: 600; color: #374151;">
              Número de WhatsApp:
            </label>
            <input
              type="tel"
              id="swal-wa-phone"
              class="swal2-input"
              placeholder="51999999999 (con código de país)"
              style="margin: 0; width: 100%;"
            >
          </div>
        </div>
      `,
      showCancelButton: true,
      confirmButtonText: 'Enviar',
      cancelButtonText: 'Cancelar',
      confirmButtonColor: '#25D366',
      preConfirm: () => {
        const name = document.getElementById('swal-wa-name').value;
        const phone = document.getElementById('swal-wa-phone').value;

        if (!phone) {
          Swal.showValidationMessage('Por favor ingresa un número');
          return false;
        }
        if (!/^\d+$/.test(phone)) {
          Swal.showValidationMessage('Número inválido (solo números)');
          return false;
        }
        if (phone.length < 10) {
          Swal.showValidationMessage('Número muy corto (mín. 10 dígitos)');
          return false;
        }

        return { name, phone };
      }
    });

    if (!formValues) return;

    try {
      // Obtener usuario actual
      const user = authService.getCurrentUser();
      const nombreUsuario = user?.nombre || 'Asesor';

      // Generar resumen de búsqueda
      const resumenBusqueda = this.generarResumenBusqueda();

      // Generar mensaje con resumen
      const total = this.tab.currentResults.length;
      const preview = this.tab.currentResults.slice(0, 5);

      let mensaje = `🏢 *Propiedades Quadrante*\n\n`;

      // Saludo personalizado
      if (formValues.name) {
        mensaje += `Hola ${formValues.name},\n\n`;
      }

      mensaje += `Te comparto los resultados de tu búsqueda:\n`;
      mensaje += `${resumenBusqueda.replace(/•/g, '▪️')}\n\n`;
      mensaje += `📊 *${total} propiedades encontradas:*\n\n`;

      preview.forEach((prop, index) => {
        const esCombinacion = prop.tipo === 'combinacion';

        if (esCombinacion) {
          // Combinación
          mensaje += `*${index + 1}. 🔗 ${prop.edificio_nombre || 'Combinación'}*\n`;
          mensaje += `   └ ${prop.cantidad_oficinas} oficinas combinadas\n`;
          mensaje += `   📍 ${prop.distrito || 'N/A'} | Piso ${prop.piso || 'N/A'}\n`;
          mensaje += `   📐 ${prop.area_total || 0} m² (total)\n`;
          mensaje += `   💰 ${this.formatPrecio(prop)}\n\n`;
        } else {
          // Individual
          const edificio = prop.edificio_nombre ? `🏢 ${prop.edificio_nombre}` : '';
          const titulo = prop.titulo || prop.nombre_inmueble || 'Oficina';

          mensaje += `*${index + 1}. ${titulo}*\n`;
          if (edificio) {
            mensaje += `   ${edificio}\n`;
          }
          mensaje += `   📍 ${prop.distrito || prop.direccion || 'N/A'}\n`;
          mensaje += `   📐 ${prop.area || 0} m²\n`;
          mensaje += `   💰 ${this.formatPrecio(prop)}\n\n`;
        }
      });

      if (total > 5) {
        mensaje += `... y ${total - 5} propiedades más.\n\n`;
      }

      mensaje += `---\n`;
      mensaje += `Enviado por ${nombreUsuario}\n`;
      mensaje += `_Quadrante Inmobiliaria_`;

      // Codificar mensaje para URL
      const mensajeCodificado = encodeURIComponent(mensaje);

      // Abrir WhatsApp
      const urlWhatsApp = `https://wa.me/${formValues.phone}?text=${mensajeCodificado}`;
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
   * Formatear precio para WhatsApp/Email
   * Soporta propiedades individuales y combinaciones
   */
  formatPrecio(prop) {
    const esCombinacion = prop.tipo === 'combinacion';

    // Para combinaciones
    if (esCombinacion) {
      if (prop.precio_venta_total && prop.precio_venta_total > 0) {
        return `USD ${this.formatNumber(prop.precio_venta_total)} (Venta)`;
      }
      if (prop.precio_alquiler_total && prop.precio_alquiler_total > 0) {
        return `USD ${this.formatNumber(prop.precio_alquiler_total)}/mes (Alquiler)`;
      }
    }

    // Para propiedades individuales
    if (prop.precio_venta && prop.precio_venta > 0) {
      return `USD ${this.formatNumber(prop.precio_venta)} (Venta)`;
    }
    if (prop.precio_alquiler && prop.precio_alquiler > 0) {
      return `USD ${this.formatNumber(prop.precio_alquiler)}/mes (Alquiler)`;
    }
    if (prop.precio_compra && prop.precio_compra > 0) {
      return `USD ${this.formatNumber(prop.precio_compra)} (Venta)`;
    }
    return 'Precio a consultar';
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

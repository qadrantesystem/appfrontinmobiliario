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
   * Compartir búsqueda - Solo propiedades SELECCIONADAS
   */
  async compartir() {
    // Obtener propiedades seleccionadas
    const seleccionadas = this.getSelectedProperties();

    if (seleccionadas.length === 0) {
      await Swal.fire({
        icon: 'info',
        title: 'Sin selección',
        html: `
          <p>No has seleccionado ninguna propiedad.</p>
          <p style="color: #6B7280; font-size: 14px; margin-top: 10px;">
            Usa los checkboxes ☑️ en las tarjetas para seleccionar las propiedades que deseas compartir.
          </p>
        `,
        confirmButtonColor: '#0066CC'
      });
      return;
    }

    // Modal con botones para elegir método
    const { value: metodo } = await Swal.fire({
      title: '📤 Compartir Selección',
      html: `
        <p><strong>${seleccionadas.length}</strong> propiedad(es) seleccionada(s)</p>
        <p style="color: #6B7280; font-size: 14px;">¿Cómo deseas compartirlas?</p>
      `,
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
      await this.compartirPorCorreo(seleccionadas);
    } else if (metodo === false) {
      // Denied = WhatsApp
      await this.compartirPorWhatsApp(seleccionadas);
    }
  }

  /**
   * Obtener propiedades seleccionadas (individuales + combinaciones)
   */
  getSelectedProperties() {
    const seleccionadas = [];

    // Obtener checkboxes marcados
    const checkboxes = this.tab.container.querySelectorAll('.property-select-checkbox:checked');

    checkboxes.forEach(checkbox => {
      const card = checkbox.closest('.property-card');
      if (!card) return;

      const isCombination = card.dataset.combination === 'true';
      const propertyNumber = parseInt(card.dataset.propertyNumber);

      if (isCombination) {
        // Es una combinación - buscar por número de propiedad (índice en resultados)
        const comboId = checkbox.dataset.comboId;

        // Buscar la combinación que coincida con el comboId generado
        const combo = this.tab.currentResults.find(r => {
          if (r.tipo !== 'combinacion') return false;

          // Regenerar el comboId para comparar
          const oficinaIds = (r.oficinas || []).map(o => o.registro_cab_id).sort().join('-');
          const expectedComboId = `combo-${r.edificio_id}-${r.piso}-${oficinaIds}`;

          return expectedComboId === comboId;
        });

        if (combo && !seleccionadas.includes(combo)) {
          seleccionadas.push(combo);
        }
      } else {
        // Es una propiedad individual
        const propertyId = parseInt(checkbox.dataset.propertyId);

        // Buscar la propiedad en los resultados
        const prop = this.tab.currentResults.find(r =>
          r.registro_cab_id === propertyId
        );

        if (prop && !seleccionadas.includes(prop)) {
          seleccionadas.push(prop);
        }
      }
    });

    return seleccionadas;
  }

  /**
   * Compartir por correo - Usa endpoint backend /api/v1/emails/enviar-fichas
   * MEJORADO: Incluye tabla resumen con edificio, tipo, área, etc.
   * @param {Array} seleccionadas - Propiedades seleccionadas para compartir
   */
  async compartirPorCorreo(seleccionadas = null) {
    // Usar seleccionadas o todas (máximo 4)
    const properties = seleccionadas || this.getSelectedProperties();

    if (properties.length === 0) {
      await Swal.fire({
        icon: 'info',
        title: 'Sin selección',
        text: 'No hay propiedades seleccionadas para enviar',
        confirmButtonColor: '#0066CC'
      });
      return;
    }

    // Advertir si hay más de 4 propiedades
    if (properties.length > 4) {
      const confirmResult = await Swal.fire({
        icon: 'warning',
        title: 'Límite de envío',
        html: `
          <p>Se enviarán solo las primeras <strong>4 propiedades</strong></p>
          <p style="color: #6B7280; font-size: 14px;">
            Seleccionadas: ${properties.length} propiedades
          </p>
        `,
        showCancelButton: true,
        confirmButtonText: 'Continuar',
        cancelButtonText: 'Cancelar',
        confirmButtonColor: '#0066CC'
      });

      if (!confirmResult.isConfirmed) return;
      // Limitar a 4
      properties.splice(4);
    }

    // Obtener datos del usuario actual
    const user = authService.getCurrentUser();
    const nombreUsuario = user?.nombre || 'Asesor Quadrante';

    // Obtener resumen de búsqueda
    const resumenBusqueda = this.generarResumenBusqueda();

    // Generar tabla de propiedades
    const tablaHTML = this.generarTablaResumen(properties);

    // Contar PDFs que se adjuntarán (incluye oficinas de combinaciones)
    const totalPDFs = this.contarPDFsAdjuntos(properties);
    const idsParaPDFs = this.obtenerIDsParaPDFs(properties);

    // Generar mensaje predeterminado con narrativa detallada
    const mensajeDefault = `Hola,

Realizaste una búsqueda en Quadrante con los siguientes criterios:
${resumenBusqueda}

${this.generarNarrativaResultados(properties)}

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
            Se enviarán <strong>${totalPDFs}</strong> ficha(s) PDF adjuntas
            <span style="font-size: 12px;">(${properties.length} resultado(s) seleccionado(s))</span>
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
          // Enviar IDs de todas las oficinas (incluye las de combinaciones)
          propiedad_ids: idsParaPDFs,
          send_copy: formValues.sendCopy,
          client_name: formValues.clientName,
          // Enviar tabla resumen HTML para incluir en email
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
            ${result.propiedades_enviadas || totalPDFs} PDF(s) adjuntos
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
      partes.push(`• Área solicitada: ~${area} m²`);
    }

    // Presupuesto
    const precio = fb.precio || meta.presupuesto_original;
    if (precio) {
      partes.push(`• Presupuesto: ~USD ${this.formatNumber(precio)}`);
    }

    return partes.join('\n');
  }

  /**
   * Generar narrativa explicativa de los resultados
   */
  generarNarrativaResultados(properties) {
    const individuales = properties.filter(p => p.tipo !== 'combinacion');
    const combinaciones = properties.filter(p => p.tipo === 'combinacion');

    let narrativa = `Encontré ${properties.length} resultado(s) que coinciden con tu búsqueda:\n\n`;

    // Describir individuales
    if (individuales.length > 0) {
      narrativa += `📋 ${individuales.length} OFICINA(S) INDIVIDUAL(ES):\n`;
      individuales.forEach((prop, i) => {
        const edificio = prop.edificio_nombre ? `${prop.edificio_nombre} - ` : '';
        const nombre = prop.titulo || prop.nombre_inmueble || 'Oficina';
        const precio = this.formatPrecio(prop);
        narrativa += `   ${i + 1}. ${edificio}${nombre}\n`;
        narrativa += `      📍 ${prop.distrito || 'N/A'} | 📐 ${prop.area || 0} m² | 💰 ${precio}\n`;
      });
      narrativa += '\n';
    }

    // Describir combinaciones
    if (combinaciones.length > 0) {
      narrativa += `🔗 ${combinaciones.length} COMBINACIÓN(ES) DE OFICINAS:\n`;
      narrativa += `   (Oficinas del mismo edificio/piso que juntas alcanzan el área solicitada)\n\n`;

      combinaciones.forEach((combo, i) => {
        const oficinas = combo.oficinas || [];
        const precio = this.formatPrecio(combo);

        narrativa += `   ${i + 1}. ${combo.edificio_nombre || 'Edificio'} - Piso ${combo.piso || 'N/A'}\n`;
        narrativa += `      📍 ${combo.distrito || 'N/A'} | 📐 ${combo.area_total} m² (total) | 💰 ${precio}\n`;
        narrativa += `      Compuesta por ${combo.cantidad_oficinas} oficinas:\n`;

        oficinas.forEach(ofi => {
          narrativa += `         • ${ofi.nombre}: ${ofi.area} m²\n`;
        });
        narrativa += '\n';
      });
    }

    // Nota sobre PDFs adjuntos
    const totalPDFs = this.contarPDFsAdjuntos(properties);
    narrativa += `📎 Se adjuntan ${totalPDFs} ficha(s) PDF con información detallada de cada oficina.\n`;

    return narrativa;
  }

  /**
   * Contar total de PDFs a adjuntar (individuales + oficinas de combinaciones)
   */
  contarPDFsAdjuntos(properties) {
    let total = 0;
    properties.forEach(prop => {
      if (prop.tipo === 'combinacion') {
        total += (prop.oficinas || []).length;
      } else {
        total += 1;
      }
    });
    return total;
  }

  /**
   * Obtener IDs de propiedades para PDFs (incluye oficinas de combinaciones)
   * Usa Set para evitar duplicados
   */
  obtenerIDsParaPDFs(properties) {
    const idsSet = new Set();

    properties.forEach(prop => {
      if (prop.tipo === 'combinacion') {
        // Para combinaciones, agregar cada oficina individual
        const oficinas = prop.oficinas || [];
        console.log(`🔗 Combinación ${prop.edificio_nombre} - Piso ${prop.piso}: ${oficinas.length} oficinas`);

        oficinas.forEach(ofi => {
          if (ofi.registro_cab_id) {
            console.log(`   📄 Oficina: ${ofi.nombre || ofi.titulo} - ID: ${ofi.registro_cab_id}`);
            idsSet.add(ofi.registro_cab_id);
          } else {
            console.warn(`   ⚠️ Oficina sin registro_cab_id:`, ofi);
          }
        });
      } else {
        // Para individuales, agregar el ID directo
        if (prop.registro_cab_id) {
          console.log(`📋 Individual: ${prop.titulo || prop.nombre_inmueble} - ID: ${prop.registro_cab_id}`);
          idsSet.add(prop.registro_cab_id);
        } else {
          console.warn(`⚠️ Propiedad individual sin registro_cab_id:`, prop);
        }
      }
    });

    const ids = Array.from(idsSet);
    console.log(`📎 Total IDs únicos para PDFs: ${ids.length}`, ids);
    return ids;
  }

  /**
   * Generar tabla HTML para mostrar en modal
   */
  generarTablaResumen(properties) {
    let rows = '';

    properties.forEach((prop, index) => {
      const esCombinacion = prop.tipo === 'combinacion';
      const distrito = prop.distrito || 'N/A';
      const transaccion = prop.transaccion === 'alquiler' ? 'Alquiler' : 'Venta';

      if (esCombinacion) {
        // Fila principal de la combinación (verde)
        rows += `
          <tr style="background: rgba(76, 175, 80, 0.1); border-bottom: 2px solid #4CAF50;">
            <td style="padding: 8px; font-size: 11px; font-weight: bold; color: #2e7d32;">${index + 1}</td>
            <td style="padding: 8px; font-size: 11px;">${distrito}</td>
            <td style="padding: 8px; font-size: 11px;">${transaccion}</td>
            <td style="padding: 8px; font-size: 11px; font-weight: bold; color: #2e7d32;">
              🔗 ${prop.edificio_nombre || 'Combinación'} - Piso ${prop.piso || 'N/A'}
            </td>
            <td style="padding: 8px; font-size: 11px; text-align: right; font-weight: bold; color: #2e7d32;">${prop.area_total} m²</td>
          </tr>
        `;
        // Filas de detalle para cada oficina de la combinación
        (prop.oficinas || []).forEach(ofi => {
          rows += `
            <tr style="background: rgba(76, 175, 80, 0.05); border-bottom: 1px solid #E5E7EB;">
              <td style="padding: 4px 8px; font-size: 10px; color: #6B7280;"></td>
              <td style="padding: 4px 8px; font-size: 10px; color: #6B7280;"></td>
              <td style="padding: 4px 8px; font-size: 10px; color: #6B7280;"></td>
              <td style="padding: 4px 8px 4px 24px; font-size: 10px; color: #4CAF50;">↳ ${ofi.nombre}</td>
              <td style="padding: 4px 8px; font-size: 10px; text-align: right; color: #4CAF50;">${ofi.area} m²</td>
            </tr>
          `;
        });
      } else {
        // Fila de propiedad individual (azul)
        const edificio = prop.edificio_nombre ? `${prop.edificio_nombre} - ` : '';
        const nombre = `${edificio}${prop.titulo || prop.nombre_inmueble || 'Oficina'}`;

        rows += `
          <tr style="border-bottom: 1px solid #E5E7EB;">
            <td style="padding: 8px; font-size: 11px;">${index + 1}</td>
            <td style="padding: 8px; font-size: 11px;">${distrito}</td>
            <td style="padding: 8px; font-size: 11px;">${transaccion}</td>
            <td style="padding: 8px; font-size: 11px;">${nombre}</td>
            <td style="padding: 8px; font-size: 11px; text-align: right;">${prop.area || 0} m²</td>
          </tr>
        `;
      }
    });

    return `
      <table style="width: 100%; border-collapse: collapse; font-size: 12px;">
        <thead>
          <tr style="background: #F3F4F6;">
            <th style="padding: 8px; text-align: left; font-weight: 600; font-size: 11px;">#</th>
            <th style="padding: 8px; text-align: left; font-weight: 600; font-size: 11px;">Distrito</th>
            <th style="padding: 8px; text-align: left; font-weight: 600; font-size: 11px;">Transacción</th>
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
    // Ya no usamos tabla de texto, usamos narrativa
    return this.generarNarrativaResultados(properties);
  }

  /**
   * Generar tabla HTML para incluir en email (backend)
   */
  generarTablaResumenHTML(properties) {
    let rows = '';

    properties.forEach((prop, index) => {
      const esCombinacion = prop.tipo === 'combinacion';
      const distrito = prop.distrito || 'N/A';
      const transaccion = prop.transaccion === 'alquiler' ? 'Alquiler' : 'Venta';
      const precio = this.formatPrecio(prop);

      if (esCombinacion) {
        // Fila principal de la combinación (verde)
        rows += `<tr style="background: #E8F5E9;">
          <td style="padding: 10px; border: 1px solid #4CAF50; font-weight: bold; color: #2e7d32;">${index + 1}</td>
          <td style="padding: 10px; border: 1px solid #4CAF50;">${distrito}</td>
          <td style="padding: 10px; border: 1px solid #4CAF50;">${transaccion}</td>
          <td style="padding: 10px; border: 1px solid #4CAF50; font-weight: bold; color: #2e7d32;">
            🔗 COMBINACIÓN: ${prop.edificio_nombre || 'Edificio'} - Piso ${prop.piso || 'N/A'}
          </td>
          <td style="padding: 10px; border: 1px solid #4CAF50; text-align: right; font-weight: bold; color: #2e7d32;">${prop.area_total} m²</td>
          <td style="padding: 10px; border: 1px solid #4CAF50; text-align: right;">${precio}</td>
        </tr>`;

        // Filas de detalle para cada oficina
        (prop.oficinas || []).forEach(ofi => {
          const precioOfi = ofi.precio_venta ? `USD ${this.formatNumber(ofi.precio_venta)}` :
                           ofi.precio_alquiler ? `USD ${this.formatNumber(ofi.precio_alquiler)}/mes` : '-';
          rows += `<tr style="background: #F1F8E9;">
            <td style="padding: 6px 10px; border: 1px solid #C8E6C9; color: #666;"></td>
            <td style="padding: 6px 10px; border: 1px solid #C8E6C9; color: #666;"></td>
            <td style="padding: 6px 10px; border: 1px solid #C8E6C9; color: #666;"></td>
            <td style="padding: 6px 10px 6px 30px; border: 1px solid #C8E6C9; color: #4CAF50;">↳ ${ofi.nombre}</td>
            <td style="padding: 6px 10px; border: 1px solid #C8E6C9; text-align: right; color: #4CAF50;">${ofi.area} m²</td>
            <td style="padding: 6px 10px; border: 1px solid #C8E6C9; text-align: right; color: #666;">${precioOfi}</td>
          </tr>`;
        });
      } else {
        // Fila de propiedad individual
        const edificio = prop.edificio_nombre ? `<strong>${prop.edificio_nombre}</strong> - ` : '';
        const nombre = `${edificio}${prop.titulo || prop.nombre_inmueble || 'Oficina'}`;

        rows += `<tr>
          <td style="padding: 10px; border: 1px solid #ddd;">${index + 1}</td>
          <td style="padding: 10px; border: 1px solid #ddd;">${distrito}</td>
          <td style="padding: 10px; border: 1px solid #ddd;">${transaccion}</td>
          <td style="padding: 10px; border: 1px solid #ddd;">${nombre}</td>
          <td style="padding: 10px; border: 1px solid #ddd; text-align: right;">${prop.area || 0} m²</td>
          <td style="padding: 10px; border: 1px solid #ddd; text-align: right;">${precio}</td>
        </tr>`;
      }
    });

    return `<table style="width: 100%; border-collapse: collapse; margin: 20px 0; font-family: Arial, sans-serif;">
      <thead>
        <tr style="background: #0066CC; color: white;">
          <th style="padding: 12px; border: 1px solid #0066CC;">#</th>
          <th style="padding: 12px; border: 1px solid #0066CC;">Distrito</th>
          <th style="padding: 12px; border: 1px solid #0066CC;">Transacción</th>
          <th style="padding: 12px; border: 1px solid #0066CC;">Edificio / Oficina</th>
          <th style="padding: 12px; border: 1px solid #0066CC;">Área</th>
          <th style="padding: 12px; border: 1px solid #0066CC;">Precio</th>
        </tr>
      </thead>
      <tbody>
        ${rows}
      </tbody>
    </table>
    <p style="font-size: 12px; color: #666; margin-top: 10px;">
      <strong>Nota:</strong> Las filas en <span style="color: #4CAF50;">verde</span> son combinaciones de oficinas del mismo edificio/piso que juntas alcanzan el área solicitada.
      Se adjuntan fichas PDF individuales para cada oficina.
    </p>`;
  }

  /**
   * Compartir por WhatsApp
   * MEJORADO: Incluye edificio, criterios de búsqueda, formato mejorado y links de descarga PDF
   * @param {Array} seleccionadas - Propiedades seleccionadas para compartir
   */
  async compartirPorWhatsApp(seleccionadas = null) {
    // Usar seleccionadas o obtenerlas
    const properties = seleccionadas || this.getSelectedProperties();

    if (properties.length === 0) {
      await Swal.fire({
        icon: 'info',
        title: 'Sin selección',
        text: 'No hay propiedades seleccionadas para compartir',
        confirmButtonColor: '#0066CC'
      });
      return;
    }

    // Contar PDFs
    const totalPDFs = this.contarPDFsAdjuntos(properties);

    // Pedir nombre del cliente y teléfono
    const { value: formValues } = await Swal.fire({
      title: '📱 Compartir por WhatsApp',
      html: `
        <div style="text-align: left;">
          <p style="margin-bottom: 15px; color: #6B7280; font-size: 14px;">
            Se generarán <strong>${totalPDFs}</strong> ficha(s) PDF con links de descarga
          </p>
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
          <div style="margin-bottom: 10px;">
            <label style="display: flex; align-items: center; gap: 8px; cursor: pointer;">
              <input
                type="checkbox"
                id="swal-wa-pdfs"
                checked
                style="margin: 0;"
              >
              <span style="font-size: 14px; color: #6B7280;">
                Incluir links de descarga de fichas PDF
              </span>
            </label>
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
        const includePDFs = document.getElementById('swal-wa-pdfs').checked;

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

        return { name, phone, includePDFs };
      }
    });

    if (!formValues) return;

    try {
      // Obtener usuario actual
      const user = authService.getCurrentUser();
      const nombreUsuario = user?.nombre || 'Asesor';

      // Generar resumen de búsqueda
      const resumenBusqueda = this.generarResumenBusqueda();

      // Obtener IDs para PDFs
      const idsParaPDFs = this.obtenerIDsParaPDFs(properties);

      // Variable para almacenar URLs de fichas
      let fichasUrls = [];

      // Si se solicitaron PDFs, generarlos y subir a ImageKit
      if (formValues.includePDFs && idsParaPDFs.length > 0) {
        // Mostrar loading mientras genera PDFs
        Swal.fire({
          title: 'Generando Fichas PDF',
          html: `
            <div style="text-align: center;">
              <p>Generando ${totalPDFs} ficha(s) PDF...</p>
              <p style="color: #6B7280; font-size: 14px;">Esto puede tomar unos segundos</p>
            </div>
          `,
          allowOutsideClick: false,
          allowEscapeKey: false,
          didOpen: () => {
            Swal.showLoading();
          }
        });

        try {
          // Llamar endpoint para generar PDFs y obtener URLs
          const response = await fetch(`${API_CONFIG.BASE_URL}/emails/generar-fichas-urls`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${authService.getToken()}`
            },
            body: JSON.stringify({
              propiedad_ids: idsParaPDFs
            })
          });

          if (response.ok) {
            const result = await response.json();
            fichasUrls = result.fichas || [];
            console.log(`✅ PDFs generados: ${fichasUrls.length}`);
          } else {
            console.warn('⚠️ No se pudieron generar los PDFs, continuando sin links');
          }
        } catch (pdfError) {
          console.warn('⚠️ Error generando PDFs:', pdfError);
          // Continuar sin PDFs
        }
      }

      // Generar mensaje con resumen
      const total = properties.length;
      const preview = properties.slice(0, 5);

      let mensaje = `🏢 *Propiedades Quadrante*\n\n`;

      // Saludo personalizado
      if (formValues.name) {
        mensaje += `Hola ${formValues.name},\n\n`;
      }

      mensaje += `Te comparto los resultados de tu búsqueda:\n`;
      mensaje += `${resumenBusqueda.replace(/•/g, '▪️')}\n\n`;
      mensaje += `📊 *${total} resultado(s) encontrado(s):*\n\n`;

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
        mensaje += `... y ${total - 5} resultado(s) más.\n\n`;
      }

      // Agregar links de descarga de PDFs si existen
      if (fichasUrls.length > 0) {
        mensaje += `📎 *Fichas PDF para descargar:*\n\n`;
        fichasUrls.forEach((ficha, index) => {
          mensaje += `${index + 1}. ${ficha.titulo || ficha.codigo}\n`;
          mensaje += `   🔗 ${ficha.url}\n\n`;
        });
      }

      mensaje += `---\n`;
      mensaje += `Enviado por ${nombreUsuario}\n`;
      mensaje += `_Quadrante Inmobiliaria_`;

      // Codificar mensaje para URL
      const mensajeCodificado = encodeURIComponent(mensaje);

      // Abrir WhatsApp
      const urlWhatsApp = `https://wa.me/${formValues.phone}?text=${mensajeCodificado}`;
      window.open(urlWhatsApp, '_blank');

      // Cerrar loading si estaba abierto
      Swal.close();

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

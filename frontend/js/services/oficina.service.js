/**
 * 🏢 OFICINA SERVICE
 * Servicio para generación masiva de oficinas
 *
 * Endpoints:
 * - POST /propiedades/generar-oficinas-masivo - Generar oficinas masivamente
 */

class OficinaService {
  constructor() {
    this.baseURL = `${API_CONFIG.BASE_URL}/propiedades`;
  }

  /**
   * 🚀 Generar oficinas masivamente
   * @param {Object} requestData - Configuración de generación masiva
   * @param {number} requestData.edificio_id - ID del edificio padre
   * @param {number} requestData.piso_desde - Piso inicial
   * @param {number} requestData.piso_hasta - Piso final
   * @param {Array} requestData.plantilla_oficinas - Plantilla de oficinas por piso
   * @param {number} requestData.propietario_id - ID del propietario
   * @param {number} requestData.distrito_id - ID del distrito
   * @param {number} requestData.precio_alquiler_base - Precio base alquiler (opcional)
   * @param {number} requestData.precio_venta_base - Precio base venta (opcional)
   * @param {string} requestData.moneda - Moneda (PEN/USD)
   * @param {string} requestData.transaccion - Tipo transacción (alquiler/venta/ambos)
   * @returns {Promise<Object>} - Resultado de generación
   */
  async generarMasivo(requestData) {
    try {
      const token = localStorage.getItem('access_token');

      const response = await fetch(`${this.baseURL}/generar-oficinas-masivo`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(requestData)
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.detail || 'Error al generar oficinas');
      }

      const result = await response.json();

      // Extraer data del wrapper ResponseModel
      return result.data;

    } catch (error) {
      console.error('❌ Error al generar oficinas masivamente:', error);
      throw error;
    }
  }

  /**
   * 📊 Calcular total de oficinas a generar
   * @param {number} pisoDesde - Piso inicial
   * @param {number} pisoHasta - Piso final
   * @param {number} oficinasPorPiso - Cantidad de oficinas por piso
   * @returns {number} - Total de oficinas
   */
  calcularTotal(pisoDesde, pisoHasta, oficinasPorPiso) {
    const totalPisos = pisoHasta - pisoDesde + 1;
    return totalPisos * oficinasPorPiso;
  }

  /**
   * ✅ Validar configuración de generación masiva
   * @param {Object} config - Configuración a validar
   * @returns {Object} - {valid: boolean, errors: Array}
   */
  validarConfiguracion(config) {
    const errors = [];

    // Validar edificio_id
    if (!config.edificio_id || config.edificio_id <= 0) {
      errors.push('Debes seleccionar un edificio padre');
    }

    // Validar propietario_id
    if (!config.propietario_id || config.propietario_id <= 0) {
      errors.push('Debes seleccionar un propietario');
    }

    // Validar distrito_id
    if (!config.distrito_id || config.distrito_id <= 0) {
      errors.push('Debes seleccionar un distrito');
    }

    // Validar rango de pisos
    if (!config.piso_desde || config.piso_desde < 1) {
      errors.push('El piso inicial debe ser mayor a 0');
    }

    if (!config.piso_hasta || config.piso_hasta < 1) {
      errors.push('El piso final debe ser mayor a 0');
    }

    if (config.piso_desde > config.piso_hasta) {
      errors.push('El piso inicial no puede ser mayor al piso final');
    }

    // Validar plantilla
    if (!config.plantilla_oficinas || config.plantilla_oficinas.length === 0) {
      errors.push('Debes configurar al menos una oficina por piso');
    } else {
      // Validar cada plantilla
      config.plantilla_oficinas.forEach((plantilla, index) => {
        if (!plantilla.sufijo || plantilla.sufijo.length < 2) {
          errors.push(`Plantilla ${index + 1}: El sufijo debe tener al menos 2 caracteres`);
        }

        if (!plantilla.area || plantilla.area <= 0) {
          errors.push(`Plantilla ${index + 1}: El área debe ser mayor a 0`);
        }
      });
    }

    // Validar precios según tipo de transacción
    if (config.transaccion === 'alquiler' && (!config.precio_alquiler_base || config.precio_alquiler_base <= 0)) {
      errors.push('Debes especificar el precio de alquiler base');
    }

    if (config.transaccion === 'venta' && (!config.precio_venta_base || config.precio_venta_base <= 0)) {
      errors.push('Debes especificar el precio de venta base');
    }

    if (config.transaccion === 'ambos') {
      if (!config.precio_alquiler_base || config.precio_alquiler_base <= 0) {
        errors.push('Debes especificar el precio de alquiler base');
      }
      if (!config.precio_venta_base || config.precio_venta_base <= 0) {
        errors.push('Debes especificar el precio de venta base');
      }
    }

    return {
      valid: errors.length === 0,
      errors
    };
  }
}

// Instancia singleton
const oficinaService = new OficinaService();

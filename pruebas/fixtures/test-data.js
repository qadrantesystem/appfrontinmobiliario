/**
 * Datos centralizados para pruebas E2E — Qadrante System
 *
 * Tipos disponibles en API:
 *   12 = Edificio de oficinas completo (standalone, pasa por paso 4)
 *    1 = Oficina en Edificio (requiere padre, salta paso 4)
 *   13 = Edificio de departamentos completo (standalone, pasa por paso 4)
 *    3 = Departamento (requiere padre, salta paso 4)
 */

const TEST_USER = {
  email: process.env.TEST_EMAIL || 'alancairampoma@gmail.com',
  password: process.env.TEST_PASSWORD || 'Kike2026@',
};

// E1: Edificio completo de oficinas (tipo 12, standalone, pasa por paso 4)
const EDIFICIO = {
  propietario: {
    tipo: 'natural',
    dni: '43797299',
    nombre: 'Carlos Test Playwright',
    telefono: '999111222',
    email: 'carlos.test@email.com',
  },
  inmueble: {
    tipo_inmueble_id: '12',     // Edificio de oficinas completo
    nombre: 'Edificio E2E Test',
    tipo_via: 'Av.',
    nombre_via: 'Javier Prado',
    numero_direccion: '2100',
    urbanizacion: 'San Isidro',
  },
  distrito: 'San Isidro',
  pisos: 2,
  transaccion: 'venta',
  moneda_venta: 'USD',
  precio_venta: '950000',
  titulo: 'Edificio E2E Playwright Test',
  descripcion: 'Edificio creado por pruebas E2E automatizadas',
};

// E2: Oficina en edificio (tipo 1, requiere padre, salta paso 4)
const OFICINA = {
  propietario: {
    tipo: 'natural',
    dni: '43797299',
    nombre: 'Carlos Test Playwright',
    telefono: '999111222',
    email: 'carlos.test@email.com',
  },
  inmueble: {
    tipo_inmueble_id: '1',      // Oficina en Edificio
    nombre: 'Oficina E2E Test',
  },
  distrito: 'San Isidro',
  transaccion: 'alquiler',
  moneda_alquiler: 'USD',
  precio_alquiler: '3500',
  titulo: 'Oficina E2E Playwright Test',
  descripcion: 'Oficina creada por pruebas E2E automatizadas',
};

// E3: Datos para editar el edificio de E1
const EDICION_EDIFICIO = {
  titulo_nuevo: 'Edificio E2E Editado',
  precio_nuevo: '1050000',
};

// E4: Datos para editar la oficina de E2
const EDICION_OFICINA = {
  nombre_nuevo: 'Oficina E2E Editada',
  precio_nuevo: '4000',
};

// E5: Parametros de busqueda
const BUSQUEDA = {
  tipo_inmueble: 'Oficina en Edificio',
  distrito: 'San Isidro',
  metraje: '85',
  transaccion: 'venta',
};

module.exports = {
  TEST_USER,
  EDIFICIO,
  OFICINA,
  EDICION_EDIFICIO,
  EDICION_OFICINA,
  BUSQUEDA,
};

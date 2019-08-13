const DB_FILENAME = 'db.json'
const STATE_FILENAME = 'state.json'

const CATEGORY = {
  entradas: 'Entradas', // salarios ... subvenciones ... reembolso ... otras entradas
  basicos: 'Servicios basicos', // alquiler y servicios
  supermercado: 'Supermercado', // alimentacion y hogar
  fuera: 'Comida fuera', // restaurantes y salidas
  transporte: 'Transporte', // transporte
  salud: 'Salud', // salud y bienestar
  otros: 'Otros', // otros gastos ... shopping
  movimientos: 'Movimientos', //
  inversion: 'Inversion', //
  educacion: 'Educacion', //
  efectivo: 'Efectivo', // retiro de dinero
}

module.exports = {
  DB_FILENAME,
  STATE_FILENAME,
  CATEGORY
}

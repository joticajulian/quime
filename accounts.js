const config = require('./config')

const CRYPTOS = [
  {name: 'Bitcoin',  currency: 'BTC', precision: 8},
  {name: 'Ethereum', currency: 'ETH', precision: 8},
  {name: 'EOS',      currency: 'EOS', precision: 4},
  {name: 'Steem',    currency: 'Steem', precision: 3},
]

const ACCOUNT = {
  // assets and liabilities
  bcee: 'Spuerkeess',
  bgeneral: 'Banco General',
  cashJulian: 'Efectivo Julian',
  cashIdalia: 'Efectivo Idalia',
  cuentas_cobrar: 'Cuentas por cobrar',
  otro_activo: 'Otro activo',

  senacyt: 'Senacyt',
  mastercard: 'MasterCard',
  cuentas_pagar: 'Cuentas por pagar',
  otro_pasivo: 'Otro pasivo',

  // incomes and expenses
  salarios: 'Salarios',
  subvenciones: 'Subvenciones',
  reembolsos: 'Reembolsos',
  otras_entradas: 'Otras entradas',
  exchange_gain: 'Exchange ganancia',

  servicios: 'Alquiler y servicios',
  alimentacion: 'Alimentacion y hogar',
  restaurantes: 'Restaurantes y salidas',
  transporte: 'Transporte',
  salud: 'Salud y bienestar',
  shopping: 'Shopping',
  otros_gastos: 'Otros gastos',
  educacion: 'Educacion',
  exchange_loss: 'Exchange perdida',
}

const asset = 'asset'
const liability = 'liability'
const income = 'income'
const expense = 'expense'

var ACCOUNTS = [
  {name: ACCOUNT.bcee,           type: asset,     currency: 'EUR'},
  {name: ACCOUNT.bgeneral,       type: asset,     currency: 'USD'}, //asset USD
  {name: ACCOUNT.cashJulian,     type: asset,     currency: 'EUR'},
  {name: ACCOUNT.cashIdalia,     type: asset,     currency: 'EUR'},
  {name: ACCOUNT.cuentas_cobrar, type: asset,     currency: 'EUR'},
  {name: ACCOUNT.otro_activo,    type: asset,     currency: 'EUR'},

  {name: ACCOUNT.senacyt,        type: liability, currency: 'EUR'},
  {name: ACCOUNT.mastercard,     type: liability, currency: 'EUR'},
  {name: ACCOUNT.cuentas_pagar,  type: liability, currency: 'EUR'},
  {name: ACCOUNT.otro_pasivo,    type: liability, currency: 'EUR'},

  {name: ACCOUNT.salarios,       type: income,    currency: 'EUR'},
  {name: ACCOUNT.subvenciones,   type: income,    currency: 'EUR'},
  {name: ACCOUNT.reembolsos,     type: income,    currency: 'EUR'},
  {name: ACCOUNT.otras_entradas, type: income,    currency: 'EUR'},
  {name: ACCOUNT.exchange_gain,  type: income,    currency: 'EUR'},

  {name: ACCOUNT.servicios,      type: expense,   currency: 'EUR'},
  {name: ACCOUNT.alimentacion,   type: expense,   currency: 'EUR'},
  {name: ACCOUNT.restaurantes,   type: expense,   currency: 'EUR'},
  {name: ACCOUNT.transporte,     type: expense,   currency: 'EUR'},
  {name: ACCOUNT.salud,          type: expense,   currency: 'EUR'},
  {name: ACCOUNT.shopping,       type: expense,   currency: 'EUR'},
  {name: ACCOUNT.otros_gastos,   type: expense,   currency: 'EUR'},
  {name: ACCOUNT.educacion,      type: expense,   currency: 'EUR'},
  {name: ACCOUNT.exchange_loss,  type: expense,   currency: 'EUR'},
]

for(var i in ACCOUNTS) ACCOUNTS[i].precision = 2

for(var i in CRYPTOS){
  var crypto = CRYPTOS[i]
  // Inversion en crypto contabilizada en EUR, lo tomado del banco
  // Ej: credito 100EUR del banco, debito 100EUR de inversion bitcoin
  ACCOUNTS.push({name: 'Inversion '+crypto.name, type: asset, currency: 'EUR'})

  // Securities, el asset como tal del crypto que se tiene
  // Ej: debito 0.2BTC en cryptoBTC, credito 0.2BTC en entradas bitcoin
  ACCOUNTS.push({name: crypto.name, type: asset, currency: crypto.currency})
  ACCOUNTS.push({name: 'Entradas '+crypto.name, type: income, currency: crypto.currency})
  ACCOUNTS.push({name: 'Salidas '+crypto.name, type: expense, currency: crypto.currency})
}

function estimateAccount(r) {
  var d = r.description
  if(d.includes('transfer in favour of min des affaires etrangeres dir imm'))
    return {debit: ACCOUNT.bcee, credit: ACCOUNT.otros_gastos}
  if(d.includes('cash deposit'))
    return {debit: ACCOUNT.bcee, credit: ACCOUNT.otras_entradas}
  if(d.includes('avenir des enfants'))
    return {debit: ACCOUNT.bcee, credit: ACCOUNT.subvenciones}
  if(d.includes('from cns'))
    return {debit: ACCOUNT.bcee, credit: ACCOUNT.reembolsos}
  if(d.includes('tpv cactus'))
    return {debit: ACCOUNT.bcee, credit: ACCOUNT.shopping}
  if(d.includes('tpv lidl'))
    return {debit: ACCOUNT.bcee, credit: ACCOUNT.alimentacion}
  if(d.includes('tpv delhaize'))
    return {debit: ACCOUNT.bcee, credit: ACCOUNT.alimentacion}
  if(d.includes('tpv uni primavera'))
    return {debit: ACCOUNT.bcee, credit: ACCOUNT.alimentacion}
  if(d.includes('transfer from fujitsu'))
    return {debit: ACCOUNT.bcee, credit: ACCOUNT.salarios}
  if(d.includes('in favour of residence bougainviller'))
    return {debit: ACCOUNT.bcee, credit: ACCOUNT.servicios}
  if(d.includes('in favour of effekt'))
    return {debit: ACCOUNT.bcee, credit: ACCOUNT.servicios}
  if(d.includes('in favour of foyer assurances'))
    return {debit: ACCOUNT.bcee, credit: ACCOUNT.servicios}
  if(d.includes('tpv red beef'))
    return {debit: ACCOUNT.bcee, credit: ACCOUNT.restaurantes}
  if(d.includes('tpv saturn'))
    return {debit: ACCOUNT.bcee, credit: ACCOUNT.shopping}
  if(d.includes('tpv colruyt'))
    return {debit: ACCOUNT.bcee, credit: ACCOUNT.alimentacion}
  if(d.includes('tpv aldi'))
    return {debit: ACCOUNT.bcee, credit: ACCOUNT.alimentacion}
  if(d.includes('tpv renmans'))
    return {debit: ACCOUNT.bcee, credit: ACCOUNT.alimentacion}
  if(d.includes('tpv quick'))
    return {debit: ACCOUNT.bcee, credit: ACCOUNT.restaurantes}
  if(d.includes('tpv orchestra'))
    return {debit: ACCOUNT.bcee, credit: ACCOUNT.shopping}
  if(d.includes('tpv chaussea'))
    return {debit: ACCOUNT.bcee, credit: ACCOUNT.shopping}
  if(d.includes('tpv lindner'))
    return {debit: ACCOUNT.bcee, credit: ACCOUNT.shopping}
  if(d.includes('tpv okaidi'))
    return {debit: ACCOUNT.bcee, credit: ACCOUNT.shopping}
  if(d.includes('tpv kebab'))
    return {debit: ACCOUNT.bcee, credit: ACCOUNT.restaurantes}
  if(d.includes('tpv monop'))
    return {debit: ACCOUNT.bcee, credit: ACCOUNT.alimentacion}
  if(d.includes('tpv pizza hut'))
    return {debit: ACCOUNT.bcee, credit: ACCOUNT.restaurantes}
  if(d.includes('tpv subway'))
    return {debit: ACCOUNT.bcee, credit: ACCOUNT.restaurantes}
  if(d.includes('tpv quadro delizioso'))
    return {debit: ACCOUNT.bcee, credit: ACCOUNT.restaurantes}
  if(d.includes('tpv rest apulia'))
    return {debit: ACCOUNT.bcee, credit: ACCOUNT.restaurantes}
  if(d.includes('tpv cocottes'))
    return {debit: ACCOUNT.bcee, credit: ACCOUNT.restaurantes}
  if(d.includes('vapiano'))
    return {debit: ACCOUNT.bcee, credit: ACCOUNT.restaurantes}
  if(d.includes('big fernand'))
    return {debit: ACCOUNT.bcee, credit: ACCOUNT.restaurantes}
  if(d.includes('amorino'))
    return {debit: ACCOUNT.bcee, credit: ACCOUNT.restaurantes}
  if(d.includes('tpv cfl'))
    return {debit: ACCOUNT.bcee, credit: ACCOUNT.transporte}
  if(d.includes('tpv sncf'))
    return {debit: ACCOUNT.bcee, credit: ACCOUNT.transporte}
  if(d.includes('tpv mc donald'))
    return {debit: ACCOUNT.bcee, credit: ACCOUNT.restaurantes}
  if(d.includes('tpv pharmacie'))
    return {debit: ACCOUNT.bcee, credit: ACCOUNT.salud}
  if(d.includes('tpv maxi toys'))
    return {debit: ACCOUNT.bcee, credit: ACCOUNT.shopping}
  if(d.includes('auchan'))
    return {debit: ACCOUNT.bcee, credit: ACCOUNT.shopping}
  if(d.includes('cash withdrawal'))
    return {debit: ACCOUNT.bcee, credit: ACCOUNT.cashJulian}
  if(d.includes('dr youla'))
    return {debit: ACCOUNT.bcee, credit: ACCOUNT.salud}
  if(d.includes('torrabadella'))
    return {debit: ACCOUNT.bcee, credit: ACCOUNT.salud}
  if(d.includes('dr smets'))
    return {debit: ACCOUNT.bcee, credit: ACCOUNT.salud}
  if(d.includes('sheila'))
    return {debit: ACCOUNT.bcee, credit: ACCOUNT.salud}
  if(d.includes('ligue medico-sociales'))
    return {debit: ACCOUNT.bcee, credit: ACCOUNT.salud}
  if(d.includes('centre hospitalier'))
    return {debit: ACCOUNT.bcee, credit: ACCOUNT.salud}
  if(d.includes('dkv'))
    return {debit: ACCOUNT.bcee, credit: ACCOUNT.salud}
  if(d.includes('radiologique'))
    return {debit: ACCOUNT.bcee, credit: ACCOUNT.salud}
  if(d.includes('post telecom'))
    return {debit: ACCOUNT.bcee, credit: ACCOUNT.servicios}
  if(d.includes('altea immobiliere'))
    return {debit: ACCOUNT.bcee, credit: ACCOUNT.servicios}
  if(d.includes('tango'))
    return {debit: ACCOUNT.bcee, credit: ACCOUNT.servicios}
  if(d.includes('leo s.a.'))
    return {debit: ACCOUNT.bcee, credit: ACCOUNT.servicios}
  if(d.includes('debit 5431931908256161 mastercard'))
    return {debit: ACCOUNT.bcee, credit: ACCOUNT.mastercard}
  if(r.amount > 0)
    return {debit: ACCOUNT.bcee, credit: ACCOUNT.otras_entradas}

  return {debit: ACCOUNT.bcee, credit: ACCOUNT.shopping}
}

module.exports = {
  ACCOUNTS,
  CRYPTOS,
  estimateAccount,
}

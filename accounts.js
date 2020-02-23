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
  {name: ACCOUNT.bcee,           type: asset,     currency: 'EUR',
  logo: "https://pbs.twimg.com/profile_images/1202212612060127232/O2C8t1No_400x400.jpg"},
  {name: ACCOUNT.bgeneral,       type: asset,     currency: 'USD', //asset USD
  logo: "https://www.bgeneral.com/wp-content/uploads/2019/08/img/backgroundicon.svg"},
  {name: ACCOUNT.cashJulian,     type: asset,     currency: 'EUR',
  logo: "https://cdn.pixabay.com/photo/2020/02/01/18/10/cent-4811022_960_720.jpg"},
  {name: ACCOUNT.cashIdalia,     type: asset,     currency: 'EUR',
  logo: "https://cdn.pixabay.com/photo/2018/10/03/11/31/wallet-3721156__340.png"},
  {name: ACCOUNT.cuentas_cobrar, type: asset,     currency: 'EUR',
  logo: "https://cdn.pixabay.com/photo/2017/08/30/07/52/money-2696219__340.jpg"},
  {name: ACCOUNT.otro_activo,    type: asset,     currency: 'EUR',
  logo: "https://cdn.pixabay.com/photo/2016/12/13/17/54/safe-1904759_960_720.jpg"},

  {name: ACCOUNT.senacyt,        type: liability, currency: 'EUR',
  logo: "https://www.senacyt.gob.pa/wp-content/uploads/2019/05/logoSenacyt827x208.jpg"},
  {name: ACCOUNT.mastercard,     type: liability, currency: 'EUR',
  logo: "https://cdn.pixabay.com/photo/2015/07/19/13/33/credit-card-851506__340.jpg"},
  {name: ACCOUNT.cuentas_pagar,  type: liability, currency: 'EUR',
  logo: "https://cdn.pixabay.com/photo/2018/06/11/10/56/shaking-hands-3468243__340.jpg"},
  {name: ACCOUNT.otro_pasivo,    type: liability, currency: 'EUR',
  logo: "https://cdn.pixabay.com/photo/2016/08/25/20/14/crash-test-1620591__340.jpg"},

  {name: ACCOUNT.salarios,       type: income,    currency: 'EUR',
  logo: "https://cdn.pixabay.com/photo/2016/09/29/07/58/dollar-1702283__340.png"},
  {name: ACCOUNT.subvenciones,   type: income,    currency: 'EUR',
  logo: "https://cdn.pixabay.com/photo/2017/05/13/21/26/payment-2310730__340.png"},
  {name: ACCOUNT.reembolsos,     type: income,    currency: 'EUR',
  logo: "https://cdn.pixabay.com/photo/2018/07/13/18/54/money-3536346__340.jpg"},
  {name: ACCOUNT.otras_entradas, type: income,    currency: 'EUR',
  logo: "https://cdn.pixabay.com/photo/2018/09/25/23/05/freelancer-3703388__340.jpg"},
  {name: ACCOUNT.exchange_gain,  type: income,    currency: 'EUR',
  logo: ""},

  {name: ACCOUNT.servicios,      type: expense,   currency: 'EUR',
  logo: "https://cdn.pixabay.com/photo/2016/11/18/17/46/architecture-1836070__340.jpg"},
  {name: ACCOUNT.alimentacion,   type: expense,   currency: 'EUR',
  logo: "https://cdn.pixabay.com/photo/2015/12/09/17/11/vegetables-1085063__340.jpg"},
  {name: ACCOUNT.restaurantes,   type: expense,   currency: 'EUR',
  logo: "https://cdn.pixabay.com/photo/2013/02/21/19/06/beach-84533__340.jpg"},
  {name: ACCOUNT.transporte,     type: expense,   currency: 'EUR',
  logo: "https://cdn.pixabay.com/photo/2011/04/14/18/51/traffic-sign-6643__340.png"},
  {name: ACCOUNT.salud,          type: expense,   currency: 'EUR',
  logo: "https://cdn.pixabay.com/photo/2016/09/30/06/53/kit-1704526__340.png"},
  {name: ACCOUNT.shopping,       type: expense,   currency: 'EUR',
  logo: "https://cdn.pixabay.com/photo/2015/01/21/17/22/shopping-606993__340.jpg"},
  {name: ACCOUNT.otros_gastos,   type: expense,   currency: 'EUR',
  logo: "https://cdn.pixabay.com/photo/2017/03/07/23/34/wallet-2125548__340.jpg"},
  {name: ACCOUNT.educacion,      type: expense,   currency: 'EUR',
  logo: "https://cdn.pixabay.com/photo/2018/09/26/09/07/letters-3704026__340.jpg"},
  {name: ACCOUNT.exchange_loss,  type: expense,   currency: 'EUR',
  logo: ""},
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
  if(d.includes('zebra premium'))
    return {debit: ACCOUNT.bcee, credit: ACCOUNT.servicios}
  if(r.amount > 0)
    return {debit: ACCOUNT.bcee, credit: ACCOUNT.otras_entradas}

  return {debit: ACCOUNT.bcee, credit: ACCOUNT.shopping}
}

module.exports = {
  ACCOUNTS,
  CRYPTOS,
  estimateAccount,
}

const fs = require('fs')
const util = require('util')
const config = require('./config')

const readdir = util.promisify(fs.readdir)
const writeFile = util.promisify(fs.writeFile)

var db = []
var state = {}

const now = ()=>{ return new Date().toISOString().slice(0,-5) }
const log = (text)=>{ console.log(now() + ' - ' + text) }

const expectedTitles = [
  'Date transaction',
  'Description',
  'Date valeur',
  'Montant en EUR',
  'Extrait',
  'Solde',
  'Opration',
  'Communication 1',
  'Communication 2',
  'Communication 3',
  'Communication 4',
  'Compte bnficiaire',
  'Nom de la contrepartie',
  'Adresse de la contrepartie',
  'Localit de la contrepartie'
]

const titles = [
  {name: 'date_transaction', type: 'date'},
  {name: 'description', type: 'string'},
  {name: 'date_value', type: 'date'},
  {name: 'amount_eur', type: 'number'},
  {name: 'extrait', type: 'number'},
  {name: 'balance', type: 'number'},
  {name: 'operation', type: 'string'},
  {name: 'msg1', type: 'string'},
  {name: 'msg2', type: 'string'},
  {name: 'msg3', type: 'string'},
  {name: 'msg4', type: 'string'},
  {name: 'account_to', type: 'string'},
  {name: 'name_to', type: 'string'},
  {name: 'address_to', type: 'string'},
  {name: 'city_to', type: 'string'},
]

function parseRecord(data) {
  var record = {}
  for(var i in titles){
    switch(titles[i].type){
      case 'string':
        var value = data[i].trim().replace(/ +(?= )/g,'').toLowerCase()
        break
      case 'number':
        var value = parseFloat(data[i].replace(',','.'))
        break
      case 'date':
        var aux = data[i].split('/')
        var dateString = aux[2] + '-' + aux[1] + '-' + aux[0] + 'T00:00:00Z'
        var value = new Date(dateString).toISOString().slice(0,-5)
        break
      default:
        throw new Error(`Type '${titles[i].type}' is unknown`)
    }
    record[titles[i].name] = value
  }
  record.category = estimateCategory(record)
  return record
}

function estimateCategory(r) {
  var d = r.description
  if(d.includes('transfer in favour of min des affaires etrangeres dir imm'))
    return config.CATEGORY.legal
  if(d.includes('cash deposit'))
    return config.CATEGORY.entradas
  if(d.includes('tpv cactus'))
    return config.CATEGORY.otros
  if(d.includes('tpv lidl'))
    return config.CATEGORY.supermercado
  if(d.includes('tpv delhaize'))
    return config.CATEGORY.supermercado
  if(d.includes('transfer from fujitsu'))
    return config.CATEGORY.entradas
  if(d.includes('in favour of residence bougainviller'))
    return config.CATEGORY.basicos
  if(d.includes('in favour of effekt'))
    return config.CATEGORY.basicos
  if(d.includes('in favour of foyer assurances'))
    return config.CATEGORY.basicos
  if(d.includes('tpv red beef'))
    return config.CATEGORY.fuera
  if(d.includes('tpv saturn'))
    return config.CATEGORY.otros
  if(d.includes('tpv colruyt'))
    return config.CATEGORY.supermercado
  if(d.includes('tpv aldi'))
    return config.CATEGORY.supermercado
  if(d.includes('tpv quick'))
    return config.CATEGORY.fuera
  if(d.includes('tpv orchestra'))
    return config.CATEGORY.otros
  if(d.includes('tpv kebab'))
    return config.CATEGORY.fuera
  if(d.includes('tpv monop'))
    return config.CATEGORY.supermercado
  if(d.includes('tpv pizza hut'))
    return config.CATEGORY.fuera
  if(d.includes('tpv cfl'))
    return config.CATEGORY.transporte
  if(d.includes('tpv mc donald'))
    return config.CATEGORY.fuera
  if(d.includes('tpv pharmacie'))
    return config.CATEGORY.salud
  if(d.includes('cash withdrawal'))
    return config.CATEGORY.efectivo
  return config.CATEGORY.otros
}

function verifyTitles(fields) {
  for(var j in fields){
    fields[j] = fields[j].replace(/[^a-zA-Z0-9 ]/g, "")
    if( fields[j] !== expectedTitles[j] )
      throw new Error(`The title '${fields[j]}' should be equal to '${expectedTitles[j]}'. Filename: '${filename}'`)
  }
}

async function processNewFiles() {
  var names = await readdir('./')
  var csv_filenames = []
  for(var i in names)
    if(names[i].substring(names[i].length-3) === 'csv')
      csv_filenames.push( names[i] )

  for(var f in csv_filenames){
    var filename = csv_filenames[f]

    if(state && state.processed_files && state.processed_files.length > 0){
      var file_processed = state.processed_files.find( (p)=>{return p.file === filename} )
      if(file_processed) continue
    }

    var data = fs.readFileSync(filename, 'utf8')
    var lines = data.split('\n')
    var records = []
    var hasError = false
    for(var i in lines){
      try{
        var line = lines[i]
        var fields = line.split(';')
        if(fields.length < expectedTitles.length)
          continue
        if(i==0){
          verifyTitles(fields)
          continue
        }
        var record = parseRecord(fields)
        records.push(record)
      }catch(error){
        log(`Error in file '${filename}', line ${i}`)
        log(error.message)
        hasError = true
        break
      }
    }

    if(!hasError){
      if(!state.processed_files) state.processed_files = []
      state.processed_files.push({
        file: filename,
        time: now()
      })
      for(var i in records)
        db.push(records[i])
      log(`New file processed: ${filename}`)
      log(`${records.length} records added`)
      await save()
    }
  }
}

async function save(){
  await writeFile(config.DB_FILENAME, JSON.stringify(db))
  await writeFile(config.STATE_FILENAME, JSON.stringify(state))
}

async function main() {
  if( !fs.existsSync(config.DB_FILENAME) ){
    log(`Database ${config.DB_FILENAME} does not exists. Creating a new file`)
    await writeFile(config.DB_FILENAME, '[]')
  }
  if( !fs.existsSync(config.STATE_FILENAME) ){
    log(`${config.STATE_FILENAME} does not exists. Creating a new file`)
    await writeFile(config.STATE_FILENAME, '{}')
  }
  db = fs.readFileSync(config.DB_FILENAME, 'utf-8')
  state = fs.readFileSync(config.STATE_FILENAME, 'utf-8')

  db = JSON.parse(db)
  state = JSON.parse(state)

  await processNewFiles()
  /*db.forEach( (r)=>{
    console.log(r.description)
    console.log(r.msg1)
  })*/
}

main()

const fs = require('fs')
const util = require('util')
const config = require('./config')
const Accounts = require('./accounts')

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
  {name: 'amount', type: 'number'},
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
  var account = Accounts.estimateAccount(record)
  record.date = new Date(record.date_transaction+'Z').getTime()
  if(record.amount >= 0){
    record.debit = account.debit
    record.credit = account.credit
  }else{
    record.amount = -record.amount //store only positive number, then the relation debit/credit changes
    record.debit = account.credit
    record.credit = account.debit
  }
  return record
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

      var appended = true
      var changed_from = -1
      for(var i in records){
        var result = insertRecord(records[i])
        if(!result.appended){
          appended = false
        }
        if(result.changed_from < changed_from || changed_from == -1){
          changed_from = result.changed_from
        }
      }

      if(changed_from >= 0) recalculateBalances(changed_from)

      log(`New file processed: ${filename}`)
      log(`${records.length} records added`)
      if(!appended){
        log(`There are records in the past. Balances and reports recalculated from date ${new Date(db[changed_from].date).toISOString().slice(0,-5)}`)
      }
      await save()
    }
  }
}

function recalculateBalances(index){
  if(!state.balances){
    state.balances = {
      global: []
    }

    for(var i in Accounts.ACCOUNTS){
      state.balances.global.push({
        account:  Accounts.ACCOUNTS[i].name,
        currency: Accounts.ACCOUNTS[i].currency,
        precision:Accounts.ACCOUNTS[i].precision,
        debits: 0,
        credits: 0,
        balance_debit: 0,
        balance_credit:0,
        balance: 0
      })
    }
  }

  for(var i=index; i<db.length; i++){
    var account_debit  = db[i].debit
    var account_credit = db[i].credit
    var globalBdebit  = state.balances.global.find( (b)=>{return b.account === account_debit})
    var globalBcredit = state.balances.global.find( (b)=>{return b.account === account_credit})
    globalBdebit.debits += db[i].amount
    globalBcredit.credits += db[i].amount
  }

  for(var i in state.balances.global){
    var g = state.balances.global[i]
    g.balance = g.debits - g.credits
    if(g.balance >= 0)
      g.balance_debit  =  g.balance
    else
      g.balance_credit = -g.balance
    //problem with float number: removing 0.0000001 issues
    var fields = ['debits','credits','balance_debit','balance_credit','balance']
    for(var f in fields){
      g[fields[f]] = parseFloat(g[fields[f]].toFixed(g.precision))
    }
  }
}

function insertRecord(record){
  if(db.length == 0){
    db.push(record)
    return {appended:true, changed_from: db.length-1}
  }

  if(record.date >= db[db.length-1].date){
    db.push(record)
    return {appended:true, changed_from: db.length-1}
  }

  var index = db.findIndex( (r)=>{return r.date > record.date})
  if(index < 0)
    throw new Error(`Database error: index = -1, db.length:${db.length}, db date:${new Date(db[db.length-1].date).toISOString()}, record to insert:${JSON.stringify(record)}`)
  db.splice(index, 0, record)
  return {appended:false, changed_from:index}
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

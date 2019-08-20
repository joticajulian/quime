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

/**
 * Function to determine if 2 records have the same data
 */
function equalRecord(a,b){
  for(var i in titles){
    if(titles[i].name === 'balance') continue
    if(a[titles[i].name] !== b[titles[i].name])
      return false
  }
  return true
}

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

  var changed_from = -1
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
      records = countDuplicates(records)
      var total_records = records.reduce( (t,r)=>{ return t + 1 + r.repeated}, 0)
      var dateRange = getDateRange(records)
      var dbFiltered = db.filter( (r)=>{ return r.date >= dateRange.start && r.date <= dateRange.end})

      // Loop to remove from "records" the records that are already in the database "db"
      var repeated = 0
      dbFiltered.forEach( (r)=>{
        var index_found = records.findIndex( (re)=>{ return equalRecord(re, r) })
        if(index_found >= 0){
          records[index_found].repeated--
          if(records[index_found].repeated < 0){
            var removed = records.splice(index_found, 1)
            repeated++
          }
        }
      })

      var appended = true
      for(var i in records){
        for(var j=0; j<records[i].repeated+1; j++){ //repeated=0: write once. repeated=1: write two times. repeated=2. write the record three times.
          var result = insertRecord(records[i])
          if(!result.appended){
            appended = false
          }
          if(result.changed_from < changed_from || changed_from == -1){
            changed_from = result.changed_from
          }
        }
      }

      total_records = records.reduce( (t,r)=>{ return t + 1 + r.repeated}, 0)
      log(`New file processed: ${filename}`)
      log(`${total_records} records added (repeated: ${repeated})`)
      if(!appended){
        log(`There are records in the past. Balances and reports recalculated from date ${new Date(db[changed_from].date).toISOString().slice(0,-5)}`)
      }
      await save()
    }
  }
  return changed_from
}

/**
 * Function to count if there are duplication of records
 * Returns the list of records with an additional field (repeated) that contains the number of repetitions
 */
function countDuplicates(a){
  var b = []
  while( a.length > 0 ){
    var item = a.splice(0,1)
    item = item[0]
    item.repeated = 0
    var index_repeated = 0
    while(true){
      var index_repeated = a.findIndex( (r)=>{ return equalRecord(r, item) })
      if(index_repeated>=0){
        item.repeated++
        a.splice(index_repeated, 1)
      }else{
        break
      }
    }
    b.push(item)
  }
  return b
}

function getDateRange(data){
  if(data.length == 0)
    return {start: null, end: null}
  var start = data[0].date
  var end = data[0].date
  for(var i=1; i<data.length; i++){
    if(data[i].date < start) start = data[i].date
    if(data[i].date > end)   end   = data[i].date
  }
  return {start, end}
}

function recalculateBalances(index){
  index = 0 //the actual code is only functional for append, not modify existing balance, then calculation from the beggining is needed.

  var getPeriod = (year1, month1, year2, month2) => {
    var start = new Date(year1,month1).getTime()

    if(!year2 || !month2){ year2=year1; month2=month1; }
    month2++
    if(month2 > 11){ month2=0; year2++ }

    var end = new Date(year2,month2).getTime() - 1000
    return { 
      start, 
      end,
      start_date: new Date(start).toISOString().slice(0,-5),
      end_date: new Date(end).toISOString().slice(0,-5)
    }
  }
 
  if(true){ //if(!state.balances_by_period){
    state.balances_by_period = []

    var years = 4
    for(var i=0; i< years*12+1; i++){
      state.balances_by_period[i] = {}

      if(i == 0) //global balance
        state.balances_by_period[i].period = getPeriod(2000,0,2037,11) //from jan 2000 to dec 2037
      else{
        var year = 2018 + Math.floor((i-1)/12)
        var month = (i-1)%12
        state.balances_by_period[i].period = getPeriod(year, month)
      }

      state.balances_by_period[i].accounts = []
      for(var j in Accounts.ACCOUNTS){      
        state.balances_by_period[i].accounts.push({
          account:  Accounts.ACCOUNTS[j].name,
          account_type: Accounts.ACCOUNTS[j].type,
          currency: Accounts.ACCOUNTS[j].currency,
          precision:Accounts.ACCOUNTS[j].precision,
          debits: 0,
          credits: 0,
          balance_debit: 0,
          balance_credit:0,
          balance: 0
        })
      }
    }
  }

  for(var i in state.balances_by_period){
    for(var j=index; j<db.length; j++){
      var record = db[j]
      if(record.date < state.balances_by_period[i].period.start ||
         record.date > state.balances_by_period[i].period.end
      )
        continue

      var account_debit  = record.debit
      var account_credit = record.credit

      var balanceAccountDebit  = state.balances_by_period[i].accounts.find( (b)=>{return b.account === account_debit})
      var balanceAccountCredit = state.balances_by_period[i].accounts.find( (b)=>{return b.account === account_credit})
      balanceAccountDebit.debits += record.amount
      balanceAccountCredit.credits += record.amount
    }

    for(var j in state.balances_by_period[i].accounts){
      var a = state.balances_by_period[i].accounts[j]
      a.balance = a.debits - a.credits
      if(a.balance >= 0) a.balance_debit = a.balance
      else a.balance_credit = -a.balance

      //problem with float number: removing 0.0000001 issues
      var fields = ['debits','credits','balance_debit','balance_credit','balance']
      for(var f in fields){
        try{
        a[fields[f]] = parseFloat(a[fields[f]].toFixed(a.precision))
        }catch(error){
          log(`Error in period ${j}: balance account 1: ${JSON.stringify(a)}`)
          throw error
        }
      }
    }
  }
}

function insertRecord(_record){
  var record = JSON.parse(JSON.stringify(_record))
  delete record.repeated
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

async function save(files){
  if(!files) files = ['db','state']
  for(var i in files){
    if( files[i]==='db'    ) await writeFile(config.DB_FILENAME, JSON.stringify(db))
    if( files[i]==='state' ) await writeFile(config.STATE_FILENAME, JSON.stringify(state))
  }
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

  var changed_from = await processNewFiles()
  recalculateBalances(0)
  await save(['state'])
}

main()

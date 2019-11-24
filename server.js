#!/usr/bin/env node

const fs = require('fs')
const util = require('util')
const express = require('express')
const cookieSession = require('cookie-session')
const bodyParser = require('body-parser')
const passport = require('passport')
const uuidv1 = require('uuidv1')
require('dotenv').config()

const config = require('./config')
const Accounts = require('./accounts')
const Spuerkeess = require('./spuerkeess')

const writeFile = util.promisify(fs.writeFile)
const readdir = util.promisify(fs.readdir)

var db = []
var state = {}

// Accounts.ACCOUNTS = require('./src/assets/accountsDev')

const now = ()=>{ return new Date().toISOString().slice(0,-5) }
const log = (text)=>{ console.log(now() + ' - ' + text) }

const app = express()
const LocalStrategy = require('passport-local').Strategy
const port = process.env.PORT || 3000

loadDB()
.then(()=>{recalculateBalances(0)})

app.all('*', function(req, res, next) {
  res.header('Access-Control-Allow-Origin','*')
  res.header('Access-Control-Allow-Headers','X-Requested-With, Content-type,Accept,X-Access-Token,X-Key')
  res.header('Access-Control-Allow-Origin', '*')
  next()
})

app.use(express.static(config.PUBLIC_ROOT))
app.use(bodyParser.json())
app.use(cookieSession({
  name: 'mysession',
  keys: ['randomkey'],
  maxAge: 24*60*60*1000 //24 hours
}))
app.use(passport.initialize())
app.use(passport.session())

app.get('/', (req, res, next) => {
  res.sendFile('index.html', {root: config.PUBLIC_ROOT})
})

app.post('/api/login', (req, res, next)=>{
  log('Trying to Login')
  passport.authenticate('local', (err, user, info)=>{
    if(err) return next(err)
    if(!user) return res.status(400).send([user, 'Cannot log in', info])
    req.login(user, (err)=>{ res.send('Logged in') })
  })(req, res, next)
})

app.get('/api/logout', (req, res)=>{
  req.logout()
  log('logout')
  return res.send()
})

const authMiddleware = async (req, res, next) => {
  return next()
  if(!req.isAuthenticated()){
    log('Not authenticated')
    res.status(401).send('You are not authenticated')
  }else{
    return next()
  }
}

app.post('/api/update', authMiddleware, (req, res, next)=>{
  log('Trying to Update')
  var record = req.body.record
  var id = req.body.record.id
  removeRecord(id)
  insertRecord(record, id)
  recalculateBalances(0)
  save(['db'])
  res.send('updated')
  console.log('updated')
})

app.post('/api/insert', authMiddleware, (req, res, next)=>{
  log('Trying to add')
  var record = req.body.record
  insertRecord(record)
  recalculateBalances(0)
  save(['db'])
  res.send('inserted')
  console.log('inserted')
})

app.post('/api/remove', authMiddleware, (req, res, next)=>{
  log('Trying to remove')
  var id = req.body.id
  removeRecord(id)
  recalculateBalances(0)
  save(['db'])
  res.send('removed')
  console.log('removed')
})

app.get('/api/run_parser', authMiddleware, async (req, res, next)=>{
  try{
    log('run parser')
    await quime_parser()
    res.send('ok')
  }catch(error){
    log(error.message)
    res.status(404).send(error.message)
  }
})

app.get('/db.json', authMiddleware, (req, res, next)=>{
  log('db.json request')
  res.sendFile('db.json', {root: config.PRIVATE_ROOT})
})

app.get('/state.json', authMiddleware, (req, res, next)=>{
  log('state.json request')
  res.sendFile('state.json', {root: config.PRIVATE_ROOT})
})

app.get('/api/accounts', authMiddleware, (req, res, next)=>{
  res.send(Accounts.ACCOUNTS)
})

passport.use(new LocalStrategy({
    usernameField: 'username',
    passwordField: 'password'    
  },
  (username, password, done) => {
    (()=>{
      var user = {username, password}
      if(username === config.USERNAME && password === config.PASSWORD)
         done(null, user)
      else
         done(null, false, {message: 'Incorrect username or password'})
    })()
  }
))

passport.serializeUser((user, done) => {
  done(null, user.username)
})

passport.deserializeUser((username, done) => {
  if(username === config.USERNAME){
    done(null, {username: config.USERNAME, password: config.PASSWORD})
  }else{
    console.log('Error user')
    done(null, null)
  }
})

app.listen(port, () => {
  console.log("Server quime listening on port "+port)
})

function fileProcessed(filename){
  if(!state || !state.processed_files || state.processed_files.length == 0) return false
  var file_processed = state.processed_files.findIndex( (p)=>{return p.file === filename} )
  return (file_processed >= 0)
}

function addFileProcessed(filename){
  if(!state.processed_files) state.processed_files = []
  state.processed_files.push({
    file: filename,
    time: now()
  })
}

async function getNewFilesCSV(){
  var names = await readdir('./')
  var csv_filenames = []
  for(var i in names){
    var filename = names[i]
    if(filename.substring(filename.length-3) === 'csv' && !fileProcessed(filename))
      csv_filenames.push( filename )
  }
  return csv_filenames
}

function removeAlreadyInDB(records){
  //In the legitime case where several records have the same date and data they have to be counted
  records = countDuplicates(records)
  var dateRange = getDateRange(records)
  var dbFiltered = db.filter( (r)=>{ return r.date >= dateRange.start && r.date <= dateRange.end})

  // Loop to remove from "records" the records that are already in the database "db"
  var total_repeated = 0
  dbFiltered.forEach( (r)=>{
    var index_found = records.findIndex( (re)=>{ return Spuerkeess.equalRecord(re, r) })
    if(index_found >= 0){
      records[index_found].repeated--
      if(records[index_found].repeated < 0){
        records.splice(index_found, 1)
        total_repeated++
      }
    }
  })
  var total_records = records.reduce( (t,r)=>{ return t + 1 + r.repeated}, 0)
  return {records, total_records, total_repeated}
}

async function processNewFiles() {
  var csv_filenames = await getNewFilesCSV()
  var changed_from = -1

  for(var f in csv_filenames){
    var filename = csv_filenames[f]

    try{
      var records = Spuerkeess.readCSV(filename, 1)
    }catch(error){
      console.log('error option 1. '+error.message)
      console.log('trying option 2')
      try{
        var records = Spuerkeess.readCSV(filename, 2)
      }catch(error){
        console.log('error option 2. '+error.message)
        console.log(error)
        continue
      }
    }

    // remove those that are already in the DB. This function modifies "records"
    var result = removeAlreadyInDB(records)
    records = result.records
    var total_repeated = result.total_repeated
    var total_records = result.total_records

    var appended = true
    for(var i in records){
      for(var j=0; j<records[i].repeated+1; j++){ //repeated=0: write once. repeated=1: write two times. repeated=2. write the record three times.
        var result = insertRecord(records[i])

        if(!result.appended) appended = false

        if(result.changed_from < changed_from || changed_from == -1)
          changed_from = result.changed_from
      }
    }

    addFileProcessed(filename)
    log(`New file processed: ${filename}`)
    log(`${total_records} records added (repeated and not added: ${total_repeated})`)
    if(!appended){
      log(`There are records in the past. Balances and reports recalculated from date ${new Date(db[changed_from].date).toISOString().slice(0,-5)}`)
    }
    save(['db'])
  }
  return changed_from
}

function insertRecord(_record, id){
  var record = JSON.parse(JSON.stringify(_record))

  if(id) record.id = id
  else   record.id = uuidv1()

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

function removeRecord(id){
  log(`db size: ${db.length}`)
  var index = db.findIndex( (r)=>{return r.id === id})
  if(index < 0) throw new Error(`Bad index ${id}`)
  db.splice(index, 1)
  return index
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
      var index_repeated = a.findIndex( (r)=>{ return Spuerkeess.equalRecord(r, item) })
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

function newAccountBalance(account){
  return {
    account:  account.name,
    account_type: account.type,
    currency: account.currency,
    precision:account.precision,
    debits: 0,
    credits: 0,
    balance_debit: 0,
    balance_credit:0,
    balance: 0,    // balance of the period
    acc_balance: 0 // accumulated balance
  }
}

//problem with float number: removing 0.0000001 issues
function fixFloatNumbers(accountBalance, period){
  var fields = ['debits','credits','balance_debit','balance_credit','balance','acc_balance']
  for(var f in fields){
    var field = fields[f]
    try{
      accountBalance[field] = parseFloat(accountBalance[field].toFixed(accountBalance.precision))
    }catch(error){
      log(`Error in period ${period}: balance account: ${JSON.stringify(accountBalance[field])}`)
      throw error
    }
  }
}


function recalculateBalances(index){
  index = 0 // TODO: calculate from index

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
    for(var i=0; i< years*12; i++){
      state.balances_by_period[i] = {}

      var year = 2018 + Math.floor((i-1)/12)
      var month = (i-1)%12
      state.balances_by_period[i].period = getPeriod(year, month)

      state.balances_by_period[i].accounts = []
      for(var j in Accounts.ACCOUNTS){
        var accountBalance = newAccountBalance(Accounts.ACCOUNTS[j])
        state.balances_by_period[i].accounts.push( accountBalance )
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

      var accountBalanceDebit  = state.balances_by_period[i].accounts.find( (b)=>{return b.account === account_debit})
      var accountBalanceCredit = state.balances_by_period[i].accounts.find( (b)=>{return b.account === account_credit})
      accountBalanceDebit.debits += record.amount
      accountBalanceCredit.credits += record.amount
    }

    for(var j in state.balances_by_period[i].accounts){
      var a = state.balances_by_period[i].accounts[j]
      a.balance = a.debits - a.credits
      var lastBalance = 0
      if(i>0)
        lastBalance = state.balances_by_period[i-1].accounts[j].acc_balance
      a.acc_balance = a.balance + lastBalance
      if(a.balance >= 0) a.balance_debit = a.balance
      else a.balance_credit = -a.balance

      a = fixFloatNumbers(a,j)
    }
  }
  save(['state'])
}


function save(files){
  if(!files) files = ['db','state']
  for(var i in files){
    if( files[i]==='db'    ) writeFile(config.DB_FILENAME, JSON.stringify(db))
    if( files[i]==='state' ) writeFile(config.STATE_FILENAME, JSON.stringify(state))
  }
}

async function loadDB() {
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
}

async function quime_parser() {
  await loadDB()
  var changed_from = await processNewFiles()
  recalculateBalances(0)
}


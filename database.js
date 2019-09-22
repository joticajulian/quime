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

const now = ()=>{ return new Date().toISOString().slice(0,-5) }
const log = (text)=>{ console.log(now() + ' - ' + text) }


class Database{
  constructor(){
    this.db = []
    this.state = []
  }

  fileProcessed(filename){
    if(!this.state || !this.state.processed_files || this.state.processed_files.length == 0) return false
    var file_processed = this.state.processed_files.findIndex( (p)=>{return p.file === filename} )
    return (file_processed >= 0)
  }

  addFileProcessed(filename){
    if(!this.state.processed_files) this.state.processed_files = []
    this.state.processed_files.push({
      file: filename,
      time: now()
    })
  }

  async getNewFilesCSV(){
    var names = await readdir('./')
    var csv_filenames = []
    for(var i in names){
      var filename = names[i]
      if(filename.substring(filename.length-3) === 'csv' && !this.fileProcessed(filename))
      csv_filenames.push( filename )
    }
    return csv_filenames
  }

  removeAlreadyInDB(records){
    //In the legitime case where several records have the same date and data they have to be counted
    records = countDuplicates(records)
    var dateRange = this.getDateRange(records)
    var dbFiltered = this.db.filter( (r)=>{ return r.date >= dateRange.start && r.date <= dateRange.end})

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

  async processNewFiles() {
    var csv_filenames = await this.getNewFilesCSV()
    var changed_from = -1

    for(var f in csv_filenames){
      var filename = csv_filenames[f]

      try{
        var records = Spuerkeess.readCSV(filename)      
      }catch(error){
        console.log(error)
        continue
      }

      // remove those that are already in the DB. This function modifies "records"
      var result = this.removeAlreadyInDB(records)
      records = result.records
      var total_repeated = result.total_repeated
      var total_records = result.total_records

      var appended = true
      for(var i in records){
        for(var j=0; j<records[i].repeated+1; j++){ //repeated=0: write once. repeated=1: write two times. repeated=2. write the record three times.
          var result = this.insertRecord(records[i])

          if(!result.appended) appended = false

          if(result.changed_from < changed_from || changed_from == -1)
            changed_from = result.changed_from
        }
      }

      this.addFileProcessed(filename)
      log(`New file processed: ${filename}`)
      log(`${total_records} records added (repeated and not added: ${total_repeated})`)
      if(!appended){
        log(`There are records in the past. Balances and reports recalculated from date ${new Date(db[changed_from].date).toISOString().slice(0,-5)}`)
      }
    }
    return changed_from
  }

  insertRecord(_record, id){
    var record = JSON.parse(JSON.stringify(_record))

    if(id) record.id = id
    else   record.id = uuidv1()

    delete record.repeated
    if(db.length == 0){
      this.db.push(record)
      return {appended:true, changed_from: db.length-1}
    }

    if(record.date >= db[db.length-1].date){
      this.db.push(record)
      return {appended:true, changed_from: db.length-1}
    }

    var index = db.findIndex( (r)=>{return r.date > record.date})
    if(index < 0)
      throw new Error(`Database error: index = -1, db.length:${db.length}, db date:${new Date(db[db.length-1].date).toISOString()}, record to insert:${JSON.stringify(record)}`)
    this.db.splice(index, 0, record)
    return {appended:false, changed_from:index}
  }

  removeRecord(id){
    var index = this.db.findIndex( (r)=>{return r.id === id})
    if(index < 0) throw new Error('Bad index')
    this.db.splice(index, 1)
    return index
  }

  /**
   * Function to count if there are duplication of records
   * Returns the list of records with an additional field (repeated) that contains the number of repetitions
   */
  countDuplicates(a){
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

  getDateRange(data){
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

  newAccountBalance(account){
    return {
      account:  account.name,
      account_type: account.type,
      currency: account.currency,
      precision:account.precision,
      debits: 0,
      credits: 0,
      balance_debit: 0,
      balance_credit:0,
      balance: 0
    }
  }

  //problem with float number: removing 0.0000001 issues
  fixFloatNumbers(accountBalance, period){
    var fields = ['debits','credits','balance_debit','balance_credit','balance']
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


  recalculateBalances(index, state){
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
      this.state.balances_by_period = []

      var years = 4
      for(var i=0; i< years*12+1; i++){
        this.state.balances_by_period[i] = {}

        if(i == 0) //global balance
          this.state.balances_by_period[i].period = getPeriod(2000,0,2037,11) //from jan 2000 to dec 2037
        else{
          var year = 2018 + Math.floor((i-1)/12)
          var month = (i-1)%12
          this.state.balances_by_period[i].period = getPeriod(year, month)
        }

        this.state.balances_by_period[i].accounts = []
        for(var j in Accounts.ACCOUNTS){
          var accountBalance = newAccountBalance(Accounts.ACCOUNTS[j])
          this.state.balances_by_period[i].accounts.push( accountBalance )
        }
      }
    }

    for(var i in this.state.balances_by_period){
      for(var j=index; j<this.db.length; j++){
        var record = db[j]
        if(record.date < state.balances_by_period[i].period.start ||
           record.date > state.balances_by_period[i].period.end
        )
          continue

        var account_debit  = record.debit
        var account_credit = record.credit

        var accountBalanceDebit  = this.state.balances_by_period[i].accounts.find( (b)=>{return b.account === account_debit})
        var accountBalanceCredit = this.state.balances_by_period[i].accounts.find( (b)=>{return b.account === account_credit})
        accountBalanceDebit.debits += record.amount
        accountBalanceCredit.credits += record.amount
      }

      for(var j in this.state.balances_by_period[i].accounts){
        var a = this.state.balances_by_period[i].accounts[j]
        a.balance = a.debits - a.credits
        if(a.balance >= 0) a.balance_debit = a.balance
        else a.balance_credit = -a.balance

        a = this.fixFloatNumbers(a,j)
      }
    }
    return state
  }


  async process() {
    if( !fs.existsSync(config.DB_FILENAME) ){
      log(`Database ${config.DB_FILENAME} does not exists. Creating a new file`)
      await writeFile(config.DB_FILENAME, '[]')
    }
    if( !fs.existsSync(config.STATE_FILENAME) ){
      log(`${config.STATE_FILENAME} does not exists. Creating a new file`)
      await writeFile(config.STATE_FILENAME, '{}')
    }
    this.db = fs.readFileSync(config.DB_FILENAME, 'utf-8')
    this.state = fs.readFileSync(config.STATE_FILENAME, 'utf-8')

    this.db = JSON.parse(this.db)
    this.state = JSON.parse(this.state)

    var changed_from = await this.processNewFiles(this.db)
    this.state = this.recalculateBalances(0, this.state)
    await writeFile(config.DB_FILENAME, JSON.stringify(this.db))
    await writeFile(config.STATE_FILENAME, JSON.stringify(this.state))
  }

  await save(type){
    if(type === 'db') await writeFile(config.DB_FILENAME, JSON.stringify(this.db))
    else if(type === 'state') await writeFile(config.STATE_FILENAME, JSON.stringify(this.state))
    else throw new Error(`type '${type}' does not exist`)
  }
}

module.exports = {
  Database
}
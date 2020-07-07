const firebase = require('firebase-admin');

const config = require("../config");
const logger = require("../logger");
const csvParser = require("./csvParser");
const { v1: uuidv1 } = require('uuid');
const {BadRequestError, NotFoundError} = require("../errors");

const refFirestore = firebase.firestore().collection(config.collection);

var db = []
var state = {}
let accounts = [];

let initialized = false;

function isInitialized() {
  return initialized;
}

async function loadDB() {
  try{
    var docState = await refFirestore.doc('state').get();
    var docDB = await refFirestore.doc('db').get();
    const docAccounts = await refFirestore.doc("accounts").get();
    if(docState.exists) state = docState.data()
    if(docDB.exists) db = docDB.data().records
    if(docAccounts.exists) accounts = docAccounts.data().accounts;

    if(!state) state = {}
    if(!db) db = []
    if(!accounts) accounts = []
  }catch(error){
    logger.info('Firestore init error');
    throw error;
  }
}

function insertRecord(_record, id = uuidv1()){
  var record = JSON.parse(JSON.stringify(_record));

  record.id = id
  delete record.repeated
  if(db.length == 0){
    db.push(record)
    return {appended:true, changedFrom: db.length-1, id}
  }

  if(record.date >= db[db.length-1].date){
    db.push(record)
    return {appended:true, changedFrom: db.length-1, id}
  }

  var index = db.findIndex( (r)=>{return r.date > record.date})
  if(index < 0)
    throw new Error(`Database error: index = -1, db.length:${db.length}, db date:${new Date(db[db.length-1].date).toISOString()}, record to insert:${JSON.stringify(record)}`)
  db.splice(index, 0, record)
  return {appended:false, changedFrom:index, id}
}

function removeRecord(id){
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
      var index_repeated = a.findIndex( (r)=>{ return csvParser.equalRecord(r, item) })
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

function removeAlreadyInDB(records){
  //In the legitime case where several records have the same date and data they have to be counted
  records = countDuplicates(records)
  var dateRange = getDateRange(records)
  var dbFiltered = db.filter( (r)=>{ return r.date >= dateRange.start && r.date <= dateRange.end})

  // Loop to remove from "records" the records that are already in the database "db"
  var totalRepeated = 0
  dbFiltered.forEach( (r)=>{
    var index_found = records.findIndex( (re)=>{ return csvParser.equalRecord(re, r) })
    if(index_found >= 0){
      records[index_found].repeated--
      if(records[index_found].repeated < 0){
        records.splice(index_found, 1)
        totalRepeated++
      }
    }
  })
  var totalRecords = records.reduce( (t,r)=>{ return t + 1 + r.repeated}, 0)
  return {records, totalRecords, totalRepeated}
}

function newAccountBalance(account){
  if(!account.precision) account.precision = 2
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
      for(var j in accounts){
        var accountBalance = newAccountBalance(accounts[j])
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
    if( files[i]==='db'    ){
      // writeFile(config.DB_FILENAME, JSON.stringify(db))
      refFirestore.doc('db').set({records: db})
    }

    if( files[i]==='state' ){
      // writeFile(config.STATE_FILENAME, JSON.stringify(state))
      refFirestore.doc('state').set(state)
    }
  }
}

function insert(input) {
  let records;
  if(Array.isArray(input))
    records = input;
  else
    records = [input];

  // remove from "records" those that are already in the DB.
  const res = removeAlreadyInDB(records)
  records = res.records
  const totalRepeated = res.totalRepeated
  const totalRecords = res.totalRecords

  let changedFrom = -1;
  var appended = true
  let ids = [];
  for(var i in records){
    for(var j=0; j<records[i].repeated+1; j++){ //repeated=0: write once. repeated=1: write two times. repeated=2. write the record three times.
      var result = insertRecord(records[i])
      ids.push(result.id);

      if(!result.appended) appended = false
      if(result.changedFrom < changedFrom || changedFrom == -1)
        changedFrom = result.changedFrom
    }
  }
  recalculateBalances(0);
  save(['db']);
  return {
    totalRecords,
    totalRepeated,
    changedFrom,
    appended,
    ids,
  };
}

function update(id, record) {
  removeRecord(id)
  insertRecord(record, id)
  recalculateBalances(0)
  save(['db'])
  return "updated";
}

function remove(id) {
  removeRecord(id)
  recalculateBalances(0)
  save(['db'])
  return "removed";
}

async function parse(data) {
  try{
    const records = await csvParser.parse(data, 3);
    return records;
  } catch(error) {
    logger.info("Not parsed with option 3: " + error.message);
    logger.info("Trying option 2");
  }

  try{
    const records = await csvParser.parse(data, 2);
    return records;
  } catch(error) {
    logger.info("Not parsed with option 2: " + error.message);
    logger.info("Trying option 1");
  }

  try{
    const records = await csvParser.parse(data, 1);
    return records;
  } catch(error) {
    logger.info("Not parsed with option 1: " + error.message);
    throw new BadRequestError("Impossible to parse");
  }
}

function getRecord(id) {
  const record = db.find((r) => r.id === id);
  if(record) return record;
  else throw new NotFoundError(`id ${id} not found`);
}

function getRecords() {
  return { db, state, accounts };
}

loadDB().then(()=>{
  recalculateBalances(0);
  initialized = true;
})

module.exports = {
  insert,
  update,
  remove,
  parse,
  getRecords,
  getRecord,
  isInitialized,
};

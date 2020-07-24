const firebase = require('firebase-admin');

const config = require("../config");
const logger = require("../logger");
const database = require("../database");
const csvParser = require("./csvParser");
const { v1: uuidv1 } = require('uuid');
const {BadRequestError, NotFoundError} = require("../errors");
const { safeObject } = require("../utils/utils");



var db = []
var state = {}
let accounts = [];
let currencies = [];
let estimations = [];
let principalCurrency = "";

let initialized = false;

function isInitialized() {
  return initialized;
}

async function loadDB() {
  try{
    db = await database.getRecords();
    state = await database.getState();
    const data = await database.getAccounts();
    accounts = data.accounts;
    currencies = data.currencies;
    principalCurrency = data.principalCurrency;
    estimations = data.estimations;

    if(!state) state = {}
    if(!db) db = []
    if(!accounts) accounts = []
    if(!currencies) currencies = []
    if(!estimations) estimations = [];
  }catch(error){
    logger.info('Firestore init error');
    throw error;
  }
}

function insertRecord(r, id = uuidv1()){
  const amount = BigInt(r.amount).toString();
  let amountDebit;
  let amountCredit;

  if(r.amountDebit) amountDebit = BigInt(r.amountDebit).toString();
  if(r.amountCredit) amountCredit = BigInt(r.amountCredit).toString();

  const record = {
    id,
    date: r.date,
    description: r.description,
    debit: r.debit,
    credit: r.credit,
    amount,
    amountDebit,
    amountCredit,
  };

  const len = db.length;
  if (len === 0 || record.date >= db[len-1].date){
    db.push(record)
    return {appended:true, changedFrom: len-1, id}
  } else {
    const index = db.findIndex( (r)=>{return r.date > record.date})
    if(index < 0)
      throw new Error(`Database error: index = -1, db.length:${len}, db date:${new Date(db[len-1].date).toISOString()}, record to insert:${JSON.stringify(record)}`)
    db.splice(index, 0, record)
    return {appended:false, changedFrom:index, id};
  }
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
    debits: 0n, // debits in the principal currency
    credits: 0n, // credits in the principal currency
    debitsCurrency: 0n,  // debits in the currency of the account
    creditsCurrency: 0n, // credits in the currency of the account
    balance_debit: 0n,
    balance_credit:0n,
    balance_debitCurrency: 0n,
    balance_creditCurrency: 0n,
    balance: 0n,    // balance of the period
    balanceCurrency: 0n,
    acc_balance: 0n, // accumulated balance
    acc_balanceCurrency: 0n
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
    var currentPeriod = state.balances_by_period[i];
    if(i>0) var lastPeriod = state.balances_by_period[i-1];
    for(var j=index; j<db.length; j++){
      var record = db[j]
      if(record.date < currentPeriod.period.start ||
         record.date > currentPeriod.period.end
      )
        continue

      var account_debit  = record.debit
      var account_credit = record.credit

      var accountBalanceDebit  = currentPeriod.accounts.find( (b)=>{return b.account === account_debit})
      var accountBalanceCredit = currentPeriod.accounts.find( (b)=>{return b.account === account_credit})
      accountBalanceDebit.debits += BigInt(record.amount);
      accountBalanceCredit.credits += BigInt(record.amount);
      if(record.amountDebit)
        accountBalanceDebit.debitsCurrency += BigInt(record.amountDebit);
      if(record.amountCredit)
        accountBalanceCredit.creditsCurrency += BigInt(record.amountCredit);
    }

    for(var j in currentPeriod.accounts){
      var a = currentPeriod.accounts[j];
      a.balance = a.debits - a.credits
      a.balanceCurrency = a.debitsCurrency - a.creditsCurrency;

      if(i>0) {
        a.lastBalance = lastPeriod.accounts[j].acc_balance
        a.lastBalanceCurrency = lastPeriod.accounts[j].acc_balanceCurrency;
      } else {
        a.lastBalance = 0n
        a.lastBalanceCurrency = 0n
      }
      a.acc_balance = a.balance + a.lastBalance;
      a.acc_balanceCurrency = a.balanceCurrency + a.lastBalanceCurrency;
      if(a.balance >= 0) a.balance_debit = a.balance
      else a.balance_credit = -a.balance
      if(a.balanceCurrency >= 0) a.balance_debitCurrency = a.balanceCurrency;
      else a.balance_creditCurrency = -a.balanceCurrency;
    }
  }
  database.setState(state);
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
  database.setRecords(db);
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
  database.setRecords(db);
  return "updated";
}

function remove(id) {
  removeRecord(id)
  recalculateBalances(0)
  database.setRecords(db);
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
    logger.info("Trying option 4");
  }

  try{
    const records = await csvParser.parse(data, 4);
    return records;
  } catch(error) {
    logger.info("Not parsed with option 1: " + error.message);
    console.log(error);
    throw new BadRequestError("Impossible to parse");
  }
}

function getRecord(id) {
  const record = db.find((r) => r.id === id);
  if(record) return record;
  else throw new NotFoundError(`id ${id} not found`);
}

function getRecords() {
  return {
    db: safeObject(db),
    state: safeObject(state),
    accounts,
    currencies,
    estimations,
    principalCurrency,
  };
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

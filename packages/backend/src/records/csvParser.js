const logger = require("../logger");
const uuidv1 = require('uuid/v1');
const firebase = require('firebase-admin');
const config = require("../config");

const refAccounts = firebase.firestore().collection(config.collection).doc('accounts');

let accounts;
let estimations;

async function loadAccounts() {
   const docAccounts = await refAccounts.get();
   const data = docAccounts.data();
   if(!data.accounts) throw new Error("Accounts can not be loaded from firebase");
   accounts = data.accounts;

   if(!data.estimations) throw new Error("Estimation of accounts can not be loaded from firebase");
   estimations = data.estimations;
}

const expectedTitles1 = [
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

const titles1 = [
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

const expectedTitles2 = [
  'Date transaction',
  'Description',
  'Date valeur',
  'Montant en EUR',
  'Extrait',
  'Solde',
  'Opration',
  'Solde journalier',
  'Communication 1',
  'Communication 2',
  'Communication 3',
  'Communication 4',
  'Compte bnficiaire',
  'Nom de la contrepartie',
  'Adresse de la contrepartie',
  'Localit de la contrepartie'
]

const titles2 = [
  {name: 'date_transaction', type: 'date'},
  {name: 'description', type: 'string'},
  {name: 'date_value', type: 'date'},
  {name: 'amount', type: 'number'},
  {name: 'extrait', type: 'number'},
  {name: 'balance', type: 'number'},
  {name: 'operation', type: 'string'},
  {name: 'balance_day', type: 'number'},
  {name: 'msg1', type: 'string'},
  {name: 'msg2', type: 'string'},
  {name: 'msg3', type: 'string'},
  {name: 'msg4', type: 'string'},
  {name: 'account_to', type: 'string'},
  {name: 'name_to', type: 'string'},
  {name: 'address_to', type: 'string'},
  {name: 'city_to', type: 'string'},
]

const expectedTitles3 = [
  'Date transaction',
  'Description',
  'Date valeur',
  'Montant en EUR',
  'Extrait',
  'Solde journalier',
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

const titles3 = [
  {name: 'date_transaction', type: 'date'},
  {name: 'description', type: 'string'},
  {name: 'date_value', type: 'date'},
  {name: 'amount', type: 'number'},
  {name: 'extrait', type: 'number'},
  {name: 'balance_day', type: 'number'},
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


function verifyTitles(fields, option) {
  if(!option) option = 1
  logger.info(`number of titles: ${fields.length}`)

  if(option == 1){
    if(fields.length != expectedTitles1.length)
      throw new Error(`Number of titles: ${fields.length}. Expected: ${expectedTitles1.length}`)
  }else if(option == 2){
    if(fields.length != expectedTitles2.length)
      throw new Error(`Number of titles: ${fields.length}. Expected: ${expectedTitles2.length}`)
  }else if(option == 3){
    if(fields.length != expectedTitles3.length)
      throw new Error(`Number of titles: ${fields.length}. Expected: ${expectedTitles3.length}`)
  }else{
    throw new Error(`The optin ${option} for verify fields does not exist`)
  }

  for(var j in fields){
    fields[j] = fields[j].replace(/[^a-zA-Z0-9 ]/g, "")
    if(option == 1){
      if( fields[j] !== expectedTitles1[j] )
        throw new Error(`The title '${fields[j]}' should be equal to '${expectedTitles1[j]}'`)
    }else if(option == 2){
      if( fields[j] !== expectedTitles2[j] )
        throw new Error(`The title '${fields[j]}' should be equal to '${expectedTitles2[j]}'`)
    }else if(option == 3){
      if( fields[j] !== expectedTitles3[j] )
        throw new Error(`The title '${fields[j]}' should be equal to '${expectedTitles3[j]}'`)
    }else{
      throw new Error(`The optin ${option} for verify fields does not exist`)
    }
  }
}

/**
 * Function to determine if 2 records have the same data
 */
function equalRecord(a,b){
  var titles = titles1
  for(var i in titles){
    if(titles[i].name === 'balance') continue
    if(a[titles[i].name] !== b[titles[i].name])
      return false
  }
  titles = titles2
  for(var i in titles){
    if(titles[i].name === 'balance') continue
    if(a[titles[i].name] !== b[titles[i].name])
      return false
  }
  titles = titles3
  for(var i in titles){
    if(titles[i].name === 'balance') continue
    if(a[titles[i].name] !== b[titles[i].name])
      return false
  }
  return true
}

function estimateAccount(r) {
  if(!estimations || !Array.isArray(estimations) || estimations.length === 0)
    throw new Error("'estimation' must be an array of at least 1 item");

  for(let i=0; i<estimations.length; i+=1) {
    const e = estimations[i];

    // estimation by description
    if(e.description && r.description.includes(e.description))
      return e.resolve;

    // estimation by amount
    if(e.amount === "positive" && r.amount > 0)
      return e.resolve;

    // default estimation
    if(!e.description && !e.amount)
      return e.resolve;
  }
  throw new Error("accounts could not be estimated, and there in no default value defined");
}

function parseRecord(data,option) {
  var record = {id:uuidv1()}
  var titles = titles1
  if(option == 2) titles = titles2
  if(option == 3) titles = titles3
  for(var i in titles){
    switch(titles[i].type){
      case 'string':
        var value = data[i].trim().replace(/ +(?= )/g,'').toLowerCase()
        break
      case 'number':
        var value = parseFloat(data[i].replace(',','.'));
        // value as integer (we assume precision 2, for EUR)
        value = parseInt( 100 * value );
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

  var account = estimateAccount(record)
  record.date = new Date(record.date_transaction+'Z').getTime()
  if(record.amount >= 0){
    record.debit = account.debit
    record.credit = account.credit
  }else{
    //store only positive number, then the relation debit/credit changes
    record.amount = -record.amount
    record.debit = account.credit
    record.credit = account.debit
  }
  return record
}

async function parse(data, option) {
  await loadAccounts();

  if(!option) option = 1
  var lines = data.split('\n')
  var records = []
  logger.info(`number of lines: ${lines.length}`)
  for(let i=0; i<lines.length; i+=1){
    try{
      var line = lines[i]
      var fields = line.split(';')
      if(i===0){
        verifyTitles(fields,option)
        logger.info(`good titles option ${option}`)
        continue
      }
      if(option == 1 && fields.length < expectedTitles1.length)
        continue
      else if(option == 2 && fields.length < expectedTitles2.length)
        continue
      else if(option == 3 && fields.length < expectedTitles3.length)
        continue
      var record = parseRecord(fields, option)
      records.push(record)
    }catch(error){
      logger.info(`Error in line ${i}`)
      throw error
    }
  }
  return records
}

module.exports = {
  equalRecord,
  parse,
}

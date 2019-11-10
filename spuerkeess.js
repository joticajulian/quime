/**
 * Module to interpret the CSV files of Spuerkeess Bank
 * Author: Julian Gonzalez
 * License: MIT
 */

const fs = require('fs')
const uuidv1 = require('uuid/v1')
const Accounts = require('./accounts')

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


function verifyTitles(fields, option) {
  if(!option) option = 1
  for(var j in fields){
    fields[j] = fields[j].replace(/[^a-zA-Z0-9 ]/g, "")
    if(option == 1){
      if( fields[j] !== expectedTitles1[j] )
        throw new Error(`The title '${fields[j]}' should be equal to '${expectedTitles1[j]}'`)
    }else if(option == 2){
      if( fields[j] !== expectedTitles2[j] )
        throw new Error(`The title '${fields[j]}' should be equal to '${expectedTitles2[j]}'`)
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
  return true
}

function parseRecord(data,option) {
  var record = {id:uuidv1()}
  var titles = titles1
  if(option == 2) titles = titles2
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

function readCSV(filename, option) {
  if(!option) option = 1
  var data = fs.readFileSync(filename, 'utf8')
  var lines = data.split('\n')
  var records = []
  for(var i in lines){
    try{
      var line = lines[i]
      var fields = line.split(';')
      if(option == 1 && fields.length < expectedTitles1.length)
        continue
      else if(option == 2 && fields.length < expectedTitles2.length)
        continue
      if(i==0){
        verifyTitles(fields,option)
        continue
      }
      var record = parseRecord(fields, option)
      records.push(record)
    }catch(error){
      console.log(`Error in file '${filename}', line ${i}`)
      throw error
    }
  }
  return records
}

module.exports = {
  equalRecord,
  readCSV
}

/**
 * Module to interpret the CSV files of Spuerkeess Bank
 * Author: Julian Gonzalez
 * License: MIT
 */

const fs = require('fs')
const Accounts = require('./accounts')

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

function verifyTitles(fields) {
  for(var j in fields){
    fields[j] = fields[j].replace(/[^a-zA-Z0-9 ]/g, "")
    if( fields[j] !== expectedTitles[j] )
      throw new Error(`The title '${fields[j]}' should be equal to '${expectedTitles[j]}'. Filename: '${filename}'`)
  }
}

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

function readCSV(filename) {
  var data = fs.readFileSync(filename, 'utf8')
  var lines = data.split('\n')
  var records = []
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
      throw error
    }
  }
  return records
}

module.exports = {
  titles,
  equalRecord,
  readCSV
}

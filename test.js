const fs = require('fs');
const util = require('util');
const readdir = util.promisify(fs.readdir);

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
        var value = data[i]
        break
      case 'number':
        var value = parseFloat(data[i])
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
  return record
}

async function main() {
  var names = await readdir('./')
  var csv_filenames = []
  for(var i in names)
    if(names[i].substring(names[i].length-3) === 'csv')
      csv_filenames.push( names[i] )
  console.log(csv_filenames)
  
  var filename = csv_filenames[0]
  var data = fs.readFileSync(filename, 'utf8')
  var lines = data.split('\n')
  var records = []
  for(var i in lines){
    var line = lines[i]
    var fields = line.split(';')
    if(fields.length < expectedTitles.length) continue

    if(i==0){ //verify titles
      for(var j in fields){
        fields[j] = fields[j].replace(/[^a-zA-Z0-9 ]/g, "")
        if( fields[j] !== expectedTitles[j] )
          throw new Error(`The title '${fields[j]}' should be equal to '${expectedTitles[j]}'. Filename: '${filename}'`)
      }
      continue
    }
    var record = parseRecord(fields)
    records.push(record)
  }
  console.log(records)
}

main()

const fs = require('fs')
const util = require('util')

const STICKERS_PER_PAGE = 29

const writeFile = util.promisify(fs.writeFile)
const readdir = util.promisify(fs.readdir)

async function getNewFilesCSV(){
  var names = await readdir('./')
  var csv_filenames = []
  for(var i in names){
    var filename = names[i]
    if(filename.substring(filename.length-3) === 'csv')
      csv_filenames.push( filename )
  }
  return csv_filenames
}

function switchCalleCra(address){
  return address.toLowerCase()
    .replace('calle','Cra')
    .replace('carrera','Calle')
    .replace('cra','Calle')
    .replace('kra','Calle')
}

function getCity(address, index, changed = false){
  var manual_change = [
    
  ]
  
  var mc = manual_change.find( (m)=>{return m.line == index })
  if(mc) address = mc.new_address
  
  var a = address.toLowerCase()
  var has_cra = a.includes('cra') || a.includes('carrera') || a.includes('kra')
  var has_calle = a.includes('calle')
  var has_enea = a.includes('enea')
  var has_lusitania = a.includes('lusitania')
  var has_chachafruto = a.includes('chachafruto')
  var has_malteria = a.includes('malteria')
  
  var carrera = null
  var calle = null
  
  var manual_review = [
    {line:230, city:'enea'},
    {line:2140, city:'manizales'},
    {line:2419, city:'manizales'},
    {line:2663, city:'enea'},
    {line:2759, city:'manizales'},
    {line:3410, city:'manizales'},
  ]
  
  
  
  var mr = manual_review.find( (m)=>{return m.line == index })
  if(mr){
    console.log(`Manual review line ${index}: ${mr.city}: ${address}`)
    return {city: mr.city, address: address}
  }
  
  if(has_cra && has_calle){
    throw new Error(`Has carrera and calle ${index}: ${address}`)
  }
  if(has_cra){
    var i = a.indexOf('cra')
    var t = 3
    if(i<0){
      i = a.indexOf('carrera')
      t = 7
      if(i<0){
        i = a.indexOf('kra')
        t = 3
      }
    }
    var r = new RegExp("\d+")
    a = a.substring(i+t)
    var r = /\d+/g;
    var number;
    var numbers = []
    while( (number = r.exec(a)) !== null){
      numbers.push( parseInt(number) )
    }
    if(numbers.length == 0) throw new Error(`No numbers in carrera: ${address}`)    
    if(numbers.length == 1) throw new Error(`Only one number in: ${address}`)
    if(numbers.length == 2) console.log(`Warning, only two numbers in ${index}: ${address}`)
    carrera = numbers[0]
    calle = numbers[1]
  }
  if(has_calle){
    var i = a.indexOf('calle')
    var t = 5
    var r = new RegExp("\d+")
    a = a.substring(i+t)
    var r = /\d+/g;
    var number;
    var numbers = []
    while( (number = r.exec(a)) !== null){
      numbers.push( parseInt(number) )
    }
    if(numbers.length == 0) throw new Error(`No numbers in carrera: ${address}`)    
    if(numbers.length == 1) throw new Error(`Only one number in: ${address}`)
    if(numbers.length == 2) console.log(`Warning ${index}: only two numbers in: ${address}`)
    calle = numbers[0]
    carrera = numbers[1]
  }
  if(calle && carrera){
    if(calle >= 94) return {city: 'enea', address: address}
    if(carrera > 50){
      console.log(`Error ${index}: carrera mayor a 44: ${address}`)
      if(!changed) return getCity(switchCalleCra(address), index, true)
      else{
        console.log('Not found')
        return {city: '', address: ''}
      }
    }
    if(has_enea) throw new Error(`Has label enea but calle and carrera do not correspond: ${address}`) 

    if(calle >= 81 && calle < 94 && carrera >= 31) {
      //if(!has_lusitania) console.log(`Warning ${index}: Seems Lusitania but does not have the label: ${address}`)
      return {city: 'lusitania' , address: address}
    }
    if(has_chachafruto || has_malteria) console.log(`Warning ${index}: calle and carrera given including malteria or chachafruto: ${address}`)
    //return {city:'manizales', address: address}
  }
  if(has_lusitania){
    console.log(`Warning ${index}: Lusitania without address: ${address}`)
    return {city:'lusitania', address: address}
  }
  if(has_enea){
    console.log(`Warning ${index}: Enea without address: ${address}`)
    return {city: 'enea', address: address}
  }
  if(has_chachafruto){
    //console.log(`Warning: chachafruto taken as san marcel. ${address}`)
    return {city: 'san marcel', address: address}
  }
  if(a.includes('portal del bosque')) return {city: 'san marcel', address: address}
  if(a.includes('campestre')) {
    //console.log(`Warning: taken as colina campestre, san marcel: ${address}`)
    return {city: 'san marcel', address: address}
  }
  if(a.includes('sierra verde')) {
    //console.log(`Warning: san marcel: ${address}`)
    return {city: 'san marcel', address: address}
  }
  if(a.includes('san marcel')) {
    return {city: 'san marcel', address: address}
  }
  if(a.includes('el pinar')) {
    return {city: 'san marcel', address: address}
  }
  return {city: 'manizales', address: address}
}

function parseRecord(data, index) {
  if(data.length < 3) return null
  var expected_city = data[3].trim().toLowerCase()
  var result = getCity(data[2], index)
  var city = result.city
  var address = result.address
  if(index <= 2464 && expected_city !== city){
    //console.log(`mismatch ${index}: calculated: '${city}', expected: '${expected_city}' ... ${data[2]}`)
  }
  return {
    name: data[1],
    address: address,
    city: city,
    expected_city: expected_city
  }
}


function readCSV(filename) {
  var data = fs.readFileSync(filename, 'utf8')
  var lines = data.split('\n')
  var records = []
  for(var i in lines){
    if(i==0) continue
    try{
      var line = lines[i]
      var fields = line.split(';')
      var record = parseRecord(fields, i)
      if(record) records.push(record)
    }catch(error){
      console.log(`Error in file '${filename}', line ${i}`)
      throw error
    }
  }
  return records
}

function createStickersSVG(records){
  var extra_empty = records.length % STICKERS_PER_PAGE
  for(var i=0; i< extra_empty; i++) records.push({name:'', address:''})
  //writeFile(`records.json`, JSON.stringify(records))

  var svgdata = fs.readFileSync('stickers.svg', 'utf8')
  var j=0
  var filenumber = 0
  for(var i=0; i<records.length; i++){
    var recipient = records[i]
    if(j==0) var aux_svg = svgdata.slice(0)
    aux_svg = aux_svg.replace('{{name}}',recipient.name)
    aux_svg = aux_svg.replace('{{address}}',recipient.address)
    if(j==STICKERS_PER_PAGE-1){
      j=-1
      filenumber++
      console.log(`Writing file${filenumber}.svg`)
      writeFile(`results/file${filenumber}.svg`, aux_svg)
      if(filenumber==3) break
    }
    j++
  }
}

async function processNewFiles() {
  var csv_filenames = await getNewFilesCSV()

  for(var f in csv_filenames){
    var filename = csv_filenames[f]

    try{
      var records = readCSV(filename)
      console.log(`${records.length} records found`)
      //createStickersSVG(records)
      console.log(`${filename} processed`)
    }catch(error){
      console.log(error)
      continue
    }
  }
}

async function main() {
  await processNewFiles()
  //console.log(process.argv)
}

main()

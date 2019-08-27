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

function parseRecord(data) {
  if(data.length < 3) return null
  return {
    name: data[1],
    address: data[2]
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
      var record = parseRecord(fields)
      if(record) records.push(record)
    }catch(error){
      log(`Error in file '${filename}', line ${i}`)
      throw error
    }
  }
  return records
}

async function processNewFiles() {
  var csv_filenames = await getNewFilesCSV()

  for(var f in csv_filenames){
    var filename = csv_filenames[f]

    try{
      var records = readCSV(filename)
      console.log(`${records.length} records found`)
      var extra_empty = records.length % STICKERS_PER_PAGE
      for(var i=0; i< extra_empty; i++) records.push({name:'', address:''})

      var svgdata = fs.readFileSync('stickers.svg', 'utf8')
      var j=0
      var filenumber = 0
      for(var i=0; i<records.length; i++){
        var recipient = records[i]
        if(j==0) var aux_svg = svgdata.slice(0)
        aux_svg = aux_svg.replace('{{name}}',recipient.name)
        aux_svg = aux_svg.replace('{{address}}',recipient.address)
        if(j==STICKERS_PER_PAGE-1){
          j=0
          filenumber++
          console.log(`Writing file${filenumber}.svg`)
          writeFile(`results/file${filenumber}.svg`, aux_svg)
          if(filenumber==3) break
        }
        j++
      }
      console.log(`${filename} processed`)
    }catch(error){
      console.log(error)
      continue
    }
  }
}

async function main() {
  await processNewFiles()
}

main()

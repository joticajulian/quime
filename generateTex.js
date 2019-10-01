const fs = require('fs')
const util = require('util')

const writeFile = util.promisify(fs.writeFile)
const readdir = util.promisify(fs.readdir)

var textemplate = fs.readFileSync('stickers-template.tex', 'utf8')

var line = '\\includepdf[offset=0 0cm,pages={1}]{pdf/hoja{{number}}.pdf}'
lines = ''

for(var i=1; i<=304; i++){
  lines += line.replace('{{number}}',i) + '\n'
}

var data = textemplate.replace('{{javascript_text}}', lines)
writeFile('stickers.tex', data)

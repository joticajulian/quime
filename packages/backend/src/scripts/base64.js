const fs = require("fs");

const [file] = process.argv.slice(2)

if(!file) {
  console.log('Usage: base64.js <file>\nExample: node base64.js credential.json')
  return;
}

const credentialString = fs.readFileSync(file, 'utf-8')
const credentialBase64 = Buffer.from(credentialString).toString('base64');

const credentialString2 = Buffer.from(credentialBase64, 'base64').toString();
const json = JSON.parse(credentialString2)

console.log(json)
console.log(credentialBase64)

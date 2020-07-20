var fs = require('fs')
var firebase = require('firebase-admin');
const config = require('../config');

const refFirestore = firebase.firestore().collection(config.collection);

const [file] = process.argv.slice(2)

if(!file) {
  console.log('Usage: node upload-firebase.js <file>\nExample: node upload-firebase.js db.json')
  return;
}

function upload() {
  var db = fs.readFileSync(file, 'utf-8')
  db = JSON.parse(db)
  console.log(db)
  console.log(`type of db ${typeof db}`)
  console.log(`db has ${db.length} records`)
  refFirestore.doc('db').set({records: db})
  console.log(`${file} with ${db.length} records has been set in firebase. collection ${config.collection}`)
}

upload();

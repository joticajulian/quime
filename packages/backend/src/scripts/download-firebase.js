var fs = require('fs')
var firebase = require('firebase-admin');
const config = require('../config');

const refFirestore = firebase.firestore().collection(config.collection);

const [file] = process.argv.slice(2)

if(!file) {
  console.log('Usage: node download-firebase.js <file>\nExample: node download-firebase.js db.json');
  return;
}

async function download() {
  const doc = await refFirestore.doc('db').get();
  if(!doc.exists){
    console.log("No data in firebase")
    return
  }
  fs.writeFile(file, JSON.stringify(doc.data().records), function(err){
    if(err) throw err;
    console.log(`File saved in ${file} from collection ${config.collection}`)
  });
}

download();

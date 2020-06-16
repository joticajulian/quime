var fs = require('fs')
var firebase = require('firebase-admin');
require('dotenv').config()

const config = require('../config')

firebase.initializeApp({
  credential: firebase.credential.cert(config.credential),
  databaseURL: config.databaseURL,
});

const refFirestore = firebase.firestore().collection(config.collection);

const [type, file] = process.argv.slice(2)

if(!type || !file) {
  console.log('Usage: node import-export-firebase.js <type> <file>\nExample to download from firebase and save in db.json: node import-export-firebase.js export db.json')
}

if(type === "export"){
  refFirestore.doc('db').get().then(function (doc){
    if(!doc.exists){
      console.log("No data in firebase")
      return
    }
    fs.writeFile(file, JSON.stringify(doc.data()), function(err){
      if(err) throw err
      console.log(`File saved in ${file}!`)
    })
  });
}else if(type === "import"){
  var db = fs.readFileSync(file, 'utf-8')
  db = JSON.parse(db)
  console.log(db)
  console.log(`type of db ${typeof db}`)
  console.log(`db has ${db.length} records`)
  refFirestore.doc('db').set({records: db})
  console.log(`${file} with ${db.length} records has been set in firebase`)
}else{
  console.log("use import or export in first argument")
}

var firebase = require('firebase-admin');
const accounts = require("../accounts");
const config = require('../config')

firebase.initializeApp({
  credential: firebase.credential.cert(config.credential),
  databaseURL: config.databaseURL,
});

const refFirestore = firebase.firestore().collection(config.collection);

refFirestore.doc('accounts').set(accounts);
console.log("accounts saved in firebase");

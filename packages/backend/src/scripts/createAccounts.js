const firebase = require("firebase-admin");
const accounts = require("../accounts");
const config = require('../config');

const refFirestore = firebase.firestore().collection(config.collection);

refFirestore.doc('accounts').set(accounts);
console.log(`accounts saved in firebase. Collection ${config.collection}`);

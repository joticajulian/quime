var firebase = require('firebase-admin');
const config = require('../config');

const refFirestore = firebase.firestore().collection(config.collection);
refFirestore.doc('state').set({});
console.log(`state deleted in collection ${config.collection}`)

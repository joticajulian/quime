var firebase = require('firebase-admin');
const config = require('../config');
const { safeObject } = require("../utils/utils");

const { collection } = config;
const refFirestore = firebase.firestore().collection(config.collection);

async function getRecords() {
  const doc = await refFirestore.doc('db').get();

  if(!doc.exists)
    throw new Error(`No data in firebase for collection ${config.collection}`);

  return doc.data().records;
}

async function getState() {
  const doc = await refFirestore.doc('state').get();

  if(!doc.exists)
    throw new Error(`No data in firebase for collection ${config.collection}`);

  return doc.data();
}

async function getAccounts() {
  const doc = await refFirestore.doc("accounts").get();

  if(!doc.exists)
    throw new Error(`No accounts in firebase for collection ${config.collection}`);

  return doc.data();
}

function setRecords(records) {
  if(!Array.isArray(records))
    throw new Error("Save Error: records must be an array");
  refFirestore.doc('db').set({records: safeObject(records)});
}

function setState(state) {
  refFirestore.doc('state').set(safeObject(state));
}

function setAccounts(data) {
  if(!data.accounts)
    throw new Error("Save Error: Accounts are not defined");

  if(!data.principalCurrency)
    throw new Error("Save Error: principalCurrency not defined");

  if(!data.currencies)
    throw new Error("Save Error: currencies not defined");

  refFirestore.doc('accounts').set(data);
}

module.exports = {
  getRecords,
  getState,
  getAccounts,
  setRecords,
  setState,
  setAccounts,
  collection,
};

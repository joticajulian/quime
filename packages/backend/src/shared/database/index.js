var firebase = require('firebase-admin');
const config = require('../../config');
const { safeObject } = require("../../utils/utils");

const { collection } = config;
const refFirestore = firebase.firestore().collection(config.collection);

function onUpdate(callback) {
  refFirestore.doc("db").onSnapshot(function(doc) {
    callback("records", doc.data().records);
  });

  refFirestore.doc("state").onSnapshot(function(doc) {
    callback("state", doc.data() ? parseState(doc.data()) : null);
  });

  refFirestore.doc("accounts").onSnapshot(function(doc) {
    const data = doc.data();
    callback("accounts", data.accounts);
    callback("currencies", data.currencies);
    callback("principalCurrency", data.principalCurrency);
    callback("estimations", data.estimations);
  });
}

async function getRecords() {
  const doc = await refFirestore.doc('db').get();

  if(!doc.exists)
    throw new Error(`No data in firebase for collection ${config.collection}`);

  return doc.data().records;
}

function parseState(stateString) {
  let state = {};
  if(!stateString.balancesByPeriod) stateString.balancesByPeriod = [];
  state.balancesByPeriod = stateString.balancesByPeriod.map(b => {
    return {
      period: b.period,
      balances: b.balances.map(bAccount => {
        const balanceAccount = JSON.parse(JSON.stringify(bAccount));
        for(let prop in balanceAccount) {
          switch(prop) {
            case "account":
            case "type":
            case "currency":
            case "precision":
              break;
            default:
              for(var subProp in balanceAccount[prop])
                balanceAccount[prop][subProp] = BigInt(balanceAccount[prop][subProp]);
              break;
          }
        }
        return balanceAccount;
      }),
    };
  });
  return state;
}

async function getState() {
  const doc = await refFirestore.doc('state').get();

  if(!doc.exists)
    return null;

  return parseState(doc.data());
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

  if(!data.estimations)
    throw new Error("Save Error: estimations are not defined");

  refFirestore.doc('accounts').set(data);
}

function setCurrencies(data) {
  refFirestore.doc("currencies").set(data);
}

async function getCurrencies() {
  const doc = await refFirestore.doc("currencies").get();

  if(!doc.exists)
    throw new Error(`No currencies in firebase for collection ${config.collection}`);

  return doc.data();
}

module.exports = {
  getRecords,
  getState,
  getAccounts,
  setRecords,
  setState,
  setAccounts,
  onUpdate,
  collection,
  setCurrencies,
  getCurrencies,
};

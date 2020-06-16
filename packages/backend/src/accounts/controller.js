const firebase = require('firebase-admin');
const config = require("../config");

const refAccounts = firebase.firestore().collection(config.collection).doc('accounts');

function validateAccount(_account) {
  const {name, type, currency, logo, precision} = _account;
  let account = {name, type, currency, logo, precision};
  if(!name || typeof name !== "string" || name.length === 0)
    throw new Error("Invalid name account");
  if(!currency || typeof currency !== "string" || currency.length === 0)
    throw new Error("Invalid currency");

  switch(type) {
    case "asset":
    case "liability":
    case "income":
    case "expense":
      break;
    default:
      throw new Error(`Type '${type}' is invalid`);
  }

  if(!logo)
    account.logo = "";
  if(!precision)
    account.precision = 2;

  // TODO: check if already exist

  return account;
}

async function insertAccount(account) {
  const { accounts } = await getAccounts();
  if(accounts) {
    accounts.push(account);
    refAccounts.set({accounts});
  } else {
    refAccounts.set({accounts: [account]});
  }
}

function insert(_account) {
  const account = validateAccount(_account);
  insertAccount(account);
  return account;
}

function update(name, _account) {
  const account = validateAccount(_account);
  throw Error("Not implemented")
}

function remove(name) {
  throw Error("Not implemented")
}

async function getAccounts() {
  var docAccounts = await refAccounts.get();
  return docAccounts.data();
}

module.exports = {
  insert,
  update,
  remove,
  getAccounts,
};

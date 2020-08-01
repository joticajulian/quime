const accounts = require("../accounts");
const database = require("../database");

database.setAccounts(accounts);
console.log(`accounts saved in firebase. Collection ${database.collection}`);

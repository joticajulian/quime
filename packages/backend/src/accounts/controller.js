const book = require("../shared/book");

function insert(account) {
  book.insertAccount(account);
  return account;
}

function update(name, account) {
  book.updateAccount(name, account);
  return account;
}

function remove(name) {
  book.removeAccount(name);
}

module.exports = {
  insert,
  update,
  remove,
};

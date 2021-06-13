const logger = require("../logger");
const book = require("../shared/book");
const {BadRequestError} = require("../errors");

function currencyExists(name) {
  const currencies = book.getCurrencies()
  return !!currencies.find(c => c.name.toLowerCase() === name.toLowerCase());
}

function insert(currency) {
  if(currencyExists(currency.name))
    throw new BadRequestError(`currency ${currency.name} already exists`);
  book.insertCurrency(currency);
  return currency;
}

function update(name, currency) {
  if(!currencyExists(name))
    return new BadRequestError((`currency ${name} does not exist`));
  book.updateCurrency(name, currency);
  return currency;
}

function remove(name) {
  if(!currencyExists(name))
    return new BadRequestError((`currency ${name} does not exist`));
  book.removeCurrency(name);
  return;
}

module.exports = {
  insert,
  update,
  remove,
};

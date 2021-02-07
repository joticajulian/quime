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
  return currency;
}

module.exports = {
  insert,
};

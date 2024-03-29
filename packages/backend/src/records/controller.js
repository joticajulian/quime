const logger = require("../logger");
const book = require("../shared/book");
const csvParser = require("./csvParser");
const {BadRequestError, NotFoundError} = require("../errors");
const { safeObject } = require("../utils/utils");

function insert(input) {
  let records;
  if(Array.isArray(input))
    records = input;
  else
    records = [input];

  let changedFrom = -1;
  var appended = true
  let ids = [];
  for(var i in records){
    var result = book.insertRecord(records[i]);
    ids.push(result.id);
  }
  book.recalculateBalances();
  book.updateDatabase("records");
  return {
    ids,
  };
}

function update(id, record) {
  book.update(record, id);
  return "updated";
}

function remove(id) {
  book.remove(id);
  return "removed";
}

async function parse(data) {
  // account
  try{
    const records = await csvParser.parse(data, 3);
    return records;
  } catch(error) {
    logger.info("Not parsed with option 3: " + error.message);
    logger.info("Trying option 5 (credit card)");
  }

  // credit card
  try{
    const records = await csvParser.parse(data, 5);
    return records;
  } catch(error) {
    logger.info("Not parsed with option 5: " + error.message);
    logger.info("Trying option 2 (other bank account format)");
  }

  // account
  try{
    const records = await csvParser.parse(data, 2);
    return records;
  } catch(error) {
    logger.info("Not parsed with option 2: " + error.message);
    logger.info("Trying option 1");
  }

  try{
    const records = await csvParser.parse(data, 1);
    return records;
  } catch(error) {
    logger.info("Not parsed with option 1: " + error.message);
    logger.info("Trying option 4");
  }

  try{
    const records = await csvParser.parse(data, 4);
    return records;
  } catch(error) {
    logger.info("Not parsed with option 1: " + error.message);
    console.log(error);
    throw new BadRequestError("Impossible to parse");
  }
}

function getRecord(id) {
  const record = book.getRecord(id);
  if(record) return record;
  else throw new NotFoundError(`id ${id} not found`);
}

function getRecords() {
  try {
    return {
      db: safeObject(book.records),
      state: safeObject(book.state),
      accounts: book.accounts,
      currencies: book.currencies,
      estimations: book.estimations,
      principalCurrency: book.principalCurrency,
    };
  } catch(error) {
    console.log("book records");
    console.log(book.records);
    console.log("book state");
    console.log(book.state);
  }
}

module.exports = {
  insert,
  update,
  remove,
  parse,
  getRecords,
  getRecord,
};

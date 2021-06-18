const book = require("../shared/book");

function insert(position, estimation) {
  book.insertEstimation(position, estimation);
  return estimation;
}

function update(position, estimation) {
  book.updateEstimation(position, estimation);
  return estimation;
}

function remove(position) {
  book.removeEstimation(position);
}

module.exports = {
  insert,
  update,
  remove,
};

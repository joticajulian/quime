function safeObject(obj) {
  return JSON.parse(JSON.stringify(obj, (key, value) =>
      typeof value === 'bigint'
          ? value.toString()
          : value // return everything else unchanged
  ));
}

module.exports = {
  safeObject,
}

const database = require("../database");

const [oldName, newName] = process.argv.slice(2);

(async () => {
  let records = await database.getRecords();
  let counter = 0;
  records.forEach(r => {
    if(r.debit === oldName) {
      r.debit = newName;
      counter += 1;
    }

    if(r.credit === oldName) {
      r.credit = newName;
      counter += 1;
    }
  });

  if(counter > 0) {
    database.setRecords(records);
    console.log(`${counter} records updated. collection ${database.collection}`);
  } else {
    console.log(`Thre are no records for '${oldName}'`);
  }
})()

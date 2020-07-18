var firebase = require('firebase-admin');
const fs = require("fs");
const path = require("path");
const config = require('../config');
const { v1: uuidv1 } = require('uuid');

const refFirestore = firebase.firestore().collection(config.collection);

const [fileFixes] = process.argv.slice(2)

let dataFixes;
if(fileFixes) {
  dataFixes = fs.readFileSync(file, 'utf-8')
}

function getFilenameNoExist(input) {
  const extension = path.extname(input);
  let basename = path.basename(input, extension);
  let candidateOutput = basename + extension;
  for(let i=1; fs.existsSync(candidateOutput); i+=1 ) {
    candidateOutput = basename + i + extension;
  }
  return candidateOutput;
}

async function fixDb() {
  var docDB = await refFirestore.doc('db').get();
  const docAccounts = await refFirestore.doc("accounts").get();

  if(!docDB.exists) {
    console.log("No data in firebase")
    return
  }

  if(!docAccounts.exists) {
    console.log("No accounts in firebase")
    return
  }

  const db = docDB.data().records
  const accounts = docAccounts.data().accounts;
  const currencies = docAccounts.data().currencies;
  const principalCurrency = docAccounts.data().principalCurrency;

  const recordsErrors = [];

  const db2 = db.map((r) => {

    let {id, date, description,
       debit, credit, amount,
       amountDebit, amountCredit} = r;

    const errors = [];

    if(!date || typeof date !== "number") {
      date = 0;
      errors.push(`date changed from ${date} to 0`);
    }

    const accountDebit = accounts.find( (a)=>{return a.name === debit});
    const accountCredit = accounts.find( (a)=>{return a.name === credit});

    if(!accountDebit) {
      errors.push(`debit account '${debit}' not found in the list`);
    }

    if(!accountCredit) {
      errors.push(`debit account '${credit}' not found in the list`);
    }

    if(!id) {
      id = uuidv1();
    }

    if(!amount) {
      amount = "0";
      errors.push(`amount changed from '${amount}' to 0`);
    }

    if(typeof amount === "number") {
      amount = Number(amount).toString();
    }

    if(accountDebit.currency === principalCurrency)
      amountDebit = undefined;
    else if(typeof amountDebit === "number") {
      amountDebit = Number(amountDebit).toString();
    }

    if(accountCredit.currency === principalCurrency)
      amountCredit = undefined;
    else if(typeof amountCredit === "number") {
      amountCredit = Number(amountCredit).toString();
    }

    const record = {
      id,
      date,
      description,
      debit,
      credit,
      amount,
      amountDebit,
      amountCredit,
    };

    if(errors.length > 0){
      recordsErrors.push({
        ...record,
        errors,
      })
    }

    return record;
  });

  const file = getFilenameNoExist("dbFixed.json");
  fs.writeFileSync(file, JSON.stringify(db2));

  if(recordsErrors) {
    const fileErrors = getFilenameNoExist(`errors-${file}`);
    fs.writeFileSync(fileErrors, JSON.stringify(recordsErrors, null, 2));
  }
}

fixDb();

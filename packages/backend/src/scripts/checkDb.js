var firebase = require('firebase-admin');
const config = require('../config');

const refFirestore = firebase.firestore().collection(config.collection);

function isBigInt(x) {
  if(typeof x !== "string") return false;
  try{
    BigInt(x)
    return true;
  } catch(error) {
    return false;
  }
}

async function checkDb() {
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

  db.forEach((r, index) => {
    const errors = [];
    const accountDebit = accounts.find( (a)=>{return a.name === r.debit});
    const accountCredit = accounts.find( (a)=>{return a.name === r.credit});

    if(!r.id)
      errors.push("No id");
    if(typeof r.date !== "number")
      errors.push("date is not a number")
    if(!r.description)
      errors.push("description is empty");
    if(!r.amount)
      errors.push("no amount");
    if(!isBigInt(r.amount))
      errors.push("amount must be bigint written as string");

    if(accountDebit) {
      if(accountDebit.currency === principalCurrency) {
        if(r.amountDebit)
          errors.push("amountDebit should not be defined");
      }else{
        if(!r.amountDebit)
          errors.push(`no amountDebit for currency ${accountDebit.currency}`);
        if(!isBigInt(r.amountDebit))
          errors.push("amountDebit must be bigint written as string");
      }
    } else {
      errors.push(`Debit account '${r.debit}' not found`);
    }

    if(accountCredit) {
      if(accountCredit.currency === principalCurrency) {
        if(r.amountCredit)
          errors.push("amountCredit should not be defined");
      }else{
        if(!r.amountCredit)
          errors.push(`no amountCredit for currency ${accountCredit.currency}`);
        if(!isBigInt(r.amountCredit))
          errors.push("amountCredit must be bigint written as string");
      }
    } else {
      errors.push(`Credit account '${r.credit}' not found`);
    }

    if(errors.length > 0) {
      console.log(`\n${errors.length} errors in record ${index}`);
      console.log(r)
      errors.forEach( (e) => console.log(`error: ${e}`) );
    }
  });

}

checkDb();

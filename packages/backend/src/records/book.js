const { v1: uuidv1 } = require('uuid');
const database = require("../database");

class Book {
  async initBook() {
    this.records = await database.getRecords();
    this.state = await database.getState();
    const data = await database.getAccounts();
    this.accounts = data.accounts;
    this.currencies = data.currencies;
    this.principalCurrency = data.principalCurrency;
    this.estimations = data.estimations;

    if(!this.state) this.state = {};
    if(!this.records) this.records = [];
    if(!this.accounts) this.accounts = [];
    if(!this.currencies) this.currencies = [];
    if(!this.estimations) this.estimations = [];
  }

  setRecords(records) {
    this.records = records;
  }

  setAccounts(accounts) {
    this.accounts = accounts;
  }

  setCurrencies(currencies) {
    this.currencies = currencies;
  }

  setPrincipalCurrency(currency) {
    this.principalCurrency = currency;
  }

  setEstimations(estimations) {
    this.estimations = estimations;
  }

  setState(state) {
    this.state = state;
  }

  getRecord(id) {
    return this.records.find(r => r.id === id);
  }

  insertRecord(r, id = uuidv1()){
    const amount = BigInt(r.amount).toString();
    let amountDebit;
    let amountCredit;

    if(r.amountDebit) amountDebit = BigInt(r.amountDebit).toString();
    if(r.amountCredit) amountCredit = BigInt(r.amountCredit).toString();

    const record = {
      id,
      date: r.date,
      description: r.description,
      debit: r.debit,
      credit: r.credit,
      amount,
      amountDebit,
      amountCredit,
    };

    this.notifyState(record);

    const len = this.records.length;
    if (len === 0 || record.date >= this.records[len-1].date){
      this.records.push(record);
      return {appended:true, changedFrom: len-1, id}
    } else {
      const index = this.records.findIndex( (r)=>{return r.date > record.date})
      if(index < 0)
        throw new Error(`Database error: index = -1, records.length:${len}, records date:${new Date(this.records[len-1].date).toISOString()}, record to insert:${JSON.stringify(record)}`)
      this.records.splice(index, 0, record)
      return {appended:false, changedFrom:index, id};
    }
  }

  removeRecord(id){
    const index = this.records.findIndex( (r)=>{return r.id === id})
    if(index < 0) throw new Error(`Bad index ${id}`)
    const removed = this.records.splice(index, 1);
    this.notifyState(removed[0]);
    return index
  }

  notifyState(record) {
    if(!this.oldestChangeState || record.date < this.oldestChangeState)
      this.oldestChangeState = record.date;
  }

  getPeriod(d) {
    const date = new Date(d);
    const year1 = date.getFullYear();
    const month1 = date.getMonth();
    let year2 = year1;
    let month2 = month1 + 1;
    if(month2 > 11){
      month2 = 0;
      year2 += 1;
    }
    return {
      start: Date.UTC(year1, month1),
      end: Date.UTC(year2, month2) - 1,
    }
  }

  newAccountBalance(account, lastBalance, lastBalanceCurrency){
    if(!account.precision) account.precision = 2
    return {
      account:  account.name,
      account_type: account.type,
      currency: account.currency,
      precision:account.precision,
      debits: 0n, // debits in the principal currency
      credits: 0n, // credits in the principal currency
      debitsCurrency: 0n,  // debits in the currency of the account
      creditsCurrency: 0n, // credits in the currency of the account
      balance_debit: 0n,
      balance_credit:0n,
      balance_debitCurrency: 0n,
      balance_creditCurrency: 0n,
      balance: 0n,    // balance of the period
      balanceCurrency: 0n,
      acc_balance: 0n, // accumulated balance
      acc_balanceCurrency: 0n,
      lastBalance: BigInt(lastBalance),
      lastBalanceCurrency: BigInt(lastBalanceCurrency),
    }
  }

  newBalancePeriod(date) {
    const balances = this.state.balances_by_period;
    let accountBalances;
    if (balances.length === 0) {
      accountBalances = this.accounts.map(a => this.newAccountBalance(a, 0n, 0n));
    } else {
      const lastBalance = balances[balances.length - 1];
      accountBalances = this.accounts.map(a => {
        const {
          acc_balance,
          acc_balanceCurrency
        } = lastBalance.accounts.find(b => b.account === a.name);
        return this.newAccountBalance(a, acc_balance, acc_balanceCurrency);
      });
    }

    return {
      period: this.getPeriod(date),
      accounts: accountBalances,
    };
  }

  cleanModifiedState() {
    if(!this.oldestChangeState) this.oldestChangeState = 0;
    const index = this.state.balances_by_period.findIndex(b => b.period.end >= this.oldestChangeState );
    console.log(`modified from ${new Date(this.oldestChangeState).toISOString()}`)
    console.log(index)
    this.oldestChangeState = null;

    if(index < 0) return;
    const len = this.state.balances_by_period.length;
    this.state.balances_by_period.splice(index, len - index);
  }

  recalculateBalances(index = 0){
    index = 0 // TODO: calculate from index

    if(!this.state.balances_by_period) this.state.balances_by_period = [];

    var locatePeriod = (date) => {
      const balances = this.state.balances_by_period;
      let bPeriod = balances.find((b) => {
        return date >= b.period.start && date <= b.period.end
      });

      if(!bPeriod) {
        bPeriod = this.newBalancePeriod(date);
        balances.push(bPeriod);
      }

      return bPeriod;
    }

    this.cleanModifiedState();

    for(var j=index; j<this.records.length; j++){
      const record = this.records[j];
      const currentPeriod = locatePeriod(record.date);

      var account_debit  = record.debit
      var account_credit = record.credit
      const amount = BigInt(record.amount);

      var accountBalanceDebit  = currentPeriod.accounts.find( (b)=>{return b.account === account_debit})
      var accountBalanceCredit = currentPeriod.accounts.find( (b)=>{return b.account === account_credit})

      accountBalanceDebit.debits += amount;
      accountBalanceDebit.balance += amount;
      accountBalanceDebit.acc_balance = accountBalanceDebit.balance + accountBalanceDebit.lastBalance;

      accountBalanceCredit.credits += amount;
      accountBalanceCredit.balance -= amount;
      accountBalanceCredit.acc_balance = accountBalanceCredit.balance + accountBalanceCredit.lastBalance;

      if(record.amountDebit) {
        const amountDebit = BigInt(record.amountDebit);
        accountBalanceDebit.debitsCurrency += amountDebit;
        accountBalanceDebit.balanceCurrency += amountDebit;
        accountBalanceDebit.acc_balanceCurrency = accountBalanceDebit.balanceCurrency + accountBalanceDebit.lastBalanceCurrency;
      }

      if(record.amountCredit) {
        const amountCredit = BigInt(record.amountCredit);
        accountBalanceCredit.creditsCurrency += amountCredit;
        accountBalanceCredit.balanceCurrency -= amountCredit;
        accountBalanceCredit.acc_balanceCurrency = accountBalanceCredit.balanceCurrency + accountBalanceCredit.lastBalanceCurrency;
      }

      if(accountBalanceDebit.balance >=0) {
        accountBalanceDebit.balance_debit = accountBalanceDebit.balance;
        accountBalanceDebit.balance_credit = 0n;
      } else {
        accountBalanceDebit.balance_debit = 0n;
        accountBalanceDebit.balance_credit = -accountBalanceDebit.balance;
      }

      if(accountBalanceDebit.balanceCurrency >=0) {
        accountBalanceDebit.balance_debitCurrency = accountBalanceDebit.balanceCurrency;
        accountBalanceDebit.balance_creditCurrency = 0n;
      } else {
        accountBalanceDebit.balance_debitCurrency = 0n;
        accountBalanceDebit.balance_creditCurrency = -accountBalanceDebit.balanceCurrency;
      }

      if(accountBalanceCredit.balance >=0) {
        accountBalanceCredit.balance_debit = accountBalanceCredit.balance;
        accountBalanceCredit.balance_credit = 0n;
      } else {
        accountBalanceCredit.balance_debit = 0n;
        accountBalanceCredit.balance_credit = -accountBalanceCredit.balance;
      }

      if(accountBalanceCredit.balanceCurrency >=0) {
        accountBalanceCredit.balance_debitCurrency = accountBalanceCredit.balanceCurrency;
        accountBalanceCredit.balance_creditCurrency = 0n;
      } else {
        accountBalanceCredit.balance_debitCurrency = 0n;
        accountBalanceCredit.balance_creditCurrency = -accountBalanceCredit.balanceCurrency;
      }
    }
    this.updateDatabase("state");
  }

  updateDatabase(resource) {
    if(resource === "records")
      database.setRecords(this.records);
    else if(resource === "state")
      database.setState(this.state);
  }
}

module.exports = Book;

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

    //if(!this.state) {
      this.state = {};
      this.oldestChangeState = 0;
    //}
    if(!this.records) this.records = [];
    if(!this.accounts) this.accounts = [];
    if(!this.currencies) this.currencies = [];
    if(!this.estimations) this.estimations = [];
    this.recalculateBalances();
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

    const len = this.records.length;
    if (len === 0 || record.date >= this.records[len-1].date){
      this.records.push(record);
    } else {
      const index = this.records.findIndex( (r)=>{return r.date > record.date})
      if(index < 0)
        throw new Error(`Database error: index = -1, records.length:${len}, records date:${new Date(this.records[len-1].date).toISOString()}, record to insert:${JSON.stringify(record)}`)
      this.records.splice(index, 0, record);
    }
    this.notifyState(record);
    return record;
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

  insert(r, id) {
    const result = this.insertRecord(r, id);
    this.updateDatabase("records");
    this.recalculateBalances();
    return result;
  }

  update(r, id) {
    this.removeRecord(r.id);
    const result = this.insertRecord(r, id);
    this.updateDatabase("records");
    this.recalculateBalances();
    return result;
  }

  remove(id) {
    const result = this.removeRecord(id);
    this.updateDatabase("records");
    this.recalculateBalances();
    return result;
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
    const usesSecondCurrency = account.currency !== this.principalCurrency;
    if(!account.precision) account.precision = 2;
    return {
      account:  account.name,
      type: account.type,
      currency: account.currency,
      precision: account.precision,
      principalCurrency: {
        lastBalance: BigInt(lastBalance),
        debits: 0n,
        credits: 0n,
        monthBalance: 0n,
        totalBalance: BigInt(lastBalance),
      },
      ... usesSecondCurrency && {
        secondCurrency: {
          lastBalance: BigInt(lastBalanceCurrency),
          debits: 0n,
          credits: 0n,
          monthBalance: 0n,
          totalBalance: BigInt(lastBalanceCurrency),
        }
      },
    }
  }

  newBalancePeriod(date) {
    const { balancesByPeriod } = this.state;
    let accountBalances;
    if (balancesByPeriod.length === 0) {
      accountBalances = this.accounts.map(a => this.newAccountBalance(a, 0n, 0n));
    } else {
      const lastPeriod = balancesByPeriod[balancesByPeriod.length - 1];
      accountBalances = this.accounts.map(a => {
        const lastBalance = lastPeriod.balances.find(b => b.account === a.name);
        const lastTotal = lastBalance.principalCurrency.totalBalance;
        if (lastBalance.secondCurrency) {
          const lastTotalCurrency = lastBalance.secondCurrency.totalBalance;
          return this.newAccountBalance(a, lastTotal, lastTotalCurrency);
        } else {
          return this.newAccountBalance(a, lastTotal);
        }
      });
    }

    return {
      period: this.getPeriod(date),
      balances: accountBalances,
    };
  }

  cleanModifiedState() {
    if(!this.oldestChangeState) this.oldestChangeState = 0;
    const index = this.state.balancesByPeriod.findIndex(b => b.period.end >= this.oldestChangeState );
    this.oldestChangeState = null;

    if(index < 0) return;
    const len = this.state.balancesByPeriod.length;
    this.state.balancesByPeriod.splice(index, len - index);
  }

  addAmountAccountBalance(amount, amountCurrency, balance, type) {
    if(type === "debit") {
      balance.principalCurrency.debits += amount;
      balance.principalCurrency.monthBalance += amount;
      balance.principalCurrency.totalBalance += amount;

      if (balance.secondCurrency) {
        balance.secondCurrency.debits += amountCurrency;
        balance.secondCurrency.monthBalance += amountCurrency;
        balance.secondCurrency.totalBalance += amountCurrency;
      }
    } else {
      balance.principalCurrency.credits += amount;
      balance.principalCurrency.monthBalance -= amount;
      balance.principalCurrency.totalBalance -= amount;

      if (balance.secondCurrency) {
        balance.secondCurrency.credits += amountCurrency;
        balance.secondCurrency.monthBalance -= amountCurrency;
        balance.secondCurrency.totalBalance -= amountCurrency;
      }
    }
  }

  recalculateBalances(){
    if(!this.state.balancesByPeriod) this.state.balancesByPeriod = [];

    var locatePeriod = (date) => {
      const balances = this.state.balancesByPeriod;
      let bPeriod = balances.find((b) => {
        return date >= b.period.start && date <= b.period.end
      });

      if(!bPeriod) {
        bPeriod = this.newBalancePeriod(date);
        balances.push(bPeriod);
      }

      return bPeriod;
    }

    const oldestPeriod = locatePeriod(this.oldestChangeState);
    const index = this.records.findIndex(r => (r.date >= oldestPeriod.period.start));

    if(index < 0) {
      console.log(`Warn: Cannot find record after time ${this.oldestChangeState}`);
    }

    this.cleanModifiedState();

    if(index < 0) {
      this.updateDatabase("state");
      console.log(`Warn: Cannot find record after time ${this.oldestChangeState}`);
      return
    }

    for(var j=index; j<this.records.length; j++){
      const record = this.records[j];
      const currentPeriod = locatePeriod(record.date);

      var debitAccount  = record.debit;
      var creditAccount = record.credit;
      const amount = BigInt(record.amount);
      const amountDebit = record.amountDebit ? BigInt(record.amountDebit) : null;
      const amountCredit = record.amountCredit ? BigInt(record.amountCredit) : null;

      var accountBalanceDebit  = currentPeriod.balances.find( (b)=>{return b.account === debitAccount});
      var accountBalanceCredit = currentPeriod.balances.find( (b)=>{return b.account === creditAccount});

      this.addAmountAccountBalance(amount, amountDebit, accountBalanceDebit, "debit");
      this.addAmountAccountBalance(amount, amountCredit, accountBalanceCredit, "credit");
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

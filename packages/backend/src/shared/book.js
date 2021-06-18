const { v1: uuidv1 } = require("uuid");
const logger = require("../logger");
const database = require("./database");
const { BadRequestError, NotFoundError } = require("../errors");

let initialized = false;

class Book {
  async initBook() {
    if(initialized) return;
    initialized = true;
    this.records = await database.getRecords();
    const data = await database.getAccounts();
    this.accounts = data.accounts;
    this.currencies = data.currencies;
    this.principalCurrency = data.principalCurrency;
    this.estimations = data.estimations;
    // this.state = await database.getState();

    //if(!this.state) {
      this.state = {};
      this.oldestChangeState = 0;
    //}
    if(!this.records) this.records = [];
    if(!this.accounts) this.accounts = [];
    if(!this.currencies) this.currencies = [];
    if(!this.estimations) this.estimations = [];
    this.recalculateBalances();

    database.onUpdate((type, value)=>{
      logger.info(`Update for ${type}`);
      switch(type) {
        case "accounts":
          this.accounts = value;
          break;
        case "currencies":
          this.currencies = value;
          break;
        case "principalCurrency":
          this.principalCurrency = value;
          break;
        case "estimations":
          this.estimations = value;
          break;
        case "records":
          this.records = value;
          break;
        case "state":
          this.state = value;
          break;
        default:
          throw new Error(`type ${type} is not recognized`);
      }
    });
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

  getCurrencies() {
    return this.currencies;
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
    this.removeRecord(id);
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
    if(!this.state)
      this.state = {
        balancesByPeriod: []
      };
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

  // currencies

  insertCurrency(c) {
    const currency = {
      name: c.name,
      symbol: "",
      precision: parseInt(c.precision),
    };
    this.currencies.push(currency);
    this.updateDatabase("accounts");
    this.oldestChangeState = 0;
    this.cleanModifiedState();
    this.recalculateBalances();
  }

  updateCurrency(name, c) {
    const newCurrency = {
      name: c.name,
      symbol: c.symbol,
      precision: parseInt(c.precision),
    };
    const currency = this.currencies.find(c => c.name === name);
    
    // update precision in records
    const diffPrecision = newCurrency.precision - currency.precision;
    if (parseInt(diffPrecision) !== diffPrecision)
      throw new BadRequestError(`The precision difference is invalid (${diffPrecision})`);
    let updateBalances;
    if(diffPrecision === 0) {
      updateBalances = false;
    } else if(diffPrecision > 0) {
      const factor = BigInt(Math.pow(10, diffPrecision));
      const accountNames = this.accounts
        .filter(a => a.currency === currency.name)
        .map(a => a.name);
      this.records.forEach(r => {
        if (accountNames.includes(r.debit) && r.amountDebit)
          r.amountDebit = (BigInt(r.amountDebit) * factor).toString();
        if (accountNames.includes(r.credit) && r.amountCredit)
          r.amountCredit = (BigInt(r.amountCredit) * factor).toString();
      });
      updateBalances = true;
    } else {
      const divfactor = BigInt(Math.pow(10, -diffPrecision));
      const accountNames = this.accounts
        .filter(a => a.currency === currency.name)
        .map(a => a.name);
      this.records.forEach(r => {
        if (accountNames.includes(r.debit) && r.amountDebit) {
          if (BigInt(r.amountDebit) % divfactor !== BigInt(0))
            throw new BadRequestError(`Debit amount can not be adjusted to new precision. New precision: ${newCurrency.precision}. Current precision: ${currency.precision}. Record: ${JSON.stringify(r)}`);
        }
        if (accountNames.includes(r.credit) && r.amountCredit) {
          if (BigInt(r.amountCredit) % divfactor !== BigInt(0))
            throw new BadRequestError(`Credit amount can not be adjusted to new precision. New precision: ${newCurrency.precision}. Current precision: ${currency.precision}. Record: ${JSON.stringify(r)}`);
        }
      });
      this.records.forEach(r => {
        if (accountNames.includes(r.debit) && r.amountDebit)
          r.amountDebit = (BigInt(r.amountDebit) / divfactor).toString();
        if (accountNames.includes(r.credit) && r.amountCredit)
          r.amountCredit = (BigInt(r.amountCredit) / divfactor).toString();
      });
      updateBalances = true;
    }

    // update currency name in accounts
    this.accounts.forEach(a => {
      if (a.currency === currency.name)
        a.currency = newCurrency.name
    });

    // update currency in currencies
    currency.name = newCurrency.name;
    currency.precision = newCurrency.precision;

    if (updateBalances) {      
      this.updateDatabase("records");
    };
    this.oldestChangeState = 0;
    this.cleanModifiedState();
    this.recalculateBalances();
    this.updateDatabase("accounts");
  }

  removeCurrency(name) {
    const index = this.currencies.findIndex(c => c.name === name);
    if (index < 0)
      throw new NotFoundError(`currency ${name} not found`);
    const accountNames = this.accounts
      .filter(a => a.currency === name)
      .map(a => a.name);
    if (accountNames.length > 0)
      throw new BadRequestError(`currency ${name} can not be removed because it depends on following accounts: ${accountNames}`);
    this.currencies.splice(index, 1);
    this.updateDatabase("accounts");
  }

  // accounts

  insertAccount(account) {
    if (this.accounts.find(a => a.name === account.name))
      throw new BadRequestError(`Account ${account.name} already exist`);
    if (!this.currencies.find(c => c.name === account.currency))
      throw new BadRequestError(`Currency ${account.currency} does not exist`);
    if (!(["asset", "liability", "income", "expense"].includes(account.type)))
      throw new BadRequestError(`Account type must be one of the following: asset, liability, income, expense`);
    this.accounts.push(account);
    this.updateDatabase("accounts");
    this.oldestChangeState = 0;
    this.cleanModifiedState();
    this.recalculateBalances();
  }

  updateAccount(name, newAccount) {
    const account = this.accounts.find(a => a.name === name);
    if(!account)
      throw new BadRequestError(`Account ${name} does not exist`);
    const updateName = newAccount.name !== account.name;
    if (updateName && this.accounts.find(a => a.name === newAccount.name ))
      throw new BadRequestError(`Account name ${newAccount.name} already exists`);
    if (newAccount.currency !== account.currency)
      throw new BadRequestError(`The currency can not be changed. Received ${newAccount.currency}. Expected: ${account.currency}`);
    if (!(["asset", "liability", "income", "expense"].includes(newAccount.type)))
      throw new BadRequestError(`Account type must be one of the following: asset, liability, income, expense`);
    
    // update records
    if (updateName) {
      this.records.forEach(r => {
        if (r.debit === account.name) r.debit = newAccount.name;
        if (r.credit === account.name) r.credit = newAccount.name;
      });
      account.name = newAccount.name;
    };
    account.type = newAccount.type
    account.logo = newAccount.logo;

    this.oldestChangeState = 0;
    this.cleanModifiedState();
    this.recalculateBalances();
    this.updateDatabase("accounts");
  }

  removeAccount(name) {
    const index = this.accounts.findIndex(a => a.name === name);
    if (index < 0)
      throw new NotFoundError(`Account ${name} not found`);
    this.records.forEach(r => {
      if (r.debit === name || r.credit === name)
        throw new BadRequestError(`Account ${name} can not be removed because it depends on record ${JSON.stringify(r)}`);
    });
    this.accounts.splice(index, 1);
    this.oldestChangeState = 0;
    this.cleanModifiedState();
    this.recalculateBalances();
    this.updateDatabase("accounts");
  }

  insertEstimation(position, estimation) {
    this.estimations.splice(position, 0, estimation);
    this.updateDatabase("accounts");
  }

  updateEstimation(position, estimation) {
    this.estimations[position] = estimation;
    this.updateDatabase("accounts");
  }

  removeEstimation(position) {
    this.estimations.splice(position, 1);
    this.updateDatabase("accounts");
  }

  // database

  updateDatabase(resource) {
    if(resource === "records")
      database.setRecords(this.records);
    else if(resource === "state")
      database.setState(this.state);
    // TODO: split accounts
    else if(resource === "accounts")
      database.setAccounts({
        accounts: this.accounts,
        currencies: this.currencies,
        principalCurrency: this.principalCurrency,
        estimations: this.estimations,
      });
  }
}

const book = new Book();
book.initBook();

module.exports = book;

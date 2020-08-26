import axios from 'axios'
import config from '@/config'
import Utils from "@/mixins/Utils"

let callApi;

export default {
  name: 'Database mixin',

  data() {
    return {
      loaded: false,
      months:[
        'Enero',
        'Febrero',
        'Marzo',
        'Abril',
        'Mayo',
        'Junio',
        'Julio',
        'Agosto',
        'Septiembre',
        'Octubre',
        'Noviembre',
        'Diciembre'
      ],
      monthReports: [],
      currentReport: {},
    };
  },

  mixins:[
    Utils,
  ],

  created(){
    const token = localStorage.getItem("JWT");
    callApi = axios.create({
      baseURL: config.serverRecords,
      timeout: 30000,
      headers: {"Authorization" : `Bearer ${token}`},
    });
    this.loadDatabase();
  },

  methods: {
    async loadDatabase(){
      if(!this.$store.state.records) {
        const response = await callApi.get("/");
        this.$store.state.records = response.data.db;
        this.$store.state.state = response.data.state;
        this.$store.state.accounts = response.data.accounts;
        this.$store.state.estimations = response.data.estimations;
        this.$store.state.currencies = response.data.currencies;
        this.$store.state.principalCurrency = response.data.principalCurrency;

        this.$store.state.state.balancesByPeriod.reverse();
      }
      
      this.accountsIncome = this.$store.state.accounts.filter((a)=>{return a.type === 'income'})
      this.accountsExpense = this.$store.state.accounts.filter((a)=>{return a.type === 'expense'})
      this.accountsAssetOrLiability = this.$store.state.accounts.filter((a)=>{return a.type === 'asset' || a.type === 'liability'})
      this.loadMonths();
      this.loaded = true;
    },

    loadMonths(){
      let maxInEx = BigInt(0);
      let maxAsLi = BigInt(0);
      this.monthReports = this.$store.state.state.balancesByPeriod.map((p, index)=>{
        const middle = parseInt((p.period.start + p.period.end)/2)
        const date = new Date(middle);
        p.year = date.getFullYear();
        p.month = date.getMonth();
        p.date = this.months[p.month] + ' ' + p.year
        const reportSections = this.getReportSections(p, index);
        Object.assign(p, reportSections);
        
        if(p.incomes.total > maxInEx)
          maxInEx = p.incomes.total;
        if(p.expenses.total < -maxInEx)
          maxInEx = -p.expenses.total;

        if(p.assets.total > maxAsLi)
          maxAsLi = p.assets.total;
        if(p.liabilities.total < -maxAsLi)
          maxAsLi = -p.liabilities.total;
        
        return p;
      });

      this.$store.state.maxInEx = maxInEx;
      this.$store.state.maxAsLi = maxAsLi;
      this.calculateBarWidths();
    },

    calculateBarWidths() {
      const { maxInEx, maxAsLi } = this.$store.state;
      this.monthReports.forEach((report) => {
        const rIncomes = parseInt(BigInt(100) * report.incomes.total / maxInEx, 10);
        const rExpenses = parseInt(BigInt(-100) * report.expenses.total / maxInEx, 10);
        const rAssets = parseInt(BigInt(100) * report.assets.total / maxAsLi, 10);
        const rLiabilities = parseInt(BigInt(100) * report.liabilities.total / maxAsLi, 10);

        report.incomes.widthBar = rIncomes < 0 ? 0 : rIncomes > 100 ? 100 : rIncomes;
        report.expenses.widthBar = rExpenses < 0 ? 0 : rExpenses > 100 ? 100 : rExpenses;
        report.assets.widthBar = rAssets < 0 ? 0 : rAssets > 100 ? 100 : rAssets;
        report.liabilities.widthBar = rLiabilities < 0 ? 0 : rLiabilities > 100 ? 100 : rLiabilities;
      })
    },

    getReportSections(bPeriod, index){
      if(!bPeriod){
        console.log('No report')
        return
      }

      var plural = (type)=>{
        if(type === 'liability') return 'liabilities'
        return type + 's'
      }

      var balancesByType = {
        incomes: { name: 'Ingresos', balances: [], total: BigInt(0), totalGreen: true},
        expenses: { name: 'Gastos', balances: [], total: BigInt(0), totalGreen: false},
        assets: { name: 'Activos', balances: [], total: BigInt(0), totalGreen: true},
        liabilities: { name: 'Pasivos', balances: [], total: BigInt(0), totalGreen: false},        
      }

      for(var i in bPeriod.balances){
        var b = bPeriod.balances[i]
        if(BigInt(b.principalCurrency.debits) == 0 && BigInt(b.principalCurrency.credits) == 0
          && (b.type === 'income' || b.type === 'expense')) continue
        var type = plural(b.type)
        switch(b.type){
          case 'asset':
          case 'liability':
            b.green = BigInt(b.principalCurrency.totalBalance) >= 0;
            b.balanceShow = this.cents2dollars(b.principalCurrency.totalBalance);
            if(b.secondCurrency)
              b.balanceCurrencyShow = this.cents2dollars(b.secondCurrency.totalBalance, b.currency, true);
            balancesByType[type].total += BigInt(b.principalCurrency.totalBalance);
            break
          case 'income':
          case 'expense':
            b.green = BigInt(b.principalCurrency.monthBalance) < 0
            b.monthBalance = -BigInt(b.principalCurrency.monthBalance);
            b.balanceShow = this.cents2dollars(b.monthBalance);
            if(b.secondCurrency)
              b.balanceCurrencyShow = this.cents2dollars(-BigInt(b.secondCurrency.monthBalance), b.currency, true);
            balancesByType[type].total -= BigInt(b.principalCurrency.monthBalance);
            break
          default:
            break
        }
        b.lastBalanceShow = this.cents2dollars(b.principalCurrency.lastBalance);
        b.debitsShow = this.cents2dollars(b.principalCurrency.debits);
        b.creditsShow = this.cents2dollars(b.principalCurrency.credits);

        if(b.secondCurrency) {
          b.lastBalanceCurrencyShow = this.cents2dollars(b.secondCurrency.lastBalance, b.currency, true);
          b.debitsCurrencyShow = this.cents2dollars(b.secondCurrency.debits, b.currency, true);
          b.creditsCurrencyShow = this.cents2dollars(b.secondCurrency.credits, b.currency, true);
        }

        const account = this.$store.state.accounts.find((a) => (a.name === b.account));
        if(!account)
          console.log(`Error reading logo: Account ${b.account} is not in the list of accounts`);
        else
          b.logo = account.logo;

        b.link = `/months/${index}/${i}`;

        balancesByType[type].balances.push(b)
      }

      for(let type in balancesByType) {
        balancesByType[type].totalGreen = BigInt(balancesByType[type].total) >= 0;
        balancesByType[type].totalShow = this.cents2dollars(balancesByType[type].total);
        balancesByType.diff = balancesByType.incomes.total + balancesByType.expenses.total;
        balancesByType.equity = balancesByType.assets.total + balancesByType.liabilities.total;
        balancesByType.diffShow = this.cents2dollars(balancesByType.diff);
        balancesByType.equityShow = this.cents2dollars(balancesByType.equity);
      }
      
      return balancesByType;
    },
  },
};
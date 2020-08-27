<template>
  <div>
    <AppHeader :back="backLink"/>
    
    <select v-model="monthSelection" class="fixed-select1 shadow">
      <option v-for="(report, index) in monthReports" :key="index" :value="index">
        {{report.date}}
      </option>
    </select>
    
    <select v-model="accountSelection" class="fixed-select2 shadow">
      <option v-for="(accountBalance, index) in accountBalances" :key="index" :value="index">
        {{accountBalance.account}}
      </option>
    </select>

    <div v-if="loaded2" class="container margin-menu3">
      <div class="title account">
        <div class="icon" :style="{ backgroundImage: 'url(' + balance.logo + ')' }"></div>
        <h1>{{balance.account}}</h1>
      </div>
      <div class="title">
        <h1 class="description">Gasto</h1>
        <h1 class="amount">{{balance.balanceShow}}</h1>
        <h2 class="amount2"
          v-if="balance.secondCurrency"
        >{{balance.balanceCurrencyShow}}</h2>
      </div>

      <ListRecords
        :records="currentRecords"
        :accounts="$store.state.accounts"
        :refAccount="balance.account"
      ></ListRecords>

    </div>
  </div>
</template>

<script>
import AppHeader from '@/components/AppHeader'
import Database from "@/mixins/Database"
import ListRecords from '@/components/ListRecords'

export default {
  name: 'ListRecordsPage',

  data() {
    return {
      loaded2: false,
      accountBalances: null,
      monthSelection: 0,
      accountSelection: 0,
      balance: null,
      currentRecords: null,
      backLink: "",
    };
  },

  components: {
    AppHeader,
    ListRecords,
  },

  mixins: [
    Database,
  ],

  created() {
    let timer = setInterval(()=>{
      if(this.loaded) {
        clearInterval(timer);
        const {idMonth, idAccount} = this.$route.params;
        this.monthSelection = idMonth;
        this.accountSelection = idAccount;
        const monthReport = this.monthReports[idMonth];
        this.balance = monthReport.balances[idAccount];
        this.accountBalances = monthReport.balances;
        this.loaded2 = true;
      }
    }, 100);
  },

  watch: {
    monthSelection: function() {
      this.updateSelection();
    },
    accountSelection: function() {
      this.updateSelection();
    },
  },

  methods: {
    updateSelection(){
      const monthReport = this.monthReports[this.monthSelection];
      const { period } = monthReport;
      this.balance = monthReport.balances[this.accountSelection];
      this.currentRecords = this.$store.state.records.filter( (r)=>{
        return r.date >= period.start && r.date <= period.end &&
          (r.debit  === this.balance.account ||
           r.credit === this.balance.account)
      }).slice()
      this.updateBackLink();
    },

    updateBackLink() {
      if(this.balance.type === "asset" || this.balance.type === "liability")
        this.backLink = `/months/${this.monthSelection}?type=assets`;
      else
        this.backLink = `/months/${this.monthSelection}?type=incomes`;
    },
  },
}
</script>
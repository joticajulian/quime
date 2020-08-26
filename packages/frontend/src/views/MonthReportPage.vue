<template>
  <div>
    <AppHeader
      :incomes="links.incomes"
      :assets="links.assets"
      :focus="navFocus"
    />
    <select v-model="monthSelection" class="fixed-select1 shadow">
      <option v-for="(report, index) in monthReports" :key="index" :value="index">
        {{report.date}}
      </option>
    </select>

    <!-- Incomes/Expenses page -->
    <div v-if="loaded && incomesPage" class="container margin-menu2">
      <h1>{{currentReport.date}}</h1>
      <SummaryBars type="InEx" :report="currentReport"/>

      <!-- section: Incomes -->
      <div class="title text-green">
        <h1 class="description">Ingresos</h1>
        <h1 class="amount">{{currentReport.incomes.totalShow}}</h1>
      </div>
      <ListAccountBalance :balances="currentReport.incomes.balances" />

      <!-- section: Expenses -->
      <div class="title text-red">
        <h1 class="description">Gastos</h1>
        <h1 class="amount">{{currentReport.expenses.totalShow}}</h1>
      </div>
      <ListAccountBalance :balances="currentReport.expenses.balances" />
    </div>


    <!-- Assets/Liabilities page -->
    <div v-else-if="loaded && assetsPage" class="container margin-menu2">
      <h1>{{currentReport.date}}</h1>
      <SummaryBars type="AsLi" :report="currentReport"/>

      <!-- section: Assets -->
      <div class="title text-blue">
        <h1 class="description">Activos</h1>
        <h1 class="amount">{{currentReport.assets.totalShow}}</h1>
      </div>
      <ListAccountBalance :balances="currentReport.assets.balances" />

      <!-- section: Liabilities -->
      <div class="title text-orange">
        <h1 class="description">Pasivos</h1>
        <h1 class="amount">{{currentReport.liabilities.totalShow}}</h1>
      </div>
      <ListAccountBalance :balances="currentReport.liabilities.balances" />
    </div>
  </div>
</template>

<script>
import axios from 'axios'
import config from '@/config'
import AppHeader from '@/components/AppHeader'
import ListAccountBalance from '@/components/ListAccountBalance'
import SummaryBars from '@/components/SummaryBars'
import Database from "@/mixins/Database"

let callApi;

export default {
  name: 'MonthReportPage',

  props: {
    incomesPage: {
      type: Boolean,
      default: true,
    },
    assetsPage: {
      type: Boolean,
      default: false,
    },
  },

  data() {
    return {
      links: {
        incomes: "/months",
        assets: "/months"
      },
      navFocus: "incomes",
      monthSelection: 0,
    };
  },

  components: {
    AppHeader,
    ListAccountBalance,
    SummaryBars,
  },

  mixins:[
    Database,
  ],

  watch: {
    monthSelection: function() {
      this.selectMonth(this.monthSelection);
    },
    incomesPage: function() {
      this.selectMonth(this.monthSelection);
    },
    assetsPage: function() {
      this.selectMonth(this.monthSelection);
    },
  },

  created() {
    let timer = setInterval(()=>{
      if(this.loaded) {
        this.monthSelection = this.$route.params.idMonth;
        this.selectMonth(this.monthSelection);
        clearInterval(timer);
      }
    }, 300);
  },

  methods: {
    selectMonth(index) {
      this.currentReport = this.monthReports[index];
      this.links = {
        incomes: `/months/${index}?type=incomes`,
        assets: `/months/${index}?type=assets`,
      }
      this.navFocus = this.incomesPage ? 'incomes' : this.assetsPage ? 'assets' : '';
    },
  },
};
</script>
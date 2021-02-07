<template>
  <div>
    <b-modal ref="modalEditRecord" hide-footer :title="modalTitle">
      <FormRecord
        :accounts="accounts"
        :currencies="currencies"
        :principalCurrency="principalCurrency"
        :record="modalRecord"
        @onInsert="recordUpdated('Record inserted')"
        @onUpdate="recordUpdated('Record updated')"
        @onDelete="recordUpdated('Record deleted')"
      ></FormRecord>
    </b-modal>

    <b-modal ref="modalUpload" hide-footer title="Leer archivo">
      <ListRecords :records="fileRecords" :accounts="accounts"/>
      <button class="btn btn-primary mt-3" @click="insertRecords(fileRecords)">Insert</button>
    </b-modal>

    <AppHeader/>
    <div class="container-fluid mt-5">
      <div class="row">
        <div class="col-md-3">
          <ul class="list-group list-group-flush">
            <li v-for="(item, index) in balancesByPeriod" :key="index" class="list-group-item" @click="selectPeriod(index)">
              <div class="row">
                <div class="col-7">{{item.date}}</div>
                <div class="col-5">
                  <div class="text-right" :class="{'text-success':item.balancesByType.incomes.totalGreen, 'text-danger':!item.balancesByType.incomes.totalGreen}">{{item.balancesByType.incomes.totalShow}}</div>
                  <div class="text-right" :class="{'text-success':item.balancesByType.expenses.totalGreen, 'text-danger':!item.balancesByType.expenses.totalGreen}">{{item.balancesByType.expenses.totalShow}}</div>
                </div>
              </div>
            </li>
          </ul>
        </div>
        <div class="col-md-9">
          <h2 class="text-center">{{months[selection.month]}} {{selection.year}}</h2>
          <div class="row">
            <div v-for="(balanceGroup, type, index1) in balancesByType" :key="index1" class="col-md-6 col-xs-12">
              <h4>{{balanceGroup.name}}</h4>
              <div class="card mb-4">
                <ul class="list-group list-group-flush">
                  <li v-for="(item,index2) in balanceGroup.balances" :key="index2" class="list-group-item" @click="selectAccount(type,index2)">
                    <div class="row">
                      <div class="col-6">{{item.account}}</div>
                      <div class="col-6 text-right" :class="{'text-success':item.green, 'text-danger':!item.green}">{{item.balanceShow}}</div>
                      <div v-if="item.currency !== principalCurrency"
                        class="col-12 text-right foreign-amount" :class="{'text-success':item.green, 'text-danger':!item.green}"
                      >{{item.balanceCurrencyShow}}</div>
                    </div>
                  </li>
                  <li class="list-group-item">
                    <div class="row">
                      <div class="col-8"><strong>Total</strong></div>
                      <div class="col-4 text-right" :class="{'text-success':balanceGroup.totalGreen, 'text-danger':!balanceGroup.totalGreen}"><strong>{{balanceGroup.totalShow}}</strong></div>
                    </div>
                  </li>
                </ul>
              </div>
            </div>
            <div class="col-12 mt-3">
              <h4>{{currentBalance.account}}</h4>
              <div class="d-inline-block">
                <div>Saldo anterior:</div>
                <div>Debitos:</div>
                <div>Creditos:</div>
                <div>Total:</div>
              </div>
              <div class="d-inline-block ml-3">
                <div class="text-right">{{currentBalance.lastBalanceShow}}</div>
                <div class="text-right">+{{currentBalance.debitsShow}}</div>
                <div class="text-right">-{{currentBalance.creditsShow}}</div>
                <div class="text-right">{{currentBalance.balanceShow}}</div>
              </div>
              <div v-if="currentBalance.currency !== principalCurrency"
                class="d-inline-block ml-3"
              >
                <div class="text-right">{{currentBalance.lastBalanceCurrencyShow}}</div>
                <div class="text-right">+{{currentBalance.debitsCurrencyShow}}</div>
                <div class="text-right">-{{currentBalance.creditsCurrencyShow}}</div>
                <div class="text-right">{{currentBalance.balanceCurrencyShow}}</div>
              </div>
    
              <ListRecords
                :records="currentRecords"
                :accounts="accounts"
                :refAccount="currentBalance.account"
                @onClick="openModalUpdate($event)"
              ></ListRecords>
            </div>
          </div>
          <button class="btn btn-primary mt-3 mb-3 mr-3" @click="openModalUpdate()">Insert</button>
          <div class="custom-file">            
            <input type="file" class="custom-file-input" id="input_file" :class="{'is-invalid': error.file }"/>
            <label class="custom-file-label" for="input_file">Choose file...</label>
            <div v-if="error.file" class="invalid-feedback">{{ errorText.file }}</div>
            <button class="btn btn-primary mt-3 mb-3 mr-3" @click="uploadFile">Upload</button>
          </div>
          <Alerts ref="alerts"></Alerts>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import stateDev from '@/assets/stateDev.json'
import dbDev from '@/assets/dbDev.json'
import accountsDev from '@/assets/accountsDev.json'
import axios from 'axios'
import AppHeader from '@/components/AppHeader'
import ListRecords from '@/components/ListRecords'
import FormRecord from "@/components/FormRecord"
import Alerts from "@/components/Alerts"
import config from '@/config'
import Utils from "@/mixins/Utils"

let callApi;

export default{
  name: 'ReportsPage',
  data(){
    return {
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
      selection: {
        year: '2019',
        month: '0'
      },
      fileRecords: [],
      currentAccount: 'No account selected',
      currentBalance: {},
      currentRecords: [],
      currentSelection: {
        type: 'expenses',
        index: 0,
        period: 0
      },
      balancesByType: {
        incomes: {
          name: 'Ingresos',
          balances: [],
          total: 0,
          totalGreen: true,
        },
        expenses: {
          name: 'Gastos',
          balances: [],
          total: 0,
          totalGreen: false,
        },
        assets: {
          name: 'Activos',
          balances: [],
          total: 0,
          totalGreen: true,
        },
        liabilities: {
          name: 'Pasivos',
          balances: [],
          total: 0,
          totalGreen: false,
        },        
      },
      balancesByPeriod: [],
      db: [],
      state: {},
      accounts: [],
      currencies: [],
      principalCurrency: "",
      estimations: [],
      modalTitle: 'Modificar',
      modalType: 'update',
      modalRecord: {
        date: '',
        description: '',
        debit: '',
        credit: '',
        amount: '',
      },
      error: {
        file: false,
      },
      errorText: {
        file: "",
      },
    }
  },

  components: {
    AppHeader,
    ListRecords,
    FormRecord,
    Alerts,
  },

  mixins:[
    Utils,
  ],

  created(){
    const token = localStorage.getItem("JWT");
    callApi = axios.create({
      baseURL: config.serverRecords,
      timeout: 5000,
      headers: {"Authorization" : `Bearer ${token}`},
    });
    this.load()
  },

  methods: {
    async load(){
      var result = await callApi.get("/")
      this.db = result.data.db;
      this.state = result.data.state;
      this.accounts = result.data.accounts;
      this.estimations = result.data.estimations;
      this.currencies = result.data.currencies;
      this.principalCurrency = result.data.principalCurrency;

      this.$store.state.currencies = this.currencies;
      this.$store.state.principalCurrency = this.principalCurrency;
      this.$store.state.accounts = this.accounts;
      
      this.accountsIncome = this.accounts.filter((a)=>{return a.type === 'income'})
      this.accountsExpense = this.accounts.filter((a)=>{return a.type === 'expense'})
      this.accountsAssetOrLiability = this.accounts.filter((a)=>{return a.type === 'asset' || a.type === 'liability'})
      this.loadPeriods();
      this.loadReport(this.currentSelection.period);
      this.selectAccount( this.currentSelection.type, this.currentSelection.index );
    },

    openModalUpdate(item){
      let record = item;
      if(record){
        this.modalType = "update";
        this.modalTitle = 'Modificar'
      }else{
        this.modalType = "insert";
        this.modalTitle = 'Nuevo registro';
        record = {
          id: null,
          date: new Date().getTime(),
          description: '',
          debit: '',
          credit: '',
          amount: 0,
        }
      }

      this.$refs.modalEditRecord.show()
      this.modalRecord = record;
    },

    async insertRecords(records) {
      console.log("insert records")
      console.log(records)
      this.$refs.alerts.hideAlerts()
      
      try{
        var result = await callApi.put("/", records);
        console.log(result.data)
        this.$refs.alerts.showSuccess('Records inserted');
        this.load()
      }catch(error){
        this.$refs.alerts.showDanger(error.message)
        throw error
      }
    },

    recordUpdated(message) {
      this.$refs.alerts.showSuccess(message);
      this.$refs.modalEditRecord.hide();
      this.load();
    },

    async uploadFile() {
      const localFile = document.getElementById("input_file").files[0];
      const formFile = new FormData();
      formFile.append("file", localFile);
      const response = await callApi.post("/parse", formFile);
      console.log(response.data);
      this.fileRecords = response.data;
      // this.$refs.modalUpload.show();
      await this.insertRecords(response.data);
    },

    selectAccount(type, index){
      if(this.balancesByType[type].balances.length === 0)
        throw new Error(`Account number ${index} for type ${type} cannot be selected because there are no accounts for this type`);

      this.currentSelection.type = type
      this.currentSelection.index = index
      this.currentBalance = this.balancesByType[type].balances[index];
      this.currentAccount = this.currentBalance.account;
      var getPeriod = (year1, month1, year2, month2) => {
        
        if(!year2 || !month2){ year2=year1; month2=month1; }
        month2++
        if(month2 > 11){ month2=0; year2++ }

        return { 
          start: Date.UTC(year1, month1),
          end: Date.UTC(year2, month2) - 1,
        }
      }
      var period = getPeriod( this.selection.year , this.selection.month )
      var currentRecords = this.db.filter( (r)=>{
        return r.date >= period.start && r.date <= period.end &&
          (r.debit  === this.currentAccount ||
           r.credit === this.currentAccount)
      }).slice()
      this.currentRecords = currentRecords
    },

    selectPeriod(index){
      this.loadReport(index)
      this.selectAccount( this.currentSelection.type, this.currentSelection.index );
    },

    loadReport(index){
      if(this.balancesByPeriod.length === 0)
        throw new Error("Balances by period is empty");
      const period = this.balancesByPeriod[index];
      this.currentSelection.period = index;
      this.balancesByType = this.getBalancesByType(period)
      this.selection.month = period.month
      this.selection.year = period.year
    },

    getBalancesByType(bPeriod){
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

      var total = 0
      var totalGreen = true
      for(var i in bPeriod.balances){
        var b = bPeriod.balances[i]
        if(BigInt(b.principalCurrency.debits) == 0 && BigInt(b.principalCurrency.credits) == 0
          && (b.type === 'income' || b.type === 'expense')) continue
        var type = plural(b.type)
        let monthBalance;
        let totalBalance;
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

        balancesByType[type].totalGreen = BigInt(balancesByType[type].total) >= 0;
        balancesByType[type].totalShow = this.cents2dollars(balancesByType[type].total);
        balancesByType[type].balances.push(b)
      }
      return balancesByType;
    },

    loadPeriods(){
      this.balancesByPeriod = []
      this.state.balancesByPeriod.forEach((p, index)=>{
        var middle = parseInt((p.period.start + p.period.end)/2)
        var date = new Date(middle)
        p.year = date.getFullYear()
        p.month = date.getMonth()
        p.date = this.months[p.month] + ' ' + p.year
        p.balancesByType = this.getBalancesByType(p)
        this.balancesByPeriod.splice(0,0,p);
      });
    },
  }
}
</script>

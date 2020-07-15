<template>
  <div>
    <b-modal ref="modalEditRecord" hide-footer :title="modalTitle">
      <FormRecord
        :accounts="accounts"
        :currencies="currencies"
        :principalCurrency="principalCurrency"
        @updated="recordUpdated"
      ></FormRecord>
    </b-modal>

    <b-modal ref="modalConfirmDelete" hide-footer title="Borrar">
      <p>¿Seguro que desea borrar? Luego no es posible deshacer</p>
      <div class="row mt-4">
        <div class="col-8">
          <button class="btn btn-block btn-primary" @click="cancelDelete">Cancelar</button>
        </div>
        <div class="col-4">
          <button class="btn btn-danger" @click="confirmDelete">Borrar</button>
        </div>
      </div>
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
            <li v-for="(item, index) in balances_by_period" :key="index" class="list-group-item" @click="selectPeriod(index)">
              <div class="row">
                <div class="col-7">{{item.date}}</div>
                <div class="col-5">
                  <div class="text-right" :class="{'text-success':item.balances_by_type.incomes.total_green, 'text-danger':!item.balances_by_type.incomes.total_green}">{{item.balances_by_type.incomes.totalShow}}</div>
                  <div class="text-right" :class="{'text-success':item.balances_by_type.expenses.total_green, 'text-danger':!item.balances_by_type.expenses.total_green}">{{item.balances_by_type.expenses.totalShow}}</div>
                </div>
              </div>
            </li>
          </ul>
        </div>
        <div class="col-md-9">
          <h2 class="text-center">{{months[selection.month]}} {{selection.year}}</h2>
          <div class="row">
            <div v-for="(balance_group, type, index1) in balances_by_type" :key="index1" class="col-md-6 col-xs-12">
              <h4>{{balance_group.name}}</h4>
              <div class="card mb-4">
                <ul class="list-group list-group-flush">
                  <li v-for="(item,index2) in balance_group.balances" :key="index2" class="list-group-item" @click="selectAccount(type,index2)">
                    <div v-if="type === 'incomes' || type === 'expenses'" class="row">
                      <div class="col-6">{{item.account}}</div>
                      <div class="col-6 text-right" :class="{'text-success':item.green, 'text-danger':!item.green}">{{item.monthBalanceShow}}</div>
                    </div>
                    <div v-else class="row">
                      <div class="col-6">{{item.account}}</div>
                      <div class="col-6 text-right" :class="{'text-success':item.green, 'text-danger':!item.green}">{{item.balanceShow}}</div>
                    </div>
                  </li>
                  <li class="list-group-item">
                    <div class="row">
                      <div class="col-8"><strong>Total</strong></div>
                      <div class="col-4 text-right" :class="{'text-success':balance_group.total_green, 'text-danger':!balance_group.total_green}"><strong>{{balance_group.totalShow}}</strong></div>
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
              ></ListRecords>
            </div>
          </div>
          <button class="btn btn-primary mt-3 mb-3 mr-3" @click="openModalUpdate(null, 0, 'insert')">Insert</button>
          <div class="custom-file">            
            <input type="file" class="custom-file-input" id="input_file" :class="{'is-invalid': error.file }"/>
            <label class="custom-file-label" for="input_file">Choose file...</label>
            <div v-if="error.file" class="invalid-feedback">{{ errorText.file }}</div>
            <button class="btn btn-primary mt-3 mb-3 mr-3" @click="uploadFile">Upload</button>
          </div>
          <div v-if="alert.info" class="alert alert-info" role="alert">{{alert.infoText}}</div>
          <div v-if="alert.success" class="alert alert-success" role="alert" v-html="alert.successText"></div>
          <div v-if="alert.danger"  class="alert alert-danger" role="alert">{{alert.dangerText}}</div>
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
import config from '@/config'
import Alerts from '@/mixins/Alerts'
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
      current_account: 'No account selected',
      currentBalance: {},
      currentRecords: [],
      current_selection: {
        type: 'expenses',
        index: 0,
        period: 0
      },
      balances_by_type: {
        incomes: {
          name: 'Ingresos',
          balances: [],
          total: 0,
          total_green: true,
        },
        expenses: {
          name: 'Gastos',
          balances: [],
          total: 0,
          total_green: false,
        },
        assets: {
          name: 'Activos',
          balances: [],
          total: 0,
          total_green: true,
        },
        liabilities: {
          name: 'Pasivos',
          balances: [],
          total: 0,
          total_green: false,
        },        
      },
      balances_by_period: [],
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
  },

  mixins:[
    Alerts,
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
      
      this.accounts_income = this.accounts.filter((a)=>{return a.type === 'income'})
      this.accounts_expense = this.accounts.filter((a)=>{return a.type === 'expense'})
      this.accounts_asset_liability = this.accounts.filter((a)=>{return a.type === 'asset' || a.type === 'liability'})
      this.db.forEach( (r)=>{ r.date_transaction = new Date(r.date).toISOString().slice(0,-14) })
      this.loadPeriods()
      this.loadReport(this.current_selection.period)
      this.selectAccount( this.current_selection.type, this.current_selection.index )
    },

    openModalUpdate(item, index, operation='update'){
      this.modalType = operation
      if(operation === 'insert'){
        this.modalTitle = 'Nuevo registro'
        item = {
          id: null,
          date_transaction: new Date().toISOString().slice(0,-14),
          description: '',
          debit: '',
          credit: '',
          amount: 0
        }
      }else if(operation === 'update'){
        this.modalTitle = 'Modificar'
      }else{
        throw new Error(`The operation '${operation}}' is not valid`)
      }

      this.$refs.modalEditRecord.show()
      this.modalRecord = {
        id:   item.id,
        date: item.date_transaction,
        description: item.description,
        debit: item.debit,
        credit: item.credit,
        amount: item.amount,
        type: 'otro'
      }
    },

    openModalConfirmDelete(){
      this.$refs.modalConfirmDelete.show()
    },

    async insertRecords(records) {
      this.hideSuccess()
      this.hideDanger()
      
      try{
        var result = await callApi.put("/", records);
        console.log(result.data)
        this.showSuccess('Records inserted');
        this.load()
      }catch(error){
        this.showDanger(error.message)
        throw error
      }
    },

    recordUpdated() {
      this.showSuccess('Record updated');
      this.$refs.modalEditRecord.hide();
      this.load();
    },

    async removeRecord(){
      if(this.modalType === 'insert') return
      if(this.modalType === 'update'){
        try{
          const id = this.modalRecord.id;
          var result = await callApi.delete("/" + id);
          this.showSuccess('Record removed')
          this.$refs.modalEditRecord.hide()
          this.load()
        }catch(error){
          this.showDanger(error.message)
          throw error
        }
      }
    },

    confirmDelete(){
      this.$refs.modalConfirmDelete.hide()
      this.removeRecord()
    },
    cancelDelete(){
      this.$refs.modalConfirmDelete.hide()
    },

    async uploadFile() {
      const localFile = document.getElementById("input_file").files[0];
      const formFile = new FormData();
      formFile.append("file", localFile);
      const response = await callApi.post("/parse", formFile);
      console.log(response.data);
      this.fileRecords = response.data;
      this.$refs.modalUpload.show();
    },

    selectAccount(type, index){
      this.current_selection.type = type
      this.current_selection.index = index
      this.currentBalance = this.balances_by_type[type].balances[index];
      this.current_account = this.currentBalance.account;
      var getPeriod = (year1, month1, year2, month2) => {
        var start = new Date(year1,month1).getTime()

        if(!year2 || !month2){ year2=year1; month2=month1; }
        month2++
        if(month2 > 11){ month2=0; year2++ }

        var end = new Date(year2,month2).getTime() - 1000
        return { 
          start, 
          end,
          start_date: new Date(start).toISOString().slice(0,-5),
          end_date: new Date(end).toISOString().slice(0,-5)
        }
      }
      var period = getPeriod( this.selection.year , this.selection.month )
      var currentRecords = this.db.filter( (r)=>{
        return r.date >= period.start && r.date <= period.end &&
          (r.debit  === this.current_account ||
           r.credit === this.current_account)
      }).slice()
      var accumulated = 0
      if(type === 'assets' || type === 'liabilities')
        accumulated = 
          BigInt(this.balances_by_type[type].balances[index].acc_balance)
           - BigInt(this.balances_by_type[type].balances[index].debits)
           + BigInt(this.balances_by_type[type].balances[index].credits)
      this.currentRecords = currentRecords
    },

    selectPeriod(index){
      this.loadReport(index)
      this.selectAccount('expenses',0)
    },

    loadReport(index){
      const period = this.balances_by_period[index];
      this.current_selection.period = index;
      this.balances_by_type = this.getBalancesByType(period)
      this.selection.month = period.month
      this.selection.year = period.year
    },

    getBalancesByType(period){
      if(!period){
        console.log('No report')
        return
      }

      var plural = (type)=>{
        if(type === 'liability') return 'liabilities'
        return type + 's'
      }

      var balancesByType = {
        incomes: { name: 'Ingresos', balances: [], total: BigInt(0), total_green: true},
        expenses: { name: 'Gastos', balances: [], total: BigInt(0), total_green: false},
        assets: { name: 'Activos', balances: [], total: BigInt(0), total_green: true},
        liabilities: { name: 'Pasivos', balances: [], total: BigInt(0), total_green: false},        
      }

      var total = 0
      var total_green = true
      for(var i in period.accounts){
        var b = period.accounts[i]
        if(BigInt(b.debits) == 0 && BigInt(b.credits) == 0
          && (b.account_type === 'income' || b.account_type === 'expense')) continue
        var type = plural(b.account_type)
        switch(b.account_type){
          case 'asset':
          case 'liability':
            b.green = BigInt(b.acc_balance) >= 0
            b.monthBalance = BigInt(b.balance);
            b.monthBalanceCurrency = BigInt(b.balanceCurrency);
            break
          case 'income':
          case 'expense':
            b.green = BigInt(b.balance) < 0
            b.monthBalance = -BigInt(b.balance);
            b.monthBalanceCurrency = -BigInt(b.balanceCurrency);
            break
          default:
            break
        }
        b.lastBalanceShow = this.cents2dollars(b.lastBalance);
        b.balanceShow = this.cents2dollars(b.acc_balance);
        b.monthBalanceShow = this.cents2dollars(b.monthBalance);
        b.debitsShow = this.cents2dollars(b.debits);
        b.creditsShow = this.cents2dollars(b.credits);

        if(b.currency !== this.principalCurrency) {
          b.lastBalanceCurrencyShow = this.cents2dollars(b.lastBalanceCurrency, b.currency, true);
          b.balanceCurrencyShow = this.cents2dollars(b.acc_balanceCurrency, b.currency, true);
          b.monthBalanceCurrencyShow = this.cents2dollars(b.monthBalanceCurrency, b.currency, true);
          b.debitsCurrencyShow = this.cents2dollars(b.debitsCurrency, b.currency, true);
          b.creditsCurrencyShow = this.cents2dollars(b.creditsCurrency, b.currency, true);
        }

        balancesByType[type].total += b.monthBalance;
        balancesByType[type].total_green = BigInt(balancesByType[type].total) >= 0;
        balancesByType[type].totalShow = this.cents2dollars(balancesByType[type].total);
        balancesByType[type].balances.push(b)
      }
      return balancesByType
    },

    loadPeriods(){
      this.balances_by_period = []
      this.state.balances_by_period.forEach((p, index)=>{
        if(index == 0) return
        var show = false
        for(var i in p.accounts){
          if(p.accounts[i].debits != 0 || p.accounts[i].credits != 0){
            show = true
          }
        }
        if(show){
          var middle = parseInt((p.period.start + p.period.end)/2)
          var date = new Date(middle)
          p.year = date.getFullYear()
          p.month = date.getMonth()
          p.date = this.months[p.month] + ' ' + p.year
          p.balances_by_type = this.getBalancesByType(p)
          this.balances_by_period.splice(0,0,p)
        }
      })
    },
  }
}
</script>

<template>
  <div>
    <b-modal ref="modalEditRecord" hide-footer :title="modalTitle">
      <label class="label-form-control col-3">Fecha</label>
      <input class="form-control" v-model="modalRecord.date" type="text"/>

      <label class="label-form-control col-3">Descripcion</label>
      <input class="form-control" v-model="modalRecord.description" type="text"/>

      <label class="label-form-control col-3">Debito</label>
      <select class="form-control" v-model="modalRecord.debit">
        <option v-for="(acc, index) in accounts">{{acc.name}}</option>
      </select>

      <label class="label-form-control col-3">Credito</label>
      <select class="form-control" v-model="modalRecord.credit">
        <option v-for="(acc, index) in accounts">{{acc.name}}</option>
      </select>

      <label class="label-form-control col-3">Cantidad</label>
      <input class="form-control" v-model="modalRecord.amount" type="text"/>

      <div class="row mt-4">
        <div class="col-6">
          <button class="btn btn-primary" @click="updateRecord">{{modalType}}</button>
        </div>
        <div class="col-6 text-right">
          <button class="btn btn-danger" @click="removeRecord">Remove</button>
        </div>
      </div>
    </b-modal>


    <AppHeader/>
    <div class="container-fluid mt-5">
      <div class="row">
        <div class="col-md-3">
          <ul class="list-group list-group-flush">
            <li v-for="(item, index) in balances_by_period" :key="index" class="list-group-item" @click="selectPeriod(item)">
              <div class="row">
                <div class="col-7">{{item.date}}</div>
                <div class="col-5">
                  <div class="text-right" :class="{'text-success':item.balances_by_type.incomes.total_green, 'text-danger':!item.balances_by_type.incomes.total_green}">{{item.balances_by_type.incomes.total.toFixed(2)}}</div>
                  <div class="text-right" :class="{'text-success':item.balances_by_type.expenses.total_green, 'text-danger':!item.balances_by_type.expenses.total_green}">{{item.balances_by_type.expenses.total.toFixed(2)}}</div>
                </div>
              </div>
            </li>
          </ul>
        </div>
        <div class="col-md-9">
          <h2 class="text-center">{{months[selection.month]}} {{selection.year}}</h2>
          <div class="row">
            <div v-for="(balance_group, type, index1) in balances_by_type" :key="index1" class="col-6">
              <h4>{{balance_group.name}}</h4>
              <div class="card mb-4">
                <ul class="list-group list-group-flush">
                  <li v-for="(item,index2) in balance_group.balances" :key="index2" class="list-group-item" @click="selectAccount(type,index2)">
                    <div v-if="type === 'incomes' || type === 'expenses'" class="row">
                      <div class="col-8">{{item.account}}</div>
                      <div class="col-4 text-right" :class="{'text-success':item.green, 'text-danger':!item.green}">{{item.balance_show}}</div>
                    </div>
                    <div v-else class="row">
                      <div class="col-5">{{item.account}}</div>
                      <div class="col-2 text-right text-success">+{{item.debits}}</div>
                      <div class="col-2 text-right text-danger" >-{{item.credits}}</div>
                      <div class="col-3 text-right" :class="{'text-success':item.green, 'text-danger':!item.green}">{{item.balance_show}}</div>
                    </div>
                  </li>
                  <li class="list-group-item">
                    <div class="row">
                      <div class="col-8"><strong>Total</strong></div>
                      <div class="col-4 text-right" :class="{'text-success':balance_group.total_green, 'text-danger':!balance_group.total_green}"><strong>{{balance_group.total.toFixed(2)}}</strong></div>
                    </div>
                  </li>
                </ul>
              </div>
            </div>
            <div class="col-12 mt-3">
              <h4>{{current_account}}</h4>
              <div class="text-right">
                <select v-model="orderBy">
                  <option value="date">Ordenar por fecha</option>
                  <option value="amount">Ordenar por cantidad</option>
                </select>
              </div>
              <div class="card mb-4">
                <ul class="list-group list-group-flush">
                  <li v-for="(item, index) in current_balance" :key="index" class="list-group-item" @click="openModalUpdate(item, index)">
                    <div class="row">
                      <div class="col-2">{{item.date_transaction}}</div>
                      <div class="col-4">{{item.description}}</div>
                      <div class="col-2 text-success">{{item.debit}}</div>
                      <div class="col-2 text-danger">{{item.credit}}</div>
                      <div class="col-2">{{item.amount}}</div>
                    </div>
                  </li>
                </ul>
              </div>
            </div>
          </div>
          <button class="btn btn-primary mt-3 mb-3 mr-3" @click="openModalUpdate(null, 0, 'insert')">Insert</button>
          <button class="btn btn-primary mt-3 mb-3" @click="runParser">Leer extractos bancarios</button>
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
import Config from '@/config'
import Alerts from '@/mixins/Alerts'

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
      current_account: 'No account selected',
      current_balance: [],
      current_selection: {
        type: 'expenses',
        index: 0
      },
      orderBy: 'date',
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
      modalTitle: 'Modificar',
      modalType: 'update',
      modalRecord: {
        date: '',
        description: '',
        debit: '',
        credit: '',
        amount: '',
      }
    }
  },

  components: {
    AppHeader
  },

  mixins:[
    Alerts
  ],

  created(){
    this.load()
  },

  watch: {
    orderBy: function(){
      this.orderCurrentBalance()
    }
  },

  methods: {
    async load(){
      if(process.env.NODE_ENV === 'development'){
        console.log('Development mode')
        this.db = dbDev
        this.state = stateDev
        this.accounts = accountsDev
        console.log(this.state)
      }else{
        var result = await axios.get(Config.SERVER + 'db.json')
        this.db = result.data
        console.log('db obtained')
        result = await axios.get(Config.SERVER + 'state.json')
        this.state = result.data
        result = await axios.get(Config.SERVER_API + 'accounts')
        this.accounts = result.data
      }
      this.db.forEach( (r)=>{ r.date_transaction = r.date_transaction.slice(0,-9) })
      this.loadPeriods()
      this.loadReport(this.balances_by_period[0])
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
        amount: item.amount
      }
    },

    async updateRecord(){
      this.hideSuccess()
      this.hideDanger()
      var date = new Date(this.modalRecord.date+'T00:00:00Z').getTime()
      var data = {
        record: {
          date: date,
          date_transaction: new Date(date).toISOString().slice(0,-5),
          description: this.modalRecord.description,
          debit: this.modalRecord.debit,
          credit: this.modalRecord.credit,
          amount: parseFloat(this.modalRecord.amount)
        }
      }
      if(this.modalType === 'update') data.record.id = this.modalRecord.id
      try{
        var result = await axios.post(Config.SERVER_API + this.modalType, data)
        this.showSuccess('Record updated')
        this.$refs.modalEditRecord.hide()
        this.load()
      }catch(error){
        this.showDanger(error.message)
        throw error
      }
    },

    async removeRecord(){
      if(this.modalType === 'insert') return
      if(this.modalType === 'update'){
        try{
          var result = await axios.post(Config.SERVER_API + 'remove', { id: this.modalRecord.id })
          this.showSuccess('Record removed')
          this.$refs.modalEditRecord.hide()
          this.load()
        }catch(error){
          this.showDanger(error.message)
          throw error
        }
      }
    },

    async runParser(){
      this.hideSuccess()
      this.hideDanger()
      try{
        var result = await axios.get(Config.SERVER_API + 'run_parser')
        this.showSuccess('Datos leidos')
        this.load()
      }catch(error){
        this.showDanger(error.message)
        throw error
      }
    },

    selectAccount(type, index){
      this.current_balance = []
      this.current_selection = { type, index }
      this.current_account = this.balances_by_type[type].balances[index].account
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
      this.current_balance = this.db.filter( (r)=>{
        return r.date >= period.start && r.date <= period.end &&
          (r.debit  === this.current_account ||
           r.credit === this.current_account)
      })
      this.orderCurrentBalance()
    },

    selectPeriod(period){
      this.loadReport(period)
      this.selectAccount('expenses',0)
    },

    orderCurrentBalance(){
      if(this.orderBy === 'date'){
        this.current_balance.sort((a,b)=>{
          if(a.date > b.date) return 1
          if(a.date < b.date) return -1
          return 0
        })
      }else if(this.orderBy === 'amount'){
        this.current_balance.sort((a,b)=>{
          if(a.amount < b.amount) return 1
          if(a.amount > b.amount) return -1
          return 0
        })
      }else{
        console.log('Error')
      }
    },

    loadReport(period){
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
        incomes: { name: 'Ingresos', balances: [], total: 0, total_green: true},
        expenses: { name: 'Gastos', balances: [], total: 0, total_green: false},
        assets: { name: 'Activos', balances: [], total: 0, total_green: true},
        liabilities: { name: 'Pasivos', balances: [], total: 0, total_green: false},        
      }

      var total = 0
      var total_green = true
      for(var i in period.accounts){
        var b = period.accounts[i]
        if(b.debits == 0 && b.credits == 0) continue
        var type = plural(b.account_type)
        switch(b.account_type){
          case 'asset':
          case 'liability':
            b.green = b.acc_balance >= 0
            b.balance_show = b.acc_balance
            break
          case 'income':
          case 'expense':
            b.green = b.balance < 0
            b.balance_show = -b.balance
            break
          default:
            break
        }
        balancesByType[type].total += b.balance_show
        balancesByType[type].total_green = balancesByType[type].total >= 0
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

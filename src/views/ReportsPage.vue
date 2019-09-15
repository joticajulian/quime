<template>
  <div>
    <AppHeader/>
    <div class="container row mt-5">
      <div class="col-md-2">
        <div class="form-group row">
          <label class="col-4">Año</label>
          <select class="col-8 mb-2" v-model="selection.year">
            <option value="2018">2018</option>
            <option value="2019">2019</option>
            <option value="2020">2020</option>
            <option value="2021">2021</option>
          </select>
        </div>
        <div class="form-group row">
          <label class="col-4">Mes</label>
          <select class="col-8 mb-3" v-model="selection.month">
            <option v-for="(month,index) in months" :key="index" :value="index">
              {{month}}
            </option>
          </select>
        </div>
      </div>
      <div class="col-md-10">
        <div class="row">
          <div v-for="(balance_group, type, index1) in balances_by_type" :key="index1" class="col-6">
            <h4>{{balance_group.name}}</h4>
            <div class="card mb-4">
              <ul class="list-group list-group-flush">
                <li v-for="(item,index2) in balance_group.balances" :key="index2" class="list-group-item" @click="selectAccount(type,index2)">
                  <div class="row">
                    <div class="col-8">{{item.account}}</div>
                    <div class="col-4 text-right" :class="{'text-success':item.green, 'text-danger':!item.green}">{{item.balance_show}}</div>
                  </div>
                </li>
              </ul>
            </div>
          </div>
          <div class="col-12 mt-3">
            <h4>{{current_account}}</h4>
            <div class="card mb-4">
              <ul class="list-group list-group-flush">
                <li v-for="(item, index) in current_balance" class="list-group-item">
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
      </div>
    </div>
  </div>
</template>

<script>
//import state from '@/../state.json'
//import db from '@/../db.json'
import axios from 'axios'
import AppHeader from '@/components/AppHeader'
import Config from '@/config'

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
      balances_by_type: {
        incomes: {
          name: 'Ingresos',
          balances: [],
        },
        expenses: {
          name: 'Gastos',
          balances: [],
        },
        assets: {
          name: 'Activos',
          balances: [],
        },
        liabilities: {
          name: 'Pasivos',
          balances: [],
        },        
      },
      db: [],
      state: {},
    }
  },
  components: {
    AppHeader
  },
  watch: {
    'selection.year': function(){
      console.log(this.selection.year)
      this.loadReport( n*12 + m + 1 )
    },
    'selection.month': function(){
      console.log(this.months[this.selection.month])
      var n = this.selection.year - 2018
      var m = this.selection.month
      this.loadReport( n*12 + m + 1 )
    }
  },
  created(){
    var load = async ()=>{
      var result = await axios.get(Config.SERVER + 'db.json')
      this.db = result.data
      console.log('db obtained')
      result = await axios.get(Config.SERVER + 'state.json')
      this.state = result.data
      this.db.forEach( (r)=>{ r.date_transaction = r.date_transaction.replace('T00:00:00','') })
    }
    load()
  },
  methods: {
    selectAccount(type, index){
      console.log(type)
      console.log(index)
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
    },
    loadReport(){
      var n = parseInt(this.selection.year) - 2018
      var m = parseInt(this.selection.month)
      var index = n*12 + m +1

      var plural = (type)=>{
        if(type === 'liability') return 'liabilities'
        return type + 's'
      }

      for(var name in this.balances_by_type)
        this.balances_by_type[name].balances = []

      for(var i in this.state.balances_by_period[index].accounts){
        var b = this.state.balances_by_period[index].accounts[i]
        if(b.balance == 0) continue
        switch(b.account_type){
          case 'asset':
            b.green = b.balance >= 0
            b.balance_show = b.balance
            break
          case 'expense':
            b.green = b.balance < 0
            b.balance_show = -b.balance
            break
          case 'liability':
          case 'income':
            b.green = b.balance < 0
            b.balance_show = -b.balance
            break
          default:
            break
        }
        var type = plural(b.account_type)
        this.balances_by_type[type].balances.push(b)
      }
    },
  }
}
</script>

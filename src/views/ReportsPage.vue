<template>
  <div>
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
          <div v-for="(balance_group, type, index) in balances_by_type" class="col-6">
            <h4>{{balance_group.name}}</h4>
            <div class="card mb-4">
              <ul class="list-group list-group-flush">
                <li v-for="(item,index) in balance_group.balances" class="list-group-item">
                  <div class="row">
                    <div class="col-8">{{item.account}}</div>
                    <div class="col-4 text-right">{{item.balance}}</div>
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
import state from '@/../state.json'
import db from '@/../db.json'

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
      }
    }
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
    console.log(state)
  },
  methods: {
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

      for(var i in state.balances_by_period[index].accounts){
        var balance = state.balances_by_period[index].accounts[i]
        if(balance.balance == 0) continue
        var type = plural(balance.account_type)
        this.balances_by_type[type].balances.push(balance)
      }
    },
  }
}
</script>

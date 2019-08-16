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
          <div class="col-6">
            <h4>Gastos</h4>
            <div class="card mb-4">
              <ul class="list-group list-group-flush">
                <li v-for="(item,index) in expenses" class="list-group-item">
                  {{item.account}}
                </li>
              </ul>
            </div>
          </div>
          <div class="col-6">
            <h4>Ingresos</h4>
            <div class="card mb-4">
              <ul class="list-group list-group-flush">
                <li v-for="(item,index) in incomes" class="list-group-item">
                  {{item.account}}
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
      assets: [],
      liabilities: [],
      incomes: [],
      expenses: [],
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
      
      this.incomes = []
      this.expenses = []
      this.assets = []
      this.liabilities = []
      for(var i in state.balances_by_period[index].accounts){
        var balance = state.balances_by_period[index].accounts[i]
        switch(balance.account_type){
          case 'asset':
            this.assets.push(balance)
            break
          case 'liability':
            this.liabilities.push(balance)
            break
          case 'income':
            this.incomes.push(balance)
            break
          case 'expense':
            this.expenses.push(balance)
            break
          default:
            throw new Error(`Cannot recognize account type '${balance.account_type}'`)
        }
      }
    },
  }
}
</script>
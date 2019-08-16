<template>
  <div>
    <div class="container row mt-5">
      <div class="col-md-2">
        <div class="form-group row">
          <label class="col-4">Año</label>
          <select class="col-8 mb-2">
            <option value="2018">2018</option>
            <option value="2019">2019</option>
            <option value="2020">2020</option>
            <option value="2021">2021</option>
          </select>
        </div>
        <div class="form-group row">
          <label class="col-4">Mes</label>
          <select class="col-8 mb-3">
            <option v-for="(month,index) in months" :key="index" :value="index">
              {{month}}
            </option>
          </select>
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
      ]
    }
  },
  created(){
    console.log(state)
  },
}
</script>
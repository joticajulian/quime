<template>
  <div>
    <div v-if="type === 'InEx'">
      <div>Ingresos</div>
      <div class="bar-group">
        <div class="bar">
          <div class="green" :style="{width: `${report.incomes.widthBar}%`}"></div>
        </div>
        <div class="amount">{{report.incomes.totalShow}}</div>
      </div>
      <div class="bar-group">
        <div class="bar">
          <div class="red" :style="{width: `${report.expenses.widthBar}%`}"></div>
        </div>
        <div class="amount">{{report.expenses.totalShow}}</div>
      </div>
      <div>Gastos</div>
      <div class="bar-group ganancia">
        <div class="bar">Ganancia</div>
        <div class="amount">{{report.diffShow}}</div>
      </div>  
    </div>
    <div v-else-if="type === 'AsLi'">
      <div>Activos</div>
      <div class="bar-group">
        <div class="bar">
          <div class="blue" :style="{width: `${report.assets.widthBar}%`}"></div>
        </div>
        <div class="amount">{{report.assets.totalShow}}</div>
      </div>
      <div class="bar-group">
        <div class="bar">
          <div class="orange" :style="{width: `${report.liabilities.widthBar}%`}"></div>
        </div>
        <div class="amount">{{report.liabilities.totalShow}}</div>
      </div>
      <div>Pasivos</div>
      <div class="bar-group ganancia">
        <div class="bar">Patrimonio</div>
        <div class="amount">{{report.equityShow}}</div>
      </div>  
    </div>
  </div>
</template>

<script>
export default {
  props: {
    type: String,
    report: Object,
  }
}
</script>
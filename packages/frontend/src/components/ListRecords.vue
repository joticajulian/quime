<template>
  <div>
    <div class="text-right">
      <select v-model="orderBy">
        <option value="date">Ordenar por fecha</option>
        <option value="amount">Ordenar por cantidad</option>
      </select>
    </div>
    <div class="card mb-4">
      <ul class="list-group list-group-flush">
        <li v-for="(item, index) in recordsShow" :key="index" class="list-group-item">
          <div>
            <div class="record-info3">{{item.dateString}}</div>
            <div class="record-info4">
              <div class="badge" :class="{
                'badge-success':item.color === 'green',
                'badge-primary':item.color === 'blue',
                'badge-danger': item.color === 'red',
                'badge-info'  : item.color === 'yellow'
              }">{{item.badge}}</div>
            </div>
          </div>
          <div class="record-info1">
            <div class="icon" v-bind:style="{ backgroundImage: 'url(' + item.image_debit + ')' }"></div>
            <div class="icon" v-bind:style="{ backgroundImage: 'url(' + item.image_credit + ')' }"></div>
            <div class="description">{{item.description}}</div>
          </div>
          <div class="record-info2">
            <div class="amount">{{item.amount}}</div>
            <div class="accumulated">{{item.balance.toFixed(2)}}</div>
          </div>
        </li>
      </ul>
    </div>  
  </div>
</template>

<script>
export default {
  name: "ListRecords",
  props: {
    records: {
      type: Array,
      default: () => ([]),
    }
  },
  data() {
    return {
      recordsShow: undefined,
      orderBy: "date",
    };
  },
  
  watch: {
    records: function () {
      this.elaborateRecords();
    },
    orderBy: function(){
      this.orderList()
    }
  },
  
  methods: {
    elaborateRecords() {
      const records = this.records;
      let accumulated = 0;
      records.forEach((r) => {
        r.dateString = new Date(r.date).toISOString().slice(0,-14);
        accumulated += r.amount;
        r.balance = accumulated;
      });
      this.recordsShow = records;
    },

    orderList(){
      if(this.orderBy === 'date'){
        this.recordsShow.sort((a,b)=>{
          if(a.date > b.date) return 1
          if(a.date < b.date) return -1
          return 0
        })
      }else if(this.orderBy === 'amount'){
        this.recordsShow.sort((a,b)=>{
          if(a.amount < b.amount) return 1
          if(a.amount > b.amount) return -1
          return 0
        })
      }else{
        console.log('Error ordering list')
      }
    },
  }
}
</script>
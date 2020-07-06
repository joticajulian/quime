<template>
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
          <!--<div class="accumulated">{{item.acc_balance.toFixed(2)}}</div>-->
        </div>
      </li>
    </ul>
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
    };
  },

  mounted() {
    this.elaborateRecords();
  },

  beforeUpdate() {
        
  },



  methods: {
    elaborateRecords() {
      const records = this.records;
      records.forEach((r) => {
        r.dateString = new Date(r.date).toISOString().slice(0,-14);
      });
      this.recordsShow = records;
    }
  }
}
</script>
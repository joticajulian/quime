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
          <div class="description">{{item.description}}</div>
          <div class="record-info1">
            <div class="icon" v-bind:style="{ backgroundImage: 'url(' + item.image_debit + ')' }"></div>
            <div class="icon" v-bind:style="{ backgroundImage: 'url(' + item.image_credit + ')' }"></div>
          </div>
          <div class="record-info2">
            <div class="amount">{{item.amountShow}}</div>
            <div v-if="item.foreignCurrencyDebit" class="foreign-amount">{{item.amountDebitShow}}</div>
            <div v-if="item.foreignCurrencyCredit" class="foreign-amount">{{item.amountCreditShow}}</div>
            <div class="accumulated">{{item.balanceShow}}</div>
          </div>
        </li>
      </ul>
    </div>  
  </div>
</template>

<script>
import Utils from "@/mixins/Utils"

export default {
  name: "ListRecords",
  props: {
    records: {
      type: Array,
      default: () => ([]),
    },
    accounts: {
      type: Array,
      default: () => ([]),
    },
    refAccount: {
      type: String,
      default: "",
    }
  },

  data() {
    return {
      recordsShow: undefined,
      orderBy: "date",
    };
  },

  mixins:[
    Utils
  ],
  
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

      let accumulated = BigInt(0);
      records.forEach((r) => {
        r.dateString = new Date(r.date).toISOString().slice(0,-14);

        if(r.debit === this.refAccount) accumulated += BigInt(r.amount);
        else accumulated -= BigInt(r.amount);
        r.balance = accumulated;

        const accountDebit = this.accounts.find( (a)=>{return a.name === r.debit}  );
        const accountCredit= this.accounts.find( (a)=>{return a.name === r.credit} );

        r.foreignCurrencyDebit = !!r.amountDebit;
        r.foreignCurrencyCredit = !!r.amountCredit;

        const showCurrency = r.foreignCurrencyDebit || r.foreignCurrencyCredit;
        r.amountShow = this.cents2dollars(r.amount, undefined, showCurrency);
        r.balanceShow = this.cents2dollars(r.balance, undefined, showCurrency);

        if(r.foreignCurrencyDebit)
          r.amountDebitShow = this.cents2dollars(r.amountDebit, accountDebit.currency, true);

        if(r.foreignCurrencyCredit)
          r.amountCreditShow = this.cents2dollars(r.amountCredit, accountCredit.currency, true);

        // icons
        r.image_debit  = accountDebit.logo;
        r.image_credit = accountCredit.logo;

        // type of record
        var typeRec = this.typeRecord(accountDebit.type, accountCredit.type);
        r.badge = typeRec.text
        r.color = typeRec.color
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
          if(BigInt(a.amount) < BigInt(b.amount)) return 1
          if(BigInt(a.amount) > BigInt(b.amount)) return -1
          return 0
        })
      }else{
        console.log('Error ordering list')
      }
    },

    typeRecord(debit, credit){
      if(debit === 'asset'     && credit === 'asset')     return {text: 'movimiento', color: 'blue' }
      if(debit === 'asset'     && credit === 'liability') return {text: 'devolucion', color: 'green'}
      if(debit === 'asset'     && credit === 'income')    return {text: 'ingreso',    color: 'green'}
      if(debit === 'asset'     && credit === 'expense')   return {text: 'devolucion', color: 'green'}

      if(debit === 'liability' && credit === 'asset')     return {text: 'pago',       color: 'red'  }
      if(debit === 'liability' && credit === 'liability') return {text: 'transfer deuda', color: 'blue'}
      if(debit === 'liability' && credit === 'income')    return {text: 'devolucion',    color: 'yellow'}
      if(debit === 'liability' && credit === 'expense')   return {text: 'devolucion', color: 'green'}

      if(debit === 'income'    && credit === 'asset')     return {text: 'devolucion ingreso', color: 'red' }
      if(debit === 'income'    && credit === 'liability') return {text: 'ingreso prestado?', color: 'yellow'}
      if(debit === 'income'    && credit === 'income')    return {text: 'mov ingreso',    color: 'blue'}
      if(debit === 'income'    && credit === 'expense')   return {text: 'devolucion a ingresos?', color: 'yellow'}

      if(debit === 'expense'   && credit === 'asset')     return {text: 'gasto', color: 'red' }
      if(debit === 'expense'   && credit === 'liability') return {text: 'gasto', color: 'red' }
      if(debit === 'expense'   && credit === 'income')    return {text: 'ingreso y gasto', color: 'yellow'} // income that immediatly is spent, without touching my assets (?)
      if(debit === 'expense'   && credit === 'expense')   return {text: 'mov gasto', color: 'blue'}
    },
  }
}
</script>
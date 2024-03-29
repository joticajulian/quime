<template>
  <div>
    <div class="container-selectOrder">
      <select v-model="orderBy" class="selectOrder">
        <option value="date">Ordenar por fecha</option>
        <option value="amount">Ordenar por cantidad</option>
      </select>
    </div>
    <div class="card-record shadow"
      v-for="(item, index) in recordsShow"
      :key="index"
      @click="onClick(item, index)"
    ><div class="date">{{item.dateString}}</div>
      <div class="badge-container">
        <div class="badge" :class="item.classBadge">{{item.badge}}</div>
      </div>
      <div class="icon" v-bind:style="{ backgroundImage: 'url(' + item.image + ')' }"></div>
      <div class="icon" v-bind:style="{ backgroundImage: 'url(' + item.image2 + ')' }"></div>
      <div class="description">{{item.description}}</div>
      <div class="amount">{{item.amountShow}}</div>            
      <div v-if="item.foreignCurrencyDebit" 
        class="amount2"
      >{{item.amountDebitShow}}</div>
      <div v-if="item.foreignCurrencyCredit" 
        class="amount2"
      >{{item.amountCreditShow}}</div>
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
    },
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

  mounted() {
    this.elaborateRecords();
  },
  
  methods: {
    onClick(item, index) {
      this.$emit("onClick", { item, index });
    },

    elaborateRecords() {
      const records = JSON.parse(JSON.stringify(this.records));

      records.forEach((r) => {
        r.dateString = new Date(r.date).toISOString().slice(0,-14);

        const accountDebit = this.accounts.find( (a)=>{return a.name === r.debit}  );
        const accountCredit= this.accounts.find( (a)=>{return a.name === r.credit} );
        if(!accountDebit) throw new Error(`Debit account ${r.debit} not found in the list of accounts`);
        if(!accountCredit) throw new Error(`Credit account ${r.credit} not found in the list of accounts`);

        r.foreignCurrencyDebit = !!r.amountDebit;
        r.foreignCurrencyCredit = !!r.amountCredit;

        // const showCurrency = r.foreignCurrencyDebit || r.foreignCurrencyCredit;
        r.amountShow = this.cents2dollars(r.amount);
        
        if(r.foreignCurrencyDebit)
          r.amountDebitShow = this.cents2dollars(r.amountDebit, accountDebit.currency, true);

        if(r.foreignCurrencyCredit)
          r.amountCreditShow = this.cents2dollars(r.amountCredit, accountCredit.currency, true);

        // icons
        r.imageDebit = accountDebit.logo;
        r.imageCredit = accountCredit.logo;

        /* if (this.refAccount) {
          if(accountDebit.name === this.refAccount) {
            r.image = accountCredit.logo;
          } else {
            r.image = accountDebit.logo;
          }
        } else { */
        r.image = accountDebit.logo;
        r.image2 = accountCredit.logo;
        // }

        // type of record
        var typeRec = this.typeRecord(accountDebit.type, accountCredit.type);
        r.badge = typeRec.badge;
        r.classBadge = typeRec.classBadge;
      });

      this.recordsShow = records;
      this.orderList();
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
      if(debit === 'asset'     && credit === 'asset')     return {badge: 'Movimiento', classBadge: { blue: true} }
      if(debit === 'asset'     && credit === 'liability') return {badge: 'Préstamo', classBadge: { blue: true} }
      if(debit === 'asset'     && credit === 'income')    return {badge: 'Ingreso',    classBadge: { green: true} }
      if(debit === 'asset'     && credit === 'expense')   return {badge: 'Devolución', classBadge: { green: true} }

      if(debit === 'liability' && credit === 'asset')     return {badge: 'Pago',       classBadge: { blue: true} }
      if(debit === 'liability' && credit === 'liability') return {badge: 'Transfer deuda', classBadge: { blue: true} }
      if(debit === 'liability' && credit === 'income')    return {badge: 'Devolución pasivo', classBadge: { red: true} }
      if(debit === 'liability' && credit === 'expense')   return {badge: 'Devolución pasivo', classBadge: { green: true} }

      if(debit === 'income'    && credit === 'asset')     return {badge: 'Devolucion ingreso', classBadge: { red: true} }
      if(debit === 'income'    && credit === 'liability') return {badge: 'Ingreso prestado?', classBadge: { orange: true} }
      if(debit === 'income'    && credit === 'income')    return {badge: 'Mov ingreso',    classBadge: { blue: true} }
      if(debit === 'income'    && credit === 'expense')   return {badge: 'Devolucion a ingresos?', classBadge: { orange: true} }

      if(debit === 'expense'   && credit === 'asset')     return {badge: 'Gasto', classBadge: { red: true} }
      if(debit === 'expense'   && credit === 'liability') return {badge: 'Gasto', classBadge: { red: true} }
      if(debit === 'expense'   && credit === 'income')    return {badge: 'Ingreso y gasto', classBadge: { orange: true} } // income that immediatly is spent, without touching my assets (?)
      if(debit === 'expense'   && credit === 'expense')   return {badge: 'Mov gasto', classBadge: { blue: true} }
    },
  }
}
</script>
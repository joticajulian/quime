<template>
  <div>
    <select class="form-control" v-model="type">
      <option>ingreso</option>
      <option>gasto</option>
      <option>movimiento</option>
      <option>otro</option>
    </select>
    
    <label class="label-form-control mt-3">Fecha</label>
    <input class="form-control" v-model="date" type="text"/>

    <label class="label-form-control mt-3">Descripcion</label>
    <input class="form-control" v-model="description" type="text"/>

    <label class="label-form-control mt-3">{{label1}}</label>
    <select class="form-control" v-model="account1">
      <option v-for="(acc, index) in accounts1" :key="index">{{acc.name}}</option>
    </select>

    <label class="label-form-control mt-3">{{label2}}</label>
    <select class="form-control" v-model="account2">
      <option v-for="(acc, index) in accounts2" :key="index">{{acc.name}}</option>
    </select>

    <div v-if="foreignCurrency1">
      <label class="label-form-control mt-3">Cantidad en {{currency1}}</label>
      <input class="form-control" v-model="amount1" type="text"/>
    </div>

    <div v-if="foreignCurrency2">
      <label class="label-form-control mt-3">Cantidad en {{currency2}}</label>
      <input class="form-control" v-model="amount2" type="text"/>
    </div>

    <label class="label-form-control mt-3">Cantidad en {{principalCurrency}}</label>
    <input class="form-control" v-model="amount" type="text"/>

    <div class="row mt-4">
      <div class="col-6">
        <button class="btn btn-primary" @click="saveRecord">{{labelSave}}</button>
      </div>
      <div class="col-6 text-right" v-if="isUpdate">
        <button class="btn btn-danger" @click="openModalConfirmDelete">Remove</button>
      </div>
    </div>
  </div>
</template>

<script>
import axios from 'axios'
import config from '@/config'

let callApi;

export default {
  name: "FormRecord",

  props: {
    accounts: {
      type: Array,
      default: () => ([]),
    },
    currencies: {
      type: Array,
      default: () => ([]),
    },
    principalCurrency: {
      type: String,
      default: "",
    }
  },
  
  data() {
    return {
      date: "",
      description: "",
      account1: "",
      account2: "",
      label1: "",
      label2: "",
      debit: "",
      credit: "",
      accounts1: [],
      accounts2: [],
      amount: "",
      labelSave: "Insertar",
      type: "ingreso",
      isUpdate: true,

      foreignCurrency1: false,
      foreignCurrency2: false,
      currency1: "",
      currency2: "",
      amount1: "",
      amount2: "",
    };
  },

  created(){
    const token = localStorage.getItem("JWT");
    callApi = axios.create({
      baseURL: config.serverRecords,
      timeout: 5000,
      headers: {"Authorization" : `Bearer ${token}`},
    });
  },

  mounted() {
    this.renderForm();
  },

  watch: {
    type: function () {
      this.renderForm();
    },
    account1: function () {
      const account = this.accounts.find((a)=>(a.name === this.account1));
      this.foreignCurrency1 = (account.currency !== this.principalCurrency);
      this.currency1 = account.currency;
    },
    account2: function () {
      const account = this.accounts.find((a)=>(a.name === this.account2));
      this.foreignCurrency2 = (account.currency !== this.principalCurrency);
      this.currency2 = account.currency;
    },
  },

  methods: {
    renderForm() {
      switch(this.type) {
        case "ingreso":
          this.label1 = "Cuenta";
          this.label2 = "Tipo de ingreso";
          this.accounts1 = this.accounts.filter((a)=>(a.type === 'asset' || a.type === 'liability'));
          this.accounts2 = this.accounts.filter((a)=>(a.type === 'income'));
          break;
        case "gasto":
          this.label1 = "Cuenta";
          this.label2 = "Tipo de gasto";
          this.accounts1 = this.accounts.filter((a)=>(a.type === 'asset' || a.type === 'liability'));
          this.accounts2 = this.accounts.filter((a)=>(a.type === 'expense'));
          break;
        case "movimiento":
          this.label1 = "Desde";
          this.label2 = "Hacia";
          this.accounts1 = this.accounts.filter((a)=>(a.type === 'asset' || a.type === 'liability'));
          this.accounts2 = this.accounts.filter((a)=>(a.type === 'asset' || a.type === 'liability'));
          break;
        case "otro":
          this.label1 = "Debito";
          this.label2 = "Credito";
          this.accounts1 = this.accounts;
          this.accounts2 = this.accounts;
          break;
      }
    },

    /*
     * Transform a decimal point string into an integer.
     * The precision of the currency is taken into account to add zeros.
     * The returned value is also a string. 
     * 
     * example:
     *  precision 2: "12.345" --> "1234"
     *  precision 3: "12.345" --> "12345"
     *  precision 4: "12.345" --> "123450"
     *  precision 5: "12.345" --> "1234500"
     *  precision 6: "12.345" --> "12345000"
     */
    parseAmount(amount, currency) {
      console.log(currency)
      const {precision} = this.currencies.find((c) => (c.name === currency));
      console.log(this.currencies)
      if(!precision)
        throw new Error("Error retrieving precision in currencies")
      console.log(`precision of ${currency} is ${precision}`)
      let [integer, decimals] = amount.split(".");
      if(!decimals) decimals = "";
      decimals = decimals.substring(0, precision);
      decimals += "0".repeat(precision - decimals.length);
      return integer + decimals;
    },

    async saveRecord() {
      let debit;
      let credit;
      let amountDebit;
      let amountCredit;

      const amount = this.parseAmount(this.amount, this.principalCurrency);
      const amount1Parsed = this.parseAmount(this.amount1, this.currency1);
      const amount2Parsed = this.parseAmount(this.amount2, this.currency2);

      if (this.type === "ingreso" || this.type === "otro") {
        debit = this.account1;
        credit = this.account2;

        if(this.foreignCurrency1) amountDebit = amount1Parsed;
        if(this.foreignCurrency2) amountCredit = amount2Parsed;
      } else if(this.type === "gasto" || this.type === "movimiento") {
        debit = this.account2;
        credit = this.account1;

        if(this.foreignCurrency2) amountDebit = amount2Parsed;
        if(this.foreignCurrency1) amountCredit = amount1Parsed;
      } else {
        throw new Error(`There are no instructions for type '${this.type}'`);
      }
    
      const record = {
        date: new Date(this.date+'T00:00:00Z').getTime(),
        description: this.description,
        debit,
        credit,
        amount,
        amountDebit,
        amountCredit,
      };

      console.log(record)
      
      /*const id = "";
      if(this.modalType === 'update') id = this.modalRecord.id;*/

      try{
        var result = await callApi.put("/", record)
        console.log("updated")
        this.$emit("updated");
      }catch(error){
        this.showDanger(error.message)
        throw error
      }
    },
    openModalConfirmDelete() {},
  },
}
</script>
<template>
  <div>
    <b-modal ref="modalConfirmDelete" hide-footer title="Borrar">
      <p>¿Seguro que desea borrar? Luego no es posible deshacer</p>
      <div class="row mt-4">
        <div class="col-8">
          <button class="btn btn-block btn-primary" @click="cancelDelete">Cancelar</button>
        </div>
        <div class="col-4">
          <button class="btn btn-danger" @click="confirmDelete">Borrar</button>
        </div>
      </div>
    </b-modal>

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
    <Alerts ref="alerts"></Alerts>
  </div>
</template>

<script>
import axios from 'axios'
import config from '@/config'
import Alerts from '@/components/Alerts'
import Utils from "@/mixins/Utils"

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
    },
    record: {
      type: Object,
      default: {}
    }
  },
  
  data() {
    return {
      id: null,
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

  components: {
    Alerts,
  },

  mixins:[
    Utils,
  ],

  created(){
    const token = localStorage.getItem("JWT");
    callApi = axios.create({
      baseURL: config.serverRecords,
      timeout: 5000,
      headers: {"Authorization" : `Bearer ${token}`},
    });
  },

  mounted() {
    this.loadRecord();
    this.renderForm();
    this.$refs.alerts.hideAlerts();
  },

  watch: {
    type: function () {
      this.renderForm();
    },
    account1: function () {
      const currency = this.getCurrency(this.account1);
      this.foreignCurrency1 = currency.foreign;
      this.currency1 = currency.name;
    },
    account2: function () {
      const currency = this.getCurrency(this.account2);
      this.foreignCurrency2 = currency.foreign;
      this.currency2 = currency.name;
    },
  },

  methods: {
    getCurrency(accountName) {
      const account = this.accounts.find((a)=>(a.name === accountName));
      return {
        name: account.currency,
        foreign: account.currency !== this.principalCurrency,
      };
    },

    loadRecord() {
      this.id = this.record.id;
      this.date = new Date(this.record.date).toISOString().slice(0,-14);
      this.description = this.record.description;
      this.amount = this.cents2dollars(this.record.amount);

      this.isUpdate = !!this.id;
      if(this.isUpdate)
        this.labelSave = "Update";
      else
        this.labelSave = "Insertar";

      this.type = "otro"
      if (this.type === "ingreso" || this.type === "otro") {
        this.account1 = this.record.debit;
        this.account2 = this.record.credit;

        const currency1 = this.getCurrency(this.account1);
        this.foreignCurrency1 = currency1.foreign;
        this.currency1 = currency1.name;

        const currency2 = this.getCurrency(this.account2);
        this.foreignCurrency2 = currency2.foreign;
        this.currency2 = currency2.name;

        if(this.foreignCurrency1)
          this.amount1 = this.cents2dollars(this.record.amountDebit, this.currency1);
        if(this.foreignCurrency2)
          this.amount2 = this.cents2dollars(this.record.amountCredit, this.currency2);

      } else if(this.type === "gasto" || this.type === "movimiento") {
        this.account2 = this.record.debit;
        this.account1 = this.record.credit;

        const currency1 = this.getCurrency(this.account1);
        this.foreignCurrency1 = currency1.foreign;
        this.currency1 = currency1.name;

        const currency2 = this.getCurrency(this.account2);
        this.foreignCurrency2 = currency2.foreign;
        this.currency2 = currency2.name;

        if(this.foreignCurrency2)
          this.amount2 = this.cents2dollars(this.record.amountDebit, this.currency2);
        if(this.foreignCurrency1)
          this.amount1 = this.cents2dollars(this.record.amountCredit, this.currency1);
      }
    },

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
      const {precision} = this.currencies.find((c) => (c.name === currency));
      if(!precision)
        throw new Error("Error retrieving precision in currencies");

      if(!amount)
        throw new Error(`Define amount. Received: '${amount}'`)

      if(isNaN(Number(amount)))
        throw new Error(`The amount can not be parsed. Received: '${amount}'`)

      if(Number(amount) < 0)
        throw new Error("Negative numbers are not allowed. Consider swap credit and debit accounts");

      let [integer, decimals] = amount.trim().split(".");
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
      try{
        const amount = this.parseAmount(this.amount, this.principalCurrency);
      
        if (this.type === "ingreso" || this.type === "otro") {
          debit = this.account1;
          credit = this.account2;

          if(this.foreignCurrency1)
            amountDebit = this.parseAmount(this.amount1, this.currency1);
          if(this.foreignCurrency2)
            amountCredit = this.parseAmount(this.amount2, this.currency2);

        } else if(this.type === "gasto" || this.type === "movimiento") {
          debit = this.account2;
          credit = this.account1;

          if(this.foreignCurrency2)
            amountDebit = this.parseAmount(this.amount2, this.currency2);
          if(this.foreignCurrency1)
            amountCredit = this.parseAmount(this.amount1, this.currency1);

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
        if(isNaN(record.date))
          throw new Error(`Invalid date ${this.date}. Use the format YYYY-mm-dd`);
      
        let response;
        let event;
        if(this.isUpdate) {
          response = await callApi.put(`/${this.id}`, record);
          event = "onUpdate";
        } else {
          response = await callApi.put("/", record);
          event = "onInsert";
        }
        console.log(response.data);
        this.$emit(event);
      }catch(error){
        console.log("show danger")
        this.$refs.alerts.showDanger(error.message)
        throw error
      }
    },

    async deleteRecord(){
      try{
        const response = await callApi.delete(`/${this.id}`);
        console.log(response.data);
        this.$emit("onDelete");
      }catch(error){
        this.$refs.alerts.showDanger(error.message)
        throw error
      }
    },

    openModalConfirmDelete(){
      this.$refs.modalConfirmDelete.show()
    },

    confirmDelete(){
      this.$refs.modalConfirmDelete.hide()
      this.deleteRecord()
    },

    cancelDelete(){
      this.$refs.modalConfirmDelete.hide()
    },
  },
}
</script>
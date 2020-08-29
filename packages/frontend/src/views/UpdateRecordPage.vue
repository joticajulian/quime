<template>
  <div>
    <AppHeader 
      :title="title"
      update="icon"
      @onUpdate="getRecord()"
    />
    <form class="margin-menu1 container" @click="$event.preventDefault()">
      <label for="date" aria-label="date">Fecha</label>
      <input v-model="date" id="date" type="date"/>
      <button :class="classType" id="type" @click="changeType()">{{labelType}}</button>
      <label for="amount"
        arial-label="amount-principal-currency">Cantidad</label>
      <input v-model="amount" id="amount" class="amount" type="text"/>
      <div v-if="foreignCurrency1">
        <label for="amount1"
          arial-label="amount-foreing-currency1"
          class="hide-label">Amount 1</label>
        <input v-model="amount1" id="amount1" class="amount" type="text"/>
      </div>
      <div v-if="foreignCurrency2">
        <label for="amount2"
          arial-label="amount-foreing-currency2"
          class="hide-label">Amount 2</label>
        <input v-model="amount2" id="amount2" class="amount" type="text"/>
      </div>
      <div id="accounts" v-if="dbLoaded">
        <div class="account-section mr">
          <label for="account1">{{labelAccount1}}</label>
          <SelectAccount
            id="account1"
            :title="labelAccount1"
            :accounts="accounts1"
            @onChange="account1 = $event;"
          />
        </div>
        <div class="account-section">
          <label for="account1">{{labelAccount2}}</label>
          <SelectAccount
            id="account2"
            :title="labelAccount2"
            :accounts="accounts2"
            @onChange="account2 = $event;"
          />
        </div>
      </div>
      <label for="description" aria-label="description">Descripción</label>
      <input v-model="description" id="description" type="text"/>
    </form>
  </div>
</template>

<script>
import AppHeader from '@/components/AppHeader';
import SelectAccount from '@/components/SelectAccount';
import Database from '@/mixins/Database';

export default {
  props: {
    id: {
      type: String,
      default: "",
    }
  },

  data() {
    return {
      dbLoaded: false,
      title: "Insertar",
      type: "expense",
      labelType: "Gasto",
      date: null,
      amount: "",
      amount1: "",
      amount2: "",
      description: "",
      type: "Gasto",
      account1: {
        logo: "",
        name: "",
      },
      account2: {
        logo: "",
        name: "",
      },
      labelAccount1: "Cuenta",
      labelAccount2: "Categoría",
      foreignCurrency1: true,
      foreignCurrency2: true,
      currency1: "",
      currency2: "",
      accounts1: [],
      accounts2: [],
      classType: {},
    };
  },

  components: {
    AppHeader,
    SelectAccount,
  },

  mixins: [
    Database
  ],

  created() {
    let timer = setInterval(()=>{
      if(this.loaded) {
        clearInterval(timer);
        this.type = "other";
        this.changeType();
        this.accounts1 = this.$store.state.accounts;
        this.accounts2 = this.$store.state.accounts;
        this.dbLoaded = true;
      }
    }, 100);
  },

  watch: {
    account1: function () {
      this.foreignCurrency1 = this.account1.currency !== this.$store.state.principalCurrency;
      this.currency1 = this.account1.name;
    },
    account2: function () {
      this.foreignCurrency2 = this.account2.currency !== this.$store.state.principalCurrency;
      this.currency2 = this.account2.name;
    },
  },

  methods: {
    changeType() {
      switch(this.type) {
        case "expense":
          this.type = "income";
          this.classType = {green: true};
          this.labelType = "Ingreso";
          this.labelAccount1 = "Cuenta";
          this.labelAccount2 = "Categoría";
          this.accounts1 = this.$store.state.accounts.filter((a)=>(a.type === 'asset' || a.type === 'liability'));
          this.accounts2 = this.$store.state.accounts.filter((a)=>(a.type === 'income'));
          break;
        case "other":
          this.type = "expense";
          this.classType = {red: true};
          this.labelType = "Gasto";
          this.labelAccount1 = "Cuenta";
          this.labelAccount2 = "Categoría";
          this.accounts1 = this.$store.state.accounts.filter((a)=>(a.type === 'asset' || a.type === 'liability'));
          this.accounts2 = this.$store.state.accounts.filter((a)=>(a.type === 'expense'));
          break;
        case "income":
          this.type = "movement";
          this.classType = {blue: true};
          this.labelType = "Movimiento";
          this.labelAccount1 = "Desde";
          this.labelAccount2 = "Hacia";
          this.accounts1 = this.$store.state.accounts.filter((a)=>(a.type === 'asset' || a.type === 'liability'));
          this.accounts2 = this.$store.state.accounts.filter((a)=>(a.type === 'asset' || a.type === 'liability'));
          break;
        case "movement":
          this.type = "other";
          this.classType = {blue: true};
          this.labelType = "Otro";
          this.labelAccount1 = "Débito";
          this.labelAccount2 = "Crédito";
          this.accounts1 = this.$store.state.accounts;
          this.accounts2 = this.$store.state.accounts;
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
      const {precision} = this.$store.state.currencies.find((c) => (c.name === currency));
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

    getRecord() {
      let debit;
      let credit;
      let amountDebit;
      let amountCredit;
      try{
        const amount = this.parseAmount(this.amount, this.$store.state.principalCurrency);
      
        if (this.type === "income" || this.type === "other") {
          debit = this.account1.name;
          credit = this.account2.name;

          if(this.foreignCurrency1)
            amountDebit = this.parseAmount(this.amount1, this.currency1);
          if(this.foreignCurrency2)
            amountCredit = this.parseAmount(this.amount2, this.currency2);

        } else if(this.type === "expense" || this.type === "movement") {
          debit = this.account2.name;
          credit = this.account1.name;

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
      }catch(error){
        console.log("show danger")
        //this.$refs.alerts.showDanger(error.message)
        throw error
      }
    },
  }
}
</script>

<style scoped>
label {
  font-size: 14px;
  display: block;
  margin-top: 20px;
}

input {
  font-size: 18px;
  display: block;
  width: 100%;
  border: 0.5px solid var(--black);
  box-sizing: border-box;
  border-radius: 6px;
  padding: 8px 10px;
  margin-top: 8px;
}

.hide-label {
  display: none;
}

#date {
  width: calc(100% - 145px);
  display: inline-block;
  margin-right: 15px;
}

#type {
  width: 130px;
  display: inline-block;
}

 .amount {
   text-align: end;
 }

.account-section {
  display: inline-block;
  width: calc(50% - 5px);
}

.account-section.mr {
  margin-right: 10px;
}

.account {
  border: 0.5px solid var(--black);
  box-sizing: border-box;
  border-radius: 6px;
  margin-top: 8px;
  padding: 10px;
}

.icon {
  height: 62px;
  width: 62px;
  display: block;
  overflow: hidden;
  background: gray;
  background-size: cover;
  background-position: center center;
  border-radius: 20%;
  margin: auto;
}

.name {
  display: block;
  text-align: center;
  font-size: 13px;
  margin-top: 5px;
}

</style>
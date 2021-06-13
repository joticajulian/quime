<template>
  <div>
    <AppHeader back="/months/0?type=incomes"/>
    <div v-if="loaded" class="container margin-menu1">
      <h1>Currencies</h1>
      <ul>
        <li v-for="currency in $store.state.currencies"
          :key="currency.name"
          class="inline"
          @click="$refs.modalCurrency.show(currency, $store.state.principalCurrency);">
          <div class="currency">{{currency.name}}</div>
        </li>
        <li @click="$refs.modalCurrency.show(null)"
          class="inline">
          <div class="new currency">+</div>
        </li>
      </ul>
      <h1>Accounts</h1>
      <h2>Assets</h2>
      <ul>
        <li v-for="account in assets"
          :key="account.name"
        >
          <div class="account">
            <div class="icon" :style="{ backgroundImage: 'url(' + account.logo + ')' }"></div>
            <div class="name">{{account.name}}</div>
            <div class="currency">{{account.currency}}</div>
          </div>
        </li>
      </ul>
      <h2>Liabilities</h2>
      <ul>
        <li v-for="account in liabilities"
          :key="account.name"
        >
          <div class="account">
            <div class="icon" :style="{ backgroundImage: 'url(' + account.logo + ')' }"></div>
            <div class="name">{{account.name}}</div>
            <div class="currency">{{account.currency}}</div>
          </div>
        </li>
      </ul>
      <h2>Incomes</h2>
      <ul>
        <li v-for="account in incomes"
          :key="account.name"
        >
          <div class="account">
            <div class="icon" :style="{ backgroundImage: 'url(' + account.logo + ')' }"></div>
            <div class="name">{{account.name}}</div>
            <div class="currency">{{account.currency}}</div>
          </div>
        </li>
      </ul>
      <h2>Expenses</h2>
      <ul>
        <li v-for="account in expenses"
          :key="account.name"
        >
          <div class="account">
            <div class="icon" :style="{ backgroundImage: 'url(' + account.logo + ')' }"></div>
            <div class="name">{{account.name}}</div>
            <div class="currency">{{account.currency}}</div>
          </div>
        </li>
      </ul>

      <!-- Modals -->
      <ModalCurrency ref="modalCurrency"
        @onInsert="insertCurrency($event)"
        @onDelete="deleteCurrency($event)"
        @onUpdate="updateCurrency($event)"
        @onUpdatePrincipalCurrency="updatePrincipalCurrency($event)" />
    </div>
  </div>
</template>

<script>
import AppHeader from "@/components/AppHeader";
import Database from "@/mixins/Database";
import ModalCurrency from "@/components/ModalCurrency";

export default {
  name: "Settings",

  data() {
    return {
      loaded: false,
      assets: [],
      liabilities: [],
      incomes: [],
      expenses: [],
    };
  },

  mounted() {
    let timer = setInterval(()=>{
      if(this.dbLoaded) {
        this.assets = this.$store.state.accounts.filter(a => a.type === "asset");
        this.liabilities = this.$store.state.accounts.filter(a => a.type === "liability");
        this.incomes = this.$store.state.accounts.filter(a => a.type === "income");
        this.expenses = this.$store.state.accounts.filter(a => a.type === "expense");
        this.loaded = true;
      }
    }, 100);
  },

  components: {
    AppHeader,
    ModalCurrency,
  },

  mixins: [
    Database,
  ],

  /*methods: {
    insertCurrency(currency) {
      this.insertCurrency(currency);
    },
    updateCurrency(currency) {
      console.log("updating currency");
      console.log(currency);

    }
  },*/
  
};
</script>

<style scoped>

h2 {
  margin: 30px 0px 8px 0px; 
}

li {
  vertical-align: middle;
  cursor: pointer;
  list-style-type: none;
  margin-bottom: 6px;
}

.inline {
  display: inline-block;
}

.currency {
  color: black;
  margin: 7px 7px 0px 0px;
  background: #cade23;
  border: solid 5px #b2c60f;
  border-radius: 50%;
  height: 50px;
  width: 60px;
  padding: 30px 10px 0px 10px;
  word-break: break-word;
  text-align: center;
}

.currency:hover {
  background: #d3e638;
}

.new.currency {
  background: var(--color1);
  border-color: var(--color1-focus);
}

.new.currency:hover {
  background: var(--color1-hover);
}

.account:hover {
  background: var(--color-hover-list);
}

.account .icon {
  height: 32px;
  width: 32px;
  margin-right: 10px;
  display: inline-block;
  overflow: hidden;
  background-size: cover;
  background-position: center center;
  border-radius: 20%;
  vertical-align: middle;
}

.account .name {
  display: inline-block;
  width: calc(100% - 124px);
  vertical-align: middle;
}

.account .currency {
  display: inline-block;
  vertical-align: middle;
  font-size: 14px;
  height: 28px;
  padding: 2px 0px 0px 0px;
  width: 70px;
  margin: 0px;
  box-sizing: border-box;
  border-radius: 0px;
  background: #cdff7c;
  border: solid 5px #9ce582;
}



</style>
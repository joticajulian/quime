<template>
  <div>
    <AppHeader update="icon"/>
    <form class="margin-menu1 container">
      <label for="date" aria-label="date">Fecha</label>
      <input v-model="date" id="date" type="date"/>
      <button class="red" id="type">Gasto</button>
      <label for="amount"
        arial-label="amount-principal-currency">Cantidad</label>
      <input v-model="amount" id="amount" type="text"/>
      <div v-if="foreignCurrencyCredit">
        <label for="amountCredit"
          arial-label="amount-foreing-currency-credit"
          class="hide-label">Amount credit</label>
        <input v-model="amountCredit" id="amountCredit" type="number"/>
      </div>
      <div v-if="foreignCurrencyDebit">
        <label for="amountDebit"
          arial-label="amount-foreing-currency-debit"
          class="hide-label">Amount debit</label>
        <input v-model="amountDebit" id="amountDebit" type="number"/>
      </div>
      <div id="accounts">
        <div class="account-section mr">
          <label for="account1">{{labelAccount1}}</label>
          <div id="account1" class="account">
            <div class="icon" :style="{ backgroundImage: 'url(' + account1.logo + ')' }"></div>
            <div class="name">{{account1.name}}</div>
          </div>
        </div>
        <div class="account-section">
          <label for="account2">{{labelAccount2}}</label>
          <div id="account2" class="account">
            <div class="icon" :style="{ backgroundImage: 'url(' + account2.logo + ')' }"></div>
            <div class="name">{{account2.name}}</div>
          </div>
        </div>
      </div>
      <label for="description" aria-label="description">Descripcion</label>
      <input v-model="description" id="description" type="text"/>
    </form>
  </div>
</template>

<script>
import AppHeader from '@/components/AppHeader';
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
      date: null,
      amount: "",
      amountDebit: "",
      amountCredit: "",
      description: "",
      type: "Gasto",
      account1: {
        logo: "",
        name: "desde",
      },
      account2: {
        logo: "",
        name: "hacia",
      },
      labelAccount1: "Cuenta",
      labelAccount2: "Categoría",
      foreignCurrencyCredit: true,
      foreignCurrencyDebit: true,
    };
  },

  components: {
    AppHeader,
  },

  mixins: [
    Database
  ]
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
  width: calc(100% - 115px);
  display: inline-block;
  margin-right: 15px;
}

#type {
  width: 100px;
  display: inline-block;
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
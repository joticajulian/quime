<template>
  <div class="modal" v-if="showModal" @click="hide()">
    <div class="modal-content" @click.stop="">
      <!-- header -->
      <div class="header">
        <div v-if="title" class="title">{{title}}</div>
        <ul>
          <li>
            <div>
              <div class="header-icon" @click="update()">
                <img src="../assets/check-icon.png" />
              </div>
            </div>
            <div>
              <div class="header-icon" @click="remove()">
                <img src="../assets/delete-icon.png" />
              </div>
            </div>
            <div>
              <div class="header-icon" @click="hide()">
                <img src="../assets/close-icon.png" />
              </div>
            </div>
          </li>
        </ul>
      </div>

      <!-- Body -->
      <div class="body">
        <form>
          <label for="name" aria-label="name">Nombre</label>
          <input v-model="account.name" id="name" type="text"/>
          <label for="precision" aria-label="precision">Tipo</label>
          <select v-model="account.type">
            <option value="asset">Asset</option>
            <option value="liability">Liability</option>
            <option value="income">Income</option>
            <option value="expense">Expense</option>
          </select>
          <select v-if="isNewAccount" v-model="account.currency">
            <option
              v-for="currency in currencies"
              :key="currency.name"
              :value="currency.name"
            >{{currency.name}}</option>
          </select>
          <label for="logo" aria-label="logo">Logo</label>
          <input v-model="account.logo" id="logo" type="text"/>
        </form>
      </div>
    </div>
  </div>
</template>

<script>
export default {
  name: 'ModalAccount',

  data() {
    return {
      showModal: false,
      title: '',
      account: {
        name: '',
        type: '',
        currency: '',
        logo: '',
      },
      currencies: [],
      originalName: '',
      isNewAccount: false,
    };
  },

  methods: {
    show(account, currencies) {
      if(account) {
        this.account = JSON.parse(JSON.stringify(account));
        this.title = "Modificar";
        this.isNewAccount = false;
        this.currencies = [];
        this.originalName = account.name;
      } else {
        this.account = {
          name: '',
          type: 'expense',
          currency: '',
          logo: '',
        },
        this.title = "Insertar";
        this.isNewAccount = true;
        this.currencies = currencies;
      }
      this.showModal = true;
    },

    hide() {
      this.showModal = false;
    },

    remove() {
      this.$emit('onDelete', this.account);
      this.hide();
    },

    update() {
      if(this.isNewAccount)
        this.$emit('onInsert', this.account);
      else
        this.$emit('onUpdate', {
          originalName: this.originalName,
          ...(this.account),
        });
      this.hide();
    },
  },
}
</script>

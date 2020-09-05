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
              <div class="header-icon" @click="$emit('onDelete', currency);">
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
          <input v-model="currency.name" id="name" type="text"/>
          <label for="precision" aria-label="precision">Decimales</label>
          <input v-model="currency.precision" id="precision" type="number"/>
          <label for="principalCurrency" aria-label="principal currency">Moneda principal</label>
          <input v-model="makePrincipalCurrency" id="principalCurrency" type="checkbox"/>
        </form>
      </div>
    </div>
  </div>
</template>

<script>
export default {
  name: 'ModalCurrency',

  data() {
    return {
      showModal: false,
      title: '',
      currency: {
        name: '',
        precision: '',
      },
      makePrincipalCurrency: false,
    };
  },

  methods: {
    show(currency, principalCurrency) {
      console.log(principalCurrency)
      if(currency) {
        this.currency = currency;
        this.title = "Modificar";
      } else {
        this.currency = {
          name: '',
          precision: '',
        };
        this.makePrincipalCurrency = false;
        this.title = "Insertar";
      }

      if(principalCurrency === this.currency.name) {
        this.makePrincipalCurrency = true;
        console.log("make princia")
      } else {
        this.makePrincipalCurrency = false;
      }
      this.showModal = true;
    },

    hide() {
      this.showModal = false;
    },

    update() {
      this.$emit('onUpdate', this.currency);console.log("principal currency: "+this.makePrincipalCurrency)
      if(this.makePrincipalCurrency)
        this.$emit('onUpdatePrincipalCurrency', this.currency.name);
    },
  },
}
</script>

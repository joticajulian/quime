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
      originalName: '',
      isNewCurrency: false,
      makePrincipalCurrency: false,
    };
  },

  methods: {
    show(currency, principalCurrency) {
      if(currency) {
        this.currency = currency;
        this.title = "Modificar";
        this.isNewCurrency = false;
        this.originalName = currency.name;
      } else {
        this.currency = {
          name: '',
          precision: '',
        };
        this.makePrincipalCurrency = false;
        this.title = "Insertar";
        this.isNewCurrency = true;
      }

      if(principalCurrency === this.currency.name) {
        this.makePrincipalCurrency = true;
      } else {
        this.makePrincipalCurrency = false;
      }
      this.showModal = true;
    },

    hide() {
      this.showModal = false;
    },

    remove() {
      this.$emit('onDelete', this.currency);
      this.hide();
    },

    update() {
      if(this.makePrincipalCurrency)
        this.$emit('onUpdatePrincipalCurrency', this.currency.name);
      else if(this.isNewCurrency)
        this.$emit('onInsert', this.currency);
      else
        this.$emit('onUpdate', {
          originalName: this.originalName,
          ...(this.currency),
        });
      this.hide();
    },
  },
}
</script>

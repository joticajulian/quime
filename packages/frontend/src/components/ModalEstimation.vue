<template>
  <div class="modal" v-if="showModal" @click="hide()">
    <div class="modal-content" @click.stop="">
      <!-- header -->
      <div class="header">
        <div v-if="isNewEstimation" class="title">Insertar</div>
        <div v-else class="title">Modificar</div>
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
          <!-- todo: checkbox to see if it is an update or insert in that specific position -->
          <label for="isNewEstimation" aria-label="new estimation">New estimation</label>
          <input v-model="isNewEstimation" id="isNewEstimation" type="checkbox"/>
          <label for="description" aria-label="description">Description</label>
          <input v-model="estimation.description" id="description" type="text"/>
          <label for="amount" aria-label="amount">Amount</label>
          <input v-model="estimation.amount" id="amount" type="text"/>
          <label for="debit" aria-label="debit">Debit</label>
          <input v-model="estimation.resolve.debit" id="debit" type="text"/>
          <label for="credit" aria-label="credit">Credit</label>
          <input v-model="estimation.resolve.credit" id="credit" type="text"/>
        </form>
      </div>
    </div>
  </div>
</template>

<script>
export default {
  name: 'ModalEstimation',

  data() {
    return {
      showModal: false,
      title: '',
      estimation: {
        description: "",
        amount: "",
        resolve: {
          debit: "",
          credit: "",
        }
      },
      isNewEstimation: false,
      estimationIndex: 0,
    };
  },

  methods: {
    show(index, estimation) {
      this.estimation = JSON.parse(JSON.stringify(estimation));
      this.isNewEstimation = false;
      this.estimationIndex = index;
      this.showModal = true;
    },

    hide() {
      this.showModal = false;
    },

    remove() {
      this.$emit('onDelete', this.estimationIndex);
      this.hide();
    },

    update() {
      if(this.isNewEstimation)
        this.$emit('onInsert', {
          position: this.estimationIndex,
          estimation: this.estimation,
        });
      else
        this.$emit('onUpdate', {
          position: this.estimationIndex,
          estimation: this.estimation,
        });
      this.hide();
    },
  },
}
</script>

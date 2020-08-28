<template>
  <div class="modal" v-if="showModal" @click="hide()">
    <div class="modal-content-delete">
      <p>¿Quiere borrar este registro?</p>
      <div>
        <button class="btn color1 mr" @click="$emit('onConfirmDelete', record);">Borrar</button>
        <button class="btn color2" @click="hide()">Cancelar</button>
      </div>
    </div>
  </div>
</template>

<script>
export default {
  data() {
    return {
      showModal: false,
      record: {}
    };
  },
  methods: {
    show(record) {
      this.record = record;
      this.showModal = true;
    },
    hide() {
      this.showModal = false;
    },
  },
}
</script>

<style scoped>
.modal-content-delete {
  background-color: #fefefe;
  margin: auto;
  border: 1px solid #888;
  width: 80%;
  text-align: center;
  padding: 20px;
}

p {
  margin: 0px 0px 15px 0px;
}

.mr {
  margin-right: 20px;
}
</style>
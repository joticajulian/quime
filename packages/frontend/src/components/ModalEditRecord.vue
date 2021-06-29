<template>
  <div class="modal" v-if="showModal" @click="hide()">
    <div class="modal-content-record" @click.stop="">
      <!-- header -->
      <div class="header">
        <ul>
          <li>
            <div>
              <div class="header-icon" @click="emitUpdate">
                <img src="../assets/check-icon.png" />
              </div>
            </div>
            <div>
              <div class="header-icon" @click="emitDelete">
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
        <EditRecord ref="editRecord"/>
      </div>
    </div>
  </div>
</template>

<script>
import EditRecord from '@/components/EditRecord'

export default {
  name: 'ModalEditRecord',

  data() {
    return {
      showModal: false,
      index: 0,
    }
  },

  components: {
    EditRecord,
  },

  methods: {
    show(event) {
      const { item, index } = event;
      console.log(event)
      this.index = index;
      this.showModal = true;
      this.$nextTick(() => {
        this.$refs.editRecord.loadRecord(item);
      });      
    },
    hide() {
      this.showModal = false;
    },
    emitUpdate() {
      this.$emit('onUpdate', {
        item: this.$refs.editRecord.getRecord(),
        index: this.index,
      });
      this.showModal = false;
    },
    emitDelete() {
      this.$emit('onDelete', this.index);
      this.showModal = false;
    },
  }
}
</script>

<style>
.modal-content-record {
  background-color: #fefefe;
  margin: auto;
  border: 1px solid #888;
  width: 80%;
}

.modal-content-record .header {
  width: 100%;
  height: 48px;
  background: var(--color1);
}

.modal-content-record .header > ul {
  padding-inline-start: 0px;
  margin: 0px;
  float: right;
}

.modal-content-record .header > ul li {
  list-style-type: none;
  display: inline-flex;
  padding: 0px 5px;
}

.modal-content-record .header > ul li div {
  cursor: pointer;
}

.modal-content-record .header > ul li a:hover {
  background: var(--color1-hover);
}

.modal-content-record .header > ul li div:hover {
  background: var(--color1-hover);
}

.header-icon {
  padding: 6px;
}

.header-icon img {
  height: 32px;
  width: 32px;
}


.modal-content-record .body {
  padding: 20px;
  overflow-y: scroll;
  max-height: 250px;
}

.modal-content-record .body .date {
  font-size: 24px;
  display: inline-block;
  width: 50%;
  vertical-align: middle;
}

.modal-content-record .body .type {
  display: inline-blocK;
  width: 50%;
  vertical-align: middle;
  text-align: end;
  font-size: 24px;
}

.modal-content-record .body .amount {
  text-align: end;
  display: block;
  width: 100%;
  font-size: 30px;
  margin-top: 20px;
}

.modal-content-record .body .amount2 {
  text-align: end;
  display: block;
  width: 100%;
  font-size: 18px;
}

.modal-content-record .body .images-container {
  margin-top: 20px;
  text-align: center;
}

.modal-content-record .body .images-container .account {
  vertical-align: middle;
  display: inline-block;
}

.modal-content-record .body .images-container .account .icon {
  height: 62px;
  width: 62px;
  margin-right: 10px;
  display: block;
  overflow: hidden;
  background: gray;
  background-size: cover;
  background-position: center center;
  border-radius: 20%;
  margin: auto;
}

.modal-content-record .body .images-container .account .name {
  display: block;
  text-align: center;
  font-size: 13px;
  margin-top: 5px;
}

.modal-content-record .body .images-container .arrow-icon {
  display: inline-block;
  vertical-align: middle;
  margin-right: 10px;
}

.modal-content-record .body .description {
  font-size: 18px;
  display: block;
  word-wrap: break-word;
  margin-top: 15px;
}

</style>


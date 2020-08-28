<template>
  <div class="modal" v-if="showModal" @click="showModal = false;">
    <div class="modal-content-record">
      <div class="date">{{record.dateString}}</div>
      <div class="type">{{record.badge}}</div>
      <div class="amount">{{record.amountShow}}</div>
      <div class="amount2" v-if="record.foreignCurrencyCredit">{{record.amountCreditShow}}</div>
      <div class="amount2" v-if="record.foreignCurrencyDebit">{{record.amountDebitShow}}</div>
      <div class="images-container">
        <div class="account">
          <div class="icon" v-bind:style="{ backgroundImage: 'url(' + record.imageCredit + ')' }"></div>
          <div class="name">{{record.credit}}</div>
        </div>        
        <div class="arrow-icon"><img src="../assets/forward-icon48.png" /></div>
        <div class="account">
          <div class="icon" v-bind:style="{ backgroundImage: 'url(' + record.imageDebit + ')' }"></div>
          <div class="name">{{record.debit}}</div>
        </div>
      </div>
      <div class="description">{{record.description}}</div>
    </div>
  </div>
</template>

<script>
export default {
  name: 'ModalRecord',

  props: {
    /*record: {
      type: Object,
      default: {}
    },
    show: {
      type: Boolean,
      default: false,
    }*/
  },

  data() {
    return {
      showModal: false,
      record: {},
    }
  },

  methods: {
    show(record) {
      this.record = record;
      this.showModal = true;
    }
  }
}
</script>

<style>
.modal-content-record {
  background-color: #fefefe;
  margin: auto;
  padding: 20px;
  border: 1px solid #888;
  width: 80%;
}

.modal-content-record .date {
  font-size: 24px;
  display: inline-block;
  width: 50%;
  vertical-align: middle;
}

.modal-content-record .type {
  display: inline-blocK;
  width: 50%;
  vertical-align: middle;
  text-align: end;
  font-size: 24px;
}

.modal-content-record .amount {
  text-align: end;
  display: block;
  width: 100%;
  font-size: 30px;
  margin-top: 20px;
}

.modal-content-record .amount2 {
  text-align: end;
  display: block;
  width: 100%;
  font-size: 18px;
}

.modal-content-record .images-container {
  margin-top: 20px;
  text-align: center;
}

.modal-content-record .images-container .account {
  vertical-align: middle;
  display: inline-block;
}

.modal-content-record .images-container .account .icon {
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

.modal-content-record .images-container .account .name {
  display: block;
  text-align: center;
  font-size: 13px;
  margin-top: 5px;
}

.modal-content-record .images-container .arrow-icon {
  display: inline-block;
  vertical-align: middle;
  margin-right: 10px;
}

.modal-content-record .description {
  font-size: 18px;
  display: block;
  word-wrap: break-word;
  margin-top: 15px;
}

</style>


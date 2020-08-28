<template>
  <div class="modal" v-if="showModal" @click="hide()">
    <div class="modal-content-record">
      <!-- header -->
      <div class="header">
        <ul>
          <li>
            <router-link :to="`${$route.path}?edit=${record.id}`">
              <div class="header-icon">
                <img src="../assets/edit-icon.png" />
              </div>
            </router-link>
            <div>
              <div class="header-icon" @click="$emit('onDelete', record);">
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
  </div>
</template>

<script>
export default {
  name: 'ModalRecord',

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
    },
    hide() {
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


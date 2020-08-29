<template>
  <div class="account" @click="showModal=true;">
    <div class="icon" :style="{ backgroundImage: 'url(' + account.logo + ')' }"></div>
    <div class="name">{{account.name}}</div>

    <!-- modal -->
    <div class="modal" v-if="showModal" @click.stop="hide()">
      <div class="modal-content">
        <div class="header">{{title}}</div>
        <div class="body">
          <ul>
            <li v-for="acc in accounts" :key="acc.name" @click.stop="selectAccount(acc)">
              <div>
                <div class="icon" :style="{ backgroundImage: 'url(' + acc.logo + ')' }"></div>
                <div class="name">{{acc.name}}</div>
              </div>
            </li>
          </ul>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
export default {
  props: {
    title: {
      type: String,
      default: "Select",
    },
    accounts: {
      type: Array,
      default: ()=>([]),
    }
  },

  data() {
    return {
      showModal: false,
      account: {
        name: "Select account",
        logo: "",
      }
    }
  },

  methods: {
    hide() {
      this.showModal = false;
    },

    selectAccount(acc) {
      this.account = acc;
      this.$emit('onChange', acc);
      this.hide();
      console.log("select")
    },
  } 
}
</script>

<style scoped>
.header {
  font-size: 24px;
}

.body {
  margin-top: 20px;
}

.modal {
  padding-top: 48px;
}

.modal-content {
  width: 80%;
  margin: auto;
  background: var(--white);
  border: 1px solid #888;
}

ul {
  padding-inline-start: 0px;
  margin: 0px;
}

ul li {
  list-style-type: none;
  padding: 0px;
}

ul li > div {
  cursor: pointer;
  display: block;
  border-style: none;
  box-shadow: 0px 4px 4px rgba(0, 0, 0, 0.25);
  padding: 10px;
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
  margin:auto;
}

.name {
  display: block;
  font-size: 13px;
  margin:auto;
  text-align: center;
  margin-top: 5px;
}

.body .icon {
  display: inline-block;
  vertical-align: middle;
  height: 32px;
  width: 32px;
  margin-right: 10px;
}

.body .name {
  display: inline-block;
  font-size: 18px;
  vertical-align: middle;
  margin: 0px;
}

</style>
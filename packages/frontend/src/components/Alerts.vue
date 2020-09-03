<template>
  <div>
    <div class="alert info" :class="{show: info}">{{infoText}}</div>
    <div class="alert success" :class="{show: success}">{{successText}}</div>
    <div class="alert danger" :class="{show: danger}">{{dangerText}}</div>
  </div>
</template>

<script>
export default {
  data: function(){
    return {
      success: false,
      danger: false,
      info: false,
      successText: 'jjj',
      dangerText: 'ddd',
      infoText: 'ddeee',
    }
  },
  
  methods: {

    showInfo(msg){
      this.hideSuccess();
      this.hideDanger();
      this.info = true
      this.infoText = msg
    },

    hideInfo(){
      this.info = false
      this.infoText = ''
    },

    showSuccess(msg) {
      this.hideInfo();
      this.hideDanger();
      this.success = true
      this.successText = msg
    },

    hideSuccess() {
      this.success = false
      this.successText = ''
    },

    showDanger(msg) {
      this.hideSuccess();
      this.hideInfo();
      this.danger = true
      this.dangerText = msg
    },

    hideDanger() {
      this.danger = false
      this.dangerText = ''
    },

    hideAlerts() {
      this.hideSuccess();
      this.hideDanger();
      this.hideInfo();
    },
  }
}
</script>

<style>
.alert{
  position: fixed;  
  bottom: -100px;
  margin: 20px;
  display: block;
  width: calc(100% - 80px);
  border-radius: 6px;
  padding: 15px 20px;
  text-align: left;
  transition: all 0.3s;
}

.alert.show {
  bottom: 0px;
}

.alert.danger {
  background: #ff9f9f;
  color: #8a0000;
}

.alert.info {
  background: #ffef9f;
  color: #828a00;
}

.alert.success {
  background: #9fffbd;
  color: #008a24;
}
</style>
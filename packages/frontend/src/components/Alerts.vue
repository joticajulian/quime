<template>
  <div class="mt-4">
    <div v-if="alert.info" class="alert alert-info" role="alert">{{alert.infoText}}</div>
    <div v-if="alert.success" class="alert alert-success" role="alert" v-html="alert.successText"></div>
    <div v-if="alert.danger"  class="alert alert-danger" role="alert">{{alert.dangerText}}</div>
  </div>
</template>

<script>
export default {
  data: function(){
    return {
      alert: {
        success: false,
        danger: false,
        info: false,
        successText: '',
        dangerText: '',
        infoText: ''
      },
    }
  },
  
  methods: {

    showInfo(msg){
      this.alert.info = true
      this.alert.infoText = msg
    },

    hideInfo(){
      this.alert.info = false
      this.alert.infoText = ''
    },

    showSuccess(msg) {
      this.alert.success = true
      this.alert.successText = msg
    },

    hideSuccess() {
      this.alert.success = false
      this.alert.successText = ''
    },

    showDanger(msg) {
      this.alert.danger = true
      this.alert.dangerText = msg
    },

    hideDanger() {
      this.alert.danger = false
      this.alert.dangerText = ''
    },

    hideAlerts() {
      this.hideSuccess();
      this.hideDanger();
      this.hideInfo();
    },
  }
}
</script>
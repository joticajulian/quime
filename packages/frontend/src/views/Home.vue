<template>
  <div>
    <h1>Quime</h1>
    <div class="row">
      <label class="label-form-control col-md-2">Username</label>
      <input class="form-control col-md-10" type="text" v-model="username" @keyup.enter="login"/>
    </div>
    <div class="row">
      <label class="label-form-control col-md-2">Password</label>
      <input class="form-control col-md-10" type="password" v-model="password" @keyup.enter="login"/>
    </div>
    <button class="btn btn-primary mt-3 mb-3" @click="login">login</button>
    <Alerts ref="alerts"/>
  </div>
</template>

<script>
import axios from 'axios'
import router from '@/router'
import config from '@/config'
import Alerts from '@/components/Alerts'

export default {
  name: 'home',

  data(){
    return {
      username: '',
      password: '',
    }
  },

  components: {
    Alerts,
  },

  methods:{
    async login(){
      this.$refs.alerts.hideAlerts();
      try{
        const data = {
          username: this.username,
          password: this.password
        }
        const response = await axios.post(config.serverLogin, data);
        localStorage.setItem("JWT", response.data.token);
        console.log('logged in')
        router.push('/months/0?type=incomes')
      }catch(error){
        const message = error.response
          ? error.response.data
            ? error.response.data.detail
              ? error.response.data.detail
              : JSON.stringify(error.response.data)
            : error.message
          : error.message;
        this.$refs.alerts.showDanger(message);
        throw error;
      }
    }
  }
}
</script>

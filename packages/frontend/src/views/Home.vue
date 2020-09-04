<template>
  <div class="body-content">
    <div class="container">
      <h1>Quime</h1>
      <form @click="$event.preventDefault()">
        <label for="username" aria-label="username">Username</label>
        <input id="username" type="text" v-model="username" @keyup.enter="login"/>
        <label for="password" aria-label="password">Password</label>
        <input id="password" type="password" v-model="password" @keyup.enter="login"/>
        <button class="color1" @click="login">Login</button>
      </form>
    </div>
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

<style scoped>
button {
  margin-top: 15px;
}

.body-content {
  display: block;
  width: 100%;
  height: 100vh;
  background: linear-gradient(180deg, #e1e5ff 0%, #2d3b80 100%);
}
</style>

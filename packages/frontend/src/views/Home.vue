<template>
  <div>
    <div class="container">
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
      <div v-if="alert.danger"  class="alert alert-danger" role="alert">{{alert.dangerText}}</div>
    </div>
  </div>
</template>

<script>
import axios from 'axios'
import router from '@/router'
import config from '@/config'

export default {
  name: 'home',

  data(){
    return {
      username: '',
      password: '',
      alert:{
        danger: false,
        dangerText: ''
      },
    }
  },

  methods:{
    async login(){
      this.alert.danger = false
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
        this.alert.danger = true
        this.alert.dangerText = error.message
      }
    }
  }
}
</script>

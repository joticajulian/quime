<template>
  <div>
    <b-navbar toggleable="lg" type="dark" variant="primary">
      <ul class="navbar-nav">
        <li class="nav-item">
          <router-link to="/dashboard" class="nav-item nav-link"><div id="logo"><img src="../assets/logo.png" /></div></router-link>
        </li>
      </ul>
      <b-navbar-nav class="nav-link ml-auto d-lg-none">
        <button class="btn btn-primary" @click="logout">Logout</button>
      </b-navbar-nav>

      <b-navbar-toggle target="nav-collapse"></b-navbar-toggle>
      <b-collapse id="nav-collapse" is-nav>
        <ul class="navbar-nav">
        </ul>
        <ul class="navbar-nav ml-auto">
          <li class="nav-item d-lg-block d-none">
            <div>
              <button class="btn btn-primary" @click="logout">Logout</button>
            </div>
          </li>
        </ul>
      </b-collapse>
    </b-navbar>
  </div>
</template>

<script>
import Config from '@/config.js'
import axios from 'axios'
import router from '@/router'

export default {
  name: "AppHeader",

  data() {
    return {
    };
  },

  methods: {
    async logout() {
      await axios.get(Config.SERVER_API + 'logout')
      this.$emit('logout')
      router.push('/')
    }
  },
};
</script>

<style scoped>
#logo {
  height: 2.3rem;
}
#logo img {
  max-width: 100%;
  max-height: 100%;
}
</style>

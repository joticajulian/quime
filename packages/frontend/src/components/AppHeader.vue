<template>
  <nav>
    <ul class="left">
      <li v-if="back">
        <router-link :to="back">
          <div class="nav-icon">
            <img src="../assets/back-icon.png" />
          </div>
        </router-link>
      </li>
    </ul>

    <ul class="right">
      <li v-if="incomes">
        <router-link :to="incomes" :class="{focus: focus === 'incomes'}">
          <div class="nav-icon">
            <img src="../assets/accounting-icon.png" />
          </div>
        </router-link>
      </li>
      <li v-if="assets">
        <router-link :to="assets" :class="{focus: focus === 'assets'}">
          <div class="nav-icon">
            <img src="../assets/bank-icon.png" />
          </div>
        </router-link>
      </li>
      <li v-if="update">
        <div>
          <div class="nav-icon">
            <img src="../assets/check-icon.png" />
          </div>
        </div>
      </li>
    </ul>
    <!--<b-navbar-nav class="nav-link ml-auto d-lg-none">
      <button class="btn btn-primary" @click="logout">Logout</button>
    </b-navbar-nav>-->
  </nav>
</template>

<script>
import Config from '@/config.js'
import axios from 'axios'
import router from '@/router'

export default {
  name: "AppHeader",

  props: {
    incomes: {
      type: String,
      default: "",
    },
    assets: {
      type: String,
      default: "",
    },
    back: {
      type: String,
      default: "",
    },
    update: {
      type: String,
      default: "",
    },
    focus: {
      type: String,
      default: ""
    }
  },

  data() {
    return {
    };
  },

  methods: {
    async logout() {
      localStorage.removeItem("JWT");
      this.$emit('logout')
      router.push('/')
    }
  },
};
</script>

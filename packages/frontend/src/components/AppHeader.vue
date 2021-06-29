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
      <li v-if="title" class="title">{{title}}</li>
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
        <div class="nav-icon" @click="$emit('onUpdate')">
          <img src="../assets/check-icon.png" />
        </div>
      </li>
      <li>
        <div class="nav-icon" @click="toggleMenu()">
          <img src="../assets/sandwich-icon.png" />
        </div>
        <div v-if="showMenu" class="dropdown-content">
          <router-link class="dropdown-item" to="/import">Import</router-link>
          <router-link class="dropdown-item" to="/settings">Settings</router-link>
          <div class="dropdown-item" @click="logout()">Logout</div>
        </div>
      </li>
    </ul>
  </nav>
</template>

<script>
import Config from '@/config.js'
import axios from 'axios'
import router from '@/router'

export default {
  name: "AppHeader",

  props: {
    title: {
      type: String,
      default: "",
    },
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
      showMenu: false,
    };
  },

  methods: {
    toggleMenu() {
      this.showMenu = !this.showMenu;
      console.log(this.showMenu)
    },

    async logout() {
      localStorage.removeItem("JWT");
      this.$emit('onLogout')
      router.push('/')
    }
  },
};
</script>

<style>
.dropdown-content, .dropdown-content:hover {
  float: left;
  overflow: hidden;
  position: absolute;
  min-width: 160px;
  background-color: #f9f9f9;
  box-shadow: 0px 8px 16px 0px rgba(0,0,0,0.2);
  top: 48px;
  right: 0px;
  border: none;
}

.dropdown-item {
  float: none;
  color: black;
  padding: 12px 16px;
  text-decoration: none;
  display: block;
  text-align: left;
  border: none;
}

.dropdown-item:hover {
  background: var(--color1-hover);
}
</style>

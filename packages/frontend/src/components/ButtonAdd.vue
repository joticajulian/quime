<template>
  <div>
    <router-link :to="link" class="color1 shadow">
      <img src="../assets/add-icon.png">
    </router-link>
    <div class="empty"></div>
  </div>
</template>

<script>
import querystring from 'querystring'

export default {
  props: {
    fillForm: {
      type: Object,
      default: () => ({})
    },
  },

  data() {
    return {
      //link: "/newRecord"
    }
  },

  computed: {
    link: function () {
      if(this.fillForm) {console.log("fill form changed"); console.log(this.fillForm)
        return `/newRecord?${querystring.stringify(this.fillForm)}`;
      } else {
        return `/newRecord`;
      }
    },
  }
}
</script>

<style scoped>
a {
  border-radius: 50%;
  width: 48px;
  height: 48px;
  padding: 4px;
  position: fixed;
  right: 15px;
  bottom: 15px;
  background: var(--color1);
}

a:hover {
  background: var(--color1-hover);
}

a img {
  height: 32px;
  width: 32px;
  padding: calc(50% - 16px);
}

.empty {
  display: block;
  height: 70px;
  width: 100%;
}
</style>
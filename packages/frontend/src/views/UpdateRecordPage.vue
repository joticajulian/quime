<template>
  <div>
    <AppHeader update="icon"/>
  </div>
</template>

<script>
import AppHeader from '@/components/AppHeader';
import Database from '@/mixins/Database';

export default {
  props: {
    id: {
      type: String,
      default: "",
    }
  },

  data() {
    return {

    };
  },

  components: {
    AppHeader,
  },

  mixins: [
    Database
  ]
}
</script>
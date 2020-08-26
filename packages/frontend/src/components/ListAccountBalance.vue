<template>
  <div>
    <router-link
      v-for="balance in balances"
      :key="balance.account"
      :to="balance.link"
    ><div class="card-account">
      <div class="icon" :style="{ backgroundImage: 'url(' + balance.logo + ')' }"></div>
      <div class="description">{{balance.account}}</div>
      <div class="amount">{{balance.balanceShow}}</div>
      <div class="amount2"
        v-if="balance.secondCurrency"
      >{{balance.balanceCurrencyShow}}</div></div>
    </router-link>
  </div>
</template>

<script>
export default {
  props: {
    balances: Array,
  }
}
</script>
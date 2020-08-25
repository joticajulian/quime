<template>
  <div>
    <div class="card-account"
      v-for="balance in balances"
      :key="balance.account"
    >
      <div class="icon" :style="{ backgroundImage: 'url(' + balance.logo + ')' }"></div>
      <div class="description">{{balance.account}}</div>
      <div class="amount">{{balance.balanceShow}}</div>
      <div class="amount2"
        v-if="balance.secondCurrency"
      >{{balance.balanceCurrencyShow}}</div>
    </div>
  </div>
</template>

<script>
export default {
  props: {
    balances: Array,
  }
}
</script>
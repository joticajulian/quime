<template>
  <div>
    <router-link to="/newRecord" class="color1 shadow">
      <img src="../assets/add-icon.png">
    </router-link>
    <div class="empty"></div>
  </div>
</template>

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
  padding: 6px;
}

.empty {
  display: block;
  height: 70px;
  width: 100%;
}
</style>
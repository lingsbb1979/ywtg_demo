<template>
  <BaseLayout>
    <section class="placeholder-view">
      <h1>佳木斯历史建筑智慧安全监测平台 Demo</h1>
      <p>Vue Demo 工程基础结构已创建。</p>
    </section>
  </BaseLayout>
</template>

<script setup lang="ts">
import BaseLayout from "@/layouts/BaseLayout.vue"
</script>

<style scoped>
.placeholder-view {
  display: grid;
  min-height: 100vh;
  place-content: center;
  gap: 12px;
  padding: 24px;
  text-align: center;
}

.placeholder-view h1,
.placeholder-view p {
  margin: 0;
}
</style>
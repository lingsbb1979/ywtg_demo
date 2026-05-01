<template>
  <BaseLayout>
    <section class="route-page route-page--h5">
      <p class="route-page__eyebrow">H5</p>
      <h1>待办工单（占位）</h1>
      <p>此页面为 T15.4 的最小占位：后续显示外勤待办列表，调用 `workOrderService.listWorkOrders()`。</p>
    </section>
  </BaseLayout>
</template>

<script setup lang="ts">
import BaseLayout from "@/layouts/BaseLayout.vue"
</script>

<style scoped>
.route-page { padding: 12px }
</style>

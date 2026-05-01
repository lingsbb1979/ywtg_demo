<template>
  <BaseLayout>
    <section class="route-page">
      <p class="route-page__eyebrow">管理端</p>
      <h1>工单详情（占位）</h1>
      <p>此页面为 T15.4 的最小占位：显示工单基本信息，后续使用 `workOrderService` 填充数据。</p>
    </section>
  </BaseLayout>
</template>

<script setup lang="ts">
import BaseLayout from "@/layouts/BaseLayout.vue"
import { useRoute } from "vue-router"
const route = useRoute()
const id = route.params.id
</script>

<style scoped>
.route-page { padding: 16px }
</style>

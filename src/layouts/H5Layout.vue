<template>
  <div class="h5-layout">
    <!-- 顶部 header -->
    <header class="h5-layout__header">
      <button v-if="showBack" class="h5-layout__back" @click="goBack">←</button>
      <div v-else class="h5-layout__header-side" />
      <span class="h5-layout__title">{{ pageTitle }}</span>
      <div class="h5-layout__header-side" />
    </header>

    <!-- 内容区 -->
    <main class="h5-layout__content">
      <router-view />
    </main>

    <!-- 底部 tabbar 导航 -->
    <nav class="h5-layout__tabbar">
      <router-link
        class="h5-layout__tabbar-item"
        :class="{ 'is-active': isActive('/h5/work-orders') }"
        to="/h5/work-orders"
      >
        <span class="h5-layout__tabbar-icon">📋</span>
        <span class="h5-layout__tabbar-label">工单</span>
      </router-link>
      <router-link
        class="h5-layout__tabbar-item"
        :class="{ 'is-active': isActive('/h5/mine') }"
        to="/h5/mine"
      >
        <span class="h5-layout__tabbar-icon">👤</span>
        <span class="h5-layout__tabbar-label">我的</span>
      </router-link>
    </nav>
  </div>
</template>

<script setup lang="ts">
import { computed } from "vue"
import { useRoute, useRouter } from "vue-router"

const route = useRoute()
const router = useRouter()

const ROOT_PATHS = ['/h5/work-orders', '/h5/mine']
const showBack = computed(() => !ROOT_PATHS.some(p => route.path.startsWith(p)))
const pageTitle = computed(() => (route.meta?.title as string) ?? "历史建筑安全监测")

function isActive(path: string): boolean {
  return route.path.startsWith(path)
}

function goBack(): void {
  router.back()
}
</script>

<style scoped>
.h5-layout {
  display: flex;
  flex-direction: column;
  width: 100%;
  max-width: 414px;
  min-height: 100vh;
  margin: 0 auto;
  background: #f5f7fa;
  position: relative;
}

.h5-layout__header {
  position: sticky;
  top: 0;
  z-index: 100;
  height: 44px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0 4px;
  background: #1677ff;
  color: #fff;
  font-size: 16px;
  font-weight: 600;
  letter-spacing: 0.02em;
}

.h5-layout__header-side {
  width: 44px;
  flex-shrink: 0;
}

.h5-layout__back {
  width: 44px;
  height: 44px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: none;
  border: none;
  color: #fff;
  font-size: 20px;
  cursor: pointer;
  flex-shrink: 0;
}

.h5-layout__content {
  flex: 1;
  overflow-y: auto;
  /* 留出底部 tabbar 空间 */
  padding-bottom: 60px;
}

.h5-layout__tabbar {
  position: fixed;
  bottom: 0;
  left: 50%;
  transform: translateX(-50%);
  width: 100%;
  max-width: 414px;
  height: 56px;
  display: flex;
  align-items: center;
  background: #fff;
  border-top: 1px solid #e8e8e8;
  z-index: 200;
}

.h5-layout__tabbar-item {
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 2px;
  text-decoration: none;
  color: #8c8c8c;
  font-size: 12px;
  height: 100%;
  transition: color 0.2s;
}

.h5-layout__tabbar-item.is-active {
  color: #1677ff;
}

.h5-layout__tabbar-icon {
  font-size: 20px;
  line-height: 1;
}

.h5-layout__tabbar-label {
  font-size: 11px;
}

/* 375px / 390px 宽度设备：缩减 max-width 到 375px */
@media (max-width: 375px) {
  .h5-layout {
    max-width: 375px;
  }
  .h5-layout__tabbar {
    max-width: 375px;
  }
}

/* 390px 设备兼容，max-width: 414px 已覆盖 */
</style>

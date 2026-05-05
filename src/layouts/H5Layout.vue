<template>
  <div class="h5-layout">
    <!-- 顶部 header：首页隐藏（Banner自带），其他页面显示渐变头部 -->
    <header v-if="!isHomePage" class="h5-layout__header">
      <button v-if="showBack" class="h5-layout__back" @click="goBack">
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><polyline points="15 18 9 12 15 6"/></svg>
      </button>
      <div v-else class="h5-layout__header-side" />
      <span class="h5-layout__title">{{ pageTitle }}</span>
      <div class="h5-layout__header-side" />
    </header>

    <!-- 内容区 -->
    <main class="h5-layout__content" :class="{ 'h5-layout__content--no-header': isHomePage }">
      <router-view />
    </main>

    <!-- 底部 tabbar 导航 -->
    <nav class="h5-layout__tabbar">
      <!-- 首页 -->
      <router-link class="h5-layout__tabbar-item" :class="{ 'is-active': isActive('/h5/home') }" to="/h5/home">
        <span class="h5-layout__tabbar-icon-wrap">
          <span class="h5-layout__tabbar-icon">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M3 12L12 3l9 9"/><path d="M9 21V12h6v9"/></svg>
          </span>
          <span v-if="alarmBadgeCount > 0" class="h5-layout__tabbar-badge">{{ alarmBadgeCount > 99 ? '99+' : alarmBadgeCount }}</span>
        </span>
        <span class="h5-layout__tabbar-label">首页</span>
      </router-link>
      <!-- 监测 -->
      <router-link class="h5-layout__tabbar-item" :class="{ 'is-active': isActive('/h5/buildings') || isActive('/h5/building/') }" to="/h5/buildings">
        <span class="h5-layout__tabbar-icon">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 2v20"/><path d="M5 7h14"/><path d="M6 7l6-5 6 5"/><rect x="7" y="11" width="10" height="9" rx="1"/></svg>
        </span>
        <span class="h5-layout__tabbar-label">监测</span>
      </router-link>
      <!-- 预警 -->
      <router-link class="h5-layout__tabbar-item" :class="{ 'is-active': isActive('/h5/alerts') }" to="/h5/alerts">
        <span class="h5-layout__tabbar-icon">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M18 8a6 6 0 0 0-12 0c0 7-3 7-3 7h18s-3 0-3-7"/><path d="M13.73 21a2 2 0 0 1-3.46 0"/></svg>
        </span>
        <span class="h5-layout__tabbar-label">告警</span>
      </router-link>
      <!-- 工单 -->
      <router-link class="h5-layout__tabbar-item" :class="{ 'is-active': isActive('/h5/work-orders') || isActive('/h5/dispose') }" to="/h5/work-orders">
        <span class="h5-layout__tabbar-icon">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M9 11l3 3L22 4"/><path d="M21 12v7a2 2 0 01-2 2H5a2 2 0 01-2-2V5a2 2 0 012-2h11"/></svg>
        </span>
        <span class="h5-layout__tabbar-label">工单</span>
      </router-link>
      <!-- 我的 -->
      <router-link class="h5-layout__tabbar-item" :class="{ 'is-active': isActive('/h5/mine') }" to="/h5/mine">
        <span class="h5-layout__tabbar-icon">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="8" r="4"/><path d="M4 20c0-4 3.6-7 8-7s8 3 8 7"/></svg>
        </span>
        <span class="h5-layout__tabbar-label">我的</span>
      </router-link>
    </nav>
  </div>
</template>

<script setup lang="ts">
import { computed } from "vue"
import { useRoute, useRouter } from "vue-router"
import { countOpenAlarms } from "@/services/alarmService"

const route = useRoute()
const router = useRouter()

/** 首页小红点显示全部未关闭告警 */
const alarmBadgeCount = computed(() => countOpenAlarms())

const ROOT_PATHS = ['/h5/home', '/h5/alerts', '/h5/work-orders', '/h5/buildings', '/h5/mine']
// alerts 页面有自己的自定义顶栏（含搜索按钮），不使用 layout 提供的通用 header
const isHomePage = computed(() => route.path === '/h5/home' || route.path === '/h5' || route.path.startsWith('/h5/alerts'))
const showBack = computed(() => !ROOT_PATHS.includes(route.path))
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
  background: linear-gradient(180deg, #FFFFFF 0%, #F3F8FF 100%);
  position: relative;
}

/* ── Header ── */
.h5-layout__header {
  position: sticky;
  top: 0;
  z-index: 100;
  height: 48px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0 4px;
  background: linear-gradient(135deg, #1044A8 0%, #1B6FE8 100%);
  color: #fff;
  font-size: 16px;
  font-weight: 600;
  letter-spacing: 0.02em;
  box-shadow: 0 2px 12px rgba(27,111,232,0.25);
}

.h5-layout__header-side {
  width: 44px;
  flex-shrink: 0;
}

.h5-layout__back {
  width: 44px;
  height: 48px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: none;
  border: none;
  color: #fff;
  cursor: pointer;
  flex-shrink: 0;
}

/* ── Content ── */
.h5-layout__content {
  flex: 1;
  overflow-y: auto;
  padding-bottom: 60px;
}
.h5-layout__content--no-header {
  padding-top: 0;
}

/* ── Tabbar ── */
.h5-layout__tabbar {
  position: fixed;
  bottom: 0;
  left: 50%;
  transform: translateX(-50%);
  width: 100%;
  max-width: 414px;
  height: 62px;
  display: flex;
  align-items: stretch;
  background: #fff;
  border-top: 1px solid #E8EDF5;
  box-shadow: 0 -8px 24px rgba(31,93,172,0.08);
  z-index: 200;
  padding-bottom: env(safe-area-inset-bottom, 0);
}

.h5-layout__tabbar-item {
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 3px;
  text-decoration: none;
  color: #9CA3AF;
  height: 100%;
  transition: color 0.2s;
}

.h5-layout__tabbar-item.is-active { color: #1B6FE8; }

.h5-layout__tabbar-icon {
  width: 22px;
  height: 22px;
  display: flex;
  align-items: center;
  justify-content: center;
}
.h5-layout__tabbar-icon svg {
  width: 22px;
  height: 22px;
}
.h5-layout__tabbar-item.is-active .h5-layout__tabbar-icon svg {
  stroke: #1B6FE8;
}
.h5-layout__tabbar-item.is-active .h5-layout__tabbar-icon {
  background: linear-gradient(180deg, #2A72FF, #1263F1);
  color: #fff;
  box-shadow: 0 8px 16px rgba(42,114,255,0.25);
}
.h5-layout__tabbar-item.is-active .h5-layout__tabbar-icon svg { stroke: #fff; }
.h5-layout__tabbar-icon {
  border-radius: 12px;
  transition: all 0.2s ease;
}

.h5-layout__tabbar-label {
  font-size: 12px;
  font-weight: 500;
  letter-spacing: 0.01em;
}

/* tabbar icon with badge wrapper */
.h5-layout__tabbar-icon-wrap {
  position: relative;
  display: inline-flex;
  align-items: center;
  justify-content: center;
}
.h5-layout__tabbar-badge {
  position: absolute;
  top: -4px;
  right: -6px;
  min-width: 16px;
  height: 16px;
  padding: 0 4px;
  border-radius: 999px;
  background: #F43F5E;
  color: #fff;
  font-size: 9px;
  font-weight: 700;
  line-height: 16px;
  text-align: center;
  pointer-events: none;
  z-index: 1;
}

@media (max-width: 375px) {
  .h5-layout,
  .h5-layout__tabbar { max-width: 375px; }
}
</style>

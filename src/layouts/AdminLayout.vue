<template>
  <div class="admin-layout">
    <!-- 顶部导航栏 -->
    <header class="admin-layout__header">
      <div class="admin-layout__header-title">佳木斯历史建筑智慧安全监测平台</div>

      <div class="admin-layout__header-right">
        <!-- 当前账号展示（始终显示登录账号，不随视角变化） -->
        <span class="admin-layout__account-badge">
          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="opacity:0.6"><circle cx="12" cy="8" r="4"/><path d="M4 20c0-4 3.6-7 8-7s8 3 8 7"/></svg>
          <code class="admin-layout__account-badge-name">{{ authStore.currentUser }}</code>
        </span>

        <!-- 新建演示标签下拉：点击在新标签页以对应角色打开 -->
        <div class="role-picker" ref="pickerRef">
          <button class="role-picker__trigger" @click="toggleDropdown">
            新建演示标签
            <svg class="role-picker__arrow" :class="{ 'role-picker__arrow--open': showDropdown }"
              width="10" height="6" viewBox="0 0 10 6" fill="none">
              <path d="M1 1L5 5L9 1" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/>
            </svg>
          </button>
          <div v-if="showDropdown" class="role-picker__menu">
            <div class="role-picker__menu-hint">点击在新标签页打开</div>
            <button
              v-for="r in demoRoleStore.roleOptions"
              :key="r.value"
              class="role-picker__item"
              @click="selectRole(r.value)"
            >
              <span class="role-picker__item-label">{{ r.label }}</span>
              <code class="role-picker__item-account">{{ ROLE_ACCOUNT[r.value].username }}</code>
            </button>
          </div>
        </div>

        <!-- 演示控制台：独立常驻按钮 -->
        <router-link class="admin-layout__demo-btn" to="/admin/demo-console">
          🎬 演示控制台
        </router-link>
      </div>
    </header>

    <div class="admin-layout__body">
      <!-- 侧边菜单区 -->
      <aside class="admin-layout__sidebar">
        <nav class="admin-layout__nav">
          <router-link
            v-for="menu in demoRoleStore.visibleMenus"
            :key="menu.path"
            class="admin-layout__nav-item"
            :to="menu.path"
          >{{ menu.label }}</router-link>
        </nav>
      </aside>

      <!-- 内容区 -->
      <main class="admin-layout__content">
        <router-view />
      </main>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, onUnmounted } from "vue"
import { useDemoRoleStore, ROLE_ACCOUNT, getDefaultPathForRole } from "@/stores/demoRole"
import { useAuthStore } from "@/stores/auth"
import type { DemoRole } from "@/stores/demoRole"

const demoRoleStore = useDemoRoleStore()
const authStore = useAuthStore()

/** 自定义下拉开关 */
const showDropdown = ref(false)
const pickerRef = ref<HTMLElement | null>(null)

function toggleDropdown() {
  showDropdown.value = !showDropdown.value
}

function selectRole(val: DemoRole) {
  showDropdown.value = false
  // 在新标签页打开，携带 _role 参数，新标签自行初始化状态
  // 当前标签页 URL 和登录状态完全不变
  const target = getDefaultPathForRole(val)
  window.open(`${target}?_role=${val}`, '_blank')
}

/** 点击外部关闭下拉 */
function onDocClick(e: MouseEvent) {
  if (pickerRef.value && !pickerRef.value.contains(e.target as Node)) {
    showDropdown.value = false
  }
}
onMounted(() => document.addEventListener("mousedown", onDocClick))
onUnmounted(() => document.removeEventListener("mousedown", onDocClick))
</script>

<style scoped>
/* ===== 根布局 ===== */
.admin-layout {
  display: flex;
  flex-direction: column;
  min-height: 100vh;
  background: #f5f7fa;
}

/* ===== 顶部导航栏 ===== */
.admin-layout__header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  height: 52px;
  padding: 0 24px;
  background: #001529;
  color: #fff;
  flex-shrink: 0;
}

.admin-layout__header-title {
  font-size: 15px;
  font-weight: 600;
  letter-spacing: 0.02em;
}

.admin-layout__header-right {
  display: flex;
  align-items: center;
  gap: 12px;
}

/* ===== 账号徽标（始终显示当前登录账号，不随视角变化）===== */
.admin-layout__account-badge {
  display: flex;
  align-items: center;
  gap: 5px;
  color: rgba(255,255,255,0.55);
  font-size: 12px;
}

.admin-layout__account-badge-name {
  color: #40a9ff;
  font-family: monospace;
  font-size: 12px;
  background: rgba(64,169,255,0.15);
  padding: 1px 7px;
  border-radius: 3px;
  font-style: normal;
  letter-spacing: 0.02em;
}

/* ===== 自定义角色选择器 ===== */
.role-picker {
  position: relative;
}

.role-picker__trigger {
  display: flex;
  align-items: center;
  gap: 5px;
  height: 28px;
  padding: 0 10px;
  background: rgba(255,255,255,0.08);
  border: 1px solid rgba(255,255,255,0.18);
  border-radius: 4px;
  color: rgba(255,255,255,0.85);
  font-size: 12px;
  cursor: pointer;
  transition: all 0.15s ease;
  white-space: nowrap;
}

.role-picker__trigger:hover {
  background: rgba(255,255,255,0.14);
  border-color: rgba(255,255,255,0.35);
  color: #fff;
}

.role-picker__arrow {
  transition: transform 0.15s ease;
  opacity: 0.7;
}

.role-picker__arrow--open {
  transform: rotate(180deg);
}

/* 下拉菜单：全深色，不受浏览器原生控制 */
.role-picker__menu {
  position: absolute;
  top: calc(100% + 6px);
  right: 0;
  min-width: 180px;
  background: #0d2137;
  border: 1px solid rgba(255,255,255,0.12);
  border-radius: 6px;
  box-shadow: 0 8px 24px rgba(0,0,0,0.5);
  z-index: 200;
  overflow: hidden;
}

.role-picker__item {
  display: flex;
  align-items: center;
  justify-content: space-between;
  width: 100%;
  padding: 9px 14px;
  background: none;
  border: none;
  color: rgba(255,255,255,0.75);
  font-size: 13px;
  cursor: pointer;
  text-align: left;
  transition: background 0.12s ease;
  gap: 12px;
}

.role-picker__item:hover {
  background: rgba(255,255,255,0.07);
  color: #fff;
}

.role-picker__menu-hint {
  padding: 6px 14px 4px;
  font-size: 11px;
  color: rgba(255,255,255,0.25);
  letter-spacing: 0.03em;
  text-transform: uppercase;
  border-bottom: 1px solid rgba(255,255,255,0.06);
  margin-bottom: 2px;
}

.role-picker__item-label {
  flex: 1;
}

.role-picker__item-account {
  font-family: monospace;
  font-size: 11px;
  color: rgba(255,255,255,0.35);
  background: rgba(255,255,255,0.06);
  padding: 1px 5px;
  border-radius: 3px;
  font-style: normal;
}

/* ===== 演示控制台按钮 ===== */
.admin-layout__demo-btn {
  display: flex;
  align-items: center;
  height: 28px;
  padding: 0 12px;
  background: rgba(250,140,22,0.15);
  border: 1px solid rgba(250,140,22,0.4);
  border-radius: 4px;
  color: #fa8c16;
  font-size: 12px;
  font-weight: 500;
  text-decoration: none;
  cursor: pointer;
  white-space: nowrap;
  transition: all 0.15s ease;
}

.admin-layout__demo-btn:hover {
  background: rgba(250,140,22,0.25);
  border-color: rgba(250,140,22,0.7);
  color: #ffa940;
}

.admin-layout__demo-btn.router-link-active {
  background: rgba(250,140,22,0.25);
  border-color: #fa8c16;
}

/* ===== 主体区域 ===== */
.admin-layout__body {
  display: flex;
  flex: 1;
  overflow: hidden;
}

.admin-layout__sidebar {
  width: 160px;
  background: #001529;
  flex-shrink: 0;
  overflow-y: auto;
}

.admin-layout__nav {
  display: flex;
  flex-direction: column;
  padding: 8px 0;
}

.admin-layout__nav-item {
  display: block;
  padding: 10px 20px;
  color: rgba(255,255,255,0.62);
  text-decoration: none;
  font-size: 14px;
  transition: background 0.15s, color 0.15s;
  border-left: 3px solid transparent;
}

.admin-layout__nav-item:hover {
  background: rgba(255,255,255,0.06);
  color: rgba(255,255,255,0.9);
}

.admin-layout__nav-item.router-link-active {
  background: rgba(24,144,255,0.12);
  color: #40a9ff;
  border-left-color: #1890ff;
}

.admin-layout__content {
  flex: 1;
  overflow-y: auto;
  padding: 20px;
}
</style>

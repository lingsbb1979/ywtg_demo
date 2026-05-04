<template>
  <div class="admin-layout">
    <!-- 顶部导航栏 -->
    <header class="admin-layout__header">
      <div class="admin-layout__brand">
        <span class="admin-layout__brand-mark">盾</span>
        <div class="admin-layout__brand-copy">
          <div class="admin-layout__header-title">国家历史建筑安全监测与应急指挥平台</div>
          <span class="admin-layout__brand-subtitle">NATIONAL HISTORIC BUILDING SAFETY MONITORING AND EMERGENCY COMMAND PLATFORM</span>
        </div>
      </div>

      <nav class="admin-layout__topnav" aria-label="管理端主导航">
        <router-link
          v-for="item in filteredTopNav"
          :key="item.path"
          class="admin-layout__topnav-item"
          :class="{ 'router-link-active': isPathActive(item.path) }"
          :to="item.path"
        >{{ item.label }}</router-link>
      </nav>

      <div class="admin-layout__header-right">
        <span class="admin-layout__status-chip">北斗卫星授时：正常</span>
        <span class="admin-layout__status-chip admin-layout__status-chip--green">定位服务：在线</span>
        <!-- 当前账号展示（显示当前演示视角的角色名） -->
        <span class="admin-layout__account-badge">
          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="opacity:0.6"><circle cx="12" cy="8" r="4"/><path d="M4 20c0-4 3.6-7 8-7s8 3 8 7"/></svg>
          <code class="admin-layout__account-badge-name">{{ currentRoleLabel }}</code>
        </span>

        <!-- 新建演示标签下拉：点击在新标签页以对应角色打开 -->
        <div class="role-picker" ref="pickerRef">
          <button class="role-picker__trigger" @click="toggleDropdown">
            选择角色
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

        <!-- 控制台：独立常驻按钮 -->
        <router-link class="admin-layout__demo-btn" to="/admin/demo-console">
          🎬 控制台
        </router-link>
      </div>
    </header>

    <div class="admin-layout__body">
      <!-- 侧边菜单区 -->
      <aside class="admin-layout__sidebar">
        <div class="admin-layout__sidebar-title">{{ sidebarTitle }}</div>
        <nav class="admin-layout__nav">
          <router-link
            v-for="menu in demoRoleStore.visibleMenus"
            :key="menu.path"
            class="admin-layout__nav-item"
            :to="menu.path"
          >
            <span class="admin-layout__nav-icon">{{ menuIcon(menu.label) }}</span>
            <span class="admin-layout__nav-label">{{ menu.label }}</span>
            <span v-if="menuBadge(menu.label)" class="admin-layout__nav-badge">{{ menuBadge(menu.label) }}</span>
          </router-link>
        </nav>
        <div class="admin-layout__sidebar-art" aria-hidden="true">
          <span />
          <span />
          <span />
        </div>
      </aside>

      <!-- 内容区 -->
      <main class="admin-layout__content">
        <router-view />
      </main>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted } from "vue"
import { useRoute } from "vue-router"
import { useDemoRoleStore, ROLE_ACCOUNT, getDefaultPathForRole, DEMO_ROLE_OPTIONS } from "@/stores/demoRole"
import type { DemoRole } from "@/stores/demoRole"
import { getTable } from "@/services/sqliteMirrorRepository"

const demoRoleStore = useDemoRoleStore()
const route = useRoute()

const topNav = [
  { path: "/admin/dashboard", label: "首页总览" },
  { path: "/admin/alarms", label: "监测预警" },
  { path: "/admin/buildings", label: "建筑档案" },
  { path: "/screen/emergency", label: "应急指挥" },
  { path: "/admin/work-orders", label: "工单管理" },
  { path: "/admin/analysis", label: "数据分析" },
]

/** 按当前角色可见菜单过滤顶部导航项 */
const filteredTopNav = computed(() =>
  topNav.filter(item =>
    demoRoleStore.visibleMenus.some(m => m.path === item.path)
  )
)

const sidebarTitle = computed(() => {
  if (route.path.includes("work-orders")) return "工单管理"
  if (route.path.includes("alarms")) return "告警中心"
  if (route.path.includes("buildings")) return "建筑档案"
  return "功能菜单"
})

/** 当前演示视角的中文名（用于顶部角色标签） */
const currentRoleLabel = computed(() => {
  const opt = DEMO_ROLE_OPTIONS.find(o => o.value === demoRoleStore.currentRole)
  return opt?.label ?? demoRoleStore.currentRole
})

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

function isPathActive(path: string): boolean {
  return route.path === path || route.path.startsWith(`${path}/`)
}

function menuIcon(label: string): string {
  if (label.includes("工作台")) return "首"
  if (label.includes("告警")) return "警"
  if (label.includes("工单")) return "单"
  if (label.includes("应急")) return "急"
  if (label.includes("督办")) return "督"
  if (label.includes("采集")) return "采"
  if (label.includes("分析")) return "析"
  if (label.includes("建筑")) return "建"
  return "设"
}

function menuBadge(label: string): string {
  const cap = (n: number) => n > 99 ? "99+" : n > 0 ? String(n) : ""
  if (label.includes("工单")) {
    // 只有 RED 级别未关闭工单才计入
    const closed = new Set(["CLOSED", "CANCELLED", "COMPLETED", "FINISHED"])
    const orders = getTable<{ status: string; alarm_level: string }>("work_order")
    const n = orders.filter(o => o.alarm_level === "RED" && !closed.has(o.status ?? "")).length
    return cap(n)
  }
  if (label.includes("应急")) {
    const active = new Set(["ACTIVE", "PENDING", "IN_PROGRESS", "OPEN"])
    const incidents = getTable<{ status: string }>("emergency_incident")
    const n = incidents.filter(i => active.has(i.status ?? "")).length
    return cap(n)
  }
  if (label.includes("告警")) {
    // 只有 RED 级别未关闭告警才计入
    const closed = new Set(["CLOSED", "CANCELLED", "RESOLVED"])
    const alarms = getTable<{ status: string; alarm_level: string }>("alarm_record")
    const n = alarms.filter(a => a.alarm_level === "RED" && !closed.has(a.status ?? "")).length
    return cap(n)
  }
  return ""
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
  background: #F0F4F9;
}

/* ===== 顶部导航栏 ===== */
.admin-layout__header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  height: 56px;
  padding: 0 20px 0 0;
  background: linear-gradient(90deg, #0D2B6B 0%, #1044A8 40%, #1B6FE8 100%);
  color: #fff;
  flex-shrink: 0;
  box-shadow: 0 2px 12px rgba(13,43,107,0.3);
}

.admin-layout__header-title {
  height: 56px;
  display: flex;
  align-items: center;
  padding: 0 20px;
  font-size: 15px;
  font-weight: 700;
  letter-spacing: 0.04em;
  background: rgba(0,0,0,0.15);
  border-right: 1px solid rgba(255,255,255,0.1);
  white-space: nowrap;
}

.admin-layout__header-right {
  display: flex;
  align-items: center;
  gap: 10px;
}

/* ===== 账号徽标 ===== */
.admin-layout__account-badge {
  display: flex;
  align-items: center;
  gap: 5px;
  color: rgba(255,255,255,0.65);
  font-size: 12px;
}

.admin-layout__account-badge-name {
  color: #7DD3FC;
  font-family: monospace;
  font-size: 12px;
  background: rgba(125,211,252,0.12);
  padding: 2px 8px;
  border-radius: 3px;
  font-style: normal;
  letter-spacing: 0.02em;
}

/* ===== 角色选择器 ===== */
.role-picker { position: relative; }

.role-picker__trigger {
  display: flex;
  align-items: center;
  gap: 5px;
  height: 30px;
  padding: 0 12px;
  background: rgba(255,255,255,0.1);
  border: 1px solid rgba(255,255,255,0.2);
  border-radius: 6px;
  color: rgba(255,255,255,0.9);
  font-size: 12px;
  cursor: pointer;
  transition: all 0.15s;
  white-space: nowrap;
}
.role-picker__trigger:hover {
  background: rgba(255,255,255,0.18);
  border-color: rgba(255,255,255,0.4);
}
.role-picker__arrow { transition: transform 0.15s; opacity: 0.7; }
.role-picker__arrow--open { transform: rotate(180deg); }

.role-picker__menu {
  position: absolute;
  top: calc(100% + 8px);
  right: 0;
  min-width: 190px;
  background: #0D2B6B;
  border: 1px solid rgba(255,255,255,0.12);
  border-radius: 8px;
  box-shadow: 0 12px 32px rgba(0,0,0,0.45), 0 0 0 1px rgba(255,255,255,0.04);
  z-index: 300;
  overflow: hidden;
}
.role-picker__menu-hint {
  padding: 7px 14px 5px;
  font-size: 10px;
  color: rgba(255,255,255,0.3);
  letter-spacing: 0.06em;
  text-transform: uppercase;
  border-bottom: 1px solid rgba(255,255,255,0.07);
}
.role-picker__item {
  display: flex;
  align-items: center;
  justify-content: space-between;
  width: 100%;
  padding: 10px 14px;
  background: none;
  border: none;
  color: rgba(255,255,255,0.78);
  font-size: 13px;
  cursor: pointer;
  text-align: left;
  transition: background 0.12s;
  gap: 10px;
}
.role-picker__item:hover { background: rgba(255,255,255,0.07); color: #fff; }
.role-picker__item-label { flex: 1; }
.role-picker__item-account {
  font-family: monospace;
  font-size: 11px;
  color: rgba(255,255,255,0.3);
  background: rgba(255,255,255,0.05);
  padding: 1px 5px;
  border-radius: 3px;
  font-style: normal;
}

/* ===== 演示控制台按钮 ===== */
.admin-layout__demo-btn {
  display: flex;
  align-items: center;
  height: 30px;
  padding: 0 12px;
  background: rgba(251,191,36,0.12);
  border: 1px solid rgba(251,191,36,0.35);
  border-radius: 6px;
  color: #FCD34D;
  font-size: 12px;
  font-weight: 500;
  text-decoration: none;
  cursor: pointer;
  white-space: nowrap;
  transition: all 0.15s;
}
.admin-layout__demo-btn:hover {
  background: rgba(251,191,36,0.22);
  border-color: rgba(251,191,36,0.6);
}
.admin-layout__demo-btn.router-link-active {
  background: rgba(251,191,36,0.2);
  border-color: #FCD34D;
}

/* ===== 主体区域 ===== */
.admin-layout__body {
  display: flex;
  flex: 1;
  overflow: hidden;
}

.admin-layout__sidebar {
  width: 164px;
  background: #0D2B6B;
  flex-shrink: 0;
  overflow-y: auto;
  box-shadow: 2px 0 16px rgba(13,43,107,0.2);
}

.admin-layout__nav {
  display: flex;
  flex-direction: column;
  padding: 10px 0 20px;
}

.admin-layout__nav-item {
  display: flex;
  align-items: center;
  padding: 11px 16px 11px 20px;
  color: rgba(255,255,255,0.58);
  text-decoration: none;
  font-size: 13.5px;
  font-weight: 500;
  transition: background 0.15s, color 0.15s;
  border-left: 3px solid transparent;
  letter-spacing: 0.01em;
  white-space: nowrap;
}
.admin-layout__nav-item:hover {
  background: rgba(255,255,255,0.07);
  color: rgba(255,255,255,0.9);
}
.admin-layout__nav-item.router-link-active {
  background: linear-gradient(90deg, rgba(59,142,255,0.18) 0%, transparent 100%);
  color: #60A5FA;
  border-left-color: #3B8EFF;
  font-weight: 600;
}

.admin-layout__content {
  flex: 1;
  overflow-y: auto;
  padding: 20px;
  background: #F0F4F9;
}

/* ===== 参考图风格覆盖：白色左侧菜单 + 浅蓝企业后台 ===== */
.admin-layout {
  background:
    radial-gradient(circle at 52% -90px, rgba(88,157,255,0.22), transparent 380px),
    linear-gradient(180deg, #F4F9FF 0%, #EEF5FF 100%);
  color: #163467;
}

.admin-layout__header {
  height: 68px;
  padding: 0 18px 0 16px;
  background:
    linear-gradient(180deg, rgba(255,255,255,0.92), rgba(245,250,255,0.86)),
    radial-gradient(circle at 18% 0, rgba(45,124,255,0.18), transparent 280px);
  color: #0A2A6B;
  box-shadow: none;
  border-bottom: 1px solid rgba(210,225,248,0.65);
}

.admin-layout__brand {
  display: flex;
  align-items: center;
  gap: 10px;
  min-width: 270px;
  flex-shrink: 0;
}
.admin-layout__brand-mark {
  width: 34px;
  height: 34px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  border-radius: 11px;
  background: linear-gradient(145deg, #0C48D9, #2F7DFF);
  color: #fff;
  font-size: 13px;
  font-weight: 900;
  box-shadow: 0 8px 18px rgba(29,109,255,0.22), inset 0 0 0 2px rgba(255,255,255,0.34);
  flex-shrink: 0;
}
.admin-layout__brand-copy { min-width: 0; }
.admin-layout__header-title {
  height: auto;
  padding: 0;
  background: transparent;
  border: 0;
  color: #052A88;
  font-size: 18px;
  letter-spacing: 0;
}
.admin-layout__brand-subtitle {
  display: block;
  margin-top: 2px;
  color: #6C88B5;
  font-size: 8px;
  letter-spacing: 0.02em;
  white-space: nowrap;
  max-width: 260px;
  overflow: hidden;
  text-overflow: ellipsis;
}

.admin-layout__topnav {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 4px;
  flex: 1;
  min-width: 360px;
  height: 44px;
  padding: 0 8px;
  border-radius: 22px;
  background: rgba(255,255,255,0.86);
  box-shadow: 0 12px 30px rgba(58,107,184,0.10);
  border: 1px solid rgba(222,233,250,0.9);
}
.admin-layout__topnav-item {
  height: 34px;
  padding: 0 8px;
  display: inline-flex;
  align-items: center;
  border-radius: 17px;
  color: #31517F;
  font-size: 11px;
  font-weight: 700;
  text-decoration: none;
  white-space: nowrap;
}
.admin-layout__topnav-item:hover,
.admin-layout__topnav-item.router-link-active {
  color: #1B6FE8;
  background: linear-gradient(180deg, #EFF6FF, #FFFFFF);
  box-shadow: inset 0 -2px 0 #2A72FF;
}

.admin-layout__header-right { gap: 8px; flex-shrink: 0; }
.admin-layout__status-chip {
  display: inline-flex;
  align-items: center;
  gap: 5px;
  color: #365683;
  font-size: 11px;
  font-weight: 700;
  white-space: nowrap;
}
.admin-layout__status-chip::after {
  content: '';
  width: 6px;
  height: 6px;
  border-radius: 50%;
  background: #10B981;
  box-shadow: 0 0 8px rgba(16,185,129,0.65);
}
.admin-layout__account-badge { color: #506D99; }
.admin-layout__account-badge-name {
  color: #1B6FE8;
  background: #EAF3FF;
  border: 1px solid #D7E7FF;
}
.role-picker__trigger {
  height: 32px;
  background: #FFFFFF;
  border-color: #DCE8FA;
  border-radius: 16px;
  color: #31517F;
  box-shadow: 0 6px 16px rgba(58,107,184,0.08);
}
.role-picker__trigger:hover { background: #F4F8FF; border-color: #BFD7FF; }
.role-picker__menu {
  background: #FFFFFF;
  border-color: #DCE8FA;
  border-radius: 12px;
  box-shadow: 0 16px 40px rgba(57,93,153,0.16);
}
.role-picker__menu-hint {
  color: #8AA0C2;
  border-bottom-color: #EEF3FB;
}
.role-picker__item { color: #31517F; }
.role-picker__item:hover { background: #F4F8FF; color: #1B6FE8; }
.role-picker__item-account { color: #6C88B5; background: #EEF6FF; }
.admin-layout__demo-btn {
  height: 32px;
  border-radius: 16px;
  color: #1B6FE8;
  background: #EAF3FF;
  border-color: #CFE2FF;
  box-shadow: 0 6px 16px rgba(58,107,184,0.08);
}
.admin-layout__demo-btn:hover { background: #DDEEFF; border-color: #AFCBFF; }

.admin-layout__body { background: transparent; }
.admin-layout__sidebar {
  width: 220px;
  margin: 12px 0 12px 12px;
  border-radius: 10px;
  background: rgba(255,255,255,0.94);
  border: 1px solid rgba(222,233,250,0.92);
  box-shadow: 0 14px 34px rgba(47,94,168,0.10);
  overflow: hidden;
  display: flex;
  flex-direction: column;
}
.admin-layout__sidebar-title {
  height: 52px;
  display: flex;
  align-items: center;
  padding: 0 20px;
  color: #123A8A;
  font-size: 15px;
  font-weight: 900;
  border-bottom: 1px solid #EEF3FB;
}
.admin-layout__nav {
  flex: 1;
  padding: 10px 10px;
  gap: 4px;
}
.admin-layout__nav-item {
  min-height: 42px;
  padding: 0 12px;
  gap: 10px;
  border-left: 0;
  border-radius: 6px;
  color: #3D5B86;
  font-size: 13px;
  font-weight: 700;
}
.admin-layout__nav-item:hover {
  background: #F2F7FF;
  color: #1B6FE8;
}
.admin-layout__nav-item.router-link-active {
  background: linear-gradient(90deg, #2A72FF, #5B9BFF);
  color: #FFFFFF;
  border-left-color: transparent;
  box-shadow: 0 10px 22px rgba(42,114,255,0.24);
}
.admin-layout__nav-icon {
  width: 20px;
  height: 20px;
  border-radius: 5px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  background: #EAF3FF;
  color: #1B6FE8;
  font-size: 11px;
  font-weight: 900;
  flex-shrink: 0;
}
.admin-layout__nav-item.router-link-active .admin-layout__nav-icon {
  background: rgba(255,255,255,0.22);
  color: #FFFFFF;
}
.admin-layout__nav-label { flex: 1; overflow: hidden; text-overflow: ellipsis; }
.admin-layout__nav-badge {
  min-width: 18px;
  height: 18px;
  padding: 0 5px;
  border-radius: 999px;
  background: #F43F5E;
  color: #fff;
  font-size: 10px;
  line-height: 18px;
  text-align: center;
}
.admin-layout__sidebar-art {
  position: relative;
  height: 150px;
  margin: 8px 16px 18px;
  border-radius: 14px;
  background:
    radial-gradient(circle at 50% 78%, rgba(42,114,255,0.20), transparent 48%),
    linear-gradient(180deg, rgba(235,245,255,0.08), #F4F9FF);
  overflow: hidden;
}
.admin-layout__sidebar-art span {
  position: absolute;
  bottom: 34px;
  width: 34px;
  height: 34px;
  border-radius: 8px;
  background: linear-gradient(145deg, #A7D1FF, #2A72FF);
  box-shadow: 0 16px 24px rgba(42,114,255,0.22), inset 0 0 0 2px rgba(255,255,255,0.35);
  transform: rotate(45deg) skew(-8deg, -8deg);
}
.admin-layout__sidebar-art span:nth-child(1) { left: 28px; bottom: 30px; opacity: 0.55; }
.admin-layout__sidebar-art span:nth-child(2) { left: 76px; bottom: 54px; width: 48px; height: 48px; }
.admin-layout__sidebar-art span:nth-child(3) { right: 30px; bottom: 34px; opacity: 0.72; }
.admin-layout__content {
  padding: 12px;
  background: transparent;
}

@media (max-width: 1180px) {
  .admin-layout__topnav { display: none; }
  .admin-layout__brand { min-width: 280px; }
}

@media (max-width: 1360px) {
  .admin-layout__status-chip { display: none; }
}
</style>

<template>
  <!--
    T15.82 大屏告警派遣页 /screen/alarm-dispatch
    ─────────────────────────────────────────────────────────────
    低保真线框（Wireframe）：
    ┌──────────────────────── 顶部标题栏 ─────────────────────────────┐
    │  ← 返回大屏首页    告警派遣中心                  时间  状态数   │
    ├──────────────────┬──────────────────────┬──────────────────────┤
    │                  │                      │                      │
    │   告警列表面板   │  告警详情面板        │  派单操作面板        │
    │  [ALARM LIST]    │  [ALARM DETAIL]      │  [DISPATCH ACTION]   │
    │                  │                      │                      │
    │  ● 筛选: 全部    │  建筑编码: B003      │  派单对象            │
    │  ──────────────  │  建筑名称: 历史建筑  │  ─────────────────   │
    │  ● 红色告警 [↑]  │  告警等级: ORANGE    │  [确认告警] [派单]  │
    │  ○ 橙色告警      │  触发时间: 12:30     │                      │
    │  ○ 橙色告警      │  告警内容: 裂缝扩展  │  当前工单状态        │
    │  ○ 黄色告警      │                      │  待接单: 3           │
    │                  │  选择处置人员        │  处理中: 2           │
    │  告警统计        │  ● 街道外勤01        │                      │
    │  活跃: 5         │  ○ 街道外勤02        │                      │
    │  已处置: 12      │                      │                      │
    │                  │                      │                      │
    └──────────────────┴──────────────────────┴──────────────────────┘

    ─────────────────────────────────────────────────────────────
    业务场景：演示步骤 4-5
      大屏展示告警列表 → 点击选中告警 → 确认告警 → 自动派单 → 生成工单
    ─────────────────────────────────────────────────────────────
    数据来源：
      - alarmService.listAlarms()   → alarm_record 表
      - screenKpiService            → work_order 表（工单统计）
    UI 规范：
      - 沿用 ScreenHomeView 大屏深色科技主题
      - screen-glass-card 玻璃卡片布局
      - screen tokens + badge-screen-- + risk-dot
  -->

  <div class="screen-root screen-bg alarm-dispatch-root" :style="rootStyle">
    <!-- ===== 顶部标题栏 ===== -->
    <header class="alarm-dispatch-header screen-page-header screen-glass-card">
      <div class="alarm-dispatch-header__left screen-page-header__left">
        <router-link to="/screen/home" class="btn-screen-secondary alarm-dispatch-back">
          ← 返回大屏
        </router-link>
        <div class="screen-page-title-group">
          <span class="screen-page-kicker">ALARM DISPATCH COMMAND</span>
          <h1 class="alarm-dispatch-header__title screen-page-title">告警派遣中心</h1>
        </div>
      </div>
      <div class="alarm-dispatch-header__stats tabular-nums">
        <span class="alarm-stat alarm-stat--red">待确认 {{ pendingCount }}</span>
        <span class="alarm-stat alarm-stat--orange">已确认 {{ confirmedCount }}</span>
        <span class="alarm-stat alarm-stat--green">今日处置 {{ todayCount }}</span>
      </div>
      <div class="alarm-dispatch-header__right screen-page-header__right">
        <span class="alarm-dispatch-time screen-page-time tabular-nums">{{ currentTime }}</span>
      </div>
    </header>

    <!-- ===== 三列主区域 ===== -->
    <main class="alarm-dispatch-main">

      <!-- ========== 左：告警列表 ========== -->
      <section class="alarm-dispatch-panel screen-glass-card" data-zone="alarm-list">
        <div class="screen-section-title">
          <span class="screen-section-title__icon"></span>
          <span class="screen-section-title__text">告警列表</span>
          <span class="screen-section-title__badge">共 {{ alarms.length }} 条</span>
        </div>

        <!-- 筛选按钮 -->
        <div class="alarm-filter-row">
          <button
            v-for="f in filterOptions"
            :key="f.value"
            class="alarm-filter-btn"
            :class="{ 'alarm-filter-btn--active': activeFilter === f.value }"
            @click="activeFilter = f.value"
          >
            {{ f.label }}
          </button>
        </div>

        <!-- 告警列表 -->
        <div class="alarm-list-scroll">
          <div
            v-for="alarm in filteredAlarms"
            :key="alarm.id"
            class="alarm-list-item"
            :class="{ 'alarm-list-item--selected': selectedAlarm?.id === alarm.id }"
            @click="selectAlarm(alarm)"
          >
            <span class="risk-dot" :class="riskDotClass(alarm.alarmLevel)"></span>
            <div class="alarm-list-item__body">
              <div class="alarm-list-item__title">{{ alarm.alarmTitle ?? '未命名告警' }}</div>
              <div class="alarm-list-item__meta tabular-nums">
                {{ alarm.buildingName ?? alarm.buildingCode ?? '—' }}
                <span class="alarm-list-item__time">{{ alarm.triggerTime?.slice(0, 16) ?? '—' }}</span>
              </div>
            </div>
            <span class="badge-screen" :class="badgeClass(alarm.alarmLevel)">{{ alarm.alarmLevel }}</span>
          </div>

          <!-- 空状态 -->
          <div v-if="filteredAlarms.length === 0" class="alarm-list-empty">
            <span style="color: var(--screen-text-muted)">暂无告警数据</span>
          </div>
        </div>

        <!-- 告警统计 -->
        <div class="alarm-stat-footer tabular-nums">
          <span>待确认 <strong style="color: var(--risk-red)">{{ pendingCount }}</strong></span>
          <span>橙色 <strong style="color: var(--risk-orange)">{{ orangeCount }}</strong></span>
          <span>已派单 <strong style="color: var(--screen-cyan)">{{ dispatchedCount }}</strong></span>
        </div>
      </section>

      <!-- ========== 中：告警详情 ========== -->
      <section class="alarm-dispatch-panel screen-glass-card" data-zone="alarm-detail">
        <div class="screen-section-title">
          <span class="screen-section-title__icon"></span>
          <span class="screen-section-title__text">告警详情</span>
        </div>

        <!-- 未选中提示 -->
        <div v-if="!selectedAlarm" class="alarm-detail-empty">
          <span style="color: var(--screen-text-muted); font-size: 13px;">请选择左侧告警查看详情</span>
        </div>

        <!-- 详情内容 -->
        <div v-else class="alarm-detail-content">
          <!-- 等级徽章 -->
          <div class="alarm-detail-level-row">
            <span
              class="badge-screen"
              :class="badgeClass(selectedAlarm.alarmLevel)"
              style="font-size: 14px; padding: 4px 12px"
            >
              {{ selectedAlarm.alarmLevel }} 级告警
            </span>
            <span class="alarm-detail-status">{{ selectedAlarm.status }}</span>
          </div>

          <!-- 字段列表 -->
          <dl class="alarm-detail-fields">
            <div class="alarm-detail-field">
              <dt>建筑编码</dt>
              <dd>{{ selectedAlarm.buildingCode ?? '—' }}</dd>
            </div>
            <div class="alarm-detail-field">
              <dt>建筑名称</dt>
              <dd>{{ selectedAlarm.buildingName ?? '—' }}</dd>
            </div>
            <div class="alarm-detail-field">
              <dt>告警类型</dt>
              <dd>{{ selectedAlarm.alarmType ?? '—' }}</dd>
            </div>
            <div class="alarm-detail-field">
              <dt>触发时间</dt>
              <dd class="tabular-nums">{{ selectedAlarm.triggerTime ?? '—' }}</dd>
            </div>
            <div class="alarm-detail-field">
              <dt>告警内容</dt>
              <dd>{{ selectedAlarm.alarmContent ?? '—' }}</dd>
            </div>
            <div class="alarm-detail-field">
              <dt>当前状态</dt>
              <dd>{{ selectedAlarm.status ?? '—' }}</dd>
            </div>
          </dl>
        </div>
      </section>

      <!-- ========== 右：派单操作 ========== -->
      <section class="alarm-dispatch-panel screen-glass-card" data-zone="dispatch-action">
        <div class="screen-section-title">
          <span class="screen-section-title__icon"></span>
          <span class="screen-section-title__text">派单操作</span>
        </div>

        <!-- 操作按钮区 -->
        <div class="dispatch-action-buttons">
          <button
            class="btn-screen-primary"
            :disabled="!canConfirmSelectedAlarm"
            @click="confirmAlarm"
          >
            确认告警
          </button>
          <button
            class="btn-screen-primary dispatch-btn-dispatch"
            :class="{ 'dispatch-btn-emergency': selectedAlarm?.alarmLevel === 'RED' }"
            :disabled="!canDispatchSelectedAlarm"
            @click="dispatchAlarm"
          >
            {{ selectedAlarm?.alarmLevel === 'RED' ? '大屏应急' : '自动派单' }}
          </button>
        </div>

        <div v-if="!selectedAlarm" class="dispatch-hint">
          <span style="color: var(--screen-text-muted); font-size: 12px;">选择告警后可操作</span>
        </div>

        <!-- 工单状态看板 -->
        <div class="screen-section-title" style="margin-top: 20px">
          <span class="screen-section-title__icon"></span>
          <span class="screen-section-title__text">当前工单状态</span>
        </div>
        <div class="dispatch-workorder-stats tabular-nums">
          <div class="dispatch-stat-item">
            <span class="board-icon board-icon--pending"><svg viewBox="0 0 24 24" fill="currentColor" width="18" height="18"><path d="M20 6h-8l-2-2H4c-1.1 0-2 .9-2 2v12c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V8c0-1.1-.9-2-2-2zm0 12H4V6h5.17l2 2H20v10z"/></svg></span>
            <span class="dispatch-stat-num" style="color: var(--wo-pending)">{{ woPendingCount }}</span>
            <span class="dispatch-stat-label">待接单</span>
          </div>
          <div class="dispatch-stat-item">
            <span class="board-icon board-icon--processing"><svg viewBox="0 0 24 24" fill="currentColor" width="18" height="18"><path d="M19.14 12.94c.04-.3.06-.61.06-.94 0-.32-.02-.64-.07-.94l2.03-1.58c.18-.14.23-.41.12-.61l-1.92-3.32c-.12-.22-.37-.29-.59-.22l-2.39.96c-.5-.38-1.03-.7-1.62-.94l-.36-2.54c-.04-.24-.24-.41-.48-.41h-3.84c-.24 0-.43.17-.47.41l-.36 2.54c-.59.24-1.13.57-1.62.94l-2.39-.96c-.22-.08-.47 0-.59.22L2.74 8.87c-.12.21-.08.47.12.61l2.03 1.58c-.05.3-.09.63-.09.94s.02.64.07.94l-2.03 1.58c-.18.14-.23.41-.12.61l1.92 3.32c.12.22.37.29.59.22l2.39-.96c.5.38 1.03.7 1.62.94l.36 2.54c.05.24.24.41.48.41h3.84c.24 0 .44-.17.47-.41l.36-2.54c.59-.24 1.13-.56 1.62-.94l2.39.96c.22.08.47 0 .59-.22l1.92-3.32c.12-.22.07-.47-.12-.61l-2.01-1.58zM12 15.6c-1.98 0-3.6-1.62-3.6-3.6s1.62-3.6 3.6-3.6 3.6 1.62 3.6 3.6-1.62 3.6-3.6 3.6z"/></svg></span>
            <span class="dispatch-stat-num" style="color: var(--wo-processing)">{{ woProcessingCount }}</span>
            <span class="dispatch-stat-label">处理中</span>
          </div>
          <div class="dispatch-stat-item">
            <span class="board-icon board-icon--checking"><svg viewBox="0 0 24 24" fill="currentColor" width="18" height="18"><path d="M15.5 14h-.79l-.28-.27A6.471 6.471 0 0 0 16 9.5 6.5 6.5 0 1 0 9.5 16c1.61 0 3.09-.59 4.23-1.57l.27.28v.79l5 4.99L20.49 19l-4.99-5zm-6 0C7.01 14 5 11.99 5 9.5S7.01 5 9.5 5 14 7.01 14 9.5 11.99 14 9.5 14z"/></svg></span>
            <span class="dispatch-stat-num" style="color: var(--wo-checking)">{{ woCheckingCount }}</span>
            <span class="dispatch-stat-label">待核查</span>
          </div>
          <div class="dispatch-stat-item">
            <span class="board-icon board-icon--finished"><svg viewBox="0 0 24 24" fill="currentColor" width="18" height="18"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z"/></svg></span>
            <span class="dispatch-stat-num" style="color: var(--wo-finished)">{{ woFinishedCount }}</span>
            <span class="dispatch-stat-label">已销号</span>
          </div>
        </div>

        <!-- 操作结果反馈 -->
        <div v-if="actionMsg" class="dispatch-result-msg">
          {{ actionMsg }}
        </div>
      </section>
    </main>
    <ScreenEmergencyFloatBtn />
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from "vue"
import ScreenEmergencyFloatBtn from "./ScreenEmergencyFloatBtn.vue"
import { useRouter } from "vue-router"
import {
  listAlarms,
  confirmAlarm as serviceConfirmAlarm,
  dispatchAlarm as serviceDispatchAlarm,
  type AlarmListItem,
} from "@/services/alarmService"
import { getTable } from "@/services/sqliteMirrorRepository"

// ── 响应式数据 ─────────────────────────────────────────────────────────────────

const alarms        = ref([] as AlarmListItem[])
const selectedAlarm = ref(null as AlarmListItem | null)
const activeFilter  = ref("ALL")
const actionMsg     = ref("")
const currentTime   = ref("")
const router        = useRouter()

// ── 筛选选项 ──────────────────────────────────────────────────────────────────

const filterOptions = [
  { label: "全部",   value: "ALL"    },
  { label: "待确认", value: "PENDING" },
  { label: "已确认", value: "CONFIRMED" },
  { label: "已派单", value: "DISPATCHED" },
]

// ── 计算属性 ──────────────────────────────────────────────────────────────────

const filteredAlarms = computed(() => {
  if (activeFilter.value === "ALL") return alarms.value
  return alarms.value.filter(a => a.status === activeFilter.value)
})

const confirmedCount  = computed(() => alarms.value.filter(a => a.status === "CONFIRMED").length)
const activeCount     = computed(() => confirmedCount.value)
const pendingCount    = computed(() => alarms.value.filter(a => a.status === "PENDING").length)
const orangeCount     = computed(() => alarms.value.filter(a => a.alarmLevel === "ORANGE").length)
const dispatchedCount = computed(() => alarms.value.filter(a => a.status === "DISPATCHED").length)
const todayCount      = computed(() => alarms.value.filter(a => a.status === "CLOSED" || a.status === "DISPATCHED").length)
const canConfirmSelectedAlarm = computed(() => !!selectedAlarm.value && selectedAlarm.value.status === "PENDING")
const canDispatchSelectedAlarm = computed(() => !!selectedAlarm.value && selectedAlarm.value.status === "CONFIRMED")

// ── 工单统计 ──────────────────────────────────────────────────────────────────

const woOrders = computed(() => getTable<{ status: string }>("work_order"))
const woPendingCount    = computed(() => woOrders.value.filter(o => o.status === "PENDING").length)
const woProcessingCount = computed(() => woOrders.value.filter(o => o.status === "PROCESSING").length)
const woCheckingCount   = computed(() => woOrders.value.filter(o => o.status === "CHECKING").length)
const woFinishedCount   = computed(() => woOrders.value.filter(o => o.status === "FINISHED").length)

// ── 样式辅助 ──────────────────────────────────────────────────────────────────

function riskDotClass(level: string | null) {
  const map: Record<string, string> = {
    RED: "risk-dot--red", ORANGE: "risk-dot--orange",
    YELLOW: "risk-dot--yellow", GREEN: "risk-dot--green",
  }
  return map[level ?? ""] ?? "risk-dot--green"
}

function badgeClass(level: string | null) {
  const map: Record<string, string> = {
    RED: "badge-screen--red", ORANGE: "badge-screen--orange",
    YELLOW: "badge-screen--yellow", GREEN: "badge-screen--green",
  }
  return map[level ?? ""] ?? "badge-screen--green"
}

// ── 事件处理 ──────────────────────────────────────────────────────────────────

function selectAlarm(alarm: AlarmListItem) {
  selectedAlarm.value = alarm
  actionMsg.value = ""
}

function confirmAlarm() {
  if (!selectedAlarm.value) return
  const id = selectedAlarm.value.id
  const result = serviceConfirmAlarm(id)
  if (result.ok) {
    loadAlarms()
    actionMsg.value = `✓ 已确认告警 #${id}`
  } else {
    actionMsg.value = `✗ ${result.error}`
  }
  setTimeout(() => { actionMsg.value = "" }, 3000)
}

function dispatchAlarm() {
  if (!selectedAlarm.value) return
  const alarm = selectedAlarm.value
  // RED 级别告警走应急流程，不直接创建工单
  if (alarm.alarmLevel === "RED") {
    router.push("/screen/emergency")
    return
  }
  const result = serviceDispatchAlarm(alarm.id)
  if (result.ok) {
    loadAlarms()
    actionMsg.value = `✓ 已派单，工单号：${result.orderNo}`
  } else {
    actionMsg.value = `✗ ${result.error}`
  }
  setTimeout(() => { actionMsg.value = "" }, 4000)
}

// ── 数据加载 ──────────────────────────────────────────────────────────────────

function loadAlarms() {
  alarms.value = listAlarms()
  // 同步更新选中告警状态
  if (selectedAlarm.value) {
    const updated = alarms.value.find(a => a.id === selectedAlarm.value!.id)
    if (updated) selectedAlarm.value = updated
  }
}

function updateClock() {
  const now = new Date()
  currentTime.value = now.toLocaleTimeString("zh-CN", { hour12: false })
}

onMounted(() => {
  loadAlarms()
  updateClock()
  setInterval(updateClock, 1000)
})

// ── 根容器样式（适配大屏缩放） ─────────────────────────────────────────────────

const rootStyle = {
  background: "var(--screen-bg-base, #060D1F)",
  minHeight: "100vh",
  color: "var(--screen-text-body, rgba(255,255,255,0.75))",
}
</script>

<style scoped>
/* ===== 根容器 ===== */
.alarm-dispatch-root {
  display: flex;
  flex-direction: column;
  min-height: 100vh;
  background: var(--screen-bg-base, #060D1F);
  color: var(--screen-text-body, rgba(255,255,255,0.75));
  font-family: "PingFang SC", "Microsoft YaHei UI", sans-serif;
}

/* ===== 顶部标题栏 ===== */
.alarm-dispatch-header {
  height: 60px;
  flex-shrink: 0;
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0 24px;
  margin: 8px 8px 0;
  border-radius: var(--radius-lg, 12px);
  border: 1px solid var(--screen-border-glow, rgba(0,168,255,0.30));
  box-shadow: var(--screen-shadow-card, 0 0 0 1px rgba(0,168,255,0.20), 0 4px 24px rgba(0,0,0,0.40));
  backdrop-filter: blur(12px);
  background: rgba(8, 25, 60, 0.85);
}

.alarm-dispatch-header__left {
  display: flex;
  align-items: center;
  gap: 16px;
}

.alarm-dispatch-header__title {
  font-size: 18px;
  font-weight: 600;
  color: var(--screen-text-h1, #FFFFFF);
  letter-spacing: 0.05em;
  margin: 0;
}

.alarm-dispatch-back {
  font-size: 13px;
  text-decoration: none;
  padding: 6px 14px;
}

.alarm-dispatch-header__stats {
  display: flex;
  gap: 16px;
  align-items: center;
}

.alarm-dispatch-time {
  font-size: 14px;
  color: var(--screen-text-muted, rgba(255,255,255,0.45));
}

/* 告警统计胶囊 */
.alarm-stat {
  font-size: 12px;
  padding: 3px 10px;
  border-radius: var(--radius-full, 9999px);
}
.alarm-stat--red    { color: var(--risk-red, #FF4444);    background: var(--risk-red-alpha, rgba(255,68,68,0.15)); }
.alarm-stat--orange { color: var(--risk-orange, #FF8A3D); background: var(--risk-orange-alpha, rgba(255,138,61,0.15)); }
.alarm-stat--green  { color: var(--risk-green, #10B981);  background: var(--risk-green-alpha, rgba(16,185,129,0.12)); }

/* ===== 三列主区域 ===== */
.alarm-dispatch-main {
  flex: 1;
  display: grid;
  grid-template-columns: 300px 1fr 280px;
  gap: 8px;
  padding: 8px;
  overflow: hidden;
}

/* ===== 通用面板 ===== */
.alarm-dispatch-panel {
  display: flex;
  flex-direction: column;
  overflow: hidden;
  padding: 16px;
  border-radius: var(--radius-lg, 12px);
  border: 1px solid var(--screen-border-glow, rgba(0,168,255,0.30));
  box-shadow: var(--screen-shadow-card, 0 0 0 1px rgba(0,168,255,0.20), 0 4px 24px rgba(0,0,0,0.40));
  backdrop-filter: blur(12px);
  background: rgba(8, 25, 60, 0.85);
}

/* ===== 告警筛选按钮行 ===== */
.alarm-filter-row {
  display: flex;
  gap: 6px;
  flex-wrap: wrap;
  margin-bottom: 12px;
}

.alarm-filter-btn {
  padding: 4px 10px;
  font-size: 12px;
  border-radius: var(--radius-full, 9999px);
  border: 1px solid var(--screen-border-glow, rgba(0,168,255,0.30));
  background: transparent;
  color: var(--screen-text-muted, rgba(255,255,255,0.45));
  cursor: pointer;
  transition: all var(--duration-micro, 150ms) ease;
  white-space: nowrap;
}

.alarm-filter-btn:hover {
  border-color: var(--screen-cyan, #00D4FF);
  color: var(--screen-cyan, #00D4FF);
}

.alarm-filter-btn--active {
  background: rgba(0, 212, 255, 0.12);
  border-color: var(--screen-cyan, #00D4FF);
  color: var(--screen-cyan, #00D4FF);
}

/* ===== 告警列表滚动区 ===== */
.alarm-list-scroll {
  flex: 1;
  overflow-y: auto;
  overflow-x: hidden;
  scrollbar-width: thin;
  scrollbar-color: rgba(0,168,255,0.2) transparent;
}

/* 告警列表项 */
.alarm-list-item {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 10px 8px;
  border-bottom: 1px solid var(--screen-border-line, rgba(255,255,255,0.08));
  cursor: pointer;
  border-radius: var(--radius-md, 8px);
  transition: background var(--duration-micro, 150ms) ease;
}

.alarm-list-item:hover {
  background: rgba(0, 168, 255, 0.06);
}

.alarm-list-item--selected {
  background: rgba(27, 111, 232, 0.18);
  border-color: var(--screen-primary, #1B6FE8);
  box-shadow: inset 0 0 0 1px rgba(27,111,232,0.4);
}

.alarm-list-item__body {
  flex: 1;
  min-width: 0;
}

.alarm-list-item__title {
  font-size: 13px;
  color: var(--screen-text-body, rgba(255,255,255,0.75));
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.alarm-list-item__meta {
  display: flex;
  justify-content: space-between;
  font-size: 11px;
  color: var(--screen-text-muted, rgba(255,255,255,0.45));
  margin-top: 3px;
}

.alarm-list-item__time {
  font-size: 11px;
  color: var(--screen-text-muted, rgba(255,255,255,0.45));
}

/* 空状态 */
.alarm-list-empty {
  padding: 32px;
  text-align: center;
}

/* 底部统计 */
.alarm-stat-footer {
  display: flex;
  justify-content: space-around;
  padding: 10px 0 0;
  border-top: 1px solid var(--screen-border-line, rgba(255,255,255,0.08));
  font-size: 12px;
  color: var(--screen-text-muted, rgba(255,255,255,0.45));
  margin-top: 8px;
  flex-shrink: 0;
}

/* ===== 告警详情 ===== */
.alarm-detail-empty {
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
}

.alarm-detail-content {
  flex: 1;
  overflow-y: auto;
}

.alarm-detail-level-row {
  display: flex;
  align-items: center;
  gap: 10px;
  margin-bottom: 16px;
}

.alarm-detail-status {
  font-size: 12px;
  color: var(--screen-text-muted, rgba(255,255,255,0.45));
}

.alarm-detail-fields {
  margin: 0;
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.alarm-detail-field {
  display: grid;
  grid-template-columns: 80px 1fr;
  gap: 8px;
  font-size: 13px;
  padding-bottom: 8px;
  border-bottom: 1px solid var(--screen-border-line, rgba(255,255,255,0.06));
}

.alarm-detail-field dt {
  color: var(--screen-text-muted, rgba(255,255,255,0.45));
  font-weight: 400;
}

.alarm-detail-field dd {
  margin: 0;
  color: var(--screen-text-body, rgba(255,255,255,0.75));
  word-break: break-all;
}

/* ===== 派单操作 ===== */
.dispatch-action-buttons {
  display: flex;
  flex-direction: column;
  gap: 10px;
  margin-bottom: 16px;
}

.dispatch-btn-dispatch {
  background: linear-gradient(135deg, #1B6FE8, var(--risk-orange, #FF8A3D)) !important;
  border-color: rgba(255, 138, 61, 0.5) !important;
}

/* RED 告警时"大屏应急"按钮：红色高亮 */
.dispatch-btn-emergency {
  background: linear-gradient(135deg, #C0392B, #E74C3C) !important;
  border-color: rgba(231, 76, 60, 0.8) !important;
  animation: pulse-red 1.5s ease-in-out infinite;
}
@keyframes pulse-red {
  0%, 100% { box-shadow: 0 0 8px rgba(231,76,60,0.5); }
  50%       { box-shadow: 0 0 18px rgba(231,76,60,0.9); }
}

.dispatch-hint {
  text-align: center;
  padding: 8px;
}

.dispatch-workorder-stats {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 12px;
}

.dispatch-stat-item {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 4px;
  padding: 12px;
  background: rgba(0, 0, 0, 0.2);
  border-radius: var(--radius-md, 8px);
  border: 1px solid var(--screen-border-line, rgba(255,255,255,0.08));
}

.dispatch-stat-num {
  font-size: 28px;
  font-weight: 700;
  line-height: 1.0;
}

.dispatch-stat-label {
  font-size: 12px;
  color: var(--screen-text-muted, rgba(255,255,255,0.45));
}

.dispatch-result-msg {
  margin-top: 16px;
  padding: 10px 14px;
  background: rgba(16, 185, 129, 0.12);
  border: 1px solid rgba(16, 185, 129, 0.4);
  border-radius: var(--radius-md, 8px);
  font-size: 13px;
  color: var(--risk-green, #10B981);
}

/* ===== 参考图风格覆盖 ===== */
.alarm-dispatch-root {
  width: 100vw;
  height: 100vh;
  min-height: 100vh;
  overflow: hidden;
  background: #020D1F !important;
}
/* 与首页完全一致：去掉 screen-bg 的蓝色渐变和光晔 */
.alarm-dispatch-root::before {
  background:
    linear-gradient(rgba(0, 180, 255, 0.04) 1px, transparent 1px),
    linear-gradient(90deg, rgba(0, 180, 255, 0.04) 1px, transparent 1px) !important;
  background-size: 48px 48px, 48px 48px !important;
  mask-image: none !important;
  opacity: 1 !important;
}
.alarm-dispatch-root::after { display: none !important; }

.alarm-dispatch-header {
  margin: 10px 12px 0;
  padding: 0 22px;
  border-color: rgba(44, 166, 255, 0.7);
  background:
    linear-gradient(180deg, rgba(6, 38, 91, 0.96), rgba(4, 23, 58, 0.88)),
    radial-gradient(circle at 50% 100%, rgba(0, 212, 255, 0.22), transparent 52%);
  box-shadow: 0 0 30px rgba(0, 132, 255, 0.28), inset 0 1px 0 rgba(156, 210, 255, 0.22);
}

.alarm-dispatch-main {
  grid-template-columns: 340px minmax(0, 1fr) 340px;
  gap: 12px;
  padding: 12px;
}

.alarm-dispatch-panel {
  padding: 18px;
  border-color: rgba(44, 166, 255, 0.64);
  background:
    linear-gradient(180deg, rgba(7, 42, 98, 0.9), rgba(4, 22, 55, 0.8)),
    radial-gradient(circle at 50% 0%, rgba(0, 212, 255, 0.12), transparent 62%);
  box-shadow: 0 0 28px rgba(0, 132, 255, 0.24), inset 0 0 28px rgba(16, 92, 190, 0.16);
}

.alarm-dispatch-header__stats {
  gap: 12px;
}

.alarm-stat--red::before { background: var(--risk-red, #FF4444); box-shadow: 0 0 12px var(--risk-red, #FF4444); }
.alarm-stat--orange::before { background: var(--risk-orange, #FF8A3D); box-shadow: 0 0 12px var(--risk-orange, #FF8A3D); }
.alarm-stat--green::before { background: var(--risk-green, #10B981); box-shadow: 0 0 12px var(--risk-green, #10B981); }

.alarm-list-item {
  margin-bottom: 8px;
  border: 1px solid rgba(0, 145, 255, 0.18);
  background: linear-gradient(180deg, rgba(8, 45, 102, 0.68), rgba(4, 24, 62, 0.56));
}

.alarm-list-item--selected {
  border-color: rgba(56, 232, 255, 0.7);
  box-shadow: 0 0 18px rgba(0, 212, 255, 0.24), inset 0 0 18px rgba(0, 212, 255, 0.12);
}

.dispatch-action-buttons .btn-screen-primary {
  height: 42px;
  border-radius: 999px;
  font-weight: 800;
}
</style>

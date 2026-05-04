<template>
  <!--
    T15.98 大屏工单看板 /screen/work-orders
    ─────────────────────────────────────────────────────────────
    低保真线框（Wireframe）：
    ┌──────────── 顶部标题栏（screen-header）────────────────────┐
    │  ← 返回大屏首页    工单看板中心            时间   工单统计  │
    ├──────────────────────────────────────────────────────────── ┤
    │                 ┌── zone:board ─────────────────────────┐   │
    │                 │  待接单(N) │ 处理中(N) │待核查(N) │已销号(N)│
    │                 └────────────────────────────────────────┘   │
    │  zone:workorder-list                                         │
    │  ┌── 工单卡片 ────────────────────────────────────────── ┐   │
    │  │  WO-001  [PENDING]  [逾期] 建筑名称  告警: ORANGE     │   │
    │  └──────────────────────────────────────────────────────  ┘   │
    │  ...                                                         │
    └──────────────────────────────────────────────────────────────┘
    业务数据：work_order 表（selectWorkOrderBoard + 工单列表）
    UI 规范：大屏深色科技主题 + screen-glass-card
  -->
  <div class="screen-root screen-bg screen-workorders">
    <!-- ===== 顶部标题栏 ===== -->
    <header class="screen-header screen-page-header screen-workorders__header">
      <div class="screen-header__left screen-page-header__left">
        <router-link to="/screen/home" class="btn-screen-secondary screen-back-btn">
          ← 返回大屏
        </router-link>
        <div class="screen-page-title-group">
          <span class="screen-page-kicker">WORK ORDER COMMAND</span>
          <h1 class="screen-header__title screen-page-title">工单看板中心</h1>
        </div>
      </div>
      <div class="screen-workorders__stats tabular-nums">
        <span class="screen-wo-stat screen-metric-pill">
          待接单 <strong style="color:var(--wo-pending,#F59E0B)">{{ board.pending }}</strong>
        </span>
        <span class="screen-wo-stat screen-metric-pill">
          处理中 <strong style="color:var(--wo-processing,#3B82F6)">{{ board.processing }}</strong>
        </span>
        <span class="screen-wo-stat screen-metric-pill">
          待核查 <strong style="color:var(--wo-checking,#8B5CF6)">{{ board.checking }}</strong>
        </span>
        <span class="screen-wo-stat screen-metric-pill">
          已销号 <strong style="color:var(--wo-finished,#10B981)">{{ board.finished }}</strong>
        </span>
      </div>
      <div class="screen-header__right screen-page-header__right">
        <span class="screen-workorders__time screen-page-time tabular-nums">{{ currentTime }}</span>
      </div>
    </header>

    <!-- ===== 主内容区 ===== -->
    <main class="screen-workorders__main">

      <!-- zone:board — 看板统计卡片 -->
      <section class="screen-workorders__board screen-glass-card" data-zone="board">
        <div class="screen-section-title">
          <span class="screen-section-title__bar" />
          工单状态总览
          <span class="screen-section-badge tabular-nums">共 {{ board.total }} 单</span>
        </div>
        <div class="screen-board-row">
          <div class="screen-board-card screen-board-card--pending">
            <span class="board-icon board-icon--pending"><svg viewBox="0 0 24 24" fill="currentColor" width="18" height="18"><path d="M20 6h-8l-2-2H4c-1.1 0-2 .9-2 2v12c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V8c0-1.1-.9-2-2-2zm0 12H4V6h5.17l2 2H20v10z"/></svg></span>
            <span class="screen-board-card__count tabular-nums">{{ board.pending }}</span>
            <span class="screen-board-card__label">待接单</span>
            <span class="screen-board-card__status">PENDING</span>
          </div>
          <div class="screen-board-card screen-board-card--processing">
            <span class="board-icon board-icon--processing"><svg viewBox="0 0 24 24" fill="currentColor" width="18" height="18"><path d="M19.14 12.94c.04-.3.06-.61.06-.94 0-.32-.02-.64-.07-.94l2.03-1.58c.18-.14.23-.41.12-.61l-1.92-3.32c-.12-.22-.37-.29-.59-.22l-2.39.96c-.5-.38-1.03-.7-1.62-.94l-.36-2.54c-.04-.24-.24-.41-.48-.41h-3.84c-.24 0-.43.17-.47.41l-.36 2.54c-.59.24-1.13.57-1.62.94l-2.39-.96c-.22-.08-.47 0-.59.22L2.74 8.87c-.12.21-.08.47.12.61l2.03 1.58c-.05.3-.09.63-.09.94s.02.64.07.94l-2.03 1.58c-.18.14-.23.41-.12.61l1.92 3.32c.12.22.37.29.59.22l2.39-.96c.5.38 1.03.7 1.62.94l.36 2.54c.05.24.24.41.48.41h3.84c.24 0 .44-.17.47-.41l.36-2.54c.59-.24 1.13-.56 1.62-.94l2.39.96c.22.08.47 0 .59-.22l1.92-3.32c.12-.22.07-.47-.12-.61l-2.01-1.58zM12 15.6c-1.98 0-3.6-1.62-3.6-3.6s1.62-3.6 3.6-3.6 3.6 1.62 3.6 3.6-1.62 3.6-3.6 3.6z"/></svg></span>
            <span class="screen-board-card__count tabular-nums">{{ board.processing }}</span>
            <span class="screen-board-card__label">处理中</span>
            <span class="screen-board-card__status">PROCESSING</span>
          </div>
          <div class="screen-board-card screen-board-card--checking">
            <span class="board-icon board-icon--checking"><svg viewBox="0 0 24 24" fill="currentColor" width="18" height="18"><path d="M15.5 14h-.79l-.28-.27A6.471 6.471 0 0 0 16 9.5 6.5 6.5 0 1 0 9.5 16c1.61 0 3.09-.59 4.23-1.57l.27.28v.79l5 4.99L20.49 19l-4.99-5zm-6 0C7.01 14 5 11.99 5 9.5S7.01 5 9.5 5 14 7.01 14 9.5 11.99 14 9.5 14z"/></svg></span>
            <span class="screen-board-card__count tabular-nums">{{ board.checking }}</span>
            <span class="screen-board-card__label">待核查</span>
            <span class="screen-board-card__status">CHECKING</span>
          </div>
          <div class="screen-board-card screen-board-card--finished">
            <span class="board-icon board-icon--finished"><svg viewBox="0 0 24 24" fill="currentColor" width="18" height="18"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z"/></svg></span>
            <span class="screen-board-card__count tabular-nums">{{ board.finished }}</span>
            <span class="screen-board-card__label">已销号</span>
            <span class="screen-board-card__status">FINISHED</span>
          </div>
        </div>
        <div v-if="board.overdueCount > 0" class="screen-board-overdue tabular-nums">
          <span class="risk-dot risk-dot--red" />
          逾期工单 <strong style="color:var(--risk-red,#FF4444)">{{ board.overdueCount }}</strong> 条，请及时督办
        </div>
      </section>

      <!-- zone:workorder-list — 工单列表 -->
      <section class="screen-workorders__list-panel screen-glass-card" data-zone="workorder-list">
        <div class="screen-section-title">
          <span class="screen-section-title__bar" />
          工单列表
          <span class="screen-section-badge tabular-nums">{{ orders.length }} 条</span>
        </div>

        <!-- 筛选按钮 -->
        <div class="screen-wo-filters">
          <button
            v-for="f in filterOptions"
            :key="f.value"
            class="screen-wo-filter-btn"
            :class="{ 'screen-wo-filter-btn--active': activeFilter === f.value }"
            @click="activeFilter = f.value"
          >
            {{ f.label }}
          </button>
        </div>

        <!-- 工单列表 -->
        <div class="screen-wo-list-scroll">
          <div
            v-for="item in filteredOrders"
            :key="item.id"
            class="screen-wo-item"
            :class="`screen-wo-item--${(item.alarmLevel ?? 'normal').toLowerCase()}`"
          >
            <div class="screen-wo-item__left">
              <span class="risk-dot" :class="riskDotClass(item.alarmLevel)" />
            </div>
            <div class="screen-wo-item__body">
              <div class="screen-wo-item__no tabular-nums">{{ item.orderNo }}</div>
              <div class="screen-wo-item__building">
                {{ item.buildingName ?? `建筑 #${item.buildingId}` }}
              </div>
              <div class="screen-wo-item__alarm">
                {{ item.alarmTitle ?? item.alarmId ?? '—' }}
              </div>
            </div>
            <div class="screen-wo-item__right">
              <span class="badge-screen" :class="statusBadgeClass(item.status)">
                {{ STATUS_LABEL[item.status] ?? item.status }}
              </span>
              <span v-if="isOverdue(item.dispatchTime)" class="badge-screen badge-screen--red screen-wo-item__overdue">
                逾期
              </span>
            </div>
          </div>
          <div v-if="filteredOrders.length === 0" class="screen-wo-empty">
            暂无工单数据，请先初始化演示数据
          </div>
        </div>
      </section>
    </main>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from "vue"
import { getTable } from "@/services/sqliteMirrorRepository"
import { selectWorkOrderBoard, type WorkOrderBoard } from "@/services/screenKpiService"

// ── 工单状态标签 ──────────────────────────────────────────────────────────────
const STATUS_LABEL: Record<string, string> = {
  PENDING:    "待接单",
  PROCESSING: "处理中",
  CHECKING:   "待核查",
  FINISHED:   "已销号",
  CLOSED:     "已关闭",
}

// ── 筛选选项 ──────────────────────────────────────────────────────────────────
const filterOptions = [
  { label: "全部",   value: "ALL" },
  { label: "待接单", value: "PENDING" },
  { label: "处理中", value: "PROCESSING" },
  { label: "待核查", value: "CHECKING" },
  { label: "已销号", value: "FINISHED" },
]

// ── 工单数据接口 ──────────────────────────────────────────────────────────────
interface WorkOrderRow {
  id:             number
  order_no:       string
  status:         string
  order_level:    string | null
  alarm_level:    string | null
  building_id:    number | null
  alarm_id:       string | null
  alarm_title:    string | null
  dispatch_time:  string | null
}

interface WorkOrderDisplay {
  id:           number
  orderNo:      string
  status:       string
  orderLevel:   string | null
  alarmLevel:   string | null
  buildingId:   number | null
  buildingName: string | null
  alarmId:      string | null
  alarmTitle:   string | null
  dispatchTime: string | null
}

// ── 响应式状态 ─────────────────────────────────────────────────────────────────
const board       = ref<WorkOrderBoard>({ pending: 0, processing: 0, checking: 0, finished: 0, total: 0, overdueCount: 0 })
const orders      = ref<WorkOrderDisplay[]>([])
const activeFilter = ref("ALL")
const currentTime = ref("")

// ── 计算属性 ──────────────────────────────────────────────────────────────────
const filteredOrders = computed(() => {
  if (activeFilter.value === "ALL") return orders.value
  return orders.value.filter(o => o.status === activeFilter.value)
})

// ── 辅助函数 ──────────────────────────────────────────────────────────────────
function riskDotClass(level: string | null): string {
  const map: Record<string, string> = {
    RED: "risk-dot--red", ORANGE: "risk-dot--orange",
    YELLOW: "risk-dot--yellow", GREEN: "risk-dot--green",
  }
  return map[level ?? ""] ?? "risk-dot--green"
}

function statusBadgeClass(status: string): string {
  const map: Record<string, string> = {
    PENDING:    "badge-screen--orange",
    PROCESSING: "badge-screen--yellow",
    CHECKING:   "badge-screen--yellow",
    FINISHED:   "badge-screen--green",
    CLOSED:     "badge-screen--green",
  }
  return map[status] ?? "badge-screen--green"
}

function isOverdue(dispatchTime: string | null): boolean {
  if (!dispatchTime) return false
  return Date.now() - Date.parse(dispatchTime.replace(" ", "T")) > 2 * 60 * 60 * 1000
}

function formatTime(d: Date): string {
  const pad = (n: number) => String(n).padStart(2, "0")
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())} ${pad(d.getHours())}:${pad(d.getMinutes())}:${pad(d.getSeconds())}`
}

// ── 数据加载 ──────────────────────────────────────────────────────────────────
function loadData() {
  board.value = selectWorkOrderBoard()
  currentTime.value = formatTime(new Date())

  const rows = getTable<WorkOrderRow>("work_order")
  const spaces = getTable<{ id: number; name: string }>("iot_space")
  const spaceMap = new Map(spaces.map(s => [s.id, s.name]))
  const alarms = getTable<{ alarm_id: string; alarm_title: string | null }>("alarm_record")
  const alarmMap = new Map(alarms.map(a => [a.alarm_id, a.alarm_title ?? null]))

  orders.value = rows
    .filter(o => o.status !== "CLOSED")
    .sort((a, b) => {
      const LEVEL_ORDER: Record<string, number> = { PENDING: 4, PROCESSING: 3, CHECKING: 2, FINISHED: 1 }
      return (LEVEL_ORDER[b.status] ?? 0) - (LEVEL_ORDER[a.status] ?? 0)
    })
    .map(o => ({
      id:           o.id,
      orderNo:      o.order_no,
      status:       o.status,
      orderLevel:   o.order_level   ?? null,
      alarmLevel:   o.alarm_level   ?? null,
      buildingId:   o.building_id   ?? null,
      buildingName: o.building_id != null ? (spaceMap.get(o.building_id) ?? null) : null,
      alarmId:      o.alarm_id      ?? null,
      alarmTitle:   o.alarm_id ? (alarmMap.get(o.alarm_id) ?? null) : null,
      dispatchTime: o.dispatch_time ?? null,
    }))
}

onMounted(() => {
  loadData()
  setInterval(loadData, 30_000)
})
</script>

<style scoped>
/* ===== 根容器 ===== */
.screen-workorders {
  display: flex;
  flex-direction: column;
  min-height: 100vh;
  background: var(--screen-bg-base, #060D1F);
  color: var(--screen-text-body, rgba(255,255,255,0.75));
  font-family: "PingFang SC","Microsoft YaHei UI",sans-serif;
}

/* ===== 顶部标题栏 ===== */
.screen-workorders__header {
  height: 60px;
  flex-shrink: 0;
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0 24px;
  background: linear-gradient(180deg, rgba(8,25,60,0.95) 0%, rgba(6,13,31,0.80) 100%);
  border-bottom: 1px solid var(--screen-border-glow, rgba(0,168,255,0.30));
}

.screen-header__left {
  display: flex;
  align-items: center;
  gap: 16px;
}

.screen-header__title {
  font-size: 18px;
  font-weight: 600;
  color: var(--screen-text-h1, #fff);
  margin: 0;
}

.screen-back-btn {
  font-size: 13px;
  color: var(--screen-cyan, #00D4FF);
  text-decoration: none;
  padding: 4px 12px;
  border: 1px solid var(--screen-cyan, #00D4FF);
  border-radius: 4px;
}

.screen-workorders__stats {
  display: flex;
  gap: 24px;
  font-size: 13px;
}

.screen-wo-stat {
  color: var(--screen-text-muted, rgba(255,255,255,0.5));
}

.screen-workorders__time {
  font-size: 13px;
  color: var(--screen-text-muted, rgba(255,255,255,0.5));
}

/* ===== 主内容区 ===== */
.screen-workorders__main {
  flex: 1;
  padding: 16px;
  display: flex;
  flex-direction: column;
  gap: 16px;
  overflow-y: auto;
}

/* ===== 看板区 ===== */
.screen-workorders__board {
  padding: 16px 20px;
  border-radius: var(--radius-lg, 12px);
  border: 1px solid var(--screen-border-glow, rgba(0,168,255,0.20));
  background: var(--screen-panel-bg, rgba(16,24,48,0.85));
  backdrop-filter: blur(10px);
}

.screen-section-title {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 14px;
  font-weight: 600;
  color: var(--screen-text-h1, #fff);
  margin-bottom: 16px;
}

.screen-section-title__bar {
  width: 3px;
  height: 14px;
  background: var(--screen-cyan, #00D4FF);
  border-radius: 2px;
}

.screen-section-badge {
  margin-left: auto;
  font-size: 12px;
  color: var(--screen-text-muted, rgba(255,255,255,0.5));
}

.screen-board-row {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 12px;
}

.screen-board-card {
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 16px 8px;
  border-radius: 8px;
  border: 1px solid rgba(255,255,255,0.08);
  background: rgba(255,255,255,0.03);
}

.screen-board-card--pending   { border-color: var(--wo-pending, #F59E0B); }
.screen-board-card--processing { border-color: var(--wo-processing, #3B82F6); }
.screen-board-card--checking  { border-color: var(--wo-checking, #8B5CF6); }
.screen-board-card--finished  { border-color: var(--wo-finished, #10B981); }

.screen-board-card__count {
  font-size: 28px;
  font-weight: 700;
  line-height: 1;
}

.screen-board-card--pending   .screen-board-card__count { color: var(--wo-pending, #F59E0B); }
.screen-board-card--processing .screen-board-card__count { color: var(--wo-processing, #3B82F6); }
.screen-board-card--checking  .screen-board-card__count { color: var(--wo-checking, #8B5CF6); }
.screen-board-card--finished  .screen-board-card__count { color: var(--wo-finished, #10B981); }

.screen-board-card__label {
  font-size: 13px;
  color: var(--screen-text-body, rgba(255,255,255,0.75));
  margin-top: 6px;
}

.screen-board-card__status {
  font-size: 10px;
  color: var(--screen-text-muted, rgba(255,255,255,0.4));
  margin-top: 2px;
}

.screen-board-overdue {
  margin-top: 12px;
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 13px;
  color: var(--screen-text-body, rgba(255,255,255,0.7));
}

/* ===== 工单列表 ===== */
.screen-workorders__list-panel {
  flex: 1;
  padding: 16px 20px;
  border-radius: var(--radius-lg, 12px);
  border: 1px solid var(--screen-border-glow, rgba(0,168,255,0.20));
  background: var(--screen-panel-bg, rgba(16,24,48,0.85));
  backdrop-filter: blur(10px);
}

.screen-wo-filters {
  display: flex;
  gap: 8px;
  margin-bottom: 16px;
  flex-wrap: wrap;
}

.screen-wo-filter-btn {
  padding: 4px 12px;
  font-size: 12px;
  border-radius: 4px;
  border: 1px solid rgba(255,255,255,0.15);
  background: rgba(255,255,255,0.05);
  color: var(--screen-text-muted, rgba(255,255,255,0.5));
  cursor: pointer;
  transition: all 0.2s;
}

.screen-wo-filter-btn--active {
  background: rgba(0,212,255,0.15);
  border-color: var(--screen-cyan, #00D4FF);
  color: var(--screen-cyan, #00D4FF);
}

.screen-wo-list-scroll {
  display: flex;
  flex-direction: column;
  gap: 8px;
  max-height: 60vh;
  overflow-y: auto;
}

.screen-wo-item {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 12px 14px;
  border-radius: 8px;
  border: 1px solid rgba(255,255,255,0.06);
  background: rgba(255,255,255,0.03);
}

.screen-wo-item--red    { border-left: 3px solid var(--risk-red, #FF4444); }
.screen-wo-item--orange { border-left: 3px solid var(--risk-orange, #FF6B00); }
.screen-wo-item--yellow { border-left: 3px solid var(--risk-yellow, #F59E0B); }
.screen-wo-item--green  { border-left: 3px solid var(--risk-green, #10B981); }

.screen-wo-item__body {
  flex: 1;
  min-width: 0;
}

.screen-wo-item__no {
  font-size: 11px;
  color: var(--screen-text-muted, rgba(255,255,255,0.4));
}

.screen-wo-item__building {
  font-size: 13px;
  font-weight: 500;
  color: var(--screen-text-h1, #fff);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.screen-wo-item__alarm {
  font-size: 12px;
  color: var(--screen-text-muted, rgba(255,255,255,0.5));
}

.screen-wo-item__right {
  display: flex;
  flex-direction: column;
  align-items: flex-end;
  gap: 4px;
}

.screen-wo-item__overdue {
  font-size: 10px;
}

.screen-wo-empty {
  text-align: center;
  padding: 40px;
  color: var(--screen-text-muted, rgba(255,255,255,0.4));
  font-size: 13px;
}

/* ===== 参考图风格覆盖 ===== */
.screen-workorders {
  width: 100vw;
  height: 100vh;
  min-height: 100vh;
  overflow: hidden;
  background: #020D1F !important;
}
/* 与首页完全一致：去掉 screen-bg 的蓝色渐变和光晔 */
.screen-workorders::before {
  background:
    linear-gradient(rgba(0, 180, 255, 0.04) 1px, transparent 1px),
    linear-gradient(90deg, rgba(0, 180, 255, 0.04) 1px, transparent 1px) !important;
  background-size: 48px 48px, 48px 48px !important;
  mask-image: none !important;
  opacity: 1 !important;
}
.screen-workorders::after { display: none !important; }

.screen-workorders__header {
  margin: 10px 12px 0;
  border-color: rgba(44, 166, 255, 0.7);
  background:
    linear-gradient(180deg, rgba(6, 38, 91, 0.96), rgba(4, 23, 58, 0.88)),
    radial-gradient(circle at 50% 100%, rgba(0, 212, 255, 0.22), transparent 52%);
  box-shadow: 0 0 30px rgba(0, 132, 255, 0.28), inset 0 1px 0 rgba(156, 210, 255, 0.22);
}

.screen-workorders__main {
  padding: 12px;
  gap: 12px;
  overflow: hidden;
}

.screen-workorders__board,
.screen-workorders__list-panel {
  border-color: rgba(44, 166, 255, 0.64);
  background:
    linear-gradient(180deg, rgba(7, 42, 98, 0.9), rgba(4, 22, 55, 0.8)),
    radial-gradient(circle at 50% 0%, rgba(0, 212, 255, 0.12), transparent 62%);
  box-shadow: 0 0 28px rgba(0, 132, 255, 0.24), inset 0 0 28px rgba(16, 92, 190, 0.16);
}

.screen-workorders__board {
  min-height: 188px;
}

.screen-board-row {
  gap: 14px;
}

.screen-board-card {
  min-height: 106px;
  justify-content: center;
}

.screen-board-card__count {
  font-size: 34px;
  text-shadow: 0 0 16px currentColor;
}

.screen-wo-list-scroll {
  max-height: none;
  flex: 1;
  padding-right: 4px;
}

.screen-wo-item {
  border-color: rgba(0, 145, 255, 0.2);
  background: linear-gradient(180deg, rgba(8, 45, 102, 0.68), rgba(4, 24, 62, 0.56));
}

.screen-wo-stat:nth-child(1)::before { background: var(--wo-pending, #F59E0B); box-shadow: 0 0 12px var(--wo-pending, #F59E0B); }
.screen-wo-stat:nth-child(2)::before { background: var(--wo-processing, #3B82F6); box-shadow: 0 0 12px var(--wo-processing, #3B82F6); }
.screen-wo-stat:nth-child(3)::before { background: var(--wo-checking, #8B5CF6); box-shadow: 0 0 12px var(--wo-checking, #8B5CF6); }
.screen-wo-stat:nth-child(4)::before { background: var(--wo-finished, #10B981); box-shadow: 0 0 12px var(--wo-finished, #10B981); }
</style>

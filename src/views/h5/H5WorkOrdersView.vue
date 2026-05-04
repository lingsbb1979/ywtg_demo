<template>
  <!--
    T15.75 H5 待办工单第一版低保真布局定型（wireframe）：/h5/work-orders 版面关系
    ┌─────────────── zone:header ───────────────────┐  ← sticky 顶部
    │  待办工单  ·  共 N 条  ·  [刷新]               │
    ├─────────────── zone:filter-tabs ──────────────┤
    │  全部 │ 待处理 │ 处理中                         │  ← 状态筛选标签
    ├─────────────── zone:workorder-list ───────────┤
    │  [card: 风险色边框 · 等级徽章 · 状态标签 · 编号]│
    │  │   建筑名称 · 告警描述                        │
    │  │   SLA: N 分钟前派单 [逾期标签]  [接单/处置]  │
    │  [card: ...]                                   │
    │  ...                                           │
    ├─────────────── zone:empty-state ──────────────┤
    │  📭 暂无待处理工单  重置演示数据               │  ← 无工单时显示
    └───────────────────────────────────────────────┘
    （底部 tabbar 由 H5Layout 提供，不在本视图中）
  -->
  <div class="h5-workorders">
    <!-- zone:header — sticky 顶部：工单数量 + 筛选入口 -->
    <div class="h5-workorders__header" data-zone="header">
      <span class="h5-workorders__title">待办工单</span>
      <span class="h5-workorders__count">共 {{ filteredList.length }} 条</span>
    </div>

    <!-- zone:emergency-banner — 大屏全部步骤已勾选完毕、等待 H5 外勤结案（单个事件直接跳转；多个事件展开选择列表）-->

    <!-- 单个事件 -->
    <div
      v-if="readyIncidents.length === 1"
      class="h5-emergency-banner"
      role="alert"
      @click="router.push(`/h5/emergency/${readyIncidents[0].id}`)"
    >
      <span class="h5-emergency-banner__icon">🚨</span>
      <div class="h5-emergency-banner__text">
        <span class="h5-emergency-banner__title">红色应急事件待结案</span>
        <span class="h5-emergency-banner__sub">{{ incidentBuilding(readyIncidents[0]) }} · {{ readyIncidents[0].incident_no }}</span>
      </div>
      <span class="h5-emergency-banner__arrow">进入结案 ›</span>
    </div>

    <!-- 多个事件：可选择列表 -->
    <div
      v-else-if="readyIncidents.length > 1"
      class="h5-emergency-banner h5-emergency-banner--multi"
      role="alert"
    >
      <span class="h5-emergency-banner__icon">🚨</span>
      <div class="h5-emergency-banner__text">
        <span class="h5-emergency-banner__title">共 {{ readyIncidents.length }} 个应急事件待结案，请选择：</span>
        <div class="h5-em-incident-list">
          <div
            v-for="inc in readyIncidents"
            :key="inc.id"
            class="h5-em-incident-item"
            @click.stop="router.push(`/h5/emergency/${inc.id}`)"
          >
            <span class="h5-em-incident-item__building">{{ incidentBuilding(inc) }}</span>
            <span class="h5-em-incident-item__no">· {{ inc.incident_no }}</span>
            <span class="h5-em-incident-item__arrow">进入结案 ›</span>
          </div>
        </div>
      </div>
    </div>

    <!-- zone:filter-tabs — 状态筛选标签（active 主色 var(--h5-primary, #1B6FE8)）-->
    <div class="h5-filter-tabs" data-zone="filter-tabs">
      <button class="h5-filter-tab" :class="{'h5-filter-tab--active':activeFilter==='ALL'}" @click="activeFilter='ALL'">全部</button>
      <button class="h5-filter-tab" :class="{'h5-filter-tab--active':activeFilter==='PENDING'}" @click="activeFilter='PENDING'">待处理</button>
      <button class="h5-filter-tab" :class="{'h5-filter-tab--active':activeFilter==='PROCESSING'}" @click="activeFilter='PROCESSING'">处理中</button>
      <button class="h5-filter-tab" :class="{'h5-filter-tab--active':activeFilter==='CHECKING'}" @click="activeFilter='CHECKING'">待核查</button>
      <button class="h5-filter-tab" :class="{'h5-filter-tab--active':activeFilter==='FINISHED'}" @click="activeFilter='FINISHED'">已完成</button>
    </div>

    <!-- zone:workorder-list — 工单卡片列表 -->
    <ul class="h5-workorder-list" data-testid="h5-workorder-list" data-zone="workorder-list">
      <li
        v-for="item in filteredList"
        :key="item.id"
        class="h5-wo-card"
        :class="`h5-wo-card--${(item.alarmLevel ?? item.orderLevel ?? 'normal').toLowerCase()}`"
        @click="onCardClick(item)"
      >
        <!-- 卡片顶部：风险等级标识 + 状态 + 工单号 -->
        <div class="h5-wo-card__top">
          <span class="h5-risk-level h5-risk-level--badge" :class="`h5-risk-level--${(item.alarmLevel ?? 'normal').toLowerCase()}`">
            {{ item.alarmLevel ?? '普通' }}
          </span>
          <span class="h5-wo-card__status" :class="`h5-wo-status--${item.status.toLowerCase()}`">
            {{ STATUS_LABEL[item.status] ?? item.status }}
          </span>
          <span class="h5-wo-card__order-no tabular-nums">{{ item.orderNo }}</span>
        </div>

        <!-- 卡片正文：建筑 + 告警描述 -->
        <div class="h5-wo-card__body">
          <div class="h5-wo-card__building">
            {{ item.buildingName ?? `建筑 #${item.buildingId}` }}
          </div>
          <div class="h5-wo-card__alarm">
            {{ item.alarmTitle ?? item.alarmId ?? '待处理告警' }}
          </div>
        </div>

        <!-- 底部：SLA 派单时间（h5-sla） + 处置入口 -->
        <div class="h5-wo-card__footer">
          <span class="h5-sla" :class="isOverdue(item.dispatchTime) ? 'h5-sla--overdue' : ''">
            <span class="h5-sla__icon">⏱</span>
            <span class="h5-sla__text">
              {{ item.dispatchTime ? formatDispatchTime(item.dispatchTime) : '暂未派单' }}
            </span>
            <span v-if="isOverdue(item.dispatchTime)" class="h5-sla__tag">逾期</span>
          </span>

          <!-- 处置效率区（h5-disposal-flow）T15.70 P1：H5 突出处置效率和现场证据 -->
          <div class="h5-disposal-flow">
            <!-- 接单按钮（h5-accept-btn） -->
            <button
              v-if="item.status === 'PENDING'"
              class="h5-accept-btn"
              data-testid="h5-accept-btn"
              @click="onAccept(item)"
            >
              接单
            </button>
            <button
              v-else-if="item.status === 'PROCESSING'"
              class="h5-accept-btn h5-accept-btn--processing"
              @click="onDispose(item)"
            >
              去处置
            </button>
            <span
              v-else-if="item.status === 'CHECKING'"
              class="h5-accept-btn h5-accept-btn--checking"
              style="cursor:default"
            >
              待核查
            </span>
            <span
              v-else-if="item.status === 'FINISHED' || item.status === 'CLOSED'"
              class="h5-accept-btn h5-accept-btn--finished"
              style="cursor:default"
            >
              已销号
            </span>

            <!-- 现场证据入口（h5-evidence-entry） -->
            <router-link
              v-if="item.status === 'PROCESSING'"
              class="h5-evidence-entry"
              :to="`/h5/work-orders/${item.id}`"
            >
              上传现场证据
            </router-link>
          </div>
        </div>
      </li>

      <!-- 空状态（zone:empty-state）-->
      <li v-if="filteredList.length === 0" class="h5-workorder-list__empty" data-zone="empty-state">
        <span class="h5-empty-icon">📭</span>
        <p>暂无待处理工单</p>
        <p class="h5-empty-hint">请先触发演示场景或初始化数据</p>
      </li>
    </ul>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from "vue"
import { useRouter } from "vue-router"
import {
  selectH5TodoList,
  type H5TodoItem,
} from "@/services/screenKpiService"
import { getH5ReadyIncidents, type EmergencyIncident } from "@/services/emergencyService"
import { getTable } from "@/services/sqliteMirrorRepository"

const router   = useRouter()
const todoList = ref([] as H5TodoItem[])

// ── 就绪应急事件（大屏全部步骤已勾选→等待 H5 外勤结案）───────────────────────
const readyIncidents = ref<EmergencyIncident[]>([])

function incidentBuilding(inc: EmergencyIncident): string {
  const spaces = getTable<{ id: number; name: string }>("iot_space")
  const space = spaces.find((s) => Number(s.id) === Number(inc.building_id))
  return space?.name ?? `建筑 #${inc.building_id}`
}

/** 状态筛选 'ALL' | 'PENDING' | 'PROCESSING' | 'CHECKING' | 'FINISHED' */
const activeFilter = ref('ALL')

const STATUS_LABEL: Record<string, string> = {
  PENDING:    "待处理",
  PROCESSING: "处理中",
  CHECKING:   "待核查",
  FINISHED:   "已销号",
  CLOSED:     "已销号",
}

/** 筛选后的工单列表 */
const filteredList = computed(() => {
  if (activeFilter.value === 'ALL') return todoList.value
  if (activeFilter.value === 'FINISHED') {
    return todoList.value.filter(item => item.status === 'FINISHED' || item.status === 'CLOSED')
  }
  return todoList.value.filter(item => item.status === activeFilter.value)
})

/** 状态筛选标签配置 */
const filterTabs = computed(() => [
  { label: '全部',   value: 'ALL',        count: todoList.value.length },
  { label: '待处理', value: 'PENDING',    count: todoList.value.filter(i => i.status === 'PENDING').length },
  { label: '处理中', value: 'PROCESSING', count: todoList.value.filter(i => i.status === 'PROCESSING').length },
  { label: '待核查', value: 'CHECKING',   count: todoList.value.filter(i => i.status === 'CHECKING').length },
])

function loadData() {
  // selectH5TodoList 只返回 PENDING+PROCESSING；CHECKING（待核查）工单单独补全
  const base = selectH5TodoList()
  const allOrders = getTable<{
    id: number; order_no: string; status: string
    order_level: string | null; alarm_level: string | null
    building_id: number | null; alarm_id: string | null
    dispatch_time: string | null; current_node: string | null
  }>("work_order")
  const spaces = getTable<{ id: number; name: string }>("iot_space")
  const alarms = getTable<{ alarm_id: string; alarm_title: string | null }>("alarm_record")
  const spaceMap = new Map(spaces.map(s => [s.id, s.name]))
  const alarmMap = new Map(alarms.map(a => [a.alarm_id, a.alarm_title ?? null]))
  const checkingIds = new Set(base.map(i => i.id))
  const checking: H5TodoItem[] = allOrders
    .filter(o => o.status === 'CHECKING' && !checkingIds.has(o.id))
    .map(o => ({
      id:           o.id,
      orderNo:      o.order_no,
      status:       o.status,
      orderLevel:   o.order_level,
      alarmLevel:   o.alarm_level,
      buildingId:   o.building_id,
      buildingName: o.building_id != null ? (spaceMap.get(o.building_id) ?? null) : null,
      alarmId:      o.alarm_id,
      alarmTitle:   o.alarm_id ? (alarmMap.get(o.alarm_id) ?? null) : null,
      dispatchTime: o.dispatch_time,
      currentNode:  o.current_node,
    }))
  todoList.value = [...base, ...checking]
  readyIncidents.value = getH5ReadyIncidents()
}

onMounted(loadData)

/** 格式化派单时间 → 显示相对时长 */
function formatDispatchTime(ts: string): string {
  const diff = Date.now() - Date.parse(ts.replace(" ", "T"))
  const mins = Math.floor(diff / 60000)
  if (mins < 60)  return `${mins} 分钟前派单`
  const hrs = Math.floor(mins / 60)
  if (hrs < 24)   return `${hrs} 小时前派单`
  return `${Math.floor(hrs / 24)} 天前派单`
}

/** SLA 默认 2 小时，超时则逾期 */
function isOverdue(ts: string | null): boolean {
  if (!ts) return false
  const diff = Date.now() - Date.parse(ts.replace(" ", "T"))
  return diff > 2 * 60 * 60 * 1000
}

function onAccept(item: H5TodoItem) {
  // 跳转到工单详情页，由详情页完成接单
  router.push(`/h5/work-orders/${item.id}`)
}

function onDispose(item: H5TodoItem) {
  router.push(`/h5/dispose/${item.id}`)
}

function onCardClick(item: H5TodoItem) {
  router.push(`/h5/work-orders/${item.id}`)
}
</script>

<style scoped>
.h5-workorders {
  background: var(--h5-bg-page, #F7F9FC);
  max-width: 414px;
  margin: 0 auto;
  padding-bottom: calc(var(--h5-tabbar-height, 56px) + 16px);
}

/* zone:emergency-banner — 活跃应急提醒横幅 */
.h5-emergency-banner {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 12px 16px;
  background: linear-gradient(90deg, #c0392b 0%, #e74c3c 100%);
  cursor: pointer;
  user-select: none;
  animation: em-pulse 2s ease-in-out infinite;
}
@keyframes em-pulse {
  0%, 100% { opacity: 1; }
  50%       { opacity: 0.88; }
}
.h5-emergency-banner__icon { font-size: 20px; flex-shrink: 0; }
.h5-emergency-banner__text {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 2px;
}
.h5-emergency-banner__title {
  font-size: 14px;
  font-weight: 700;
  color: #fff;
}
.h5-emergency-banner__sub {
  font-size: 12px;
  color: rgba(255,255,255,0.82);
}
.h5-emergency-banner__arrow {
  font-size: 13px;
  font-weight: 600;
  color: #fff;
  white-space: nowrap;
  flex-shrink: 0;
}

/* 多个事件横幅 — 展开列表 */
.h5-emergency-banner--multi { align-items: flex-start; cursor: default; }
.h5-em-incident-list {
  display: flex;
  flex-direction: column;
  gap: 6px;
  margin-top: 6px;
}
.h5-em-incident-item {
  display: flex;
  align-items: center;
  gap: 6px;
  background: rgba(0,0,0,0.18);
  border-radius: 6px;
  padding: 7px 10px;
  cursor: pointer;
  active { opacity: 0.8; }
}
.h5-em-incident-item:active { opacity: 0.78; }
.h5-em-incident-item__building { font-size: 13px; font-weight: 600; color: #fff; }
.h5-em-incident-item__no       { font-size: 12px; color: rgba(255,255,255,0.75); flex: 1; }
.h5-em-incident-item__arrow    { font-size: 13px; font-weight: 700; color: #fff; flex-shrink: 0; }

/* zone:header — sticky 顶部渐变横幅（移动端 banner 规范）*/
.h5-workorders__header {
  display: none; /* H5Layout 顶部已提供标题，内层 header 不再重复显示 */
}
.h5-workorders__title {
  font-size: 16px;
  font-weight: 600;
  color: #fff;
}
.h5-workorders__count {
  font-size: 13px;
  color: rgba(255,255,255,0.8);
}

/* ─────────────────────────────────────
/* ─────────────────────────────────────
   zone:filter-tabs — 状态筛选标签
   ───────────────────────────────────── */
.h5-filter-tabs {
  display: flex;
  background: var(--h5-bg-card, #fff);
  border-bottom: 1px solid var(--h5-border, #EEF2F7);
  position: sticky;
  top: 0;
  z-index: 9;
  overflow-x: auto;
  -webkit-overflow-scrolling: touch;
  scrollbar-width: none;
}
.h5-filter-tabs::-webkit-scrollbar { display: none; }
.h5-filter-tab {
  flex-shrink: 0;
  display: flex;
  align-items: center;
  gap: 4px;
  height: 40px;
  padding: 0 16px;
  font-size: 14px;
  color: var(--h5-text-muted, #94A3B8);
  background: none;
  border: none;
  border-bottom: 2px solid transparent;
  cursor: pointer;
  white-space: nowrap;
  min-height: var(--h5-touch-min, 44px);
  transition: color var(--duration-micro, 150ms) ease;
}
.h5-filter-tab--active {
  color: var(--h5-primary, #1B6FE8);
  border-bottom-color: var(--h5-primary, #1B6FE8);
  font-weight: 600;
}
.h5-filter-tab__count {
  font-size: 11px;
  min-width: 18px;
  height: 18px;
  padding: 0 4px;
  border-radius: var(--radius-full, 9999px);
  background: var(--h5-border, #EEF2F7);
  color: var(--h5-text-muted, #94A3B8);
  display: inline-flex;
  align-items: center;
  justify-content: center;
}
.h5-filter-tab--active .h5-filter-tab__count {
  background: rgba(27,111,232,0.1);
  color: var(--h5-primary, #1B6FE8);
}

/* ─────────────────────────────────────
   zone:workorder-list — 工单卡片列表
   ───────────────────────────────────── */
.h5-workorder-list {
  list-style: none;
  margin: 0;
  padding: 12px 16px;
  display: flex;
  flex-direction: column;
  gap: 10px;
}

/* 工单卡片（h5-wo-card） */
.h5-wo-card {
  background: var(--h5-bg-card, #fff);
  border-radius: var(--radius-lg, 12px);
  padding: 14px 16px;
  box-shadow: var(--h5-shadow-card, 0 2px 12px rgba(0,0,0,0.06));
  border-left: 4px solid var(--h5-border, #EEF2F7);
  border: 1px solid var(--h5-border, #EEF2F7);
  border-left-width: 4px;
  display: flex;
  flex-direction: column;
  gap: 10px;
  cursor: pointer;
  transition: box-shadow var(--duration-micro, 150ms) ease;
}
.h5-wo-card:active { box-shadow: var(--h5-shadow-card-hover, 0 4px 20px rgba(0,0,0,0.10)); }
/* 风险色边框 */
.h5-wo-card--red    { border-left-color: var(--risk-red,    #FF4444); }
.h5-wo-card--orange { border-left-color: var(--risk-orange, #FF8A3D); }
.h5-wo-card--yellow { border-left-color: var(--risk-yellow, #FFD700); }
.h5-wo-card--green  { border-left-color: var(--risk-green,  #10B981); }
.h5-wo-card--normal { border-left-color: #CBD5E1; }

/* 卡片顶部 */
.h5-wo-card__top {
  display: flex;
  align-items: center;
  gap: 6px;
}

/* 风险等级徽章（h5-risk-level） */
.h5-risk-level { display: inline-block; }
.h5-risk-level--badge {
  font-size: 11px;
  font-weight: 600;
  padding: 2px 8px;
  border-radius: var(--radius-full, 9999px);
  border: 1px solid;
}
.h5-risk-level--red    { color: var(--risk-red,    #FF4444); background: #FEE2E2; border-color: #FECACA; }
.h5-risk-level--orange { color: #C2410C;                     background: #FFEDD5; border-color: #FED7AA; }
.h5-risk-level--yellow { color: #92400E;                     background: #FEF3C7; border-color: #FDE68A; }
.h5-risk-level--green  { color: #065F46;                     background: #D1FAE5; border-color: #A7F3D0; }
.h5-risk-level--normal { color: #475569;                     background: #F1F5F9; border-color: #CBD5E1; }

/* 工单状态标签 */
.h5-wo-card__status {
  font-size: 11px;
  padding: 2px 8px;
  border-radius: var(--radius-full, 9999px);
}
.h5-wo-status--pending    { color: var(--wo-pending-text,    #92400E); background: var(--wo-pending-bg,    #FEF3C7); }
.h5-wo-status--processing { color: var(--wo-processing-text, #1D4ED8); background: var(--wo-processing-bg, #DBEAFE); }

/* 工单编号 */
.h5-wo-card__order-no {
  margin-left: auto;
  font-size: 11px;
  color: var(--h5-text-muted, #94A3B8);
  font-family: "SF Mono", monospace;
}

/* 卡片正文 */
.h5-wo-card__body { display: flex; flex-direction: column; gap: 4px; }
.h5-wo-card__building {
  font-size: 15px;
  font-weight: 600;
  color: var(--h5-text-h1, #1C2B4A);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}
.h5-wo-card__alarm {
  font-size: 13px;
  color: var(--h5-text-body, #4A5568);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

/* 底部：SLA + 接单按钮 */
.h5-wo-card__footer {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 8px;
}

/* SLA 时间（h5-sla） */
.h5-sla {
  display: flex;
  align-items: center;
  gap: 4px;
  font-size: 12px;
  color: var(--h5-text-muted, #94A3B8);
}
.h5-sla--overdue .h5-sla__text { color: var(--color-danger, #EF4444); font-weight: 500; }
.h5-sla__icon { font-size: 12px; }
.h5-sla__tag {
  font-size: 10px;
  padding: 1px 5px;
  border-radius: var(--radius-full, 9999px);
  background: #FEE2E2;
  color: #EF4444;
  border: 1px solid #FECACA;
}

/* 处置操作区 */
.h5-disposal-flow { display: flex; align-items: center; gap: 8px; flex-shrink: 0; }

/* 接单按钮（h5-accept-btn）—— 最小触控区域 44px */
.h5-accept-btn {
  min-height: var(--h5-touch-min, 44px);
  min-width: 80px;
  padding: 0 18px;
  border: none;
  border-radius: var(--radius-full, 9999px);
  background: var(--h5-primary, #1B6FE8);
  color: var(--h5-text-inverse, #fff);
  font-size: 14px;
  font-weight: 600;
  cursor: pointer;
  touch-action: manipulation;
  -webkit-tap-highlight-color: transparent;
  transition: opacity var(--duration-micro, 150ms) ease;
  display: flex;
  align-items: center;
  justify-content: center;
}
.h5-accept-btn:active { opacity: 0.75; }
.h5-accept-btn--processing {
  background: #F1F5F9;
  color: var(--h5-text-body, #4A5568);
  border: 1px solid var(--h5-border, #EEF2F7);
}
.h5-accept-btn--checking {
  background: rgba(245,158,11,0.08);
  color: #B45309;
  border: 1px solid rgba(245,158,11,0.3);
  font-size: 12px;
  padding: 6px 10px;
  border-radius: 6px;
  white-space: nowrap;
}
.h5-accept-btn--finished {
  background: rgba(16,185,129,0.08);
  color: #065F46;
  border: 1px solid rgba(16,185,129,0.3);
  font-size: 12px;
  padding: 6px 10px;
  border-radius: 6px;
  white-space: nowrap;
}

/* 证据入口 */
.h5-evidence-entry {
  font-size: 12px;
  color: var(--h5-primary, #1B6FE8);
  text-decoration: none;
  padding: 4px 0;
  white-space: nowrap;
}

/* ─────────────────────────────────────
   zone:empty-state — 空状态提示
   ───────────────────────────────────── */
.h5-workorder-list__empty {
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 48px 24px;
  gap: 8px;
  color: var(--h5-text-muted, #94A3B8);
}
.h5-empty-icon  { font-size: 48px; line-height: 1; }
.h5-workorder-list__empty p { font-size: 15px; color: var(--h5-text-h2, #2D3748); margin: 0; }
.h5-empty-hint  { font-size: 12px; color: var(--h5-text-muted, #94A3B8) !important; margin: 0; }

/* 工具 */
.tabular-nums { font-variant-numeric: tabular-nums; }

/* ===== 参考图风格覆盖：白蓝移动列表 ===== */
.h5-workorders {
  background:
    radial-gradient(circle at 50% -40px, rgba(42,114,255,0.18), transparent 220px),
    linear-gradient(180deg, #FFFFFF 0%, #F4F8FF 100%);
}
.h5-filter-tabs {
  margin: 10px 12px 0;
  padding: 8px;
  border: 1px solid #DDE9FB;
  border-radius: 14px;
  background: rgba(255,255,255,0.92);
  box-shadow: 0 10px 24px rgba(44,93,154,0.08);
  position: sticky;
  top: 8px;
}
.h5-filter-tab {
  height: 32px;
  min-height: 32px;
  padding: 0 13px;
  border-radius: 16px;
  border-bottom: 0;
  color: #5C7094;
  font-size: 13px;
  font-weight: 800;
}
.h5-filter-tab--active {
  color: #FFFFFF;
  background: linear-gradient(135deg, #1B6FE8, #4B96FF);
  border-bottom-color: transparent;
  box-shadow: 0 8px 16px rgba(27,111,232,0.20);
}
.h5-workorder-list { padding: 12px; gap: 12px; }
.h5-wo-card {
  border: 1px solid #DDE9FB;
  border-left-width: 5px;
  border-radius: 14px;
  box-shadow: 0 12px 28px rgba(44,93,154,0.10);
}
.h5-wo-card__building { color: #092D81; font-weight: 900; }
.h5-wo-card__alarm { color: #52698E; }
.h5-risk-level--badge,
.h5-wo-card__status { border-radius: 5px; font-weight: 800; }
.h5-accept-btn {
  min-height: 36px;
  min-width: 72px;
  border-radius: 18px;
  background: linear-gradient(135deg, #1B6FE8, #4B96FF);
  box-shadow: 0 8px 16px rgba(27,111,232,0.20);
}
.h5-accept-btn--processing,
.h5-accept-btn--checking,
.h5-accept-btn--finished { box-shadow: none; }
.h5-emergency-banner {
  margin: 12px 12px 0;
  border-radius: 14px;
  box-shadow: 0 12px 26px rgba(239,68,68,0.20);
}
</style>

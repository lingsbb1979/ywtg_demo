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
    <!-- zone:header — 顶部黏性标题栏（T15.75 低保真 / T15.76 高保真渐变）-->
    <div class="h5-wo-header" data-zone="header">
      <div class="h5-wo-header__main">
        <span class="h5-wo-header__title">待办工单</span>
        <span class="h5-wo-header__count tabular-nums">{{ filteredList.length }} 条</span>
      </div>
    </div>

    <!-- zone:filter-tabs — 状态筛选标签（全部 / 待处理 / 处理中）-->
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

const router   = useRouter()
const todoList = ref([] as H5TodoItem[])

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
])

function loadData() {
  todoList.value = selectH5TodoList()
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
  padding: 0 0 80px;
  background: var(--h5-bg-page, #F7F9FC);
  min-height: 100vh;
  max-width: 414px;
  margin: 0 auto;
  padding-bottom: calc(var(--h5-tabbar-height, 56px) + 16px);
}

/* ─────────────────────────────────────
   zone:header — 顶部黏性标题栏（T15.76 高保真：渐变蓝背景）
   ───────────────────────────────────── */
.h5-wo-header {
  position: sticky;
  top: 0;
  z-index: 10;
  display: flex;
  align-items: center;
  padding: 0 16px;
  height: var(--h5-header-height, 56px);
  background: linear-gradient(135deg, #0E3875 0%, #1B6FE8 100%);
  border-bottom: 1px solid var(--h5-border, #EEF2F7);
}
.h5-wo-header__main {
  display: flex;
  align-items: center;
  gap: 10px;
}
.h5-wo-header__title {
  font-size: 17px;
  font-weight: 600;
  color: var(--h5-text-inverse, #fff);
}
.h5-wo-header__count {
  font-size: 13px;
  color: rgba(255,255,255,0.7);
  background: rgba(255,255,255,0.15);
  padding: 2px 8px;
  border-radius: var(--radius-full, 9999px);
}

/* ─────────────────────────────────────
   zone:filter-tabs — 状态筛选标签
   ───────────────────────────────────── */
.h5-filter-tabs {
  display: flex;
  background: var(--h5-bg-card, #fff);
  border-bottom: 1px solid var(--h5-border, #EEF2F7);
  position: sticky;
  top: var(--h5-header-height, 56px);
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
</style>

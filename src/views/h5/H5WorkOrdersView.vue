<template>
  <div class="h5-workorders">
    <!-- 简易标题 -->
    <div class="h5-wo-header">
      <span class="h5-wo-header__title">待办工单</span>
      <span class="h5-wo-header__count tabular-nums">{{ todoList.length }} 条</span>
    </div>

    <!-- ① 工单列表（h5-workorder-list） -->
    <ul class="h5-workorder-list" data-testid="h5-workorder-list">
      <li
        v-for="item in todoList"
        :key="item.id"
        class="h5-wo-card"
        :class="`h5-wo-card--${(item.alarmLevel ?? item.orderLevel ?? 'normal').toLowerCase()}`"
      >
        <!-- 风险等级标识（h5-risk-level） -->
        <div class="h5-wo-card__top">
          <span class="h5-risk-level h5-risk-level--badge" :class="`h5-risk-level--${(item.alarmLevel ?? 'normal').toLowerCase()}`">
            {{ item.alarmLevel ?? '普通' }}
          </span>
          <span class="h5-wo-card__status" :class="`h5-wo-status--${item.status.toLowerCase()}`">
            {{ STATUS_LABEL[item.status] ?? item.status }}
          </span>
          <span class="h5-wo-card__order-no tabular-nums">{{ item.orderNo }}</span>
        </div>

        <div class="h5-wo-card__body">
          <div class="h5-wo-card__building">
            {{ item.buildingName ?? `建筑 #${item.buildingId}` }}
          </div>
          <div class="h5-wo-card__alarm">
            {{ item.alarmTitle ?? item.alarmId ?? '待处理告警' }}
          </div>
        </div>

        <!-- SLA 派单时间（h5-sla） -->
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

      <!-- 空状态 -->
      <li v-if="todoList.length === 0" class="h5-workorder-list__empty">
        <span class="h5-empty-icon">📭</span>
        <p>暂无待处理工单</p>
        <p class="h5-empty-hint">请先触发演示场景或初始化数据</p>
      </li>
    </ul>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from "vue"
import { useRouter } from "vue-router"
import {
  selectH5TodoList,
  type H5TodoItem,
} from "@/services/screenKpiService"

const router   = useRouter()
const todoList = ref<H5TodoItem[]>([])

const STATUS_LABEL: Record<string, string> = {
  PENDING:    "待处理",
  PROCESSING: "处理中",
}

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
</script>

<style scoped>
.h5-workorders {
  padding: 0 0 80px;
  background: var(--h5-bg-page, #F0F4F9);
  min-height: 100vh;
}

/* 标题栏 */
.h5-wo-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 14px 16px 10px;
  background: #fff;
  border-bottom: 1px solid #E2E8F0;
  position: sticky;
  top: 0;
  z-index: 5;
}
.h5-wo-header__title {
  font-size: 16px;
  font-weight: 700;
  color: #0F172A;
}
.h5-wo-header__count {
  font-size: 13px;
  color: #94A3B8;
}

/* ① 工单列表 */
.h5-workorder-list {
  list-style: none;
  margin: 0;
  padding: 8px 12px;
  display: flex;
  flex-direction: column;
  gap: 10px;
}

/* 工单卡片 */
.h5-wo-card {
  background: #fff;
  border-radius: 12px;
  padding: 12px 14px;
  box-shadow: 0 1px 6px rgba(0,0,0,0.06);
  border-left: 4px solid #E2E8F0;
  display: flex;
  flex-direction: column;
  gap: 8px;
}
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

/* 风险等级标识 */
.h5-risk-level {
  display: inline-block;
}
.h5-risk-level--badge {
  font-size: 11px;
  font-weight: 600;
  padding: 2px 7px;
  border-radius: 9999px;
  border: 1px solid;
}
.h5-risk-level--red    { color: var(--risk-red,    #FF4444); background: #FEE2E2; border-color: #FECACA; }
.h5-risk-level--orange { color: #C2410C;                     background: #FFEDD5; border-color: #FED7AA; }
.h5-risk-level--yellow { color: #92400E;                     background: #FEF3C7; border-color: #FDE68A; }
.h5-risk-level--green  { color: #065F46;                     background: #D1FAE5; border-color: #A7F3D0; }
.h5-risk-level--normal { color: #475569;                     background: #F1F5F9; border-color: #CBD5E1; }

/* 状态 */
.h5-wo-card__status {
  font-size: 11px;
  padding: 2px 7px;
  border-radius: 9999px;
}
.h5-wo-status--pending    { color: #92400E; background: #FEF3C7; }
.h5-wo-status--processing { color: #1D4ED8; background: #DBEAFE; }

/* 工单号 */
.h5-wo-card__order-no {
  margin-left: auto;
  font-size: 11px;
  color: #94A3B8;
}

/* 卡片正文 */
.h5-wo-card__body {
  display: flex;
  flex-direction: column;
  gap: 3px;
}
.h5-wo-card__building {
  font-size: 15px;
  font-weight: 600;
  color: #0F172A;
}
.h5-wo-card__alarm {
  font-size: 13px;
  color: #475569;
}

/* 底部：SLA + 接单按钮 */
.h5-wo-card__footer {
  display: flex;
  align-items: center;
  justify-content: space-between;
}

/* SLA 时间 */
.h5-sla {
  display: flex;
  align-items: center;
  gap: 4px;
  font-size: 12px;
  color: #64748B;
}
.h5-sla--overdue .h5-sla__text { color: var(--risk-red, #EF4444); }
.h5-sla__icon { font-size: 12px; }
.h5-sla__tag {
  font-size: 10px;
  padding: 1px 5px;
  border-radius: 9999px;
  background: #FEE2E2;
  color: #EF4444;
  border: 1px solid #FECACA;
}

/* 接单按钮 */
.h5-accept-btn {
  height: 36px;
  min-width: 72px;
  padding: 0 16px;
  border: none;
  border-radius: 9999px;
  background: var(--pc-primary, #1B6FE8);
  color: #fff;
  font-size: 14px;
  font-weight: 600;
  cursor: pointer;
  /* 44px 触控区域 */
  touch-action: manipulation;
  -webkit-tap-highlight-color: transparent;
  transition: background 150ms;
}
.h5-accept-btn:active { background: #1456C5; }
.h5-accept-btn--processing {
  background: #F1F5F9;
  color: #334155;
  border: 1px solid #CBD5E1;
}
.h5-accept-btn--processing:active { background: #E2E8F0; }

/* 空状态 */
.h5-workorder-list__empty {
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 48px 24px;
  gap: 8px;
  color: #94A3B8;
}
.h5-empty-icon  { font-size: 48px; }
.h5-empty-icon + p { font-size: 15px; color: #475569; margin: 0; }
.h5-empty-hint  { font-size: 12px; margin: 0; }

/* 工具 */
.tabular-nums { font-variant-numeric: tabular-nums; }
</style>

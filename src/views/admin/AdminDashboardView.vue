<template>
  <div class="admin-dashboard">
    <!-- 页面标题 -->
    <div class="admin-page-header">
      <h2 class="admin-page-title">工作台</h2>
      <span class="admin-page-subtitle">{{ currentDate }}</span>
    </div>

    <!-- ① KPI 指标卡片区 -->
    <div class="admin-kpi-row">
      <!-- 今日告警 -->
      <div class="admin-kpi-card admin-kpi-card--alarm" data-testid="admin-kpi-alarms">
        <div class="admin-kpi-card__header">
          <span class="admin-kpi-card__label">活跃告警</span>
          <span class="admin-kpi-card__icon admin-kpi-card__icon--alarm">⚠</span>
        </div>
        <div class="admin-kpi-card__value tabular-nums">{{ kpi.activeAlarms }}</div>
        <div class="admin-kpi-card__sub">开放隐患：{{ kpi.openHazards }} 处</div>
      </div>

      <!-- 待办工单 -->
      <div class="admin-kpi-card admin-kpi-card--workorder" data-testid="admin-kpi-workorders">
        <div class="admin-kpi-card__header">
          <span class="admin-kpi-card__label">待处理工单</span>
          <span class="admin-kpi-card__icon admin-kpi-card__icon--workorder">📋</span>
        </div>
        <div class="admin-kpi-card__value tabular-nums">{{ board.pending }}</div>
        <div class="admin-kpi-card__sub">处理中：{{ board.processing }} · 待核查：{{ board.checking }}</div>
      </div>

      <!-- 重点隐患 -->
      <div class="admin-kpi-card admin-kpi-card--hazard" data-testid="admin-kpi-hazards">
        <div class="admin-kpi-card__header">
          <span class="admin-kpi-card__label">重点隐患</span>
          <span class="admin-kpi-card__icon admin-kpi-card__icon--hazard">🏚</span>
        </div>
        <div class="admin-kpi-card__value tabular-nums">{{ kpi.openHazards }}</div>
        <div class="admin-kpi-card__sub">监测建筑：{{ kpi.totalBuildings }} 栋</div>
      </div>

      <!-- 工单闭环率 -->
      <div class="admin-kpi-card admin-kpi-card--rate">
        <div class="admin-kpi-card__header">
          <span class="admin-kpi-card__label">工单闭环率</span>
          <span class="admin-kpi-card__icon admin-kpi-card__icon--rate">✓</span>
        </div>
        <div class="admin-kpi-card__value tabular-nums admin-kpi-card__value--success">{{ kpi.closeRate }}%</div>
        <div class="admin-kpi-card__sub">已销号：{{ board.finished }} 条</div>
      </div>

      <!-- 逾期工单 -->
      <div class="admin-kpi-card" :class="board.overdueCount > 0 ? 'admin-kpi-card--overdue' : ''">
        <div class="admin-kpi-card__header">
          <span class="admin-kpi-card__label">逾期工单</span>
          <span class="admin-kpi-card__icon">⏰</span>
        </div>
        <div class="admin-kpi-card__value tabular-nums" :class="board.overdueCount > 0 ? 'admin-kpi-card__value--danger' : ''">
          {{ board.overdueCount }}
        </div>
        <div class="admin-kpi-card__sub">SLA：2小时</div>
      </div>
    </div>

    <!-- ② 主内容区：告警 + 演示控制 -->
    <div class="admin-dashboard-body">
      <!-- 近期告警列表 -->
      <div class="admin-card admin-card--full">
        <div class="admin-card__header">
          <span class="admin-card__title">最新活跃隐患</span>
          <router-link class="admin-card__more" to="/admin/alarms">查看全部 →</router-link>
        </div>
        <div class="admin-hazard-list">
          <div
            v-for="h in hazardList"
            :key="h.id"
            class="admin-hazard-item"
          >
            <span class="admin-hazard-item__dot" :class="`admin-risk-dot--${h.alarmLevel.toLowerCase()}`" />
            <div class="admin-hazard-item__info">
              <span class="admin-hazard-item__title">{{ h.alarmTitle ?? h.alarmId }}</span>
              <span class="admin-hazard-item__building">{{ h.buildingName ?? `建筑 #${h.buildingId}` }}</span>
            </div>
            <span class="admin-badge" :class="`admin-badge--${h.alarmLevel.toLowerCase()}`">
              {{ h.alarmLevel }}
            </span>
            <span class="admin-hazard-item__time">{{ h.triggerTime ?? '' }}</span>
          </div>
          <div v-if="hazardList.length === 0" class="admin-empty">暂无活跃隐患，系统状态正常</div>
        </div>
      </div>

      <!-- ③ 演示控制台入口（admin-demo-control） -->
      <div class="admin-card" data-testid="admin-demo-control">
        <div class="admin-card__header">
          <span class="admin-card__title">演示控制台</span>
        </div>
        <div class="admin-demo-control-list">
          <router-link class="admin-demo-btn" to="/admin/demo-console">
            <span class="admin-demo-btn__icon">⚙️</span>
            <div>
              <div class="admin-demo-btn__label">演示控制台</div>
              <div class="admin-demo-btn__desc">重置数据 · 触发场景 · 一键演示</div>
            </div>
          </router-link>
          <router-link class="admin-demo-btn" to="/screen/home">
            <span class="admin-demo-btn__icon">📺</span>
            <div>
              <div class="admin-demo-btn__label">打开大屏</div>
              <div class="admin-demo-btn__desc">全屏展示安全态势</div>
            </div>
          </router-link>
          <router-link class="admin-demo-btn" to="/h5/work-orders">
            <span class="admin-demo-btn__icon">📱</span>
            <div>
              <div class="admin-demo-btn__label">打开 H5</div>
              <div class="admin-demo-btn__desc">外勤处置移动端</div>
            </div>
          </router-link>
          <router-link class="admin-demo-btn" to="/admin/alarms">
            <span class="admin-demo-btn__icon">🚨</span>
            <div>
              <div class="admin-demo-btn__label">告警中心</div>
              <div class="admin-demo-btn__desc">确认告警 · 派单处置</div>
            </div>
          </router-link>
          <router-link class="admin-demo-btn" to="/admin/work-orders">
            <span class="admin-demo-btn__icon">📝</span>
            <div>
              <div class="admin-demo-btn__label">工单中心</div>
              <div class="admin-demo-btn__desc">核查工单 · 销号闭环</div>
            </div>
          </router-link>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from "vue"
import {
  selectScreenKpi,
  selectHazardList,
  selectWorkOrderBoard,
  type ScreenKpi,
  type HazardListItem,
  type WorkOrderBoard,
} from "@/services/screenKpiService"

const kpi         = ref<ScreenKpi>({ totalBuildings: 0, openHazards: 0, activeAlarms: 0, closeRate: 0 })
const board       = ref<WorkOrderBoard>({ pending: 0, processing: 0, checking: 0, finished: 0, total: 0, overdueCount: 0 })
const hazardList  = ref<HazardListItem[]>([])

function pad2(n: number) { return String(n).padStart(2, "0") }
const d = new Date()
const currentDate = `${d.getFullYear()}-${pad2(d.getMonth()+1)}-${pad2(d.getDate())}`

function loadData() {
  kpi.value       = selectScreenKpi()
  board.value     = selectWorkOrderBoard()
  hazardList.value = selectHazardList({ limit: 8 })
}

onMounted(loadData)
</script>

<style scoped>
.admin-dashboard {
  padding: 20px 24px;
  display: flex;
  flex-direction: column;
  gap: 20px;
  min-height: 100%;
  background: var(--pc-bg-page, #F0F4F9);
}

/* 页面标题 */
.admin-page-header {
  display: flex;
  align-items: baseline;
  gap: 12px;
}
.admin-page-title {
  font-size: 20px;
  font-weight: 700;
  color: var(--pc-text-title, #0F172A);
  margin: 0;
}
.admin-page-subtitle {
  font-size: 13px;
  color: var(--pc-text-muted, #94A3B8);
}

/* ① KPI 卡片行 */
.admin-kpi-row {
  display: grid;
  grid-template-columns: repeat(5, 1fr);
  gap: 12px;
}
.admin-kpi-card {
  background: var(--pc-bg-card, #fff);
  border: 1px solid var(--pc-border, #E2E8F0);
  border-radius: var(--radius-lg, 12px);
  padding: 16px;
  display: flex;
  flex-direction: column;
  gap: 6px;
  box-shadow: 0 1px 4px rgba(0,0,0,0.04);
  transition: box-shadow 150ms;
}
.admin-kpi-card:hover { box-shadow: 0 4px 12px rgba(0,0,0,0.08); }
.admin-kpi-card__header {
  display: flex;
  align-items: center;
  justify-content: space-between;
}
.admin-kpi-card__label {
  font-size: 13px;
  color: var(--pc-text-muted, #94A3B8);
}
.admin-kpi-card__icon { font-size: 18px; }
.admin-kpi-card__value {
  font-size: 32px;
  font-weight: 700;
  color: var(--pc-text-title, #0F172A);
  line-height: 1;
}
.admin-kpi-card__value--success { color: var(--color-success, #10B981); }
.admin-kpi-card__value--danger  { color: var(--color-danger,  #EF4444); }
.admin-kpi-card__sub {
  font-size: 12px;
  color: var(--pc-text-muted, #94A3B8);
}
.admin-kpi-card--alarm    { border-top: 3px solid var(--color-danger,  #EF4444); }
.admin-kpi-card--workorder{ border-top: 3px solid var(--wo-processing, #3B82F6); }
.admin-kpi-card--hazard   { border-top: 3px solid var(--risk-orange,   #FF8A3D); }
.admin-kpi-card--rate     { border-top: 3px solid var(--color-success, #10B981); }
.admin-kpi-card--overdue  { border-top: 3px solid var(--color-danger,  #EF4444); }

/* ② 主内容区 */
.admin-dashboard-body {
  display: grid;
  grid-template-columns: 1fr 320px;
  gap: 16px;
  align-items: start;
}
.admin-card {
  background: var(--pc-bg-card, #fff);
  border: 1px solid var(--pc-border, #E2E8F0);
  border-radius: var(--radius-lg, 12px);
  overflow: hidden;
  box-shadow: 0 1px 4px rgba(0,0,0,0.04);
}
.admin-card--full { grid-column: 1; }
.admin-card__header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 14px 16px;
  border-bottom: 1px solid var(--pc-border, #E2E8F0);
}
.admin-card__title {
  font-size: 14px;
  font-weight: 600;
  color: var(--pc-text-title, #0F172A);
}
.admin-card__more {
  font-size: 13px;
  color: var(--pc-primary, #1B6FE8);
  text-decoration: none;
}
.admin-card__more:hover { text-decoration: underline; }

/* 隐患列表 */
.admin-hazard-list {
  padding: 8px 0;
}
.admin-hazard-item {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 8px 16px;
  border-bottom: 1px solid var(--pc-border-light, #F1F5F9);
  transition: background 150ms;
}
.admin-hazard-item:hover { background: var(--pc-bg-hover, #F5F9FF); }
.admin-hazard-item:last-child { border-bottom: none; }
.admin-hazard-item__dot {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  flex-shrink: 0;
}
.admin-risk-dot--red    { background: var(--risk-red,    #FF4444); }
.admin-risk-dot--orange { background: var(--risk-orange, #FF8A3D); }
.admin-risk-dot--yellow { background: var(--risk-yellow, #FFD700); }
.admin-risk-dot--green  { background: var(--risk-green,  #10B981); }
.admin-hazard-item__info {
  flex: 1;
  min-width: 0;
}
.admin-hazard-item__title {
  display: block;
  font-size: 13px;
  color: var(--pc-text-body, #334155);
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}
.admin-hazard-item__building {
  display: block;
  font-size: 12px;
  color: var(--pc-text-muted, #94A3B8);
}
.admin-badge {
  font-size: 11px;
  padding: 1px 7px;
  border-radius: 9999px;
  border: 1px solid;
}
.admin-badge--red    { color: var(--risk-red,    #FF4444); background: #FEE2E2; border-color: #FECACA; }
.admin-badge--orange { color: var(--risk-orange, #EA580C); background: #FFEDD5; border-color: #FED7AA; }
.admin-badge--yellow { color: #92400E;                     background: #FEF3C7; border-color: #FDE68A; }
.admin-badge--green  { color: var(--color-success, #065F46); background: #D1FAE5; border-color: #A7F3D0; }
.admin-hazard-item__time {
  font-size: 11px;
  color: var(--pc-text-muted, #94A3B8);
  white-space: nowrap;
}
.admin-empty {
  padding: 24px 16px;
  text-align: center;
  font-size: 13px;
  color: var(--pc-text-muted, #94A3B8);
}

/* ③ 演示控制台 */
.admin-demo-control-list {
  display: flex;
  flex-direction: column;
  gap: 2px;
  padding: 8px;
}
.admin-demo-btn {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 10px 12px;
  border-radius: 8px;
  text-decoration: none;
  color: var(--pc-text-body, #334155);
  transition: background 150ms;
}
.admin-demo-btn:hover { background: var(--pc-bg-hover, #F5F9FF); }
.admin-demo-btn__icon { font-size: 20px; flex-shrink: 0; }
.admin-demo-btn__label {
  font-size: 13px;
  font-weight: 600;
  color: var(--pc-text-title, #0F172A);
}
.admin-demo-btn__desc {
  font-size: 11px;
  color: var(--pc-text-muted, #94A3B8);
  margin-top: 1px;
}

/* 工具 */
.tabular-nums { font-variant-numeric: tabular-nums; }
</style>
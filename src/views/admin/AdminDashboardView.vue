<template>
  <!--
    T15.73 管理端工作台第一版低保真布局定型（wireframe）：/admin/dashboard 版面关系
    ┌── zone:kpi-stats ──────────────────────────────────────────────────┐
    │  活跃告警 │ 待处理工单 │ 重点隐患 │ 工单闭环率 │ 逢期工单                     │
    ├── zone:quick-actions ───────────────────────────────────────────────┤
    │  快捷操作：告警确认/派单 │ 工单核查销号 │ 建筑档案 │ 实时采集       │
    ├───────────────────────────┬──────────────────────────┤
    │ zone:alarm-list [左]            │ zone:workorder-board [右上]         │
    │ 告警与活跃隐患清单                 │ 工单看板：待处理/处理中/待核查/已销 │
    │                              ├────────────────────────┤
    │                              │ zone:todo [右中]                  │
    │                              │ 待办工单（逢期预警和待核查）          │
    │                              ├────────────────────────┤
    │                              │ zone:demo-control [右下]          │
    │                              │ 演示控制入口                      │
    └───────────────────────────┴────────────────────────┘
  -->
  <div class="admin-dashboard">
    <!-- 页面标题 -->
    <div class="admin-page-header">
      <h2 class="admin-page-title">工作台</h2>
      <span class="admin-page-subtitle">{{ currentDate }}</span>
    </div>

    <!-- ① KPI 指标卡片区（zone:kpi-stats），T15.70 P1：管理端最高优先信息 -->
    <div class="admin-kpi-row" data-testid="admin-kpi-stats" data-zone="kpi-stats">
      <!-- 今日告警 -->
      <div class="admin-kpi-card admin-kpi-card--alarm" data-testid="admin-kpi-alarms">
        <div class="admin-kpi-card__header">
          <span class="admin-kpi-card__label">活跃告警</span>
          <span class="admin-kpi-card__icon admin-kpi-card__icon--alarm">⚠</span>
        </div>
        <div class="admin-kpi-card__value tabular-nums">{{ kpi.activeAlarms }}</div>
        <div class="admin-kpi-card__sub">开放隐患：{{ kpi.openHazards }} 处</div>
      </div>

      <!-- 待办工单（T15.70 P1：管理端最高优先信息） -->
      <div class="admin-kpi-card admin-kpi-card--workorder" data-testid="admin-kpi-workorders" data-priority="1">
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

    <!-- ② 快速数据操作区（zone:quick-actions），T15.70 P1：管理端突出待办和数据操作 -->
    <div class="admin-quick-actions" data-testid="admin-quick-actions" data-zone="quick-actions">
      <router-link class="admin-quick-btn" to="/admin/alarms">
        <span class="admin-quick-btn__icon">⚠</span>
        <span class="admin-quick-btn__label">告警确认 / 派单</span>
      </router-link>
      <router-link class="admin-quick-btn" to="/admin/work-orders">
        <span class="admin-quick-btn__icon">✓</span>
        <span class="admin-quick-btn__label">工单核查销号</span>
      </router-link>
      <router-link class="admin-quick-btn" to="/admin/buildings">
        <span class="admin-quick-btn__icon">▦</span>
        <span class="admin-quick-btn__label">建筑档案</span>
      </router-link>
      <router-link class="admin-quick-btn" to="/admin/telemetry">
        <span class="admin-quick-btn__icon">∿</span>
        <span class="admin-quick-btn__label">实时采集</span>
      </router-link>
    </div>

    <!-- ③ 主内容区：告警 + 工单看板 + 待办 + 演示控制 -->
    <div class="admin-dashboard-body">
      <!-- 告警与隐患清单（zone:alarm-list）-->
      <div class="admin-card admin-card--full" data-zone="alarm-list">
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

      <!-- 右侧栏：工单看板 + 待办 + 演示控制 -->
      <div class="admin-right-col">
        <!-- 工单看板（zone:workorder-board） -->
        <div class="admin-card" data-zone="workorder-board">
          <div class="admin-card__header">
            <span class="admin-card__title">工单看板</span>
            <router-link class="admin-card__more" to="/admin/work-orders">查看工单 →</router-link>
          </div>
          <div class="admin-wo-board">
            <div class="admin-wo-board-item admin-wo-board-item--pending">
              <span class="admin-wo-board-item__count tabular-nums">{{ board.pending }}</span>
              <span class="admin-wo-board-item__label">待处理</span>
            </div>
            <div class="admin-wo-board-item admin-wo-board-item--processing">
              <span class="admin-wo-board-item__count tabular-nums">{{ board.processing }}</span>
              <span class="admin-wo-board-item__label">处理中</span>
            </div>
            <div class="admin-wo-board-item admin-wo-board-item--checking">
              <span class="admin-wo-board-item__count tabular-nums">{{ board.checking }}</span>
              <span class="admin-wo-board-item__label">待核查</span>
            </div>
            <div class="admin-wo-board-item admin-wo-board-item--finished">
              <span class="admin-wo-board-item__count tabular-nums">{{ board.finished }}</span>
              <span class="admin-wo-board-item__label">已销号</span>
            </div>
          </div>
        </div>

        <!-- 待办工单（zone:todo）—— 逾期预警和待核查快速入口 -->
        <div class="admin-card" data-zone="todo">
          <div class="admin-card__header">
            <span class="admin-card__title">待办提醒</span>
            <router-link class="admin-card__more" to="/admin/work-orders">处理 →</router-link>
          </div>
          <div class="admin-todo-list">
            <div v-if="board.overdueCount > 0" class="admin-todo-item admin-todo-item--danger">
              <span class="admin-todo-item__dot" />
              <div class="admin-todo-item__info">
                <span class="admin-todo-item__title">逾期工单待督办</span>
                <span class="admin-todo-item__count">{{ board.overdueCount }} 条工单已超出 SLA</span>
              </div>
            </div>
            <div v-if="board.checking > 0" class="admin-todo-item admin-todo-item--warn">
              <span class="admin-todo-item__dot" />
              <div class="admin-todo-item__info">
                <span class="admin-todo-item__title">待核查工单</span>
                <span class="admin-todo-item__count">{{ board.checking }} 条工单等待核查销号</span>
              </div>
            </div>
            <div v-if="board.pending > 0" class="admin-todo-item admin-todo-item--info">
              <span class="admin-todo-item__dot" />
              <div class="admin-todo-item__info">
                <span class="admin-todo-item__title">待处理工单</span>
                <span class="admin-todo-item__count">{{ board.pending }} 条工单等待派单</span>
              </div>
            </div>
            <div v-if="board.overdueCount === 0 && board.checking === 0 && board.pending === 0" class="admin-todo-empty">
              暂无紧急待办事项
            </div>
          </div>
        </div>

        <!-- 演示控制台入口（zone:demo-control） -->
        <div class="admin-card" data-testid="admin-demo-control" data-zone="demo-control">
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
      </div><!-- /.admin-right-col -->
    </div><!-- /.admin-dashboard-body -->
  </div><!-- /.admin-dashboard -->
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

/* 右侧栏 */
.admin-right-col {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

/* 工单看板 */
.admin-wo-board {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 8px;
  padding: 8px 16px 16px;
}
.admin-wo-board-item {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 10px 8px;
  border-radius: 8px;
  background: var(--pc-bg-hover, #F5F9FF);
  gap: 2px;
}
.admin-wo-board-item--pending    { border-left: 3px solid var(--wo-pending,    #F59E0B); }
.admin-wo-board-item--processing { border-left: 3px solid var(--wo-processing, #3B82F6); }
.admin-wo-board-item--checking   { border-left: 3px solid var(--wo-checking,   #8B5CF6); }
.admin-wo-board-item--finished   { border-left: 3px solid var(--color-success, #10B981); }
.admin-wo-board-item__count {
  font-size: 22px;
  font-weight: 700;
  color: var(--pc-text-title, #0F172A);
}
.admin-wo-board-item__label {
  font-size: 11px;
  color: var(--pc-text-muted, #94A3B8);
}

/* 待办提醒 */
.admin-todo-list {
  display: flex;
  flex-direction: column;
  gap: 6px;
  padding: 8px 16px 12px;
}
.admin-todo-item {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 8px 10px;
  border-radius: 6px;
}
.admin-todo-item--danger { background: #FEE2E2; }
.admin-todo-item--warn   { background: #FEF3C7; }
.admin-todo-item--info   { background: #EFF6FF; }
.admin-todo-item__dot {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  flex-shrink: 0;
}
.admin-todo-item--danger .admin-todo-item__dot { background: #EF4444; }
.admin-todo-item--warn   .admin-todo-item__dot { background: #F59E0B; }
.admin-todo-item--info   .admin-todo-item__dot { background: #3B82F6; }
.admin-todo-item__info { display: flex; flex-direction: column; gap: 1px; }
.admin-todo-item__title { font-size: 12px; font-weight: 600; color: var(--pc-text-title, #0F172A); }
.admin-todo-item__count { font-size: 11px; color: var(--pc-text-muted, #94A3B8); }
.admin-todo-empty {
  text-align: center;
  padding: 12px;
  font-size: 13px;
  color: var(--pc-text-muted, #94A3B8);
}
</style>
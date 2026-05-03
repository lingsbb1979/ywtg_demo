<template>
  <!--
    T15.71 低保真布局定型（wireframe）：/screen/home 版面关系
    ┌──────────── header: zone:kpi ────────────────────────────────────┐
    │  监测建筑 │ 活跃告警 │ 开放隐患 │ 工单闭环率                      │
    ├──────────────────────────────────────────────────────────────────┤
    │ zone:hazard-list │ zone:map          │ zone:workorder-board [上]  │
    │ 重点隐患清单      │ 佳木斯历史建筑     │ 工单进度看板               │
    │ 左侧面板 260px   │ 分布图 (中央弹性)  ├────────────────────────────┤
    │                  │                   │ zone:alarm-entry [下]      │
    │                  │                   │ 实时告警入口                │
    └──────────────────┴───────────────────┴────────────────────────────┘
  -->
  <div class="screen-root screen-bg">
    <!-- ① 顶部标题栏（screen-header） -->
    <header class="screen-header" data-testid="screen-header">
      <div class="screen-header__left">
        <span class="screen-header__logo-text">国</span>
        <h1 class="screen-header__title">佳木斯历史建筑智慧安全监测平台</h1>
      </div>
      <div class="screen-header__center screen-kpi" data-testid="screen-kpi" data-zone="kpi">
        <!-- KPI 区：总建筑数 / 活跃告警 / 在处工单 / 工单闭环率 -->
        <div class="screen-kpi-item">
          <span class="screen-kpi-item__label">监测建筑</span>
          <span class="screen-kpi-item__value tabular-nums">{{ kpi.totalBuildings }}</span>
          <span class="screen-kpi-item__unit">栋</span>
        </div>
        <div class="screen-kpi-divider" />
        <div class="screen-kpi-item">
          <span class="screen-kpi-item__label">活跃告警</span>
          <span class="screen-kpi-item__value tabular-nums" :class="kpi.activeAlarms > 0 ? 'screen-kpi-item__value--warn' : ''">
            {{ kpi.activeAlarms }}
          </span>
          <span class="screen-kpi-item__unit">条</span>
        </div>
        <div class="screen-kpi-divider" />
        <div class="screen-kpi-item">
          <span class="screen-kpi-item__label">开放隐患</span>
          <span class="screen-kpi-item__value tabular-nums" :class="kpi.openHazards > 0 ? 'screen-kpi-item__value--warn' : ''">
            {{ kpi.openHazards }}
          </span>
          <span class="screen-kpi-item__unit">处</span>
        </div>
        <div class="screen-kpi-divider" />
        <div class="screen-kpi-item">
          <span class="screen-kpi-item__label">工单闭环率</span>
          <span class="screen-kpi-item__value tabular-nums screen-kpi-item__value--success">
            {{ kpi.closeRate }}%
          </span>
        </div>
      </div>
      <div class="screen-header__right">
        <span class="screen-header__time">{{ currentTime }}</span>
      </div>
    </header>

    <!-- ② 主内容区：左面板 + 地图 + 右面板 -->
    <!-- screen-situation：最高优先级区域（T15.70 三端信息层级：大屏突出房屋隐患和态势） -->
    <main class="screen-main screen-situation">
      <!-- 左侧隐患清单（screen-hazard-list）data-priority="1"：P1 最高优先信息 -->
      <aside class="screen-panel screen-panel--left screen-glass-card" data-testid="screen-hazard-list" data-priority="1" data-zone="hazard-list">
        <div class="screen-panel__title">
          <span class="screen-panel__title-bar" />
          重点隐患清单
          <span class="screen-panel__badge">{{ hazardList.length }}</span>
        </div>
        <ul class="screen-hazard-list__items">
          <li
            v-for="h in hazardList"
            :key="h.id"
            class="screen-hazard-item"
            :class="`screen-hazard-item--${h.alarmLevel.toLowerCase()}`"
          >
            <span class="screen-hazard-item__dot" :class="`risk-dot--${h.alarmLevel.toLowerCase()}`" />
            <div class="screen-hazard-item__info">
              <span class="screen-hazard-item__name">{{ h.alarmTitle ?? h.alarmId }}</span>
              <span class="screen-hazard-item__building">{{ h.buildingName ?? `建筑 #${h.buildingId}` }}</span>
            </div>
            <span class="screen-hazard-item__level badge-screen" :class="`badge-screen--${h.alarmLevel.toLowerCase()}`">
              {{ h.alarmLevel }}
            </span>
          </li>
          <li v-if="hazardList.length === 0" class="screen-hazard-list__empty">暂无活跃隐患</li>
        </ul>
      </aside>

      <!-- 中央地图区（screen-map） -->
      <section class="screen-map" data-testid="screen-map" data-zone="map">
        <div class="screen-map__container screen-glass-card">
          <div class="screen-map__title-bar">
            <span class="screen-panel__title-bar" />
            佳木斯市历史建筑分布图
            <span
              v-if="mapError"
              class="screen-map__fallback-badge"
              data-testid="map-fallback-toggle"
              title="地图加载失败，已切换到建筑列表模式"
            >列表模式</span>
          </div>
          <!-- 地图失败降级：建筑列表模式 -->
          <div class="screen-map__fallback-list">
            <div
              v-for="pt in mapPoints"
              :key="pt.id"
              class="screen-map__point"
              :class="[`screen-map__point--${pt.color}`, selectedPoint?.id === pt.id ? 'screen-map__point--selected' : '']"
              :title="`${pt.name}：${pt.summary}`"
              @click="selectedPoint = pt"
            >
              <span class="screen-map__point-dot risk-dot" :class="`risk-dot--${pt.color}`" />
              <span class="screen-map__point-name">{{ pt.name }}</span>
              <span class="screen-map__point-level">{{ pt.summary }}</span>
            </div>
          </div>
          <div v-if="mapPoints.length === 0" class="screen-map__empty">
            暂无建筑点位数据，请先初始化演示数据
          </div>

          <!-- T15.72 建筑详情弹窗（高保真：风险色 + 弹窗样式） -->
          <Transition name="screen-popup">
            <div
              v-if="selectedPoint"
              class="screen-building-popup screen-glass-card"
              data-testid="screen-building-popup"
            >
              <div class="screen-popup-header">
                <span class="screen-popup-building-name">{{ selectedPoint.name }}</span>
                <button class="screen-popup-close" @click="selectedPoint = null">×</button>
              </div>
              <div
                class="screen-popup-risk-badge badge-screen"
                :class="`badge-screen--${selectedPoint.color}`"
              >
                风险等级：{{ selectedPoint.riskLevel ?? selectedPoint.color }}
              </div>
              <div class="screen-popup-summary">
                {{ selectedPoint.summary ?? `开放隐患 ${selectedPoint.openCount ?? 0} 处` }}
              </div>
              <router-link class="screen-popup-link" to="/screen/alarm-dispatch">查看详情 →</router-link>
            </div>
          </Transition>
        </div>
      </section>

      <!-- 右侧面板：工单进度 [上] + 告警入口 [下] -->
      <aside class="screen-panel screen-panel--right screen-glass-card" data-testid="screen-workorder-board">
        <!-- 工单进度看板区域 (data-zone="workorder-board") -->
        <div data-zone="workorder-board">
          <div class="screen-panel__title">
            <span class="screen-panel__title-bar" />
            工单进度看板
          </div>
          <div class="screen-board">
            <div class="screen-board-item screen-board-item--pending">
              <span class="screen-board-item__count tabular-nums">{{ board.pending }}</span>
              <span class="screen-board-item__label">待处理</span>
            </div>
            <div class="screen-board-item screen-board-item--processing">
              <span class="screen-board-item__count tabular-nums">{{ board.processing }}</span>
              <span class="screen-board-item__label">处理中</span>
            </div>
            <div class="screen-board-item screen-board-item--checking">
              <span class="screen-board-item__count tabular-nums">{{ board.checking }}</span>
              <span class="screen-board-item__label">待核查</span>
            </div>
            <div class="screen-board-item screen-board-item--finished">
              <span class="screen-board-item__count tabular-nums">{{ board.finished }}</span>
              <span class="screen-board-item__label">已销号</span>
            </div>
          </div>
          <div v-if="board.overdueCount > 0" class="screen-board-overdue">
            <span class="screen-board-overdue__dot" />
            逾期工单：<strong>{{ board.overdueCount }}</strong> 条，请及时督办
          </div>
          <div class="screen-panel__divider" />
          <div class="screen-quick-links">
            <router-link class="screen-quick-link" to="/screen/work-orders">工单中心</router-link>
            <router-link class="screen-quick-link screen-quick-link--emergency" to="/screen/emergency" data-testid="emergency-link">应急处置</router-link>
            <router-link class="screen-quick-link screen-quick-link--supervision" to="/screen/performance">绩效督办</router-link>
            <router-link class="screen-quick-link" to="/admin/demo-console">演示控制台</router-link>
          </div>
        </div>

        <!-- 告警入口区域 (data-zone="alarm-entry") -->
        <div class="screen-alarm-entry" data-zone="alarm-entry" data-testid="screen-alarm-entry">
          <div class="screen-panel__title">
            <span class="screen-panel__title-bar screen-panel__title-bar--warn" />
            实时告警入口
            <span
              class="screen-panel__badge screen-panel__badge--warn"
              :class="kpi.activeAlarms > 0 ? 'screen-panel__badge--active' : ''"
            >{{ kpi.activeAlarms }}</span>
          </div>
          <ul class="screen-alarm-entry__list">
            <li
              v-for="h in alarmEntryItems"
              :key="h.id"
              class="screen-alarm-entry__item"
            >
              <span class="screen-alarm-entry__dot risk-dot" :class="`risk-dot--${h.alarmLevel.toLowerCase()}`" />
              <span class="screen-alarm-entry__title">{{ h.alarmTitle ?? h.alarmId }}</span>
              <span
                class="screen-alarm-entry__level badge-screen"
                :class="`badge-screen--${h.alarmLevel.toLowerCase()}`"
              >{{ h.alarmLevel }}</span>
            </li>
            <li v-if="alarmEntryItems.length === 0" class="screen-alarm-entry__empty">暂无活跃告警</li>
          </ul>
          <router-link
            class="screen-alarm-entry__link"
            to="/screen/alarm-dispatch"
            data-testid="screen-alarm-entry-link"
          >
            查看全部告警 →
          </router-link>
        </div>
      </aside>
    </main>

    <!-- ③ 底部状态栏 -->
    <footer class="screen-footer screen-glass-card">
      <span class="screen-footer__item">系统状态：<strong class="screen-footer__status--ok">正常运行</strong></span>
      <span class="screen-footer__divider" />
      <span class="screen-footer__item">数据更新：{{ currentTime }}</span>
      <span class="screen-footer__divider" />
      <span class="screen-footer__item">演示模式</span>
    </footer>

    <!-- ④ 应急指挥弹窗（大屏叠加层，有活跃应急事件时显示）-->
    <Transition name="emergency-fade">
      <div
        v-if="activeIncident"
        class="screen-emergency-overlay"
        data-testid="emergency-overlay"
      >
        <div class="screen-emergency-panel screen-glass-card">
          <!-- 标题 -->
          <div class="screen-emergency-panel__header">
            <span class="screen-emergency-panel__icon">🚨</span>
            <div class="screen-emergency-panel__titles">
              <h2 class="screen-emergency-panel__title">红色预警 — 应急指挥流程</h2>
              <p class="screen-emergency-panel__subtitle">
                {{ incidentBuilding }} · 倾斜超限 · 事件编号 {{ activeIncident.incident_no }}
              </p>
            </div>
          </div>

          <!-- 步骤列表 -->
          <div class="screen-emergency-steps">
            <div
              v-for="(node, idx) in planNodes"
              :key="node.id"
              class="screen-emergency-step"
              :class="{
                'screen-emergency-step--done':    idx < activeIncident.current_step,
                'screen-emergency-step--current': idx === activeIncident.current_step,
                'screen-emergency-step--locked':  idx > activeIncident.current_step,
              }"
            >
              <div class="screen-emergency-step__left">
                <span class="screen-emergency-step__no">
                  <template v-if="idx < activeIncident.current_step">✓</template>
                  <template v-else>{{ idx + 1 }}</template>
                </span>
              </div>
              <div class="screen-emergency-step__body">
                <span class="screen-emergency-step__name">{{ node.node_name }}</span>
                <span v-if="node.limit_minutes" class="screen-emergency-step__limit">
                  时限 {{ node.limit_minutes }} 分钟
                </span>
                <!-- Step 5：显示 H5 链接 -->
                <template v-if="idx === planNodes.length - 1 && idx < activeIncident.current_step">
                  <div class="screen-emergency-step__h5-link">
                    <span class="screen-emergency-step__h5-hint">请外勤人员打开手机访问：</span>
                    <a
                      :href="h5EmergencyUrl"
                      target="_blank"
                      class="screen-emergency-step__h5-btn"
                    >
                      打开 H5 结案页 →
                    </a>
                  </div>
                </template>
              </div>
              <div class="screen-emergency-step__right">
                <button
                  v-if="idx === activeIncident.current_step"
                  class="screen-emergency-step__confirm-btn"
                  @click="handleConfirmStep(node)"
                >
                  ✓ 确认
                </button>
                <span v-else-if="idx < activeIncident.current_step" class="screen-emergency-step__done-tag">
                  已完成
                </span>
              </div>
            </div>
          </div>

          <!-- 结案后底部提示 -->
          <div
            v-if="activeIncident.current_step >= planNodes.length && !incidentClosed"
            class="screen-emergency-panel__footer"
          >
            <span class="screen-emergency-panel__footer-hint">
              所有步骤已完成，等待外勤 H5 端选择结案方式…
            </span>
          </div>
          <div v-if="incidentClosed" class="screen-emergency-panel__footer screen-emergency-panel__footer--closed">
            <span>✅ 应急事件已结案，大屏将在 3 秒后恢复正常</span>
          </div>
        </div>
      </div>
    </Transition>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted } from "vue"
import {
  selectScreenKpi,
  selectMapPoints,
  selectHazardList,
  selectWorkOrderBoard,
  type ScreenKpi,
  type MapPoint,
  type HazardListItem,
  type WorkOrderBoard,
} from "@/services/screenKpiService"
import {
  getActiveIncident,
  getPlanNodes,
  confirmStep,
  type EmergencyIncident,
  type EmergencyFlowNode,
} from "@/services/emergencyService"
import { getTable } from "@/services/sqliteMirrorRepository"

// ── 响应式状态 ────────────────────────────────────────────────────────────────
const kpi           = ref<ScreenKpi>({ totalBuildings: 0, openHazards: 0, activeAlarms: 0, closeRate: 0 })
const mapPoints     = ref<MapPoint[]>([])
const selectedPoint = ref<MapPoint | null>(null)
const hazardList  = ref<HazardListItem[]>([])
const board       = ref<WorkOrderBoard>({ pending: 0, processing: 0, checking: 0, finished: 0, total: 0, overdueCount: 0 })
const currentTime = ref("")

/**
 * T15.118 — 地图失败列表兜底模式。
 * Demo 中无真实地图组件，始终使用建筑列表展示；
 * 若未来接入真实地图且加载失败，可将 mapError 置 true 切换兜底。
 */
const mapError = ref(false)

// ── 应急指挥状态 ─────────────────────────────────────────────────────────────
const activeIncident  = ref<EmergencyIncident | null>(null)
const planNodes       = ref<EmergencyFlowNode[]>([])
const incidentClosed  = ref(false)

/** 关联建筑名称 */
const incidentBuilding = computed(() => {
  if (!activeIncident.value) return ""
  const spaces = getTable<{ id: number; name: string }>("iot_space")
  const space = spaces.find((s) => Number(s.id) === Number(activeIncident.value!.building_id))
  return space?.name ?? `建筑 #${activeIncident.value.building_id}`
})

/** H5 结案页 URL（带 _role 参数，新标签页自动以外勤角色打开） */
const h5EmergencyUrl = computed(() => {
  if (!activeIncident.value) return ""
  const base = `${window.location.origin}/h5/emergency/${activeIncident.value.id}`
  return `${base}?_role=FIELD_WORKER`
})

/** 用户点击"✓ 确认"某个步骤 */
function handleConfirmStep(node: EmergencyFlowNode): void {
  if (!activeIncident.value) return
  confirmStep(activeIncident.value.id, node.node_code)
  // 同步刷新应急状态
  loadEmergency()
}

/** 轮询检测应急事件关闭（H5 端结案后大屏自动消弹窗） */
function loadEmergency(): void {
  const incident = getActiveIncident()
  activeIncident.value = incident
  if (incident) {
    planNodes.value = getPlanNodes(incident.plan_id)
    incidentClosed.value = false
  } else if (activeIncident.value && !incident) {
    // 刚从有变无 → 事件被 H5 关闭了
    incidentClosed.value = true
    setTimeout(() => { incidentClosed.value = false }, 3000)
  }
}

// ── 告警入口：取最高风险的前 4 条用于右侧告警入口区域（data-zone="alarm-entry"）──
const alarmEntryItems = computed<HazardListItem[]>(() => hazardList.value.slice(0, 4))

function formatTime(d: Date): string {
  const pad = (n: number) => String(n).padStart(2, "0")
  return `${d.getFullYear()}-${pad(d.getMonth()+1)}-${pad(d.getDate())} ${pad(d.getHours())}:${pad(d.getMinutes())}:${pad(d.getSeconds())}`
}

function loadData() {
  kpi.value        = selectScreenKpi()
  mapPoints.value  = selectMapPoints()
  hazardList.value = selectHazardList({ limit: 15 })
  board.value      = selectWorkOrderBoard()
  currentTime.value = formatTime(new Date())
  loadEmergency()
}

let timer: ReturnType<typeof setInterval>
onMounted(() => {
  loadData()
  timer = setInterval(loadData, 5_000)  // 缩短到 5s，确保 H5 结案后大屏及时响应
})
onUnmounted(() => clearInterval(timer))
</script>

<style scoped>
/* ===== 根容器 ===== */
.screen-root {
  width: 100vw;
  height: 100vh;
  overflow: hidden;
  display: flex;
  flex-direction: column;
  background: var(--screen-bg-base, #060D1F);
  color: var(--screen-text-body, rgba(255,255,255,0.75));
  font-family: "PingFang SC","Microsoft YaHei UI",sans-serif;
}

/* ===== 顶部标题栏 ===== */
.screen-header {
  height: 60px;
  flex-shrink: 0;
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0 24px;
  background: linear-gradient(180deg, rgba(8,25,60,0.95) 0%, rgba(6,13,31,0.80) 100%);
  border-bottom: 1px solid var(--screen-border-glow, rgba(0,168,255,0.30));
  position: relative;
  z-index: 10;
}
.screen-header::before {
  content: '';
  position: absolute;
  top: 0; left: 0; right: 0;
  height: 2px;
  background: linear-gradient(90deg, transparent 0%, var(--screen-cyan, #00D4FF) 20%, var(--screen-primary, #1B6FE8) 50%, var(--screen-cyan, #00D4FF) 80%, transparent 100%);
  opacity: 0.7;
}
.screen-header__left {
  display: flex;
  align-items: center;
  gap: 10px;
}
.screen-header__logo-text {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 36px;
  height: 36px;
  background: linear-gradient(135deg, var(--screen-primary, #1B6FE8) 0%, var(--screen-cyan, #00D4FF) 100%);
  border-radius: 8px;
  color: #fff;
  font-size: 16px;
  font-weight: 800;
  letter-spacing: 0;
}
.screen-header__title {
  font-size: 18px;
  font-weight: 700;
  color: transparent;
  background: linear-gradient(90deg, #fff 0%, var(--screen-cyan, #00D4FF) 100%);
  -webkit-background-clip: text;
  background-clip: text;
  -webkit-text-fill-color: transparent;
  letter-spacing: 0.05em;
  margin: 0;
}
.screen-header__right {
  font-size: 13px;
  color: var(--screen-text-muted, rgba(255,255,255,0.45));
}
.screen-header__time { font-variant-numeric: tabular-nums; }

/* ===== KPI 指标区 ===== */
.screen-kpi {
  display: flex;
  align-items: center;
  gap: 16px;
}
.screen-kpi-item {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 2px;
}
.screen-kpi-item__label {
  font-size: 11px;
  color: var(--screen-text-muted, rgba(255,255,255,0.45));
  white-space: nowrap;
}
.screen-kpi-item__value {
  font-size: 28px;
  font-weight: 700;
  color: var(--screen-cyan, #00D4FF);
  line-height: 1;
}
.screen-kpi-item__value--warn    { color: var(--risk-orange, #FF8A3D); }
.screen-kpi-item__value--success { color: var(--color-success, #10B981); }
.screen-kpi-item__unit {
  font-size: 11px;
  color: var(--screen-text-muted, rgba(255,255,255,0.45));
}
.screen-kpi-divider {
  width: 1px;
  height: 32px;
  background: var(--screen-border-line, rgba(255,255,255,0.08));
}

/* ===== 主内容区 ===== */
.screen-main {
  flex: 1;
  display: grid;
  grid-template-columns: 260px 1fr 280px;
  gap: 8px;
  padding: 8px;
  overflow: hidden;
}

/* ===== 面板通用 ===== */
.screen-panel {
  display: flex;
  flex-direction: column;
  gap: 8px;
  overflow: hidden;
  padding: 14px;
  background: var(--screen-bg-card, rgba(8,25,60,0.85));
  border: 1px solid var(--screen-border-glow, rgba(0,168,255,0.30));
  border-radius: var(--radius-lg, 12px);
  backdrop-filter: blur(12px);
}
.screen-glass-card {
  background: var(--screen-bg-card, rgba(8,25,60,0.85));
  border: 1px solid var(--screen-border-glow, rgba(0,168,255,0.30));
  border-radius: var(--radius-lg, 12px);
  backdrop-filter: blur(12px);
  box-shadow: var(--screen-shadow-card, 0 0 0 1px rgba(0,168,255,0.20), 0 4px 24px rgba(0,0,0,0.40));
}
.screen-panel__title {
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 13px;
  font-weight: 600;
  color: var(--screen-text-h2, rgba(255,255,255,0.90));
  padding-bottom: 6px;
  border-bottom: 1px solid var(--screen-border-line, rgba(255,255,255,0.08));
}
.screen-panel__title-bar {
  display: inline-block;
  width: 3px;
  height: 13px;
  background: var(--screen-cyan, #00D4FF);
  border-radius: 2px;
}
.screen-panel__badge {
  margin-left: auto;
  background: rgba(239,68,68,0.15);
  color: #EF4444;
  font-size: 11px;
  padding: 1px 6px;
  border-radius: 9999px;
  border: 1px solid rgba(239,68,68,0.30);
}
.screen-panel__divider {
  height: 1px;
  background: var(--screen-border-line, rgba(255,255,255,0.08));
  margin: 4px 0;
}

/* ===== 隐患清单 ===== */
.screen-hazard-list__items {
  list-style: none;
  margin: 0;
  padding: 0;
  display: flex;
  flex-direction: column;
  gap: 6px;
  overflow-y: auto;
  flex: 1;
}
.screen-hazard-list__items::-webkit-scrollbar { width: 2px; }
.screen-hazard-list__items::-webkit-scrollbar-thumb { background: rgba(0,212,255,0.3); border-radius: 1px; }
.screen-hazard-item {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 6px 8px;
  border-radius: 6px;
  background: rgba(255,255,255,0.03);
  border-left: 2px solid transparent;
}
.screen-hazard-item--red    { border-left-color: var(--risk-red, #FF4444); }
.screen-hazard-item--orange { border-left-color: var(--risk-orange, #FF8A3D); }
.screen-hazard-item--yellow { border-left-color: var(--risk-yellow, #FFD700); }
.screen-hazard-item__dot {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  flex-shrink: 0;
}
.risk-dot--red    { background: var(--risk-red, #FF4444); box-shadow: 0 0 6px var(--risk-red, #FF4444); }
.risk-dot--orange { background: var(--risk-orange, #FF8A3D); box-shadow: 0 0 6px var(--risk-orange, #FF8A3D); }
.risk-dot--yellow { background: var(--risk-yellow, #FFD700); box-shadow: 0 0 6px var(--risk-yellow, #FFD700); }
.risk-dot--green  { background: var(--risk-green, #10B981); }
.screen-hazard-item__info {
  flex: 1;
  min-width: 0;
  display: flex;
  flex-direction: column;
  gap: 2px;
}
.screen-hazard-item__name {
  font-size: 12px;
  color: var(--screen-text-body, rgba(255,255,255,0.75));
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}
.screen-hazard-item__building {
  font-size: 11px;
  color: var(--screen-text-muted, rgba(255,255,255,0.45));
}
.screen-hazard-item__level {
  font-size: 10px;
  padding: 1px 5px;
  border-radius: 9999px;
}
.badge-screen       { border: 1px solid; }
.badge-screen--red    { color: var(--risk-red,    #FF4444); background: var(--risk-red-alpha, rgba(255,68,68,0.15));    border-color: var(--risk-red,    #FF4444); }
.badge-screen--orange { color: var(--risk-orange, #FF8A3D); background: var(--risk-orange-alpha, rgba(255,138,61,0.15)); border-color: var(--risk-orange, #FF8A3D); }
.badge-screen--yellow { color: var(--risk-yellow, #FFD700); background: var(--risk-yellow-alpha, rgba(255,215,0,0.15));  border-color: var(--risk-yellow, #FFD700); }
.badge-screen--green  { color: var(--risk-green,  #10B981); background: var(--risk-green-alpha,  rgba(16,185,129,0.12)); border-color: var(--risk-green,  #10B981); }
.screen-hazard-list__empty {
  font-size: 12px;
  color: var(--screen-text-muted, rgba(255,255,255,0.45));
  text-align: center;
  padding: 20px 0;
}

/* ===== 中央地图区 ===== */
.screen-map {
  position: relative;
  overflow: hidden;
  border-radius: var(--radius-lg, 12px);
}
.screen-map__container {
  width: 100%;
  height: 100%;
  display: flex;
  flex-direction: column;
  padding: 14px;
}
.screen-map__title-bar {
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 13px;
  font-weight: 600;
  color: var(--screen-text-h2, rgba(255,255,255,0.90));
  margin-bottom: 8px;
  padding-bottom: 6px;
  border-bottom: 1px solid var(--screen-border-line, rgba(255,255,255,0.08));
}
.screen-map__fallback-list {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 6px;
  overflow-y: auto;
  flex: 1;
  align-content: start;
  padding-right: 4px;
}
.screen-map__fallback-list::-webkit-scrollbar { width: 2px; }
.screen-map__fallback-list::-webkit-scrollbar-thumb { background: rgba(0,212,255,0.3); border-radius: 1px; }
.screen-map__point {
  display: flex;
  align-items: center;
  gap: 4px;
  padding: 5px 8px;
  background: rgba(255,255,255,0.03);
  border-radius: 6px;
  border: 1px solid rgba(255,255,255,0.06);
  cursor: pointer;
  transition: background 150ms;
}
.screen-map__point:hover { background: rgba(0,212,255,0.08); }
.screen-map__point-dot {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  flex-shrink: 0;
}
.screen-map__point--red  .screen-map__point-dot { background: var(--risk-red, #FF4444); box-shadow: 0 0 5px var(--risk-red, #FF4444); }
.screen-map__point--orange .screen-map__point-dot { background: var(--risk-orange, #FF8A3D); box-shadow: 0 0 5px var(--risk-orange, #FF8A3D); }
.screen-map__point--yellow .screen-map__point-dot { background: var(--risk-yellow, #FFD700); }
.screen-map__point--green  .screen-map__point-dot { background: var(--risk-green, #10B981); }
.screen-map__point-name {
  font-size: 11px;
  color: var(--screen-text-body, rgba(255,255,255,0.75));
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  flex: 1;
}
.screen-map__point-level {
  font-size: 10px;
  color: var(--screen-text-muted, rgba(255,255,255,0.45));
  white-space: nowrap;
}
.screen-map__empty {
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  color: var(--screen-text-muted, rgba(255,255,255,0.45));
  font-size: 13px;
}

/* ===== 工单看板 ===== */
.screen-board {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 6px;
}
.screen-board-item {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 4px;
  padding: 10px 6px;
  border-radius: 8px;
  background: rgba(255,255,255,0.03);
  border: 1px solid rgba(255,255,255,0.06);
}
.screen-board-item__count {
  font-size: 28px;
  font-weight: 700;
  line-height: 1;
}
.screen-board-item__label {
  font-size: 11px;
  color: var(--screen-text-muted, rgba(255,255,255,0.45));
}
.screen-board-item--pending    .screen-board-item__count { color: var(--wo-pending,    #F59E0B); }
.screen-board-item--processing .screen-board-item__count { color: var(--wo-processing, #3B82F6); }
.screen-board-item--checking   .screen-board-item__count { color: var(--wo-checking,   #8B5CF6); }
.screen-board-item--finished   .screen-board-item__count { color: var(--wo-finished,   #10B981); }
.screen-board-overdue {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 6px 10px;
  background: rgba(239,68,68,0.10);
  border: 1px solid rgba(239,68,68,0.25);
  border-radius: 6px;
  font-size: 12px;
  color: #FCA5A5;
}
.screen-board-overdue__dot {
  width: 6px;
  height: 6px;
  border-radius: 50%;
  background: var(--risk-red, #EF4444);
  animation: pulse 1.5s ease-in-out infinite;
}
.screen-quick-links {
  display: flex;
  flex-direction: column;
  gap: 6px;
}
.screen-quick-link {
  display: block;
  padding: 8px 12px;
  background: rgba(27,111,232,0.15);
  border: 1px solid rgba(27,111,232,0.30);
  border-radius: 6px;
  color: var(--screen-cyan, #00D4FF);
  font-size: 13px;
  text-align: center;
  text-decoration: none;
  transition: background 150ms;
}
.screen-quick-link:hover {
  background: rgba(27,111,232,0.30);
}
.screen-quick-link--supervision {
  background: rgba(245,158,11,0.15);
  border-color: rgba(245,158,11,0.35);
  color: #F59E0B;
}
.screen-quick-link--supervision:hover {
  background: rgba(245,158,11,0.28);
}

/* ===== 告警入口区域 (data-zone="alarm-entry") ===== */
.screen-alarm-entry {
  display: flex;
  flex-direction: column;
  gap: 6px;
  border-top: 1px solid var(--screen-border-line, rgba(255,255,255,0.08));
  padding-top: 10px;
  flex: 1;
  min-height: 0;
}
.screen-alarm-entry__list {
  list-style: none;
  margin: 0;
  padding: 0;
  display: flex;
  flex-direction: column;
  gap: 4px;
  flex: 1;
  overflow: hidden;
}
.screen-alarm-entry__item {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 5px 8px;
  border-radius: 6px;
  background: rgba(255,255,255,0.03);
  border: 1px solid rgba(255,255,255,0.06);
  transition: background 150ms;
}
.screen-alarm-entry__item:hover { background: rgba(255,255,255,0.06); }
.screen-alarm-entry__dot {
  width: 7px;
  height: 7px;
  border-radius: 50%;
  flex-shrink: 0;
}
.screen-alarm-entry__title {
  flex: 1;
  font-size: 11px;
  color: var(--screen-text-body, rgba(255,255,255,0.75));
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}
.screen-alarm-entry__level {
  font-size: 10px;
  padding: 1px 5px;
  border-radius: 9999px;
  flex-shrink: 0;
}
.screen-alarm-entry__empty {
  font-size: 12px;
  color: var(--screen-text-muted, rgba(255,255,255,0.45));
  text-align: center;
  padding: 12px 0;
}
.screen-alarm-entry__link {
  display: block;
  padding: 7px 12px;
  background: rgba(255,138,61,0.12);
  border: 1px solid rgba(255,138,61,0.30);
  border-radius: 6px;
  color: var(--risk-orange, #FF8A3D);
  font-size: 12px;
  text-align: center;
  text-decoration: none;
  font-weight: 500;
  transition: background 150ms;
}
.screen-alarm-entry__link:hover {
  background: rgba(255,138,61,0.22);
}
.screen-panel__badge--warn {
  background: rgba(255,138,61,0.15);
  color: var(--risk-orange, #FF8A3D);
  border: 1px solid rgba(255,138,61,0.30);
}
.screen-panel__badge--active {
  animation: pulse 1.5s ease-in-out infinite;
}
.screen-panel__title-bar--warn {
  background: linear-gradient(180deg, var(--risk-orange, #FF8A3D) 0%, transparent 100%);
}

/* ===== 建筑详情弹窗 (T15.72 高保真) ===== */
.screen-building-popup {
  position: absolute;
  top: 50%;
  right: 16px;
  transform: translateY(-50%);
  width: 220px;
  padding: 16px;
  z-index: 50;
  display: flex;
  flex-direction: column;
  gap: 10px;
}
.screen-popup-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 6px;
}
.screen-popup-building-name {
  font-size: 14px;
  font-weight: 600;
  color: var(--screen-text-h2, rgba(255,255,255,0.90));
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  flex: 1;
}
.screen-popup-close {
  background: none;
  border: none;
  color: var(--screen-text-muted, rgba(255,255,255,0.45));
  font-size: 18px;
  cursor: pointer;
  padding: 0 2px;
  line-height: 1;
  flex-shrink: 0;
}
.screen-popup-close:hover { color: rgba(255,255,255,0.90); }
.screen-popup-risk-badge {
  font-size: 12px;
  padding: 4px 10px;
  border-radius: 9999px;
  text-align: center;
}
.screen-popup-summary {
  font-size: 12px;
  color: var(--screen-text-body, rgba(255,255,255,0.75));
  line-height: 1.5;
}
.screen-popup-link {
  display: block;
  padding: 7px 12px;
  background: rgba(27,111,232,0.20);
  border: 1px solid rgba(27,111,232,0.40);
  border-radius: 6px;
  color: var(--screen-cyan, #00D4FF);
  font-size: 12px;
  text-align: center;
  text-decoration: none;
  font-weight: 500;
  transition: background 150ms;
}
.screen-popup-link:hover { background: rgba(27,111,232,0.35); }

/* 选中点位高亮 */
.screen-map__point--selected {
  background: rgba(0,212,255,0.15) !important;
  border-color: var(--screen-cyan, #00D4FF) !important;
  box-shadow: 0 0 8px rgba(0,212,255,0.30);
}

/* 弹窗 Transition 动画 */
.screen-popup-enter-active { transition: opacity 200ms ease, transform 200ms ease; }
.screen-popup-leave-active { transition: opacity 150ms ease, transform 150ms ease; }
.screen-popup-enter-from   { opacity: 0; transform: translateY(-45%) scale(0.95); }
.screen-popup-leave-to     { opacity: 0; transform: translateY(-55%) scale(0.95); }

/* ===== 底部状态栏 ===== */
.screen-footer {
  height: 40px;
  flex-shrink: 0;
  display: flex;
  align-items: center;
  margin: 0 8px 8px;
  padding: 0 16px;
  gap: 16px;
  border-radius: var(--radius-md, 8px);
  font-size: 12px;
  color: var(--screen-text-muted, rgba(255,255,255,0.45));
}
.screen-footer__item strong { color: var(--screen-text-body, rgba(255,255,255,0.75)); }
.screen-footer__status--ok { color: var(--color-success, #10B981); }
.screen-footer__divider {
  width: 1px;
  height: 14px;
  background: rgba(255,255,255,0.12);
}

/* ===== 工具 ===== */
.tabular-nums { font-variant-numeric: tabular-nums; }

@keyframes pulse {
  0%, 100% { opacity: 1; }
  50%       { opacity: 0.4; }
}

/* ===== 应急指挥弹窗 overlay ===== */
.screen-emergency-overlay {
  position: fixed;
  inset: 0;
  z-index: 200;
  display: flex;
  align-items: center;
  justify-content: center;
  background: rgba(6, 2, 10, 0.80);
  backdrop-filter: blur(4px);
}
.screen-emergency-panel {
  width: 560px;
  max-width: 92vw;
  padding: 28px 28px 20px;
  border: 1px solid rgba(239, 68, 68, 0.50);
  box-shadow: 0 0 0 1px rgba(239, 68, 68, 0.25), 0 0 40px rgba(239, 68, 68, 0.20), 0 8px 40px rgba(0,0,0,0.6);
}
.screen-emergency-panel__header {
  display: flex;
  align-items: flex-start;
  gap: 14px;
  margin-bottom: 22px;
}
.screen-emergency-panel__icon {
  font-size: 32px;
  flex-shrink: 0;
  animation: pulse 1.2s ease-in-out infinite;
}
.screen-emergency-panel__title {
  font-size: 18px;
  font-weight: 700;
  color: #EF4444;
  margin: 0 0 4px;
}
.screen-emergency-panel__subtitle {
  font-size: 12px;
  color: rgba(255,255,255,0.55);
  margin: 0;
}

/* 步骤列表 */
.screen-emergency-steps {
  display: flex;
  flex-direction: column;
  gap: 10px;
}
.screen-emergency-step {
  display: flex;
  align-items: center;
  gap: 14px;
  padding: 12px 14px;
  border-radius: 8px;
  border: 1px solid transparent;
  transition: background 0.2s;
}
.screen-emergency-step--done {
  background: rgba(16, 185, 129, 0.08);
  border-color: rgba(16, 185, 129, 0.20);
}
.screen-emergency-step--current {
  background: rgba(239, 68, 68, 0.10);
  border-color: rgba(239, 68, 68, 0.35);
}
.screen-emergency-step--locked {
  background: rgba(255,255,255,0.03);
  border-color: rgba(255,255,255,0.06);
  opacity: 0.5;
}
.screen-emergency-step__left { flex-shrink: 0; }
.screen-emergency-step__no {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 28px;
  height: 28px;
  border-radius: 50%;
  font-size: 13px;
  font-weight: 700;
  background: rgba(255,255,255,0.08);
  color: rgba(255,255,255,0.6);
}
.screen-emergency-step--done   .screen-emergency-step__no { background: rgba(16,185,129,0.20); color: #10B981; }
.screen-emergency-step--current .screen-emergency-step__no { background: rgba(239,68,68,0.25); color: #EF4444; }

.screen-emergency-step__body {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 3px;
}
.screen-emergency-step__name {
  font-size: 14px;
  font-weight: 600;
  color: rgba(255,255,255,0.90);
}
.screen-emergency-step--done .screen-emergency-step__name { color: rgba(16,185,129,0.85); }
.screen-emergency-step__limit {
  font-size: 11px;
  color: rgba(255,255,255,0.40);
}

.screen-emergency-step__h5-link {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-top: 6px;
  flex-wrap: wrap;
}
.screen-emergency-step__h5-hint {
  font-size: 11px;
  color: rgba(255,255,255,0.50);
}
.screen-emergency-step__h5-btn {
  display: inline-block;
  padding: 4px 12px;
  background: linear-gradient(135deg, #1B6FE8, #00D4FF);
  color: #fff;
  font-size: 12px;
  font-weight: 600;
  border-radius: 6px;
  text-decoration: none;
  white-space: nowrap;
}
.screen-emergency-step__h5-btn:hover {
  opacity: 0.85;
}

.screen-emergency-step__right { flex-shrink: 0; }
.screen-emergency-step__confirm-btn {
  padding: 6px 16px;
  background: #EF4444;
  color: #fff;
  border: none;
  border-radius: 6px;
  font-size: 13px;
  font-weight: 600;
  cursor: pointer;
  transition: background 0.15s;
}
.screen-emergency-step__confirm-btn:hover { background: #DC2626; }
.screen-emergency-step__done-tag {
  font-size: 11px;
  color: #10B981;
  font-weight: 600;
}

.screen-emergency-panel__footer {
  margin-top: 16px;
  padding: 10px 14px;
  background: rgba(255,255,255,0.04);
  border-radius: 6px;
  font-size: 13px;
  color: rgba(255,255,255,0.55);
  text-align: center;
}
.screen-emergency-panel__footer--closed {
  background: rgba(16,185,129,0.10);
  color: #10B981;
}

/* 过渡动画 */
.emergency-fade-enter-active,
.emergency-fade-leave-active {
  transition: opacity 0.3s ease;
}
.emergency-fade-enter-from,
.emergency-fade-leave-to {
  opacity: 0;
}
</style>
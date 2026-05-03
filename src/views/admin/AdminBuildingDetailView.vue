<template>
  <!--
    T15.89 管理端建筑详情页 /admin/buildings/:id
    ─────────────────────────────────────────────────────────────
    低保真线框（Wireframe）building-detail：
    ┌─── 页面标题：建筑详情 / 建筑档案 ─────────────────────────┐
    │  ← 返回建筑列表   ● ORANGE  B003 杏林路民国砖楼          │
    ├─── zone:info（基础信息）──────────────────────────────────│
    │  [名称] [编码] [地址] [坐标] [创建时间] [风险等级] [档案] │
    ├─── zone:metrics（风险指标）───────────────────────────────│
    │  ┌── 裂缝 metric_id=1 ──┐  ┌── 倾角 metric_id=2 ──┐    │
    │  │  ● ORANGE  2.3mm      │  │  ● GREEN  0.8°       │    │
    │  │  计算时间：xxxx       │  │  计算时间：xxxx      │    │
    │  └────────────────────────┘  └──────────────────────┘    │
    ├─── zone:alarms（关联告警）────────────────────────────────│
    │  告警编号 | 等级 | 状态 | 时间 | 描述                     │
    ├─── zone:orders（关联工单）────────────────────────────────│
    │  工单编号 | 状态 | 派单时间 | 负责单位 | [查看工单 →]     │
    └────────────────────────────────────────────────────────────┘

    数据来源：
    - buildingService.getBuilding(id)
    - analysisService.getAnalysisResult(id)
    - alarm_record 关联查询
  -->

  <div class="admin-building-detail" style="background:var(--pc-bg-page,#F0F4F9)">
    <!-- 顶部：返回 + 标题 -->
    <div class="admin-page-header">
      <router-link class="admin-back-link" to="/admin/buildings">
        ← 返回建筑列表
      </router-link>
      <div class="admin-page-title-wrap">
        <span v-if="building" class="risk-dot" :class="riskDotClass(building.latestRiskLevel)" />
        <h2 class="admin-page-title">
          {{ building ? building.name : '建筑详情' }}
        </h2>
        <span v-if="building" class="admin-building-detail__code tabular-nums">
          {{ building.spaceCode }}
        </span>
      </div>
    </div>

    <!-- 加载中 -->
    <div v-if="loading" class="admin-loading">正在加载建筑信息…</div>

    <!-- 未找到 -->
    <div v-else-if="!building" class="admin-empty">
      <span>⚠️ 未找到建筑档案，请检查 ID 是否正确</span>
      <router-link class="btn-pc-secondary btn-sm" to="/admin/buildings">
        返回建筑列表
      </router-link>
    </div>

    <template v-else>
      <!-- ① 基础信息区（zone:info） -->
      <div class="pc-card admin-card" data-zone="info">
        <div class="admin-card__header">
          <span class="admin-card__title">🏚 建筑基础信息</span>
          <span class="badge" :class="riskBadgeClass(building.latestRiskLevel)">
            {{ building.latestRiskLevel ?? 'GREEN' }}
          </span>
        </div>
        <div class="admin-info-grid">
          <div class="admin-info-item">
            <span class="admin-info-label">建筑名称</span>
            <span class="admin-info-value">{{ building.name }}</span>
          </div>
          <div class="admin-info-item">
            <span class="admin-info-label">建筑编码</span>
            <span class="admin-info-value tabular-nums">{{ building.spaceCode }}</span>
          </div>
          <div class="admin-info-item">
            <span class="admin-info-label">地址</span>
            <span class="admin-info-value">{{ building.addressDesc ?? '暂无地址' }}</span>
          </div>
          <div class="admin-info-item">
            <span class="admin-info-label">坐标</span>
            <span class="admin-info-value tabular-nums">
              {{ building.latitude != null ? `${building.latitude}, ${building.longitude}` : '暂无坐标' }}
            </span>
          </div>
          <div class="admin-info-item">
            <span class="admin-info-label">创建时间</span>
            <span class="admin-info-value tabular-nums">{{ building.createTime ?? '—' }}</span>
          </div>
          <div class="admin-info-item">
            <span class="admin-info-label">档案状态</span>
            <span class="admin-info-value" :class="building.archiveStatus !== null ? 'text-success' : 'text-muted'">
              {{ building.archiveStatus !== null ? '已建档' : '暂无档案' }}
            </span>
          </div>
          <div v-if="building.responsibleOrg" class="admin-info-item">
            <span class="admin-info-label">责任单位</span>
            <span class="admin-info-value">{{ building.responsibleOrg.orgName }}</span>
          </div>
        </div>
      </div>

      <!-- ② 风险指标区（zone:metrics）-->
      <div class="pc-card admin-card" data-zone="metrics">
        <div class="admin-card__header">
          <span class="admin-card__title">📊 风险指标分析结果</span>
        </div>

        <div v-if="analysisMetrics.length === 0" class="admin-empty admin-empty--inline">
          <span>尚未计算分析结果，请前往</span>
          <router-link class="admin-link" to="/admin/analysis">数据分析页</router-link>
          <span>触发计算</span>
        </div>

        <div v-else class="admin-metrics-grid">
          <div
            v-for="metric in analysisMetrics"
            :key="metric.metricId"
            class="admin-metric-card"
            :class="`admin-metric-card--${metric.riskLevel.toLowerCase()}`"
          >
            <div class="admin-metric-card__header">
              <span class="risk-dot" :class="`risk-dot--${metric.riskLevel.toLowerCase()}`" />
              <span class="admin-metric-card__name">{{ metricName(metric.metricId) }}</span>
              <span class="badge" :class="riskBadgeClass(metric.riskLevel)">
                {{ metric.riskLevel }}
              </span>
            </div>
            <div class="admin-metric-card__value tabular-nums">
              {{ metric.latestValue }}
              <span class="admin-metric-card__unit">{{ metric.unit }}</span>
            </div>
            <div class="admin-metric-card__time tabular-nums">
              计算时间：{{ metric.calcTime }}
            </div>
          </div>
        </div>
      </div>

      <!-- ③ 关联告警区（zone:alarms）-->
      <div class="pc-card admin-card" data-zone="alarms">
        <div class="admin-card__header">
          <span class="admin-card__title">🚨 关联告警</span>
          <span class="admin-card__count">{{ buildingAlarms.length }} 条</span>
        </div>

        <div v-if="buildingAlarms.length === 0" class="admin-empty admin-empty--inline">
          暂无告警记录
        </div>
        <table v-else class="admin-table">
          <thead>
            <tr>
              <th>告警编号</th>
              <th>告警等级</th>
              <th>告警状态</th>
              <th>告警时间</th>
              <th>告警描述</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="alarm in buildingAlarms" :key="alarm.id">
              <td class="tabular-nums">{{ alarm.alarm_no ?? alarm.id }}</td>
              <td>
                <span class="risk-dot" :class="`risk-dot--${(alarm.alarm_level ?? 'green').toLowerCase()}`" />
                <span>{{ alarm.alarm_level ?? '—' }}</span>
              </td>
              <td>
                <span class="badge" :class="alarmStatusClass(alarm.status)">{{ alarmStatusLabel(alarm.status) }}</span>
              </td>
              <td class="tabular-nums">{{ alarm.trigger_time ?? alarm.alarm_time ?? '—' }}</td>
              <td>{{ alarm.alarm_title ?? alarm.alarm_content ?? alarm.alarm_type ?? '—' }}</td>
            </tr>
          </tbody>
        </table>
      </div>

      <!-- ④ 关联工单区（zone:orders）-->
      <div class="pc-card admin-card" data-zone="orders">
        <div class="admin-card__header">
          <span class="admin-card__title">📋 关联工单</span>
          <span class="admin-card__count">{{ building.workOrders.length }} 条</span>
        </div>

        <div v-if="building.workOrders.length === 0" class="admin-empty admin-empty--inline">
          暂无工单记录
        </div>
        <table v-else class="admin-table">
          <thead>
            <tr>
              <th>工单编号</th>
              <th>工单状态</th>
              <th>等级</th>
              <th>派单时间</th>
              <th>负责单位</th>
              <th>操作</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="order in building.workOrders" :key="order.id">
              <td class="tabular-nums">{{ order.orderNo }}</td>
              <td>
                <span class="badge" :class="orderStatusClass(order.status)">{{ order.status }}</span>
              </td>
              <td>{{ order.orderLevel ?? '—' }}</td>
              <td class="tabular-nums">{{ order.dispatchTime ?? '—' }}</td>
              <td>{{ order.receiveOrg ?? '—' }}</td>
              <td>
                <router-link
                  class="admin-link"
                  :to="`/admin/work-orders/${order.id}`"
                >
                  查看工单 →
                </router-link>
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      <!-- ⑤ 应急处置记录区（zone:emergency）-->
      <div v-if="buildingIncidents.length > 0" class="pc-card admin-card" data-zone="emergency">
        <div class="admin-card__header">
          <span class="admin-card__title">🚨 应急处置记录</span>
          <span class="admin-card__count">{{ buildingIncidents.length }} 条</span>
        </div>

        <div v-for="inc in buildingIncidents" :key="inc.id" class="em-incident-block">
          <!-- 事件头 -->
          <div class="em-incident-block__header">
            <span class="badge" :class="Number(inc.status) === 40 ? 'badge--success' : 'badge--danger'">
              {{ Number(inc.status) === 40 ? '已结案' : '处理中' }}
            </span>
            <span class="em-incident-block__no tabular-nums">{{ inc.incident_no }}</span>
            <span class="em-incident-block__time tabular-nums">触发：{{ inc.trigger_time }}</span>
            <span v-if="inc.close_type === 'REPAIR_ORDER'" class="badge badge--warning">🔧 转修缮工单</span>
            <span v-else-if="inc.close_type === 'REPORT_GOV'" class="badge badge--danger">🏛️ 上报市政府·申请拆除</span>
          </div>

          <!-- 步骤时间轴 -->
          <div class="em-timeline">
            <div
              v-for="(node, idx) in getIncidentTimeline(inc)"
              :key="node.node_code"
              class="em-timeline__item"
              :class="{
                'em-timeline__item--done':    node.confirmed,
                'em-timeline__item--pending': !node.confirmed,
              }"
            >
              <div class="em-timeline__dot" />
              <div class="em-timeline__content">
                <div class="em-timeline__step">步骤 {{ idx + 1 }}：{{ node.node_name }}</div>
                <div v-if="node.confirmed" class="em-timeline__time tabular-nums">
                  确认时间：{{ node.confirm_time }}
                </div>
                <div v-else class="em-timeline__time" style="color:var(--pc-text-placeholder,#9CA3AF)">
                  未执行
                </div>
              </div>
            </div>

            <!-- 结案节点 -->
            <div v-if="Number(inc.status) === 40" class="em-timeline__item em-timeline__item--close">
              <div class="em-timeline__dot em-timeline__dot--close" />
              <div class="em-timeline__content">
                <div class="em-timeline__step">
                  <template v-if="inc.close_type === 'REPAIR_ORDER'">🔧 结案：转修缮工单处置</template>
                  <template v-else-if="inc.close_type === 'REPORT_GOV'">🏛️ 结案：上报市政府，申请整体拆除</template>
                  <template v-else>结案</template>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </template>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from "vue"
import { useRoute } from "vue-router"
import { getBuilding, type BuildingDetail } from "@/services/buildingService"
import { getAnalysisResult, type AnalysisMetricResult } from "@/services/analysisService"
import { getTable } from "@/services/sqliteMirrorRepository"
import {
  getAllIncidents,
  getIncidentOrders,
  getPlanNodes,
  type EmergencyIncident,
  type EmergencyFlowNode,
  type EmergencyOrder,
} from "@/services/emergencyService"

// ── 路由参数 ──────────────────────────────────────────────────────────────────

const route = useRoute()

// ── 响应式状态 ─────────────────────────────────────────────────────────────────

const loading         = ref(true)
const building        = ref(null as BuildingDetail | null)
const analysisMetrics = ref([] as AnalysisMetricResult[])
const buildingAlarms  = ref([] as Array<Record<string, unknown>>)
const buildingIncidents = ref<EmergencyIncident[]>([])

// ── 辅助函数 ──────────────────────────────────────────────────────────────────

function riskDotClass(level: string | null): string {
  const map: Record<string, string> = {
    RED: "risk-dot--red", ORANGE: "risk-dot--orange",
    YELLOW: "risk-dot--yellow", GREEN: "risk-dot--green",
  }
  return map[level ?? "GREEN"] ?? "risk-dot--green"
}

function riskBadgeClass(level: string | null | undefined): string {
  const map: Record<string, string> = {
    RED: "badge--danger", ORANGE: "badge--warning",
    YELLOW: "badge--info", GREEN: "badge--success",
  }
  return map[level ?? "GREEN"] ?? "badge--success"
}

const ALARM_STATUS_LABEL: Record<string, string> = {
  ACTIVE:     "待确认",
  CONFIRMED:  "已确认",
  DISPATCHED: "已派单",
  CLOSED:     "已关闭",
}
const ALARM_STATUS_CLASS: Record<string, string> = {
  ACTIVE:     "badge--danger",
  CONFIRMED:  "badge--warning",
  DISPATCHED: "badge--info",
  CLOSED:     "badge--success",
}
function alarmStatusLabel(status: string): string {
  return ALARM_STATUS_LABEL[status] ?? status
}
function alarmStatusClass(status: string): string {
  return ALARM_STATUS_CLASS[status] ?? "badge--success"
}

function orderStatusClass(status: string): string {
  if (status === "待接单") return "badge--warning"
  if (status === "处理中") return "badge--info"
  if (status === "待核查") return "badge--warning"
  if (status === "已销号") return "badge--success"
  return "badge--success"
}

function metricName(metricId: number): string {
  const names: Record<number, string> = {
    1: "裂缝指标",
    2: "倾角指标",
    3: "综合评分",
  }
  return names[metricId] ?? `指标 ${metricId}`
}

/** 将应急事件步骤与确认记录合并，生成带时间戳的时间轴数据 */
function getIncidentTimeline(inc: EmergencyIncident): Array<{
  node_code: string; node_name: string; confirmed: boolean; confirm_time: string | null
}> {
  const nodes: EmergencyFlowNode[] = getPlanNodes(inc.plan_id)
  const orders: EmergencyOrder[]   = getIncidentOrders(inc.id)
  const orderMap = new Map(orders.map((o) => [o.order_type, o]))
  return nodes.map((node) => {
    const order = orderMap.get(node.node_code)
    return {
      node_code:    node.node_code,
      node_name:    node.node_name,
      confirmed:    !!order,
      confirm_time: order?.confirm_time ?? null,
    }
  })
}

// ── 数据加载 ──────────────────────────────────────────────────────────────────

onMounted(() => {
  const id = Number(route.params.id)
  if (!id) {
    loading.value = false
    return
  }

  // 加载建筑详情
  building.value = getBuilding(id)
  loading.value = false

  if (!building.value) return

  // 加载分析结果
  const result = getAnalysisResult(id)
  if (result.ok) {
    analysisMetrics.value = result.metrics
  }

  // 加载关联告警
  const allAlarms = getTable("alarm_record") as Array<Record<string, unknown>>
  buildingAlarms.value = allAlarms.filter(
    (a) => a.space_id === id || a.building_id === id
  )

  // 加载关联应急事件
  buildingIncidents.value = getAllIncidents().filter(
    (inc) => Number(inc.building_id) === id
  )
})
</script>

<style scoped>
/* ===== 根容器 ===== */
.admin-building-detail {
  padding: 20px 24px;
  display: flex;
  flex-direction: column;
  gap: 16px;
  min-height: 100%;
  background: var(--pc-bg-page, #F0F4F9);
}

/* 顶部返回 + 标题 */
.admin-page-header {
  display: flex;
  flex-direction: column;
  gap: 8px;
}
.admin-back-link {
  font-size: 13px;
  color: var(--pc-primary, #1B6FE8);
  text-decoration: none;
  display: inline-flex;
  align-items: center;
  gap: 4px;
}
.admin-back-link:hover { text-decoration: underline; }

.admin-page-title-wrap {
  display: flex;
  align-items: center;
  gap: 10px;
}
.admin-page-title {
  font-size: 20px;
  font-weight: 700;
  color: var(--pc-text-title, #0F172A);
  margin: 0;
}
.admin-building-detail__code {
  font-size: 13px;
  color: var(--pc-text-muted, #64748B);
}

/* ===== pc-card / admin-card ===== */
.pc-card {
  background: var(--pc-bg-card, #fff);
  border: 1px solid var(--pc-border, #E2E8F0);
  border-radius: var(--radius-lg, 12px);
  box-shadow: var(--pc-shadow-sm, 0 1px 3px rgba(0,0,0,0.08));
  padding: 0;
  overflow: hidden;
}
.admin-card {
  background: var(--pc-bg-card, #fff);
  border: 1px solid var(--pc-border, #E2E8F0);
  border-radius: var(--radius-lg, 12px);
  box-shadow: var(--pc-shadow-sm, 0 1px 3px rgba(0,0,0,0.08));
  overflow: hidden;
}
.admin-card__header {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 14px 20px;
  border-bottom: 1px solid var(--pc-border, #E2E8F0);
  background: var(--pc-bg-page, #F8FAFC);
}
.admin-card__title {
  font-size: 15px;
  font-weight: 600;
  color: var(--pc-text-h1, #1C2B4A);
  flex: 1;
}
.admin-card__count {
  font-size: 12px;
  color: var(--pc-text-muted, #94A3B8);
}

/* ===== 信息网格 ===== */
.admin-info-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(220px, 1fr));
  gap: 0;
  padding: 16px 20px;
  row-gap: 12px;
}
.admin-info-item {
  display: flex;
  flex-direction: column;
  gap: 3px;
}
.admin-info-label {
  font-size: 11px;
  color: var(--pc-text-muted, #94A3B8);
  text-transform: uppercase;
  letter-spacing: 0.5px;
}
.admin-info-value {
  font-size: 14px;
  color: var(--pc-text-body, #374151);
  font-weight: 500;
}

/* ===== 指标卡网格 ===== */
.admin-metrics-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
  gap: 12px;
  padding: 16px 20px;
}
.admin-metric-card {
  border: 1px solid var(--pc-border, #E2E8F0);
  border-radius: var(--radius-md, 8px);
  padding: 14px;
  display: flex;
  flex-direction: column;
  gap: 8px;
}
.admin-metric-card--red    { border-left: 4px solid #FF4444; }
.admin-metric-card--orange { border-left: 4px solid #FF8A3D; }
.admin-metric-card--yellow { border-left: 4px solid #FACC15; }
.admin-metric-card--green  { border-left: 4px solid #10B981; }

.admin-metric-card__header {
  display: flex;
  align-items: center;
  gap: 8px;
}
.admin-metric-card__name {
  font-size: 13px;
  font-weight: 600;
  color: var(--pc-text-h1, #1C2B4A);
  flex: 1;
}
.admin-metric-card__value {
  font-size: 24px;
  font-weight: 700;
  color: var(--pc-text-h1, #1C2B4A);
  display: flex;
  align-items: baseline;
  gap: 4px;
}
.admin-metric-card__unit { font-size: 14px; color: var(--pc-text-muted, #94A3B8); font-weight: 400; }
.admin-metric-card__time { font-size: 11px; color: var(--pc-text-muted, #94A3B8); }

/* ===== 表格 ===== */
.admin-table {
  width: 100%;
  border-collapse: collapse;
  font-size: 13px;
}
.admin-table th,
.admin-table td {
  padding: 10px 20px;
  text-align: left;
  border-bottom: 1px solid var(--pc-border, #E2E8F0);
  color: var(--pc-text-body, #374151);
}
.admin-table th {
  font-weight: 600;
  color: var(--pc-text-muted, #64748B);
  background: var(--pc-bg-page, #F8FAFC);
  font-size: 12px;
  text-transform: uppercase;
}
.admin-table tr:last-child td { border-bottom: none; }
.admin-table tr:hover td { background: rgba(27,111,232,0.03); }

/* ===== risk-dot ===== */
.risk-dot {
  width: 10px;
  height: 10px;
  border-radius: 50%;
  flex-shrink: 0;
  display: inline-block;
}
.risk-dot--red    { background: var(--risk-red,    #FF4444); }
.risk-dot--orange { background: var(--risk-orange, #FF8A3D); }
.risk-dot--yellow { background: var(--risk-yellow, #FACC15); }
.risk-dot--green  { background: var(--risk-green,  #10B981); }

/* ===== badge ===== */
.badge {
  display: inline-flex;
  align-items: center;
  padding: 2px 8px;
  border-radius: var(--radius-full, 9999px);
  font-size: 11px;
  font-weight: 500;
  white-space: nowrap;
}
.badge--danger  { background: #FEE2E2; color: #EF4444; }
.badge--warning { background: #FEF3C7; color: #D97706; }
.badge--info    { background: #EDE9FE; color: #8B5CF6; }
.badge--success { background: #D1FAE5; color: #10B981; }

/* ===== 空状态 ===== */
.admin-empty {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 40px 20px;
  gap: 10px;
  color: var(--pc-text-muted, #94A3B8);
  text-align: center;
}
.admin-empty--inline {
  padding: 20px 20px;
  flex-direction: row;
  justify-content: flex-start;
  font-size: 13px;
}

.admin-loading {
  padding: 40px;
  text-align: center;
  color: var(--pc-text-muted, #94A3B8);
}

/* ===== 链接与按钮 ===== */
.admin-link {
  color: var(--pc-primary, #1B6FE8);
  text-decoration: none;
  font-weight: 500;
  font-size: 13px;
}
.admin-link:hover { text-decoration: underline; }
.btn-pc-secondary {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  padding: 8px 16px;
  background: #fff;
  color: var(--pc-primary, #1B6FE8);
  border: 1px solid var(--pc-primary, #1B6FE8);
  border-radius: var(--radius-md, 8px);
  font-size: 14px;
  font-weight: 500;
  cursor: pointer;
  text-decoration: none;
}
.btn-sm { padding: 5px 12px; font-size: 12px; }

/* ===== 颜色辅助 ===== */
.text-success { color: var(--color-success, #10B981); }
.text-muted   { color: var(--pc-text-muted, #94A3B8); }

/* ===== 应急时间轴 ===== */
.em-incident-block {
  border: 1px solid var(--pc-border, #E5E7EB);
  border-radius: 8px;
  padding: 14px 16px;
  margin-bottom: 12px;
}
.em-incident-block:last-child { margin-bottom: 0; }
.em-incident-block__header {
  display: flex;
  align-items: center;
  gap: 10px;
  flex-wrap: wrap;
  margin-bottom: 14px;
}
.em-incident-block__no { font-size: 13px; color: var(--pc-text-body, #374151); font-variant-numeric: tabular-nums; }
.em-incident-block__time { font-size: 12px; color: var(--pc-text-muted, #9CA3AF); font-variant-numeric: tabular-nums; margin-left: auto; }

.em-timeline { display: flex; flex-direction: column; gap: 0; padding-left: 8px; }
.em-timeline__item {
  display: flex;
  align-items: flex-start;
  gap: 12px;
  padding-bottom: 14px;
  position: relative;
}
.em-timeline__item::before {
  content: '';
  position: absolute;
  left: 7px;
  top: 20px;
  bottom: 0;
  width: 2px;
  background: var(--pc-border, #E5E7EB);
}
.em-timeline__item:last-child::before { display: none; }
.em-timeline__dot {
  width: 16px;
  height: 16px;
  border-radius: 50%;
  flex-shrink: 0;
  margin-top: 2px;
  background: var(--pc-border, #D1D5DB);
  border: 2px solid #fff;
  box-shadow: 0 0 0 2px var(--pc-border, #D1D5DB);
  z-index: 1;
}
.em-timeline__item--done .em-timeline__dot   { background: #10B981; box-shadow: 0 0 0 2px #10B981; }
.em-timeline__item--close .em-timeline__dot  { background: #1B6FE8; box-shadow: 0 0 0 2px #1B6FE8; }
.em-timeline__dot--close { background: #1B6FE8 !important; }
.em-timeline__content { flex: 1; }
.em-timeline__step  { font-size: 13px; font-weight: 500; color: var(--pc-text-body, #374151); }
.em-timeline__item--pending .em-timeline__step { color: var(--pc-text-muted, #9CA3AF); }
.em-timeline__time  { font-size: 12px; color: var(--pc-text-muted, #9CA3AF); margin-top: 2px; font-variant-numeric: tabular-nums; }
</style>

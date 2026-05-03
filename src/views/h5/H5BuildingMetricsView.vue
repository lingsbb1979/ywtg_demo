<template>
  <!--
    T15.104 H5 建筑指标页 /h5/building/:id/metrics
    ─────────────────────────────────────────────────────────────
    展示建筑基本信息 + 物联网指标 + 风险等级说明
    数据来源：iot_space 表 + iot_measure_point 表 + alarm_record 表
    ─────────────────────────────────────────────────────────────
  -->
  <div class="h5-building-metrics h5-main" style="background: var(--h5-bg-page, #F7F9FC)">

    <!-- ===== 加载中 ===== -->
    <div v-if="loading" class="h5-building-metrics__loading">
      <span style="color:var(--h5-text-muted,#94A3B8)">加载中...</span>
    </div>

    <!-- ===== 无数据 ===== -->
    <div v-else-if="!building" class="h5-building-metrics__empty">
      <span class="h5-empty-icon">🏚</span>
      <p>未找到建筑数据</p>
      <button class="h5-btn-primary" @click="goBack">返回</button>
    </div>

    <!-- ===== 主内容 ===== -->
    <div v-else class="h5-building-metrics__content">

      <!-- 建筑基本信息 Banner -->
      <div
        class="h5-building-metrics__banner"
        :class="`h5-building-metrics__banner--${riskColor}`"
      >
        <div class="h5-building-metrics__banner-top">
          <h2 class="h5-building-metrics__building-name">{{ building.name }}</h2>
          <span class="h5-building-metrics__risk-badge badge"
            :class="`h5-risk-level--${riskColor}`">
            {{ riskLabel }}
          </span>
        </div>
        <div class="h5-building-metrics__banner-code tabular-nums">
          建筑编码：{{ building.space_code ?? '—' }}
        </div>
      </div>

      <!-- 风险说明卡片 -->
      <div class="h5-card h5-building-metrics__section" data-zone="risk-desc">
        <div class="h5-building-metrics__section-title">风险说明</div>
        <div class="h5-building-metrics__risk-row">
          <span class="risk-dot" :class="`risk-dot--${riskColor}`" />
          <span class="h5-building-metrics__risk-text">{{ riskDesc }}</span>
        </div>
        <div class="h5-building-metrics__alarm-row">
          <span class="h5-building-metrics__alarm-label">当前活跃告警：</span>
          <span
            class="h5-building-metrics__alarm-count tabular-nums"
            :class="activeAlarmCount > 0 ? 'h5-building-metrics__alarm-count--warn' : ''"
          >
            {{ activeAlarmCount }} 条
          </span>
        </div>
      </div>

      <!-- IoT 实时遥测数据 -->
      <div class="h5-card h5-building-metrics__section" data-zone="iot-telemetry">
        <div class="h5-building-metrics__section-title">📡 IoT 实时采集数据</div>
        <div v-if="iotSummary && iotSummary.points.length > 0" class="h5-iot-points">
          <div
            v-for="pt in iotSummary.points"
            :key="pt.pointId"
            class="h5-iot-point"
          >
            <div class="h5-iot-point__head">
              <span class="h5-iot-point__name">{{ pt.factorName }}</span>
              <span class="h5-iot-point__code">{{ pt.factorCode }}</span>
            </div>
            <div class="h5-iot-point__row">
              <span
                class="h5-iot-point__value tabular-nums"
                :class="h5ValueClass(pt)"
              >
                {{ pt.latestValue !== null ? pt.latestValue.toFixed(2) : '--' }}
              </span>
              <span class="h5-iot-point__unit">{{ pt.unit }}</span>
              <span class="h5-iot-point__ts tabular-nums">{{ pt.latestTs?.slice(11, 19) ?? '--' }}</span>
            </div>
            <div class="h5-iot-point__thresholds">
              橙色: ≥{{ pt.limitH ?? '--' }} · 红色: ≥{{ pt.limitHh ?? '--' }}
            </div>
            <!-- 最近10条 -->
            <div v-if="pt.recent10.length > 0" class="h5-iot-sparkline">
              <span
                v-for="(r, i) in pt.recent10"
                :key="i"
                class="h5-iot-spark"
                :class="h5SparkClass(pt, r.value)"
                :title="`${r.ts}: ${r.value}`"
              >{{ r.value !== null ? r.value.toFixed(1) : '·' }}</span>
            </div>
          </div>
        </div>
        <div v-else class="h5-building-metrics__empty-hint">
          暂无遥测数据，请先初始化演示数据
        </div>
      </div>

      <!-- 分析结果 —— 每指标一张卡片，仅展示最新一批计算结果 -->
      <div v-if="analysisResults.length > 0" class="h5-card h5-building-metrics__section" data-zone="analysis">
        <div class="h5-analysis-header">
          <span class="h5-building-metrics__section-title" style="margin-bottom:0">风险分析结果</span>
          <span class="h5-analysis-header__time tabular-nums">{{ analysisResults[0].calc_time?.slice(11,19) ?? '' }}</span>
        </div>
        <div class="h5-analysis-cards">
          <div
            v-for="ar in analysisResults"
            :key="ar.metric_id"
            class="h5-analysis-card"
            :class="`h5-analysis-card--${(ar.risk_level ?? 'green').toLowerCase()}`"
          >
            <div class="h5-analysis-card__top">
              <span class="h5-analysis-card__name">{{ ar.metricName }}</span>
              <span class="h5-tag h5-analysis-card__badge"
                :class="`h5-tag--${(ar.risk_level ?? 'green').toLowerCase()}`">
                {{ ar.risk_level ?? 'GREEN' }}
              </span>
            </div>
            <div class="h5-analysis-card__value tabular-nums">
              {{ ar.value_num !== null ? ar.value_num.toFixed(1) : '—' }}
              <span class="h5-analysis-card__unit">{{ ar.unit }}</span>
            </div>
          </div>
        </div>
      </div>

    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from "vue"
import { useRoute, useRouter } from "vue-router"
import { getTable } from "@/services/sqliteMirrorRepository"
import { getBuildingIotSummary, type BuildingIotSummary } from "@/services/iotDemoService"

// ── 路由 ──────────────────────────────────────────────────────────────────────
const route  = useRoute()
const router = useRouter()

// ── 数据接口 ──────────────────────────────────────────────────────────────────
interface SpaceRow {
  id: number
  space_code: string
  name: string
  type: string
  latitude:  number | null
  longitude: number | null
  risk_level: string | null
}

interface MeasurePointRow {
  id:           number
  space_id:     number | null
  point_code:   string
  name:         string | null
  measure_type: string | null
  data_type:    string | null
  unit:         string | null
  latest_value: string | null
  alarm_level:  string | null
}

interface MetricDisplay {
  id:           number
  pointCode:    string
  name:         string | null
  measureType:  string | null
  dataType:     string | null
  unit:         string | null
  latestValue:  string | null
  alarmLevel:   string | null
}

/** 实际 space_analysis_archive 字段 */
interface AnalysisArchiveRow {
  id:         number
  space_id:   number
  metric_id:  number
  calc_time:  string | null
  value_num:  number | null
  risk_level: string | null
}

/** 展示用对象（metric_id 映射为可读名称） */
interface AnalysisDisplayItem {
  metric_id:  number
  metricName: string
  unit:       string
  value_num:  number | null
  risk_level: string | null
  calc_time:  string | null
}

const METRIC_INFO: Record<number, { name: string; unit: string }> = {
  1: { name: "裂缝扩展分析", unit: "mm" },
  2: { name: "结构变形分析", unit: "°" },
  3: { name: "综合风险评估", unit: "分" },
}

// ── 响应式状态 ─────────────────────────────────────────────────────────────────
const loading          = ref(true)
const building         = ref(null as SpaceRow | null)
const analysisResults  = ref<AnalysisDisplayItem[]>([])
const activeAlarmCount = ref(0)
const activeAlarmLevel = ref("GREEN")  // 当前最高活跃告警级别
const iotSummary       = ref(null as BuildingIotSummary | null)

const RISK_ORDER: Record<string, number> = { GREEN: 0, YELLOW: 1, ORANGE: 2, RED: 3 }

type IotPoint = BuildingIotSummary["points"][number]

function h5ValueClass(pt: IotPoint): string {
  const v = pt.latestValue
  if (v === null) return ""
  if (pt.limitHh !== null && v >= pt.limitHh) return "h5-val--red"
  if (pt.limitH  !== null && v >= pt.limitH)  return "h5-val--orange"
  return "h5-val--green"
}

function h5SparkClass(pt: IotPoint, v: number | null): string {
  if (v === null) return "spark-gray"
  if (pt.limitHh !== null && v >= pt.limitHh) return "spark-red"
  if (pt.limitH  !== null && v >= pt.limitH)  return "spark-orange"
  return "spark-green"
}

// ── 计算属性 ──────────────────────────────────────────────────────────────────
// riskColor 以活跃告警级别为准（ACTIVE / PENDING），无告警则降为 GREEN
const riskColor = computed<string>(() => {
  const level = activeAlarmLevel.value.toUpperCase()
  const map: Record<string, string> = {
    RED: "red", ORANGE: "orange", YELLOW: "yellow", GREEN: "green",
  }
  return map[level] ?? "green"
})

const riskLabel = computed<string>(() => {
  const level = activeAlarmLevel.value.toUpperCase()
  const map: Record<string, string> = {
    RED: "高危", ORANGE: "中高危", YELLOW: "中危", GREEN: "低危",
  }
  return map[level] ?? "低危"
})

const riskDesc = computed<string>(() => {
  const level = activeAlarmLevel.value.toUpperCase()
  const map: Record<string, string> = {
    RED:    "当前建筑存在高风险隐患，需立即处置",
    ORANGE: "当前建筑存在中高风险隐患，请尽快跟进",
    YELLOW: "当前建筑存在中等风险，建议关注",
    GREEN:  "当前建筑风险较低，持续监测中",
  }
  return map[level] ?? "持续监测中"
})

// ── 数据加载 ──────────────────────────────────────────────────────────────────
onMounted(() => {
  const idParam = route.params.id
  const id = Number(Array.isArray(idParam) ? idParam[0] : idParam)
  if (Number.isNaN(id) || id <= 0) {
    loading.value = false
    return
  }

  // 建筑信息
  const spaces = getTable<SpaceRow>("iot_space")
  building.value = spaces.find(s => s.id === id) ?? null

  // 分析结果：只取最新批次（最大 calc_time），每指标去重，按 metric_id 排序
  const archiveRows = getTable<AnalysisArchiveRow>("space_analysis_archive")
    .filter(a => a.space_id === id)
  const latestCalcTime = archiveRows.reduce((max, r) => {
    const ct = r.calc_time ?? ""
    return ct > max ? ct : max
  }, "")
  const seen = new Set<number>()
  analysisResults.value = archiveRows
    .filter(r => r.calc_time === latestCalcTime)
    .filter(r => { if (seen.has(r.metric_id)) return false; seen.add(r.metric_id); return true })
    .sort((a, b) => a.metric_id - b.metric_id)
    .map(r => ({
      metric_id:  r.metric_id,
      metricName: METRIC_INFO[r.metric_id]?.name ?? `指标${r.metric_id}`,
      unit:       METRIC_INFO[r.metric_id]?.unit ?? "",
      value_num:  r.value_num,
      risk_level: r.risk_level,
      calc_time:  r.calc_time,
    }))

  // 活跃告警数 + 最高告警级别
  const alarmRows = getTable<{ building_id: number; status: string; alarm_level: string }>("alarm_record")
  const activeAlarms = alarmRows.filter(
    a => a.building_id === id && (a.status === "ACTIVE" || a.status === "PENDING")
  )
  activeAlarmCount.value = activeAlarms.length
  let worstLevel = "GREEN"
  for (const a of activeAlarms) {
    const lvl = (a.alarm_level ?? "GREEN").toUpperCase()
    if ((RISK_ORDER[lvl] ?? 0) > (RISK_ORDER[worstLevel] ?? 0)) worstLevel = lvl
  }
  activeAlarmLevel.value = worstLevel

  // IoT 遥测汇总
  iotSummary.value = getBuildingIotSummary(id)

  loading.value = false
})

function goBack() {
  router.back()
}
</script>

<style scoped>
/* ===== 根容器 ===== */
.h5-building-metrics {
  min-height: 100vh;
  background: var(--h5-bg-page, #F7F9FC);
  padding-bottom: calc(var(--h5-tabbar-height, 56px) + env(safe-area-inset-bottom) + 16px);
}

/* ===== 加载/空状态 ===== */
.h5-building-metrics__loading,
.h5-building-metrics__empty {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 60px 24px;
  gap: 16px;
}

/* ===== 主内容 ===== */
.h5-building-metrics__content {
  display: flex;
  flex-direction: column;
  gap: 12px;
  padding: 0 0 16px;
}

/* ===== Banner ===== */
.h5-building-metrics__banner {
  padding: 20px 16px;
  border-bottom: 3px solid var(--h5-border, #EEF2F7);
}

.h5-building-metrics__banner--red    { border-color: var(--risk-red, #FF4444); background: rgba(255,68,68,0.04); }
.h5-building-metrics__banner--orange { border-color: var(--risk-orange, #FF6B00); background: rgba(255,107,0,0.04); }
.h5-building-metrics__banner--yellow { border-color: var(--risk-yellow, #F59E0B); background: rgba(245,158,11,0.04); }
.h5-building-metrics__banner--green  { border-color: var(--risk-green, #10B981); background: rgba(16,185,129,0.04); }

.h5-building-metrics__banner-top {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  margin-bottom: 6px;
}

.h5-building-metrics__building-name {
  font-size: 18px;
  font-weight: 600;
  color: var(--h5-text-h1, #1C2B4A);
  margin: 0;
}

.h5-building-metrics__risk-badge {
  flex-shrink: 0;
  padding: 3px 10px;
  border-radius: 4px;
  font-size: 12px;
  font-weight: 600;
}

.h5-building-metrics__banner-code {
  font-size: 12px;
  color: var(--h5-text-muted, #94A3B8);
}

/* ===== 区块 ===== */
.h5-building-metrics__section {
  margin: 0 16px;
  padding: 16px;
  border-radius: var(--radius-lg, 12px);
  background: var(--h5-bg-card, #fff);
  box-shadow: var(--h5-shadow-card, 0 2px 12px rgba(0,0,0,0.06));
}

.h5-building-metrics__section-title {
  font-size: 14px;
  font-weight: 600;
  color: var(--h5-text-h1, #1C2B4A);
  margin-bottom: 12px;
}

/* ===== 风险说明 ===== */
.h5-building-metrics__risk-row {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 8px;
}

.h5-building-metrics__risk-text {
  font-size: 14px;
  color: var(--h5-text-body, #334155);
}

.h5-building-metrics__alarm-row {
  display: flex;
  align-items: center;
  gap: 4px;
  font-size: 13px;
}

.h5-building-metrics__alarm-label {
  color: var(--h5-text-muted, #94A3B8);
}

.h5-building-metrics__alarm-count {
  font-weight: 600;
  color: var(--h5-text-h1, #1C2B4A);
}

.h5-building-metrics__alarm-count--warn {
  color: var(--risk-red, #FF4444);
}

/* ===== 指标列表 ===== */
.h5-building-metrics__empty-hint {
  font-size: 13px;
  color: var(--h5-text-muted, #94A3B8);
  text-align: center;
  padding: 16px 0;
}

.h5-building-metrics__metrics-list {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.h5-building-metrics__metric-item {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 10px 12px;
  border-radius: 8px;
  background: var(--h5-bg-page, #F7F9FC);
  border: 1px solid var(--h5-border, #EEF2F7);
}

.h5-building-metrics__metric-info {
  display: flex;
  flex-direction: column;
  gap: 2px;
  min-width: 0;
  flex: 1;
}

.h5-building-metrics__metric-name {
  font-size: 13px;
  font-weight: 500;
  color: var(--h5-text-h1, #1C2B4A);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.h5-building-metrics__metric-type {
  font-size: 11px;
  color: var(--h5-text-muted, #94A3B8);
}

.h5-building-metrics__metric-right {
  display: flex;
  align-items: center;
  gap: 6px;
  flex-shrink: 0;
}

.h5-building-metrics__metric-value {
  font-size: 13px;
  font-weight: 600;
  color: var(--h5-text-h1, #1C2B4A);
}

/* ===== 分析结果 ===== */
.h5-analysis-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 12px;
}
.h5-analysis-header__time {
  font-size: 11px;
  color: var(--h5-text-muted, #94A3B8);
}
.h5-analysis-cards {
  display: flex;
  flex-direction: column;
  gap: 8px;
}
.h5-analysis-card {
  padding: 12px 14px;
  border-radius: 8px;
  border-left: 3px solid var(--h5-border, #E2E8F0);
  background: var(--h5-bg-page, #F7F9FC);
}
.h5-analysis-card--red    { border-left-color: #EF4444; background: rgba(239,68,68,0.04); }
.h5-analysis-card--orange { border-left-color: #F97316; background: rgba(249,115,22,0.04); }
.h5-analysis-card--yellow { border-left-color: #EAB308; background: rgba(234,179,8,0.04); }
.h5-analysis-card--green  { border-left-color: #22C55E; background: rgba(34,197,94,0.04); }
.h5-analysis-card__top {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 6px;
}
.h5-analysis-card__name {
  font-size: 13px;
  font-weight: 600;
  color: var(--h5-text-h1, #1C2B4A);
}
.h5-analysis-card__badge {
  font-size: 11px;
  padding: 2px 8px;
  border-radius: 4px;
}
.h5-analysis-card__value {
  font-size: 22px;
  font-weight: 700;
  color: var(--h5-text-h1, #1C2B4A);
  line-height: 1.2;
}
.h5-analysis-card--red    .h5-analysis-card__value { color: #DC2626; }
.h5-analysis-card--orange .h5-analysis-card__value { color: #EA580C; }
.h5-analysis-card--yellow .h5-analysis-card__value { color: #CA8A04; }
.h5-analysis-card--green  .h5-analysis-card__value { color: #16A34A; }
.h5-analysis-card__unit {
  font-size: 13px;
  font-weight: 400;
  color: var(--h5-text-muted, #64748B);
  margin-left: 4px;
}

/* ===== IoT 遥测 ===== */
.h5-iot-points {
  display: flex;
  flex-direction: column;
  gap: 12px;
}
.h5-iot-point {
  padding: 10px;
  border: 1px solid var(--h5-border, #EEF2F7);
  border-radius: 8px;
  background: var(--h5-bg-card, #fff);
}
.h5-iot-point__head {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 4px;
}
.h5-iot-point__name {
  font-size: 13px;
  font-weight: 600;
  color: var(--h5-text-title, #1C2B4A);
}
.h5-iot-point__code {
  font-size: 11px;
  padding: 1px 6px;
  background: rgba(27,111,232,0.08);
  color: var(--h5-primary, #1B6FE8);
  border-radius: 4px;
}
.h5-iot-point__row {
  display: flex;
  align-items: baseline;
  gap: 4px;
  margin-bottom: 2px;
}
.h5-iot-point__value {
  font-size: 22px;
  font-weight: 700;
}
.h5-val--green  { color: #059669; }
.h5-val--orange { color: #D97706; }
.h5-val--red    { color: #DC2626; }
.h5-iot-point__unit {
  font-size: 12px;
  color: var(--h5-text-muted, #94A3B8);
}
.h5-iot-point__ts {
  font-size: 11px;
  color: var(--h5-text-muted, #94A3B8);
  margin-left: auto;
}
.h5-iot-point__thresholds {
  font-size: 11px;
  color: var(--h5-text-muted, #94A3B8);
  margin-bottom: 6px;
}
.h5-iot-sparkline {
  display: flex;
  flex-wrap: wrap;
  gap: 3px;
}
.h5-iot-spark {
  display: inline-block;
  padding: 2px 5px;
  border-radius: 3px;
  font-size: 10px;
  font-family: var(--font-mono, monospace);
  font-weight: 600;
}
.spark-green  { background: #D1FAE5; color: #059669; }
.spark-orange { background: #FEF3C7; color: #D97706; }
.spark-red    { background: #FEE2E2; color: #DC2626; }
.spark-gray   { background: #F1F5F9; color: #94A3B8; }
</style>

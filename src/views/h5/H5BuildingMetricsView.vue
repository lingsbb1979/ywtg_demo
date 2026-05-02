<template>
  <!--
    T15.104 H5 建筑指标页 /h5/building/:id/metrics
    ─────────────────────────────────────────────────────────────
    展示建筑基本信息 + 物联网指标 + 风险等级说明
    数据来源：iot_space 表 + iot_measure_point 表 + alarm_record 表
    ─────────────────────────────────────────────────────────────
  -->
  <div class="h5-building-metrics h5-main" style="background: var(--h5-bg-page, #F7F9FC)">

    <!-- ===== 顶部导航栏 ===== -->
    <header class="h5-header">
      <button class="h5-header__back" @click="goBack">←</button>
      <span class="h5-header__title">建筑指标</span>
      <div class="h5-header__actions" />
    </header>

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

      <!-- 监测指标列表 -->
      <div class="h5-card h5-building-metrics__section" data-zone="metrics">
        <div class="h5-building-metrics__section-title">监测指标</div>
        <div v-if="metrics.length === 0" class="h5-building-metrics__empty-hint">
          暂无监测指标数据
        </div>
        <div v-else class="h5-building-metrics__metrics-list">
          <div
            v-for="item in metrics"
            :key="item.id"
            class="h5-building-metrics__metric-item h5-list-item"
          >
            <div class="h5-building-metrics__metric-info">
              <span class="h5-building-metrics__metric-name">{{ item.name ?? item.pointCode }}</span>
              <span class="h5-building-metrics__metric-type">{{ item.measureType ?? item.dataType ?? '—' }}</span>
            </div>
            <div class="h5-building-metrics__metric-right">
              <span class="h5-building-metrics__metric-value tabular-nums">
                {{ item.latestValue ?? '—' }} {{ item.unit ?? '' }}
              </span>
              <span
                v-if="item.alarmLevel"
                class="h5-tag"
                :class="`h5-tag--${(item.alarmLevel).toLowerCase()}`"
              >
                {{ item.alarmLevel }}
              </span>
            </div>
          </div>
        </div>
      </div>

      <!-- 分析结果 -->
      <div v-if="analysisResults.length > 0" class="h5-card h5-building-metrics__section" data-zone="analysis">
        <div class="h5-building-metrics__section-title">分析结果</div>
        <div class="h5-building-metrics__analysis-list">
          <div
            v-for="ar in analysisResults"
            :key="ar.id"
            class="h5-building-metrics__analysis-item"
          >
            <span class="risk-dot" :class="`risk-dot--${(ar.risk_level ?? 'green').toLowerCase()}`" />
            <div class="h5-building-metrics__analysis-body">
              <span class="h5-building-metrics__analysis-factor">{{ ar.factor_name ?? ar.factor_code ?? '—' }}</span>
              <span class="h5-building-metrics__analysis-value tabular-nums">
                风险值：{{ ar.risk_score ?? ar.factor_value ?? '—' }}
              </span>
            </div>
            <span
              class="h5-tag"
              :class="`h5-tag--${(ar.risk_level ?? 'green').toLowerCase()}`"
            >
              {{ ar.risk_level ?? 'GREEN' }}
            </span>
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

interface AnalysisRow {
  id:           number
  space_id:     number | null
  factor_code:  string | null
  factor_name:  string | null
  factor_value: number | null
  risk_score:   number | null
  risk_level:   string | null
}

// ── 响应式状态 ─────────────────────────────────────────────────────────────────
const loading         = ref(true)
const building        = ref(null as SpaceRow | null)
const metrics         = ref<MetricDisplay[]>([])
const analysisResults = ref<AnalysisRow[]>([])
const activeAlarmCount = ref(0)

// ── 计算属性 ──────────────────────────────────────────────────────────────────
const riskColor = computed<string>(() => {
  const level = building.value?.risk_level ?? ""
  const map: Record<string, string> = {
    RED: "red", ORANGE: "orange", YELLOW: "yellow", GREEN: "green",
  }
  return map[level.toUpperCase()] ?? "green"
})

const riskLabel = computed<string>(() => {
  const level = (building.value?.risk_level ?? "GREEN").toUpperCase()
  const map: Record<string, string> = {
    RED: "高危", ORANGE: "中高危", YELLOW: "中危", GREEN: "低危",
  }
  return map[level] ?? "低危"
})

const riskDesc = computed<string>(() => {
  const level = (building.value?.risk_level ?? "GREEN").toUpperCase()
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

  // 监测指标
  const points = getTable<MeasurePointRow>("iot_measure_point")
  metrics.value = points
    .filter(p => p.space_id === id)
    .map(p => ({
      id:          p.id,
      pointCode:   p.point_code,
      name:        p.name         ?? null,
      measureType: p.measure_type ?? null,
      dataType:    p.data_type    ?? null,
      unit:        p.unit         ?? null,
      latestValue: p.latest_value ?? null,
      alarmLevel:  p.alarm_level  ?? null,
    }))

  // 分析结果
  const analysisRows = getTable<AnalysisRow>("space_analysis_archive")
  analysisResults.value = analysisRows
    .filter(a => a.space_id === id)
    .slice(0, 10)

  // 活跃告警数
  const alarmRows = getTable<{ building_id: number; status: string }>("alarm_record")
  activeAlarmCount.value = alarmRows.filter(
    a => a.building_id === id && (a.status === "ACTIVE" || a.status === "PENDING")
  ).length

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

/* ===== 顶部导航 ===== */
.h5-header {
  position: sticky;
  top: 0;
  z-index: 10;
  display: flex;
  align-items: center;
  height: var(--h5-header-height, 56px);
  padding: 0 16px;
  background: linear-gradient(135deg, #0E3875 0%, #1B6FE8 100%);
  border-bottom: 1px solid rgba(255,255,255,0.1);
  gap: 12px;
}

.h5-header__back {
  background: none;
  border: none;
  color: #fff;
  font-size: 20px;
  cursor: pointer;
  padding: 0;
  line-height: 1;
  min-width: 32px;
  min-height: var(--h5-touch-min, 44px);
  display: flex;
  align-items: center;
}

.h5-header__title {
  flex: 1;
  font-size: 17px;
  font-weight: 600;
  color: #fff;
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
.h5-building-metrics__analysis-list {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.h5-building-metrics__analysis-item {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 8px 10px;
  border-radius: 6px;
  background: var(--h5-bg-page, #F7F9FC);
}

.h5-building-metrics__analysis-body {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.h5-building-metrics__analysis-factor {
  font-size: 13px;
  font-weight: 500;
  color: var(--h5-text-h1, #1C2B4A);
}

.h5-building-metrics__analysis-value {
  font-size: 11px;
  color: var(--h5-text-muted, #94A3B8);
}
</style>

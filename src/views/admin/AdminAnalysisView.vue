<template>
  <!--
    T15.91 管理端数据分析页 /admin/analysis
    ─────────────────────────────────────────────────────────────
    低保真线框（Wireframe）数据分析：
    ┌─── 页面标题：数据分析 / 风险分析中心 ──────────────────────┐
    │  分析结果管理 · 可查看最新风险评分并重新计算               │
    ├─── zone:select（建筑选择区）──────────────────────────────│
    │  [选择建筑 ▼]  [查看分析结果]  [重新计算风险]            │
    ├─── zone:result（分析结果区）──────────────────────────────│
    │  ┌── 裂缝 metricId=1 ──────────────────────────────┐      │
    │  │  ● ORANGE  最新值：2.3mm   计算时间：xx          │      │
    │  │  阈值区间：GREEN<1, YELLOW<2, ORANGE<5, RED≥5    │      │
    │  └────────────────────────────────────────────────┘      │
    │  ┌── 综合评分 metricId=3 ──────────────────────────┐      │
    │  │  ● GREEN   最新值：35.6    计算时间：xx          │      │
    │  └────────────────────────────────────────────────┘      │
    └────────────────────────────────────────────────────────────┘

    数据来源：
    - analysisService.getAnalysisResult(buildingId)
    - analysisService.calculateBuildingRisk(buildingId)
    - buildingService.listBuildings() 获取建筑选项
  -->

  <div class="admin-analysis" style="background:var(--pc-bg-page,#F0F4F9)">
    <!-- 页面标题 -->
    <div class="admin-page-header">
      <h2 class="admin-page-title">📊 数据分析 — 风险分析中心</h2>
      <span class="admin-page-subtitle">分析结果管理 · 可查看各建筑最新风险评分并重新计算</span>
    </div>

    <!-- ① 建筑选择区（zone:select）-->
    <div class="pc-card admin-card admin-analysis-select" data-zone="select">
      <!-- 建筑选择 -->
      <div class="admin-form-group">
        <label class="admin-form-label">选择建筑</label>
        <select v-model="selectedBuildingId" class="select-pc">
          <option :value="null">-- 请选择建筑 --</option>
          <option v-for="b in buildingList" :key="b.id" :value="b.id">
            {{ b.name }}（{{ b.spaceCode }}）
          </option>
        </select>
      </div>

      <!-- 查看分析结果按钮 -->
      <button
        class="btn-pc-primary"
        :disabled="!selectedBuildingId"
        @click="loadAnalysis"
      >
        查看分析结果
      </button>

      <!-- 重新计算按钮 -->
      <button
        class="btn-pc-secondary"
        :disabled="!selectedBuildingId || calcLoading"
        @click="doCalculate"
      >
        {{ calcLoading ? '计算中…' : '重新计算风险' }}
      </button>

      <!-- 操作反馈 -->
      <div v-if="msg" class="admin-msg" :class="msgClass">{{ msg }}</div>
    </div>

    <!-- ② 分析结果展示区（zone:result）-->
    <div class="pc-card admin-card" data-zone="result">
      <div class="admin-card__header">
        <span class="admin-card__title">🔬 最新分析结果</span>
        <span v-if="selectedBuildingId" class="admin-card__subtitle">
          建筑 ID：{{ selectedBuildingId }}
        </span>
      </div>

      <!-- 空状态：尚未选择或无结果 -->
      <div v-if="!selectedBuildingId" class="admin-empty admin-empty--center">
        请先选择建筑，点击"查看分析结果"或"重新计算风险"
      </div>
      <div v-else-if="metrics.length === 0" class="admin-empty admin-empty--center">
        尚未计算分析结果，请点击"重新计算风险"触发计算
      </div>

      <!-- 指标卡网格 -->
      <div v-else class="admin-metrics-grid">
        <div
          v-for="metric in metrics"
          :key="metric.metricId"
          class="admin-metric-card"
          :class="`admin-metric-card--${metric.riskLevel.toLowerCase()}`"
        >
          <!-- 卡片头部 -->
          <div class="admin-metric-card__header">
            <span class="risk-dot" :class="`risk-dot--${metric.riskLevel.toLowerCase()}`" />
            <span class="admin-metric-card__name">{{ metricName(metric.metricId) }}</span>
            <span class="badge" :class="riskBadgeClass(metric.riskLevel)">
              {{ metric.riskLevel }}
            </span>
          </div>

          <!-- 数值 -->
          <div class="admin-metric-card__value tabular-nums">
            {{ metric.latestValue }}
            <span class="admin-metric-card__unit">{{ metric.unit }}</span>
          </div>

          <!-- 计算时间 -->
          <div class="admin-metric-card__time tabular-nums">
            最新计算：{{ metric.calcTime }}
          </div>

          <!-- 阈值说明 -->
          <div class="admin-metric-card__thresholds">
            <span v-for="(val, key) in metric.riskLevelDesc" :key="key" class="admin-threshold-tag">
              {{ String(key).toUpperCase() }}
            </span>
          </div>
        </div>
      </div>
    </div>

    <!-- ③ 遥测数据区（zone:telemetry）— 最新值 + 最近10条 -->
    <div v-if="selectedBuildingId && iotSummary" class="pc-card admin-card" data-zone="telemetry">
      <div class="admin-card__header">
        <span class="admin-card__title">📡 IoT 最新采集数据</span>
        <span class="admin-card__subtitle">{{ iotSummary.buildingName }}（{{ iotSummary.spaceCode }}）</span>
        <button class="btn-pc-secondary btn-sm" style="margin-left:auto" @click="loadIotSummary">↻ 刷新</button>
      </div>
      <div class="admin-telemetry-points">
        <div
          v-for="pt in iotSummary.points"
          :key="pt.pointId"
          class="admin-tele-point"
        >
          <div class="admin-tele-point__head">
            <span class="admin-tele-point__factor">{{ pt.factorName }}</span>
            <span class="admin-tele-point__code">{{ pt.factorCode }}</span>
          </div>
          <div class="admin-tele-point__latest">
            <span class="admin-tele-point__value tabular-nums"
              :class="latestValueClass(pt)">
              {{ pt.latestValue !== null ? pt.latestValue.toFixed(2) : '--' }}
            </span>
            <span class="admin-tele-point__unit">{{ pt.unit }}</span>
            <span class="admin-tele-point__ts tabular-nums">{{ pt.latestTs ?? '--' }}</span>
          </div>
          <div class="admin-tele-point__thresholds tabular-nums">
            橙色阈值: {{ pt.limitH ?? '--' }} · 红色阈值: {{ pt.limitHh ?? '--' }}
          </div>
          <!-- 最近10条 -->
          <div v-if="pt.recent10.length > 0" class="admin-tele-recent">
            <span
              v-for="(r, i) in pt.recent10"
              :key="i"
              class="admin-tele-recent__dot"
              :title="`${r.ts}: ${r.value}`"
              :class="recentDotClass(pt, r.value)"
            >{{ r.value !== null ? r.value.toFixed(1) : '--' }}</span>
          </div>
        </div>
      </div>
    </div>

    <!-- ④ 全局概览区（zone:overview）-->
    <div class="pc-card admin-card" data-zone="overview">
      <div class="admin-card__header">
        <span class="admin-card__title">🏚 全部建筑风险概览</span>
      </div>
      <div class="admin-overview-list">
        <div
          v-for="b in buildingList"
          :key="b.id"
          class="admin-overview-item"
          :class="{ 'admin-overview-item--active': selectedBuildingId === b.id }"
          @click="selectBuilding(b.id)"
        >
          <span class="risk-dot" :class="riskDotClass(b.latestRiskLevel)" />
          <span class="admin-overview-item__name">{{ b.name }}</span>
          <span class="admin-overview-item__code tabular-nums">{{ b.spaceCode }}</span>
          <span class="badge" :class="riskBadgeClass(b.latestRiskLevel)">
            {{ b.latestRiskLevel ?? 'GREEN' }}
          </span>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from "vue"
import { getAnalysisResult, calculateBuildingRisk, type AnalysisMetricResult } from "@/services/analysisService"
import { listBuildings, type BuildingListItem } from "@/services/buildingService"
import { getBuildingIotSummary, type BuildingIotSummary } from "@/services/iotDemoService"

// ── 建筑列表 ──────────────────────────────────────────────────────────────────

const buildingList = ref([] as BuildingListItem[])

// ── 选择状态 ──────────────────────────────────────────────────────────────────

const selectedBuildingId = ref(null as number | null)

// ── IoT 遥测汇总 ──────────────────────────────────────────────────────────────

const iotSummary = ref(null as BuildingIotSummary | null)

function loadIotSummary() {
  if (!selectedBuildingId.value) { iotSummary.value = null; return }
  iotSummary.value = getBuildingIotSummary(selectedBuildingId.value)
}

type PointSummary = BuildingIotSummary["points"][number]

function latestValueClass(pt: PointSummary): string {
  const v = pt.latestValue
  if (v === null) return ""
  if (pt.limitHh !== null && v >= pt.limitHh) return "text-danger"
  if (pt.limitH  !== null && v >= pt.limitH)  return "text-warning"
  return "text-success"
}

function recentDotClass(pt: PointSummary, v: number | null): string {
  if (v === null) return "dot-gray"
  if (pt.limitHh !== null && v >= pt.limitHh) return "dot-red"
  if (pt.limitH  !== null && v >= pt.limitH)  return "dot-orange"
  return "dot-green"
}

// ── 分析结果 ──────────────────────────────────────────────────────────────────

const metrics     = ref([] as AnalysisMetricResult[])
const calcLoading = ref(false)
const msg         = ref("")
const msgClass    = ref("admin-msg--success")

// ── 辅助函数 ──────────────────────────────────────────────────────────────────

function metricName(metricId: number): string {
  const names: Record<number, string> = {
    1: "裂缝指标",
    2: "倾角指标",
    3: "综合评分",
  }
  return names[metricId] ?? `指标 ${metricId}`
}

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

// ── 事件处理 ──────────────────────────────────────────────────────────────────

function selectBuilding(id: number) {
  selectedBuildingId.value = id
  loadAnalysis()
  loadIotSummary()
}

function loadAnalysis() {
  if (!selectedBuildingId.value) return
  const result = getAnalysisResult(selectedBuildingId.value)
  if (result.ok) {
    metrics.value = result.metrics
    if (result.metrics.length === 0) {
      // 自动触发一次计算，让 IoT 触发后的数据直接可见
      const calc = calculateBuildingRisk(selectedBuildingId.value)
      if (calc.ok && calc.metrics.length > 0) {
        metrics.value = calc.metrics.map((m) => ({
          metricId:      m.metricId,
          latestValue:   m.valueNum,
          riskLevel:     m.riskLevel,
          calcTime:      calc.calcTime,
          thresholds:    {},
          riskLevelDesc: {},
          factorCode:    "",
          unit:          "",
        }))
        msg.value   = `ℹ️ 该建筑尚无历史分析，已自动计算最新风险。请点“重新计算风险”查看完整结果。`
        msgClass.value = "admin-msg--info"
        // 正式重新读取完整结果
        const result2 = getAnalysisResult(selectedBuildingId.value)
        if (result2.ok) metrics.value = result2.metrics
      } else {
        msg.value   = "ℹ️ 该建筑尚无遥测数据，请先在演示控制台触发 IoT 模拟。"
        msgClass.value = "admin-msg--info"
      }
    }
  } else {
    msg.value   = `❌ 查询失败：${result.error}`
    msgClass.value = "admin-msg--error"
  }
  loadIotSummary()
}

function doCalculate() {
  if (!selectedBuildingId.value) return
  calcLoading.value = true
  msg.value = ""

  const result = calculateBuildingRisk(selectedBuildingId.value)
  calcLoading.value = false

  if (result.ok) {
    msg.value   = `✅ 计算完成，已更新 ${result.metrics.length} 个指标，计算时间：${result.calcTime}`
    msgClass.value = "admin-msg--success"
    // 刷新展示
    loadAnalysis()
    // 刷新建筑列表（风险等级可能更新）
    buildingList.value = listBuildings()
  } else {
    msg.value   = `❌ 计算失败：${result.error}`
    msgClass.value = "admin-msg--error"
  }
}

// ── 数据加载 ──────────────────────────────────────────────────────────────────

onMounted(() => {
  buildingList.value = listBuildings()
})
</script>

<style scoped>
/* ===== 根容器 ===== */
.admin-analysis {
  padding: 20px 24px;
  display: flex;
  flex-direction: column;
  gap: 16px;
  min-height: 100%;
  background: var(--pc-bg-page, #F0F4F9);
}

/* 页面标题 */
.admin-page-header {
  display: flex;
  align-items: baseline;
  gap: 12px;
  padding-bottom: 12px;
  border-bottom: 2px solid transparent;
  background-image: linear-gradient(to right, var(--pc-primary, #1B6FE8), transparent 60%);
  background-position: bottom;
  background-size: 100% 2px;
  background-repeat: no-repeat;
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

/* ===== pc-card / admin-card ===== */
.pc-card {
  background: var(--pc-bg-card, #fff);
  border: 1px solid var(--pc-border, #E2E8F0);
  border-radius: var(--radius-lg, 12px);
  box-shadow: var(--pc-shadow-sm, 0 1px 3px rgba(0,0,0,0.08));
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
.admin-card__subtitle {
  font-size: 12px;
  color: var(--pc-text-muted, #94A3B8);
}

/* ===== 选择区 ===== */
.admin-analysis-select {
  display: flex;
  align-items: flex-end;
  gap: 16px;
  padding: 16px 20px;
  flex-wrap: wrap;
}
.admin-form-group {
  display: flex;
  flex-direction: column;
  gap: 4px;
}
.admin-form-label {
  font-size: 11px;
  font-weight: 600;
  color: var(--pc-text-muted, #64748B);
  text-transform: uppercase;
  letter-spacing: 0.5px;
}
.select-pc {
  height: 36px;
  padding: 0 12px;
  border: 1px solid var(--pc-border, #E2E8F0);
  border-radius: var(--radius-md, 8px);
  font-size: 14px;
  background: #fff;
  color: var(--pc-text-body, #374151);
  outline: none;
  min-width: 240px;
  cursor: pointer;
  transition: border-color 150ms ease;
}
.select-pc:focus { border-color: var(--pc-primary, #1B6FE8); box-shadow: 0 0 0 3px rgba(27,111,232,0.08); }

/* ===== 按钮 ===== */
.btn-pc-primary {
  height: 36px;
  padding: 0 20px;
  background: var(--pc-primary, #1B6FE8);
  color: #fff;
  border: none;
  border-radius: var(--radius-md, 8px);
  font-size: 14px;
  font-weight: 500;
  cursor: pointer;
  transition: background 150ms ease, opacity 150ms ease;
  white-space: nowrap;
  align-self: flex-end;
}
.btn-pc-primary:hover:not(:disabled) { background: #1559c7; }
.btn-pc-primary:disabled { opacity: 0.45; cursor: not-allowed; }

.btn-pc-secondary {
  height: 36px;
  padding: 0 20px;
  background: #fff;
  color: var(--pc-primary, #1B6FE8);
  border: 1px solid var(--pc-primary, #1B6FE8);
  border-radius: var(--radius-md, 8px);
  font-size: 14px;
  font-weight: 500;
  cursor: pointer;
  transition: all 150ms ease;
  white-space: nowrap;
  align-self: flex-end;
}
.btn-pc-secondary:hover:not(:disabled) { background: rgba(27,111,232,0.05); }
.btn-pc-secondary:disabled { opacity: 0.45; cursor: not-allowed; }

/* ===== 操作反馈 ===== */
.admin-msg {
  padding: 8px 12px;
  border-radius: var(--radius-md, 8px);
  font-size: 13px;
  align-self: flex-end;
  max-width: 400px;
}
.admin-msg--success { background: #D1FAE5; color: #10B981; }
.admin-msg--error   { background: #FEE2E2; color: #EF4444; }
.admin-msg--info    { background: #EDE9FE; color: #8B5CF6; }

/* ===== 分析结果指标卡 ===== */
.admin-metrics-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(240px, 1fr));
  gap: 16px;
  padding: 20px;
}
.admin-metric-card {
  border: 1px solid var(--pc-border, #E2E8F0);
  border-radius: var(--radius-md, 8px);
  padding: 16px;
  display: flex;
  flex-direction: column;
  gap: 10px;
  background: var(--pc-bg-card, #fff);
  transition: box-shadow 150ms ease;
}
.admin-metric-card:hover { box-shadow: var(--pc-shadow-md, 0 4px 12px rgba(0,0,0,0.08)); }
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
  font-size: 14px;
  font-weight: 600;
  color: var(--pc-text-h1, #1C2B4A);
  flex: 1;
}
.admin-metric-card__value {
  font-size: 28px;
  font-weight: 700;
  color: var(--pc-text-h1, #1C2B4A);
  display: flex;
  align-items: baseline;
  gap: 4px;
  font-variant-numeric: tabular-nums;
}
.admin-metric-card__unit { font-size: 14px; color: var(--pc-text-muted, #94A3B8); font-weight: 400; }
.admin-metric-card__time { font-size: 11px; color: var(--pc-text-muted, #94A3B8); }
.admin-metric-card__thresholds {
  display: flex;
  flex-wrap: wrap;
  gap: 4px;
}
.admin-threshold-tag {
  display: inline-flex;
  align-items: center;
  padding: 1px 6px;
  border-radius: var(--radius-full, 9999px);
  font-size: 10px;
  font-weight: 600;
  background: var(--pc-bg-page, #F0F4F9);
  color: var(--pc-text-muted, #64748B);
  border: 1px solid var(--pc-border, #E2E8F0);
}

/* ===== 空状态 ===== */
.admin-empty { color: var(--pc-text-muted, #94A3B8); font-size: 13px; }
.admin-empty--center {
  padding: 40px 20px;
  text-align: center;
  display: flex;
  justify-content: center;
  align-items: center;
}

/* ===== 全局概览列表 ===== */
.admin-overview-list {
  display: flex;
  flex-direction: column;
  max-height: 360px;
  overflow-y: auto;
}
.admin-overview-item {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 10px 20px;
  cursor: pointer;
  border-bottom: 1px solid var(--pc-border, #F1F5F9);
  transition: background 150ms ease;
}
.admin-overview-item:last-child { border-bottom: none; }
.admin-overview-item:hover { background: rgba(27,111,232,0.04); }
.admin-overview-item--active { background: rgba(27,111,232,0.08); }
.admin-overview-item__name {
  flex: 1;
  font-size: 14px;
  font-weight: 500;
  color: var(--pc-text-body, #374151);
}
.admin-overview-item__code {
  font-size: 12px;
  color: var(--pc-text-muted, #64748B);
}

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

/* ===== IoT 遥测区 ===== */
.admin-telemetry-points {
  display: flex;
  flex-wrap: wrap;
  gap: 14px;
  padding: 16px 20px;
}
.admin-tele-point {
  flex: 1;
  min-width: 200px;
  max-width: 280px;
  border: 1px solid var(--pc-border, #E2E8F0);
  border-radius: var(--radius-md, 8px);
  padding: 12px;
  background: var(--pc-bg-page, #F8FAFC);
}
.admin-tele-point__head {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 6px;
}
.admin-tele-point__factor {
  font-size: 13px;
  font-weight: 600;
  color: var(--pc-text-h1, #1C2B4A);
}
.admin-tele-point__code {
  font-size: 11px;
  padding: 1px 6px;
  background: rgba(27,111,232,0.08);
  color: var(--pc-primary, #1B6FE8);
  border-radius: 4px;
}
.admin-tele-point__latest {
  display: flex;
  align-items: baseline;
  gap: 4px;
  margin-bottom: 4px;
}
.admin-tele-point__value {
  font-size: 24px;
  font-weight: 700;
}
.admin-tele-point__unit {
  font-size: 13px;
  color: var(--pc-text-muted, #64748B);
}
.admin-tele-point__ts {
  font-size: 11px;
  color: var(--pc-text-muted, #94A3B8);
  margin-left: auto;
}
.admin-tele-point__thresholds {
  font-size: 11px;
  color: var(--pc-text-muted, #94A3B8);
  margin-bottom: 8px;
}
.admin-tele-recent {
  display: flex;
  flex-wrap: wrap;
  gap: 4px;
}
.admin-tele-recent__dot {
  display: inline-block;
  padding: 2px 5px;
  border-radius: 4px;
  font-size: 10px;
  font-family: var(--font-mono, monospace);
  font-weight: 500;
}
.dot-green  { background: #D1FAE5; color: #059669; }
.dot-orange { background: #FEF3C7; color: #D97706; }
.dot-red    { background: #FEE2E2; color: #DC2626; }
.dot-gray   { background: #F1F5F9; color: #94A3B8; }
.text-success { color: #059669; }
.text-warning { color: #D97706; }
.text-danger  { color: #DC2626; }
</style>

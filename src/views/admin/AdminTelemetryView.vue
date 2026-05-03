<template>
  <!--
    T15.90 管理端采集数据页 /admin/telemetry
    ─────────────────────────────────────────────────────────────
    低保真线框（Wireframe）IoT 采集数据：
    ┌─── 页面标题：实时采集数据 ─────────────────────────────────┐
    │  采集数据管理 · 可查看历史采集值 / 新增模拟采集数据        │
    ├─── zone:filter（筛选工具栏）──────────────────────────────│
    │  [选择建筑 ▼]  [选择数据点 ▼]  [最近 N 条：100]  [查询]   │
    ├─── zone:list（采集值列表）────────────────────────────────│
    │  时间戳 | 数据点 | 采集值 | 单位                          │
    │  2024-01-01 10:00:00 | 裂缝 | 1.2 | mm                   │
    ├─── zone:add（新增采集区）─────────────────────────────────│
    │  [数据点 ▼]  [采集值]  [时间戳（可选）]  [提交新增采集]   │
    │  ✓ 添加成功，已写入 iot_telemetry                         │
    └────────────────────────────────────────────────────────────┘

    数据来源：
    - telemetryService.listTelemetry(query)
    - telemetryService.addTelemetry(params)
    - getTable("iot_data_point") 获取数据点列表
    - getTable("iot_space") 获取建筑列表
  -->

  <div class="admin-telemetry" style="background:var(--pc-bg-page,#F0F4F9)">
    <!-- 页面标题 -->
    <div class="admin-page-header">
      <h2 class="admin-page-title">📡 实时采集数据</h2>
      <span class="admin-page-subtitle">IoT 采集数据管理 · 可查看历史采集值并新增模拟采集数据</span>
    </div>

    <!-- ① 筛选工具栏（zone:filter）-->
    <div class="pc-card admin-card admin-telemetry-filter" data-zone="filter">
      <!-- 建筑选择 -->
      <div class="admin-form-group">
        <label class="admin-form-label">选择建筑</label>
        <select v-model="selectedBuildingId" class="select-pc">
          <option :value="null">— 全部建筑 —</option>
          <option v-for="b in buildingOptions" :key="b.id" :value="b.id">
            {{ b.name }}（{{ b.spaceCode }}）
          </option>
        </select>
      </div>

      <!-- 数据点选择 -->
      <div class="admin-form-group">
        <label class="admin-form-label">数据点</label>
        <select v-model="selectedPointId" class="select-pc">
          <option :value="null">-- 请选择数据点 --</option>
          <option v-for="p in filteredPoints" :key="p.id" :value="p.id">
            {{ p.factor_name ?? p.factor_code ?? `数据点` }} (id={{ p.id }})
          </option>
        </select>
      </div>

      <!-- 最近 N 条 -->
      <div class="admin-form-group">
        <label class="admin-form-label">最近条数</label>
        <input v-model.number="limit" type="number" class="input-pc" min="1" max="500" placeholder="100" style="width:80px" />
      </div>

      <!-- 查询按钮 -->
      <button class="btn-pc-primary" :disabled="!selectedPointId" @click="loadData">
        查询
      </button>
    </div>

    <!-- ② 采集值列表区（zone:list）-->
    <div class="pc-card admin-card" data-zone="list">
      <div class="admin-card__header">
        <span class="admin-card__title">📋 采集值列表</span>
        <span class="admin-card__count tabular-nums">{{ rows.length }} 条</span>
      </div>

      <div v-if="rows.length === 0" class="admin-empty admin-empty--inline">
        暂无采集数据，请先在演示控制台触发 IoT 模拟
      </div>

      <table v-else class="admin-table">
        <thead>
          <tr>
            <th>采集时间</th>
            <th>建筑</th>
            <th>因子</th>
            <th>采集值</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="(row, idx) in rows" :key="idx">
            <td class="tabular-nums">{{ row.ts }}</td>
            <td class="tabular-nums">{{ pointBuildingLabel(row.pointId) }}</td>
            <td>{{ pointFactorLabel(row.pointId) }}</td>
            <td class="tabular-nums">{{ row.valueNum ?? row.valueStr ?? '—' }}</td>
          </tr>
        </tbody>
      </table>
    </div>

    <!-- ③ 新增采集区（zone:add）-->
    <div class="pc-card admin-card" data-zone="add">
      <div class="admin-card__header">
        <span class="admin-card__title">➕ 模拟采集 — 新增采集数据</span>
      </div>
      <div class="admin-add-form">
        <!-- 数据点 -->
        <div class="admin-form-group">
          <label class="admin-form-label">数据点 ID</label>
          <select v-model="newPointId" class="select-pc">
            <option :value="null">-- 选择数据点 --</option>
            <option v-for="p in dataPoints" :key="p.id" :value="p.id">
              {{ p.factor_name ?? p.factor_code ?? `数据点` }} (id={{ p.id }})
            </option>
          </select>
        </div>

        <!-- 新采集值 -->
        <div class="admin-form-group">
          <label class="admin-form-label">新增采集值</label>
          <input
            v-model.number="newValue"
            type="number"
            class="input-pc"
            placeholder="输入数值，如 2.3"
            step="0.01"
            style="width:180px"
          />
        </div>

        <!-- 提交按钮 -->
        <button
          class="btn-pc-primary"
          :disabled="!newPointId || newValue === null"
          @click="doAdd"
        >
          提交新增采集
        </button>

        <!-- 操作反馈 -->
        <div v-if="msg" class="admin-msg" :class="msgClass">{{ msg }}</div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, watch } from "vue"
import { listTelemetry, addTelemetry, type TelemetryRow } from "@/services/telemetryService"
import { getTable } from "@/services/sqliteMirrorRepository"

// ── 数据点与建筑 ──────────────────────────────────────────────────────────────

const dataPoints = ref([] as Array<{ id: number; space_id: number; factor_id: number; factor_code: string | null; factor_name: string | null; limit_h: number | null; limit_hh: number | null }>)
const buildingOptions = ref([] as Array<{ id: number; name: string; spaceCode: string }>)

// ── 筛选状态 ──────────────────────────────────────────────────────────────────

const selectedBuildingId = ref(null as number | null)
const selectedPointId    = ref(null as number | null)
const limit              = ref(100)

// ── 采集值列表 ─────────────────────────────────────────────────────────────────

const rows = ref([] as TelemetryRow[])

// ── 新增状态 ──────────────────────────────────────────────────────────────────

const newPointId = ref(null as number | null)
const newValue   = ref(null as number | null)
const msg        = ref("")
const msgClass   = ref("admin-msg--success")

// ── 计算属性：按建筑筛选的数据点 ──────────────────────────────────────────────

const filteredPoints = computed(() => {
  if (!selectedBuildingId.value) return dataPoints.value
  return dataPoints.value.filter((p) => p.space_id === selectedBuildingId.value)
})

/** 根据 pointId 返回所属建筑编号（如 B003） */
function pointBuildingLabel(pointId: number): string {
  const dp = dataPoints.value.find((p) => p.id === pointId)
  if (!dp) return `pt${pointId}`
  const b = buildingOptions.value.find((b) => b.id === dp.space_id)
  return b ? b.spaceCode : `空间${dp.space_id}`
}

/** 根据 pointId 返回因子名称（如 裂缝宽度） */
function pointFactorLabel(pointId: number): string {
  const dp = dataPoints.value.find((p) => p.id === pointId)
  return dp?.factor_name ?? dp?.factor_code ?? `点${pointId}`
}

// ── 事件处理 ──────────────────────────────────────────────────────────────────

function onBuildingChange() {
  // watch(selectedBuildingId) handles auto-load
  selectedPointId.value = null
}

function loadData() {
  if (!selectedPointId.value) return
  rows.value = listTelemetry({
    pointId:    selectedPointId.value,
    buildingId: selectedBuildingId.value ?? undefined,
    limit:      limit.value > 0 ? limit.value : undefined,
  })
}

function doAdd() {
  if (!newPointId.value || newValue.value === null) return
  const result = addTelemetry({ pointId: newPointId.value, valueNum: newValue.value })
  if (result.ok) {
    msg.value   = `✅ 添加成功，时间戳：${result.ts}，已写入 iot_telemetry`
    msgClass.value = "admin-msg--success"
    // 如果当前列表显示的是同一数据点，刷新列表
    if (selectedPointId.value === newPointId.value) {
      loadData()
    }
  } else {
    msg.value   = `❌ 操作失败：${result.error}`
    msgClass.value = "admin-msg--error"
  }
}

// ── 数据加载 ──────────────────────────────────────────────────────────────────

function reloadMeta() {
  // 加载因子类型字典（用于显示名称）
  const factorTypes = getTable("iot_factor_type") as Array<{
    id: number
    factor_code: string
    factor_name: string
    unit: string
  }>
  const ftMap = new Map(factorTypes.map((f) => [f.id, f]))

  // 加载数据点，关联因子名称
  const rawPoints = getTable("iot_data_point") as Array<{
    id: number
    space_id: number
    factor_id: number
    limit_h: number | null
    limit_hh: number | null
  }>
  dataPoints.value = rawPoints.map((p) => ({
    ...p,
    factor_code: ftMap.get(p.factor_id)?.factor_code ?? null,
    factor_name: ftMap.get(p.factor_id)?.factor_name ?? null,
  }))

  // 加载建筑列表（type="2"）
  const spaces = getTable("iot_space") as Array<{
    id: number
    type: string
    name: string
    space_code: string
  }>
  buildingOptions.value = spaces
    .filter((s) => s.type === "2")
    .map((s) => ({ id: s.id, name: s.name, spaceCode: s.space_code }))
}

onMounted(() => {
  reloadMeta()
  loadRows()   // 页面加载时立即显示最近数据
})

/**
 * 统一加载行数据：
 *   - buildingId=null → 全部建筑最近 100 条
 *   - buildingId=xxx  → 该建筑所有数据点最近 50 条
 */
function loadRows(buildingId: number | null = selectedBuildingId.value) {
  const telemetry = getTable("iot_telemetry") as Array<{
    ts: string; point_id: number; value_num: number | null; value_str: string | null
  }>

  if (!buildingId) {
    // 全部建筑：取最近 100 条
    rows.value = telemetry
      .sort((a, b) => (a.ts > b.ts ? -1 : 1))
      .slice(0, 100)
      .map((r) => ({ ts: r.ts, pointId: r.point_id, valueNum: r.value_num, valueStr: r.value_str }))
  } else {
    // 指定建筑：取该建筑所有数据点
    const pts = dataPoints.value.filter((p) => p.space_id === buildingId).map((p) => p.id)
    rows.value = telemetry
      .filter((r) => pts.includes(r.point_id))
      .sort((a, b) => (a.ts > b.ts ? -1 : 1))
      .slice(0, 50)
      .map((r) => ({ ts: r.ts, pointId: r.point_id, valueNum: r.value_num, valueStr: r.value_str }))
  }
}

// 监听 selectedPointId 变化时走精确查询
watch(selectedPointId, (val) => {
  if (val) loadData()
  else loadRows()
})

// 选建筑后自动加载该建筑遥测
watch(selectedBuildingId, (buildingId) => {
  selectedPointId.value = null
  loadRows(buildingId ?? null)
})
</script>

<style scoped>
/* ===== 根容器 ===== */
.admin-telemetry {
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
.admin-card__count {
  font-size: 12px;
  color: var(--pc-text-muted, #94A3B8);
}

/* ===== 筛选工具栏 ===== */
.admin-telemetry-filter {
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

/* ===== 表单元素 ===== */
.select-pc,
.input-pc {
  height: 36px;
  padding: 0 12px;
  border: 1px solid var(--pc-border, #E2E8F0);
  border-radius: var(--radius-md, 8px);
  font-size: 14px;
  background: #fff;
  color: var(--pc-text-body, #374151);
  outline: none;
  transition: border-color 150ms ease;
}
.select-pc { padding-right: 28px; cursor: pointer; min-width: 200px; }
.select-pc:focus,
.input-pc:focus {
  border-color: var(--pc-primary, #1B6FE8);
  box-shadow: 0 0 0 3px rgba(27,111,232,0.08);
}

/* ===== 新增表单 ===== */
.admin-add-form {
  display: flex;
  align-items: flex-end;
  gap: 16px;
  padding: 16px 20px;
  flex-wrap: wrap;
}

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

/* ===== 操作反馈 ===== */
.admin-msg {
  padding: 8px 12px;
  border-radius: var(--radius-md, 8px);
  font-size: 13px;
  align-self: flex-end;
}
.admin-msg--success { background: #D1FAE5; color: #10B981; }
.admin-msg--error   { background: #FEE2E2; color: #EF4444; }

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

/* ===== 空状态 ===== */
.admin-empty { display: flex; align-items: center; gap: 8px; color: var(--pc-text-muted, #94A3B8); }
.admin-empty--inline { padding: 20px; font-size: 13px; }
</style>

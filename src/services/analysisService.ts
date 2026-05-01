/**
 * analysisService — 单建筑风险计算服务
 *
 * 依赖表：
 *   - iot_space              (id, type, ...)
 *   - space_analysis_config  (id, space_id, metric_id, is_enabled, input_source_json, params_json, risk_level_json)
 *   - iot_telemetry          (ts, point_id, value_num, value_str)
 *   - iot_data_point         (id, limit_hh, ...)
 *   - space_analysis_archive (id, space_id, metric_id, calc_time, value_num, risk_level, ...)
 */

import { getTable, setTable } from "./sqliteMirrorRepository"

// ── 类型 ──────────────────────────────────────────────────────────────────────

export interface MetricCalcResult {
  metricId: number
  valueNum: number
  riskLevel: string   // "GREEN" | "YELLOW" | "ORANGE" | "RED"
}

export type CalcBuildingRiskResult =
  | { ok: true;  buildingId: number; calcTime: string; metrics: MetricCalcResult[] }
  | { ok: false; buildingId: number; error: string }

// ── 内部辅助 ──────────────────────────────────────────────────────────────────

/**
 * 将值映射到风险等级。
 * risk_level_json 结构：{ green: { min, max }, yellow: { min, max }, ... }
 * max=null 表示无上界。
 * 优先级：red > orange > yellow > green（从最高风险向下匹配第一个满足的）
 */
function mapRiskLevel(
  value: number,
  riskLevelJson: string
): string {
  const config = JSON.parse(riskLevelJson) as Record<string, { min: number; max: number | null }>
  // 按 red → orange → yellow → green 顺序匹配（避免区间重叠歧义）
  const ORDER = ["red", "orange", "yellow", "green"]
  for (const levelKey of ORDER) {
    const range = config[levelKey]
    if (!range) continue
    const aboveMin = value >= range.min
    const belowMax = range.max === null || value < range.max
    if (aboveMin && belowMax) return levelKey.toUpperCase()
  }
  return "RED"
}

/**
 * 获取指定数据点的最新采集值（按 ts 降序取第一条）。
 * 若无数据返回 null。
 */
function getLatestValue(
  pointId: number,
  telemetry: Array<{ ts: string; point_id: number; value_num: number | null }>
): number | null {
  const rows = telemetry.filter((r) => r.point_id === pointId)
  if (rows.length === 0) return null
  const latest = rows.reduce((a, b) => (a.ts >= b.ts ? a : b))
  return latest.value_num
}

/**
 * 计算综合评分（metric_id=3）。
 *
 * 思路：
 *   1. 取 point_ids 数组中各点的最新值
 *   2. 从 iot_data_point 读取各点 limit_hh 作为归一化基准
 *      score_factor = min(value / limit_hh * 100, 100)
 *   3. 从 params_json 读取权重 w_crack / w_tilt / w_settle
 *   4. S = w_crack*score[0] + w_tilt*score[1] + w_settle*score[2]
 */
function calcCompositeScore(
  pointIds: number[],
  paramsJson: string,
  telemetry: Array<{ ts: string; point_id: number; value_num: number | null }>,
  dataPoints: Array<{ id: number; limit_hh: number | null }>
): number {
  const params = JSON.parse(paramsJson) as {
    w_crack: number
    w_tilt: number
    w_settle: number
  }
  const weights = [params.w_crack, params.w_tilt, params.w_settle]

  let score = 0
  for (let i = 0; i < Math.min(pointIds.length, weights.length); i++) {
    const pid = pointIds[i]
    const value = getLatestValue(pid, telemetry) ?? 0
    const dp = dataPoints.find((d) => d.id === pid)
    const limitHh = dp?.limit_hh ?? 1
    const normalized = Math.min((value / limitHh) * 100, 100)
    score += weights[i] * normalized
  }
  return Math.round(score * 100) / 100
}

// ── 主函数 ────────────────────────────────────────────────────────────────────

/**
 * 对单栋建筑执行风险计算，写入 space_analysis_archive，返回计算结果。
 *
 * @param buildingId  iot_space.id（type="2" 的建筑节点）
 * @param calcTime    可选：指定计算时间戳；不传时使用当前时间
 */
export function calculateBuildingRisk(
  buildingId: number,
  calcTime?: string
): CalcBuildingRiskResult {
  const ts = calcTime ?? new Date().toISOString().replace("T", " ").substring(0, 19)

  // ── 1. 验证建筑存在 ───────────────────────────────────────────────────────
  const spaces = getTable<{ id: number; type: string }>("iot_space")
  const building = spaces.find((s) => s.id === buildingId && s.type === "2")
  if (!building) {
    return { ok: false, buildingId, error: `iot_space 中不存在 id=${buildingId} 且 type="2" 的建筑` }
  }

  // ── 2. 读取该建筑的分析配置（启用的） ────────────────────────────────────
  const configs = getTable<{
    space_id: number
    metric_id: number
    is_enabled: number
    input_source_json: string
    params_json: string
    risk_level_json: string
  }>("space_analysis_config").filter(
    (c) => c.space_id === buildingId && c.is_enabled === 1
  )

  if (configs.length === 0) {
    return { ok: true, buildingId, calcTime: ts, metrics: [] }
  }

  // ── 3. 预加载遥测数据 & 数据点 ────────────────────────────────────────────
  const telemetry = getTable<{ ts: string; point_id: number; value_num: number | null }>(
    "iot_telemetry"
  )
  const dataPoints = getTable<{ id: number; limit_hh: number | null }>("iot_data_point")

  // ── 4. 读取现有 archive（用于计算新 id） ─────────────────────────────────
  const existingArchive = getTable<{ id: number }>("space_analysis_archive")
  let nextId = existingArchive.reduce((max, r) => Math.max(max, r.id), 0) + 1

  // ── 5. 逐指标计算 ─────────────────────────────────────────────────────────
  const metrics: MetricCalcResult[] = []
  const newArchiveRows: Array<{
    id: number
    space_id: number
    metric_id: number
    calc_time: string
    value_num: number
    risk_level: string
    status_code: number | null
    source_data_ids: string | null
    create_time: string
  }> = []

  for (const cfg of configs) {
    const inputSrc = JSON.parse(cfg.input_source_json) as { point_ids: number[] }
    const pointIds = inputSrc.point_ids ?? []

    let valueNum: number
    let riskLevel: string

    if (cfg.metric_id === 3) {
      // 综合评分：加权归一化计算
      valueNum = calcCompositeScore(pointIds, cfg.params_json, telemetry, dataPoints)
      riskLevel = mapRiskLevel(valueNum, cfg.risk_level_json)
    } else {
      // 单点阈值比较（metric_id=1 裂缝，metric_id=2 倾角）
      const pid = pointIds[0]
      valueNum = getLatestValue(pid, telemetry) ?? 0
      riskLevel = mapRiskLevel(valueNum, cfg.risk_level_json)
    }

    metrics.push({ metricId: cfg.metric_id, valueNum, riskLevel })
    newArchiveRows.push({
      id:              nextId++,
      space_id:        buildingId,
      metric_id:       cfg.metric_id,
      calc_time:       ts,
      value_num:       valueNum,
      risk_level:      riskLevel,
      status_code:     null,
      source_data_ids: JSON.stringify(pointIds),
      create_time:     ts,
    })
  }

  // ── 6. 写入 space_analysis_archive ───────────────────────────────────────
  setTable("space_analysis_archive", [...existingArchive, ...newArchiveRows])

  return { ok: true, buildingId, calcTime: ts, metrics }
}

// ── getAnalysisResult ─────────────────────────────────────────────────────────

export interface AnalysisMetricResult {
  metricId:      number
  latestValue:   number
  riskLevel:     string
  calcTime:      string
  /** 阈值参数（原始 params_json 解析结果） */
  thresholds:    Record<string, unknown>
  /** 风险区间描述（原始 risk_level_json 解析结果） */
  riskLevelDesc: Record<string, unknown>
  /** 因子代码（从 params_json.factor_code 读取，综合评分为 "SCORE"） */
  factorCode:    string
  /** 单位（从 params_json.unit 读取，综合评分为 ""） */
  unit:          string
}

export type GetAnalysisResultResult =
  | { ok: true;  buildingId: number; metrics: AnalysisMetricResult[] }
  | { ok: false; buildingId: number; error: string }

/**
 * 查询单建筑最新分析结果。
 *
 * 流程：
 *   1. 验证建筑存在（iot_space type="2"）
 *   2. 读取 space_analysis_config（is_enabled=1）作为 metric 基准
 *   3. 从 space_analysis_archive 按 space_id 筛选，每个 metric_id 取最新一条（calc_time 最大）
 *   4. 将 archive 结果与 config 中的 thresholds / riskLevelDesc / factorCode / unit 合并
 *   5. 返回聚合结果
 */
export function getAnalysisResult(buildingId: number): GetAnalysisResultResult {
  // ── 1. 验证建筑存在 ───────────────────────────────────────────────────────
  const spaces = getTable<{ id: number; type: string }>("iot_space")
  const building = spaces.find((s) => s.id === buildingId && s.type === "2")
  if (!building) {
    return { ok: false, buildingId, error: `iot_space 中不存在 id=${buildingId} 且 type="2" 的建筑` }
  }

  // ── 2. 读取分析配置 ───────────────────────────────────────────────────────
  const configs = getTable<{
    space_id: number
    metric_id: number
    is_enabled: number
    params_json: string
    risk_level_json: string
  }>("space_analysis_config").filter(
    (c) => c.space_id === buildingId && c.is_enabled === 1
  )

  // ── 3. 读取 archive，按 metric_id 取最新一条 ─────────────────────────────
  const archives = getTable<{
    space_id: number
    metric_id: number
    calc_time: string
    value_num: number
    risk_level: string
  }>("space_analysis_archive").filter((r) => r.space_id === buildingId)

  // 按 metric_id 聚合，取 calc_time 最大的记录
  const latestByMetric = new Map<number, { calc_time: string; value_num: number; risk_level: string }>()
  for (const rec of archives) {
    const existing = latestByMetric.get(rec.metric_id)
    if (!existing || rec.calc_time > existing.calc_time) {
      latestByMetric.set(rec.metric_id, {
        calc_time:  rec.calc_time,
        value_num:  rec.value_num,
        risk_level: rec.risk_level,
      })
    }
  }

  // ── 4. 合并结果 ───────────────────────────────────────────────────────────
  const metrics: AnalysisMetricResult[] = []
  for (const cfg of configs) {
    const latest = latestByMetric.get(cfg.metric_id)
    if (!latest) continue  // 该指标尚无计算结果，跳过

    const params = JSON.parse(cfg.params_json) as Record<string, unknown>
    metrics.push({
      metricId:      cfg.metric_id,
      latestValue:   latest.value_num,
      riskLevel:     latest.risk_level,
      calcTime:      latest.calc_time,
      thresholds:    params,
      riskLevelDesc: JSON.parse(cfg.risk_level_json) as Record<string, unknown>,
      factorCode:    typeof params.factor_code === "string" ? params.factor_code : "SCORE",
      unit:          typeof params.unit === "string" ? params.unit : "",
    })
  }

  return { ok: true, buildingId, metrics }
}

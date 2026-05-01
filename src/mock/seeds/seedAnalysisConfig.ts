/**
 * T15.31 — seedAnalysisConfig
 *
 * 为 23 栋历史建筑写入分析模板到 space_analysis_config：
 *   - metric_id=1：裂缝阈值分析
 *   - metric_id=2：倾角阈值分析
 *   - metric_id=3：综合风险评分
 *
 * 共 69 条（23 栋 × 3 模板），幂等覆盖整张表。
 */

import { setTable } from "../../services/sqliteMirrorRepository"

// ── 指标模板定义 ──────────────────────────────────────────────────────────────

interface MetricTemplate {
  metric_id: number
  metric_name: string
  calc_freq: number
  calc_freq_unit: string
  params_json: object
  risk_level_json: object
}

const METRIC_TEMPLATES: MetricTemplate[] = [
  {
    metric_id: 1,
    metric_name: "裂缝阈值分析",
    calc_freq: 10,
    calc_freq_unit: "MINUTE",
    params_json: {
      factor_code: "CRACK",
      unit: "mm",
      limit_h: 2.0,    // 黄色告警阈值
      limit_hh: 5.0,   // 红色告警阈值
      smooth_window: 3,
      trend_days: 7,
    },
    risk_level_json: {
      green:  { min: 0,   max: 1.0 },
      yellow: { min: 1.0, max: 2.0 },
      orange: { min: 2.0, max: 5.0 },
      red:    { min: 5.0, max: null },
    },
  },
  {
    metric_id: 2,
    metric_name: "倾角阈值分析",
    calc_freq: 10,
    calc_freq_unit: "MINUTE",
    params_json: {
      factor_code: "TILT",
      unit: "°",
      limit_h: 1.0,    // 黄色告警阈值
      limit_hh: 3.0,   // 红色告警阈值
      smooth_window: 3,
      trend_days: 7,
    },
    risk_level_json: {
      green:  { min: 0,   max: 0.5 },
      yellow: { min: 0.5, max: 1.0 },
      orange: { min: 1.0, max: 3.0 },
      red:    { min: 3.0, max: null },
    },
  },
  {
    metric_id: 3,
    metric_name: "综合风险评分",
    calc_freq: 30,
    calc_freq_unit: "MINUTE",
    params_json: {
      formula: "S = w_crack * score_crack + w_tilt * score_tilt + w_settle * score_settle",
      w_crack: 0.4,
      w_tilt: 0.35,
      w_settle: 0.25,
      score_range: { min: 0, max: 100 },
    },
    risk_level_json: {
      green:  { min: 0,  max: 30 },
      yellow: { min: 30, max: 60 },
      orange: { min: 60, max: 80 },
      red:    { min: 80, max: 100 },
    },
  },
]

// ── 建筑 space_id 范围：1001-1023 ─────────────────────────────────────────────

const BUILDING_SPACE_IDS = Array.from({ length: 23 }, (_, i) => 1001 + i)

/** 分析配置 id 起始，避免与 buildings/regions/archives/data_points 冲突 */
const ANALYSIS_CONFIG_ID_START = 20001

export const ANALYSIS_CONFIG_ROWS = BUILDING_SPACE_IDS.flatMap((spaceId, bIdx) =>
  METRIC_TEMPLATES.map((tpl, tIdx) => ({
    id:               ANALYSIS_CONFIG_ID_START + bIdx * METRIC_TEMPLATES.length + tIdx,
    space_id:         spaceId,
    metric_id:        tpl.metric_id,
    calc_freq:        tpl.calc_freq,
    calc_freq_unit:   tpl.calc_freq_unit,
    input_source_json: JSON.stringify({ table: "iot_telemetry", space_id: spaceId, metric_id: tpl.metric_id }),
    params_json:      JSON.stringify(tpl.params_json),
    risk_level_json:  JSON.stringify(tpl.risk_level_json),
    is_enabled:       1,
    create_time:      "2024-01-01 00:00:00",
    update_time:      "2024-01-01 00:00:00",
  }))
)

// ── 入口 ─────────────────────────────────────────────────────────────────────

export function seedAnalysisConfig(): void {
  setTable("space_analysis_config", ANALYSIS_CONFIG_ROWS)
}
